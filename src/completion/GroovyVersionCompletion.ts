import {
  CancellationToken,
  CompletionContext,
  CompletionItemKind,
  CompletionList,
  Position,
  Range,
  TextDocument,
} from "vscode";
import { GROOVY } from "../JBangDirectives";
import { compareVersionsDesc } from "../models/Version";
import { createFetchOptions } from "../utils/fetchUtils";
import { CompletionParticipant, EMPTY_LIST } from "./CompletionParticipant";
import { TextHelper } from "./TextHelper";

const SEARCH_API = `https://api.sdkman.io/2/candidates/groovy/linux/versions/list`;
const UPDATE_PERIOD = 60 * 60 * 1000; // 1h

let VERSIONS: string[];
let lastUpdate = 0;

export class GroovyVersionCompletion implements CompletionParticipant {
  applies(lineText: string, _position: Position): boolean {
    return GROOVY.matches(lineText, true);
  }

  async provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
    context: CompletionContext
  ): Promise<CompletionList> {
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
    const start = TextHelper.findStartPosition(
      lineText,
      position,
      `${GROOVY.prefix()}`
    );
    const end = TextHelper.findEndPosition(lineText, position);
    let result = toCompletionList(new Range(start, end));
    return result;
  }
}

async function searchVersions(): Promise<string[]> {
  console.log("Fetching Groovy versions");
  const response = await fetch(SEARCH_API, createFetchOptions());
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const text = await response.text();
  const versions: string[] = [];
  if (text) {
    //Already sorted by decreasing versions
    const lines = text.split(/\r?\n/);
    lines.forEach((line) => {
      if (line.startsWith(" ")) {
        versions.push(...line.split(" "));
      }
    });
  }
  return versions.sort(compareVersionsDesc);
}

function toCompletionList(range: Range): CompletionList {
  const items = VERSIONS.map((v: string, index: number) => {
    return {
      label: v,
      kind: CompletionItemKind.Value,
      insertText: v,
      sortText: `${index}`.padStart(4, "0"),
      range,
    };
  });
  return new CompletionList(items);
}

function itsBeenAWhile(): boolean {
  return lastUpdate === 0 || new Date().getTime() - lastUpdate > UPDATE_PERIOD;
}
