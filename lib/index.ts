import { ftHTMLParser } from "./parser/fthtml-parser";

export function compile(src: string) {
    return new ftHTMLParser().compile(src);
}
export function renderFile(file: string) {
    return new ftHTMLParser().renderFile(file);
}