import { AbstractFunction, Result } from "./abstract";
import { Token } from "../token";

export class Replace extends AbstractFunction {
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
            { types: [Token.TYPES.STRING], name: 'pattern' },
            {
                types: [
                    Token.TYPES.STRING,
                    Token.TYPES.VARIABLE,
                    Token.TYPES.FUNCTION
                ],
                name: 'replace'
            }
        ];

    }
    do(value: string, pattern: string, replace: string) {
        value = `${value}`;

        try {
            const regx = new RegExp(pattern, 'g');

            return new Result(value.replace(regx, replace));
        } catch (error) {
            return new Result(value, true, error.message);
        }
    }
}