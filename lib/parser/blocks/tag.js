"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fthtmlelement_1 = require("../../model/fthtmlelement");
const self_closing_tags_1 = require("../../model/self-closing-tags");
const token_1 = require("../../model/token");
const abstract_1 = require("./abstract");
class Tag extends abstract_1.AbstractBlock {
    constructor(base) {
        super(base);
        this.parse();
    }
    parse() {
        const tag = new fthtmlelement_1.FTHTMLElement(this.consume());
        token_1.Token.evaluate(tag.token);
        const peek = this.peek;
        if (self_closing_tags_1.SELF_CLOSING_TAGS.includes(tag.token.value)) {
            if (token_1.Token.isExpectedType(peek, 'Symbol_(')) {
                this._value = this.initElementWithAttrs(tag);
                return;
            }
        }
        else if (token_1.Token.isOneOfExpectedTypes(peek, token_1.Token.Sequences.STRINGABLE))
            tag.children.push(new fthtmlelement_1.FTHTMLElement(peek, this.base.parseStringOrVariable(this.consume())));
        else if (token_1.Token.isExpectedType(peek, 'Symbol_(')) {
            this._value = this.initElementWithAttrs(tag);
            return;
        }
        else if (token_1.Token.isExpectedType(peek, 'Symbol_{')) {
            const children = this.base.parseParentElementChildren();
            tag.children = children.children;
            tag.childrenStart = children.braces[0].position;
            tag.childrenEnd = children.braces[1].position;
            tag.isParentElement = true;
        }
        else if (token_1.Token.isExpectedType(peek, "Function"))
            tag.children.push(this.base.parseFunction());
        else if (token_1.Token.isExpectedType(peek, "Macro"))
            tag.children.push(new fthtmlelement_1.FTHTMLElement(peek, this.base.parseMacro()));
        this._value = tag;
    }
    initElementWithAttrs(element) {
        element.attrs = this.base.parseAttributes(this.consume());
        if (this.isEOF || self_closing_tags_1.SELF_CLOSING_TAGS.includes(element.token.value))
            return element;
        const peek = this.peek;
        if (token_1.Token.isExpectedType(peek, 'Symbol_{')) {
            const children = this.base.parseParentElementChildren();
            element.children = children.children;
            element.isParentElement = true;
            element.childrenStart = children.braces[0].position;
            element.childrenEnd = children.braces[1].position;
        }
        else if (token_1.Token.isOneOfExpectedTypes(peek, token_1.Token.Sequences.STRINGABLE))
            element.children.push(new fthtmlelement_1.FTHTMLElement(peek, this.base.parseStringOrVariable(this.consume())));
        else if (token_1.Token.isExpectedType(peek, "Function"))
            element.children.push(this.base.parseFunction());
        else if (token_1.Token.isExpectedType(peek, "Macro"))
            element.children.push(new fthtmlelement_1.FTHTMLElement(peek, this.base.parseMacro()));
        return element;
    }
    get value() {
        return this._value;
    }
}
exports.Tag = Tag;
//# sourceMappingURL=tag.js.map