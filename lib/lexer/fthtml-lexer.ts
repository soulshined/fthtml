import grammar, { default as ftHTMLGrammar } from "./grammar/index";
import { Streams } from "./streams";
import AbstractTokenStream from "./streams/token-stream";
import { Token } from "../model/token";
import { FTHTMLExceptions } from "../model/exceptions/fthtml-exceptions";

enum LEX_MODE {
    ELANG = 0,
    ELANGB,
    NULL
}

export class FTHTMLLexer extends AbstractTokenStream<Token<Token.TYPES>> {
    private ELANG_MODE: string = null;
    private LM: LEX_MODE = LEX_MODE.NULL;

    constructor(input: Streams.Input) {
        super(input);
    }

    protected tokenize(): Token<Token.TYPES> {
        const comment = this.readThenOmit();
        if (comment) return comment;

        if (this.input.eof()) return null;

        const ch = this.input.peek();

        if ([LEX_MODE.ELANG].includes(this.LM)) {
            if (ch != '{') throw new FTHTMLExceptions.Lexer(`Invalid character '${ch}', expecting a '{' for embedded language`, this.input.position());
            return this.readElang();
        }
        if (ftHTMLGrammar.rules.isIdentifierChar(ch)) return this.readIdentifier();
        else if (~ftHTMLGrammar.stringSymbols.indexOf(ch)) return this.readString();
        else if (ch == '@') return this.readVariable();
        else if (ch == '#') return this.readMaybePragma();
        else if (ch == '.') return this.readClassAttr();
        else if (ftHTMLGrammar.rules.isValidSymbol(ch)) {
            const pos = this.input.position();
            this.input.next();

            return new Token(Token.TYPES.SYMBOL, ch, pos);
        }
        else throw new FTHTMLExceptions.Lexer.InvalidChar(ch, this.input.position());
    }

    private readThenOmit(): Token<Token.TYPES> {
        let buffer = '';

        do {
            buffer = this.readWhile(ftHTMLGrammar.rules.isWhitespace);
            const comment = this.readComments();
            if (comment) return comment;
        } while (!this.input.eof() && buffer.length > 0);

        return null;
    }

    private readComments(): Token<Token.TYPES> {
        const pos = this.input.position();
        const peek = this.input.peek();

        if (peek === '/') {
            this.input.next();
            const peek = this.input.peek();

            if (peek === '/') return new Token(Token.TYPES.COMMENT, `/${this.readWhile(ch => ch != '\n')}`, pos);
            else if (peek === '*') return new Token(Token.TYPES.COMMENTB, `/*${this.readBlockComment()}`, pos);
            else throw new FTHTMLExceptions.Lexer.InvalidChar('/', pos);
        }

        return null;
    }

    private readBlockComment(): string {
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

        if (!is_valid) throw new FTHTMLExceptions.Lexer(`Block comment not properly formed or ended`, pos);

        return buffer;
    }

    private readIdentifier(): Token<Token.TYPES> {
        const pos = this.input.position();
        const identifier = this.readWhile(ch => {
            if (ch == '.' || ftHTMLGrammar.rules.isIdentifierChar(ch)) return true;
            if (ch == '@') throw new FTHTMLExceptions.Lexer.InvalidChar('@', this.input.position());
            else return false;
        });

        if (identifier.endsWith('.')) throw new FTHTMLExceptions.Lexer.InvalidChar('.', pos);

        const type = Token.getTypeForIdentifier(identifier);
        if (type === Token.TYPES.PRAGMA)
            throw new FTHTMLExceptions.Lexer('Pragma not well-formed, required "#" prefix missing', pos);

        if (type === Token.TYPES.ELANG) {
            this.LM = LEX_MODE.ELANG;
            this.ELANG_MODE = identifier;
        }

        return new Token(type, identifier, pos);
    }

