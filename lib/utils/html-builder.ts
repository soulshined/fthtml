import { token, TOKEN_TYPE as TT } from "../lexer/token";
import { FTHTMLComment } from "../lexer/types";
import { IFTHTMLElement } from "../parser/types";
import { isExpectedType } from "./functions";
import { SELF_CLOSING_TAGS } from "./self-closing-tags";

export class HTMLBuilder {

    public static build(elements: IFTHTMLElement[]) {
        return elements.reduce((prev, curr) => prev += HTMLBuilder.buildTag(curr), '');
    }

    private static buildTag(element: IFTHTMLElement): string {
        if (FTHTMLComment.includes(element.token.type)) return '';
        if (element.token.type === TT.WORD) {
            if (SELF_CLOSING_TAGS.includes(element.token.value))
                return element.parsedValue ?? `<${element.token.value}${HTMLBuilder.buildAttributes(element.attrs)}/>`;

            return element.parsedValue ?? `<${element.token.value}${HTMLBuilder.buildAttributes(element.attrs)}>${HTMLBuilder.build(element.children)}</${element.token.value}>`;
        }
        else if (isExpectedType(element.token, 'Pragma_if')) {
            return element.parsedValue ?? '';
        }
        else if (element.parsedValue !== undefined && !isExpectedType(element.token, 'Pragma_debug')) {
            return element.parsedValue;
        }
        else if (HTMLBuilder.shouldReturnTokenValue(element.token) && element.children.length > 0)
            return HTMLBuilder.build(element.children);
        else if (HTMLBuilder.shouldReturnTokenValue(element.token))
            return element.token.value;
        else return '';
    }

    private static buildAttributes(attrs: Map<string, IFTHTMLElement[]>) {
        if (!attrs) return '';

        const result = [],
              id = attrs.get('id'),
              classes = attrs.get('classes'),
              misc = attrs.get('misc'),
              kvps = attrs.get('kvps');

        if (id.length > 0)
            result.push(`id="${id[0].parsedValue}"`);
        if (classes.length > 0)
            result.push(`class="${[...new Set(classes.map(c => c.parsedValue))].join(" ")}"`);
        if (kvps.length > 0)
            result.push([...new Set(kvps.map(kvp => `${kvp.token.value}="${kvp.children[0].parsedValue}"`))].join(" "))
        if (misc.length > 0)
            result.push([...new Set(misc.map(m => m.parsedValue))].join(" "));

        return result.length > 0
            ? ` ${result.join(" ")}`
            : '';
    }

    private static shouldReturnTokenValue(token: token) {
        return ![TT.PRAGMA].includes(token.type) && !(token.type === TT.KEYWORD && token.value === 'import');
    }

    public static getDisclaimer() {
    return `<!--

        Made with ftHTML - and a side of love.

        Created by David Freer

        Learn more about ftHTML and why it's so fun to use at https://fthtml.com

-->`
    }

}