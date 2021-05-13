import { AbstractFunction, Result } from "./abstract";
import { Token } from "../token";
import { Utils } from "../../utils";

export class Len extends AbstractFunction {
    constructor() {
        super(false, true, true);

        this._argPatterns = [
            {
                types: [
                    Token.TYPES.STRING,
                    Token.TYPES.VARIABLE,
                    Token.TYPES.LITERAL_VARIABLE,
                    Token.TYPES.FUNCTION,
                    Token.TYPES.WORD
                ],
                name: 'value'
            }
        ];

    }
    do(entry: any) {
        if ([Token.TYPES.VARIABLE, Token.TYPES.LITERAL_VARIABLE].includes(entry[1]) && !(typeof entry[0] === 'string')) {
            if (Utils.Types.isArray(entry[0]))
                return new Result(entry[0].length);
            if (Utils.Types.isObject(entry[0]))
                return new Result(Object.keys(entry[0]).length);
        }

        return new Result(`${entry[0]}`.length);
    }
}