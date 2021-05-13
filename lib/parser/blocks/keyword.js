"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fthtml_exceptions_1 = require("../../model/exceptions/fthtml-exceptions");
const fthtmlelement_1 = require("../../model/fthtmlelement");
const token_1 = require("../../model/token");
const abstract_1 = require("./abstract");
const import_1 = require("./import");
class Keyword extends abstract_1.AbstractBlock {
    constructor(base) {
        super(base);
        this.parse();
    }
    get value() {
        return this._value;
    }
    parse() {
        const keyword = new fthtmlelement_1.FTHTMLElement(this.consume());
        if (this.isEOF || !token_1.Token.isExpectedType(this.peek, "String"))
            throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.IncompleteElement(keyword.token, 'string values');
        const value = this.consume();
        switch (keyword.token.value) {
            case 'comment': {
                keyword.children = [new fthtmlelement_1.FTHTMLElement(value, `<!-- ${this.base.parseStringOrVariable(value)} -->`)];
                this._value = keyword;
                break;
            }
            case 'doctype': {
                keyword.children = [new fthtmlelement_1.FTHTMLElement(value, `<!DOCTYPE ${this.base.parseStringOrVariable(value)}>`)];
                this._value = keyword;
                break;
            }
            case 'import':
                this._value = new import_1.ImportBlock(keyword, value, this.base).value;
                break;
            default:
                throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.InvalidKeyword(keyword.token);
        }
    }
}
exports.Keyword = Keyword;
//# sourceMappingURL=keyword.js.map