import { TextDocument } from "vscode";
import { DEPS, HEADER_PREFIX, JBANG_DIRECTIVES } from "./JBangDirectives";

export const SUPPORTED_LANGUAGES = [
  "java",
  "groovy",
  "kotlin",
  "jshell",
  "jbang",
];

export function isJBangFile(content: string | string[]): boolean {
  let lines: string[] = [];
  if (typeof content === "string" || content instanceof String) {
    lines = content.split(/\r?\n/);
  } else {
    lines = content as string[];
  }
  return lines.find(isJBangDirective) !== undefined;
}

export const DEPS_PREFIX = `${DEPS.prefix()} `;

export function isJBangDirective(line: string): boolean {
  //TODO: detect @Grab/@Grape
  return (
    line.startsWith(HEADER_PREFIX) ||
    JBANG_DIRECTIVES.find((directive) => {
      return directive.matches(line);
    }) !== undefined
  );
}

export function isGroovy(document: TextDocument): boolean {
  return (
    document.languageId === "groovy" || document.fileName.endsWith(".groovy")
  );
}

export function isKotlin(document: TextDocument): boolean {
  return (
    document.languageId === "kotlin" ||
    document.fileName.endsWith(".kt") ||
    document.fileName.endsWith(".kts")
  );
}

export function isJBangSupported(document: TextDocument): boolean {
  return (
    SUPPORTED_LANGUAGES.includes(document.languageId) ||
    isGroovy(document) ||
    isKotlin(document)
  );
}
