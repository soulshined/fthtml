"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FTHTMLComment = ["Comment", "Block Comment"];
exports.FTHTMLString = ["String", "Variable"];
exports.FTHTMLBlock = ["Word", "ELang", "Keyword", "Function", "Macro", ...exports.FTHTMLString, ...exports.FTHTMLComment];
exports.FTHTMLChildren = [...exports.FTHTMLBlock, "Pragma"];
exports.FTHTMLTopLevelElements = ["Word", "ELang", "Function", "Macro", "Pragma", "Keyword", "Variable", ...exports.FTHTMLComment];
exports.FTHTMLOperator = ['Operator_eq', 'Operator_ne', 'Operator_gt', 'Operator_ge', 'Operator_lt', 'Operator_le', 'Operator_ie', 'Operator_contains', 'Operator_icontains', 'Operator_istarts', 'Operator_starts', 'Operator_iends', 'Operator_ends', 'Operator_match', 'Operator_imatch'];
var lexmode_1 = require("./lexmode");
exports.LEX_MODE = lexmode_1.LEX_MODE;
var token_1 = require("./token");
exports.TOKEN_TYPE = token_1.TOKEN_TYPE;
exports.TokenPosition = token_1.TokenPosition;
exports.Token = token_1.default;
exports.getTokenTypeForIdentifier = token_1.getTokenTypeForIdentifier;
//# sourceMappingURL=types.js.map