import { CodeLens, Command, ExtensionContext, languages, Range, TextDocument } from "vscode";
import { isJBangDirective, isJBangFile } from "./JBangUtils";

const typeRegexp = /^.*(class|interface|enum|record)\s+.*$/;
const singleCommentRegexp = /^\s*(\/\/).*$/;

export class CodeLensProvider implements CodeLensProvider  {

    public initialize(context: ExtensionContext) {
        //console.log("CodeLensProvider.initialize");
        context.subscriptions.push(
            languages.registerCodeLensProvider('java', this)
        );
        context.subscriptions.push(
            languages.registerCodeLensProvider('jbang', this)
        );
    }

    async provideCodeLenses(document: TextDocument): Promise<CodeLens[]> {
        const lines = document.getText().split(/\r?\n/);
        const isJBangScript = document.languageId === 'jbang' || isJBangFile(lines);
        if (!isJBangScript) {
            return [];
        }
        let typePosition: Range | undefined;
        let firstDirectivePosition: Range | undefined;
        let mainPosition: Range | undefined;
        const codelenses = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (firstDirectivePosition === undefined && isJBangDirective(line)) {
                firstDirectivePosition = new Range(i, 0, i, line.length);
                continue;
            }
            if (singleCommentRegexp.test(line)) {
                continue;
            }
            //Find the type position, i.e. the first line that declares either "class", "interface", "enum" or "record"
            if (typePosition === undefined && typeRegexp.test(line)) {
                //This is so naive this is ridiculous ;-)
                typePosition = new Range(i, 0, i, line.length);
            }
            const mainIdx = line.indexOf("public static void main");//That's super brittle, use regexp
            if (mainIdx >= 0) {
                mainPosition = new Range(i, mainIdx, i, line.length);
                break;
            }
        }
        if (firstDirectivePosition) {
            codelenses.push(new CodeLens(firstDirectivePosition, {
                command: "jbang.synchronize",
                title: "Synchronize JBang",
                tooltip: "Synchronize the classpath with the JBang directives in this file",
                arguments: [document.uri]
            }));
        }
        if (typePosition || mainPosition) {
            // Define what command we want to trigger when activating the CodeLens
            let executeJBang: Command = {
              command: "jbang.execute",
              title: "Run JBang",
              tooltip: "Run this script with JBang in a new terminal",
              arguments: [document.uri]
            };
            if (typePosition) {
                codelenses.push(new CodeLens(typePosition, executeJBang));
            }
            if (mainPosition) {
                codelenses.push(new CodeLens(mainPosition, executeJBang));
            }    
        } 
        return codelenses;
      }
}

export default new CodeLensProvider();