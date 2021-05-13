import { FTHTMLElement } from "../../../model/fthtmlelement";
import { FTHTMLBaseParser } from "../../fthtml-parser";
import { AbstractBlock } from "../abstract";

export abstract class AbstractPragma extends AbstractBlock {
    constructor(base: FTHTMLBaseParser, pragma: FTHTMLElement, ...args: any) {
        super(base);
        this.parse(pragma, ...args);
    }

    protected abstract parse(pragma: FTHTMLElement, ...args: any): void;

    public get value(): FTHTMLElement | FTHTMLElement[] {
        return this._value;
    }
}