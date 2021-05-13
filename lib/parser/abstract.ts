import { Streams } from "../lexer/streams";

export abstract class AbstractParser<T> {
    protected _input: Streams.Token<T>;
    protected _value: any;

    protected abstract parse(...args: any): void;

    protected throwIfEOF(throwable: Error) {
        if (this.isEOF) throw throwable;
    }

    protected get peek(): T {
        return this._input.peek();
    }

    protected consume(): T {
        return this._input.next();
    }

    protected get previous(): T {
        return this._input.previous();
    }

    protected get isEOF(): boolean {
        return this._input.eof();
    }

    public get input(): Streams.Token<T> {
        return this._input;
    }

    abstract get value(): any;
}
