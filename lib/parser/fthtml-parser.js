"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const user_config_helper_1 = require("../../cli/utils/user-config-helper");
const fthtml_lexer_1 = require("../lexer/fthtml-lexer");
const grammar_1 = require("../lexer/grammar");
const input_stream_1 = require("../lexer/streams/input-stream");
const fthtml_exceptions_1 = require("../model/exceptions/fthtml-exceptions");
const fthtmlelement_1 = require("../model/fthtmlelement");
const html_builder_1 = require("../model/html-builder");
const token_1 = require("../model/token");
const abstract_1 = require("./abstract");
const elang_1 = require("./blocks/elang");
const function_1 = require("./blocks/function");
const keyword_1 = require("./blocks/keyword");
const loops_1 = require("./blocks/loops");
const pragma_1 = require("./blocks/pragma");
const stringable_1 = require("./blocks/stringable");
const tag_1 = require("./blocks/tag");
const tinyt_1 = require("./blocks/tinyt");
function ParserVariables(vars) {
    let variables = vars || {};
    variables.import = variables.import || {};
    let __dir = '';
    let __filename = '';
    if (variables._$) {
        __dir = variables._$.__dir || '';
        __filename = variables._$.__filename || '';
    }
    variables._$ = Object.seal({ __dir, __filename });
    return variables;
}
class FTHTMLBaseParser extends abstract_1.AbstractParser {
    constructor(input, configs, vars, shouldOmit, tinyts = {}) {
        super();
        this._input = input;
        this.vars = ParserVariables(vars);
        this.shouldOmit = shouldOmit;
        this.tinyts = tinyts;
        this.uconfig = configs;
    }
    parse(...args) {
        throw new Error('Method not implemented.');
    }
    parseWhileType(types, endingtypes, onendingtype, and_only_n_times = Number.POSITIVE_INFINITY) {
        let elements = [];
        let iterations = 0;
        while (!this.isEOF && iterations++ < and_only_n_times) {
            const peek = this.peek;
            if (endingtypes && token_1.Token.isOneOfExpectedTypes(peek, endingtypes))
                return onendingtype(elements, false);
            if (!types.includes(peek.type))
                throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.InvalidType(peek, '');
            if (token_1.Token.isExpectedType(peek, "Word") && (this.tinyts[peek.value] !== undefined || this.uconfig.tinytemplates[peek.value] !== undefined))
                elements.push(new tinyt_1.TinyT(this).value);
            else if (token_1.Token.isExpectedType(peek, "Word"))
                elements.push(new tag_1.Tag(this).value);
            else if (token_1.Token.isOneOfExpectedTypes(peek, token_1.Token.Sequences.STRINGABLE))
                elements.push(new fthtmlelement_1.FTHTMLElement(peek, this.parseStringOrVariable(this.consume())));
            else if (token_1.Token.isExpectedType(peek, "ELang"))
                elements.push(this.parseElang());
            else if (token_1.Token.isExpectedType(peek, 'Keyword_each'))
                elements.push(new loops_1.Loops(this).value);
            else if (token_1.Token.isOneOfExpectedTypes(peek, ["Keyword", "Keyword_Doctype"]))
                elements.push(new keyword_1.Keyword(this).value);
            else if (token_1.Token.isExpectedType(peek, "Pragma"))
                elements.push(new pragma_1.Pragma(this).value);
            else if (token_1.Token.isExpectedType(peek, "Function"))
                elements.push(this.parseFunction());
            else if (token_1.Token.isExpectedType(peek, "Macro"))
                elements.push(new fthtmlelement_1.FTHTMLElement(peek, this.parseMacro()));
            else if (token_1.Token.isExpectedType(peek, "Operator"))
                elements.push(new fthtmlelement_1.FTHTMLElement(peek, this.consume().value));
            else if (token_1.Token.isOneOfExpectedTypes(peek, token_1.Token.Sequences.COMMENTS))
                elements.push(new fthtmlelement_1.FTHTMLElement(this.consume()));
            else
                throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.InvalidType(peek, '');
        }
        if (endingtypes)
            onendingtype(null, true);
        return elements;
    }
    parseTypesInOrder(types, initiator) {
        let elements = [];
        types.forEach(subtypes => {
            this.throwIfEOF(new fthtml_exceptions_1.FTHTMLExceptions.Parser.IncompleteElement(initiator, token_1.Token.joinTypes(subtypes)));
            let last = this.peek;
            if (token_1.Token.isOneOfExpectedTypes(last, subtypes)) {
                if (token_1.Token.isOneOfExpectedTypes(last, token_1.Token.Sequences.ORDERED))
                    elements.push(...this.parseWhileType(token_1.Token.Sequences.ORDERED, null, null, 1));
                else
                    elements.push(new fthtmlelement_1.FTHTMLElement(this.consume()));
            }
            else
                throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.InvalidType(last, token_1.Token.joinTypes(subtypes));
        });
        return elements;
    }
    parseIfOne(type) {
        const peek = this.peek;
        if (token_1.Token.isExpectedType(peek, type))
            return this.parseWhileType([type], null, null, 1)[0];
    }
    parseParentElementChildren(types = token_1.Token.Sequences.CHILDREN) {
        const braces = [this.consume()];
        const children = this.parseWhileType(types, ['Symbol_}'], (elements, error) => {
            if (error)
                throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.InvalidType(braces[0], 'Symbol_}');
            braces.push(this.consume());
            return elements;
        });
        return { children, braces };
    }
    parseAttributes(parenthesis) {
        const attrs = new fthtmlelement_1.FTHTMLElement.Attributes().default;
        while (!this.isEOF) {
            const t = this.consume();
            if (token_1.Token.isExpectedType(t, 'Symbol_)'))
                return attrs;
            if (!["Word", "Attr_Class", "Attr_Class_Var", "Attr_Class_Literal_Var", "Attr_Id", ...token_1.Token.Sequences.VARIABLE].includes(t.type))
                throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.InvalidType(t, 'an attribute selector, identifier or word');
            if (t.type == "Attr_Class")
                attrs.get('classes').push(new fthtmlelement_1.FTHTMLElement(t, t.value));
            else if (token_1.Token.isOneOfExpectedTypes(t, ["Attr_Class_Var", "Attr_Class_Literal_Var"]))
                attrs.get('classes').push(new fthtmlelement_1.FTHTMLElement(t, this.parseStringOrVariable(t)));
            else if (t.type == "Attr_Id") {
                if (attrs.get('id').length > 0)
                    throw new fthtml_exceptions_1.FTHTMLExceptions.Parser('An id has already been assigned to this element', t);
                attrs.get('id').push(new fthtmlelement_1.FTHTMLElement(t, t.value));
            }
            else if (token_1.Token.Sequences.VARIABLE.includes(t.type))
                attrs.get('misc').push(new fthtmlelement_1.FTHTMLElement(t, this.parseStringOrVariable(t)));
            else {
                let peek = this.peek;
                if (!this.isEOF && token_1.Token.isExpectedType(peek, 'Symbol_=')) {
                    this.consume();
                    peek = this.peek;
                    this.throwIfEOF(new fthtml_exceptions_1.FTHTMLExceptions.Parser.InvalidType(peek, 'a key value pair'));
                    if (![...token_1.Token.Sequences.STRINGABLE, "Word", "Macro"].includes(peek.type))
                        throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.InvalidType(peek, 'a key value pair');
                    if (token_1.Token.isOneOfExpectedTypes(peek, token_1.Token.Sequences.STRINGABLE))
                        attrs.get('kvps').push(new fthtmlelement_1.FTHTMLElement(t, t.value, [new fthtmlelement_1.FTHTMLElement(peek, this.parseStringOrVariable(this.consume()))]));
                    else if (peek.type == "Macro")
                        attrs.get('kvps').push(new fthtmlelement_1.FTHTMLElement(t, t.value, [new fthtmlelement_1.FTHTMLElement(peek, this.parseMacro())]));
                    else
                        attrs.get('kvps').push(new fthtmlelement_1.FTHTMLElement(t, t.value, [new fthtmlelement_1.FTHTMLElement(peek, this.consume().value)]));
                }
                else
                    attrs.get('misc').push(new fthtmlelement_1.FTHTMLElement(t, t.value));
            }
        }
        ;
        throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.IncompleteElement(parenthesis, 'opening and closing braces');
    }
    parseStringOrVariable(token) {
        return new stringable_1.Stringable(token, this).value;
    }
    consumeComments() {
        const comments = [];
        while (!this.isEOF && token_1.Token.isOneOfExpectedTypes(this.peek, token_1.Token.Sequences.COMMENTS))
            comments.push(new fthtmlelement_1.FTHTMLElement(this.consume()));
        return comments;
    }
    parseFunction() {
        return new function_1.Function(this).value;
    }
    callFunction(name, caller, expecting, ...args) {
        const result = grammar_1.default.functions[name].do(...args);
        if (result.error)
            throw new fthtml_exceptions_1.FTHTMLExceptions.Parser(result.msg, caller, expecting);
        return result.value;
    }
    parseMacro() {
        return grammar_1.default.macros[this.consume().value].apply();
    }
    parseElang() {
        return new elang_1.ELang(this).value;
    }
    updateVariable(token, value) {
        if (!this.shouldOmit)
            this.vars[token.value] = value;
    }
    updateTinyTemplate(tinytempl, tinyt) {
        if (!this.shouldOmit)
            this.tinyts[tinytempl.token.value] = tinyt;
    }
    get value() {
        return this._value;
    }
    clone() {
        const p = new FTHTMLParser(this.uconfig, this.vars, this.tinyts);
        p._input = new fthtml_lexer_1.FTHTMLLexer(this._input.clone()).stream();
        return p;
    }
}
exports.FTHTMLBaseParser = FTHTMLBaseParser;
class FTHTMLParser extends FTHTMLBaseParser {
    constructor(config, vars, tinyts) {
        super(null, (config !== null && config !== void 0 ? config : user_config_helper_1.defaults), vars, false, tinyts);
    }
    initStack(filepath) {
        const file = path.resolve(`${filepath}.fthtml`);
        if (!fs.existsSync(file))
            throw new fthtml_exceptions_1.FTHTMLExceptions.Import(`Can not find file '${file}' to parse`, null, this.vars._$.__filename);
        this.vars._$.__dir = path.dirname(file);
        this.vars._$.__filename = file;
        fthtml_exceptions_1.FTHTMLExceptions.Stack.add(file);
    }
    compile(src) {
        return html_builder_1.HTMLBuilder.build(this.parseSrc(src));
    }
    compileTinyTemplate(src) {
        const parser = new FTHTMLParser(this.uconfig, this.vars);
        parser.parse(new fthtml_lexer_1.FTHTMLLexer(input_stream_1.default(src)).stream());
        return parser.tinyts;
    }
    parseSrc(src, filepath) {
        try {
            if (filepath)
                this.initStack(filepath);
            const elements = new FTHTMLParser(this.uconfig, this.vars).parse(new fthtml_lexer_1.FTHTMLLexer(input_stream_1.default(src)).stream());
            if (filepath)
                fthtml_exceptions_1.FTHTMLExceptions.Stack.remove(1);
            return elements;
        }
        catch (error) {
            throw error;
        }
    }
    renderFile(file) {
        const elements = this.parseFile(file);
        return html_builder_1.HTMLBuilder.build(elements);
    }
    parseFile(file) {
        if (file.startsWith('https:') || file.startsWith('http:'))
            throw new fthtml_exceptions_1.FTHTMLExceptions.Import(`Files must be local, can not access '${file}'`, null, this.vars._$.__filename);
        this.initStack(file);
        file = path.resolve(`${file}.fthtml`);
        const tokens = new fthtml_lexer_1.FTHTMLLexer(input_stream_1.default(fs.readFileSync(file, 'utf8'))).stream();
        const elements = this.parse(tokens);
        fthtml_exceptions_1.FTHTMLExceptions.Stack.remove(1);
        return elements;
    }
    parse(input) {
        this._input = input;
        let elements = [];
        const doctype = this.parseIfOne("Keyword_Doctype");
        if (doctype)
            elements.push(doctype);
        elements.push(...this.parseWhileType(token_1.Token.Sequences.TOP_LEVEL));
        return elements;
    }
}
exports.FTHTMLParser = FTHTMLParser;
//# sourceMappingURL=fthtml-parser.js.map