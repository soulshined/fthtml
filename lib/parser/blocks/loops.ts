import { FTHTMLExceptions } from "../../model/exceptions/fthtml-exceptions";
import { FTHTMLElement } from "../../model/fthtmlelement";
import { HTMLBuilder } from "../../model/html-builder";
import { Token } from "../../model/token";
import { Utils } from "../../utils";
import { FTHTMLBaseParser } from "../fthtml-parser";
import { AbstractBlock } from "./abstract";

export class Loops extends AbstractBlock {

    constructor(base: FTHTMLBaseParser) {
        super(base);
        this.parse();
    }

    public get value(): FTHTMLElement {
        return this._value;
    }

    protected parse(): void {
        const loop = new FTHTMLElement(this.consume());
        loop.isParentElement = true;

        const [iterable, _] = this.base.parseTypesInOrder([
            [...Token.Sequences.VARIABLE, 'Function_keys', 'Function_values', 'Function_str_split', 'Function_range', 'Function_sort'],
            ['Symbol_{']
        ], loop.token);
        loop.childrenStart = _.token.position;
        loop.parsedValue = '';

        if (!Utils.Types.isArray(iterable.parsedValue)) throw new FTHTMLExceptions.Parser.InvalidType(iterable.token, 'an iterable object');

        const prevThis = this.vars.this;
        const it = (iterable.parsedValue as unknown as any[]);
        const input = this.base.clone();

        this.vars['this'] = it[0];
        loop.children = this.base.parseWhileType(Token.Sequences.TOP_LEVEL, ['Symbol_}'], ((elements: FTHTMLElement[], err: boolean) => {
            if (err)
                throw new FTHTMLExceptions.Parser.IncompleteElement(loop.token, 'opening and closing braces');
            loop.childrenEnd = this.consume().position;
            return elements;
        }))
        loop.parsedValue += HTMLBuilder.build(loop.children);

        for (let i = 1; i < it.length; i++) {
            const e = it[i];
            this.vars['this'] = e;
            const cloned = input.clone();
            const elements = cloned.parseWhileType(Token.Sequences.TOP_LEVEL, ['Symbol_}'], ((elements: FTHTMLElement[], err: boolean) => {
                if (err)
                    throw new FTHTMLExceptions.Parser.IncompleteElement(loop.token, 'opening and closing braces');
                return elements;
            }));
            loop.parsedValue += HTMLBuilder.build(elements);
        }
        this.vars['this'] = prevThis;
        loop.children.unshift(iterable);

        this._value = loop;
    }

}