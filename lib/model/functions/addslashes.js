"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const abstract_1 = require("./abstract");
class AddSlashes extends abstract_1.AbstractFunction {
    constructor() {
        super(false);
        this._argPatterns = [
            {
                types: [
                    "String",
                    "Variable",
                    "Literal Variable",
                    "Function",
                    "Macro"
                ],
                name: 'value'
            }
        ];
    }
    do(value) {
        return new abstract_1.Result(`${value}`.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0'));
    }
}
exports.AddSlashes = AddSlashes;
//# sourceMappingURL=addslashes.js.map