import { ftHTMLParser } from "./parser/fthtml-parser";
import { HTMLBuilder } from "./utils/html-builder";

export function compile(src: string) {
    let html = HTMLBuilder.getDisclaimer();
    html += new ftHTMLParser().compile(src);
    return html;
}
export function renderFile(file: string) {
    let html = HTMLBuilder.getDisclaimer();
    html += new ftHTMLParser().renderFile(file);
    return html;
}