import { CancellationToken, CompletionContext, CompletionItem, CompletionList, ExtensionContext, languages, Position, TextDocument } from "vscode";
import { CompletionParticipant } from "./completion/CompletionParticipant";
import { DependencyCompletion } from "./completion/DependencyCompletion";
import { DirectivesCompletion } from "./completion/DirectivesCompletion";
import { JavaOptionsCompletion } from "./completion/JavaOptionsCompletion";
import { SourcesCompletion } from "./completion/SourcesCompletion";

export class CompletionProvider {

    private completionParticipants: CompletionParticipant[] = [];

    async provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): Promise<CompletionList|CompletionItem[]> {
        if (document.languageId !== 'java' && document.languageId !== 'jbang') {
            return [];
        }
        const line = document.lineAt(position);
        const lineText = line.text;
        const participant = this.completionParticipants.find(p => p.applies(lineText, position));
        if (participant) {
            return participant.provideCompletionItems(document, position, token, context);
        }
        return [];
    }

    public initialize(context: ExtensionContext) {
        this.completionParticipants = [
            new DependencyCompletion(),
            new SourcesCompletion(),
            new JavaOptionsCompletion(),
            new DirectivesCompletion()
        ];
        ["jbang", "java"].forEach(languageId => {
            context.subscriptions.push(
                languages.registerCompletionItemProvider(languageId, this, ":", "/", "-")
            );
        })
    }
    
}

export default new CompletionProvider();
