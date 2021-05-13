"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const abstract_1 = require("./abstract");
class Random extends abstract_1.AbstractFunction {
    constructor() {
        super(false);
        this._argPatterns = [
            {
                types: [
                    "String",
                    "Variable",
                    "Literal Variable",
                    "Word",
                    "Function"
                ],
                name: 'min'
            },
            {
                types: [
                    "String",
                    "Variable",
                    "Literal Variable",
                    "Word",
                    "Function"
                ],
                name: 'max'
            }
        ];
    }
    do(min, max) {
        if (!utils_1.Utils.String.isInteger(min))
            return new abstract_1.Result(min, true, 'Min range value is not a valid number');
        if (!utils_1.Utils.String.isInteger(max))
            return new abstract_1.Result(max, true, 'Max range value is not a valid number');
        min = +min, max = +max;
        if (max < min || min > max)
            return new abstract_1.Result('', true, 'Range is invalid');
        if (min < 0 && max < 0) {
            const _min = Math.abs(max), _max = Math.abs(min);
            return new abstract_1.Result(-(~~(Math.random() * (_max - _min + 1) + _min)));
        }
        return new abstract_1.Result(~~(Math.random() * (max - min + 1) + min));
    }
}
exports.Random = Random;
//# sourceMappingURL=random.js.map