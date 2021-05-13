"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_1 = require("../../model/token");
function InputStream(buffer, startPos, startCol, startLine) {
    let pos = (startPos !== null && startPos !== void 0 ? startPos : 0);
    let col = (startCol !== null && startCol !== void 0 ? startCol : 1);
    let line = (startLine !== null && startLine !== void 0 ? startLine : 1);
    return {
        next,
        peek,
        eof,
        position,
        clone
    };
    function next() {
        const x = buffer[pos++];
        if (x === '\t')
            col += 4;
        else if (x === '\n') {
            line++;
            col = 1;
        }
        else
            col++;
        return x;
    }
    function position() {
        return token_1.Token.Position.create(line, col);
    }
    function peek() {
        return buffer[pos];
    }
    function eof() {
        return peek() === undefined;
    }
    function clone() {
        return InputStream(buffer, pos, col, line);
    }
}
exports.default = InputStream;
//# sourceMappingURL=input-stream.js.map