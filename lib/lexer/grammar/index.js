"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions_1 = require("../../model/functions");
const macros_1 = require("../../model/macros");
class FTHTMLangConfig {
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
FTHTMLangConfig.stringSymbols = [`'`, `"`];
FTHTMLangConfig.pragmas = ['vars', 'tinytemplates', 'templates', 'if', 'else', 'elif', 'end', 'debug', 'ifdef'];
FTHTMLangConfig.operators = ['eq', 'ne', 'ie', 'gt', 'lt', 'ge', 'le', 'contains', 'icontains', 'starts', 'ends', 'istarts', 'iends', 'match', 'imatch'];
FTHTMLangConfig.keywords = ['doctype', 'comment', 'import', 'each'];
exports.default = {
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
    functions: functions_1.FTHTMLFunction.ALL,
    macros: macros_1.FTHTMLMacros.ALL
};
//# sourceMappingURL=index.js.map