import { AbstractFunction, Result } from "./abstract";
import { Token } from "../token";

export class StrSplit extends AbstractFunction {
    constructor() {
        super(true);

        this._argPatterns = [
            {
                types: [
                    Token.TYPES.STRING,
                    Token.TYPES.VARIABLE,
                    Token.TYPES.LITERAL_VARIABLE,
                    Token.TYPES.MACRO,
                    Token.TYPES.FUNCTION
                ],
                name: 'value'
            },
            {
                types: [Token.TYPES.STRING, Token.TYPES.VARIABLE],
                name: 'delimiter'
            }
        ];

    }

    do(value: string, delimiter: string) {
        return new Result(`${value}`.split(delimiter));
    }
}