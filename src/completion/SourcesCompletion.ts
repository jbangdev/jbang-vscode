import * as fs from 'fs/promises';
import { Command, CompletionContext, CompletionItem, CompletionList, Position, Range, TextDocument } from "vscode";
import { CancellationToken, CompletionItemKind } from "vscode-languageclient";
import { existsAsync } from '../utils/fileUtils';
import { CompletionParticipant } from "./CompletionParticipant";
import { TextHelper } from './TextHelper';
import path = require('path');

const SOURCES_PREFIX = "//SOURCES ";

export class SourcesCompletion implements CompletionParticipant {

    applies(lineText: string, _position: Position): boolean {
        return lineText.startsWith(SOURCES_PREFIX);
    }

    async provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): Promise<CompletionList | CompletionItem[]> {
        const line = document.lineAt(position);
        const lineText = line.text;
        if (document.uri.scheme !== 'file' || !this.applies(lineText, position)) {
            return [];
        }
        let start = TextHelper.findStartPosition(lineText, position, SOURCES_PREFIX);
        const currText = lineText.substring(start.character, position.character).trim();

        let targetDir = path.dirname(document.fileName);
        
        let lastSegment = '';
        const pathDelim = currText.indexOf('/');
        if (pathDelim > -1) {
            targetDir = path.join(targetDir, currText.substring(0, pathDelim));
            if (pathDelim < currText.length -1) {
                lastSegment = currText.substring(pathDelim);
            }
            start = TextHelper.findSegmentPosition(lineText, position);
        }
        if (!(await existsAsync(targetDir))) {
            return [];
        }
        const end = TextHelper.findEndPosition(lineText, position);
        const range = new Range(start, end);

        const dirContent = await fs.readdir(targetDir);
        const baseName = path.basename(document.fileName);

        const filteredContent = [];
        //await Promise.all(dirContent.filter(async ...) returns all results!!! so I'll do it old style 
        for (var i = 0; i < dirContent.length; i++) {
            const name = dirContent[i];
            if (!name.startsWith(lastSegment)) {
                continue;
            }
            const isDir = (await fs.lstat(path.join(targetDir, name))).isDirectory();
            if(isDir || ((lastSegment !== '' || name !== baseName) && name.endsWith('.java'))) {
                filteredContent.push(name);
            }
        }
            
        const items = await Promise.all(filteredContent.map(async name => {
                const isDir = (await fs.lstat(path.join(targetDir, name))).isDirectory();
                let command:Command|undefined;
                if (isDir) {
                    command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
                }
                return {
                    label: name + (isDir?'/':''),
                    kind: isDir? CompletionItemKind.Folder: CompletionItemKind.File,
                    command,
                    range
                };
        }));
        return items;
    }
}