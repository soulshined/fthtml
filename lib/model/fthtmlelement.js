"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class FTHTMLElement {
    constructor(token, parsedValue, children = [], attrs) {
        this._isParentElement = false;
        this._attrs = attrs;
        this._token = token;
        this.children = children;
        this.parsedValue = parsedValue;
    }
    get isParentElement() {
        return this._isParentElement;
    }
    set isParentElement(v) {
        this._isParentElement = v;
    }
    get parsedValue() {
        return this._parsedValue;
    }
    set parsedValue(v) {
        this._parsedValue = v;
    }
    get childrenStart() {
        return this._childrenStart;
    }
    set childrenStart(v) {
        this._childrenStart = v;
    }
    get childrenEnd() {
        return this._childrenEnd;
    }
    set childrenEnd(v) {
        this._childrenEnd = v;
    }
    get children() {
        return this._children;
    }
    set children(v) {
        this._children = v;
    }
    get attrs() {
        return this._attrs;
    }
    set attrs(v) {
        this._attrs = v;
    }
    get token() {
        return this._token;
    }
    clone() {
        var _a;
        const newElement = new FTHTMLElement(this.token.clone(), this.parsedValue);
        newElement.children = this.children.map(c => c.clone());
        newElement.attrs = (_a = this.attrs) === null || _a === void 0 ? void 0 : _a.clone();
        newElement.isParentElement = this.isParentElement;
        newElement.childrenStart = this.childrenStart;
        newElement.childrenEnd = this.childrenEnd;
        return newElement;
    }
}
exports.FTHTMLElement = FTHTMLElement;
(function (FTHTMLElement) {
    class Attributes extends Map {
        get default() {
            return new Attributes([
                ['id', []],
                ['classes', []],
                ['kvps', []],
                ['misc', []]
            ]);
        }
        clone() {
            return new Attributes([
                ['id', [...this.get('id')]],
                ['classes', [...this.get('classes')]],
                ['kvps', [...this.get('kvps')]],
                ['misc', [...this.get('misc')]]
            ]);
        }
    }
    FTHTMLElement.Attributes = Attributes;
    let TinyTemplate;
    (function (TinyTemplate) {
        function create(value, origin, element, attrs) {
            return {
                element,
                attrs,
                value,
                origin,
                clone: () => { var _a, _b; return create(value.clone(), origin, (_a = element) === null || _a === void 0 ? void 0 : _a.clone(), (_b = attrs) === null || _b === void 0 ? void 0 : _b.clone()); }
            };
        }
        TinyTemplate.create = create;
    })(TinyTemplate = FTHTMLElement.TinyTemplate || (FTHTMLElement.TinyTemplate = {}));
})(FTHTMLElement = exports.FTHTMLElement || (exports.FTHTMLElement = {}));
//# sourceMappingURL=fthtmlelement.js.map