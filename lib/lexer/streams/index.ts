import { Token } from "../../model/token";

export namespace Streams {
    export interface Input {
        next: () => string;
        peek: () => string;
        eof: () => boolean;
        position: () => Token.Position;
        clone: () => any;
    }

    export interface Token<T> {
        next: () => T;
        peek: () => T;
        previous: () => T;
        eof: () => boolean;
        clone: () => any;
    };
}