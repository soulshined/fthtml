"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../lib/lexer/grammar/index");
const exceptions_1 = require("../utils/exceptions");
const functions_1 = require("../utils/functions");
var TOKEN_TYPE;
(function (TOKEN_TYPE) {
    TOKEN_TYPE["ATTR_CLASS"] = "Attr_Class";
    TOKEN_TYPE["ATTR_CLASS_VAR"] = "Attr_Class_Var";
    TOKEN_TYPE["ATTR_ID"] = "Attr_Id";
    TOKEN_TYPE["COMMENT"] = "Comment";
    TOKEN_TYPE["COMMENTB"] = "Block Comment";
    TOKEN_TYPE["ELANG"] = "ELang";
    TOKEN_TYPE["ELANGB"] = "ElangB";
    TOKEN_TYPE["FUNCTION"] = "Function";
    TOKEN_TYPE["MACRO"] = "Macro";
    TOKEN_TYPE["KEYWORD"] = "Keyword";
    TOKEN_TYPE["KEYWORD_DOCTYPE"] = "Keyword_Doctype";
    TOKEN_TYPE["OPERATOR"] = "Operator";
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
function Token(type, value, position, delimiter) {
    return {
        type,
        value,
        position,
        delimiter
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
    else if (index_1.default.functions[identifier])
        return "Function";
    else if (index_1.default.macros[identifier])
        return "Macro";
    else if (~index_1.default.operators.indexOf(identifier))
        return "Operator";
    else
        return "Word";
}
exports.getTokenTypeForIdentifier = getTokenTypeForIdentifier;
function getOperatorExpression(expression) {
    var _a, _b;
    const [lhs, operator, rhs] = expression;
    let lhsVal = (_a = lhs.parsedValue, (_a !== null && _a !== void 0 ? _a : lhs.token.value));
    let rhsVal = (_b = rhs.parsedValue, (_b !== null && _b !== void 0 ? _b : rhs.token.value));
    if (functions_1.isNumber(lhsVal) && functions_1.isNumber(rhsVal)) {
        lhsVal = +lhsVal;
        rhsVal = +rhsVal;
    }
    if (functions_1.isExpectedType(operator.token, 'Operator_eq'))
        return lhsVal === rhsVal;
    else if (functions_1.isExpectedType(operator.token, 'Operator_ie'))
        return lhsVal.toString().toLowerCase() === rhsVal.toString().toLowerCase();
    else if (functions_1.isExpectedType(operator.token, 'Operator_ne'))
        return lhsVal !== rhsVal;
    else if (functions_1.isExpectedType(operator.token, 'Operator_gt'))
        return lhsVal > rhsVal;
    else if (functions_1.isExpectedType(operator.token, 'Operator_ge'))
        return lhsVal >= rhsVal;
    else if (functions_1.isExpectedType(operator.token, 'Operator_lt'))
        return lhsVal < rhsVal;
    else if (functions_1.isExpectedType(operator.token, 'Operator_le'))
        return lhsVal <= rhsVal;
    else if (functions_1.isExpectedType(operator.token, 'Operator_contains')) {
        if (lhs.token.type === "Variable") {
            if (Array.isArray(lhs.parsedValue))
                return lhs.parsedValue.includes(rhsVal);
            else if (typeof lhs.parsedValue === 'object' && lhs.parsedValue.constructor === Object)
                return Object.keys(lhs.parsedValue).includes(rhsVal.toString());
        }
        return !!~lhsVal.toString().indexOf(rhsVal.toString());
    }
    else if (functions_1.isExpectedType(operator.token, 'Operator_icontains')) {
        if (lhs.token.type === "Variable") {
            if (Array.isArray(lhs.parsedValue))
                return lhs.parsedValue.map(functions_1.lowercase).includes(functions_1.lowercase(rhsVal));
            else if (typeof lhs.parsedValue === 'object' && lhs.parsedValue.constructor === Object)
                return Object.keys(lhs.parsedValue).map(functions_1.lowercase).includes(rhsVal.toString());
        }
        return !!~functions_1.lowercase(lhsVal).indexOf(functions_1.lowercase(rhsVal));
    }
    else if (functions_1.isExpectedType(operator.token, 'Operator_starts'))
        return lhsVal.toString().startsWith(rhsVal.toString());
    else if (functions_1.isExpectedType(operator.token, 'Operator_istarts'))
        return functions_1.lowercase(lhsVal).startsWith(functions_1.lowercase(rhsVal));
    else if (functions_1.isExpectedType(operator.token, 'Operator_ends'))
        return lhsVal.toString().endsWith(rhsVal.toString());
    else if (functions_1.isExpectedType(operator.token, 'Operator_iends'))
        return functions_1.lowercase(lhsVal).endsWith(functions_1.lowercase(rhsVal));
    else if (functions_1.isOneOfExpectedTypes(operator.token, ['Operator_match', 'Operator_imatch'])) {
        const flags = functions_1.isExpectedType(operator.token, 'Operator_imatch') ? 'i' : '';
        return functions_1.testMatchViaUserPattern(lhsVal.toString(), rhs, flags);
    }
    throw new exceptions_1.ftHTMLParserError('Unexpected operator', operator.token);
}
exports.getOperatorExpression = getOperatorExpression;
function clone(aToken) {
    if (aToken === undefined)
        return;
    return {
        position: aToken.position === undefined ? undefined : {
            line: aToken.position.line,
            column: aToken.position.column,
            end: aToken.position.end
        },
        delimiter: aToken.delimiter,
        type: aToken.type,
        value: aToken.value
    };
}
exports.clone = clone;
//# sourceMappingURL=token.js.map