    private readVariable(): Token<Token.TYPES> {
        const pos = this.input.position();
        this.input.next();
        let t = Token.TYPES.VARIABLE;
        let identifier = this.readWhile(ch => {
            if (ftHTMLGrammar.rules.isWhitespace(ch) || ['}', ')', '[', '.'].includes(ch)) return false;
            else if (ftHTMLGrammar.rules.isIdentifierChar(ch)) return true;
            else throw new FTHTMLExceptions.Lexer.InvalidChar(ch, this.input.position());
        })

        if (['[', '.'].includes(this.input.peek())) {
            identifier += this.readLiteralVariable();
            t = Token.TYPES.LITERAL_VARIABLE;
        }

        if (identifier.length === 0) throw new FTHTMLExceptions.Lexer.InvalidChar('@', pos);

        return new Token(t, identifier, pos);
    }

    private readLiteralVariable(): string {
        const pos = this.input.position();
        const ch = this.input.next();
        let buffer = ch;

        const peek = this.input.peek();
        if (this.input.eof())
            throw new FTHTMLExceptions.Lexer("Incomplete group", pos);
        else if (grammar.stringSymbols.includes(peek) && ch === '[') {
            buffer += `${peek}${this.readEscaped(this.input.next(), pos)}${peek}`;
            if (this.input.eof())
                throw new FTHTMLExceptions.Lexer("an indice reference must have an opening and closing bracket", pos);
            else if (this.input.peek() === ']') {
                buffer += this.input.next();
                if (['[', '.'].includes(this.input.peek()))
                    buffer += this.readLiteralVariable();
                else if (!ftHTMLGrammar.rules.isWhitespace(this.input.peek()) && !['}', ')'].includes(this.input.peek()) && !this.input.eof())
                    throw new FTHTMLExceptions.Lexer.InvalidChar(this.input.peek(), this.input.position());
            }
            else throw new FTHTMLExceptions.Lexer("an indice reference must have an opening and closing bracket", pos);
        }
        else if (ftHTMLGrammar.rules.isIdentifierChar(peek) && ch === '[') {
            buffer += this.readWhile(ch => {
                if (ftHTMLGrammar.rules.isWhitespace(ch) || ['}', ')', ']'].includes(ch)) return false;
                else if (ftHTMLGrammar.rules.isIdentifierChar(ch)) return true;
                else throw new FTHTMLExceptions.Lexer.InvalidChar(ch, this.input.position());
            })
            if (this.input.eof())
                throw new FTHTMLExceptions.Lexer("Incomplete group", pos);
            else if (this.input.peek() === ']') {
                buffer += this.input.next();
                if (this.input.peek() === '.' || this.input.peek() === '[')
                    buffer += this.readLiteralVariable();
                else if (!ftHTMLGrammar.rules.isWhitespace(this.input.peek()) && !['}', ')'].includes(this.input.peek()) && !this.input.eof())
                    throw new FTHTMLExceptions.Lexer.InvalidChar(this.input.peek(), this.input.position());
            }
        }
        else if (ftHTMLGrammar.rules.isIdentifierChar(peek) && ch === '.') {
            buffer += this.readWhile(ch => {
                if (ftHTMLGrammar.rules.isWhitespace(ch) || ['}', ')', '[', '.'].includes(ch)) return false;
                else if (ftHTMLGrammar.rules.isIdentifierChar(ch)) return true;
                else throw new FTHTMLExceptions.Lexer.InvalidChar(ch, this.input.position());
            })
            if (['.', '['].includes(this.input.peek()))
                buffer += this.readLiteralVariable();
            else if (!ftHTMLGrammar.rules.isWhitespace(this.input.peek()) && !['}', ')'].includes(this.input.peek()) && !this.input.eof())
                throw new FTHTMLExceptions.Lexer.InvalidChar(this.input.peek(), this.input.position());
        }
        else if (ch === '[' && !ftHTMLGrammar.rules.isIdentifierChar(peek))
            throw new FTHTMLExceptions.Lexer("an indice reference must have an opening and closing bracket", pos);
        else if (ch === '.' && ftHTMLGrammar.rules.isWhitespace(peek))
            throw new FTHTMLExceptions.Lexer("a dot can not be the last character in a variable", pos);
        else if (ch === '.' && !ftHTMLGrammar.rules.isIdentifierChar(peek))
            throw new FTHTMLExceptions.Lexer.InvalidChar(this.input.peek(), this.input.position());

        return buffer;
    }

