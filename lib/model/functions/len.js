"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const abstract_1 = require("./abstract");
const utils_1 = require("../../utils");
class Len extends abstract_1.AbstractFunction {
    constructor() {
        super(false, true, true);
        this._argPatterns = [
            {
                types: [
                    "String",
                    "Variable",
                    "Literal Variable",
                    "Function",
                    "Word"
                ],
                name: 'value'
            }
        ];
    }
    do(entry) {
        if (["Variable", "Literal Variable"].includes(entry[1]) && !(typeof entry[0] === 'string')) {
            if (utils_1.Utils.Types.isArray(entry[0]))
                return new abstract_1.Result(entry[0].length);
            if (utils_1.Utils.Types.isObject(entry[0]))
                return new abstract_1.Result(Object.keys(entry[0]).length);
        }
        return new abstract_1.Result(`${entry[0]}`.length);
    }
}
exports.Len = Len;
//# sourceMappingURL=len.js.map