import { Command, CompletionContext, CompletionItem, CompletionList, Position, Range, SnippetString, TextDocument } from "vscode";
import { CancellationToken, CompletionItemKind } from "vscode-languageclient";
import { CompletionParticipant } from "./CompletionParticipant";

//TODO extract directives to common class
const JAVA = "//JAVA ";
const JAVAC_OPTIONS = "//JAVAC_OPTIONS ";
const JAVA_OPTIONS = "//JAVA_OPTIONS ";
const COMPILE_OPTIONS = "//COMPILE_OPTIONS ";
const RUNTIME_OPTIONS = "//RUNTIME_OPTIONS ";
const NATIVE_OPTIONS = "//NATIVE_OPTIONS ";
const MANIFEST = "//MANIFEST ";
const CDS = "//CDS ";
const GAV = "//GAV ";
const DESCRIPTION = "//DESCRIPTION ";
const JAVAAGENT = "//JAVAAGENT "; 

export class DirectivesCompletion implements CompletionParticipant {

    applies(lineText: string, position: Position): boolean {
        return lineText.startsWith('//') || position.character === 0;
    }

    async provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): Promise<CompletionList | CompletionItem[]> {
        const items: CompletionItem[] = [];
        if (position.line == 0) {
            items.push({
                label: "///usr/bin/env jbang \"$0\" \"$@\" ; exit $?",
                kind: CompletionItemKind.Text,
                detail: "JBang header"
            })
        }
        const range = new Range(new Position(position.line, 0), position);
        const scanner = new DirectiveScanner();
        const retriggerCompletion = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
        scanner.scan(document);
        if (!scanner.found(JAVA)) {
            items.push(getCompletion(JAVA, "JBang Java version to use", range, retriggerCompletion));
        }
        items.push(getCompletion("//DEPS", "Add JBang dependencies", range));
        
        if (!scanner.found(GAV)) {
            items.push(getCompletion(GAV, "Set Group, Artifact and Version", range));
        }
        
        const sourcesCompletion = getCompletion("//SOURCES", "Pattern to include as JBang sources", range);
        sourcesCompletion.command = retriggerCompletion;
        items.push(sourcesCompletion);
        
        items.push(getCompletion("//FILES", "Mount files to build", range));
        items.push(getCompletion("//REPOS", "Repositories used by Jbang to resolve dependencies", range));

        if (!scanner.found(MANIFEST)) {
            items.push(getCompletion(MANIFEST, "Write entries to META-INF/manifest.mf", range));
        }
        if (!scanner.found(DESCRIPTION)) {
            items.push(getCompletion(DESCRIPTION, "Markdown description for the JBang application/script", range));
        }
        if (!scanner.found(JAVAC_OPTIONS) && !scanner.found(COMPILE_OPTIONS)) {
            items.push(getCompletion(JAVAC_OPTIONS, "Options passed to the Java compiler", range, retriggerCompletion));
        }
        if (!scanner.found(JAVA_OPTIONS) && !scanner.found(RUNTIME_OPTIONS)) {
            items.push(getCompletion(JAVA_OPTIONS, "Options passed to the Java runtime", range, retriggerCompletion));
        }
        if (!scanner.found(COMPILE_OPTIONS) && !scanner.found(JAVAC_OPTIONS)) {
            items.push(getCompletion(COMPILE_OPTIONS, "Options passed to the compiler", range, retriggerCompletion));
        }
        if (!scanner.found(RUNTIME_OPTIONS) && !scanner.found(JAVA_OPTIONS)) {
            items.push(getCompletion(RUNTIME_OPTIONS, "Options passed to the JVM runtime", range, retriggerCompletion));
        }
        if (!scanner.found(JAVAAGENT)) {
            items.push(getCompletion(JAVAAGENT, "Activate agent packaging", range));
        }
        if (!scanner.found(CDS)) {
            items.push(getCompletion(CDS, "Activate Class Data Sharing", range));
        }
        if (!scanner.found(NATIVE_OPTIONS)) {
            items.push(getCompletion(NATIVE_OPTIONS, "Options passed to the native image builder", range));
        }
        return items;
    }
}


class DirectiveScanner {
    
    directives:string[] = []

    found(directive: string): boolean {
        return this.directives.includes(directive);
    }

    scan(document: TextDocument) {
        const checkedDirectives = [
            JAVA, JAVAC_OPTIONS, COMPILE_OPTIONS, DESCRIPTION, CDS, GAV, JAVAAGENT, MANIFEST, JAVA_OPTIONS, RUNTIME_OPTIONS, NATIVE_OPTIONS
        ]
        const lines = document.getText().split(/\r?\n/);
        for (let i = 0; i < lines.length && checkedDirectives.length > 0; i++) {
            const line = lines[i];
            let found;
            for(let j = 0; j < checkedDirectives.length; j++) {
                const directive = checkedDirectives[j];
                if (line.startsWith(directive)) {
                    found = directive;
                    break;
                }
            }
            if (found) {
                this.directives.push(found);
                const index = checkedDirectives.indexOf(found, 0);
                if (index > -1) {
                    checkedDirectives.splice(index, 1);
                }
            }
        } 
    }
}
function getCompletion(directive: string, detail: string, range?: Range, command?: Command): CompletionItem {
    const item = new CompletionItem(directive.trim(), CompletionItemKind.Text);
    item.insertText = new SnippetString(directive.trim() + " ${0}");
    item.range = range;
    item.command = command;
    return item;
}

