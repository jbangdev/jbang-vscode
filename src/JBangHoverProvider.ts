import {
  CancellationToken,
  ExtensionContext,
  Hover,
  HoverProvider,
  languages,
  Position,
  TextDocument,
} from "vscode";
import { TextHelper } from "./completion/TextHelper";
import DocumentationProvider from "./DocumentationProvider";
import { DEPS, JBANG_DIRECTIVES } from "./JBangDirectives";
import { isJBangSupported, SUPPORTED_LANGUAGES } from "./JBangUtils";
import { Dependency } from "./models/Dependency";

export class JBangHoverProvider implements HoverProvider {
  async provideHover(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): Promise<Hover | undefined> {
    if (!isJBangSupported(document)) {
      return undefined;
    }
    const line = document.lineAt(position);
    const lineText = line.text;
    const directive = JBANG_DIRECTIVES.find((d) => d.matches(lineText));
    if (!directive) {
      return undefined;
    }
    const currText = TextHelper.getTextAt(lineText, position.character);
    if (currText === directive.prefix()) {
      return new Hover(directive.description);
    }
    if (currText && DEPS === directive) {
      var dependency = Dependency.getDependency(currText);
      var documentation = dependency
        ? await DocumentationProvider.getDocumentation(dependency, token)
        : currText;
      return new Hover(documentation ? documentation : currText);
    }
    return undefined;
  }

  public initialize(context: ExtensionContext) {
    SUPPORTED_LANGUAGES.forEach((languageId) => {
      context.subscriptions.push(
        languages.registerHoverProvider(languageId, this)
      );
    });
  }
}

export default new JBangHoverProvider();
