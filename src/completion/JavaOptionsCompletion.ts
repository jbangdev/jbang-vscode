import { CompletionContext, CompletionItem, CompletionList, Position, Range, SnippetString, TextDocument } from "vscode";
import { CancellationToken, CompletionItemKind } from "vscode-languageclient";
import { CompletionParticipant } from "./CompletionParticipant";
import { TextHelper } from "./TextHelper";

const JAVAC_OPTIONS = "//JAVAC_OPTIONS ";
const JAVA_OPTIONS = "//JAVA_OPTIONS ";
const COMPILE_OPTIONS = "//COMPILE_OPTIONS ";
const RUNTIME_OPTIONS = "//RUNTIME_OPTIONS ";
const JAVA = "//JAVA ";
const DIRECTIVES = [COMPILE_OPTIONS, RUNTIME_OPTIONS, JAVA, JAVAC_OPTIONS, JAVA_OPTIONS]
const JAVA_VERSIONS = [19, 17, 11, 8];
export class JavaOptionsCompletion implements CompletionParticipant {
    applies(lineText: string, position: Position): boolean {
        return !!DIRECTIVES.find(d => lineText.startsWith(d));
    }

    async provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): Promise<CompletionList | CompletionItem[]> {
        const line = document.lineAt(position);
        const lineText = line.text;
        const items:CompletionItem[] = [];
        const directive = DIRECTIVES.find(d => lineText.startsWith(d));
        if (!directive) {
            return [];
        }
        const start = TextHelper.findStartPosition(lineText, position, directive);
        //const currText = lineText.substring(start.character, position.character).trim();
        const end = TextHelper.findEndPosition(lineText, position);
        const javaVersions = getJavaVersions();
        let range: Range;
        if (directive === JAVA) {
            range = new Range(new Position(position.line, JAVA.length), new Position(position.line, lineText.length))
            JAVA_VERSIONS.forEach((v, i) => {
                const item = new CompletionItem(`${v}`, CompletionItemKind.Value);
                item.sortText = `${i}`;
                item.range = range;
                items.push(item);
            });
            return items;
        }
        range = new Range(start, end);
        if (!lineText.includes('--enable-preview')) {
            items.push(getCompletion('--enable-preview', 'Enables preview language features. Used in conjunction with either -source or --release.', range));
        }
        if (directive === JAVAC_OPTIONS || directive === COMPILE_OPTIONS) {
            if (!lineText.includes('-deprecation')) {
                items.push(getCompletion('-deprecation', 'Shows a description of each use or override of a deprecated member or class. '+
                'Without the -deprecation option, javac shows a summary of the source files that use or override deprecated members or classes.'+
                ' The -deprecation option is shorthand for -Xlint:deprecation.', range));
            }
            if (!lineText.includes('-source')) {
                items.push(getCompletion('-source','Compiles source code according to the rules of the Java programming language for the '+
                'specified Java SE release. The supported values of release are the current Java SE release and a limited number of previous'+
                ' releases, detailed in the command-line help.', range, new SnippetString(`-source ${javaVersions}`)));
                if (!lineText.includes('--release')) {
                    items.push(getCompletion('--release','Compiles source code according to the rules of the Java programming language for'+
                    ' the specified Java SE release, generating class files which target that release. Source code is compiled against the '+
                    'combined Java SE and JDK API for the specified release.', range, new SnippetString(`--release ${javaVersions}`)));
                }
            }
            if (!lineText.includes('-parameters')) {
                items.push(getCompletion('-parameters', 'Generates metadata for reflection on method parameters. Stores formal parameter names'+
                ' of constructors and methods in the generated class file so that the method java.lang.reflect.Executable.getParameters from '+
                'the Reflection API can retrieve them.', range));
            }
        }
        return items;
    } 
}

function getCompletion(label: string, detail: string, range: Range, snippet?: SnippetString): CompletionItem {
    const item = new CompletionItem(label, CompletionItemKind.Text);
    item.insertText = ( snippet )? snippet : new SnippetString(label + " ${0}");
    item.detail = detail;
    item.range = range;
    //Feels like it could be annoying
    //item.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
    return item;
}

export function getJavaVersions():string {
    let versions = `$\{1|${JAVA_VERSIONS.join(',')}|}`;
    return versions;
}