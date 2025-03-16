import { Position } from "vscode";

export namespace TextHelper {
  var DELIMITER = new RegExp(/^[\s,]$/);

  export function isDelimiter(c: string): boolean {
    return DELIMITER.test(c);
  }

  export function findStartPosition(
    lineText: string,
    position: Position,
    directive: string,
    delimiterFunc?: (text: string) => boolean
  ): Position {
    if (!delimiterFunc) {
      delimiterFunc = isDelimiter;
    }
    for (let i = position.character; i > -1; i--) {
      if (delimiterFunc(lineText.charAt(i))) {
        return new Position(position.line, i + 1);
      }
    }
    return new Position(position.line, directive.length);
  }

  export function findEndPosition(
    lineText: string,
    position: Position
  ): Position {
    for (let i = position.character; i < lineText.length; i++) {
      if (isDelimiter(lineText.charAt(i))) {
        return new Position(position.line, i);
      }
    }
    return new Position(position.line, lineText.length);
  }

  export function findVersionPosition(
    lineText: string,
    position: Position
  ): Position {
    for (let i = position.character; i > -1; i--) {
      const c = lineText.charAt(i);
      if (":" === c) {
        return new Position(position.line, i + 1);
      }
    }
    return position;
  }

  export function findSegmentPosition(
    lineText: string,
    position: Position
  ): Position {
    for (let i = position.character; i > -1; i--) {
      const c = lineText.charAt(i);
      if ("/" === c) {
        return new Position(position.line, i + 1);
      }
    }
    return position;
  }

  export function getTextAt(lineText: string, index: number) {
    if (
      index < 0 ||
      index > lineText.length - 1 ||
      isDelimiter(lineText.charAt(index))
    ) {
      return undefined;
    }
    let before = "";
    let after = "";
    for (let i = index; i > -1; i--) {
      const c = lineText.charAt(i);
      if (isDelimiter(c)) {
        break;
      }
      before = c + before;
    }
    for (let i = index + 1; i < lineText.length; i++) {
      const c = lineText.charAt(i);
      if (isDelimiter(c)) {
        break;
      }
      after = after + c;
    }
    return before + after;
  }
}
