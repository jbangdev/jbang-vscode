import { CancellationToken, CodeAction, CodeActionContext, CodeActionKind, CodeActionProvider, Command, Diagnostic, ExtensionContext, ProviderResult, Range, Selection, TextDocument, languages } from "vscode";
import { JBANG_ADD_MISSING_DEPENDENCY } from "../CommandManager";
import { SUPPORTED_LANGUAGES, isJBangFile } from "../JBangUtils";

const UNRESOLVED_TYPE = 'Java(16777218)';
const UNRESOLVED_IMPORT = '268435846';

export class JBangCodeActions implements CodeActionProvider {

	static initialize(context: ExtensionContext) {
		context.subscriptions.push(
		languages.registerCodeActionsProvider('java', new JBangCodeActions(), {
			providedCodeActionKinds: JBangCodeActions.providedCodeActionKinds
		})
	);
	}

	public static readonly providedCodeActionKinds = [
		CodeActionKind.QuickFix
	];

  provideCodeActions(document: TextDocument, range: Range | Selection, context: CodeActionContext, token: CancellationToken): ProviderResult<(CodeAction | Command)[]> {
    if (!SUPPORTED_LANGUAGES.includes(document.languageId)) {
      return [];
    }
    const unresolvedTypes = context.diagnostics.filter(d => "Java" === d.source && UNRESOLVED_IMPORT === d.code);
    
    if (unresolvedTypes.length === 0 || !isJBangFile(document.getText().split(/\r?\n/))){
      return [];
    }
    
    return unresolvedTypes.map(d => {
		  const ca = this.createCommandCodeAction(d, document);
      return ca;
    }).filter((ca):ca is CodeAction => ca !== undefined);

    
  }

  private createCommandCodeAction(diagnostic: Diagnostic, document: TextDocument): CodeAction | undefined {
    const regex = /import (.*) cannot be resolved/;
    const match = diagnostic.message.match(regex);
    if (match && match[1]) {
      const importLine = document.lineAt(diagnostic.range.start.line).text;
      const semiCol = importLine.indexOf(";");
      const start = diagnostic.range.start.character;
      const end = semiCol > diagnostic.range.start.character? semiCol : importLine.length;
      let missingClass = importLine.substring(start, end).trim();
      if (missingClass) {
        const title = `Find '${missingClass}' dependency...`;
        const action = new CodeAction(title, CodeActionKind.QuickFix);
        action.command = { command: JBANG_ADD_MISSING_DEPENDENCY, title, tooltip: title, arguments: [document.uri, missingClass] };
        action.diagnostics = [diagnostic];
        return action;
      }
    }
	}

}