import { FTHTMLExceptions } from "../../model/exceptions/fthtml-exceptions";
import { FTHTMLElement } from "../../model/fthtmlelement";
import { Token } from "../../model/token";
import { FTHTMLBaseParser } from "../fthtml-parser";
import { AbstractBlock } from "./abstract";

export class ELang extends AbstractBlock {

    constructor(base: FTHTMLBaseParser) {
        super(base);
        this.parse();
    }

    public get value(): FTHTMLElement {
        return this._value;
    }

    protected parse(): void {
        const elang = new FTHTMLElement(this.consume());

        if (this.isEOF || !Token.isExpectedType(this.peek, Token.TYPES.ELANGB)) throw new FTHTMLExceptions.Parser.IncompleteElement(elang.token, 'opening and closing braces', this.peek);

        const elangb = this.consume();
        elang.children.push(new FTHTMLElement(elangb, elangb.value));
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
                throw new FTHTMLExceptions.Parser.InvalidType(elang.token, "'css','js'");
        }
    }

}