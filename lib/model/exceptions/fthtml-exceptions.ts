import { ABSTRACT_TOKEN_TYPES, Token } from "../../model/token";
import { TYPES } from "../../lexer/types/types";
import { default as StackTrace } from "./fthtml-stacktrace";
import { FTHTMLFunction } from "../functions";

export namespace FTHTMLExceptions {

    export const Stack = StackTrace;

    class FTHTMLError extends Error {
        public position: Token.Position;

        constructor(message: string, position?: Token.Position) {
            super(message);
            this.name = `FTHTML${this.constructor.name}Error`;
            Error.stackTraceLimit = 0;
            Error.captureStackTrace(this, FTHTMLError);

            if (position) {
                this.position = position;
                StackTrace.updatePosition(0, position);
            }

            this.stack += `\n    ${StackTrace.toString()}`;
        }

    }

    export class Import extends FTHTMLError {

        constructor(message: string, token?: Token<any>, parentFile?: string) {
            super(message, token?.position);

            if (parentFile && parentFile !== '')
                StackTrace.add(parentFile);
            else {
                if (!token) {
                    const item = StackTrace.get(0);
                    if (item.position !== null) {
                        this.position = item.position;
                    }
                }
            }

            if (token)
                this.position.end = token.position.column + (token.value ? token.value.length : 1);
        }
    }

    export class Lexer extends FTHTMLError {
        constructor(message: string, position: Token.Position) {
            super(message, position);
            this.name = this.constructor.name;
            this.position.end = position.column + 1;
        }
    }

    export namespace Lexer {

        export class InvalidChar extends Lexer {
            constructor(ch: TYPES.char, position: Token.Position) {
                super(`Invalid character '${ch}'`, position);
            }
        }

    }

    export class Parser extends FTHTMLError {
        expecting?: string | string[];

        constructor(message: string, token: Token<any>, expecting?: string | string[]) {
            super(message, token.position);
            if (expecting)
                this.expecting = expecting;
        }
    }
    export namespace Parser {

        export class InvalidType extends Parser {
            actual: Token.TYPES | ABSTRACT_TOKEN_TYPES;

            constructor(token: Token<any>, expecting?: string) {
                super(`Invalid type '${expecting.includes('()') && token.type === 'Function' ? `${token.value}()` : token.type}'${expecting ? '. Expecting ' + expecting : ''}`, token, expecting);
                this.actual = token.type;
            }
        }

        export class IncompleteElement extends Parser {
            actual?: string;
            constructor(token: Token<any>, expecting: string, actual?: Token<any>) {
                super(`${token.type} requires ${expecting}`, token, expecting);
                this.actual = actual ? actual.value : null;
            }
        }

        export class InvalidKeyword extends Parser {
            constructor(token: Token<any>) {
                super(`Invalid, unknown or not allowed keyword '${token.value}'`, token);
            }
        }

        export class InvalidElementName extends Parser {
            constructor(token: Token<any>, expecting: string) {
                super(`Invalid element name '${token.value}', expecting ${expecting}`, token);
            }
        }

        export class InvalidVariableName extends Parser {
            constructor(token: Token<any>, expecting: string) {
                super(`Invalid variable name '${token.value}', when declaring a variable the word can not be a reserved keyword and the following pattern should be honored: ${expecting}`, token);
            }
        }

        export class InvalidTinyTemplateName extends Parser {
            public origin: string;

            constructor(token: Token<any>, expecting: string, origin: string) {
                super(`Invalid template name '${token.value}', when declaring a tiny template the word can not be a reserved keyword and the following pattern should be honored: ${expecting}`, token);
                this.origin = origin;
            }
        }

        export class InvalidTinyTemplatePlaceholder extends Parser {
            public origin: string;

            constructor(token: Token<any>, origin: string) {
                super(`Tiny templates require, at minimum, 1 literal placeholder of '\${val}', where one isn't implicitly provided`, token);
                this.origin = origin;
            }
        }

        export class VariableDoesntExist extends Parser {
            constructor(token: Token<any>) {
                super(`The variable '${token.value}' has not been declared`, token);
            }
        }

        export class JSON extends Parser {
            constructor(message: string, token: Token<any>) {
                super(message, token);
            }
        }

        export class Function extends Parser {
            constructor(message: string, token: Token<any>, expecting?: string[]) {
                super(message, token, expecting);
            }
        }

        export class IllegalArgumentType extends Function {
            constructor(arg: FTHTMLFunction.Argument, func: Token<any>, actual: Token<any>) {
                super(`Invalid argument type for '${arg.name}' of ${func.value}. Expecting any of: ${Token.joinTypes(arg.types)}`, actual, arg.types);
            }
        }

        export class IllegalArgument extends Function {
            constructor(arg: FTHTMLFunction.Argument, position: number, func: Token<any>, actual: Token<any>) {
                super(`Invalid value for ${func.value} argument '${arg.name}' at position ${position + 1}. Expecting any of: ${Token.joinTypes(arg.enum)}`, actual, arg.enum);
            }
        }

        export class NotEnoughArguments extends Parser {
            constructor(func: Token<any>, expecting: number, actual: number) {
                super(`${func.value} requires ${expecting} arguments but ${actual} was given`, func, expecting.toString());
            }
        }

    }

}