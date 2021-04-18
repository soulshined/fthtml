"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_1 = require("../lexer/token");
const exceptions_1 = require("./exceptions");
function getAllMatches(str, regexp) {
    let match;
    let matches = [];
    while ((match = regexp.exec(str)) !== null) {
        matches.push([...match]);
    }
    return matches;
}
exports.getAllMatches = getAllMatches;
function endsEscaped(str) {
    return !!(str.match(/[\\]*$/)[0].length % 2);
}
exports.endsEscaped = endsEscaped;
function isExpectedType(actual, expected) {
    return actual && (actual.type === expected || `${actual.type}_${actual.value}` === expected);
}
exports.isExpectedType = isExpectedType;
function isOneOfExpectedTypes(actual, expected) {
    return actual && (expected.includes(actual.type) || expected.includes(`${actual.type}_${actual.value}`));
}
exports.isOneOfExpectedTypes = isOneOfExpectedTypes;
function isInteger(value) {
    return /^-?\d+$/.test(value);
}
exports.isInteger = isInteger;
function isNumber(value) {
    return /^(-?\d+|-?\d+.\d+)$/.test(value);
}
exports.isNumber = isNumber;
function testMatchViaUserPattern(query, regexp, flags) {
    var _a;
    try {
        return new RegExp((_a = regexp.parsedValue, (_a !== null && _a !== void 0 ? _a : regexp.token.value)), flags).test(query);
    }
    catch (error) {
        throw new exceptions_1.ftHTMLParserError(error.message, regexp.token);
    }
}
exports.testMatchViaUserPattern = testMatchViaUserPattern;
function lowercase(val) {
    return val.toString().toLowerCase();
}
exports.lowercase = lowercase;
function cloneAttributes(attrs) {
    if (attrs === undefined)
        return;
    const result = new Map();
    result.set('id', [...attrs.get('id')]);
    result.set('classes', [...attrs.get('classes')]);
    result.set('kvps', [...attrs.get('kvps')]);
    result.set('misc', [...attrs.get('misc')]);
    return result;
}
exports.cloneAttributes = cloneAttributes;
function cloneElement(aElement) {
    if (aElement === undefined)
        return;
    return {
        parsedValue: aElement.parsedValue,
        token: token_1.clone(aElement.token),
        isParentElement: aElement.isParentElement,
        children: aElement.children.map(cloneElement),
        attrs: cloneAttributes(aElement.attrs)
    };
}
exports.cloneElement = cloneElement;
//# sourceMappingURL=functions.js.map