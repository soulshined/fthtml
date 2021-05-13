"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fthtml_exceptions_1 = require("../../../model/exceptions/fthtml-exceptions");
const fthtmlelement_1 = require("../../../model/fthtmlelement");
const token_1 = require("../../../model/token");
const abstract_1 = require("./abstract");
class PragmaTinyT extends abstract_1.AbstractPragma {
    parse(pragma) {
        while (!this.isEOF) {
            pragma.children.push(...this.base.consumeComments());
            const tinytempl = new fthtmlelement_1.FTHTMLElement(this.consume());
            if (token_1.Token.isExpectedType(tinytempl.token, 'Pragma_end')) {
                pragma.childrenStart = pragma.token.position;
                pragma.childrenEnd = tinytempl.token.position;
                this._value = pragma;
                return;
            }
            if (!token_1.Token.isOneOfExpectedTypes(tinytempl.token, ["Word"]))
                throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.InvalidTinyTemplateName(tinytempl.token, "[\w-]+", this.vars._$.__filename);
            token_1.Token.evaluate(tinytempl.token);
            this.throwIfEOF(new fthtml_exceptions_1.FTHTMLExceptions.Parser.IncompleteElement(pragma.token, `an '#end' pragma keyword for starting pragma '${pragma.token.value}' but none found`));
            const element = new fthtmlelement_1.FTHTMLElement(this.consume());
            if (!token_1.Token.isOneOfExpectedTypes(element.token, ["Word", "String"]))
                throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.InvalidType(element.token, 'a string or single ftHTML element');
            if (token_1.Token.isExpectedType(element.token, "String")) {
                this.base.updateTinyTemplate(tinytempl, fthtmlelement_1.FTHTMLElement.TinyTemplate.create(element.token, this.vars._$.__filename));
                element.parsedValue = element.token.value;
                tinytempl.children.push(element);
                pragma.children.push(tinytempl);
                continue;
            }
            this.throwIfEOF(new fthtml_exceptions_1.FTHTMLExceptions.Parser.IncompleteElement(pragma.token, `an '#end' pragma keyword for starting pragma '${pragma.token.value}' but none found`));
            const peek = this.peek;
            if (token_1.Token.isExpectedType(peek, 'Pragma_end')) {
                this.base.updateTinyTemplate(tinytempl, fthtmlelement_1.FTHTMLElement.TinyTemplate.create(new token_1.Token("String", '${val}', element.token.position), this.vars._$.__filename, element.token));
                tinytempl.children.push(element);
                pragma.children.push(tinytempl);
                continue;
            }
            if (token_1.Token.isExpectedType(peek, "String")) {
                const str = this.consume();
                this.base.updateTinyTemplate(tinytempl, fthtmlelement_1.FTHTMLElement.TinyTemplate.create(str, this.vars._$.__filename, element.token));
                element.children.push(new fthtmlelement_1.FTHTMLElement(str, str.value));
            }
            else if (token_1.Token.isExpectedType(peek, 'Symbol_(')) {
                const lParenth = this.consume();
                this.throwIfEOF(new fthtml_exceptions_1.FTHTMLExceptions.Parser.IncompleteElement(element.token, 'closing and opening parenthesis'));
                element.attrs = this.base.parseAttributes(lParenth);
                let value;
                if (token_1.Token.isExpectedType(this.peek, "String")) {
                    const str = this.consume();
                    value = str;
                    element.children.push(new fthtmlelement_1.FTHTMLElement(str, str.value));
                }
                else if (this.isEOF || !token_1.Token.isExpectedType(this.peek, "Word") && !token_1.Token.isExpectedType(this.peek, 'Pragma_end') && !token_1.Token.isOneOfExpectedTypes(this.peek, token_1.Token.Sequences.COMMENTS))
                    throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.InvalidType(element.token, 'a string or single ftHTML element');
                this.base.updateTinyTemplate(tinytempl, fthtmlelement_1.FTHTMLElement.TinyTemplate.create((value !== null && value !== void 0 ? value : new token_1.Token("String", '${val}', element.token.position)), this.vars._$.__filename, element.token, element.attrs));
            }
            else if (token_1.Token.isExpectedType(peek, "Word"))
                this.base.updateTinyTemplate(tinytempl, fthtmlelement_1.FTHTMLElement.TinyTemplate.create(element.token, this.vars._$.__filename));
            else
                throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.InvalidType(element.token, 'a string or single ftHTML element');
            tinytempl.children.push(element);
            pragma.children.push(tinytempl);
        }
        ;
        throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.IncompleteElement(pragma.token, `an '#end' pragma keyword for starting pragma '${pragma.token.value}' but none found`);
    }
}
exports.PragmaTinyT = PragmaTinyT;
//# sourceMappingURL=tinyt.js.map