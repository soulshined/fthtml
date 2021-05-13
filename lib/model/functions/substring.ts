import { Utils } from "../../utils";
import { AbstractFunction, Result } from "./abstract";
import { Token } from "../token";

export class Substring extends AbstractFunction {
    constructor() {
        super(true);

        this._argPatterns = [
            {
                types: [
                    Token.TYPES.STRING,
                    Token.TYPES.VARIABLE,
                    Token.TYPES.LITERAL_VARIABLE,
                    Token.TYPES.FUNCTION,
                    Token.TYPES.MACRO
                ],
                name: 'value'
            },
            {
                types: [Token.TYPES.STRING, Token.TYPES.VARIABLE, Token.TYPES.WORD],
                name: 'start'
            },
            {
                types: [Token.TYPES.STRING, Token.TYPES.VARIABLE, Token.TYPES.WORD],
                name: 'end',
                isOptional: true
            }
        ];

    }

    do(value: string, start: number, end: number) {
        value = String.raw`${value}`;

        if (!Utils.String.isInteger(start))
            return new Result(start, true, 'Start range value is not a valid number');

        if (!Utils.String.isInteger(end))
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
                result = value.substring(Math.max(value.length + start, 0), end)

            return new Result(result);
        }

        if (end < start && end >= 0 ||
            end < 0 && value.length + end <= start) {
            result = value.substring(start);
        }
        else if (end < 0)
            result = value.substring(start, Math.max(value.length + end, start))
        else result = value.substring(start, end);

        return new Result(result);
    }
}