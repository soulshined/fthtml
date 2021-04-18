import { token, tokenposition } from "../lexer/token";
import { Tokenable } from "../lexer/types";

export interface ITinyTemplate {
    element?: Tokenable,
    attrs?: Map<string, IFTHTMLElement[]>,
    value: token,
    origin: string,
}

export interface IFTHTMLElement {
    token: token,
    children: IFTHTMLElement[],
    childrenStart?: tokenposition,
    childrenEnd?: tokenposition,
    attrs: Map<string, IFTHTMLElement[]>,
    isParentElement: boolean,
    parsedValue?: string
}