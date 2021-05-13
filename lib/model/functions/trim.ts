import { AbstractFunction, Result } from "./abstract";
import { Token } from "../token";

export class Trim extends AbstractFunction {
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
            { types: [Token.TYPES.STRING], name: 'trim style', enum: ['left', 'right', 'start', 'end'], default: 'trim', isOptional: true }
        ];

    }

    do(value: string, trimtype: string) {
        value = `${value}`, trimtype = trimtype || 'trim';
        let result = value;
        switch (trimtype.toLowerCase()) {
            case 'left':
                result = value.trimLeft();
                break;
            case 'right':
                result = value.trimRight();
                break;
            case 'start':
                result = value.trimStart();
                break;
            case 'end':
                result = value.trimEnd();
                break;
            default:
                result = value.trim();
                break;
        }
        return new Result(result);
    }
}