import { CancellationToken, ExtensionContext, Hover, HoverProvider, languages, Position, TextDocument } from "vscode";
import { TextHelper } from "./completion/TextHelper";
import DocumentationProvider from "./DocumentationProvider";
import { SUPPORTED_LANGUAGES } from "./JBangUtils";
import { Dependency } from "./models/Dependency";

const DEPS = "//DEPS "

export class JBangHoverProvider implements HoverProvider {

    async provideHover(document: TextDocument, position: Position, token: CancellationToken): Promise<Hover|undefined> {
        
        if (SUPPORTED_LANGUAGES.includes(document.languageId)) {
            return undefined;
        }
        const line = document.lineAt(position);
        const lineText = line.text;
        if (lineText.startsWith(DEPS)) {
            const currText = TextHelper.getTextAt(lineText, position.character);
            if (currText) {
                var dependency = Dependency.getDependency(currText);
                var documentation = (dependency)? await DocumentationProvider.getDocumentation(dependency, token) : currText;
                return new Hover(documentation?documentation:currText);
            }
        }
        return undefined;
    }

    public initialize(context: ExtensionContext) {
        SUPPORTED_LANGUAGES.forEach(languageId => {
            context.subscriptions.push(
                languages.registerHoverProvider(languageId, this)
            );
        });
    }
}



export default new JBangHoverProvider();


