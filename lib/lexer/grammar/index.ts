import { char } from "../../../lib/lexer/types";
import functions from "./functions";
import macros from "./macros";

abstract class ftHTMLangConfig {
    static stringSymbols: string[] = [`'`, `"`];
    static pragmas: string[] = ['vars', 'end'];
    static keywords: string[] = ['doctype', 'comment', 'import'];

    static isWhitespace(ch: char): boolean {
        return !!~[' ', '\r', '\n', '\t'].indexOf(ch);
    }

    static isIdentifierChar(ch: char): boolean {
        return /[\w-]/.test(ch);
    }

    static isValidSymbol(ch: char): boolean {
        return !!~['{', '}', '(', ')', '='].indexOf(ch);
    }
}

export default {
    stringSymbols: ftHTMLangConfig.stringSymbols,
    pragmas: ftHTMLangConfig.pragmas,
    keywords: ftHTMLangConfig.keywords,
    rules: {
        isWhitespace: ftHTMLangConfig.isWhitespace,
        isIdentifierChar: ftHTMLangConfig.isIdentifierChar,
        isValidSymbol: ftHTMLangConfig.isValidSymbol
    },
    elangs: {
        js: {
            stringSymbols: [...ftHTMLangConfig.stringSymbols, '`']
        },
        css: {
            stringSymbols: ftHTMLangConfig.stringSymbols
        }
    },
    functions,
    macros
} as const;