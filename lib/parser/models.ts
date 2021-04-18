import { token } from "../lexer/token";
import { Tokenable } from "../lexer/types";
import { IFTHTMLElement, ITinyTemplate } from "./types";

export function TinyTemplate(value: token, origin: string, element?: Tokenable, attrs?: Map<string, IFTHTMLElement[]>): ITinyTemplate {
    return {
        element,
        attrs,
        value,
        origin
    }
}

export function FTHTMLElement(token: token, children: IFTHTMLElement[] = [], attrs?:  Map<string, IFTHTMLElement[]>) : IFTHTMLElement {
    return {
        token,
        children,
        attrs,
        isParentElement : false
    }
}

export function ValueFTHTMLElement(token: token, parsedValue: string, children: IFTHTMLElement[] = [], attrs?:  Map<string, IFTHTMLElement[]>): IFTHTMLElement {
    const element = FTHTMLElement(token, children, attrs);
    element.parsedValue = parsedValue;
    return element;
}

export function ParentFTHTMLElement(token: token, children: IFTHTMLElement[] = [], attrs?:  Map<string, IFTHTMLElement[]>): IFTHTMLElement {
    const element = FTHTMLElement(token, children, attrs);
    element.isParentElement = true;
    return element;
}

export const DefaultAttributes = function () {
    return new Map<string, IFTHTMLElement[]>([
        ['id', []],
        ['classes', []],
        ['misc', []],
        ['kvps', []]
    ])
}