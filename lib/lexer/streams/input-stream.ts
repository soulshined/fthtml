import { TYPES } from "../types/types";
import { Token } from "../../model/token";

export default function InputStream(buffer, startPos?: number, startCol?: number, startLine?: number) {
    let pos: number = startPos ?? 0;
    let col: number = startCol ?? 1;
    let line: number = startLine ?? 1;

    return {
        next,
        peek,
        eof,
        position,
        clone
    }

    function next(): TYPES.char {
        const x: TYPES.char = buffer[pos++];

        if (x === '\t') col += 4;
        else if (x === '\n') {
            line++;
            col = 1;
        }
        else col++;

        return x;
    }
    function position(): Token.Position {
        return Token.Position.create(line, col);
    }
    function peek(): TYPES.char {
        return buffer[pos];
    }
    function eof(): boolean {
        return peek() === undefined;
    }
    function clone() {
        return InputStream(buffer, pos, col, line);
    }
}