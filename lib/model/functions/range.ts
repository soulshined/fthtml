import { Utils } from "../../utils";
import { Token } from "../token";
import { AbstractFunction, Result } from "./abstract";

export class Range extends AbstractFunction {
    constructor() {
        super(true);

        this._argPatterns = [
            {
                types: ['Function_len', Token.TYPES.WORD],
                name: 'start'
            },
            {
                types: ['Function_len', Token.TYPES.WORD],
                name: 'end',
                isOptional: true
            }
        ];

    }

    do(start: number, end: number) {
        if (!Utils.String.isInteger(start))
            return new Result(start, true, 'Start range value is not a valid number');

        start = +start;
        if (end === undefined || end === null)
            return new Result(Array.from({ length: start }, (x, i) => i));

        if (!Utils.String.isInteger(end))
            return new Result(end, true, 'End range value is not a valid number')

        end = +end;
        if (start > end || start < 0)
            return new Result(start, true, 'Start can not be greater than end value or less than 0');
        if (end < start || end < 1)
            return new Result(end, true, 'End can not be less than start value or less than 1');
        if (start === end)
            return new Result(start, true, 'Start and end can not have the same value');

        return new Result(Array.from({ length: end-start }, (x, i) => i + start));
    }
}