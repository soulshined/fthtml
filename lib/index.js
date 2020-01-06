"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fthtml_parser_1 = require("./parser/fthtml-parser");
function compile(src) {
    return new fthtml_parser_1.ftHTMLParser().compile(src);
}
exports.compile = compile;
function renderFile(file) {
    return new fthtml_parser_1.ftHTMLParser().renderFile(file);
}
exports.renderFile = renderFile;
