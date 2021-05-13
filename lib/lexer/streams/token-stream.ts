import { Streams } from ".";
import { TYPES } from "../types/types";
import { Token, ABSTRACT_TOKEN_TYPES } from "../../model/token";
import { FTHTMLExceptions } from "../../model/exceptions/fthtml-exceptions";

export default abstract class AbstractTokenStream<T> {
    protected input: Streams.Input;
    private current: T;
    private prev: T;

    constructor(input: Streams.Input) {
        this.input = input;
    }

    protected abstract tokenize(): T;

    protected readWhile(predicate: (ch: TYPES.char) => boolean): string {
        let buffer = '';

        while (!this.input.eof() && predicate(this.input.peek()))
            buffer += this.input.next();

        return buffer;
    }

    protected readEscaped(escapedBy: TYPES.char, startingPos?: Token.Position) {
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
                else buffer += ch
            }
            else if (ch === '\\') isEscaped = true;
            else if (ch === escapedBy) {
                return buffer;
            }
            else buffer += ch;
        }

        throw new FTHTMLExceptions.Lexer('String not properly formed', startingPos ?? pos);
    }

    protected readString(): T {
        const pos = this.input.position();
        const delimiter = this.input.next();
        return new Token(ABSTRACT_TOKEN_TYPES.STRING, this.readEscaped(delimiter), pos, delimiter) as unknown as T;
    }

    stream(): Streams.Token<T> {
        return {
            next: this.next.bind(this),
            peek: this.peek.bind(this),
            eof: this.eof.bind(this),
            previous: this.previous.bind(this),
            clone: this.clone.bind(this)
        }

    }

    private next(): T {
        let token = this.current;
        this.prev = this.current;
        this.current = null;
        return token || this.tokenize();
    }
    private peek(): T {
        return this.current || (this.current = this.tokenize());
    }
    private previous(): T {
        return this.prev;
    }
    private eof(): boolean {
        return this.peek() === null;
    }
    private clone() {
        return this.input.clone();
    }

}