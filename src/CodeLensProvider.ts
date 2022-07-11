import { CodeLens, Command, ExtensionContext, languages, Range, TextDocument } from "vscode";
import { isJBangFile } from "./JBangUtils";

const typeRegexp = /^.*(class|interface|enum|record)\s+.*$/;
const singleCommentRegexp = /^\s*(\/\/).*$/;

export class CodeLensProvider implements CodeLensProvider  {

    public initialize(context: ExtensionContext) {
        //console.log("CodeLensProvider.initialize");
        context.subscriptions.push(
            languages.registerCodeLensProvider('java', this)
        );
    }

    async provideCodeLenses(document: TextDocument): Promise<CodeLens[]> {
        const lines = document.getText().split(/\r?\n/);
        const isJBangScript = isJBangFile(lines);
        if (!isJBangScript) {
            return [];
        }
        let typePosition: Range | undefined;
        let mainPosition: Range | undefined;
        const codelenses = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
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

        if (typePosition || mainPosition) {
            // Define what command we want to trigger when activating the CodeLens
            let c: Command = {
              command: "jbang.execute",
              title: "Run JBang",
              arguments: [document.uri]
            };
            if (typePosition) {
                codelenses.push(new CodeLens(typePosition, c));
            }
            if (mainPosition) {
                codelenses.push(new CodeLens(mainPosition, c));
            }    
        } 
        return codelenses;
      }
}

export default new CodeLensProvider();