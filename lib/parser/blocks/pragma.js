"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fthtml_exceptions_1 = require("../../model/exceptions/fthtml-exceptions");
const fthtmlelement_1 = require("../../model/fthtmlelement");
const token_1 = require("../../model/token");
const abstract_1 = require("./abstract");
const debug_1 = require("./pragmas/debug");
const ifdef_1 = require("./pragmas/ifdef");
const ifelse_1 = require("./pragmas/ifelse");
const tinyt_1 = require("./pragmas/tinyt");
const vars_1 = require("./pragmas/vars");
class Pragma extends abstract_1.AbstractBlock {
    constructor(base) {
        super(base);
        this.parse();
    }
    parse() {
        const prev = this.previous;
        const pragma = new fthtmlelement_1.FTHTMLElement(this.consume());
        if (token_1.Token.isExpectedType(pragma.token, 'Pragma_vars'))
            this._value = new vars_1.PragmaVars(this.base, pragma).value;
        else if (token_1.Token.isExpectedType(pragma.token, "Pragma") && pragma.token.value.endsWith('templates'))
            this._value = new tinyt_1.PragmaTinyT(this.base, pragma).value;
        else if (token_1.Token.isExpectedType(pragma.token, 'Pragma_if')) {
            pragma.children = new ifelse_1.PragmaIfElse(this.base, pragma, pragma).value;
            this._value = pragma;
        }
        else if (token_1.Token.isExpectedType(pragma.token, 'Pragma_ifdef')) {
            this._value = new ifdef_1.PragmaIfDef(this.base, pragma).value;
        }
        else if (token_1.Token.isExpectedType(pragma.token, 'Pragma_debug')) {
            this._value = new debug_1.PragmaDebug(this.base, pragma, prev).value;
        }
        else
            throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.InvalidKeyword(pragma.token);
    }
    get value() {
        return this._value;
    }
}
exports.Pragma = Pragma;
//# sourceMappingURL=pragma.js.map