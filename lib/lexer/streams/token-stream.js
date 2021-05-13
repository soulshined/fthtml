"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_1 = require("../../model/token");
const fthtml_exceptions_1 = require("../../model/exceptions/fthtml-exceptions");
class AbstractTokenStream {
    constructor(input) {
        this.input = input;
    }
    readWhile(predicate) {
        let buffer = '';
        while (!this.input.eof() && predicate(this.input.peek()))
            buffer += this.input.next();
        return buffer;
    }
    readEscaped(escapedBy, startingPos) {
        const pos = this.input.position();
        let isEscaped = false;
        let buffer = '';
        while (!this.input.eof()) {
            const ch = this.input.next();
            if (isEscaped) {
                if (ch !== '\\') {
                    buffer += `\\${ch}`;
                    isEscaped = false;
                }
                else
                    buffer += ch;
            }
            else if (ch === '\\')
                isEscaped = true;
            else if (ch === escapedBy) {
                return buffer;
            }
            else
                buffer += ch;
        }
        throw new fthtml_exceptions_1.FTHTMLExceptions.Lexer('String not properly formed', (startingPos !== null && startingPos !== void 0 ? startingPos : pos));
    }
    readString() {
        const pos = this.input.position();
        const delimiter = this.input.next();
        return new token_1.Token(token_1.ABSTRACT_TOKEN_TYPES.STRING, this.readEscaped(delimiter), pos, delimiter);
    }
    stream() {
        return {
            next: this.next.bind(this),
            peek: this.peek.bind(this),
            eof: this.eof.bind(this),
            previous: this.previous.bind(this),
            clone: this.clone.bind(this)
        };
    }
    next() {
        let token = this.current;
        this.prev = this.current;
        this.current = null;
        return token || this.tokenize();
    }
    peek() {
        return this.current || (this.current = this.tokenize());
    }
    previous() {
        return this.prev;
    }
    eof() {
        return this.peek() === null;
    }
    clone() {
        return this.input.clone();
    }
}
exports.default = AbstractTokenStream;
//# sourceMappingURL=token-stream.js.map