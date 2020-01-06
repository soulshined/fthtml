import { char, TokenPosition } from "./types";
import { tokenposition } from "./token";

export type InputStream = {
    next: () => string;
    peek: () => string;
    eof: () => boolean;
    position: () => tokenposition;
}

export default function InputStream(buffer) {
    let pos: number = 0;
    let col: number = 1;
    let line: number = 1

    return {
        next,
        peek,
        eof,
        position
    }

    function next(): char {
        const x: char = buffer[pos++];

        if (x === '\t') col += 4;
        else if (x === '\n') {
            line++;
            col = 1;
        }
        else col++;

        return x;
    }
    function position(): tokenposition {
        return TokenPosition(line, col);
    }
    function peek(): char {
        return buffer[pos];
    }
    function eof(): boolean {
        return peek() === undefined;
    }
}