    private readElang(): Token<Token.TYPES> {
        const pos = this.input.position();
        this.input.next();

        let openBraces = 1;
        let buffer = '';
        let stringBuffer: string;
        let stringDelim: string;
        let _lm = LEX_MODE.ELANG;
        this.LM = null;

        while (!this.input.eof()) {
            const pos = this.input.position();
            const ch = this.input.next();
            buffer += ch;

            if (_lm != LEX_MODE.ELANGB) {
                if (ch == '{') openBraces++;
                else if (ch == '}') {
                    if (--openBraces === 0) {
                        this.ELANG_MODE = null;
                        buffer = buffer.slice(0, -1);
                        return new Token(Token.TYPES.ELANGB, buffer, this.input.position());
                    }
                }
                else if (~ftHTMLGrammar.elangs[this.ELANG_MODE].stringSymbols.indexOf(ch)) {
                    _lm = LEX_MODE.ELANGB;
                    stringBuffer = ch;
                    stringDelim = ch;
                }
            }
            else {
                stringBuffer += ch;

                if (stringBuffer !== `${stringDelim}${stringDelim}`) {
                    stringBuffer = this.readEscaped(stringDelim, Token.Position.create(this.input.position().line, this.input.position().column - 1)) + stringDelim;
                    buffer += stringBuffer;
                }
                _lm = LEX_MODE.ELANG;

            }
        }

        throw new FTHTMLExceptions.Lexer("Expecting a closing '}' for embedded languauge", pos);
    }

    private readMaybePragma(): Token<Token.TYPES> {
        const pos = this.input.position();
        this.input.next();

        if (ftHTMLGrammar.rules.isWhitespace(this.input.peek()) || this.input.eof())
            throw new FTHTMLExceptions.Lexer.InvalidChar('#', pos);

        const identifier = this.readWhile(ch => {
            if (ftHTMLGrammar.rules.isWhitespace(ch) || ch == '}' || ch == ')') return false;
            else if (ftHTMLGrammar.rules.isIdentifierChar(ch)) return true;
            else throw new FTHTMLExceptions.Lexer.InvalidChar(ch, this.input.position());
        });

        let type = Token.getTypeForIdentifier(identifier);
        if (![Token.TYPES.PRAGMA, Token.TYPES.WORD].includes(type)) throw new FTHTMLExceptions.Lexer(`Invalid type '${type}' for '#'. Expected pragma, word`, pos);
        if (type == Token.TYPES.WORD) type = Token.TYPES.ATTR_ID;

        return new Token(type, identifier, pos);
    }

    private readClassAttr(): Token<Token.TYPES> {
        const pos = this.input.position();
        this.input.next();

        if (ftHTMLGrammar.rules.isWhitespace(this.input.peek()) || this.input.eof())
            throw new FTHTMLExceptions.Lexer.InvalidChar('(', pos);

        else if (this.input.peek() == '@') {
            const token = this.readVariable();

            if (token.value.length === 0) throw new FTHTMLExceptions.Lexer.InvalidChar('@', pos);

            return new Token(token.type === Token.TYPES.VARIABLE ? Token.TYPES.ATTR_CLASS_VAR : Token.TYPES.ATTR_CLASS_LITERAL_VAR, token.value, pos);
        }

        return new Token(Token.TYPES.ATTR_CLASS, this.readWhile((ch) => {
            if (ftHTMLGrammar.rules.isIdentifierChar(ch)) return true;
            else if (ch == '.' || ch == '#') throw new FTHTMLExceptions.Lexer.InvalidChar(ch, this.input.position());
            else return false;
        }), pos);
    }
}