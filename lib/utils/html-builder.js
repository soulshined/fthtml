"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../lexer/types");
const functions_1 = require("./functions");
const self_closing_tags_1 = require("./self-closing-tags");
class HTMLBuilder {
    static build(elements) {
        return elements.reduce((prev, curr) => prev += HTMLBuilder.buildTag(curr), '');
    }
    static buildTag(element) {
        var _a, _b, _c;
        if (types_1.FTHTMLComment.includes(element.token.type))
            return '';
        if (element.token.type === "Word") {
            if (self_closing_tags_1.SELF_CLOSING_TAGS.includes(element.token.value))
                return _a = element.parsedValue, (_a !== null && _a !== void 0 ? _a : `<${element.token.value}${HTMLBuilder.buildAttributes(element.attrs)}/>`);
            return _b = element.parsedValue, (_b !== null && _b !== void 0 ? _b : `<${element.token.value}${HTMLBuilder.buildAttributes(element.attrs)}>${HTMLBuilder.build(element.children)}</${element.token.value}>`);
        }
        else if (functions_1.isExpectedType(element.token, 'Pragma_if')) {
            return _c = element.parsedValue, (_c !== null && _c !== void 0 ? _c : '');
        }
        else if (element.parsedValue !== undefined && !functions_1.isExpectedType(element.token, 'Pragma_debug')) {
            return element.parsedValue;
        }
        else if (HTMLBuilder.shouldReturnTokenValue(element.token) && element.children.length > 0)
            return HTMLBuilder.build(element.children);
        else if (HTMLBuilder.shouldReturnTokenValue(element.token))
            return element.token.value;
        else
            return '';
    }
    static buildAttributes(attrs) {
        if (!attrs)
            return '';
        const result = [], id = attrs.get('id'), classes = attrs.get('classes'), misc = attrs.get('misc'), kvps = attrs.get('kvps');
        if (id.length > 0)
            result.push(`id="${id[0].parsedValue}"`);
        if (classes.length > 0)
            result.push(`class="${[...new Set(classes.map(c => c.parsedValue))].join(" ")}"`);
        if (kvps.length > 0)
            result.push([...new Set(kvps.map(kvp => `${kvp.token.value}="${kvp.children[0].parsedValue}"`))].join(" "));
        if (misc.length > 0)
            result.push([...new Set(misc.map(m => m.parsedValue))].join(" "));
        return result.length > 0
            ? ` ${result.join(" ")}`
            : '';
    }
    static shouldReturnTokenValue(token) {
        return !["Pragma"].includes(token.type) && !(token.type === "Keyword" && token.value === 'import');
    }
    static getDisclaimer() {
        return `<!--

        Made with ftHTML - and a side of love.

        Created by David Freer

        Learn more about ftHTML and why it's so fun to use at https://fthtml.com

-->`;
    }
}
exports.HTMLBuilder = HTMLBuilder;
//# sourceMappingURL=html-builder.js.map