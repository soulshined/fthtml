import { FTHTMLExceptions } from "../../../model/exceptions/fthtml-exceptions";
import { FTHTMLElement } from "../../../model/fthtmlelement";
import { Token } from "../../../model/token";
import { AbstractPragma } from "./abstract";

export class PragmaTinyT extends AbstractPragma {

    protected parse(pragma: FTHTMLElement): void {
        while (!this.isEOF) {
            pragma.children.push(...this.base.consumeComments());
            const tinytempl = new FTHTMLElement(this.consume());

            if (Token.isExpectedType(tinytempl.token, 'Pragma_end')) {
                pragma.childrenStart = pragma.token.position;
                pragma.childrenEnd = tinytempl.token.position;
                this._value = pragma;
                return;
            }
            if (!Token.isOneOfExpectedTypes(tinytempl.token, [Token.TYPES.WORD]))
                throw new FTHTMLExceptions.Parser.InvalidTinyTemplateName(tinytempl.token, "[\w-]+", this.vars._$.__filename);

            Token.evaluate(tinytempl.token);
            this.throwIfEOF(new FTHTMLExceptions.Parser.IncompleteElement(pragma.token, `an '#end' pragma keyword for starting pragma '${pragma.token.value}' but none found`));

            const element = new FTHTMLElement(this.consume());
            if (!Token.isOneOfExpectedTypes(element.token, [Token.TYPES.WORD, Token.TYPES.STRING]))
                throw new FTHTMLExceptions.Parser.InvalidType(element.token, 'a string or single ftHTML element');

            if (Token.isExpectedType(element.token, Token.TYPES.STRING)) {
                this.base.updateTinyTemplate(tinytempl, FTHTMLElement.TinyTemplate.create(element.token, this.vars._$.__filename));
                element.parsedValue = element.token.value;
                tinytempl.children.push(element);
                pragma.children.push(tinytempl);
                continue;
            }

            this.throwIfEOF(new FTHTMLExceptions.Parser.IncompleteElement(pragma.token, `an '#end' pragma keyword for starting pragma '${pragma.token.value}' but none found`));

            const peek = this.peek;
            if (Token.isExpectedType(peek, 'Pragma_end')) {
                this.base.updateTinyTemplate(tinytempl, FTHTMLElement.TinyTemplate.create(new Token(
                    Token.TYPES.STRING,
                    '${val}',
                    element.token.position
                ), this.vars._$.__filename, element.token));
                tinytempl.children.push(element);
                pragma.children.push(tinytempl);
                continue;
            }

            if (Token.isExpectedType(peek, Token.TYPES.STRING)) {
                const str = this.consume();
                this.base.updateTinyTemplate(tinytempl, FTHTMLElement.TinyTemplate.create(str, this.vars._$.__filename, element.token));
                element.children.push(new FTHTMLElement(str, str.value));
            }
            else if (Token.isExpectedType(peek, 'Symbol_(')) {
                const lParenth = this.consume();
                this.throwIfEOF(new FTHTMLExceptions.Parser.IncompleteElement(element.token, 'closing and opening parenthesis'));

                element.attrs = this.base.parseAttributes(lParenth);

                let value;
                if (Token.isExpectedType(this.peek, Token.TYPES.STRING)) {
                    const str = this.consume();
                    value = str;
                    element.children.push(new FTHTMLElement(str, str.value));
                }
                else if (this.isEOF || !Token.isExpectedType(this.peek, Token.TYPES.WORD) && !Token.isExpectedType(this.peek, 'Pragma_end') && !Token.isOneOfExpectedTypes(this.peek, Token.Sequences.COMMENTS))
                    throw new FTHTMLExceptions.Parser.InvalidType(element.token, 'a string or single ftHTML element');

                this.base.updateTinyTemplate(tinytempl, FTHTMLElement.TinyTemplate.create(value ?? new Token(
                    Token.TYPES.STRING,
                    '${val}',
                    element.token.position
                ), this.vars._$.__filename, element.token, element.attrs));
            }
            else if (Token.isExpectedType(peek, Token.TYPES.WORD))
                this.base.updateTinyTemplate(tinytempl, FTHTMLElement.TinyTemplate.create(element.token, this.vars._$.__filename));
            else
                throw new FTHTMLExceptions.Parser.InvalidType(element.token, 'a string or single ftHTML element');

            tinytempl.children.push(element);
            pragma.children.push(tinytempl);
        };

        throw new FTHTMLExceptions.Parser.IncompleteElement(pragma.token, `an '#end' pragma keyword for starting pragma '${pragma.token.value}' but none found`);
    }

}