"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const abstract_1 = require("../abstract");
class AbstractBlock extends abstract_1.AbstractParser {
    constructor(base) {
        super();
        this.base = base;
        this._input = base.input;
    }
    get uconfig() {
        return this.base.uconfig;
    }
    get vars() {
        return this.base.vars;
    }
    get shouldOmit() {
        return this.base.shouldOmit;
    }
    get tinyts() {
        return this.base.tinyts;
    }
}
exports.AbstractBlock = AbstractBlock;
//# sourceMappingURL=abstract.js.map