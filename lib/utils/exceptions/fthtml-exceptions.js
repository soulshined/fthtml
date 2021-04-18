"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fthtml_stacktrace_1 = require("./fthtml-stacktrace");
var fthtml_stacktrace_2 = require("../exceptions/fthtml-stacktrace");
exports.StackTrace = fthtml_stacktrace_2.default;
const ErrorTokenPosition = function (line, start, end) {
    return {
        line,
        start,
        end
    };
};
class FTHTMLError extends Error {
    constructor(message, position) {
        super(message);
        this.name = this.constructor.name;
        Error.stackTraceLimit = 0;
        Error.captureStackTrace(this, FTHTMLError);
        if (position) {
            this.position = ErrorTokenPosition(position.line, position.column);
            fthtml_stacktrace_1.default.updatePosition(0, position);
        }
        this.stack += `\n    ${fthtml_stacktrace_1.default.toString()}`;
    }
}
class ftHTMLexerError extends FTHTMLError {
    constructor(message, position) {
        super(message, position);
        this.name = this.constructor.name;
        this.position.end = position.column + 1;
    }
}
exports.ftHTMLexerError = ftHTMLexerError;
class ftHTMLInvalidCharError extends ftHTMLexerError {
    constructor(ch, position) {
        super(`Invalid character '${ch}'`, position);
    }
}
exports.ftHTMLInvalidCharError = ftHTMLInvalidCharError;
class ftHTMLParserError extends FTHTMLError {
    constructor(message, token, expecting) {
        super(message, token.position);
        this.position.end = token.position.column + (token.value ? token.value.length : 1);
        if (expecting)
            this.expecting = expecting;
    }
}
exports.ftHTMLParserError = ftHTMLParserError;
class ftHTMLInvalidTypeError extends ftHTMLParserError {
    constructor(token, expecting) {
        super(`Invalid type '${token.type}'${expecting ? '. Expecting ' + expecting : ''}`, token, expecting);
        this.actual = token.type;
    }
}
exports.ftHTMLInvalidTypeError = ftHTMLInvalidTypeError;
class ftHTMLIncompleteElementError extends ftHTMLParserError {
    constructor(token, expecting, actual) {
        super(`${token.type} requires ${expecting}`, token, expecting);
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
class ftHTMLInvalidTinyTemplateNameError extends ftHTMLParserError {
    constructor(token, expecting, origin) {
        super(`Invalid template name '${token.value}', when declaring a tiny template the word can not be a reserved keyword and the following pattern should be honored: ${expecting}`, token);
        this.origin = origin;
    }
}
exports.ftHTMLInvalidTinyTemplateNameError = ftHTMLInvalidTinyTemplateNameError;
class ftHTMLInvalidTinyTemplatePlaceholderError extends ftHTMLParserError {
    constructor(token, origin) {
        super(`Tiny templates require, at minimum, 1 literal placeholder of '\${val}', where one isn't implicitly provided`, token);
        this.origin = origin;
    }
}
exports.ftHTMLInvalidTinyTemplatePlaceholderError = ftHTMLInvalidTinyTemplatePlaceholderError;
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
    constructor(message, token, expecting) {
        super(message, token, expecting);
    }
}
exports.ftHTMLFunctionError = ftHTMLFunctionError;
class ftHTMLIllegalArgumentTypeError extends ftHTMLFunctionError {
    constructor(arg, func, actual) {
        super(`Invalid argument type for '${arg.name}' of ${func.value}. Expecting any of: ${arg.type.join(', ')}`, actual, arg.type);
    }
}
exports.ftHTMLIllegalArgumentTypeError = ftHTMLIllegalArgumentTypeError;
class ftHTMLIllegalArgumentError extends ftHTMLFunctionError {
    constructor(arg, position, func, actual) {
        super(`Invalid value for ${func.value} argument '${arg.name}' at position ${position + 1}. Expecting any of: ${arg.possibleValues.join(', ')}`, actual, arg.possibleValues);
    }
}
exports.ftHTMLIllegalArgumentError = ftHTMLIllegalArgumentError;
class ftHTMLNotEnoughArgumentsError extends ftHTMLParserError {
    constructor(func, expecting, actual) {
        super(`${func.value} requires ${expecting} arguments but ${actual} was given`, func, expecting.toString());
    }
}
exports.ftHTMLNotEnoughArgumentsError = ftHTMLNotEnoughArgumentsError;
class ftHTMLImportError extends FTHTMLError {
    constructor(message, token, parentFile) {
        var _a;
        super(message, (_a = token) === null || _a === void 0 ? void 0 : _a.position);
        if (parentFile && parentFile !== '')
            fthtml_stacktrace_1.default.add(parentFile);
        else {
            if (!token) {
                const item = fthtml_stacktrace_1.default.get(0);
                if (item.position !== null) {
                    this.position = ErrorTokenPosition(item.position.line, item.position.column);
                }
            }
        }
        if (token)
            this.position.end = token.position.column + (token.value ? token.value.length : 1);
    }
}
exports.ftHTMLImportError = ftHTMLImportError;
//# sourceMappingURL=fthtml-exceptions.js.map