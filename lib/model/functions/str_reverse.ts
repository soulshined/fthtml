import { AbstractFunction, Result } from "./abstract";
import { Token } from "../token";

export class StrReverse extends AbstractFunction {
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
        ];

    }

    do(value: string) {
        return new Result(`${value}`.split('').reverse().join(''));
    }
}