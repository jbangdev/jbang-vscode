import {
  CancellationToken,
  CompletionContext,
  CompletionItem,
  CompletionItemProvider,
  CompletionList,
  ExtensionContext,
  languages,
  Position,
  TextDocument,
} from "vscode";
import {
  CompletionParticipant,
  EMPTY_LIST,
  JBangCompletionItem,
} from "./completion/CompletionParticipant";
import { DirectivesCompletion } from "./completion/DirectivesCompletion";
import { GroovyVersionCompletion } from "./completion/GroovyVersionCompletion";
import { JavaOptionsCompletion } from "./completion/JavaOptionsCompletion";
import { KotlinVersionCompletion } from "./completion/KotlinVersionCompletion";
import { LocalDependencyCompletion } from "./completion/LocalDependencyCompletion";
import { RemoteDependencyCompletion } from "./completion/RemoteDependencyCompletion";
import { ResourcesCompletion } from "./completion/ResourcesCompletion";
import DocumentationProvider from "./DocumentationProvider";
import { SUPPORTED_LANGUAGES } from "./JBangUtils";

export class JBangCompletionProvider
  implements CompletionItemProvider<CompletionItem>
{
  private completionParticipants: CompletionParticipant[] = [];

  async provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
    context: CompletionContext
  ): Promise<CompletionList> {
    if (!SUPPORTED_LANGUAGES.includes(document.languageId)) {
      return EMPTY_LIST;
    }
    const line = document.lineAt(position);
    const lineText = line.text;
    const participants = this.completionParticipants.filter((p) =>
      p.applies(lineText, position)
    );
    if (participants) {
      const promises = participants.map((participant) =>
        participant.provideCompletionItems(document, position, token, context)
      );
      const participantCompletions = await Promise.all(promises);
      const items: CompletionItem[] = [];
      let isIncomplete = false;
      participantCompletions.forEach((c) => {
        isIncomplete = isIncomplete || c.isIncomplete!!;
        items.push(...c.items);
      });
      return new CompletionList(items, isIncomplete);
    }
    return EMPTY_LIST;
  }

  async resolveCompletionItem?(
    ci: CompletionItem,
    token: CancellationToken
  ): Promise<JBangCompletionItem> {
    const item = ci as JBangCompletionItem;
    if (item.dependency) {
      const doc = await DocumentationProvider.getDocumentation(
        item.dependency,
        token
      );
      if (doc) {
        item.documentation = doc;
      }
    }
    return item;
  }

  public initialize(context: ExtensionContext) {
    this.completionParticipants = [
      new LocalDependencyCompletion(),
      new RemoteDependencyCompletion(),
      new ResourcesCompletion(),
      new JavaOptionsCompletion(),
      new KotlinVersionCompletion(),
      new GroovyVersionCompletion(),
      new DirectivesCompletion(), //Must be last
    ];
    SUPPORTED_LANGUAGES.forEach((languageId) => {
      context.subscriptions.push(
        languages.registerCompletionItemProvider(
          languageId,
          this,
          ":",
          "/",
          "-"
        )
      );
    });
  }
}

export default new JBangCompletionProvider();
