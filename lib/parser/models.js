"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function TinyTemplate(value, origin, element, attrs) {
    return {
        element,
        attrs,
        value,
        origin
    };
}
exports.TinyTemplate = TinyTemplate;
function FTHTMLElement(token, children = [], attrs) {
    return {
        token,
        children,
        attrs,
        isParentElement: false
    };
}
exports.FTHTMLElement = FTHTMLElement;
function ValueFTHTMLElement(token, parsedValue, children = [], attrs) {
    const element = FTHTMLElement(token, children, attrs);
    element.parsedValue = parsedValue;
    return element;
}
exports.ValueFTHTMLElement = ValueFTHTMLElement;
function ParentFTHTMLElement(token, children = [], attrs) {
    const element = FTHTMLElement(token, children, attrs);
    element.isParentElement = true;
    return element;
}
exports.ParentFTHTMLElement = ParentFTHTMLElement;
exports.DefaultAttributes = function () {
    return new Map([
        ['id', []],
        ['classes', []],
        ['misc', []],
        ['kvps', []]
    ]);
};
//# sourceMappingURL=models.js.map