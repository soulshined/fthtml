import { ftHTMLParser } from "./parser/fthtml-parser";

console.warn(`DEPRECATED: The 'template' keyword is now deprecated. Preparring for a future release; moving forward the import keyword will handle imports and template imports\n`);

export function compile(src: string) {
    return new ftHTMLParser().compile(src);
}
export function renderFile(file: string) {
    return new ftHTMLParser().renderFile(file);
}