import { decode, encode } from "he";
import { AbstractFunction, Result } from "./abstract";
import { Token } from "../token";

export namespace HTMLEncoder {

    export class Encode extends AbstractFunction {
        constructor() {
            super(false);

            this._argPatterns = [
                {
                    types: [
                        Token.TYPES.STRING,
                        Token.TYPES.VARIABLE,
                        Token.TYPES.LITERAL_VARIABLE,
                        Token.TYPES.FUNCTION
                    ],
                    name: 'value'
                }
            ]
        }

        do(html: string): Result {
            return new Result(encode(`${html}`));
        }

    }

    export class Decode extends AbstractFunction {
        constructor() {
            super(false);

            this._argPatterns = [
                {
                    types: [
                        Token.TYPES.STRING,
                        Token.TYPES.VARIABLE,
                        Token.TYPES.LITERAL_VARIABLE,
                        Token.TYPES.FUNCTION],
                    name: 'value'
                }
            ]
        }

        do(html: string): Result {
            return new Result(decode(`${html}`));
        }

    }

}