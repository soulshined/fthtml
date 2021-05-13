"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_1 = require("../../model/token");
const fthtml_stacktrace_1 = require("./fthtml-stacktrace");
var FTHTMLExceptions;
(function (FTHTMLExceptions) {
    FTHTMLExceptions.Stack = fthtml_stacktrace_1.default;
    class FTHTMLError extends Error {
        constructor(message, position) {
            super(message);
            this.name = `FTHTML${this.constructor.name}Error`;
            Error.stackTraceLimit = 0;
            Error.captureStackTrace(this, FTHTMLError);
            if (position) {
                this.position = position;
                fthtml_stacktrace_1.default.updatePosition(0, position);
            }
            this.stack += `\n    ${fthtml_stacktrace_1.default.toString()}`;
        }
    }
    class Import extends FTHTMLError {
        constructor(message, token, parentFile) {
            var _a;
            super(message, (_a = token) === null || _a === void 0 ? void 0 : _a.position);
            if (parentFile && parentFile !== '')
                fthtml_stacktrace_1.default.add(parentFile);
            else {
                if (!token) {
                    const item = fthtml_stacktrace_1.default.get(0);
                    if (item.position !== null) {
                        this.position = item.position;
                    }
                }
            }
            if (token)
                this.position.end = token.position.column + (token.value ? token.value.length : 1);
        }
    }
    FTHTMLExceptions.Import = Import;
    class Lexer extends FTHTMLError {
        constructor(message, position) {
            super(message, position);
            this.name = this.constructor.name;
            this.position.end = position.column + 1;
        }
    }
    FTHTMLExceptions.Lexer = Lexer;
    (function (Lexer) {
        class InvalidChar extends Lexer {
            constructor(ch, position) {
                super(`Invalid character '${ch}'`, position);
            }
        }
        Lexer.InvalidChar = InvalidChar;
    })(Lexer = FTHTMLExceptions.Lexer || (FTHTMLExceptions.Lexer = {}));
    class Parser extends FTHTMLError {
        constructor(message, token, expecting) {
            super(message, token.position);
            if (expecting)
                this.expecting = expecting;
        }
    }
    FTHTMLExceptions.Parser = Parser;
    (function (Parser) {
        class InvalidType extends Parser {
            constructor(token, expecting) {
                super(`Invalid type '${expecting.includes('()') && token.type === 'Function' ? `${token.value}()` : token.type}'${expecting ? '. Expecting ' + expecting : ''}`, token, expecting);
                this.actual = token.type;
            }
        }
        Parser.InvalidType = InvalidType;
        class IncompleteElement extends Parser {
            constructor(token, expecting, actual) {
                super(`${token.type} requires ${expecting}`, token, expecting);
                this.actual = actual ? actual.value : null;
            }
        }
        Parser.IncompleteElement = IncompleteElement;
        class InvalidKeyword extends Parser {
            constructor(token) {
                super(`Invalid, unknown or not allowed keyword '${token.value}'`, token);
            }
        }
        Parser.InvalidKeyword = InvalidKeyword;
        class InvalidElementName extends Parser {
            constructor(token, expecting) {
                super(`Invalid element name '${token.value}', expecting ${expecting}`, token);
            }
        }
        Parser.InvalidElementName = InvalidElementName;
        class InvalidVariableName extends Parser {
            constructor(token, expecting) {
                super(`Invalid variable name '${token.value}', when declaring a variable the word can not be a reserved keyword and the following pattern should be honored: ${expecting}`, token);
            }
        }
        Parser.InvalidVariableName = InvalidVariableName;
        class InvalidTinyTemplateName extends Parser {
            constructor(token, expecting, origin) {
                super(`Invalid template name '${token.value}', when declaring a tiny template the word can not be a reserved keyword and the following pattern should be honored: ${expecting}`, token);
                this.origin = origin;
            }
        }
        Parser.InvalidTinyTemplateName = InvalidTinyTemplateName;
        class InvalidTinyTemplatePlaceholder extends Parser {
            constructor(token, origin) {
                super(`Tiny templates require, at minimum, 1 literal placeholder of '\${val}', where one isn't implicitly provided`, token);
                this.origin = origin;
            }
        }
        Parser.InvalidTinyTemplatePlaceholder = InvalidTinyTemplatePlaceholder;
        class VariableDoesntExist extends Parser {
            constructor(token) {
                super(`The variable '${token.value}' has not been declared`, token);
            }
        }
        Parser.VariableDoesntExist = VariableDoesntExist;
        class JSON extends Parser {
            constructor(message, token) {
                super(message, token);
            }
        }
        Parser.JSON = JSON;
        class Function extends Parser {
            constructor(message, token, expecting) {
                super(message, token, expecting);
            }
        }
        Parser.Function = Function;
        class IllegalArgumentType extends Function {
            constructor(arg, func, actual) {
                super(`Invalid argument type for '${arg.name}' of ${func.value}. Expecting any of: ${token_1.Token.joinTypes(arg.types)}`, actual, arg.types);
            }
        }
        Parser.IllegalArgumentType = IllegalArgumentType;
        class IllegalArgument extends Function {
            constructor(arg, position, func, actual) {
                super(`Invalid value for ${func.value} argument '${arg.name}' at position ${position + 1}. Expecting any of: ${token_1.Token.joinTypes(arg.enum)}`, actual, arg.enum);
            }
        }
        Parser.IllegalArgument = IllegalArgument;
        class NotEnoughArguments extends Parser {
            constructor(func, expecting, actual) {
                super(`${func.value} requires ${expecting} arguments but ${actual} was given`, func, expecting.toString());
            }
        }
        Parser.NotEnoughArguments = NotEnoughArguments;
    })(Parser = FTHTMLExceptions.Parser || (FTHTMLExceptions.Parser = {}));
})(FTHTMLExceptions = exports.FTHTMLExceptions || (exports.FTHTMLExceptions = {}));
//# sourceMappingURL=fthtml-exceptions.js.map