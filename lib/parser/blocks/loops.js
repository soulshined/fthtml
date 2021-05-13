"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fthtml_exceptions_1 = require("../../model/exceptions/fthtml-exceptions");
const fthtmlelement_1 = require("../../model/fthtmlelement");
const html_builder_1 = require("../../model/html-builder");
const token_1 = require("../../model/token");
const utils_1 = require("../../utils");
const abstract_1 = require("./abstract");
class Loops extends abstract_1.AbstractBlock {
    constructor(base) {
        super(base);
        this.parse();
    }
    get value() {
        return this._value;
    }
    parse() {
        const loop = new fthtmlelement_1.FTHTMLElement(this.consume());
        loop.isParentElement = true;
        const [iterable, _] = this.base.parseTypesInOrder([
            [...token_1.Token.Sequences.VARIABLE, 'Function_keys', 'Function_values', 'Function_str_split', 'Function_range', 'Function_sort'],
            ['Symbol_{']
        ], loop.token);
        loop.childrenStart = _.token.position;
        loop.parsedValue = '';
        if (!utils_1.Utils.Types.isArray(iterable.parsedValue))
            throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.InvalidType(iterable.token, 'an iterable object');
        const prevThis = this.vars.this;
        const it = iterable.parsedValue;
        const input = this.base.clone();
        this.vars['this'] = it[0];
        loop.children = this.base.parseWhileType(token_1.Token.Sequences.TOP_LEVEL, ['Symbol_}'], ((elements, err) => {
            if (err)
                throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.IncompleteElement(loop.token, 'opening and closing braces');
            loop.childrenEnd = this.consume().position;
            return elements;
        }));
        loop.parsedValue += html_builder_1.HTMLBuilder.build(loop.children);
        for (let i = 1; i < it.length; i++) {
            const e = it[i];
            this.vars['this'] = e;
            const cloned = input.clone();
            const elements = cloned.parseWhileType(token_1.Token.Sequences.TOP_LEVEL, ['Symbol_}'], ((elements, err) => {
                if (err)
                    throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.IncompleteElement(loop.token, 'opening and closing braces');
                return elements;
            }));
            loop.parsedValue += html_builder_1.HTMLBuilder.build(elements);
        }
        this.vars['this'] = prevThis;
        loop.children.unshift(iterable);
        this._value = loop;
    }
}
exports.Loops = Loops;
//# sourceMappingURL=loops.js.map