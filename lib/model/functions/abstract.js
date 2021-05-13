"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Result {
    constructor(value, error = false, msg) {
        this._error = error;
        this._msg = msg;
        this._value = value;
    }
    get value() {
        return this._value;
    }
    get error() {
        return this._error;
    }
    get msg() {
        return this._msg;
    }
}
exports.Result = Result;
class AbstractFunction {
    constructor(isSequenceStrict, returnTokenTypes = false, useLiteralVariable = false) {
        this.isArgsSequenceStrict = isSequenceStrict;
        this.shouldReturnTokenTypes = returnTokenTypes;
        this.shouldUseLiteralVariable = useLiteralVariable;
    }
    get argPatterns() {
        return this._argPatterns;
    }
}
exports.AbstractFunction = AbstractFunction;
//# sourceMappingURL=abstract.js.map