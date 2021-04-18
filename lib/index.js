"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fthtml_parser_1 = require("./parser/fthtml-parser");
const html_builder_1 = require("./utils/html-builder");
function compile(src) {
    let html = html_builder_1.HTMLBuilder.getDisclaimer();
    html += new fthtml_parser_1.ftHTMLParser().compile(src);
    return html;
}
exports.compile = compile;
function renderFile(file) {
    let html = html_builder_1.HTMLBuilder.getDisclaimer();
    html += new fthtml_parser_1.ftHTMLParser().renderFile(file);
    return html;
}
exports.renderFile = renderFile;
//# sourceMappingURL=index.js.map