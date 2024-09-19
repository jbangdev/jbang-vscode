import { CodeLens, Command, ExtensionContext, languages, Range, TextDocument } from "vscode";
import { DEBUG_WITH_JBANG_COMMAND_ID } from "./JBangDebugger";
import { isJBangDirective, isJBangFile, SUPPORTED_LANGUAGES } from "./JBangUtils";

const typeRegexp = /^.*(class|interface|enum|record)\s+.*$/;
const singleCommentRegexp = /^\s*(\/\/).*$/;
const mainMethodRegex = /^\s*(public\s+)?(static\s+)?void\s+main\s*(\(\s*(String\s*\[\]\s*\w+)?\s*\))?/;

export class CodeLensProvider implements CodeLensProvider  {

    public initialize(context: ExtensionContext) {
        SUPPORTED_LANGUAGES.forEach(languageId => {
            context.subscriptions.push(
                languages.registerCodeLensProvider(languageId, this)
            );
        });
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
        let hasPackageDeclaration = false;
        const codelenses = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.length === 0) {
                continue;
            }
            if (!hasPackageDeclaration && line.startsWith("package ")) {
                hasPackageDeclaration = true;
            }
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
            mainPosition = getMainMethodPosition(i, line);
            if (mainPosition && (!hasPackageDeclaration || (typePosition && mainPosition.start.line > typePosition.start.line))) {
                break;
            }
        }
        if (firstDirectivePosition && ["java", "jbang"].includes(document.languageId)) {
            codelenses.push(new CodeLens(firstDirectivePosition, {
                command: "jbang.synchronize",
                title: "Synchronize JBang",
                tooltip: "Synchronize the classpath with the JBang directives in this file",
                arguments: [document.uri]
            }));
        }
        if (typePosition || mainPosition || firstDirectivePosition) {
            // Define what command we want to trigger when activating the CodeLens
            let executeJBang: Command = {
              command: "jbang.script.run",
              title: "Run JBang",
              tooltip: "Run this script with JBang in a new terminal",
              arguments: [document.uri]
            };
            let debugJBang: Command = {
                command: DEBUG_WITH_JBANG_COMMAND_ID,
                title: "Debug JBang",
                tooltip: "Debug this script with JBang in a new terminal",
                arguments: [document.uri]
              };
            if (typePosition) {
                codelenses.push(new CodeLens(typePosition, executeJBang));
                codelenses.push(new CodeLens(typePosition, debugJBang));
            }

            if (mainPosition) {
                codelenses.push(new CodeLens(mainPosition, executeJBang));
                codelenses.push(new CodeLens(mainPosition, debugJBang));
            }
            if (codelenses.length === 0 && firstDirectivePosition) {
                codelenses.push(new CodeLens(firstDirectivePosition, executeJBang));
            }
        }
        return codelenses;
      }
}

export function getMainMethodPosition(lineNumber: number, line: string): Range | undefined {
    const trimmedLine = line.trim();
    const mainMatch = trimmedLine.match(mainMethodRegex);
    if (mainMatch) {
        const start = line.indexOf(trimmedLine);
        const end = start; // keep it simple
        return new Range(lineNumber, start, lineNumber, end);
    }
    return undefined;
}

export default new CodeLensProvider();