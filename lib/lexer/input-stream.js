"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
function InputStream(buffer) {
    let pos = 0;
    let col = 1;
    let line = 1;
    return {
        next,
        peek,
        eof,
        position
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
        return types_1.TokenPosition(line, col);
    }
    function peek() {
        return buffer[pos];
    }
    function eof() {
        return peek() === undefined;
    }
}
exports.default = InputStream;
