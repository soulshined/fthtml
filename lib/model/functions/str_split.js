"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const abstract_1 = require("./abstract");
class StrSplit extends abstract_1.AbstractFunction {
    constructor() {
        super(true);
        this._argPatterns = [
            {
                types: [
                    "String",
                    "Variable",
                    "Literal Variable",
                    "Macro",
                    "Function"
                ],
                name: 'value'
            },
            {
                types: ["String", "Variable"],
                name: 'delimiter'
            }
        ];
    }
    do(value, delimiter) {
        return new abstract_1.Result(`${value}`.split(delimiter));
    }
}
exports.StrSplit = StrSplit;
//# sourceMappingURL=str_split.js.map