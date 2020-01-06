"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var lexmode_1 = require("./lexmode");
exports.LEX_MODE = lexmode_1.LEX_MODE;
var token_1 = require("./token");
exports.TOKEN_TYPE = token_1.TOKEN_TYPE;
exports.TokenPosition = token_1.TokenPosition;
exports.Token = token_1.default;
exports.getTokenTypeForIdentifier = token_1.getTokenTypeForIdentifier;
