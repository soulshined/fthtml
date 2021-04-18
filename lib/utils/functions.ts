import { clone } from "../lexer/token";
import { token, TOKEN_TYPE as TT } from "../lexer/types";
import { IFTHTMLElement } from "../parser/types";
import { ftHTMLParserError } from "./exceptions";

export function getAllMatches(str: string, regexp: RegExp): RegExpExecArray[] {
    let match: RegExpExecArray;
    let matches = [];
    while ((match = regexp.exec(str)) !== null) {
        matches.push([...match]);
    }
    return matches;
}

export function endsEscaped(str: string): boolean {
    return !!(str.match(/[\\]*$/)[0].length % 2);
}

export function isExpectedType(actual: token, expected: TT | string): boolean {
    // NOTE [02-Jan-2020]: assumes eof is irrelevant
    return actual && (actual.type === expected || `${actual.type}_${actual.value}` === expected);
}

export function isOneOfExpectedTypes(actual: token, expected: (TT | string)[]): boolean {
    return actual && (expected.includes(actual.type) || expected.includes(`${actual.type}_${actual.value}`));
}

export function isInteger(value: any) {
    return /^-?\d+$/.test(value);
}

export function isNumber(value: any) {
    return /^(-?\d+|-?\d+.\d+)$/.test(value);
}

export function testMatchViaUserPattern(query: string, regexp: IFTHTMLElement, flags?: string) {
    try { return new RegExp(regexp.parsedValue ?? regexp.token.value, flags).test(query); }
    catch (error) {
        throw new ftHTMLParserError(error.message, regexp.token);
    }
}

export function lowercase(val: any) {
    return val.toString().toLowerCase();
}

export function cloneAttributes(attrs: Map<string, IFTHTMLElement[]>): Map<string, IFTHTMLElement[]> | undefined {
    if (attrs === undefined) return;

    const result: Map<string, IFTHTMLElement[]> = new Map();
    result.set('id', [...attrs.get('id')]);
    result.set('classes', [...attrs.get('classes')]);
    result.set('kvps', [...attrs.get('kvps')]);
    result.set('misc', [...attrs.get('misc')]);
    return result;
}

export function cloneElement(aElement: IFTHTMLElement): IFTHTMLElement | undefined {
    if (aElement === undefined) return;

    return {
        parsedValue: aElement.parsedValue,
        token: clone(aElement.token),
        isParentElement: aElement.isParentElement,
        children: aElement.children.map(cloneElement),
        attrs: cloneAttributes(aElement.attrs)
    }

}