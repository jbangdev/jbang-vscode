import { Position } from "vscode";

export namespace CompletionHelper {

    var DELIMITER = new RegExp(/^[\s,]$/);

    export function isDelimiter(c: string) {
        return DELIMITER.test(c);
    }

    export function findStartPosition(lineText: string, position: Position, directive: string): Position {
        for(let i = position.character; i> -1; i--) {
            if (isDelimiter(lineText.charAt(i))) {
                return new Position(position.line, i+1);
            }
        }
        return new Position(position.line, directive.length);
    }
    
    export function findEndPosition(lineText: string, position: Position): Position {
        for(let i = position.character; i < lineText.length; i++) {
            if (isDelimiter(lineText.charAt(i))) {
                return new Position(position.line, i);
            }
        }
        return new Position(position.line, lineText.length);
    }
    
    export function findVersionPosition(lineText: string, position: Position): Position {
        for(let i = position.character; i> -1; i--) {
            const c = lineText.charAt(i);
            if (":" === c) {
                return new Position(position.line, i+1);
            }
        }
        return position;
    }

    export function findSegmentPosition(lineText: string, position: Position): Position {
        for(let i = position.character; i> -1; i--) {
            const c = lineText.charAt(i);
            if ("/" === c) {
                return new Position(position.line, i+1);
            }
        }
        return position;
    }
}