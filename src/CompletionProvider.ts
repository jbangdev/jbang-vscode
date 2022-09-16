import axios from "axios";
import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, CompletionList, ExtensionContext, languages, Position, Range, TextDocument } from "vscode";
import { isJBangFile } from "./JBangUtils";
import LRUCache = require("lru-cache");

const DEPS_PREFIX = "//DEPS ";
const MAX_RESULTS = 100;
const SEARCH_API = `https://search.maven.org/solrsearch/select?rows=${MAX_RESULTS}&wt=json&q=`;

export class CompletionProvider {

    async provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): Promise<CompletionList|CompletionItem[]> {
        const text = document.getText();
        if (!isJBangFile(text)) {
            return [];
        }
        const line = document.lineAt(position);
        const lineText = line.text;
        if (!lineText.startsWith(DEPS_PREFIX)) {
            return [];
        }
        const [currText, start]= findCurrentWord(lineText, position);
        const parts = currText.split(':');
        
        let json:any = QUERY_CACHE.get(currText);
        if (!json) {
            switch(parts.length) {
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
                } catch(e) {
                    //This shouldn't block completion, so just log the error
                    console.error(e);
                }
            }
        }
        if (!json?.docs?.length) {
            return [];
        }
        const end = findEndPosition(lineText, position);
        let result:CompletionList;
        switch(parts.length) {
            case 1://has groupid or searches name
            case 2://has groupid and artifactId
                result = toCompletionList(json, new Range(start, end));
                break;
            case 3://has groupid, artifactId and version
            case 4://has groupid, artifactId, version and classifier
                const versionStart = findVersionPosition(lineText, position);
                result = toCompletionList(json, new Range(versionStart, end), toVersionCompletionItem);
                break;
            default:
                result = new CompletionList();
        }
        return result;
    }

    public initialize(context: ExtensionContext) {
        ["jbang", "java"].forEach(languageId => {
            context.subscriptions.push(
                languages.registerCompletionItemProvider(languageId, this, ":")
            );
        })
    }
    
}

export default new CompletionProvider();
var DELIMITER = new RegExp(/^[\s,]$/);

const QUERY_CACHE = new LRUCache<string, CompletionList>({
    max: 500,
    // for use with tracking overall storage size
    maxSize: 5000,
    // how long to live in ms
    ttl: 1000 * 60 * 10,// 10 min
    sizeCalculation: (value:CompletionList, key:string) => {
        return 1
    },
    // return stale items before removing from cache?
    allowStale: false,
});
  

function toCompletionItem(gav: any, index: number, range:Range): CompletionItem {
    const version = gav.v? gav.v: gav.latestVersion;
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
    const sortText = `${new Date().getTime() - gav.timestamp}`;
    return {
        label,
        kind: CompletionItemKind.Value,            
        sortText,
        range
    };
}

function isDelimiter(c: string) {
   return DELIMITER.test(c);
}

async function searchAll(name: string): Promise<any> {
    const searchQuery = `${SEARCH_API}${name}+OR+g:${name}*`;
    console.log(searchQuery);
    const response = await axios.get(searchQuery);
    return response?.data?.response;
}

async function searchArtifactId(groupId: string, artifactId: string): Promise<any> {
    const searchQuery = `${SEARCH_API}g:${groupId}*+AND+a:${artifactId}*`;
    console.log(searchQuery);
    const response = await axios.get(searchQuery);
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
    const response = await axios.get(searchQuery);
    return response.data?.response;
}

function toCompletionList(response: any, range: Range, mapper: ((gav:any, index: number, range:Range) => CompletionItem) = toCompletionItem): CompletionList {
    const result = new CompletionList();
    const items = [];
    for (let index = 0; index < response?.docs?.length; index++) {
        const gav = response?.docs[index];
        items.push ( mapper(gav, index, range));
    }
    result.items = items;
    const numFound = (response.numFound !== undefined)? response.numFound:0;
    result.isIncomplete = numFound > result.items.length;
    return result;
}

function findCurrentWord(lineText: string, position: Position): [string, Position] {
    let candidate = lineText.substring(DEPS_PREFIX.length, position.character).trim();
    let startPosition = new Position(position.line, DEPS_PREFIX.length);
    for(let i = position.character; i> -1; i--) {
        const c = lineText.charAt(i);
        if (isDelimiter(c)) {
            const nonDelimIdx = i+1;
            candidate = lineText.substring(nonDelimIdx, position.character);
            startPosition = new Position(position.line, nonDelimIdx);
            break;
        }
    }
    return [candidate, startPosition];
}

function findEndPosition(lineText: string, position: Position): Position {
    for(let i = position.character; i < lineText.length; i++) {
        const c = lineText.charAt(i);
        if (isDelimiter(c)) {
            return new Position(position.line, i);
        }
    }
    return new Position(position.line, lineText.length);
}

function findVersionPosition(lineText: string, position: Position): Position {
    for(let i = position.character; i> -1; i--) {
        const c = lineText.charAt(i);
        if (":" === c) {
            return new Position(position.line, i+1);
        }
    }
    return position;
}

