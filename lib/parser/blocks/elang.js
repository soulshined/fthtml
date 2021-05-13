"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fthtml_exceptions_1 = require("../../model/exceptions/fthtml-exceptions");
const fthtmlelement_1 = require("../../model/fthtmlelement");
const token_1 = require("../../model/token");
const abstract_1 = require("./abstract");
class ELang extends abstract_1.AbstractBlock {
    constructor(base) {
        super(base);
        this.parse();
    }
    get value() {
        return this._value;
    }
    parse() {
        const elang = new fthtmlelement_1.FTHTMLElement(this.consume());
        if (this.isEOF || !token_1.Token.isExpectedType(this.peek, "ElangB"))
            throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.IncompleteElement(elang.token, 'opening and closing braces', this.peek);
        const elangb = this.consume();
        elang.children.push(new fthtmlelement_1.FTHTMLElement(elangb, elangb.value));
        switch (elang.token.value) {
            case 'js':
                elang.parsedValue = `<script>${elangb.value}</script>`;
                this._value = elang;
                break;
            case 'css':
                elang.parsedValue = `<style>${elangb.value}</style>`;
                this._value = elang;
                break;
            default:
                throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.InvalidType(elang.token, "'css','js'");
        }
    }
}
exports.ELang = ELang;
//# sourceMappingURL=elang.js.map