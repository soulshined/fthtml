"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const user_config_1 = require("../../cli/utils/user-config");
const input_stream_1 = require("../../lib/lexer/input-stream");
const fthtml_lexer_1 = require("../lexer/fthtml-lexer");
const grammar_1 = require("../lexer/grammar");
const types_1 = require("../lexer/types");
const index_1 = require("../utils/exceptions/index");
const _ = require("../utils/functions");
const self_closing_tags_1 = require("../utils/self-closing-tags");
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
        let html = this.parseIfOne("Keyword_Doctype");
        html += this.parseWhileType([
            "Word",
            "ELang",
            "Function",
            "Macro",
            "Pragma",
            "Keyword",
            "Variable"
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
            if (t.type == "Word")
                html += this.parseTag();
            else if (t.type == "String")
                html += this.parseString(this.consume());
            else if (t.type == "Variable")
                html += this.parseVariable(this.consume());
            else if (t.type == "ELang")
                html += this.parseElang();
            else if (t.type == "Keyword")
                html += this.parseKeyword();
            else if (t.type == "Pragma")
                this.parseMaybePragma();
            else if (t.type == "Keyword_Doctype")
                html += this.parseKeyword();
            else if (t.type == "Function")
                html += this.parseFunction();
            else if (t.type == "Macro")
                html += this.parseMacro();
            else
                throw new index_1.ftHTMLInvalidTypeError(t, '');
        }
        if (endingtype)
            onendingtype(null, true);
        return html;
    }
    parseWhileTypeForTokens(types, endingtype, onendingtype) {
        let tokens = [];
        while (!this.input.eof()) {
            const t = this.peek();
            if (endingtype && this.isExpectedType(t, endingtype))
                return onendingtype(tokens, false);
            if (!types.includes(t.type))
                throw new index_1.ftHTMLInvalidTypeError(t, '');
            if (["Word", "String", "Variable"].includes(t.type))
                tokens.push(this.consume());
            else if (["ELang", "Keyword", "Pragma", "Function", "Macro"].includes(t.type))
                tokens.push({ type: t.type, position: t.position, value: this.parseWhileType([t.type], null, null, 1) });
            else
                throw new index_1.ftHTMLInvalidTypeError(t, '');
        }
        if (endingtype)
            onendingtype(null, true);
        return tokens;
    }
    parseTypesInOrderForTokens(types, initiator) {
        let tokens = [];
        types.forEach(subtypes => {
            if (this.isEOF())
                throw new index_1.ftHTMLIncompleteElementError(initiator, subtypes.join(', '));
            let last = this.peek();
            if (!this.isOneOfExpectedTypes(last, subtypes))
                throw new index_1.ftHTMLInvalidTypeError(last, subtypes.join(', '));
            tokens.push(this.consume());
        });
        return tokens;
    }
    parseIfOne(type) {
        const t = this.peek();
        if (this.isExpectedType(t, type)) {
            return this.parseWhileType([type], null, null, 1);
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
        else if (this.isExpectedType(peek, "String"))
            return this.createElement(tag, null, this.parseString(this.consume()));
        else if (this.isExpectedType(peek, "Variable"))
            return this.createElement(tag, null, this.parseVariable(this.consume()));
        else if (this.isExpectedType(peek, 'Symbol_('))
            return this.initElementWithAttrs(tag);
        else if (this.isExpectedType(peek, 'Symbol_{'))
            return this.initElementWithChildren(tag);
        else if (this.isExpectedType(peek, "Function"))
            return this.createElement(tag, null, this.parseFunction());
        else if (this.isExpectedType(peek, "Macro"))
            return this.createElement(tag, null, this.parseMacro());
        else
            return this.createElement(tag);
    }
    parseMaybePragma() {
        var _a;
        const pragma = this.consume();
        if (this.input.eof())
            throw new index_1.ftHTMLIncompleteElementError(pragma, `a value body, value definition and possibly an '#end' keyword`);
        if (pragma.value === 'vars') {
            do {
                const t = this.consume();
                if (t.type == "Pragma" && t.value == 'end')
                    return;
                if (t.type != "Word")
                    throw new index_1.ftHTMLInvalidVariableNameError(t, '[\w-]+');
                if (this.input.eof())
                    throw new index_1.ftHTMLIncompleteElementError(t, 'a string or ftHTML block values for variables');
                const peek = this.input.peek();
                if (peek.type == "String")
                    this.vars[this.evaluateENForToken(t)] = this.parseString(this.consume());
                else if (this.isExpectedType(peek, 'Symbol_{'))
                    this.vars[this.evaluateENForToken(t)] = this.parseBindingPropertyValueAsFTHTML();
                else if (this.isExpectedType(peek, "Function"))
                    this.vars[this.evaluateENForToken(t)] = this.parseFunction();
                else if (this.isExpectedType(peek, "Macro"))
                    this.vars[this.evaluateENForToken(t)] = this.parseMacro();
                else if (this.isExpectedType(peek, 'Word_json')) {
                    this.consume();
                    const parsed = this.parseTypesInOrderForTokens([['Symbol_('], ["String"], ['Symbol_)']], peek);
                    const [_, json_file] = parsed;
                    if (json_file.value.startsWith('https:') || json_file.value.startsWith('http:'))
                        throw new index_1.ftHTMLImportError(`Files must be local, can not access '${json_file.value}'`);
                    let dir = (_a = user_config_1.default.jsonDir, (_a !== null && _a !== void 0 ? _a : this.vars._$.__dir));
                    if (json_file.value.startsWith('&')) {
                        dir = this.vars._$.__dir;
                        json_file.value = json_file.value.substring(1);
                    }
                    const file = path.resolve(dir, `${json_file.value}.json`);
                    if (!fs.existsSync(file))
                        throw new index_1.ftHTMLJSONError(`Can not find json file '${file}'`, json_file);
                    const filecontents = fs.readFileSync(file, 'utf-8');
                    try {
                        this.vars[this.evaluateENForToken(t)] = JSON.parse(filecontents);
                    }
                    catch (error) {
                        throw new index_1.ftHTMLJSONError(error.message, json_file);
                    }
                }
                else
                    throw new index_1.ftHTMLInvalidTypeError(peek, 'string or ftHTML block values');
            } while (!this.input.eof());
            throw new index_1.ftHTMLIncompleteElementError(pragma, `Expecting '#end' pragma keyword for starting pragma '${pragma.value}' but none found`, pragma);
        }
        else
            throw new index_1.ftHTMLInvalidKeywordError(pragma);
    }
    parseString(token) {
        let matches = _.getAllMatches(token.value, /(\\)?(\${[ ]*([\w-]+)\?[ ]*})/g);
        for (const [all, escaped, interp, e] of matches) {
            if (escaped) {
                token.value = token.value.replace(all, interp);
                continue;
            }
            const v = this.vars.import[e];
            if (v)
                token.value = token.value.replace(all, v);
            else if (grammar_1.default.macros[e])
                return;
            else
                token.value = token.value.replace(all, '');
        }
        matches = _.getAllMatches(token.value, /(\\)?(\${[ ]*([\w-]+)[ ]*})/g);
        for (const [all, escaped, interp, e] of matches) {
            if (escaped) {
                token.value = token.value.replace(all, interp);
                continue;
            }
            const v = this.vars.import[e];
            if (v)
                token.value = token.value.replace(all, v);
            else if (grammar_1.default.macros[e])
                token.value = token.value.replace(all, grammar_1.default.macros[e].apply());
        }
        matches = _.getAllMatches(token.value, /(\\)?(\${[ ]*@([\w-]+)[ ]*})/g);
        for (const [all, escaped, interp, e] of matches) {
            if (escaped) {
                token.value = token.value.replace(all, interp);
                continue;
            }
            const v = this.vars[e] || user_config_1.default.globalvars[e];
            if (v !== undefined)
                token.value = token.value.replace(all, v);
        }
        matches = _.getAllMatches(token.value, /(\\)?(\${[ ]*@([\w-]+)((\[\d+\])*(?:\.[a-zA-Z0-9][a-zA-Z0-9-_]*(?:\[\d+\])*)+|(?:\[\d+\])+)+[ ]*})/g);
        for (const [all, escaped, interp, e, kvps] of matches) {
            if (escaped) {
                token.value = token.value.replace(all, interp);
                continue;
            }
            let v = this.vars[e];
            if (v === undefined)
                continue;
            const keys = kvps.replace(/\[(\d+)\]/g, ".$1").split(".");
            keys.shift();
            keys.forEach(key => {
                if (v[key] === undefined)
                    throw new index_1.ftHTMLJSONError(`Cannot read property '${key}' of '${all}'`, token);
                v = v[key];
            });
            if (v !== undefined)
                token.value = token.value.replace(all, v);
        }
        return token.value;
    }
    parseVariable(token) {
        const value = this.vars[token.value] !== undefined
            ? this.vars[token.value]
            : user_config_1.default.globalvars[token.value];
        if (value === undefined)
            throw new index_1.ftHTMLVariableDoesntExistError(token);
        return this.parseString({ value, type: token.type, position: token.position });
    }
    parseStringOrVariable(token) {
        if (token.type === "Variable")
            return this.parseVariable(token);
        return this.parseString(token);
    }
    parseKeyword() {
        var _a;
        const keyword = this.consume();
        if (this.input.eof() || !this.isExpectedType(this.peek(), "String"))
            throw new index_1.ftHTMLIncompleteElementError(keyword, 'string values');
        const token = this.consume();
        switch (keyword.value) {
            case 'comment': return `<!-- ${this.parseString(token)} -->`;
            case 'doctype': return `<!DOCTYPE ${this.parseString(token)}>`;
            case 'import':
                if (this.isExpectedType(this.peek(), 'Symbol_{')) {
                    this.vars.import.import = this.parseString(token);
                    return this.parseTemplate();
                }
                let dir = (_a = user_config_1.default.importDir, (_a !== null && _a !== void 0 ? _a : this.vars._$.__dir));
                if (token.value.startsWith('&')) {
                    dir = this.vars._$.__dir;
                    token.value = token.value.substring(1);
                }
                const file = path.resolve(dir, token.value);
                index_1.StackTrace.update(0, 'import', types_1.TokenPosition(keyword.position.line, keyword.position.column));
                return new ftHTMLParser().renderFile(file);
            default:
                throw new index_1.ftHTMLInvalidKeywordError(keyword);
        }
    }
    parseTemplate() {
        var _a;
        const brace = this.consume(), template = Object.assign({}, this.vars.import);
        do {
            const t = this.consume();
            if (this.isExpectedType(t, 'Symbol_}')) {
                let dir = (_a = user_config_1.default.importDir, (_a !== null && _a !== void 0 ? _a : this.vars._$.__dir));
                if (template.import.startsWith('&')) {
                    dir = this.vars._$.__dir;
                    template.import = template.import.substring(1);
                }
                const file = path.resolve(dir, template.import);
                index_1.StackTrace.update(0, 'import template', types_1.TokenPosition(brace.position.line, brace.position.column));
                return new ftHTMLParser({ import: template }).renderFile(file);
            }
            if (t.type != "Word")
                throw new index_1.ftHTMLInvalidVariableNameError(t, '[\w-]+');
            if (this.input.eof())
                throw new index_1.ftHTMLIncompleteElementError(t, 'string, macro, function or ftHTML block values');
            const peek = this.input.peek();
            if (["String", "Variable"].includes(peek.type))
                template[this.evaluateENForToken(t)] = this.parseStringOrVariable(this.consume());
            else if (this.isExpectedType(peek, "Function"))
                template[this.evaluateENForToken(t)] = this.parseFunction();
            else if (this.isExpectedType(peek, "Macro"))
                template[this.evaluateENForToken(t)] = this.parseMacro();
            else if (this.isExpectedType(peek, 'Symbol_{'))
                template[this.evaluateENForToken(t)] = this.parseBindingPropertyValueAsFTHTML();
            else
                throw new index_1.ftHTMLInvalidTypeError(peek, 'string, macro, function or ftHTML block values');
        } while (!this.input.eof());
        throw new index_1.ftHTMLInvalidTypeError(brace, `an opening and closing braces for template imports`);
    }
    parseBindingPropertyValueAsFTHTML() {
        const brace = this.consume();
        return this.parseWhileType(["Word", "ELang", "String", "Keyword", "Variable", "Function", "Macro"], 'Symbol_}', (html, error) => {
            if (error)
                throw new index_1.ftHTMLInvalidTypeError(brace, 'Symbol_}');
            this.consume();
            return html;
        });
    }
    parseElang() {
        const elang = this.input.next();
        const peek = this.peek();
        if (this.input.eof() || peek.type != "ElangB")
            throw new index_1.ftHTMLIncompleteElementError(elang, 'opening and closing braces', peek);
        const { value } = this.input.next();
        switch (elang.value) {
            case 'js':
                return this.createElement('script', null, value);
            case 'css':
                return this.createElement('style', null, value);
            default:
                throw new index_1.ftHTMLInvalidTypeError(elang, "'css','js'");
        }
    }
    parseFunction() {
        const func = this.consume();
        if (!this.isExpectedType(this.peek(), 'Symbol_('))
            throw new index_1.ftHTMLInvalidTypeError(this.peek(), 'opening and closing parenthesis');
        this.consume();
        const funcrules = grammar_1.default.functions[func.value], params = Object.values(funcrules.argPatterns);
        let args = [];
        if (funcrules.argsSequenceStrict) {
            args = this.parseFunctionArgsInOrder(params.filter(param => param.isRestParameter === undefined), func);
            const restParameters = params.filter(param => param.isRestParameter !== undefined);
            if (restParameters.length === 1) {
                args.push(...this.parseWhileTypeForTokens(restParameters[0].type, 'Symbol_)', (tokens, error) => {
                    if (error)
                        throw new index_1.ftHTMLIncompleteElementError(func, "opening and closing parenthesis");
                    this.consume();
                    return tokens;
                }));
            }
            else if (this.isEOF()) {
                throw new index_1.ftHTMLIncompleteElementError(func, 'opening and closing parenthesis');
            }
            else if (!this.isExpectedType(this.peek(), 'Symbol_)')) {
                throw new index_1.ftHTMLInvalidTypeError(this.peek(), 'a closing parenthesis for functions');
            }
            else {
                this.consume();
            }
        }
        else {
            args = this.parseWhileTypeForTokens([...new Set(params.map(param => param.type).flat())], 'Symbol_)', (tokens, error) => {
                if (error)
                    throw new index_1.ftHTMLIncompleteElementError(func, "opening and closing parenthesis");
                this.consume();
                return tokens;
            });
        }
        if (args.length < params.filter(m => !m.isOptional).length)
            throw new index_1.ftHTMLNotEnoughArgumentsError(func, params.filter(m => !m.isOptional).length, args.length);
        const values = args.map(m => {
            return ["Variable", "String"].includes(m.type)
                ? this.parseStringOrVariable(m)
                : m.value;
        });
        const result = grammar_1.default.functions[func.value].do(...values);
        if (result.error)
            throw new index_1.ftHTMLFunctionError(result.msg, func);
        return result.value;
    }
    parseFunctionArgsInOrder(argPatterns, initiator) {
        let tokens = [];
        argPatterns.forEach((arg, index) => {
            if (this.isEOF()) {
                const args = arg.type;
                const lastarg = args.pop();
                throw new index_1.ftHTMLIncompleteElementError(initiator, `a ${args.join(', ')} or ${lastarg} arg for argument '${arg.name}' at position ${index + 1}`);
            }
            let peek = this.peek();
            if (!this.isOneOfExpectedTypes(peek, arg.type))
                if (arg.isOptional === true)
                    return;
                else
                    throw new index_1.ftHTMLIllegalArgumentTypeError(arg, initiator, peek);
            if (this.isExpectedType(peek, "Function")) {
                tokens.push({ value: this.parseFunction(), type: "String", position: peek.position });
                return;
            }
            else if (this.isExpectedType(peek, "Macro")) {
                tokens.push({ value: this.parseMacro(), type: "String", position: peek.position });
                return;
            }
            let val = ["Variable", "String"].includes(peek.type)
                ? this.parseStringOrVariable(peek)
                : peek.value;
            if (arg.possibleValues !== undefined && !arg.possibleValues.includes(val.toLowerCase()) && !arg.default)
                throw new index_1.ftHTMLIllegalArgumentError(arg, index, initiator, peek);
            tokens.push(this.consume());
        });
        return tokens;
    }
    parseMacro() {
        return grammar_1.default.macros[this.consume().value].apply();
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
            if (t.type == "Symbol" && t.value == ')') {
                if (self_closing_tags_1.SELF_CLOSING_TAGS.includes(tag))
                    return this.createElement(tag, attrs);
                if (this.isExpectedType(peek, 'Symbol_{'))
                    return this.initElementWithChildren(tag, attrs);
                else if (this.isExpectedType(peek, "String"))
                    return this.createElement(tag, attrs, this.parseString(this.consume()));
                else if (this.isExpectedType(peek, "Variable"))
                    return this.createElement(tag, attrs, this.parseVariable(this.consume()));
                else if (this.isExpectedType(peek, "Function"))
                    return this.createElement(tag, attrs, this.parseFunction());
                else if (this.isExpectedType(peek, "Macro"))
                    return this.createElement(tag, attrs, this.parseMacro());
                else
                    return this.createElement(tag, attrs);
            }
            if (!["Word", "Attr_Class", "Attr_Class_Var", "Attr_Id", "Variable"].includes(t.type))
                throw new index_1.ftHTMLInvalidTypeError(t, 'an attribute selector, identifier or word');
            if (t.type == "Attr_Class")
                attrs.classes.push(t.value);
            else if (t.type == "Attr_Class_Var")
                attrs.classes.push(this.parseVariable(t));
            else if (t.type == "Attr_Id") {
                if (attrs.id)
                    throw new index_1.ftHTMLParserError('An id has already been assigned to this element', t);
                attrs.id = t.value;
            }
            else if (t.type == "Variable")
                attrs.misc += ` ${this.parseVariable(t)}`;
            else {
                if (this.isExpectedType(peek, 'Symbol_=')) {
                    this.consume();
                    peek = this.peek();
                    if (!["String", "Word", "Variable", "Macro"].includes(peek.type))
                        throw new index_1.ftHTMLInvalidTypeError(peek, 'a key value pair');
                    if (peek.type == "String")
                        attrs.misc += ` ${t.value}="${this.parseString(this.consume())}"`;
                    else if (peek.type == "Variable")
                        attrs.misc += ` ${t.value}="${this.parseVariable(this.consume())}"`;
                    else if (peek.type == "Macro")
                        attrs.misc += ` ${t.value}="${this.parseMacro()}"`;
                    else
                        attrs.misc += ` ${t.value}="${this.consume().value}"`;
                }
                else
                    attrs.misc += ` ${t.value}`;
            }
        } while (!this.input.eof());
        throw new index_1.ftHTMLIncompleteElementError(t, 'opening and closing braces');
    }
    initElementWithChildren(tag, attrs) {
        const sym = this.consume();
        return this.parseWhileType(["Word", "ELang", "Pragma", "String", "Keyword", "Variable", "Function", "Macro"], 'Symbol_}', (html, error) => {
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
        return actual && (actual.type === expected || `${actual.type}_${actual.value}` === expected);
    }
    isOneOfExpectedTypes(actual, expected) {
        return actual && (expected.includes(actual.type) || expected.includes(`${actual.type}_${actual.value}`));
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
