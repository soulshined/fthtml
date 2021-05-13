import { AbstractFunction, Result } from "./abstract";
import { Token } from "../token";

export class Choose extends AbstractFunction {
    constructor() {
        super(false);

        this._argPatterns = [
            {
                types: [
                    Token.TYPES.STRING,
                    Token.TYPES.VARIABLE,
                    Token.TYPES.LITERAL_VARIABLE,
                    Token.TYPES.WORD,
                    Token.TYPES.FUNCTION,
                    Token.TYPES.MACRO
                ],
                name: 'value',
                isRestParameter: true
            }
        ]

    }

    do(...values: any) {
        return new Result(values[Math.floor(Math.random() * values.length)]);
    }
}