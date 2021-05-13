import { FTHTMLExceptions } from "../../model/exceptions/fthtml-exceptions";
import { FTHTMLElement } from "../../model/fthtmlelement";
import { Token } from "../../model/token";
import { FTHTMLBaseParser } from "../fthtml-parser";
import { AbstractBlock } from "./abstract";
import { ImportBlock } from "./import";

export class Keyword extends AbstractBlock {
    constructor(base: FTHTMLBaseParser) {
        super(base);
        this.parse();
    }

    public get value(): FTHTMLElement {
        return this._value;
    }

    protected parse(): void {
        const keyword = new FTHTMLElement(this.consume());

        if (this.isEOF || !Token.isExpectedType(this.peek, Token.TYPES.STRING))
            throw new FTHTMLExceptions.Parser.IncompleteElement(keyword.token, 'string values');

        const value = this.consume();
        switch (keyword.token.value) {
            case 'comment': {
                keyword.children = [new FTHTMLElement(value, `<!-- ${this.base.parseStringOrVariable(value)} -->`)];
                this._value = keyword;
                break;
            }
            case 'doctype': {
                keyword.children = [new FTHTMLElement(value, `<!DOCTYPE ${this.base.parseStringOrVariable(value)}>`)];
                this._value = keyword;
                break;
            }
            case 'import':
                this._value = new ImportBlock(keyword, value, this.base).value;
                break;
            default:
                throw new FTHTMLExceptions.Parser.InvalidKeyword(keyword.token);
        }
    }

}