"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions_1 = require("./functions");
const macros_1 = require("./macros");
class ftHTMLangConfig {
    static isWhitespace(ch) {
        return !!~[' ', '\r', '\n', '\t'].indexOf(ch);
    }
    static isIdentifierChar(ch) {
        return /[\w-]/.test(ch);
    }
    static isValidSymbol(ch) {
        return !!~['{', '}', '(', ')', '='].indexOf(ch);
    }
}
ftHTMLangConfig.stringSymbols = [`'`, `"`];
ftHTMLangConfig.pragmas = ['vars', 'tinytemplates', 'templates', 'end'];
ftHTMLangConfig.keywords = ['doctype', 'comment', 'import'];
exports.default = {
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
    functions: functions_1.default,
    macros: macros_1.default
};
