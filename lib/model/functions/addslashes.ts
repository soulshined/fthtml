import { AbstractFunction, Result } from "./abstract";
import { Token } from "../token";

export class AddSlashes extends AbstractFunction {
    constructor() {
        super(false);

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
            }
        ]

    }

    do(value: string) {
        return new Result(`${value}`.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0'));
    }
}