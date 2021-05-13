"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const abstract_1 = require("./abstract");
class StrReverse extends abstract_1.AbstractFunction {
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
        ];
    }
    do(value) {
        return new abstract_1.Result(`${value}`.split('').reverse().join(''));
    }
}
exports.StrReverse = StrReverse;
//# sourceMappingURL=str_reverse.js.map