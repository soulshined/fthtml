import { FTHTMLElement } from "../../../model/fthtmlelement";
import { Token } from "../../../model/token";
import { AbstractPragma } from "./abstract";

export class PragmaDebug extends AbstractPragma {

    protected parse(pragma: FTHTMLElement, prev: Token<Token.TYPES>) {
        const value = this.base.parseTypesInOrder([[...Token.Sequences.STRINGABLE, Token.TYPES.WORD, Token.TYPES.FUNCTION]], pragma.token)[0];

        if (this.uconfig.isdebug) {
            let token = value.token;
            let msg = value.parsedValue ?? value.token.value;
            if ((value.parsedValue ?? value.token.value) === '$') {
                token = prev;
                msg = prev.value;
            }
            if (Token.isExpectedType(token, Token.TYPES.VARIABLE) && this.vars[token.value] !== undefined)
                msg = JSON.stringify(this.vars[token.value], null, this.uconfig.prettify ? 2 : 0);
            if (Token.isExpectedType(token, Token.TYPES.LITERAL_VARIABLE))
                msg = JSON.stringify(this.base.parseStringOrVariable(token), null, this.uconfig.prettify ? 2 : 0);

            if (this.uconfig.isdebug)
                console.log(`[Debug - ${this.vars._$.__filename}@${token.position.line}:${token.position.column}] ${token.type === Token.TYPES.VARIABLE ? `@${token.value} => ` : ''}${msg}`);
        }

        pragma.parsedValue = value.parsedValue;
        pragma.children.push(value);
        this._value = pragma;
    }

}