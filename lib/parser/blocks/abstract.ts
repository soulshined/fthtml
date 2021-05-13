import { FTHTMLConfig } from "../../../cli/utils/user-config-helper";
import { FTHTMLElement } from "../../model/fthtmlelement";
import { Token } from "../../model/token";
import { AbstractParser } from "../abstract";
import { FTHTMLBaseParser } from "../fthtml-parser";

export abstract class AbstractBlock extends AbstractParser<Token<Token.TYPES>> {
    protected base: FTHTMLBaseParser;

    constructor(base: FTHTMLBaseParser) {
        super();
        this.base = base;
        this._input = base.input;
    }

    public abstract get value(): FTHTMLElement[] | FTHTMLElement;

    public get uconfig() : FTHTMLConfig {
        return this.base.uconfig;
    }

    public get vars() : any {
        return this.base.vars;
    }

    public get shouldOmit() : boolean {
        return this.base.shouldOmit;
    }

    public get tinyts() : any {
        return this.base.tinyts;
    }
}