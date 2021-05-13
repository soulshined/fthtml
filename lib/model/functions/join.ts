import { Utils } from "../../utils";
import { Token } from "../token";
import { AbstractFunction, Result } from "./abstract";

export class Join extends AbstractFunction {
    constructor() {
        super(true, false, true);

        this._argPatterns = [
            {
                types: [
                    Token.TYPES.VARIABLE,
                    Token.TYPES.LITERAL_VARIABLE,
                    'Function_keys',
                    'Function_values',
                    'Function_sort',
                    'Function_str_split',
                    'Function_range'
                ],
                name: 'value'
            },
            {
                types: [
                    Token.TYPES.STRING,
                    Token.TYPES.VARIABLE,
                    Token.TYPES.LITERAL_VARIABLE
                ],
                name: 'delimiter',
                isOptional: true,
                default: ', '
            }
        ];

    }
    do(value: any, delimiter: string) {
        delimiter = delimiter ?? ', ';
        if (Utils.Types.isArray(value))
            return new Result(value.join(delimiter))
        else if (Utils.Types.isObject(value))
            return new Result(Object.keys(value).join(delimiter))

        return new Result(value, true, 'Value is not iterable');
    }
}