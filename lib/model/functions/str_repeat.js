"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const abstract_1 = require("./abstract");
class StrRepeat extends abstract_1.AbstractFunction {
    constructor() {
        super(true);
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
            },
            {
                types: ["String", "Word"],
                name: 'quantity'
            }
        ];
    }
    do(value, quantity) {
        value = `${value}`;
        if (!utils_1.Utils.String.isInteger(quantity))
            return new abstract_1.Result(value, true, 'Repeat quantity is not a valid number');
        return new abstract_1.Result(value.repeat(Math.max(+quantity + 1, 1)));
    }
}
exports.StrRepeat = StrRepeat;
//# sourceMappingURL=str_repeat.js.map