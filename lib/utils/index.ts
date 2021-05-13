import { TYPES } from "../lexer/types/types";
import { FTHTMLExceptions } from "../model/exceptions/fthtml-exceptions";
import { FTHTMLElement } from "../model/fthtmlelement";

export namespace Utils {
    export namespace Regex {
        export function getAllMatches(str: string, regexp: RegExp): RegExpExecArray[] {
            let match: RegExpExecArray;
            let matches = [];
            while ((match = regexp.exec(str)) !== null) {
                matches.push([...match]);
            }
            return matches;
        }

        export function testMatchViaUserPattern(query: string, regexp: FTHTMLElement, flags?: string) {
            try { return new RegExp(regexp.parsedValue ?? regexp.token.value, flags).test(query); }
            catch (error) {
                throw new FTHTMLExceptions.Parser(error.message, regexp.token);
            }
        }
    }

    export namespace String {
        export function lowercase(val: any) {
            return val.toString().toLowerCase();
        }

        export function endsEscaped(str: string): boolean {
            return !!(str.match(/[\\]*$/)[0].length % 2);
        }

        //signed int
        export function isInteger(value: any) {
            return /^-?\d+$/.test(value);
        }

        //unsigned int
        export function IsUInt(value: any) {
            return /^\d+$/.test(value);
        }

        export function isNumber(value: any) {
            return /^(-?\d+|-?\d+.\d+)$/.test(value);
        }

        export function isDigit(ch: TYPES.char) {
            return /^\d$/.test(ch);
        }

        export function isLetter(ch: TYPES.char) {
            return /^[a-zA-Z]$/.test(ch);
        }

        export function isBoolean(value: any) {
            return /^(true|false)$/i.test(value);
        }
    }

    export namespace Types {
        export function isTypeOf(val, expecting, constructor?) {
            if (constructor)
                return typeof val === expecting && val.constructor === constructor;

            return typeof val === expecting;
        }

        export function isObject(val) {
            return isTypeOf(val, 'object', Object);
        }

        export function isArray(val) {
            return Array.isArray(val);
        }

        export function isNumber(val) {
            return isTypeOf(val, 'number');
        }

        export function cast(val) {
            if (isTypeOf(val, 'string')) {
                if (String.isBoolean(val)) return Boolean(val);
                else if (String.isNumber(val)) return +val;
            }

            return val;
        }
    }

    export namespace Assert {

        export function equals(a, b, case_sensitive: boolean = true) {
            if (a === b) return true;
            if (a == null || b == null) return false;
            if (a.length !== b.length) return false;

            if (typeof a !== typeof b || a.constructor !== b.constructor) return false;

            if (Types.isArray(a) && Types.isArray(b)) {
                for (let i = 0; i < a.length; ++i)
                    if (!equals(a[i], b[i], case_sensitive)) return false;

                return true;
            }
            else if (Types.isObject(a) && Types.isObject(b)) {
                const aProps = Object.getOwnPropertyNames(a);
                const bProps = Object.getOwnPropertyNames(b);

                if (aProps.length != bProps.length) return false;

                for (let i = 0; i < aProps.length; i++) {
                    const prop = aProps[i];
                    if (!equals(a[prop], b[prop], case_sensitive)) return false;
                }
                return true;
            }
            else if (Types.isNumber(a) && Types.isNumber(b)) return a === b;
            else return case_sensitive
                    ? a === b
                    : a.toLowerCase() === b.toLowerCase();
        }

        export function contains(needle, haystack, case_sensitive: boolean = true) {
            if (Types.isArray(haystack)) {
                if (case_sensitive)
                    return Array.from(haystack).includes(needle);

                const arr = Array.from(haystack).map(m => {
                    if (typeof m === 'string') return m.toLowerCase();
                    return m;
                })

                return arr.includes(typeof needle === 'string' ? needle.toLowerCase() : needle);
            }
            else if (Types.isObject(haystack)) {
                if (case_sensitive)
                    return Object.keys(haystack).includes(needle);

                return Object.keys(haystack).map(m => {
                    if (typeof m === 'string') return m.toLowerCase();
                    return m;
                }).includes(typeof needle === 'string' ? needle.toLowerCase() : needle);
            }
            else {
                if (!case_sensitive)
                    return (haystack as string).toLowerCase().includes((needle as string).toLowerCase());

                return (haystack as string).includes(needle as string);
            }
        }
    }
}