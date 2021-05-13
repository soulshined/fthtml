"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const abstract_1 = require("./abstract");
class Choose extends abstract_1.AbstractFunction {
    constructor() {
        super(false);
        this._argPatterns = [
            {
                types: [
                    "String",
                    "Variable",
                    "Literal Variable",
                    "Word",
                    "Function",
                    "Macro"
                ],
                name: 'value',
                isRestParameter: true
            }
        ];
    }
    do(...values) {
        return new abstract_1.Result(values[Math.floor(Math.random() * values.length)]);
    }
}
exports.Choose = Choose;
//# sourceMappingURL=choose.js.map