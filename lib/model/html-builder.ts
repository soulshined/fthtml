import { Token } from "./token";
import { FTHTMLElement } from "./fthtmlelement";
import { SELF_CLOSING_TAGS } from "./self-closing-tags";

export class HTMLBuilder {

    public static build(elements: FTHTMLElement[]) {
        return elements.reduce((prev, curr) => prev += HTMLBuilder.buildTag(curr), '');
    }

    private static buildTag(element: FTHTMLElement): string {
        if (Token.Sequences.COMMENTS.includes(element.token.type as Token.TYPES)) return '';
        if (element.token.type === Token.TYPES.WORD) {
            if (SELF_CLOSING_TAGS.includes(element.token.value))
                return element.parsedValue ?? `<${element.token.value}${HTMLBuilder.buildAttributes(element.attrs)}/>`;

            return element.parsedValue ?? `<${element.token.value}${HTMLBuilder.buildAttributes(element.attrs)}>${HTMLBuilder.build(element.children)}</${element.token.value}>`;
        }
        else if (Token.isExpectedType(element.token, 'Pragma_if')) {
            return element.parsedValue ?? '';
        }
        else if (element.parsedValue !== undefined && !Token.isExpectedType(element.token, 'Pragma_debug')) {
            return element.parsedValue;
        }
        else if (HTMLBuilder.shouldReturnTokenValue(element.token) && element.children.length > 0)
            return HTMLBuilder.build(element.children);
        else if (HTMLBuilder.shouldReturnTokenValue(element.token))
            return element.token.value;
        else return '';
    }

    private static buildAttributes(attrs: Map<string, FTHTMLElement[]>) {
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

    private static shouldReturnTokenValue(token: Token<any>) {
        return ![Token.TYPES.PRAGMA].includes(token.type) && !(token.type === Token.TYPES.KEYWORD && token.value === 'import');
    }

    public static getDisclaimer() {
    return `<!--

        Made with ftHTML - and a side of love.

        Created by David Freer

        Learn more about ftHTML and why it's so fun to use at https://fthtml.com

-->`
    }

}