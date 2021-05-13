"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const html_builder_1 = require("./model/html-builder");
const fthtml_parser_1 = require("./parser/fthtml-parser");
const path = require("path");
const user_config_helper_1 = require("../cli/utils/user-config-helper");
const user_config_1 = require("../cli/utils/user-config");
const js_beautify_1 = require("js-beautify");
async function compile(src, configPath) {
    const configs = await getConfigsForPath(configPath);
    let html = html_builder_1.HTMLBuilder.getDisclaimer();
    html += new fthtml_parser_1.FTHTMLParser(configs).compile(src);
    if (configs.prettify)
        return beautify(html);
    return html;
}
exports.compile = compile;
async function renderFile(file, configPath) {
    const configs = await getConfigsForPath(configPath);
    let html = html_builder_1.HTMLBuilder.getDisclaimer();
    html += new fthtml_parser_1.FTHTMLParser(configs).renderFile(file);
    if (configs.prettify)
        return beautify(html);
    return html;
}
exports.renderFile = renderFile;
async function getConfigsForPath(configPath) {
    var _a;
    let uconfig = undefined;
    if (configPath) {
        if (!path.isAbsolute(configPath)) {
            console.error(`Config paths can only be absolute paths. Omitting '${configPath}'`);
        }
        else {
            const getConfig = await user_config_helper_1.default(configPath);
            if (getConfig.fileExists)
                uconfig = getConfig.configs;
            else {
                console.error(`Config paths can only be absolute paths. '${configPath}' does not exist or can't be found`);
            }
        }
    }
    if ((_a = uconfig) === null || _a === void 0 ? void 0 : _a.isdebug)
        console.log("fthtmlconfig =>", uconfig);
    return (uconfig !== null && uconfig !== void 0 ? uconfig : (await user_config_1.default).configs);
}
function beautify(src) {
    return js_beautify_1.html_beautify(src, {
        indent_char: " ",
        indent_scripts: "normal",
        indent_size: 4,
        indent_with_tabs: false,
        preserve_newlines: true
    });
}
//# sourceMappingURL=index.js.map