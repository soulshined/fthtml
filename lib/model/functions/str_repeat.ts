import { Utils } from "../../utils";
import { AbstractFunction, Result } from "./abstract";
import { Token } from "../token";

export class StrRepeat extends AbstractFunction {
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
                types: [Token.TYPES.STRING, Token.TYPES.WORD],
                name: 'quantity'
            }
        ];

    }

    do(value: string, quantity: number) {
        value = `${value}`;

        if (!Utils.String.isInteger(quantity))
            return new Result(value, true, 'Repeat quantity is not a valid number');

        return new Result(value.repeat(Math.max(+quantity + 1, 1)));
    }
}