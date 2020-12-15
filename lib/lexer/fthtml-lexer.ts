import { ftHTMLInvalidCharError, ftHTMLexerError } from "../utils/exceptions/index";
import {
    char,
    getTokenTypeForIdentifier,
    LEX_MODE,
    TOKEN_TYPE as TT,
    Token,
    Tokenable,
    TokenPosition,
    TokenStream,
} from "../lexer/types";
import { InputStream } from "../lexer/input-stream";
import * as _ from "../utils/functions";
import { default as ftHTMLGrammar } from "./grammar/index";
import { tokenposition, token } from "./token";

export class ftHTMLexer {

    static TokenStream = function (input: InputStream): TokenStream {
        let ELANG_MODE: string = null;
        let LM = LEX_MODE.NULL;
        let current: Tokenable = null;

        return {
            next,
            peek,
            eof
        }

        function tokenize(): Tokenable {
            readThenOmit();

            if (input.eof()) return null;

            const ch = input.peek();

            if (LM == LEX_MODE.ELANG) {
                if (ch != '{') throw new ftHTMLexerError(`Invalid character '${ch}', expecting a '{' for embedded language`, input.position());
                return readElang();
            }
            if (ftHTMLGrammar.rules.isIdentifierChar(ch)) return readIdentifier();
            else if (~ftHTMLGrammar.stringSymbols.indexOf(ch)) return readString();
            else if (ch == '@') return readVariable();
            else if (ch == '#') return readMaybePragma();
            else if (ch == '.') return readClassAttr();
            else if (ftHTMLGrammar.rules.isValidSymbol(ch)) {
                const pos = input.position();
                input.next();

                return Token(TT.SYMBOL, ch, pos);
            }
            else throw new ftHTMLInvalidCharError(ch, input.position());
        }

        function readWhile(predicate: (ch: char) => boolean): string {
            let buffer = '';

            while (!input.eof() && predicate(input.peek()))
                buffer += input.next();

            return buffer;
        }

        function readEscaped(escapedBy: char, startingPos?: tokenposition) {
            const pos = input.position();
            let isEscaped = false;
            let buffer = '';

            while (!input.eof()) {
                const ch = input.next();
                if (isEscaped) {
                    buffer += ch;
                    isEscaped = false;
                }
                else if (ch === '\\') isEscaped = true;
                else if (ch === escapedBy) {
                    return buffer;
                }
                else buffer += ch;
            }

            throw new ftHTMLexerError('String not properly formed', startingPos ?? pos);
        }

        function readThenOmit() {
            let buffer = '';

            do {
                buffer = readWhile(ftHTMLGrammar.rules.isWhitespace);
                buffer += readComments();
            } while (!input.eof() && buffer.length > 0);
        }

        function readComments(): string {
            const pos = input.position();
            const peek = input.peek();

            if (peek === '/') {
                input.next();
                const peek = input.peek();

                if (peek === '/') return readWhile(ch => ch != '\n');
                else if (peek === '*') return readBlockComment();
                else throw new ftHTMLInvalidCharError('/', pos);
            }

            return '';
        }

        function readBlockComment(): string {
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

            if (!is_valid) throw new ftHTMLexerError(`Block comment not properly formed or ended`, pos);

            return buffer;
        }

        function readIdentifier(): token {
            const pos = input.position();
            const identifier = readWhile(ch => {
                if (ch == '.' || ftHTMLGrammar.rules.isIdentifierChar(ch)) return true;
                if (ch == '@') throw new ftHTMLInvalidCharError('@', input.position());
                else return false;
            });

            if (identifier.endsWith('.')) throw new ftHTMLInvalidCharError('.', pos);

            const type = getTokenTypeForIdentifier(identifier);

            if (type === TT.ELANG) {
                LM = LEX_MODE.ELANG;
                ELANG_MODE = identifier;
            }

            return Token(type, identifier, pos);
        }

        function readString(): token {
            const pos = input.position();
            return Token(TT.STRING, readEscaped(input.next()), pos);
        }

        function readVariable(): token {
            const pos = input.position();
            input.next();
            const identifier = readWhile(ch => {
                if (ftHTMLGrammar.rules.isWhitespace(ch) || ch == '}' || ch == ')') return false;
                else if (ftHTMLGrammar.rules.isIdentifierChar(ch)) return true;
                else throw new ftHTMLInvalidCharError(ch, input.position());
            })

            if (identifier.length === 0) throw new ftHTMLInvalidCharError('@', pos);

            return Token(TT.VARIABLE, identifier, pos);
        }

        function readElang(): token {
            const pos = input.position();
            input.next();

            let openBraces = 1;
            let buffer = '';
            let stringBuffer: string;
            let stringDelim: string;
            let _lm = LEX_MODE.ELANG;
            LM = null;

            while (!input.eof()) {
                const pos = input.position();
                const ch = input.next();
                buffer += ch;

                if (_lm != LEX_MODE.ELANGB) {
                    if (ch == '{') openBraces++;
                    else if (ch == '}') {
                        if (--openBraces === 0) {
                            ELANG_MODE = null;
                            buffer = buffer.slice(0, -1);
                            return Token(TT.ELANGB, buffer, pos);
                        }
                    }
                    else if (~ftHTMLGrammar.elangs[ELANG_MODE].stringSymbols.indexOf(ch)) {
                        _lm = LEX_MODE.ELANGB;
                        stringBuffer = ch;
                        stringDelim = ch;
                    }
                }
                else {
                    stringBuffer += ch;

                    if (stringBuffer !== `${stringDelim}${stringDelim}`) {
                        stringBuffer = readEscaped(stringDelim, TokenPosition(input.position().line, input.position().column - 1)) + stringDelim;
                        buffer += stringBuffer;
                    }
                    _lm = LEX_MODE.ELANG;

                }
            }

            throw new ftHTMLexerError("Expecting a closing '}' for embedded languauge", pos);
        }

        function readMaybePragma(): token {
            const pos = input.position();
            input.next();

            if (ftHTMLGrammar.rules.isWhitespace(input.peek()) || input.eof())
                throw new ftHTMLInvalidCharError('#', pos);

            const identifier = readWhile(ch => {
                if (ftHTMLGrammar.rules.isWhitespace(ch) || ch == '}' || ch == ')') return false;
                else if (ftHTMLGrammar.rules.isIdentifierChar(ch)) return true;
                else throw new ftHTMLInvalidCharError(ch, input.position());
            });

            let type = getTokenTypeForIdentifier(identifier);
            if (![TT.PRAGMA, TT.WORD].includes(type)) throw new ftHTMLexerError(`Invalid type '${type}' for '#'. Expected pragma, word`, pos);
            if (type == TT.WORD) type = TT.ATTR_ID;

            return Token(type, identifier, pos);
        }

        function readClassAttr(): token {
            const pos = input.position();
            input.next();

            if (ftHTMLGrammar.rules.isWhitespace(input.peek()) || input.eof())
                throw new ftHTMLInvalidCharError('(', pos);

            else if (input.peek() == '@') {
                input.next();
                const identifier = readWhile(ftHTMLGrammar.rules.isIdentifierChar);

                if (identifier.length === 0) throw new ftHTMLInvalidCharError('@', pos);

                return Token(TT.ATTR_CLASS_VAR, identifier, pos);
            }

            return Token(TT.ATTR_CLASS, readWhile((ch) => {
                if (ftHTMLGrammar.rules.isIdentifierChar(ch)) return true;
                else if (ch == '.' || ch == '#') throw new ftHTMLInvalidCharError(ch, input.position());
                else return false;
            }), pos);
        }

        function next(): Tokenable {
            let token = current;
            current = null;
            return token || tokenize();
        }
        function peek(): Tokenable {
            return current || (current = tokenize());
        }
        function eof(): boolean {
            return peek() === null;
        }
    }
}