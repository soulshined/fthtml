"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const abstract_1 = require("./abstract");
class Join extends abstract_1.AbstractFunction {
    constructor() {
        super(true, false, true);
        this._argPatterns = [
            {
                types: [
                    "Variable",
                    "Literal Variable",
                    'Function_keys',
                    'Function_values',
                    'Function_sort',
                    'Function_str_split',
                    'Function_range'
                ],
                name: 'value'
            },
            {
                types: [
                    "String",
                    "Variable",
                    "Literal Variable"
                ],
                name: 'delimiter',
                isOptional: true,
                default: ', '
            }
        ];
    }
    do(value, delimiter) {
        delimiter = (delimiter !== null && delimiter !== void 0 ? delimiter : ', ');
        if (utils_1.Utils.Types.isArray(value))
            return new abstract_1.Result(value.join(delimiter));
        else if (utils_1.Utils.Types.isObject(value))
            return new abstract_1.Result(Object.keys(value).join(delimiter));
        return new abstract_1.Result(value, true, 'Value is not iterable');
    }
}
exports.Join = Join;
//# sourceMappingURL=join.js.map