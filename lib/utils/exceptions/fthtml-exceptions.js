"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fthtml_stacktrace_1 = require("./fthtml-stacktrace");
var fthtml_stacktrace_2 = require("../exceptions/fthtml-stacktrace");
exports.StackTrace = fthtml_stacktrace_2.default;
Error.stackTraceLimit = 0;
const ErrorTokenPosition = function (line, start, end) {
    return {
        line,
        start,
        end
    };
};
class ftHTMLexerError extends Error {
    constructor(message, position) {
        super();
        this.name = this.constructor.name;
        this.position = ErrorTokenPosition(position.line, position.column);
        fthtml_stacktrace_1.default.updatePosition(0, position);
        this.message = `${message}
    ${fthtml_stacktrace_1.default.toString()}`;
    }
}
exports.ftHTMLexerError = ftHTMLexerError;
class ftHTMLInvalidCharError extends ftHTMLexerError {
    constructor(ch, position) {
        super(`Invalid character '${ch}'`, position);
    }
}
exports.ftHTMLInvalidCharError = ftHTMLInvalidCharError;
class ftHTMLParserError extends Error {
    constructor(message, token) {
        super();
        this.name = this.constructor.name;
        this.position = ErrorTokenPosition(token.position.line, token.position.column, token.position.column + (token.value ? token.value.length : 0));
        fthtml_stacktrace_1.default.updatePosition(0, token.position);
        this.message = `${message}
    ${fthtml_stacktrace_1.default.toString()}`;
    }
}
exports.ftHTMLParserError = ftHTMLParserError;
class ftHTMLInvalidTypeError extends ftHTMLParserError {
    constructor(token, expecting) {
        super(`Invalid type '${token.type}'${expecting ? '. Expecting ' + expecting : ''}`, token);
        this.expecting = expecting;
        this.actual = token.type;
    }
}
exports.ftHTMLInvalidTypeError = ftHTMLInvalidTypeError;
class ftHTMLIncompleteElementError extends ftHTMLParserError {
    constructor(token, expecting, actual) {
        super(`${token.type} requires ${expecting}`, token);
        this.actual = actual ? actual.value : null;
    }
}
exports.ftHTMLIncompleteElementError = ftHTMLIncompleteElementError;
class ftHTMLInvalidKeywordError extends ftHTMLParserError {
    constructor(token) {
        super(`Invalid, unknown or not allowed keyword '${token.value}'`, token);
    }
}
exports.ftHTMLInvalidKeywordError = ftHTMLInvalidKeywordError;
class ftHTMLInvalidElementNameError extends ftHTMLParserError {
    constructor(token, expecting) {
        super(`Invalid element name '${token.value}', expecting ${expecting}`, token);
    }
}
exports.ftHTMLInvalidElementNameError = ftHTMLInvalidElementNameError;
class ftHTMLInvalidVariableNameError extends ftHTMLParserError {
    constructor(token, expecting) {
        super(`Invalid variable name '${token.value}', when declaring a variable the word can not be a reserved keyword and the following pattern should be honored: ${expecting}`, token);
    }
}
exports.ftHTMLInvalidVariableNameError = ftHTMLInvalidVariableNameError;
class ftHTMLVariableDoesntExistError extends ftHTMLParserError {
    constructor(token) {
        super(`The variable '${token.value}' has not been declared`, token);
    }
}
exports.ftHTMLVariableDoesntExistError = ftHTMLVariableDoesntExistError;
class ftHTMLJSONError extends ftHTMLParserError {
    constructor(message, token) {
        super(message, token);
    }
}
exports.ftHTMLJSONError = ftHTMLJSONError;
class ftHTMLFunctionError extends ftHTMLParserError {
    constructor(message, token) {
        super(message, token);
    }
}
exports.ftHTMLFunctionError = ftHTMLFunctionError;
class ftHTMLIllegalArgumentTypeError extends ftHTMLFunctionError {
    constructor(arg, func, actual) {
        super(`Invalid argument type for '${arg.name}' of ${func.value}. Expecting any of: ${arg.type.join(', ')}`, actual);
    }
}
exports.ftHTMLIllegalArgumentTypeError = ftHTMLIllegalArgumentTypeError;
class ftHTMLIllegalArgumentError extends ftHTMLFunctionError {
    constructor(arg, position, func, actual) {
        super(`Invalid value for ${func.value} argument '${arg.name}' at position ${position + 1}. Expecting any of: ${arg.possibleValues.join(', ')}`, actual);
    }
}
exports.ftHTMLIllegalArgumentError = ftHTMLIllegalArgumentError;
class ftHTMLNotEnoughArgumentsError extends ftHTMLParserError {
    constructor(func, expecting, actual) {
        super(`${func.value} requires ${expecting} arguments but ${actual} was given`, func);
    }
}
exports.ftHTMLNotEnoughArgumentsError = ftHTMLNotEnoughArgumentsError;
class ftHTMLImportError extends Error {
    constructor(message) {
        super();
        this.name = this.constructor.name;
        this.message = `${message}
    ${fthtml_stacktrace_1.default.toString()}`;
    }
}
exports.ftHTMLImportError = ftHTMLImportError;
