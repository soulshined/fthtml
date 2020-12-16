"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fthtml_parser_1 = require("./parser/fthtml-parser");
console.warn(`DEPRECATED: The 'template' keyword is now deprecated. Preparring for a future release; moving forward the import keyword will handle imports and template imports\n`);
function compile(src) {
    return new fthtml_parser_1.ftHTMLParser().compile(src);
}
exports.compile = compile;
function renderFile(file) {
    return new fthtml_parser_1.ftHTMLParser().renderFile(file);
}
exports.renderFile = renderFile;
