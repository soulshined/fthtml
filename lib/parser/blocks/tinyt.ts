import { FTHTMLExceptions } from "../../model/exceptions/fthtml-exceptions";
import { FTHTMLElement } from "../../model/fthtmlelement";
import { HTMLBuilder } from "../../model/html-builder";
import { Token } from "../../model/token";
import { Utils } from "../../utils";
import { FTHTMLBaseParser } from "../fthtml-parser";
import { AbstractBlock } from "./abstract";

export class TinyT extends AbstractBlock {

    constructor(base: FTHTMLBaseParser) {
        super(base);
        this.parse();
    }

    public get value(): FTHTMLElement {
        return this._value;
    }

    protected parse(): void {
        const word = new FTHTMLElement(this.consume());
        const uconfigtt = this.uconfig.tinytemplates[word.token.value];
        const tt: FTHTMLElement.TinyTemplate = this.tinyts[word.token.value] || uconfigtt;

        let result: FTHTMLElement.TinyTemplate = tt.clone();

        if (uconfigtt !== undefined && this.tinyts[word.token.value] === undefined) {
            try {
                const fthtml = `#templates ${word.token.value} ${result.value.value} #end`;
                // @ts-ignore
                const tts = this.base.compileTinyTemplate(fthtml);

                result = tts[word.token.value].clone();
                result.origin = uconfigtt.origin;
            }
            catch (error) { }
        }

        if (Token.isExpectedType(this.peek, 'Symbol_(')) {
            this.consume();
            word.attrs = this.base.parseAttributes(word.token);
            if (!result.attrs) result.attrs = word.attrs;
            else {
                if (result.attrs.get('id').length === 0)
                    result.attrs.get('id').push(...word.attrs.get('id'));
                else if (result.attrs.get('id').length > 0 && word.attrs.get('id').length > 0)
                    throw new FTHTMLExceptions.Parser('Tiny template id is already declared in the global scope', word.token);

                result.attrs.get('classes').push(...word.attrs.get('classes'));
                result.attrs.get('kvps').push(...word.attrs.get('kvps'));
                result.attrs.get('misc').push(...word.attrs.get('misc'));
            }
        }

        const attrPlaceholders = [];
        if (result.attrs)
            result.attrs.get('kvps').forEach((e, index) => {
                const matches = Utils.Regex.getAllMatches(e.children[0].parsedValue, /(?<!\\)(\${[ ]*val[ ]*})/g);
                if (matches.length === 0) return;
                attrPlaceholders.push(index);
            })

        const placeholders = Utils.Regex.getAllMatches(result.value.value, /(?<!\\)(\${[ ]*val[ ]*})/g);
        if (placeholders.length === 0 && attrPlaceholders.length === 0)
            throw new FTHTMLExceptions.Parser.InvalidTinyTemplatePlaceholder(word.token, this.vars._$.__filename);

        let replacement = '';
        if (Token.isExpectedType(this.peek, 'Symbol_{')) {
            const elements = this.base.parseParentElementChildren(Token.Sequences.CHILDREN_NO_PRAGMA);
            word.isParentElement = true;
            word.children = elements.children;
            word.childrenStart = elements.braces[0].position;
            word.childrenEnd = elements.braces[1].position;
            replacement += HTMLBuilder.build(word.children);
        }

        if (Token.isOneOfExpectedTypes(this.peek, [...Token.Sequences.STRINGABLE, Token.TYPES.MACRO, Token.TYPES.FUNCTION])) {
            const elements = this.base.parseWhileType([...Token.Sequences.STRINGABLE, Token.TYPES.MACRO, Token.TYPES.FUNCTION], null, null, 1);
            word.children = elements;
            replacement += HTMLBuilder.build(elements);
        }

        if (placeholders.length > 0)
            // @ts-ignore
            placeholders.forEach(() => result.value.value = result.value.value.replace(/(?<!\\)(\${[ ]*val[ ]*})/g, replacement));

        if (attrPlaceholders.length > 0)
            attrPlaceholders.forEach(ph => {
                const val = result.attrs.get('kvps')[ph].children[0].parsedValue;
                result.attrs.get('kvps')[ph].children[0].parsedValue = val.replace(/(?<!\\)(\${[ ]*val[ ]*})/g, replacement);
            })

        word.parsedValue = result.element
            ? HTMLBuilder.build([new FTHTMLElement(result.element, undefined, [new FTHTMLElement(result.value, this.base.parseStringOrVariable(result.value))], result.attrs)])
            : HTMLBuilder.build([new FTHTMLElement(result.value, this.base.parseStringOrVariable(result.value))]);

        this._value = word;
    }
}