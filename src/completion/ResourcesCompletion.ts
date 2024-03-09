import * as fs from 'fs/promises';
import { CompletionContext, CompletionItem, CompletionList, Position, Range, TextDocument } from "vscode";
import { CancellationToken, CompletionItemKind } from "vscode-languageclient";
import { FILES, FILES_PREFIX, SOURCES } from '../JBangDirectives';
import { CompletionParticipant, EMPTY_LIST } from "./CompletionParticipant";
import { TextHelper } from './TextHelper';
import path = require('path');

const RESOURCE_DIRECTIVES = [SOURCES, FILES];

export class ResourcesCompletion implements CompletionParticipant {

    applies(lineText: string, position: Position): boolean {
      const directive = RESOURCE_DIRECTIVES.find(d => d.matches(lineText));
      return directive !== undefined && position.character > directive.prefix().length;
    }

    async provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): Promise<CompletionList> {
        const line = document.lineAt(position);
        const lineText = line.text;
        if (document.uri.scheme !== 'file' || !this.applies(lineText, position)) {
            return EMPTY_LIST;
        }

        let prefix: string;
        let delimiterFunc: (text:string) => boolean;
        if(FILES.matches(lineText)) {
          prefix = FILES_PREFIX;
          delimiterFunc = isEqualsOrDelim;
        } else {
          prefix = `${SOURCES.prefix()} `;
          delimiterFunc = TextHelper.isDelimiter;
        }
        let start = TextHelper.findStartPosition(lineText, position, prefix, delimiterFunc) ;
        const end = TextHelper.findEndPosition(lineText, position);
        const currText = lineText.substring(start.character, position.character).trim();
        const currDir = path.dirname(document.fileName);
        let targetDir = currDir;
        const isAbsolute = path.isAbsolute(currText);
        if (isAbsolute && prefix === FILES_PREFIX) {
          //No completion for absolute files in //FILES, as JBang explicitly forbids it
          return EMPTY_LIST;
        }

        const lastFolderDelimIdx = currText.lastIndexOf('/');
        if (isAbsolute) {
            // /a/b/c
            targetDir = currText; 
        } else if (lastFolderDelimIdx > -1) {
            // a/b/c
            targetDir = path.join(targetDir, currText.substring(0, lastFolderDelimIdx)); // a/b
        }
        
        if (lastFolderDelimIdx > -1) {
          start = TextHelper.findSegmentPosition(lineText, position);
        }
        let lastSegment = path.basename(currText);
        const startDir = currText.endsWith('/');
        if (startDir) { // a/b/
            targetDir = path.resolve(currDir, currText);
            lastSegment = ''; // b
        }
        const range = new Range(start, end);
        
        // Check if the target directory exists
        try {
          const stat = await fs.stat(targetDir);
          if (!stat.isDirectory()) {
            // If the target is not a directory, set the target to the parent directory
            targetDir = path.dirname(targetDir);
          }
        } catch (err) {
          // If the target does not exist, set the target to the parent directory
          targetDir = path.dirname(targetDir);
        }
        const fileName = path.basename(document.fileName);
        const isRoot  = path.dirname(targetDir) === targetDir;
        const retriggerCommand = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
        
        const fileEntries = await fs.readdir(targetDir, { withFileTypes: true });

        let completionItems = fileEntries
          .filter(entry => {
            return entry.name.startsWith(lastSegment) &&  !(targetDir === currDir && entry.name === fileName);
          })
          .map(entry => {
            const isDir = entry.isDirectory();
            let name = entry.name + (isDir?'/':'');
            let label = name;
            if (isRoot) {
               label = `/${name}`;
            }
            console.log(label);
            const completionItem = new CompletionItem(label);
            completionItem.insertText = name;
            if (isDir) {
              completionItem.kind = CompletionItemKind.Folder;
              completionItem.command = retriggerCommand;
            } else {
              completionItem.kind = CompletionItemKind.File;
            }
            completionItem.range = range;
            return completionItem;
          });
        
        // If the current text is a relative path, and doesn't resolve to the root, add the '../' option
        if (!isAbsolute && !isRoot) {
          const oneUp = new CompletionItem('../', CompletionItemKind.Folder);
          oneUp.range = range;
          oneUp.command = retriggerCommand;
          completionItems.unshift(oneUp);
        }
        
        return new CompletionList(completionItems);
    }
}

function isEqualsOrDelim(text: string): boolean {
  return TextHelper.isDelimiter(text) || (text === '=');
}
