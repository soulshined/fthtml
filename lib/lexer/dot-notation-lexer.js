"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./grammar/index");
const token_stream_1 = require("./streams/token-stream");
const token_1 = require("../model/token");
const utils_1 = require("../utils");
const fthtml_exceptions_1 = require("../model/exceptions/fthtml-exceptions");
var DNTOKEN_TYPES;
(function (DNTOKEN_TYPES) {
    DNTOKEN_TYPES["STRING"] = "String";
    DNTOKEN_TYPES["WORD"] = "Word";
    DNTOKEN_TYPES["NUMBER"] = "Number";
})(DNTOKEN_TYPES = exports.DNTOKEN_TYPES || (exports.DNTOKEN_TYPES = {}));
class DNToken extends token_1.Token {
    constructor(type, value, position, delimiter) {
        super(type, value, position, delimiter);
    }
    clone() {
        return new DNToken(this.type, this.value, this.position, this.delimiter);
    }
}
exports.DNToken = DNToken;
class DotNotationLexer extends token_stream_1.default {
    constructor(input, initiator) {
        super(input);
        this.initiator = initiator;
    }
    tokenize() {
        if (this.input.eof())
            return null;
        const ch = this.input.peek();
        if (ch === '.') {
            this.input.next();
            const start = this.input.position();
            if (this.input.eof())
                this.throwError('a dot can not be the last character in a variable');
            if (utils_1.Utils.String.isDigit(this.input.peek())) {
                this.throwError('numeric literal');
            }
            const value = this.readWhile(ch => {
                if (/\w/.test(ch))
                    return true;
                else if (['.', '['].includes(ch))
                    return false;
                else
                    this.throwInvalidChar(ch);
            });
            const pos = token_1.Token.Position.create(this.initiator.position.line, start.column + this.initiator.position.end - 1);
            return new DNToken(DNTOKEN_TYPES.WORD, value, pos);
        }
        else if (ch === '[') {
            this.input.next();
            if (index_1.default.stringSymbols.includes(this.input.peek())) {
                const start = this.input.position();
                const token = this.readString();
                if (this.input.eof())
                    this.throwError('an indice reference must have an opening and closing bracket');
                if (this.input.peek() !== ']')
                    this.throwInvalidChar(this.input.peek());
                this.input.next();
                const pos = token_1.Token.Position.create(this.initiator.position.line, start.column + this.initiator.position.end - 1);
                return new DNToken(token.type, token.value, pos, token.delimiter);
            }
            const start = this.input.position();
            const value = this.readWhile(ch => /[0-9_]/.test(ch));
            if (value.charAt(0) === '_' || value.endsWith('_'))
                this.throwError('underscore can appear only between digits');
            if (this.input.eof())
                this.throwError('an indice reference must have an opening and closing bracket');
            if (this.input.peek() !== ']')
                this.throwInvalidChar(this.input.next());
            this.input.next();
            const pos = token_1.Token.Position.create(this.initiator.position.line, start.column + this.initiator.position.end - 1);
            return new DNToken(DNTOKEN_TYPES.NUMBER, value, pos);
        }
        this.throwInvalidChar(ch);
    }
    throwInvalidChar(ch) {
        throw new fthtml_exceptions_1.FTHTMLExceptions.Lexer.InvalidChar(ch, this.mergePosition());
    }
    throwError(msg) {
        throw new fthtml_exceptions_1.FTHTMLExceptions.Lexer(msg, this.mergePosition());
    }
    mergePosition() {
        const column = this.input.position().column + this.initiator.position.column + this.initiator.value.length;
        return token_1.Token.Position.create(this.initiator.position.line, column);
    }
}
exports.DotNotationLexer = DotNotationLexer;
//# sourceMappingURL=dot-notation-lexer.js.map