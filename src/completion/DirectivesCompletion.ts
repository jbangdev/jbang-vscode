import {
  Command,
  CompletionContext,
  CompletionItem,
  CompletionList,
  Position,
  Range,
  SnippetString,
  TextDocument,
} from "vscode";
import { CancellationToken, CompletionItemKind } from "vscode-languageclient";
import {
  CDS,
  COMPILE_OPTIONS,
  DEPS,
  DESCRIPTION,
  Directive,
  FILES,
  GAV,
  GROOVY,
  HEADER,
  JAVA,
  JAVAAGENT,
  JAVAC_OPTIONS,
  JAVA_OPTIONS,
  KOTLIN,
  MAIN,
  MANIFEST,
  MODULE,
  NATIVE_OPTIONS,
  PREVIEW,
  QUARKUS_CONFIG,
  REPOS,
  RUNTIME_OPTIONS,
  SOURCES,
} from "../JBangDirectives";
import { CompletionParticipant } from "./CompletionParticipant";

const retriggerCompletion: Command = {
  command: "editor.action.triggerSuggest",
  title: "Re-trigger completions...",
};

const QUARKUS_DEP = new Directive("DEPS io.quarkus:quarkus", ""); //pretend it's a directive

export class DirectivesCompletion implements CompletionParticipant {
  applies(lineText: string, position: Position): boolean {
    return lineText.startsWith("//") || position.character === 0;
  }

  async provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
    context: CompletionContext
  ): Promise<CompletionList> {
    const items: CompletionItem[] = [];
    const range = new Range(new Position(position.line, 0), position);
    if (position.line === 0) {
      items.push({
        label: HEADER.name,
        kind: CompletionItemKind.Text,
        detail: HEADER.description,
        range,
      });
    }
    const scanner = new DirectiveScanner();
    scanner.scan(document);

    if (!scanner.found(JAVA)) {
      items.push(getCompletion(JAVA, range));
    }
    items.push(getCompletion(DEPS, range));

    if (document.languageId === "groovy" && !scanner.found(GROOVY)) {
      items.push(getCompletion(GROOVY, range));
    }
    if (document.languageId === "kotlin" && !scanner.found(KOTLIN)) {
      items.push(getCompletion(KOTLIN, range));
    }

    if (!scanner.found(GAV)) {
      items.push(getCompletion(GAV, range));
    }
    if (!scanner.found(MODULE)) {
      items.push(getCompletion(MODULE, range));
    }
    if (!scanner.found(MAIN)) {
      items.push(getCompletion(MAIN, range));
    }

    items.push(getCompletion(SOURCES, range));

    items.push(getCompletion(FILES, range));

    items.push(getCompletion(REPOS, range));

    items.push(getCompletion(DESCRIPTION, range));

    if (!scanner.found(MANIFEST)) {
      items.push(getCompletion(MANIFEST, range));
    }
    if (!scanner.found(JAVAC_OPTIONS) && !scanner.found(COMPILE_OPTIONS)) {
      items.push(getCompletion(JAVAC_OPTIONS, range));
    }
    if (!scanner.found(JAVA_OPTIONS) && !scanner.found(RUNTIME_OPTIONS)) {
      items.push(getCompletion(JAVA_OPTIONS, range));
    }
    if (!scanner.found(COMPILE_OPTIONS) && !scanner.found(JAVAC_OPTIONS)) {
      items.push(getCompletion(COMPILE_OPTIONS, range));
    }
    if (!scanner.found(RUNTIME_OPTIONS) && !scanner.found(JAVA_OPTIONS)) {
      items.push(getCompletion(RUNTIME_OPTIONS, range));
    }
    if (!scanner.found(JAVAAGENT)) {
      items.push(getCompletion(JAVAAGENT, range));
    }
    if (!scanner.found(CDS)) {
      items.push(getCompletion(CDS, range));
    }
    if (!scanner.found(NATIVE_OPTIONS)) {
      items.push(getCompletion(NATIVE_OPTIONS, range));
    }
    if (!scanner.found(PREVIEW)) {
      items.push(getCompletion(PREVIEW, range));
    }
    if (scanner.found(QUARKUS_DEP)) {
      items.push(getCompletion(QUARKUS_CONFIG, range));
    }
    return new CompletionList(items);
  }
}

class DirectiveScanner {
  directives: Directive[] = [];

  found(directive: Directive): boolean {
    return this.directives.includes(directive);
  }

  scan(document: TextDocument) {
    const checkedDirectives = new Set([
      JAVA,
      JAVAC_OPTIONS,
      COMPILE_OPTIONS,
      DESCRIPTION,
      CDS,
      GAV,
      JAVAAGENT,
      MANIFEST,
      JAVA_OPTIONS,
      RUNTIME_OPTIONS,
      NATIVE_OPTIONS,
      KOTLIN,
      GROOVY,
      MAIN,
      MODULE,
      PREVIEW,
      QUARKUS_DEP,
    ]);
    const lines = document.getText().split(/\r?\n/);

    for (const line of lines) {
      if (checkedDirectives.size === 0) {
        break;
      }
      for (const directive of checkedDirectives) {
        const includeSpace = directive !== QUARKUS_DEP; //special case for Quarkus dependencies
        if (directive.matches(line, includeSpace)) {
          this.directives.push(directive);
          checkedDirectives.delete(directive);
          break;
        }
      }
    }
  }
}
function getCompletion(
  directive: Directive,
  range?: Range,
  command?: Command
): CompletionItem {
  const item = new CompletionItem(directive.prefix(), CompletionItemKind.Text);
  item.insertText = new SnippetString(`${directive.prefix()} \${0}`);
  item.range = range;
  if (!command && directive.reTriggerCompletion) {
    command = retriggerCompletion;
  }
  item.command = command;
  item.detail = directive.description;
  return item;
}
