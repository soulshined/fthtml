"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fthtml_exceptions_1 = require("../../model/exceptions/fthtml-exceptions");
const fthtmlelement_1 = require("../../model/fthtmlelement");
const html_builder_1 = require("../../model/html-builder");
const token_1 = require("../../model/token");
const utils_1 = require("../../utils");
const abstract_1 = require("./abstract");
class TinyT extends abstract_1.AbstractBlock {
    constructor(base) {
        super(base);
        this.parse();
    }
    get value() {
        return this._value;
    }
    parse() {
        const word = new fthtmlelement_1.FTHTMLElement(this.consume());
        const uconfigtt = this.uconfig.tinytemplates[word.token.value];
        const tt = this.tinyts[word.token.value] || uconfigtt;
        let result = tt.clone();
        if (uconfigtt !== undefined && this.tinyts[word.token.value] === undefined) {
            try {
                const fthtml = `#templates ${word.token.value} ${result.value.value} #end`;
                const tts = this.base.compileTinyTemplate(fthtml);
                result = tts[word.token.value].clone();
                result.origin = uconfigtt.origin;
            }
            catch (error) { }
        }
        if (token_1.Token.isExpectedType(this.peek, 'Symbol_(')) {
            this.consume();
            word.attrs = this.base.parseAttributes(word.token);
            if (!result.attrs)
                result.attrs = word.attrs;
            else {
                if (result.attrs.get('id').length === 0)
                    result.attrs.get('id').push(...word.attrs.get('id'));
                else if (result.attrs.get('id').length > 0 && word.attrs.get('id').length > 0)
                    throw new fthtml_exceptions_1.FTHTMLExceptions.Parser('Tiny template id is already declared in the global scope', word.token);
                result.attrs.get('classes').push(...word.attrs.get('classes'));
                result.attrs.get('kvps').push(...word.attrs.get('kvps'));
                result.attrs.get('misc').push(...word.attrs.get('misc'));
            }
        }
        const attrPlaceholders = [];
        if (result.attrs)
            result.attrs.get('kvps').forEach((e, index) => {
                const matches = utils_1.Utils.Regex.getAllMatches(e.children[0].parsedValue, /(?<!\\)(\${[ ]*val[ ]*})/g);
                if (matches.length === 0)
                    return;
                attrPlaceholders.push(index);
            });
        const placeholders = utils_1.Utils.Regex.getAllMatches(result.value.value, /(?<!\\)(\${[ ]*val[ ]*})/g);
        if (placeholders.length === 0 && attrPlaceholders.length === 0)
            throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.InvalidTinyTemplatePlaceholder(word.token, this.vars._$.__filename);
        let replacement = '';
        if (token_1.Token.isExpectedType(this.peek, 'Symbol_{')) {
            const elements = this.base.parseParentElementChildren(token_1.Token.Sequences.CHILDREN_NO_PRAGMA);
            word.isParentElement = true;
            word.children = elements.children;
            word.childrenStart = elements.braces[0].position;
            word.childrenEnd = elements.braces[1].position;
            replacement += html_builder_1.HTMLBuilder.build(word.children);
        }
        if (token_1.Token.isOneOfExpectedTypes(this.peek, [...token_1.Token.Sequences.STRINGABLE, "Macro", "Function"])) {
            const elements = this.base.parseWhileType([...token_1.Token.Sequences.STRINGABLE, "Macro", "Function"], null, null, 1);
            word.children = elements;
            replacement += html_builder_1.HTMLBuilder.build(elements);
        }
        if (placeholders.length > 0)
            placeholders.forEach(() => result.value.value = result.value.value.replace(/(?<!\\)(\${[ ]*val[ ]*})/g, replacement));
        if (attrPlaceholders.length > 0)
            attrPlaceholders.forEach(ph => {
                const val = result.attrs.get('kvps')[ph].children[0].parsedValue;
                result.attrs.get('kvps')[ph].children[0].parsedValue = val.replace(/(?<!\\)(\${[ ]*val[ ]*})/g, replacement);
            });
        word.parsedValue = result.element
            ? html_builder_1.HTMLBuilder.build([new fthtmlelement_1.FTHTMLElement(result.element, undefined, [new fthtmlelement_1.FTHTMLElement(result.value, this.base.parseStringOrVariable(result.value))], result.attrs)])
            : html_builder_1.HTMLBuilder.build([new fthtmlelement_1.FTHTMLElement(result.value, this.base.parseStringOrVariable(result.value))]);
        this._value = word;
    }
}
exports.TinyT = TinyT;
//# sourceMappingURL=tinyt.js.map