"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../utils/exceptions/index");
const types_1 = require("../lexer/types");
const _ = require("../utils/functions");
const index_2 = require("./grammar/index");
class ftHTMLexer {
}
exports.ftHTMLexer = ftHTMLexer;
ftHTMLexer.TokenStream = function (input) {
    let ELANG_MODE = null;
    let LM = 2 /* NULL */;
    let current = null;
    return {
        next,
        peek,
        eof
    };
    function tokenize() {
        readThenOmit();
        if (input.eof())
            return null;
        const ch = input.peek();
        if (LM == 0 /* ELANG */) {
            if (ch != '{')
                throw new index_1.ftHTMLexerError(`Invalid character '${ch}', expecting a '{' for embedded language`, input.position());
            return readElang();
        }
        if (index_2.default.rules.isIdentifierChar(ch))
            return readIdentifier();
        else if (~index_2.default.stringSymbols.indexOf(ch))
            return readString();
        else if (ch == '@')
            return readVariable();
        else if (ch == '#')
            return readMaybePragma();
        else if (ch == '.')
            return readClassAttr();
        else if (index_2.default.rules.isValidSymbol(ch)) {
            const pos = input.position();
            input.next();
            return types_1.Token("Symbol" /* SYMBOL */, ch, pos);
        }
        else
            throw new index_1.ftHTMLInvalidCharError(ch, input.position());
    }
    function readWhile(predicate) {
        let buffer = '';
        while (!input.eof() && predicate(input.peek()))
            buffer += input.next();
        return buffer;
    }
    function readEscaped(escapedBy, startingPos) {
        const pos = input.position();
        let isEscaped = false;
        let buffer = '';
        while (!input.eof()) {
            const ch = input.next();
            if (isEscaped) {
                buffer += ch;
                isEscaped = false;
            }
            else if (ch === '\\')
                isEscaped = true;
            else if (ch === escapedBy) {
                return buffer;
            }
            else
                buffer += ch;
        }
        throw new index_1.ftHTMLexerError('String not properly formed', (startingPos !== null && startingPos !== void 0 ? startingPos : pos));
    }
    function readThenOmit() {
        let buffer = '';
        do {
            buffer = readWhile(index_2.default.rules.isWhitespace);
            buffer += readComments();
        } while (!input.eof() && buffer.length > 0);
    }
    function readComments() {
        const pos = input.position();
        const peek = input.peek();
        if (peek === '/') {
            input.next();
            const peek = input.peek();
            if (peek === '/')
                return readWhile(ch => ch != '\n');
            else if (peek === '*')
                return readBlockComment();
            else
                throw new index_1.ftHTMLInvalidCharError('/', pos);
        }
        return '';
    }
    function readBlockComment() {
        const pos = input.position();
        let buffer = '';
        let is_valid = false;
        input.next();
        while (!input.eof()) {
            buffer += input.next();
            if (buffer.endsWith('*/')) {
                is_valid = true;
                break;
            }
        }
        if (!is_valid)
            throw new index_1.ftHTMLexerError(`Block comment not properly formed or ended`, pos);
        return buffer;
    }
    function readIdentifier() {
        const pos = input.position();
        const identifier = readWhile(ch => {
            if (ch == '.' || index_2.default.rules.isIdentifierChar(ch))
                return true;
            if (ch == '@')
                throw new index_1.ftHTMLInvalidCharError('@', input.position());
            else
                return false;
        });
        if (identifier.endsWith('.'))
            throw new index_1.ftHTMLInvalidCharError('.', pos);
        const type = types_1.getTokenTypeForIdentifier(identifier);
        if (type === "ELang" /* ELANG */) {
            LM = 0 /* ELANG */;
            ELANG_MODE = identifier;
        }
        return types_1.Token(type, identifier, pos);
    }
    function readString() {
        const pos = input.position();
        return types_1.Token("String" /* STRING */, readEscaped(input.next()), pos);
    }
    function readVariable() {
        const pos = input.position();
        input.next();
        const identifier = readWhile(ch => {
            if (index_2.default.rules.isWhitespace(ch) || ch == '}' || ch == ')')
                return false;
            else if (index_2.default.rules.isIdentifierChar(ch))
                return true;
            else
                throw new index_1.ftHTMLInvalidCharError(ch, input.position());
        });
        if (identifier.length === 0)
            throw new index_1.ftHTMLInvalidCharError('@', pos);
        return types_1.Token("Variable" /* VARIABLE */, identifier, pos);
    }
    function readElang() {
        const pos = input.position();
        input.next();
        let openBraces = 1;
        let buffer = '';
        let stringBuffer;
        let stringDelim;
        let _lm = 0 /* ELANG */;
        LM = null;
        while (!input.eof()) {
            const pos = input.position();
            const ch = input.next();
            buffer += ch;
            if (_lm != 1 /* ELANGB */) {
                if (ch == '{')
                    openBraces++;
                else if (ch == '}') {
                    if (--openBraces === 0) {
                        ELANG_MODE = null;
                        buffer = buffer.slice(0, -1);
                        return types_1.Token("ElangB" /* ELANGB */, buffer, pos);
                    }
                }
                else if (~index_2.default.elangs[ELANG_MODE].stringSymbols.indexOf(ch)) {
                    _lm = 1 /* ELANGB */;
                    stringBuffer = ch;
                    stringDelim = ch;
                }
                else if (ELANG_MODE === 'php' && buffer.endsWith('<<<')) {
                    if (_.endsEscaped(buffer.slice(0, -3)))
                        throw new index_1.ftHTMLexerError('Heredoc/nowdoc not properly formed', types_1.TokenPosition(input.position().line, input.position().column - 3));
                    _lm = 1 /* ELANGB */;
                    stringBuffer = '<<<';
                }
            }
            else {
                stringBuffer += ch;
                if (ELANG_MODE == 'php' && stringBuffer.startsWith('<<<')) {
                    if (/<<<([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)[\r\n]+.*?[\r\n]+\1;[\r\n]+/gs.test(stringBuffer) ||
                        /<<<(['"])([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)\1[\r\n]+.*?[\r\n]+\2;[\r\n]+/gs.test(stringBuffer)) {
                        _lm = 0 /* ELANG */;
                    }
                }
                else {
                    if (stringBuffer !== `${stringDelim}${stringDelim}`) {
                        stringBuffer = readEscaped(stringDelim, types_1.TokenPosition(input.position().line, input.position().column - 1)) + stringDelim;
                        buffer += stringBuffer;
                    }
                    _lm = 0 /* ELANG */;
                }
            }
        }
        throw new index_1.ftHTMLexerError("Expecting a closing '}' for embedded languauge", pos);
    }
    function readMaybePragma() {
        const pos = input.position();
        input.next();
        if (index_2.default.rules.isWhitespace(input.peek()) || input.eof())
            throw new index_1.ftHTMLInvalidCharError('#', pos);
        const identifier = readWhile(ch => {
            if (index_2.default.rules.isWhitespace(ch) || ch == '}' || ch == ')')
                return false;
            else if (index_2.default.rules.isIdentifierChar(ch))
                return true;
            else
                throw new index_1.ftHTMLInvalidCharError(ch, input.position());
        });
        let type = types_1.getTokenTypeForIdentifier(identifier);
        if (!["Pragma" /* PRAGMA */, "Word" /* WORD */].includes(type))
            throw new index_1.ftHTMLexerError(`Invalid type '${type}' for '#'. Expected pragma, word`, pos);
        if (type == "Word" /* WORD */)
            type = "Attr_Id" /* ATTR_ID */;
        return types_1.Token(type, identifier, pos);
    }
    function readClassAttr() {
        const pos = input.position();
        input.next();
        if (index_2.default.rules.isWhitespace(input.peek()) || input.eof())
            throw new index_1.ftHTMLInvalidCharError('(', pos);
        else if (input.peek() == '@') {
            input.next();
            const identifier = readWhile(index_2.default.rules.isIdentifierChar);
            if (identifier.length === 0)
                throw new index_1.ftHTMLInvalidCharError('@', pos);
            return types_1.Token("Attr_Class_Var" /* ATTR_CLASS_VAR */, identifier, pos);
        }
        return types_1.Token("Attr_Class" /* ATTR_CLASS */, readWhile((ch) => {
            if (index_2.default.rules.isIdentifierChar(ch))
                return true;
            else if (ch == '.' || ch == '#')
                throw new index_1.ftHTMLInvalidCharError(ch, input.position());
            else
                return false;
        }), pos);
    }
    function next() {
        let token = current;
        current = null;
        return token || tokenize();
    }
    function peek() {
        return current || (current = tokenize());
    }
    function eof() {
        return peek() === null;
    }
};
