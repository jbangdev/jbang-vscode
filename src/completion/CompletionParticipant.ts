import { CompletionContext, CompletionItem, CompletionList, Position, TextDocument } from "vscode"
import { CancellationToken } from "vscode-languageclient"
import { Dependency } from "../models/Dependency"

export class JBangCompletionItem extends CompletionItem {
    dependency?: Dependency
}

export interface CompletionParticipant {
    applies(lineText: string, position: Position): boolean
    provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): Promise<CompletionList|JBangCompletionItem[]>
}