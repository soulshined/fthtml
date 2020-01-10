"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fthtml_lexer_1 = require("../lexer/fthtml-lexer");
const types_1 = require("../lexer/types");
const index_1 = require("../utils/exceptions/index");
const self_closing_tags_1 = require("../utils/self-closing-tags");
const user_config_1 = require("../../cli/utils/user-config");
const input_stream_1 = require("../../lib/lexer/input-stream");
const _ = require("../utils/functions");
const path = require("path");
const fs = require("fs");
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
class ftHTMLParser {
    constructor(vars) {
        this.vars = ParserVariables(vars);
    }
    compile(src) {
        return new ftHTMLParser().parse(fthtml_lexer_1.ftHTMLexer.TokenStream(input_stream_1.default(src)));
    }
    renderFile(file) {
        if (file.startsWith('https:') || file.startsWith('http:'))
            throw new index_1.ftHTMLImportError(`Files must be local, can not access '${file}'`);
        try {
            file = path.resolve(`${file}.fthtml`);
            if (!fs.existsSync(file))
                throw new index_1.ftHTMLImportError(`Can not find file '${file}' to parse`);
            this.vars._$.__dir = path.dirname(file);
            this.vars._$.__filename = file;
            index_1.StackTrace.add(file);
            const tokens = fthtml_lexer_1.ftHTMLexer.TokenStream(input_stream_1.default(fs.readFileSync(file, 'utf8')));
            let html = this.parse(tokens);
            index_1.StackTrace.remove(1);
            return html;
        }
        catch (error) {
            throw error;
        }
    }
    parse(input) {
        this.input = input;
        let html = this.parseIfOne("Keyword_Doctype" /* KEYWORD_DOCTYPE */);
        html += this.parseWhileType([
            "Word" /* WORD */,
            "ELang" /* ELANG */,
            "Pragma" /* PRAGMA */,
            "Keyword" /* KEYWORD */,
            "Variable" /* VARIABLE */
        ]);
        return html;
    }
    parseWhileType(types, endingtype, onendingtype, and_only_n_times = Number.POSITIVE_INFINITY) {
        let html = '';
        let iterations = 0;
        while (!this.input.eof() && iterations++ < and_only_n_times) {
            const t = this.peek();
            if (endingtype && this.isExpectedType(t, endingtype))
                return onendingtype(html, false);
            if (!types.includes(t.type))
                throw new index_1.ftHTMLInvalidTypeError(t, '');
            if (t.type == "Word" /* WORD */)
                html += this.parseTag();
            else if (t.type == "String" /* STRING */)
                html += this.parseString(this.consume().value);
            else if (t.type == "Variable" /* VARIABLE */)
                html += this.parseVariable(this.consume());
            else if (t.type == "ELang" /* ELANG */)
                html += this.parseElang();
            else if (t.type == "Keyword" /* KEYWORD */) {
                if (t.value == 'template')
                    html += this.parseTemplate();
                else
                    html += this.parseKeyword();
            }
            else if (t.type == "Pragma" /* PRAGMA */)
                this.parseMaybePragma();
            else if (t.type == "Keyword_Doctype" /* KEYWORD_DOCTYPE */)
                html += this.parseKeyword();
            else
                throw new index_1.ftHTMLInvalidTypeError(t, '');
        }
        if (endingtype)
            onendingtype(null, true);
        return html;
    }
    parseIfOne(type) {
        if (this.isEOF())
            return '';
        const t = this.peek();
        if (this.isExpectedType(t, type)) {
            try {
                return this.parseWhileType([type], null, null, 1);
            }
            catch (error) {
                if (!(error instanceof index_1.ftHTMLInvalidTypeError))
                    throw error;
            }
        }
        return '';
    }
    parseTag() {
        const tag = this.evaluateENForToken(this.consume());
        const peek = this.peek();
        if (self_closing_tags_1.SELF_CLOSING_TAGS.includes(tag)) {
            if (this.isExpectedType(peek, 'Symbol_('))
                return this.initElementWithAttrs(tag);
            return this.createElement(tag);
        }
        else if (this.isExpectedType(peek, "String" /* STRING */))
            return this.createElement(tag, null, this.parseString(this.consume().value));
        else if (this.isExpectedType(peek, "Variable" /* VARIABLE */))
            return this.createElement(tag, null, this.parseVariable(this.consume()));
        else if (this.isExpectedType(peek, 'Symbol_('))
            return this.initElementWithAttrs(tag);
        else if (this.isExpectedType(peek, 'Symbol_{'))
            return this.initElementWithChildren(tag);
        else
            return this.createElement(tag);
    }
    parseMaybePragma() {
        const pragma = this.consume();
        if (this.input.eof())
            throw new index_1.ftHTMLIncompleteElementError(pragma, `a value body, value definition and possibly an '#end' keyword`);
        if (pragma.value === 'vars') {
            do {
                const t = this.consume();
                if (t.type == "Pragma" /* PRAGMA */ && t.value == 'end')
                    return;
                if (t.type != "Word" /* WORD */)
                    throw new index_1.ftHTMLInvalidVariableNameError(t, '[\w-]+');
                const peek = this.input.peek();
                if (this.input.eof())
                    throw new index_1.ftHTMLInvalidTypeError(t, 'a string value for variables');
                if (peek.type == "String" /* STRING */)
                    this.vars[this.evaluateENForToken(t)] = this.parseString(this.consume().value);
                else
                    throw new index_1.ftHTMLInvalidTypeError(peek, "String" /* STRING */);
            } while (!this.input.eof());
            throw new index_1.ftHTMLIncompleteElementError(pragma, `Expecting '#end' pragma keyword for starting pragma '${pragma.value}' but none found`, pragma);
        }
        else
            throw new index_1.ftHTMLInvalidKeywordError(pragma);
    }
    parseString(value) {
        let matches = _.getAllMatches(value, /\${[ ]*([\w-]+)\?[ ]*}/g);
        matches.forEach(i => {
            const v = this.vars.import[i[1]];
            if (v)
                value = value.replace(i[0], v);
            else
                value = value.replace(i[0], '');
        });
        matches = _.getAllMatches(value, /\${[ ]*([\w-]+)[ ]*}/g);
        matches.forEach(i => {
            const v = this.vars.import[i[1]];
            if (v)
                value = value.replace(i[0], v);
        });
        matches = _.getAllMatches(value, /\${[ ]*@([\w-]+)[ ]*}/g);
        matches.forEach(i => {
            const v = this.vars[i[1]];
            if (v)
                value = value.replace(i[0], v);
        });
        return value;
    }
    parseVariable(token) {
        if (this.vars[token.value] === undefined)
            throw new index_1.ftHTMLVariableDoesntExistError(token);
        return this.parseString(this.vars[token.value]);
    }
    parseKeyword() {
        var _a;
        const keyword = this.consume();
        if (this.input.eof() || !this.isExpectedType(this.peek(), "String" /* STRING */))
            throw new index_1.ftHTMLIncompleteElementError(keyword, 'string values');
        const { value } = this.consume();
        switch (keyword.value) {
            case 'comment': return `<!-- ${this.parseString(value)} -->`;
            case 'doctype': return `<!DOCTYPE ${this.parseString(value)}>`;
            case 'import':
                let file = path.resolve((_a = user_config_1.default.importDir, (_a !== null && _a !== void 0 ? _a : this.vars._$.__dir)), value);
                index_1.StackTrace.update(0, 'import', types_1.TokenPosition(keyword.position.line, keyword.position.column));
                return new ftHTMLParser().renderFile(file);
            default:
                throw new index_1.ftHTMLInvalidKeywordError(keyword);
        }
    }
    parseTemplate() {
        var _a;
        const template = this.consume();
        if (!this.isExpectedType(this.peek(), 'Symbol_{'))
            throw new index_1.ftHTMLIncompleteElementError(template, `an opening and closing braces for 'template' keyword`, this.peek());
        this.consume();
        do {
            const t = this.consume();
            if (this.isExpectedType(t, 'Symbol_}')) {
                if (!this.vars.import.import)
                    throw new index_1.ftHTMLParserError(`templates require a valid import statement`, t);
                let file = path.resolve((_a = user_config_1.default.templateDir, (_a !== null && _a !== void 0 ? _a : this.vars._$.__dir)), this.vars.import.import);
                index_1.StackTrace.update(0, 'template', types_1.TokenPosition(template.position.line, template.position.column));
                return new ftHTMLParser({ import: this.vars.import }).renderFile(file);
            }
            if (t.type != "Word" /* WORD */ && !this.isExpectedType(t, 'Keyword_import'))
                throw new index_1.ftHTMLInvalidVariableNameError(t, '[\w-]+');
            const peek = this.input.peek();
            if (this.input.eof())
                throw new index_1.ftHTMLIncompleteElementError(t, 'string values');
            if (peek.type == "String" /* STRING */)
                this.vars.import[this.evaluateENForToken(t)] = this.parseString(this.consume().value);
            else
                throw new index_1.ftHTMLIncompleteElementError(peek, 'string values');
        } while (!this.input.eof());
        throw new index_1.ftHTMLInvalidTypeError(template, `an opening and closing braces for 'template' keyword`);
    }
    parseElang() {
        const elang = this.input.next();
        const peek = this.peek();
        if (this.input.eof() || peek.type != "ElangB" /* ELANGB */)
            throw new index_1.ftHTMLIncompleteElementError(elang, 'opening and closing braces', peek);
        const { value } = this.input.next();
        switch (elang.value) {
            case 'js':
                return this.createElement('script', null, value);
            case 'php':
                return `<?php${value}?>`;
            case 'css':
                return this.createElement('style', null, value);
            default:
                throw new index_1.ftHTMLInvalidTypeError(elang, "'css','js','php'");
        }
    }
    evaluateENForToken(token) {
        if (!/^[\w-]+$/.test(token.value))
            throw new index_1.ftHTMLInvalidElementNameError(token, `the following pattern: [\w-]+`);
        return token.value;
    }
    initElementWithAttrs(tag) {
        const t = this.consume();
        if (this.input.eof())
            throw new index_1.ftHTMLIncompleteElementError(t, 'opening and closing braces');
        const attrs = {
            misc: '',
            classes: [],
            id: null,
            toString() {
                let c = this.classes.length > 0 ? ` class="${this.classes.join(' ')}"` : '';
                let i = this.id ? ` id="${this.id}"` : '';
                return `${i}${c}${this.misc}`;
            }
        };
        do {
            const t = this.consume();
            let peek = this.peek();
            if (t.type == "Symbol" /* SYMBOL */ && t.value == ')') {
                if (self_closing_tags_1.SELF_CLOSING_TAGS.includes(tag))
                    return this.createElement(tag, attrs);
                if (this.isExpectedType(peek, 'Symbol_{'))
                    return this.initElementWithChildren(tag, attrs);
                else if (this.isExpectedType(peek, "String" /* STRING */))
                    return this.createElement(tag, attrs, this.parseString(this.consume().value));
                else if (this.isExpectedType(peek, "Variable" /* VARIABLE */))
                    return this.createElement(tag, attrs, this.parseVariable(this.consume()));
                else
                    return this.createElement(tag, attrs);
            }
            if (!["Word" /* WORD */, "Attr_Class" /* ATTR_CLASS */, "Attr_Class_Var" /* ATTR_CLASS_VAR */, "Attr_Id" /* ATTR_ID */, "Variable" /* VARIABLE */].includes(t.type))
                throw new index_1.ftHTMLInvalidTypeError(t, 'an attribute selector, identifier or word');
            if (t.type == "Attr_Class" /* ATTR_CLASS */)
                attrs.classes.push(t.value);
            else if (t.type == "Attr_Class_Var" /* ATTR_CLASS_VAR */)
                attrs.classes.push(this.parseVariable(t));
            else if (t.type == "Attr_Id" /* ATTR_ID */) {
                if (attrs.id)
                    throw new index_1.ftHTMLParserError('An id has already been assigned to this element', t);
                attrs.id = t.value;
            }
            else if (t.type == "Variable" /* VARIABLE */)
                attrs.misc += ` ${this.parseVariable(t)}`;
            else {
                if (this.isExpectedType(peek, 'Symbol_=')) {
                    this.consume();
                    peek = this.peek();
                    if (!["String" /* STRING */, "Word" /* WORD */, "Variable" /* VARIABLE */].includes(peek.type))
                        throw new index_1.ftHTMLInvalidTypeError(peek, 'a key value pair');
                    const kvp = this.consume();
                    if (kvp.type == "String" /* STRING */)
                        attrs.misc += ` ${t.value}="${this.parseString(kvp.value)}"`;
                    else if (kvp.type == "Variable" /* VARIABLE */)
                        attrs.misc += ` ${t.value}="${this.parseVariable(kvp)}"`;
                    else
                        attrs.misc += ` ${t.value}="${kvp.value}"`;
                }
                else
                    attrs.misc += ` ${t.value}`;
            }
        } while (!this.input.eof());
        throw new index_1.ftHTMLIncompleteElementError(t, 'opening and closing braces');
    }
    initElementWithChildren(tag, attrs) {
        const sym = this.consume();
        return this.parseWhileType(["Word" /* WORD */, "ELang" /* ELANG */, "Pragma" /* PRAGMA */, "String" /* STRING */, "Keyword" /* KEYWORD */], 'Symbol_}', (html, error) => {
            if (error)
                throw new index_1.ftHTMLInvalidTypeError(sym, 'Symbol_}');
            this.consume();
            return this.createElement(tag, attrs, html);
        });
    }
    createElement(element, attrs, value) {
        if (self_closing_tags_1.SELF_CLOSING_TAGS.includes(element))
            return `<${element}${attrs ? attrs.toString() : ''}/>`;
        return `<${element}${attrs ? attrs.toString() : ''}>${(value !== null && value !== void 0 ? value : '')}</${element}>`;
    }
    isExpectedType(actual, expected) {
        // NOTE [02-Jan-2020]: assumes eof is irrelevant
        return actual && (actual.type === expected || `${actual.type}_${actual.value}` === expected);
    }
    peek() {
        return this.input.peek();
    }
    consume() {
        return this.input.next();
    }
    isEOF() {
        return this.input.eof();
    }
}
exports.ftHTMLParser = ftHTMLParser;
