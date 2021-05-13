import { FTHTMLExceptions } from "../../model/exceptions/fthtml-exceptions";
import { FTHTMLElement } from "../../model/fthtmlelement";
import { Token } from "../../model/token";
import { FTHTMLBaseParser } from "../fthtml-parser";
import { AbstractBlock } from "./abstract";
import { PragmaDebug } from "./pragmas/debug";
import { PragmaIfDef } from "./pragmas/ifdef";
import { PragmaIfElse } from "./pragmas/ifelse";
import { PragmaTinyT } from "./pragmas/tinyt";
import { PragmaVars } from "./pragmas/vars";

export class Pragma extends AbstractBlock {

    constructor(base: FTHTMLBaseParser) {
        super(base);
        this.parse();
    }

    protected parse(): void {
        const prev = this.previous;
        const pragma = new FTHTMLElement(this.consume());

        if (Token.isExpectedType(pragma.token, 'Pragma_vars'))
            this._value = new PragmaVars(this.base, pragma).value;
        else if (Token.isExpectedType(pragma.token, Token.TYPES.PRAGMA) && pragma.token.value.endsWith('templates'))
            this._value = new PragmaTinyT(this.base, pragma).value;
        else if (Token.isExpectedType(pragma.token, 'Pragma_if')) {
            pragma.children = new PragmaIfElse(this.base, pragma, pragma).value as FTHTMLElement[];
            this._value = pragma;
        }
        else if (Token.isExpectedType(pragma.token, 'Pragma_ifdef')) {
            this._value = new PragmaIfDef(this.base, pragma).value;
        }
        else if (Token.isExpectedType(pragma.token, 'Pragma_debug')) {
            this._value = new PragmaDebug(this.base, pragma, prev).value;
        }
        else throw new FTHTMLExceptions.Parser.InvalidKeyword(pragma.token);
    }

    public get value(): FTHTMLElement {
        return this._value;
    }

}