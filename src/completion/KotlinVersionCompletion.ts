import axios, { AxiosRequestConfig } from "axios";
import { CancellationToken, CompletionContext, CompletionItemKind, CompletionList, Position, Range, TextDocument } from "vscode";
import { KOTLIN } from "../JBangDirectives";
import { version } from "../extension";
import { compareVersionsDesc } from "../models/Version";
import { CompletionParticipant, EMPTY_LIST } from "./CompletionParticipant";
import { TextHelper } from "./TextHelper";

const SEARCH_API = `https://api.github.com/repos/JetBrains/kotlin/releases`;
const UPDATE_PERIOD = 60 * 60 * 1000; // 1h
const axiosConfig: AxiosRequestConfig<any> = {
    httpsAgent: 'jbang-vscode v' + version
};

let VERSIONS: string[];
let lastUpdate = 0;

export class KotlinVersionCompletion implements CompletionParticipant {

    applies(lineText: string, _position: Position): boolean {
        return KOTLIN.matches(lineText, true);
    }

    async provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): Promise<CompletionList> {
        const line = document.lineAt(position);
        const lineText = line.text;
        if (!this.applies(lineText, position)) {
            return EMPTY_LIST;
        }
        if (!VERSIONS || itsBeenAWhile()) {
            VERSIONS = await searchVersions();
            lastUpdate = new Date().getTime();
        }
        if (!VERSIONS.length) {
            return EMPTY_LIST;
        }
        const start = TextHelper.findStartPosition(lineText, position, `${KOTLIN.prefix() }`);
        const end = TextHelper.findEndPosition(lineText, position);
        let result = toCompletionList(new Range(start, end));
        return result;
    }

}

async function searchVersions(): Promise<string[]> {
    console.log("Fetching Kotlin versions");
    const response = await axios.get(SEARCH_API, axiosConfig);
    const releases = response?.data;
    if (releases) { //Already sorted by decreasing versions
        const versions = releases.map((r:any) => {
            const version = r?.tag_name?.replace('v', '') as string;
            return version;
        }) as string[];
        return versions.sort(compareVersionsDesc);
    }
    return [];
}

function toCompletionList(range: Range): CompletionList {
    const items = VERSIONS.map((v: string, index: number) => {
        return {
            label: v,
            kind: CompletionItemKind.Value,
            insertText: v,
            sortText: `${index}`.padStart(4, '0'),
            range
        };
    });
    return new CompletionList(items);
}

function itsBeenAWhile(): boolean {
    return (lastUpdate === 0 || (new Date().getTime() - lastUpdate) > UPDATE_PERIOD);
}

