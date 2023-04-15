"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const abstract_1 = require("./abstract");
const utils_1 = require("../../utils");
class Fallback extends abstract_1.AbstractFunction {
    constructor() {
        super(true);
        this._argPatterns = [
            {
                types: [
                    "Function",
                    "Literal Variable",
                    "String",
                    "Variable"
                ],
                name: 'value'
            },
            {
                types: [
                    "String",
                    "Variable",
                    "Literal Variable",
                    "Function"
                ],
                name: 'default'
            }
        ];
    }
    do(value, defaultValue) {
        let result = value;
        if (value === undefined || value === null)
            result = defaultValue;
        if (utils_1.Utils.Types.isArray(value))
            result = value.length === 0
                ? defaultValue
                : value;
        else if (utils_1.Utils.Types.isObject(value))
            result = Object.keys(value).length === 0
                ? defaultValue
                : value;
        else if (utils_1.Utils.Types.isTypeOf(value, 'string')) {
            if (value.trim().length === 0)
                result = defaultValue;
        }
        return new abstract_1.Result(result);
    }
}
exports.Fallback = Fallback;
//# sourceMappingURL=fallback.js.map