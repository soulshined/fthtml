"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const abstract_1 = require("./abstract");
class Substring extends abstract_1.AbstractFunction {
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
                types: ["String", "Variable", "Word"],
                name: 'start'
            },
            {
                types: ["String", "Variable", "Word"],
                name: 'end',
                isOptional: true
            }
        ];
    }
    do(value, start, end) {
        value = String.raw `${value}`;
        if (!utils_1.Utils.String.isInteger(start))
            return new abstract_1.Result(start, true, 'Start range value is not a valid number');
        if (!utils_1.Utils.String.isInteger(end))
            end = value.length;
        start = +start, end = +end;
        let result = value;
        if (start < 0) {
            if (end < 0 && end <= start)
                result = value.substring(Math.max(value.length + start, 0), value.length);
            else if (end < 0 && end >= start)
                result = value.substring(Math.max(value.length + start, 0), Math.max(start, value.length + end));
            else if (end < Math.max(value.length + start, 0))
                result = value.substring(Math.max(value.length + start, 0));
            else
                result = value.substring(Math.max(value.length + start, 0), end);
            return new abstract_1.Result(result);
        }
        if (end < start && end >= 0 ||
            end < 0 && value.length + end <= start) {
            result = value.substring(start);
        }
        else if (end < 0)
            result = value.substring(start, Math.max(value.length + end, start));
        else
            result = value.substring(start, end);
        return new abstract_1.Result(result);
    }
}
exports.Substring = Substring;
//# sourceMappingURL=substring.js.map