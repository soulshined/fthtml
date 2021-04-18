import { default as StackTrace } from "./fthtml-stacktrace";
import { char, token, TOKEN_TYPE, tokenposition } from "../../lexer/types";

export { default as StackTrace } from '../exceptions/fthtml-stacktrace'

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
    end: number
}

class FTHTMLError extends Error {
    public position: errortokenposition;

    constructor(message: string, position?: tokenposition) {
        super(message);
        this.name = this.constructor.name;
        Error.stackTraceLimit = 0;
        Error.captureStackTrace(this, FTHTMLError);

        if (position) {
            this.position = ErrorTokenPosition(position.line, position.column);
            StackTrace.updatePosition(0, position);
        }

        this.stack += `\n    ${StackTrace.toString()}`;
    }

}

export class ftHTMLexerError extends FTHTMLError {
    constructor(message: string, position: tokenposition) {
        super(message, position);
        this.name = this.constructor.name;
        this.position.end = position.column + 1;
    }
}

export class ftHTMLInvalidCharError extends ftHTMLexerError {
    constructor(ch: char, position: tokenposition) {
        super(`Invalid character '${ch}'`, position);
    }
}

export class ftHTMLParserError extends FTHTMLError {
    expecting?: string | string[];

    constructor(message: string, token: token, expecting?: string | string[]) {
        super(message, token.position);
        this.position.end = token.position.column + (token.value ? token.value.length : 1);
        if (expecting)
            this.expecting = expecting;
    }
}

export class ftHTMLInvalidTypeError extends ftHTMLParserError {
    actual: TOKEN_TYPE;

    constructor(token: token, expecting?: string) {
        super(`Invalid type '${token.type}'${expecting ? '. Expecting ' + expecting : ''}`, token, expecting);
        this.actual = token.type;
    }
}

export class ftHTMLIncompleteElementError extends ftHTMLParserError {
    actual?: string;
    constructor(token: token, expecting: string, actual?: token) {
        super(`${token.type} requires ${expecting}`, token, expecting);
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

export class ftHTMLInvalidTinyTemplateNameError extends ftHTMLParserError {
    public origin: string;

    constructor(token: token, expecting: string, origin: string) {
        super(`Invalid template name '${token.value}', when declaring a tiny template the word can not be a reserved keyword and the following pattern should be honored: ${expecting}`, token);
        this.origin = origin;
    }
}

export class ftHTMLInvalidTinyTemplatePlaceholderError extends ftHTMLParserError {
    public origin: string;

    constructor(token: token, origin: string) {
        super(`Tiny templates require, at minimum, 1 literal placeholder of '\${val}', where one isn't implicitly provided`, token);
        this.origin = origin;
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
    constructor(message: string, token: token, expecting?: string[]) {
        super(message, token, expecting);
    }
}

export class ftHTMLIllegalArgumentTypeError extends ftHTMLFunctionError {
    constructor(arg: any, func: token, actual: token) {
        super(`Invalid argument type for '${arg.name}' of ${func.value}. Expecting any of: ${arg.type.join(', ')}`, actual, arg.type);
    }
}

export class ftHTMLIllegalArgumentError extends ftHTMLFunctionError {
    constructor(arg: any, position: number, func: token, actual: token) {
        super(`Invalid value for ${func.value} argument '${arg.name}' at position ${position + 1}. Expecting any of: ${arg.possibleValues.join(', ')}`, actual, arg.possibleValues);
    }
}

export class ftHTMLNotEnoughArgumentsError extends ftHTMLParserError {
    constructor(func: token, expecting: number, actual: number) {
        super(`${func.value} requires ${expecting} arguments but ${actual} was given`, func, expecting.toString());
    }
}

export class ftHTMLImportError extends FTHTMLError {

    constructor(message: string, token?: token, parentFile?: string) {
        super(message, token?.position);

        if (parentFile && parentFile !== '')
            StackTrace.add(parentFile);
        else {
            if (!token) {
                const item = StackTrace.get(0);
                if (item.position !== null) {
                    this.position = ErrorTokenPosition(item.position.line, item.position.column);
                }
            }
        }

        if (token)
            this.position.end = token.position.column + (token.value ? token.value.length : 1);
    }
}