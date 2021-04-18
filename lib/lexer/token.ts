import { default as ftHTMLGrammar } from "../../lib/lexer/grammar/index";
import { ftHTMLParserError } from "../utils/exceptions";
import { isExpectedType, isNumber, isOneOfExpectedTypes, lowercase, testMatchViaUserPattern } from "../utils/functions";
import { char, FTHTMLExpression } from "./types";

export const enum TOKEN_TYPE {
    ATTR_CLASS = 'Attr_Class',
    ATTR_CLASS_VAR = 'Attr_Class_Var',
    ATTR_ID = 'Attr_Id',
    COMMENT = 'Comment',
    COMMENTB = 'Block Comment',
    ELANG = 'ELang',
    ELANGB = 'ElangB',
    FUNCTION = 'Function',
    MACRO = 'Macro',
    KEYWORD = 'Keyword',
    KEYWORD_DOCTYPE = 'Keyword_Doctype',
    OPERATOR = 'Operator',
    PRAGMA = 'Pragma',
    STRING = 'String',
    SYMBOL = 'Symbol',
    VARIABLE = 'Variable',
    WORD = 'Word',
};

export function TokenPosition(line: number, column: number, end?: number): tokenposition {
    return {
        line,
        column,
        end
    }
}

export type tokenposition = {
    line: number,
    column: number,
    end?: number
};

export type token = {
    type: TOKEN_TYPE,
    value: string,
    position: tokenposition,
    delimiter?: char
}

export default function Token(type: TOKEN_TYPE, value: string, position: tokenposition, delimiter?: char) {
    return {
        type,
        value,
        position,
        delimiter
    }
}

export function getTokenTypeForIdentifier(identifier: string):
    TOKEN_TYPE.KEYWORD_DOCTYPE |
    TOKEN_TYPE.KEYWORD |
    TOKEN_TYPE.ELANG |
    TOKEN_TYPE.FUNCTION |
    TOKEN_TYPE.MACRO |
    TOKEN_TYPE.PRAGMA |
    TOKEN_TYPE.WORD |
    TOKEN_TYPE.OPERATOR |
    TOKEN_TYPE.ATTR_ID {
    if (~ftHTMLGrammar.keywords.indexOf(identifier)) {
        if (identifier == 'doctype') return TOKEN_TYPE.KEYWORD_DOCTYPE;
        return TOKEN_TYPE.KEYWORD;
    }
    else if (ftHTMLGrammar.elangs[identifier]) return TOKEN_TYPE.ELANG;
    else if (~ftHTMLGrammar.pragmas.indexOf(identifier)) return TOKEN_TYPE.PRAGMA;
    else if (ftHTMLGrammar.functions[identifier]) return TOKEN_TYPE.FUNCTION;
    else if (ftHTMLGrammar.macros[identifier]) return TOKEN_TYPE.MACRO;
    else if (~ftHTMLGrammar.operators.indexOf(identifier)) return TOKEN_TYPE.OPERATOR;
    else return TOKEN_TYPE.WORD;
}

export function getOperatorExpression(expression: FTHTMLExpression) {
    const [ lhs, operator, rhs ] = expression;

    let lhsVal: string | number = lhs.parsedValue ?? lhs.token.value;
    let rhsVal: string | number = rhs.parsedValue ?? rhs.token.value;

    if (isNumber(lhsVal) && isNumber(rhsVal)) {
        lhsVal = +lhsVal;
        rhsVal = +rhsVal;
    }

    if (isExpectedType(operator.token, 'Operator_eq'))
        return lhsVal === rhsVal;
    else if (isExpectedType(operator.token, 'Operator_ie'))
        return lhsVal.toString().toLowerCase() === rhsVal.toString().toLowerCase();
    else if (isExpectedType(operator.token, 'Operator_ne'))
        return lhsVal !== rhsVal;
    else if (isExpectedType(operator.token, 'Operator_gt'))
        return lhsVal > rhsVal;
    else if (isExpectedType(operator.token, 'Operator_ge'))
        return lhsVal >= rhsVal;
    else if (isExpectedType(operator.token, 'Operator_lt'))
        return lhsVal < rhsVal;
    else if (isExpectedType(operator.token, 'Operator_le'))
        return lhsVal <= rhsVal;
    else if (isExpectedType(operator.token, 'Operator_contains')) {
        if (lhs.token.type === TOKEN_TYPE.VARIABLE) {
            if (Array.isArray(lhs.parsedValue))
                return lhs.parsedValue.includes(rhsVal);
            // @ts-ignore
            else if (typeof lhs.parsedValue === 'object' && lhs.parsedValue.constructor === Object)
                return Object.keys(lhs.parsedValue).includes(rhsVal.toString());
        }
        return !!~lhsVal.toString().indexOf(rhsVal.toString());
    }
    else if (isExpectedType(operator.token, 'Operator_icontains')) {
        if (lhs.token.type === TOKEN_TYPE.VARIABLE) {
            if (Array.isArray(lhs.parsedValue))
                return lhs.parsedValue.map(lowercase).includes(lowercase(rhsVal));
            // @ts-ignore
            else if (typeof lhs.parsedValue === 'object' && lhs.parsedValue.constructor === Object)
                return Object.keys(lhs.parsedValue).map(lowercase).includes(rhsVal.toString());
        }
        return !!~lowercase(lhsVal).indexOf(lowercase(rhsVal));
    }
    else if (isExpectedType(operator.token, 'Operator_starts'))
        return lhsVal.toString().startsWith(rhsVal.toString())
    else if (isExpectedType(operator.token, 'Operator_istarts'))
        return lowercase(lhsVal).startsWith(lowercase(rhsVal))
    else if (isExpectedType(operator.token, 'Operator_ends'))
        return lhsVal.toString().endsWith(rhsVal.toString())
    else if (isExpectedType(operator.token, 'Operator_iends'))
        return lowercase(lhsVal).endsWith(lowercase(rhsVal))
    else if (isOneOfExpectedTypes(operator.token, ['Operator_match', 'Operator_imatch'])) {
        const flags = isExpectedType(operator.token, 'Operator_imatch') ? 'i' : '';
        return testMatchViaUserPattern(lhsVal.toString(), rhs, flags);
    }

    throw new ftHTMLParserError('Unexpected operator', operator.token);
}

export function clone(aToken: token): token | undefined {
    if (aToken === undefined) return;
    return {
        position: aToken.position === undefined ? undefined : {
            line: aToken.position.line,
            column: aToken.position.column,
            end: aToken.position.end
        },
        delimiter: aToken.delimiter,
        type: aToken.type,
        value: aToken.value
    }
}