"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dot_notation_lexer_1 = require("../lexer/dot-notation-lexer");
const input_stream_1 = require("../lexer/streams/input-stream");
const fthtml_exceptions_1 = require("../model/exceptions/fthtml-exceptions");
const token_1 = require("../model/token");
class DotNotationParser {
    static parse(token, vars, uconfig, shouldOmit) {
        var _a;
        let variable = token.value;
        let index = -1;
        if (~(index = variable.search(/[\.\[]/)))
            variable = variable.substring(0, index);
        const varName = variable;
        if (!/^[\w-]+$/.test(varName) || varName === 'import')
            throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.InvalidVariableName(new dot_notation_lexer_1.DNToken(token.type, varName, token_1.Token.Position.create(token.position.line, token.position.column + 1), token.delimiter), '[\w-]+');
        variable = vars[varName] !== undefined
            ? vars[varName]
            : uconfig.globalvars[varName];
        if (variable === undefined && !shouldOmit)
            throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.VariableDoesntExist(new dot_notation_lexer_1.DNToken(token.type, varName, token_1.Token.Position.create(token.position.line, token.position.column + 1), token.delimiter));
        const segments = new dot_notation_lexer_1.DotNotationLexer(input_stream_1.default(token.value.substring(index)), new token_1.Token(token.type, varName, token.position, token.delimiter)).stream();
        let result = variable;
        let prev = new dot_notation_lexer_1.DNToken(token.type, varName, token_1.Token.Position.create(token.position.line, token.position.column), token.delimiter);
        while (!segments.eof()) {
            prev = (_a = segments.previous(), (_a !== null && _a !== void 0 ? _a : prev));
            let v = segments.next();
            let key = v.value;
            if (v.type === dot_notation_lexer_1.DNTOKEN_TYPES.NUMBER)
                key = v.value.replace(/_/g, '');
            result = result[key];
            if (result === undefined)
                throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.JSON(`Key '${key}' does not exist for property '${prev.value}'`, new dot_notation_lexer_1.DNToken(v.type, v.value, v.position, v.delimiter));
        }
        return result;
    }
}
exports.default = DotNotationParser;
//# sourceMappingURL=dotnotation-parser.js.map