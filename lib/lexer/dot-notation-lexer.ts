import ftHTMLGrammar from "./grammar/index";
import AbstractTokenStream from "./streams/token-stream";
import { Streams } from "./streams";
import { ABSTRACT_TOKEN_TYPES, Token } from "../model/token";
import { TYPES } from "./types/types";
import { Utils } from "../utils";
import { FTHTMLExceptions } from "../model/exceptions/fthtml-exceptions";

export enum DNTOKEN_TYPES {
    STRING = 'String',
    WORD = 'Word',
    NUMBER = 'Number',
    OPTIONAL = 'Optional'
}

export class DNToken extends Token<DNTOKEN_TYPES> {

    constructor(type: DNTOKEN_TYPES | ABSTRACT_TOKEN_TYPES, value: string, position: Token.Position, delimiter?: TYPES.char) {
        super(type, value, position, delimiter);
    }

    public clone(): DNToken {
        return new DNToken(this.type, this.value, this.position, this.delimiter);
    }
}

export class DotNotationLexer extends AbstractTokenStream<DNToken> {
    private initiator: Token<Token.TYPES>;

    constructor(input: Streams.Input, initiator: Token<Token.TYPES>) {
        super(input);
        this.initiator = initiator;
    }

    protected tokenize() {
        if (this.input.eof()) return null;

        const ch = this.input.peek();

        if (ch === '.') {
            this.input.next();
            const start = this.input.position();
            if (this.input.eof())
                this.throwError('a dot can not be the last character in a variable');
            if (Utils.String.isDigit(this.input.peek())) {
                this.throwError('numeric literal');
            }

            const value = this.readWhile(ch => {
                if (/\w/.test(ch)) return true;
                else if (['.', '[', '?'].includes(ch)) return false;
                else this.throwInvalidChar(ch);
            });

            const pos = Token.Position.create(this.initiator.position.line, start.column + this.initiator.position.end - 1);
            return new DNToken(DNTOKEN_TYPES.WORD, value, pos);
        }
        else if (ch === '[') {
            this.input.next();
            if (ftHTMLGrammar.stringSymbols.includes(this.input.peek())) {
                const start = this.input.position();
                const token = this.readString();

                if (this.input.eof())
                    this.throwError('an indice reference must have an opening and closing bracket');

                if (this.input.peek() !== ']')
                    this.throwInvalidChar(this.input.peek());

                this.input.next();
                const pos = Token.Position.create(this.initiator.position.line, start.column + this.initiator.position.end - 1);
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

            const pos = Token.Position.create(this.initiator.position.line, start.column + this.initiator.position.end - 1);
            return new DNToken(DNTOKEN_TYPES.NUMBER, value, pos);
        }
        else if (ch === '?') {
            const consumed = this.input.next();
            return new DNToken(DNTOKEN_TYPES.OPTIONAL, consumed, this.input.position());
        }
        this.throwInvalidChar(ch);
    }

    private throwInvalidChar(ch: string) {
        throw new FTHTMLExceptions.Lexer.InvalidChar(ch, this.mergePosition());
    }

    private throwError(msg: string) {
        throw new FTHTMLExceptions.Lexer(msg, this.mergePosition());
    }

    private mergePosition(): Token.Position {
        const column = this.input.position().column + this.initiator.position.column + this.initiator.value.length;
        return Token.Position.create(this.initiator.position.line, column);
    }
}