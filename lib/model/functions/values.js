"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const abstract_1 = require("./abstract");
class Values extends abstract_1.AbstractFunction {
    constructor() {
        super(false);
        this._argPatterns = [
            {
                types: ["Literal Variable", "Variable"],
                name: 'value'
            }
        ];
    }
    do(obj) {
        if (utils_1.Utils.Types.isObject(obj))
            return new abstract_1.Result(Object.values(obj));
        return new abstract_1.Result(obj, true, 'Value is not a literal object');
    }
}
exports.Values = Values;
//# sourceMappingURL=values.js.map