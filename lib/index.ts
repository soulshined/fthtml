import { HTMLBuilder } from "./model/html-builder";
import { FTHTMLParser } from "./parser/fthtml-parser";
import * as path from "path";
import parseFTHTMLConfig from "../cli/utils/user-config-helper";
import configs from "../cli/utils/user-config";
import { html_beautify } from "js-beautify";

export async function compile(src: string, configPath?: string) {
    const configs = await getConfigsForPath(configPath);
    let html = HTMLBuilder.getDisclaimer();
    html += new FTHTMLParser(configs).compile(src);
    if (configs.prettify)
        return beautify(html);

    return html;
}
export async function renderFile(file: string, configPath?: string) {
    const configs = await getConfigsForPath(configPath);
    let html = HTMLBuilder.getDisclaimer();
    html += new FTHTMLParser(configs).renderFile(file);
    if (configs.prettify)
        return beautify(html);

    return html;
}

async function getConfigsForPath(configPath?: string) {
    let uconfig = undefined;
    if (configPath) {
        if (!path.isAbsolute(configPath)) {
            console.error(`Config paths can only be absolute paths. Omitting '${configPath}'`);
        }
        else {
            const getConfig = await parseFTHTMLConfig(configPath);
            if (getConfig.fileExists)
                uconfig = getConfig.configs;
            else {
                console.error(`Config paths can only be absolute paths. '${configPath}' does not exist or can't be found`);
            }
        }
    }

    if (uconfig?.isdebug)
        console.log("fthtmlconfig =>", uconfig);

    return uconfig ?? (await configs).configs;
}

function beautify(src) {
    return html_beautify(src, {
        indent_char: " ",
        indent_scripts: "normal",
        indent_size: 4,
        indent_with_tabs: false,
        preserve_newlines: true
    })
}