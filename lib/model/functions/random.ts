import { Utils } from "../../utils";
import { AbstractFunction, Result } from "./abstract";
import { Token } from "../token";

export class Random extends AbstractFunction {
    constructor() {
        super(false);

        this._argPatterns = [
            {
                types: [
                    Token.TYPES.STRING,
                    Token.TYPES.VARIABLE,
                    Token.TYPES.LITERAL_VARIABLE,
                    Token.TYPES.WORD,
                    Token.TYPES.FUNCTION
                ],
                name: 'min'
            },
            {
                types: [
                    Token.TYPES.STRING,
                    Token.TYPES.VARIABLE,
                    Token.TYPES.LITERAL_VARIABLE,
                    Token.TYPES.WORD,
                    Token.TYPES.FUNCTION
                ],
                name: 'max'
            }
        ];

    }
    do(min: number | string, max: number | string) {
        if (!Utils.String.isInteger(min))
            return new Result(min, true, 'Min range value is not a valid number');

        if (!Utils.String.isInteger(max))
            return new Result(max, true, 'Max range value is not a valid number');

        min = +min, max = +max;

        if (max < min || min > max)
            return new Result('', true, 'Range is invalid');

        if (min < 0 && max < 0) {
            const _min = Math.abs(max),
                  _max = Math.abs(min);
            return new Result(-(~~(Math.random() * (_max - _min + 1) + _min)));
        }

        return new Result(~~(Math.random() * (max - min + 1) + min));
    }
}