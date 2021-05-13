"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const abstract_1 = require("./abstract");
class Range extends abstract_1.AbstractFunction {
    constructor() {
        super(true);
        this._argPatterns = [
            {
                types: ['Function_len', "Word"],
                name: 'start'
            },
            {
                types: ['Function_len', "Word"],
                name: 'end',
                isOptional: true
            }
        ];
    }
    do(start, end) {
        if (!utils_1.Utils.String.isInteger(start))
            return new abstract_1.Result(start, true, 'Start range value is not a valid number');
        start = +start;
        if (end === undefined || end === null)
            return new abstract_1.Result(Array.from({ length: start }, (x, i) => i));
        if (!utils_1.Utils.String.isInteger(end))
            return new abstract_1.Result(end, true, 'End range value is not a valid number');
        end = +end;
        if (start > end || start < 0)
            return new abstract_1.Result(start, true, 'Start can not be greater than end value or less than 0');
        if (end < start || end < 1)
            return new abstract_1.Result(end, true, 'End can not be less than start value or less than 1');
        if (start === end)
            return new abstract_1.Result(start, true, 'Start and end can not have the same value');
        return new abstract_1.Result(Array.from({ length: end - start }, (x, i) => i + start));
    }
}
exports.Range = Range;
//# sourceMappingURL=range.js.map