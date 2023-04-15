import { AbstractFunction, Result } from "./abstract";
import { Token } from "../token";
import { Utils } from "../../utils";

export class Fallback extends AbstractFunction {
    constructor() {
        super(true);

        this._argPatterns = [
            {
                types: [
                    Token.TYPES.FUNCTION,
                    Token.TYPES.LITERAL_VARIABLE,
                    Token.TYPES.STRING,
                    Token.TYPES.VARIABLE
                ],
                name: 'value'
            },
            {
                types: [
                    Token.TYPES.STRING,
                    Token.TYPES.VARIABLE,
                    Token.TYPES.LITERAL_VARIABLE,
                    Token.TYPES.FUNCTION
                ],
                name: 'default'
            }
        ]

    }

    do(value: any, defaultValue: any) {
        let result = value;
        if (value === undefined || value === null)
            result = defaultValue;

        if (Utils.Types.isArray(value))
            result = value.length === 0
                ? defaultValue
                : value;
        else if (Utils.Types.isObject(value))
            result = Object.keys(value).length === 0
                ? defaultValue
                : value;
        else if (Utils.Types.isTypeOf(value, 'string')) {
            if (value.trim().length === 0)
                result = defaultValue;
        }

        return new Result(result);
    }
}