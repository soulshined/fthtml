import { Utils } from "../../utils";
import { Token } from "../token";
import { AbstractFunction, Result } from "./abstract"

export class Sort extends AbstractFunction {
    private sortTypes = ['asc', 'desc'];

    constructor() {
        super(true, false, true);

        this._argPatterns = [
            {
                types: [
                    Token.TYPES.STRING,
                    Token.TYPES.VARIABLE,
                    Token.TYPES.LITERAL_VARIABLE,
                    Token.TYPES.FUNCTION
                ],
                name: 'value'
            },
            {
                types: [
                    Token.TYPES.STRING,
                    Token.TYPES.WORD
                ],
                name: "Sort Type",
                isOptional: true,
                enum: this.sortTypes,
                default: 'asc'
            },
            {
                types: [
                    Token.TYPES.WORD
                ],
                name: "Member Name",
                isOptional: true
            }
        ];

    }

    do(value: any, sortType: string = 'asc', onMember?: string) {
        let arr: any[] = value;
        if (!this.sortTypes.includes(sortType.toLowerCase()))
            return new Result('sort type', true, `Invalid sort type '${sortType}'. Expecting any of: ${this.sortTypes.join(", ")}`);
        else if (onMember && (!Utils.Types.isArray(arr) || !arr.every(Utils.Types.isObject)))
            return new Result('Member Name', true, `Invalid value type to sort by member name. Expecting Object[] but got ${value.constructor.name}`);
        else if (onMember && Utils.Types.isArray(arr) && arr.every(Utils.Types.isObject)) {
            if (arr.some(e => e[onMember] === undefined))
                return new Result('Member Name', true, `Member '${onMember}' does not exist on all objects`)

            return new Result(this.sortCompare(arr, sortType, onMember));
        }

        if (Utils.Types.isObject(arr))
            return new Result(this.sortCompare(Object.keys(arr), sortType));
        else return new Result(this.sortCompare(arr, sortType));
    }

    private sortCompare(value: any, sortType: string = 'asc', onMember?: string) {
        let v = value;
        let compareType = 'number';
        if (Utils.Types.isTypeOf(v, 'string', String))
            v = value.split('');

        else if ((value as any[]).every(e => Utils.Types.isTypeOf(e, 'string', String)))
            compareType = 'string';

        v = v.slice(0);
        if (onMember) {
            v.sort((a, b) => {
                if (sortType === 'desc') {
                    if (Utils.Types.isTypeOf(a[onMember], 'string', String) && Utils.Types.isTypeOf(b[onMember], 'string', String))
                        return b[onMember].localeCompare(a[onMember]);

                    return b[onMember] - a[onMember];
                }

                if (Utils.Types.isTypeOf(a[onMember], 'string', String) && Utils.Types.isTypeOf(b[onMember], 'string', String))
                    return a[onMember].localeCompare(b[onMember]);

                return a[onMember] - b[onMember];
            })

            return v;
        }

        v.sort((a, b) => {
            if (sortType === 'desc') {
                if (Utils.Types.isTypeOf(value, 'string', String) || compareType === 'string')
                    return b.localeCompare(a);

                return b - a;
            }

            if (Utils.Types.isTypeOf(value, 'string', String) || compareType === 'string')
                return a.localeCompare(b);

            return a - b;
        })

        if (Utils.Types.isTypeOf(value, 'string', String))
            return v.join('');

        return v;
    }
}