"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const abstract_1 = require("../abstract");
class AbstractPragma extends abstract_1.AbstractBlock {
    constructor(base, pragma, ...args) {
        super(base);
        this.parse(pragma, ...args);
    }
    get value() {
        return this._value;
    }
}
exports.AbstractPragma = AbstractPragma;
//# sourceMappingURL=abstract.js.map