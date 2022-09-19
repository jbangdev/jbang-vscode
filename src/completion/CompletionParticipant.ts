import { CompletionContext, CompletionItem, CompletionList, Position, TextDocument } from "vscode"
import { CancellationToken } from "vscode-languageclient"

export interface CompletionParticipant {
    applies(lineText: string, position: Position): boolean
    provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): Promise<CompletionList|CompletionItem[]>
}