import axios, { AxiosRequestConfig } from "axios";
import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, CompletionList, Position, Range, TextDocument } from "vscode";
import { version } from "../extension";
import { compareVersions } from "../utils/version";
import { CompletionHelper } from "./CompletionHelper";
import { CompletionParticipant } from "./CompletionParticipant";
import LRUCache = require("lru-cache");

const DEPS_PREFIX = "//DEPS ";
const MAX_RESULTS = 100;
const SEARCH_API = `https://search.maven.org/solrsearch/select?rows=${MAX_RESULTS}&wt=json&q=`;

const axiosConfig: AxiosRequestConfig<any> = {
    httpsAgent: 'jbang-vscode v' + version
};

const QUERY_CACHE = new LRUCache<string, CompletionList>({
    max: 500,
    // for use with tracking overall storage size
    maxSize: 5000,
    // how long to live in ms
    ttl: 1000 * 60 * 10,// 10 min
    sizeCalculation: (value: CompletionList, key: string) => {
        return 1
    },
    // return stale items before removing from cache?
    allowStale: false,
});

export class DependencyCompletion implements CompletionParticipant {

    applies(lineText: string, _position: Position): boolean {
        return lineText.startsWith(DEPS_PREFIX);
    }

    async provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): Promise<CompletionList | CompletionItem[]> {
        const line = document.lineAt(position);
        const lineText = line.text;
        if (!this.applies(lineText, position)) {
            return [];
        }
        const start = CompletionHelper.findStartPosition(lineText, position, DEPS_PREFIX);
        const currText = lineText.substring(start.character, position.character).trim();
        const parts = currText.split(':');

        let json: any = QUERY_CACHE.get(currText);
        if (!json) {
            switch (parts.length) {
                case 1://has groupid or searches name
                    json = await searchAll(parts[0]);
                    break;
                case 2://has groupid and artifactId
                    json = await searchArtifactId(parts[0], parts[1]);
                    break;
                case 3://has groupid, artifactId and version
                case 4://has groupid, artifactId, version and classifier
                    json = await searchVersion(parts[0], parts[1], parts[2]);
                default:
            }
            if (json) {
                try {
                    QUERY_CACHE.set(currText, json);
                } catch (e) {
                    //This shouldn't block completion, so just log the error
                    console.error(e);
                }
            }
        }
        if (!json?.docs?.length) {
            return [];
        }
        const end = CompletionHelper.findEndPosition(lineText, position);
        let result: CompletionList;
        switch (parts.length) {
            case 1://has groupid or searches name
            case 2://has groupid and artifactId
                result = toCompletionList(json, new Range(start, end));
                break;
            case 3://has groupid, artifactId and version
            case 4://has groupid, artifactId, version and classifier
                const versionStart = CompletionHelper.findVersionPosition(lineText, position);
                result = toCompletionList(json, new Range(versionStart, end), toVersionCompletionItem);
                break;
            default:
                result = new CompletionList();
        }
        return result;
    }

}

function toCompletionItem(gav: any, index: number, range: Range): CompletionItem {
    const version = gav.v ? gav.v : gav.latestVersion;
    const label = `${gav.g}:${gav.a}:${version}`;
    const insertText = label;
    return {
        label,
        kind: CompletionItemKind.Module,
        insertText,
        sortText: `${index}`,
        range
    };
}
function toVersionCompletionItem(gav: any, index: number, range: Range): CompletionItem {
    const label = gav.v;
    const sortText =  `${index}`.padStart(10, "0") ;//`${new Date().getTime() - gav.timestamp}`;
    return {
        label,
        kind: CompletionItemKind.Value,
        sortText,
        range
    };
}

async function searchAll(name: string): Promise<any> {
    const searchQuery = `${SEARCH_API}${name}*+OR+a:${name}*+OR+g:${name}*`;
    console.log(searchQuery);
    const response = await axios.get(searchQuery, axiosConfig);
    return response?.data?.response;
}

async function searchArtifactId(groupId: string, artifactId: string): Promise<any> {
    const queryString = `g:${groupId}*+AND+a:${artifactId}*`;
    const searchQuery = SEARCH_API + queryString;
    console.log(searchQuery);
    const response = await axios.get(searchQuery, axiosConfig);
    return response.data?.response;
}

async function searchVersion(groupId: string, artifactId: string, version: string): Promise<any> {
    //https://search.maven.org/solrsearch/select?q=g:com.google.inject+AND+a:guice&core=gav&rows=20&wt=json
    let searchQuery = `${SEARCH_API}g:${groupId}+AND+a:${artifactId}`;
    if (version) {
        searchQuery += `+AND+v:${version}*`;
    }
    searchQuery += '&core=gav';
    console.log(searchQuery);
    const response = (await axios.get(searchQuery, axiosConfig))?.data?.response;
    // Apparently there's no way to ask solrsearch to return versions sorted by version desc, 
    // so we do it manually
    if (response?.docs) { //Sort by decreasing version
        const sortedVersions = response.docs.sort(compareArtifactVersions);
        response.docs = sortedVersions;
    }
    return response;
}

function toCompletionList(response: any, range: Range, mapper: ((gav: any, index: number, range: Range) => CompletionItem) = toCompletionItem): CompletionList {
    const result = new CompletionList();
    const items = [];
    for (let index = 0; index < response?.docs?.length; index++) {
        const gav = response?.docs[index];
        items.push(mapper(gav, index, range));
    }
    result.items = items;
    const numFound = (response.numFound !== undefined) ? response.numFound : 0;
    result.isIncomplete = numFound > result.items.length;
    return result;
}

const compareArtifactVersions = (a: any, b: any) => {
    return compareVersions(b.v, a.v);
};