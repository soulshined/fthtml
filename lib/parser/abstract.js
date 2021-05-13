"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AbstractParser {
    throwIfEOF(throwable) {
        if (this.isEOF)
            throw throwable;
    }
    get peek() {
        return this._input.peek();
    }
    consume() {
        return this._input.next();
    }
    get previous() {
        return this._input.previous();
    }
    get isEOF() {
        return this._input.eof();
    }
    get input() {
        return this._input;
    }
}
exports.AbstractParser = AbstractParser;
//# sourceMappingURL=abstract.js.map