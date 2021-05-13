import { FTHTMLExceptions } from "../../../model/exceptions/fthtml-exceptions";
import { FTHTMLElement } from "../../../model/fthtmlelement";
import { HTMLBuilder } from "../../../model/html-builder";
import { Token } from "../../../model/token";
import { AbstractPragma } from "./abstract";

export class PragmaIfDef extends AbstractPragma {

    protected parse(pragma: FTHTMLElement) {
        const result = new FTHTMLElement(pragma.token);
        this.throwIfEOF(new FTHTMLExceptions.Parser.IncompleteElement(pragma.token, 'a varibale, or alias, name'));

        if (!Token.isExpectedType(this.peek, Token.TYPES.WORD))
            throw new FTHTMLExceptions.Parser.InvalidType(this.peek, 'a varibale, or alias, name');

        const value = new FTHTMLElement(this.consume());
        result.childrenStart = value.token.position;
        const prevState = this.base.shouldOmit;
        const shouldOmit = this.vars[value.token.value] === undefined &&
            this.uconfig.globalvars[value.token.value] === undefined &&
            this.uconfig.tinytemplates[value.token.value] === undefined &&
            this.tinyts[value.token.value] === undefined;
        this.base.shouldOmit = shouldOmit;

        result.children = this.base.parseWhileType(Token.Sequences.TOP_LEVEL, ['Pragma_end'], (elements: FTHTMLElement[], error: boolean) => {
            if (error)
                throw new FTHTMLExceptions.Parser.IncompleteElement(pragma.token, `an '#end' pragma keyword for starting pragma '${pragma.token.value}' but none found`);
            result.childrenEnd = this.consume().position;
            return elements;
        })

        this.base.shouldOmit = prevState;
        result.parsedValue = shouldOmit ? '' : HTMLBuilder.build(result.children);
        result.children.unshift(value);
        this._value = result;
    }

}