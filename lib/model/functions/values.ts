import { Utils } from "../../utils";
import { Token } from "../token";
import { AbstractFunction, Result } from "./abstract";

export class Values extends AbstractFunction {
    constructor() {
        super(false);

        this._argPatterns = [
            {
                types: [Token.TYPES.LITERAL_VARIABLE, Token.TYPES.VARIABLE],
                name: 'value'
            }
        ];

    }

    do(obj: any) {
        if (Utils.Types.isObject(obj))
            return new Result(Object.values(obj));

        return new Result(obj, true, 'Value is not a literal object');
    }
}