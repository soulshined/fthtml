import { default as StackTrace } from "./fthtml-stacktrace";
import { char, token, TOKEN_TYPE, tokenposition } from "../../lexer/types";

export { default as StackTrace } from '../exceptions/fthtml-stacktrace'

Error.stackTraceLimit = 0;

const ErrorTokenPosition = function (line: number, start: number, end?: number) {
    return {
        line,
        start,
        end
    }
}
type errortokenposition = {
    line: number,
    start: number,
    end?: number
}

export class ftHTMLexerError extends Error {
    public position: errortokenposition;

    constructor(message: string, position: tokenposition) {
        super();
        this.name = this.constructor.name;
        this.position = ErrorTokenPosition(position.line, position.column);

        StackTrace.updatePosition(0, position);
        this.message = `${message}
    ${StackTrace.toString()}`;
    }
}

export class ftHTMLInvalidCharError extends ftHTMLexerError {
    constructor(ch: char, position: tokenposition) {
        super(`Invalid character '${ch}'`, position);
    }
}

export class ftHTMLParserError extends Error {
    position: errortokenposition;

    constructor(message: string, token: token) {
        super();
        this.name = this.constructor.name;
        this.position = ErrorTokenPosition(token.position.line, token.position.column, token.position.column + (token.value ? token.value.length : 0));

        StackTrace.updatePosition(0, token.position);
        this.message = `${message}
    ${StackTrace.toString()}`;
    }
}

export class ftHTMLInvalidTypeError extends ftHTMLParserError {
    expecting: string;
    actual: TOKEN_TYPE;

    constructor(token: token, expecting?: string) {
        super(`Invalid type '${token.type}'${expecting ? '. Expecting ' + expecting : ''}`, token);
        this.expecting = expecting;
        this.actual = token.type;
    }
}

export class ftHTMLIncompleteElementError extends ftHTMLParserError {
    actual?: string;
    constructor(token: token, expecting: string, actual?: token) {
        super(`${token.type} requires ${expecting}`, token);
        this.actual = actual ? actual.value : null;
    }
}

export class ftHTMLInvalidKeywordError extends ftHTMLParserError {
    constructor(token: token) {
        super(`Invalid, unknown or not allowed keyword '${token.value}'`, token);
    }
}

export class ftHTMLInvalidElementNameError extends ftHTMLParserError {
    constructor(token: token, expecting: string) {
        super(`Invalid element name '${token.value}', expecting ${expecting}`, token);
    }
}

export class ftHTMLInvalidVariableNameError extends ftHTMLParserError {
    constructor(token: token, expecting: string) {
        super(`Invalid variable name '${token.value}', when declaring a variable the word can not be a reserved keyword and the following pattern should be honored: ${expecting}`, token);
    }
}

export class ftHTMLVariableDoesntExistError extends ftHTMLParserError {
    constructor(token: token) {
        super(`The variable '${token.value}' has not been declared`, token);
    }
}

export class ftHTMLJSONError extends ftHTMLParserError {
    constructor(message: string, token: token) {
        super(message, token);
    }
}

export class ftHTMLFunctionError extends ftHTMLParserError {
    constructor(message: string, token: token) {
        super(message, token);
    }
}

export class ftHTMLIllegalArgumentTypeError extends ftHTMLFunctionError {
    constructor(arg: any, func: token, actual: token) {
        super(`Invalid argument type for '${arg.name}' of ${func.value}. Expecting any of: ${arg.type.join(', ')}`, actual);
    }
}

export class ftHTMLIllegalArgumentError extends ftHTMLFunctionError {
    constructor(arg: any, position: number, func: token, actual: token) {
        super(`Invalid value for ${func.value} argument '${arg.name}' at position ${position + 1}. Expecting any of: ${arg.possibleValues.join(', ')}`, actual);
    }
}

export class ftHTMLNotEnoughArgumentsError extends ftHTMLParserError {
    constructor(func: token, expecting: number, actual: number) {
        super(`${func.value} requires ${expecting} arguments but ${actual} was given`, func);
    }
}

export class ftHTMLImportError extends Error {
    constructor(message: string) {
        super();
        this.name = this.constructor.name;

        this.message = `${message}
    ${StackTrace.toString()}`
    }
}