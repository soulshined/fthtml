"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fthtml_exceptions_1 = require("../../model/exceptions/fthtml-exceptions");
const fthtmlelement_1 = require("../../model/fthtmlelement");
const html_builder_1 = require("../../model/html-builder");
const token_1 = require("../../model/token");
const fthtml_parser_1 = require("../fthtml-parser");
const abstract_1 = require("./abstract");
class ImportBlock extends abstract_1.AbstractBlock {
    constructor(keyword, value, base) {
        super(base);
        this.parse(keyword, value);
    }
    get value() {
        return this._value;
    }
    parse(keyword, value) {
        var _a;
        const valElement = new fthtmlelement_1.FTHTMLElement(value, this.base.parseStringOrVariable(value).toString());
        if (!this.isEOF && token_1.Token.isExpectedType(this.peek, 'Symbol_{')) {
            this.vars.import.import = valElement.parsedValue;
            keyword.isParentElement = true;
            const template = this.parseTemplate(keyword.token);
            keyword.children.push(valElement, ...template.children);
            keyword.parsedValue = template.parsedValue;
            keyword.childrenStart = template.childrenStart;
            keyword.childrenEnd = template.childrenEnd;
            template.childrenStart = undefined;
            template.childrenEnd = undefined;
            this._value = keyword;
            return;
        }
        let dir = (_a = this.uconfig.importDir, (_a !== null && _a !== void 0 ? _a : this.base.vars._$.__dir));
        if (valElement.parsedValue.startsWith('&')) {
            dir = this.base.vars._$.__dir;
            valElement.parsedValue = valElement.parsedValue.substring(1);
        }
        const file = path.resolve(dir, valElement.parsedValue);
        fthtml_exceptions_1.FTHTMLExceptions.Stack.update(0, 'import', token_1.Token.Position.create(keyword.token.position.line, keyword.token.position.column));
        const elements = new fthtml_parser_1.FTHTMLParser(this.uconfig).parseFile(file);
        keyword.children.push(valElement);
        keyword.parsedValue = html_builder_1.HTMLBuilder.build(elements);
        this._value = keyword;
    }
    parseTemplate(token) {
        var _a;
        const lBrace = this.consume(), template = Object.assign({}, this.vars.import), elements = this.base.consumeComments();
        while (!this.isEOF) {
            const t = new fthtmlelement_1.FTHTMLElement(this.consume());
            if (token_1.Token.isExpectedType(t.token, 'Symbol_}')) {
                let dir = (_a = this.uconfig.importDir, (_a !== null && _a !== void 0 ? _a : this.base.vars._$.__dir));
                if (template.import.startsWith('&')) {
                    dir = this.vars._$.__dir;
                    template.import = template.import.substring(1);
                }
                const file = path.resolve(dir, template.import);
                fthtml_exceptions_1.FTHTMLExceptions.Stack.update(0, 'import template', token_1.Token.Position.create(lBrace.position.line, lBrace.position.column));
                const parsed = html_builder_1.HTMLBuilder.build(new fthtml_parser_1.FTHTMLParser(this.uconfig, { import: template }).parseFile(file));
                const result = new fthtmlelement_1.FTHTMLElement(token, parsed, elements);
                result.childrenStart = lBrace.position;
                result.childrenEnd = t.token.position;
                return result;
            }
            if (!token_1.Token.isExpectedType(t.token, "Word"))
                throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.InvalidVariableName(t.token, '[\w-]+');
            this.throwIfEOF(new fthtml_exceptions_1.FTHTMLExceptions.Parser.IncompleteElement(t.token, 'string, macro, function or ftHTML block values'));
            token_1.Token.evaluate(t.token);
            const peek = this.peek;
            if (token_1.Token.isOneOfExpectedTypes(peek, token_1.Token.Sequences.STRINGABLE)) {
                const str = this.base.parseStringOrVariable(this.consume());
                template[t.token.value] = str;
                t.children.push(new fthtmlelement_1.FTHTMLElement(peek, str));
            }
            else if (token_1.Token.isExpectedType(peek, "Function")) {
                const func = this.base.parseFunction();
                template[t.token.value] = func.parsedValue;
                t.children.push(func);
            }
            else if (token_1.Token.isExpectedType(peek, "Macro")) {
                const parsedValue = this.base.parseMacro();
                template[t.token.value] = parsedValue;
                t.children.push(new fthtmlelement_1.FTHTMLElement(peek, parsedValue));
            }
            else if (token_1.Token.isExpectedType(peek, 'Symbol_{')) {
                const children = this.base.parseParentElementChildren(token_1.Token.Sequences.CHILDREN_NO_PRAGMA);
                t.childrenStart = children.braces[0].position;
                t.childrenEnd = children.braces[1].position;
                t.children = children.children;
                t.isParentElement = true;
                t.parsedValue = html_builder_1.HTMLBuilder.build(t.children);
                template[t.token.value] = t.parsedValue;
            }
            else
                throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.InvalidType(peek, 'string, macro, function or ftHTML block values');
            elements.push(t, ...this.base.consumeComments());
        }
        throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.InvalidType(lBrace, `an opening and closing braces for template imports`);
    }
}
exports.ImportBlock = ImportBlock;
//# sourceMappingURL=import.js.map