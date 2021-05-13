import { FTHTMLElement } from "../../model/fthtmlelement";
import { SELF_CLOSING_TAGS } from "../../model/self-closing-tags";
import { Token } from "../../model/token";
import { FTHTMLBaseParser } from "../fthtml-parser";
import { AbstractBlock } from "./abstract";

export class Tag extends AbstractBlock {

    constructor(base: FTHTMLBaseParser) {
        super(base);
        this.parse();
    }

    protected parse() {
        const tag = new FTHTMLElement(this.consume());
        Token.evaluate(tag.token);

        const peek = this.peek;
        if (SELF_CLOSING_TAGS.includes(tag.token.value)) {
            if (Token.isExpectedType(peek, 'Symbol_(')) {
                this._value = this.initElementWithAttrs(tag);
                return;
            }
        }
        else if (Token.isOneOfExpectedTypes(peek, Token.Sequences.STRINGABLE))
            tag.children.push(new FTHTMLElement(peek, this.base.parseStringOrVariable(this.consume())));
        else if (Token.isExpectedType(peek, 'Symbol_(')) {
            this._value = this.initElementWithAttrs(tag);
            return;
        }
        else if (Token.isExpectedType(peek, 'Symbol_{')) {
            const children = this.base.parseParentElementChildren();
            tag.children = children.children;
            tag.childrenStart = children.braces[0].position;
            tag.childrenEnd = children.braces[1].position;
            tag.isParentElement = true;
        }
        else if (Token.isExpectedType(peek, Token.TYPES.FUNCTION))
            tag.children.push(this.base.parseFunction());
        else if (Token.isExpectedType(peek, Token.TYPES.MACRO))
            tag.children.push(new FTHTMLElement(peek, this.base.parseMacro()));

        this._value = tag;
    }

    private initElementWithAttrs(element: FTHTMLElement) {
        element.attrs = this.base.parseAttributes(this.consume());

        if (this.isEOF || SELF_CLOSING_TAGS.includes(element.token.value))
            return element;

        const peek = this.peek;
        if (Token.isExpectedType(peek, 'Symbol_{')) {
            const children = this.base.parseParentElementChildren()
            element.children = children.children;
            element.isParentElement = true;
            element.childrenStart = children.braces[0].position;
            element.childrenEnd = children.braces[1].position;
        }
        else if (Token.isOneOfExpectedTypes(peek, Token.Sequences.STRINGABLE))
            element.children.push(new FTHTMLElement(peek, this.base.parseStringOrVariable(this.consume())));
        else if (Token.isExpectedType(peek, Token.TYPES.FUNCTION))
            element.children.push(this.base.parseFunction());
        else if (Token.isExpectedType(peek, Token.TYPES.MACRO))
            element.children.push(new FTHTMLElement(peek, this.base.parseMacro()));

        return element;
    }

    public get value(): FTHTMLElement {
        return this._value as FTHTMLElement;
    }
}
