import { default as ftHTMLGrammar } from "../../lib/lexer/grammar/index";

export const enum TOKEN_TYPE {
    ATTR_CLASS = 'Attr_Class',
    ATTR_CLASS_VAR = 'Attr_Class_Var',
    ATTR_ID = 'Attr_Id',
    ELANG = 'ELang',
    ELANGB = 'ElangB',
    KEYWORD = 'Keyword',
    KEYWORD_DOCTYPE = 'Keyword_Doctype',
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
    position: tokenposition
}

export default function Token(type: TOKEN_TYPE, value: string, position: tokenposition) {
    return {
        type,
        value,
        position
    }
}

export function getTokenTypeForIdentifier(identifier: string):
    TOKEN_TYPE.KEYWORD_DOCTYPE |
    TOKEN_TYPE.KEYWORD |
    TOKEN_TYPE.ELANG |
    TOKEN_TYPE.PRAGMA |
    TOKEN_TYPE.WORD |
    TOKEN_TYPE.ATTR_ID {
    if (~ftHTMLGrammar.keywords.indexOf(identifier)) {
        if (identifier == 'doctype') return TOKEN_TYPE.KEYWORD_DOCTYPE;
        return TOKEN_TYPE.KEYWORD;
    }
    else if (ftHTMLGrammar.elangs[identifier]) return TOKEN_TYPE.ELANG;
    else if (~ftHTMLGrammar.pragmas.indexOf(identifier)) return TOKEN_TYPE.PRAGMA;
    else return TOKEN_TYPE.WORD;
}