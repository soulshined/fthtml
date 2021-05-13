import { TYPES } from "../types/types";
import { FTHTMLFunction } from "../../model/functions";
import { FTHTMLMacros } from "../../model/macros";

abstract class FTHTMLangConfig {
    static stringSymbols: string[] = [`'`, `"`];
    static pragmas: string[] = ['vars', 'tinytemplates', 'templates', 'if', 'else', 'elif', 'end', 'debug', 'ifdef'];
    static operators: string[] = ['eq', 'ne', 'ie', 'gt', 'lt', 'ge', 'le', 'contains', 'icontains', 'starts', 'ends', 'istarts', 'iends', 'match', 'imatch'];
    static keywords: string[] = ['doctype', 'comment', 'import', 'each'];

    static isWhitespace(ch: TYPES.char): boolean {
        return !!~[' ', '\r', '\n', '\t'].indexOf(ch);
    }

    static isIdentifierChar(ch: TYPES.char): boolean {
        return /[\w-]/.test(ch);
    }

    static isValidSymbol(ch: TYPES.char): boolean {
        return !!~['{', '}', '(', ')', '='].indexOf(ch);
    }
}

export default {
    stringSymbols: FTHTMLangConfig.stringSymbols,
    pragmas: FTHTMLangConfig.pragmas,
    keywords: FTHTMLangConfig.keywords,
    operators: FTHTMLangConfig.operators,
    rules: {
        isWhitespace: FTHTMLangConfig.isWhitespace,
        isIdentifierChar: FTHTMLangConfig.isIdentifierChar,
        isValidSymbol: FTHTMLangConfig.isValidSymbol
    },
    elangs: {
        js: {
            stringSymbols: [...FTHTMLangConfig.stringSymbols, '`']
        },
        css: {
            stringSymbols: FTHTMLangConfig.stringSymbols
        }
    },
    functions: FTHTMLFunction.ALL,
    macros: FTHTMLMacros.ALL
} as const;