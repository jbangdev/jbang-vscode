import { CancellationToken, CompletionContext, CompletionItem, CompletionItemProvider, CompletionList, ExtensionContext, languages, Position, TextDocument } from "vscode";
import { CompletionParticipant, JBangCompletionItem } from "./completion/CompletionParticipant";
import { DependencyCompletion } from "./completion/DependencyCompletion";
import { DirectivesCompletion } from "./completion/DirectivesCompletion";
import { JavaOptionsCompletion } from "./completion/JavaOptionsCompletion";
import { KotlinVersionCompletion } from "./completion/KotlinVersionCompletion";
import { SourcesCompletion } from "./completion/SourcesCompletion";
import DocumentationProvider from "./DocumentationProvider";
import { SUPPORTED_LANGUAGES } from "./JBangUtils";

export class JBangCompletionProvider implements CompletionItemProvider<CompletionItem> {

    private completionParticipants: CompletionParticipant[] = [];

    async provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): Promise<CompletionList|JBangCompletionItem[]> {
        if (!SUPPORTED_LANGUAGES.includes(document.languageId)) {
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

    async resolveCompletionItem?(ci: CompletionItem, token: CancellationToken): Promise<JBangCompletionItem> {
        const item = ci as JBangCompletionItem;
        if (item.dependency) {
            const doc = await DocumentationProvider.getDocumentation(item.dependency, token);
            if (doc) {
                item.documentation = doc;
            }
        }
        return item;
    }

    public initialize(context: ExtensionContext) {
        this.completionParticipants = [
            new DependencyCompletion(),
            new SourcesCompletion(),
            new JavaOptionsCompletion(),
            new KotlinVersionCompletion(),
            new DirectivesCompletion(),//Must be last
        ];
        SUPPORTED_LANGUAGES.forEach(languageId => {
            context.subscriptions.push(
                languages.registerCompletionItemProvider(languageId, this, ":", "/", "-")
            );
        })
    }
    
}

export default new JBangCompletionProvider();
