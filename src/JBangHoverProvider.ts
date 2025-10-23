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
import { DEPS, JBANG_DIRECTIVES, REPOS } from "./JBangDirectives";
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
      const repos = this.parseReposDirectives(document);
      var documentation = dependency
        ? await DocumentationProvider.getDocumentation(dependency, token, repos)
        : currText;
      return new Hover(documentation ? documentation : currText);
    }
    return undefined;
  }

  private parseReposDirectives(document: TextDocument): Map<string, string> {
    const repos = new Map<string, string>();

    // Always include default repositories
    repos.set('central', 'https://repo1.maven.org/maven2');
    repos.set('jitpack', 'https://jitpack.io');

    const lines = document.getText().split(/\r?\n/);

    for (const line of lines) {
      if (REPOS.matches(line)) {
        const reposContent = line.substring(REPOS.prefix().length).trim();
        if (reposContent) {
          // Parse repository declarations
          const repoDeclarations = reposContent.split(',');
          for (const declaration of repoDeclarations) {
            const trimmed = declaration.trim();
            if (trimmed.includes('=')) {
              // Named repository: name=url
              const [name, url] = trimmed.split('=', 2);
              repos.set(name.trim(), url.trim());
            } else {
              // Unnamed repository or built-in shortcut
              const url = this.getBuiltInRepositoryUrl(trimmed);
              if (url) {
                repos.set(trimmed, url);
              } else {
                // Direct URL
                repos.set(trimmed, trimmed);
              }
            }
          }
        }
      }
    }

    return repos;
  }

  private getBuiltInRepositoryUrl(name: string): string | undefined {
    const builtInRepos: { [key: string]: string } = {
      'google': 'https://maven.google.com'
    };
    return builtInRepos[name];
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
