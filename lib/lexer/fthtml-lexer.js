"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./grammar/index");
const token_stream_1 = require("./streams/token-stream");
const token_1 = require("../model/token");
const fthtml_exceptions_1 = require("../model/exceptions/fthtml-exceptions");
var LEX_MODE;
(function (LEX_MODE) {
    LEX_MODE[LEX_MODE["ELANG"] = 0] = "ELANG";
    LEX_MODE[LEX_MODE["ELANGB"] = 1] = "ELANGB";
    LEX_MODE[LEX_MODE["NULL"] = 2] = "NULL";
})(LEX_MODE || (LEX_MODE = {}));
class FTHTMLLexer extends token_stream_1.default {
    constructor(input) {
        super(input);
        this.ELANG_MODE = null;
        this.LM = LEX_MODE.NULL;
    }
    tokenize() {
        const comment = this.readThenOmit();
        if (comment)
            return comment;
        if (this.input.eof())
            return null;
        const ch = this.input.peek();
        if ([LEX_MODE.ELANG].includes(this.LM)) {
            if (ch != '{')
                throw new fthtml_exceptions_1.FTHTMLExceptions.Lexer(`Invalid character '${ch}', expecting a '{' for embedded language`, this.input.position());
            return this.readElang();
        }
        if (index_1.default.rules.isIdentifierChar(ch))
            return this.readIdentifier();
        else if (~index_1.default.stringSymbols.indexOf(ch))
            return this.readString();
        else if (ch == '@')
            return this.readVariable();
        else if (ch == '#')
            return this.readMaybePragma();
        else if (ch == '.')
            return this.readClassAttr();
        else if (index_1.default.rules.isValidSymbol(ch)) {
            const pos = this.input.position();
            this.input.next();
            return new token_1.Token("Symbol", ch, pos);
        }
        else
            throw new fthtml_exceptions_1.FTHTMLExceptions.Lexer.InvalidChar(ch, this.input.position());
    }
    readThenOmit() {
        let buffer = '';
        do {
            buffer = this.readWhile(index_1.default.rules.isWhitespace);
            const comment = this.readComments();
            if (comment)
                return comment;
        } while (!this.input.eof() && buffer.length > 0);
        return null;
    }
    readComments() {
        const pos = this.input.position();
        const peek = this.input.peek();
        if (peek === '/') {
            this.input.next();
            const peek = this.input.peek();
            if (peek === '/')
                return new token_1.Token("Comment", `/${this.readWhile(ch => ch != '\n')}`, pos);
            else if (peek === '*')
                return new token_1.Token("Block Comment", `/*${this.readBlockComment()}`, pos);
            else
                throw new fthtml_exceptions_1.FTHTMLExceptions.Lexer.InvalidChar('/', pos);
        }
        return null;
    }
    readBlockComment() {
        const pos = this.input.position();
        let buffer = '';
        let is_valid = false;
        this.input.next();
        while (!this.input.eof()) {
            buffer += this.input.next();
            if (buffer.endsWith('*/')) {
                is_valid = true;
                break;
            }
        }
        if (!is_valid)
            throw new fthtml_exceptions_1.FTHTMLExceptions.Lexer(`Block comment not properly formed or ended`, pos);
        return buffer;
    }
    readIdentifier() {
        const pos = this.input.position();
        const identifier = this.readWhile(ch => {
            if (ch == '.' || index_1.default.rules.isIdentifierChar(ch))
                return true;
            if (ch == '@')
                throw new fthtml_exceptions_1.FTHTMLExceptions.Lexer.InvalidChar('@', this.input.position());
            else
                return false;
        });
        if (identifier.endsWith('.'))
            throw new fthtml_exceptions_1.FTHTMLExceptions.Lexer.InvalidChar('.', pos);
        const type = token_1.Token.getTypeForIdentifier(identifier);
        if (type === "Pragma")
            throw new fthtml_exceptions_1.FTHTMLExceptions.Lexer('Pragma not well-formed, required "#" prefix missing', pos);
        if (type === "ELang") {
            this.LM = LEX_MODE.ELANG;
            this.ELANG_MODE = identifier;
        }
        return new token_1.Token(type, identifier, pos);
    }
    readVariable() {
        const pos = this.input.position();
        this.input.next();
        let t = "Variable";
        let identifier = this.readWhile(ch => {
            if (index_1.default.rules.isWhitespace(ch) || ['}', ')', '[', '.'].includes(ch))
                return false;
            else if (index_1.default.rules.isIdentifierChar(ch))
                return true;
            else
                throw new fthtml_exceptions_1.FTHTMLExceptions.Lexer.InvalidChar(ch, this.input.position());
        });
        if (['[', '.'].includes(this.input.peek())) {
            identifier += this.readLiteralVariable();
            t = "Literal Variable";
        }
        if (identifier.length === 0)
            throw new fthtml_exceptions_1.FTHTMLExceptions.Lexer.InvalidChar('@', pos);
        return new token_1.Token(t, identifier, pos);
    }
    readLiteralVariable() {
        const pos = this.input.position();
        const ch = this.input.next();
        let buffer = ch;
        const peek = this.input.peek();
        if (this.input.eof())
            throw new fthtml_exceptions_1.FTHTMLExceptions.Lexer("Incomplete group", pos);
        else if (index_1.default.stringSymbols.includes(peek) && ch === '[') {
            buffer += `${peek}${this.readEscaped(this.input.next(), pos)}${peek}`;
            if (this.input.eof())
                throw new fthtml_exceptions_1.FTHTMLExceptions.Lexer("an indice reference must have an opening and closing bracket", pos);
            else if (this.input.peek() === ']') {
                buffer += this.input.next();
                if (['[', '.'].includes(this.input.peek()))
                    buffer += this.readLiteralVariable();
                else if (!index_1.default.rules.isWhitespace(this.input.peek()) && !['}', ')'].includes(this.input.peek()) && !this.input.eof())
                    throw new fthtml_exceptions_1.FTHTMLExceptions.Lexer.InvalidChar(this.input.peek(), this.input.position());
            }
            else
                throw new fthtml_exceptions_1.FTHTMLExceptions.Lexer("an indice reference must have an opening and closing bracket", pos);
        }
        else if (index_1.default.rules.isIdentifierChar(peek) && ch === '[') {
            buffer += this.readWhile(ch => {
                if (index_1.default.rules.isWhitespace(ch) || ['}', ')', ']'].includes(ch))
                    return false;
                else if (index_1.default.rules.isIdentifierChar(ch))
                    return true;
                else
                    throw new fthtml_exceptions_1.FTHTMLExceptions.Lexer.InvalidChar(ch, this.input.position());
            });
            if (this.input.eof())
                throw new fthtml_exceptions_1.FTHTMLExceptions.Lexer("Incomplete group", pos);
            else if (this.input.peek() === ']') {
                buffer += this.input.next();
                if (this.input.peek() === '.' || this.input.peek() === '[')
                    buffer += this.readLiteralVariable();
                else if (!index_1.default.rules.isWhitespace(this.input.peek()) && !['}', ')'].includes(this.input.peek()) && !this.input.eof())
                    throw new fthtml_exceptions_1.FTHTMLExceptions.Lexer.InvalidChar(this.input.peek(), this.input.position());
            }
        }
        else if (index_1.default.rules.isIdentifierChar(peek) && ch === '.') {
            buffer += this.readWhile(ch => {
                if (index_1.default.rules.isWhitespace(ch) || ['}', ')', '[', '.'].includes(ch))
                    return false;
                else if (index_1.default.rules.isIdentifierChar(ch))
                    return true;
                else
                    throw new fthtml_exceptions_1.FTHTMLExceptions.Lexer.InvalidChar(ch, this.input.position());
            });
            if (['.', '['].includes(this.input.peek()))
                buffer += this.readLiteralVariable();
            else if (!index_1.default.rules.isWhitespace(this.input.peek()) && !['}', ')'].includes(this.input.peek()) && !this.input.eof())
                throw new fthtml_exceptions_1.FTHTMLExceptions.Lexer.InvalidChar(this.input.peek(), this.input.position());
        }
        else if (ch === '[' && !index_1.default.rules.isIdentifierChar(peek))
            throw new fthtml_exceptions_1.FTHTMLExceptions.Lexer("an indice reference must have an opening and closing bracket", pos);
        else if (ch === '.' && index_1.default.rules.isWhitespace(peek))
            throw new fthtml_exceptions_1.FTHTMLExceptions.Lexer("a dot can not be the last character in a variable", pos);
        else if (ch === '.' && !index_1.default.rules.isIdentifierChar(peek))
            throw new fthtml_exceptions_1.FTHTMLExceptions.Lexer.InvalidChar(this.input.peek(), this.input.position());
        return buffer;
    }
    readElang() {
        const pos = this.input.position();
        this.input.next();
        let openBraces = 1;
        let buffer = '';
        let stringBuffer;
        let stringDelim;
        let _lm = LEX_MODE.ELANG;
        this.LM = null;
        while (!this.input.eof()) {
            const pos = this.input.position();
            const ch = this.input.next();
            buffer += ch;
            if (_lm != LEX_MODE.ELANGB) {
                if (ch == '{')
                    openBraces++;
                else if (ch == '}') {
                    if (--openBraces === 0) {
                        this.ELANG_MODE = null;
                        buffer = buffer.slice(0, -1);
                        return new token_1.Token("ElangB", buffer, this.input.position());
                    }
                }
                else if (~index_1.default.elangs[this.ELANG_MODE].stringSymbols.indexOf(ch)) {
                    _lm = LEX_MODE.ELANGB;
                    stringBuffer = ch;
                    stringDelim = ch;
                }
            }
            else {
                stringBuffer += ch;
                if (stringBuffer !== `${stringDelim}${stringDelim}`) {
                    stringBuffer = this.readEscaped(stringDelim, token_1.Token.Position.create(this.input.position().line, this.input.position().column - 1)) + stringDelim;
                    buffer += stringBuffer;
                }
                _lm = LEX_MODE.ELANG;
            }
        }
        throw new fthtml_exceptions_1.FTHTMLExceptions.Lexer("Expecting a closing '}' for embedded languauge", pos);
    }
    readMaybePragma() {
        const pos = this.input.position();
        this.input.next();
        if (index_1.default.rules.isWhitespace(this.input.peek()) || this.input.eof())
            throw new fthtml_exceptions_1.FTHTMLExceptions.Lexer.InvalidChar('#', pos);
        const identifier = this.readWhile(ch => {
            if (index_1.default.rules.isWhitespace(ch) || ch == '}' || ch == ')')
                return false;
            else if (index_1.default.rules.isIdentifierChar(ch))
                return true;
            else
                throw new fthtml_exceptions_1.FTHTMLExceptions.Lexer.InvalidChar(ch, this.input.position());
        });
        let type = token_1.Token.getTypeForIdentifier(identifier);
        if (!["Pragma", "Word"].includes(type))
            throw new fthtml_exceptions_1.FTHTMLExceptions.Lexer(`Invalid type '${type}' for '#'. Expected pragma, word`, pos);
        if (type == "Word")
            type = "Attr_Id";
        return new token_1.Token(type, identifier, pos);
    }
    readClassAttr() {
        const pos = this.input.position();
        this.input.next();
        if (index_1.default.rules.isWhitespace(this.input.peek()) || this.input.eof())
            throw new fthtml_exceptions_1.FTHTMLExceptions.Lexer.InvalidChar('(', pos);
        else if (this.input.peek() == '@') {
            const token = this.readVariable();
            if (token.value.length === 0)
                throw new fthtml_exceptions_1.FTHTMLExceptions.Lexer.InvalidChar('@', pos);
            return new token_1.Token(token.type === "Variable" ? "Attr_Class_Var" : "Attr_Class_Literal_Var", token.value, pos);
        }
        return new token_1.Token("Attr_Class", this.readWhile((ch) => {
            if (index_1.default.rules.isIdentifierChar(ch))
                return true;
            else if (ch == '.' || ch == '#')
                throw new fthtml_exceptions_1.FTHTMLExceptions.Lexer.InvalidChar(ch, this.input.position());
            else
                return false;
        }), pos);
    }
}
exports.FTHTMLLexer = FTHTMLLexer;
//# sourceMappingURL=fthtml-lexer.js.map