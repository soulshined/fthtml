"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fthtml_exceptions_1 = require("../../../model/exceptions/fthtml-exceptions");
const fthtmlelement_1 = require("../../../model/fthtmlelement");
const html_builder_1 = require("../../../model/html-builder");
const token_1 = require("../../../model/token");
const abstract_1 = require("./abstract");
class PragmaIfDef extends abstract_1.AbstractPragma {
    parse(pragma) {
        const result = new fthtmlelement_1.FTHTMLElement(pragma.token);
        this.throwIfEOF(new fthtml_exceptions_1.FTHTMLExceptions.Parser.IncompleteElement(pragma.token, 'a varibale, or alias, name'));
        if (!token_1.Token.isExpectedType(this.peek, "Word"))
            throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.InvalidType(this.peek, 'a varibale, or alias, name');
        const value = new fthtmlelement_1.FTHTMLElement(this.consume());
        result.childrenStart = value.token.position;
        const prevState = this.base.shouldOmit;
        const shouldOmit = this.vars[value.token.value] === undefined &&
            this.uconfig.globalvars[value.token.value] === undefined &&
            this.uconfig.tinytemplates[value.token.value] === undefined &&
            this.tinyts[value.token.value] === undefined;
        this.base.shouldOmit = shouldOmit;
        result.children = this.base.parseWhileType(token_1.Token.Sequences.TOP_LEVEL, ['Pragma_end'], (elements, error) => {
            if (error)
                throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.IncompleteElement(pragma.token, `an '#end' pragma keyword for starting pragma '${pragma.token.value}' but none found`);
            result.childrenEnd = this.consume().position;
            return elements;
        });
        this.base.shouldOmit = prevState;
        result.parsedValue = shouldOmit ? '' : html_builder_1.HTMLBuilder.build(result.children);
        result.children.unshift(value);
        this._value = result;
    }
}
exports.PragmaIfDef = PragmaIfDef;
//# sourceMappingURL=ifdef.js.map