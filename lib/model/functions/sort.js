"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const abstract_1 = require("./abstract");
class Sort extends abstract_1.AbstractFunction {
    constructor() {
        super(true, false, true);
        this.sortTypes = ['asc', 'desc'];
        this._argPatterns = [
            {
                types: [
                    "String",
                    "Variable",
                    "Literal Variable",
                    "Function"
                ],
                name: 'value'
            },
            {
                types: [
                    "String",
                    "Word"
                ],
                name: "Sort Type",
                isOptional: true,
                enum: this.sortTypes,
                default: 'asc'
            },
            {
                types: [
                    "Word"
                ],
                name: "Member Name",
                isOptional: true
            }
        ];
    }
    do(value, sortType = 'asc', onMember) {
        let arr = value;
        if (!this.sortTypes.includes(sortType.toLowerCase()))
            return new abstract_1.Result('sort type', true, `Invalid sort type '${sortType}'. Expecting any of: ${this.sortTypes.join(", ")}`);
        else if (onMember && (!utils_1.Utils.Types.isArray(arr) || !arr.every(utils_1.Utils.Types.isObject)))
            return new abstract_1.Result('Member Name', true, `Invalid value type to sort by member name. Expecting Object[] but got ${value.constructor.name}`);
        else if (onMember && utils_1.Utils.Types.isArray(arr) && arr.every(utils_1.Utils.Types.isObject)) {
            if (arr.some(e => e[onMember] === undefined))
                return new abstract_1.Result('Member Name', true, `Member '${onMember}' does not exist on all objects`);
            return new abstract_1.Result(this.sortCompare(arr, sortType, onMember));
        }
        if (utils_1.Utils.Types.isObject(arr))
            return new abstract_1.Result(this.sortCompare(Object.keys(arr), sortType));
        else
            return new abstract_1.Result(this.sortCompare(arr, sortType));
    }
    sortCompare(value, sortType = 'asc', onMember) {
        let v = value;
        let compareType = 'number';
        if (utils_1.Utils.Types.isTypeOf(v, 'string', String))
            v = value.split('');
        else if (value.every(e => utils_1.Utils.Types.isTypeOf(e, 'string', String)))
            compareType = 'string';
        v = v.slice(0);
        if (onMember) {
            v.sort((a, b) => {
                if (sortType === 'desc') {
                    if (utils_1.Utils.Types.isTypeOf(a[onMember], 'string', String) && utils_1.Utils.Types.isTypeOf(b[onMember], 'string', String))
                        return b[onMember].localeCompare(a[onMember]);
                    return b[onMember] - a[onMember];
                }
                if (utils_1.Utils.Types.isTypeOf(a[onMember], 'string', String) && utils_1.Utils.Types.isTypeOf(b[onMember], 'string', String))
                    return a[onMember].localeCompare(b[onMember]);
                return a[onMember] - b[onMember];
            });
            return v;
        }
        v.sort((a, b) => {
            if (sortType === 'desc') {
                if (utils_1.Utils.Types.isTypeOf(value, 'string', String) || compareType === 'string')
                    return b.localeCompare(a);
                return b - a;
            }
            if (utils_1.Utils.Types.isTypeOf(value, 'string', String) || compareType === 'string')
                return a.localeCompare(b);
            return a - b;
        });
        if (utils_1.Utils.Types.isTypeOf(value, 'string', String))
            return v.join('');
        return v;
    }
}
exports.Sort = Sort;
//# sourceMappingURL=sort.js.map