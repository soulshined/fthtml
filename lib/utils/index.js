"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fthtml_exceptions_1 = require("../model/exceptions/fthtml-exceptions");
var Utils;
(function (Utils) {
    let Regex;
    (function (Regex) {
        function getAllMatches(str, regexp) {
            let match;
            let matches = [];
            while ((match = regexp.exec(str)) !== null) {
                matches.push([...match]);
            }
            return matches;
        }
        Regex.getAllMatches = getAllMatches;
        function testMatchViaUserPattern(query, regexp, flags) {
            var _a;
            try {
                return new RegExp((_a = regexp.parsedValue, (_a !== null && _a !== void 0 ? _a : regexp.token.value)), flags).test(query);
            }
            catch (error) {
                throw new fthtml_exceptions_1.FTHTMLExceptions.Parser(error.message, regexp.token);
            }
        }
        Regex.testMatchViaUserPattern = testMatchViaUserPattern;
    })(Regex = Utils.Regex || (Utils.Regex = {}));
    let String;
    (function (String) {
        function lowercase(val) {
            return val.toString().toLowerCase();
        }
        String.lowercase = lowercase;
        function endsEscaped(str) {
            return !!(str.match(/[\\]*$/)[0].length % 2);
        }
        String.endsEscaped = endsEscaped;
        function isInteger(value) {
            return /^-?\d+$/.test(value);
        }
        String.isInteger = isInteger;
        function IsUInt(value) {
            return /^\d+$/.test(value);
        }
        String.IsUInt = IsUInt;
        function isNumber(value) {
            return /^(-?\d+|-?\d+.\d+)$/.test(value);
        }
        String.isNumber = isNumber;
        function isDigit(ch) {
            return /^\d$/.test(ch);
        }
        String.isDigit = isDigit;
        function isLetter(ch) {
            return /^[a-zA-Z]$/.test(ch);
        }
        String.isLetter = isLetter;
        function isBoolean(value) {
            return /^(true|false)$/i.test(value);
        }
        String.isBoolean = isBoolean;
    })(String = Utils.String || (Utils.String = {}));
    let Types;
    (function (Types) {
        function isTypeOf(val, expecting, constructor) {
            if (constructor)
                return typeof val === expecting && val.constructor === constructor;
            return typeof val === expecting;
        }
        Types.isTypeOf = isTypeOf;
        function isObject(val) {
            return isTypeOf(val, 'object', Object);
        }
        Types.isObject = isObject;
        function isArray(val) {
            return Array.isArray(val);
        }
        Types.isArray = isArray;
        function isNumber(val) {
            return isTypeOf(val, 'number');
        }
        Types.isNumber = isNumber;
        function cast(val) {
            if (isTypeOf(val, 'string')) {
                if (String.isBoolean(val))
                    return Boolean(val);
                else if (String.isNumber(val))
                    return +val;
            }
            return val;
        }
        Types.cast = cast;
    })(Types = Utils.Types || (Utils.Types = {}));
    let Assert;
    (function (Assert) {
        function equals(a, b, case_sensitive = true) {
            if (a === b)
                return true;
            if (a == null || b == null)
                return false;
            if (a.length !== b.length)
                return false;
            if (typeof a !== typeof b || a.constructor !== b.constructor)
                return false;
            if (Types.isArray(a) && Types.isArray(b)) {
                for (let i = 0; i < a.length; ++i)
                    if (!equals(a[i], b[i], case_sensitive))
                        return false;
                return true;
            }
            else if (Types.isObject(a) && Types.isObject(b)) {
                const aProps = Object.getOwnPropertyNames(a);
                const bProps = Object.getOwnPropertyNames(b);
                if (aProps.length != bProps.length)
                    return false;
                for (let i = 0; i < aProps.length; i++) {
                    const prop = aProps[i];
                    if (!equals(a[prop], b[prop], case_sensitive))
                        return false;
                }
                return true;
            }
            else if (Types.isNumber(a) && Types.isNumber(b))
                return a === b;
            else
                return case_sensitive
                    ? a === b
                    : a.toLowerCase() === b.toLowerCase();
        }
        Assert.equals = equals;
        function contains(needle, haystack, case_sensitive = true) {
            if (Types.isArray(haystack)) {
                if (case_sensitive)
                    return Array.from(haystack).includes(needle);
                const arr = Array.from(haystack).map(m => {
                    if (typeof m === 'string')
                        return m.toLowerCase();
                    return m;
                });
                return arr.includes(typeof needle === 'string' ? needle.toLowerCase() : needle);
            }
            else if (Types.isObject(haystack)) {
                if (case_sensitive)
                    return Object.keys(haystack).includes(needle);
                return Object.keys(haystack).map(m => {
                    if (typeof m === 'string')
                        return m.toLowerCase();
                    return m;
                }).includes(typeof needle === 'string' ? needle.toLowerCase() : needle);
            }
            else {
                if (!case_sensitive)
                    return haystack.toLowerCase().includes(needle.toLowerCase());
                return haystack.includes(needle);
            }
        }
        Assert.contains = contains;
    })(Assert = Utils.Assert || (Utils.Assert = {}));
})(Utils = exports.Utils || (exports.Utils = {}));
//# sourceMappingURL=index.js.map