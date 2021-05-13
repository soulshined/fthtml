"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const abstract_1 = require("./abstract");
class Replace extends abstract_1.AbstractFunction {
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
            { types: ["String"], name: 'pattern' },
            {
                types: [
                    "String",
                    "Variable",
                    "Function"
                ],
                name: 'replace'
            }
        ];
    }
    do(value, pattern, replace) {
        value = `${value}`;
        try {
            const regx = new RegExp(pattern, 'g');
            return new abstract_1.Result(value.replace(regx, replace));
        }
        catch (error) {
            return new abstract_1.Result(value, true, error.message);
        }
    }
}
exports.Replace = Replace;
//# sourceMappingURL=replace.js.map