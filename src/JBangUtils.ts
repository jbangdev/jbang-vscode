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
