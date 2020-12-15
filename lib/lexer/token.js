"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../lib/lexer/grammar/index");
var TOKEN_TYPE;
(function (TOKEN_TYPE) {
    TOKEN_TYPE["ATTR_CLASS"] = "Attr_Class";
    TOKEN_TYPE["ATTR_CLASS_VAR"] = "Attr_Class_Var";
    TOKEN_TYPE["ATTR_ID"] = "Attr_Id";
    TOKEN_TYPE["ELANG"] = "ELang";
    TOKEN_TYPE["ELANGB"] = "ElangB";
    TOKEN_TYPE["KEYWORD"] = "Keyword";
    TOKEN_TYPE["KEYWORD_DOCTYPE"] = "Keyword_Doctype";
    TOKEN_TYPE["PRAGMA"] = "Pragma";
    TOKEN_TYPE["STRING"] = "String";
    TOKEN_TYPE["SYMBOL"] = "Symbol";
    TOKEN_TYPE["VARIABLE"] = "Variable";
    TOKEN_TYPE["WORD"] = "Word";
})(TOKEN_TYPE = exports.TOKEN_TYPE || (exports.TOKEN_TYPE = {}));
;
function TokenPosition(line, column, end) {
    return {
        line,
        column,
        end
    };
}
exports.TokenPosition = TokenPosition;
function Token(type, value, position) {
    return {
        type,
        value,
        position
    };
}
exports.default = Token;
function getTokenTypeForIdentifier(identifier) {
    if (~index_1.default.keywords.indexOf(identifier)) {
        if (identifier == 'doctype')
            return "Keyword_Doctype";
        return "Keyword";
    }
    else if (index_1.default.elangs[identifier])
        return "ELang";
    else if (~index_1.default.pragmas.indexOf(identifier))
        return "Pragma";
    else
        return "Word";
}
exports.getTokenTypeForIdentifier = getTokenTypeForIdentifier;
