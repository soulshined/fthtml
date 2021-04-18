"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const user_config_1 = require("../../cli/utils/user-config");
const input_stream_1 = require("../../lib/lexer/input-stream");
const fthtml_lexer_1 = require("../lexer/fthtml-lexer");
const grammar_1 = require("../lexer/grammar");
const token_1 = require("../lexer/token");
const types_1 = require("../lexer/types");
const index_1 = require("../utils/exceptions/index");
const _ = require("../utils/functions");
const html_builder_1 = require("../utils/html-builder");
const self_closing_tags_1 = require("../utils/self-closing-tags");
const models_1 = require("./models");
let uconfig = user_config_1.default;
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
        this.tinytemplates = {};
        this.shouldOmit = false;
        this.previous = null;
        this.vars = ParserVariables(vars);
    }
    initStack(filepath) {
        const file = path.resolve(`${filepath}.fthtml`);
        if (!fs.existsSync(file))
            throw new index_1.ftHTMLImportError(`Can not find file '${file}' to parse`, null, this.vars._$.__filename);
        this.vars._$.__dir = path.dirname(file);
        this.vars._$.__filename = file;
        index_1.StackTrace.add(file);
    }
    compile(src) {
        return html_builder_1.HTMLBuilder.build(this.parseSrc(src));
    }
    parseSrc(src, filepath, userconfig) {
        if (userconfig)
            uconfig = userconfig;
        try {
            if (filepath)
                this.initStack(filepath);
            const elements = new ftHTMLParser(this.vars).parse(fthtml_lexer_1.ftHTMLexer.TokenStream(input_stream_1.default(src)));
            if (filepath)
                index_1.StackTrace.remove(1);
            return elements;
        }
        catch (error) {
            throw error;
        }
    }
    renderFile(file) {
        return html_builder_1.HTMLBuilder.build(this.parseFile(file));
    }
    parseFile(file, userconfig) {
        if (userconfig)
            uconfig = userconfig;
        if (file.startsWith('https:') || file.startsWith('http:'))
            throw new index_1.ftHTMLImportError(`Files must be local, can not access '${file}'`, null, this.vars._$.__filename);
        try {
            this.initStack(file);
            file = path.resolve(`${file}.fthtml`);
            const tokens = fthtml_lexer_1.ftHTMLexer.TokenStream(input_stream_1.default(fs.readFileSync(file, 'utf8')));
            const elements = this.parse(tokens);
            index_1.StackTrace.remove(1);
            return elements;
        }
        catch (error) {
            throw error;
        }
    }
    compileTinyTemplate(src) {
        const parser = new ftHTMLParser();
        parser.parse(fthtml_lexer_1.ftHTMLexer.TokenStream(input_stream_1.default(src)));
        return parser.tinytemplates;
    }
    parse(input) {
        this.input = input;
        let elements = [];
        const doctype = this.parseIfOne("Keyword_Doctype");
        if (doctype)
            elements.push(doctype);
        elements.push(...this.parseWhileType(types_1.FTHTMLTopLevelElements));
        return elements;
    }
    parseWhileType(types, endingtypes, onendingtype, and_only_n_times = Number.POSITIVE_INFINITY) {
        let elements = [];
        let iterations = 0;
        while (!this.isEOF() && iterations++ < and_only_n_times) {
            const peek = this.peek();
            if (endingtypes && _.isOneOfExpectedTypes(peek, endingtypes))
                return onendingtype(elements, false);
            if (!types.includes(peek.type))
                throw new index_1.ftHTMLInvalidTypeError(peek, '');
            if (_.isExpectedType(peek, "Word") && (this.tinytemplates[peek.value] !== undefined || uconfig.tinytemplates[peek.value] !== undefined))
                elements.push(this.parseTinyTemplate());
            else if (_.isExpectedType(peek, "Word"))
                elements.push(this.parseTag());
            else if (_.isOneOfExpectedTypes(peek, types_1.FTHTMLString))
                elements.push(models_1.ValueFTHTMLElement(peek, this.parseStringOrVariable(this.consume())));
            else if (_.isExpectedType(peek, "ELang"))
                elements.push(this.parseElang());
            else if (_.isOneOfExpectedTypes(peek, ["Keyword", "Keyword_Doctype"]))
                elements.push(this.parseKeyword());
            else if (_.isExpectedType(peek, "Pragma"))
                elements.push(this.parseMaybePragma());
            else if (_.isExpectedType(peek, "Function"))
                elements.push(this.parseFunction());
            else if (_.isExpectedType(peek, "Macro"))
                elements.push(models_1.ValueFTHTMLElement(peek, this.parseMacro()));
            else if (_.isExpectedType(peek, "Operator"))
                elements.push(models_1.ValueFTHTMLElement(peek, this.consume().value));
            else if (_.isOneOfExpectedTypes(peek, types_1.FTHTMLComment))
                elements.push(models_1.FTHTMLElement(this.consume()));
            else
                throw new index_1.ftHTMLInvalidTypeError(peek, '');
        }
        if (endingtypes)
            onendingtype(null, true);
        return elements;
    }
    parseTypesInOrder(types, initiator) {
        let elements = [];
        types.forEach(subtypes => {
            this.throwIfEOF(new index_1.ftHTMLIncompleteElementError(initiator, subtypes.join(', ')));
            let last = this.peek();
            if (_.isOneOfExpectedTypes(last, ["Symbol", "Operator"]) && _.isOneOfExpectedTypes(last, subtypes))
                elements.push(models_1.FTHTMLElement(this.consume()));
            else if (_.isOneOfExpectedTypes(last, subtypes))
                elements.push(...this.parseWhileType(subtypes, null, null, 1));
            else
                throw new index_1.ftHTMLInvalidTypeError(last, subtypes.join(', '));
        });
        return elements;
    }
    parseIfOne(type) {
        const peek = this.peek();
        if (_.isExpectedType(peek, type))
            return this.parseWhileType([type], null, null, 1)[0];
    }
    parseParentElementChildren(types = types_1.FTHTMLChildren) {
        const braces = [this.consume()];
        const children = this.parseWhileType(types, ['Symbol_}'], (elements, error) => {
            if (error)
                throw new index_1.ftHTMLInvalidTypeError(braces[0], 'Symbol_}');
            braces.push(this.consume());
            return elements;
        });
        return { children, braces };
    }
    parseTag() {
        const tag = models_1.FTHTMLElement(this.consume());
        this.evaluateENForToken(tag.token);
        const peek = this.peek();
        if (self_closing_tags_1.SELF_CLOSING_TAGS.includes(tag.token.value)) {
            if (_.isExpectedType(peek, 'Symbol_('))
                return this.initElementWithAttrs(tag);
        }
        else if (_.isOneOfExpectedTypes(peek, types_1.FTHTMLString))
            tag.children.push(models_1.ValueFTHTMLElement(peek, this.parseStringOrVariable(this.consume())));
        else if (_.isExpectedType(peek, 'Symbol_('))
            return this.initElementWithAttrs(tag);
        else if (_.isExpectedType(peek, 'Symbol_{')) {
            const children = this.parseParentElementChildren();
            tag.children = children.children;
            tag.childrenStart = children.braces[0].position;
            tag.childrenEnd = children.braces[1].position;
            tag.isParentElement = true;
        }
        else if (_.isExpectedType(peek, "Function"))
            tag.children.push(this.parseFunction());
        else if (_.isExpectedType(peek, "Macro"))
            tag.children.push(models_1.ValueFTHTMLElement(peek, this.parseMacro()));
        return tag;
    }
    parseVarsPragma(pragma) {
        var _a;
        while (!this.isEOF()) {
            pragma.children.push(...this.consumeComments());
            const t = this.consume();
            if (_.isExpectedType(t, 'Pragma_end')) {
                pragma.childrenStart = pragma.token.position;
                pragma.childrenEnd = t.position;
                return pragma;
            }
            if (!_.isExpectedType(t, "Word"))
                throw new index_1.ftHTMLInvalidVariableNameError(t, '[\w-]+');
            this.evaluateENForToken(t);
            this.throwIfEOF(new index_1.ftHTMLIncompleteElementError(t, 'a string or ftHTML block values for variables'));
            const peek = this.peek();
            if (_.isExpectedType(peek, "String")) {
                const parsed = this.parseString(this.consume());
                this.updateVariable(t, parsed);
                pragma.children.push(models_1.FTHTMLElement(t, [models_1.ValueFTHTMLElement(peek, parsed)]));
            }
            else if (_.isExpectedType(peek, 'Symbol_{')) {
                const variable = models_1.FTHTMLElement(t);
                const elems = this.parseParentElementChildren(types_1.FTHTMLBlock);
                variable.children = elems.children;
                variable.childrenStart = elems.braces[0].position;
                variable.childrenEnd = elems.braces[1].position;
                variable.isParentElement = true;
                pragma.children.push(variable);
                this.updateVariable(t, html_builder_1.HTMLBuilder.build(variable.children));
            }
            else if (_.isExpectedType(peek, "Function")) {
                const func = this.parseFunction();
                pragma.children.push(models_1.FTHTMLElement(t, [func]));
                this.updateVariable(t, func.parsedValue);
            }
            else if (_.isExpectedType(peek, "Macro")) {
                const parsed = this.parseMacro();
                this.updateVariable(t, parsed);
                pragma.children.push(models_1.FTHTMLElement(t, [models_1.ValueFTHTMLElement(peek, parsed)]));
            }
            else if (_.isExpectedType(peek, 'Word_json')) {
                const jsonElem = models_1.FTHTMLElement(this.consume());
                this.parseTypesInOrder([['Symbol_(']], peek);
                if (_.isExpectedType(this.peek(), "String")) {
                    if (this.peek().value.trim().startsWith("${") && this.peek().value.trim().endsWith("}")) {
                        const next = this.peek();
                        const matches = _.getAllMatches(next.value, /(\${[ ]*@([\w-]+)(?:(?:((\[\d+\])*(?:\.[a-zA-Z0-9][a-zA-Z0-9-_]*(?:\[\d+\])*)+|(?:\[\d+\])+)+))?[ ]*(?:\|[ ]*(keys|values)[ ]*)?[ ]*})/gi);
                        if (matches.length > 0) {
                            const [, , e, kvps, , pipe] = matches[0];
                            let v = this.vars[e];
                            if (v !== undefined) {
                                if (kvps) {
                                    const keys = kvps.replace(/\[(\d+)\]/g, ".$1").split(".");
                                    keys.shift();
                                    keys.forEach(key => {
                                        if (v[key] === undefined)
                                            return;
                                        v = v[key];
                                    });
                                }
                                if (v !== undefined) {
                                    this.consume();
                                    this.parseTypesInOrder([['Symbol_)']], peek);
                                    if (pipe && pipe === 'keys') {
                                        v = Object.keys(v);
                                    }
                                    else if (pipe && pipe === 'values') {
                                        v = Object.values(v);
                                    }
                                    this.updateVariable(t, v);
                                    jsonElem.parsedValue = v;
                                    jsonElem.children.push(models_1.ValueFTHTMLElement(next, v));
                                    pragma.children.push(models_1.FTHTMLElement(t, [jsonElem]));
                                    continue;
                                }
                            }
                        }
                    }
                }
                const parsed = this.parseTypesInOrder([["String"], ['Symbol_)']], peek);
                const [json_file] = parsed;
                if (json_file.parsedValue.startsWith('https:') || json_file.parsedValue.startsWith('http:'))
                    throw new index_1.ftHTMLImportError(`Files must be local, can not access '${json_file.token.value}'`, json_file.token);
                let dir = (_a = uconfig.jsonDir, (_a !== null && _a !== void 0 ? _a : this.vars._$.__dir));
                if (json_file.parsedValue.startsWith('&')) {
                    dir = this.vars._$.__dir;
                    json_file.parsedValue = json_file.parsedValue.substring(1);
                }
                const file = path.resolve(dir, `${json_file.parsedValue}.json`);
                if (!fs.existsSync(file))
                    throw new index_1.ftHTMLJSONError(`Can not find json file '${file}'`, json_file.token);
                jsonElem.children.push(models_1.ValueFTHTMLElement(json_file.token, file));
                const filecontents = fs.readFileSync(file, 'utf-8');
                try {
                    const parsed = JSON.parse(filecontents);
                    this.updateVariable(t, parsed);
                    jsonElem.parsedValue = parsed;
                    pragma.children.push(models_1.FTHTMLElement(t, [jsonElem]));
                }
                catch (error) {
                    throw new index_1.ftHTMLJSONError(error.message, json_file.token);
                }
            }
            else
                throw new index_1.ftHTMLInvalidTypeError(peek, 'string or ftHTML block values');
        }
        ;
        throw new index_1.ftHTMLIncompleteElementError(pragma.token, `an '#end' pragma keyword for starting pragma '${pragma.token.value}' but none found`, pragma.token);
    }
    parseTinyTsPragma(pragma) {
        while (!this.isEOF()) {
            pragma.children.push(...this.consumeComments());
            const tinytempl = models_1.FTHTMLElement(this.consume());
            if (_.isExpectedType(tinytempl.token, 'Pragma_end')) {
                pragma.childrenStart = pragma.token.position;
                pragma.childrenEnd = tinytempl.token.position;
                return pragma;
            }
            if (!_.isOneOfExpectedTypes(tinytempl.token, ["Word"]))
                throw new index_1.ftHTMLInvalidTinyTemplateNameError(tinytempl.token, "[\w-]+", this.vars._$.__filename);
            this.evaluateENForToken(tinytempl.token);
            this.throwIfEOF(new index_1.ftHTMLIncompleteElementError(pragma.token, `an '#end' pragma keyword for starting pragma '${pragma.token.value}' but none found`));
            const element = models_1.FTHTMLElement(this.consume());
            if (!_.isOneOfExpectedTypes(element.token, ["Word", "String"]))
                throw new index_1.ftHTMLInvalidTypeError(element.token, 'a string or single ftHTML element');
            if (_.isExpectedType(element.token, "String")) {
                this.updateTinyTemplate(tinytempl, models_1.TinyTemplate(element.token, this.vars._$.__filename));
                element.parsedValue = element.token.value;
                tinytempl.children.push(element);
                pragma.children.push(tinytempl);
                continue;
            }
            this.throwIfEOF(new index_1.ftHTMLIncompleteElementError(pragma.token, `an '#end' pragma keyword for starting pragma '${pragma.token.value}' but none found`));
            const peek = this.peek();
            if (_.isExpectedType(peek, 'Pragma_end')) {
                this.updateTinyTemplate(tinytempl, models_1.TinyTemplate({
                    type: "String",
                    value: '${val}',
                    position: element.token.position
                }, this.vars._$.__filename, element.token));
                tinytempl.children.push(element);
                pragma.children.push(tinytempl);
                continue;
            }
            if (_.isExpectedType(peek, "String")) {
                const str = this.consume();
                this.updateTinyTemplate(tinytempl, models_1.TinyTemplate(str, this.vars._$.__filename, element.token));
                element.children.push(models_1.ValueFTHTMLElement(str, str.value));
            }
            else if (_.isExpectedType(peek, 'Symbol_(')) {
                const lParenth = this.consume();
                this.throwIfEOF(new index_1.ftHTMLIncompleteElementError(element.token, 'closing and opening parenthesis'));
                element.attrs = this.parseAttributes(lParenth);
                let value;
                if (_.isExpectedType(this.peek(), "String")) {
                    const str = this.consume();
                    value = str;
                    element.children.push(models_1.ValueFTHTMLElement(str, str.value));
                }
                else if (this.isEOF() || !_.isExpectedType(this.peek(), "Word") && !_.isExpectedType(this.peek(), 'Pragma_end') && !_.isOneOfExpectedTypes(this.peek(), types_1.FTHTMLComment))
                    throw new index_1.ftHTMLInvalidTypeError(element.token, 'a string or single ftHTML element');
                this.updateTinyTemplate(tinytempl, models_1.TinyTemplate((value !== null && value !== void 0 ? value : {
                    type: "String",
                    value: '${val}',
                    position: element.token.position
                }), this.vars._$.__filename, element.token, element.attrs));
            }
            else if (_.isExpectedType(peek, "Word"))
                this.updateTinyTemplate(tinytempl, models_1.TinyTemplate(element.token, this.vars._$.__filename));
            else
                throw new index_1.ftHTMLInvalidTypeError(element.token, 'a string or single ftHTML element');
            tinytempl.children.push(element);
            pragma.children.push(tinytempl);
        }
        ;
        throw new index_1.ftHTMLIncompleteElementError(pragma.token, `an '#end' pragma keyword for starting pragma '${pragma.token.value}' but none found`);
    }
    parseElseIfElseBlock(pragma, parent) {
        this.shouldOmit = false;
        if (pragma.token.value === 'elif') {
            const expr = this.getIfElseExpression(pragma);
            const elifBlock = this.parseIfBlock(pragma, expr, parent);
            return models_1.ValueFTHTMLElement(pragma.token, parent.parsedValue, elifBlock);
        }
        const children = this.parseWhileType(types_1.FTHTMLTopLevelElements, ['Pragma_end'], (elements, error) => {
            if (error)
                throw new index_1.ftHTMLIncompleteElementError(pragma.token, `an '#end' pragma keyword for starting pragma '${pragma.token.value}' but none found`);
            return elements;
        });
        return models_1.ValueFTHTMLElement(pragma.token, html_builder_1.HTMLBuilder.build(children), children);
    }
    parseIfBlock(pragma, expression, parent) {
        const prevState = this.shouldOmit;
        const isExprResolvedToTrue = token_1.getOperatorExpression(expression);
        if (!isExprResolvedToTrue)
            this.shouldOmit = true;
        const children = this.parseWhileType(types_1.FTHTMLTopLevelElements, ['Pragma_end', 'Pragma_else', 'Pragma_elif'], (elements, error) => {
            if (error)
                throw new index_1.ftHTMLIncompleteElementError(pragma.token, `an '#end' pragma keyword for starting pragma '${pragma.token.value}' but none found`);
            if (_.isOneOfExpectedTypes(this.peek(), ['Pragma_else', 'Pragma_elif'])) {
                const subpragma = this.parseElseIfElseBlock(models_1.FTHTMLElement(this.consume()), parent);
                parent.children.unshift(subpragma);
                if (!isExprResolvedToTrue)
                    parent.parsedValue = subpragma.parsedValue;
            }
            return elements;
        });
        if (isExprResolvedToTrue)
            parent.parsedValue = html_builder_1.HTMLBuilder.build(children);
        this.shouldOmit = prevState;
        children.splice(0, 0, ...expression);
        return children;
    }
    getIfElseExpression(pragma) {
        const types = ["String", "Variable", "Word", "Function", "Macro"];
        const [lhs, operator, rhs] = this.parseTypesInOrder([types, types_1.FTHTMLOperator, types], pragma.token);
        return [lhs, operator, rhs];
    }
    parseIfElsePragma(pragma, parent) {
        while (!this.isEOF()) {
            const ifElseBlock = this.parseIfBlock(pragma, this.getIfElseExpression(pragma), parent);
            pragma.childrenEnd = this.consume().position;
            parent.children.unshift(models_1.ValueFTHTMLElement(pragma.token, html_builder_1.HTMLBuilder.build(ifElseBlock.slice(3)), ifElseBlock));
            return parent.children;
        }
        throw new index_1.ftHTMLIncompleteElementError(pragma.token, `a valid comparator expression`);
    }
    parseMaybePragma() {
        var _a, _b;
        const pragma = models_1.FTHTMLElement(this.consume());
        if (_.isExpectedType(pragma.token, 'Pragma_vars'))
            return this.parseVarsPragma(pragma);
        else if (_.isExpectedType(pragma.token, "Pragma") && pragma.token.value.endsWith('templates'))
            return this.parseTinyTsPragma(pragma);
        else if (_.isExpectedType(pragma.token, 'Pragma_if')) {
            pragma.children = this.parseIfElsePragma(pragma, pragma);
            return pragma;
        }
        else if (_.isExpectedType(pragma.token, 'Pragma_ifdef')) {
            const result = models_1.FTHTMLElement(pragma.token);
            const value = this.parseTypesInOrder([["Word"]], pragma.token)[0];
            result.childrenStart = value.token.position;
            const prevState = this.shouldOmit;
            const shouldOmit = this.vars[value.token.value] === undefined &&
                uconfig.globalvars[value.token.value] === undefined &&
                uconfig.tinytemplates[value.token.value] === undefined &&
                this.tinytemplates[value.token.value] === undefined;
            this.shouldOmit = shouldOmit;
            result.children = this.parseWhileType(types_1.FTHTMLTopLevelElements, ['Pragma_end'], (elements, error) => {
                if (error)
                    throw new index_1.ftHTMLIncompleteElementError(pragma.token, `an '#end' pragma keyword for starting pragma '${pragma.token.value}' but none found`);
                result.childrenEnd = this.consume().position;
                return elements;
            });
            this.shouldOmit = prevState;
            result.parsedValue = shouldOmit ? '' : html_builder_1.HTMLBuilder.build(result.children);
            result.children.unshift(value);
            return result;
        }
        else if (_.isExpectedType(pragma.token, 'Pragma_debug')) {
            const prev = this.previous;
            const value = this.parseTypesInOrder([["String", "Variable", "Word", "Function"]], pragma.token)[0];
            if (uconfig.isdebug) {
                let token = value.token;
                let msg = (_a = value.parsedValue, (_a !== null && _a !== void 0 ? _a : value.token.value));
                if ((_b = value.parsedValue, (_b !== null && _b !== void 0 ? _b : value.token.value)) === '$') {
                    token = prev;
                    msg = prev.value;
                }
                if (_.isExpectedType(token, "Variable") && this.vars[token.value] !== undefined)
                    msg = JSON.stringify(this.vars[token.value], null, uconfig.prettify ? 2 : 0);
                if (uconfig.isdebug)
                    console.log(`[Debug - ${this.vars._$.__filename}@${token.position.line}:${token.position.column}] ${token.type === "Variable" ? `@${token.value} => ` : ''}${msg}`);
            }
            pragma.parsedValue = value.parsedValue;
            pragma.children.push(value);
            return pragma;
        }
        else
            throw new index_1.ftHTMLInvalidKeywordError(pragma.token);
    }
    parseString(token) {
        let val = token.value;
        let matches = _.getAllMatches(val, /(\\)?(\${[ ]*([\w-]+)\?[ ]*})/g);
        for (const [all, escaped, interp, e] of matches) {
            if (escaped) {
                val = val.replace(all, interp);
                continue;
            }
            const v = this.vars.import[e];
            if (v)
                val = val.replace(all, v);
            else if (grammar_1.default.macros[e])
                return;
            else
                val = val.replace(all, '');
        }
        matches = _.getAllMatches(val, /(\\)?(\${[ ]*([\w-]+)[ ]*})/g);
        for (const [all, escaped, interp, e] of matches) {
            if (escaped) {
                val = val.replace(all, interp);
                continue;
            }
            const v = this.vars.import[e];
            if (v)
                val = val.replace(all, v);
            else if (grammar_1.default.macros[e])
                val = val.replace(all, grammar_1.default.macros[e].apply());
        }
        matches = _.getAllMatches(val, /(\\)?(\${[ ]*@([\w-]+)[ ]*})/g);
        for (const [all, escaped, interp, e] of matches) {
            if (escaped) {
                val = val.replace(all, interp);
                continue;
            }
            const v = this.vars[e] || uconfig.globalvars[e];
            if (v !== undefined)
                val = val.replace(all, v);
        }
        matches = _.getAllMatches(val, /(\\)?(\${[ ]*@([\w-]+)((\[\d+\])*(?:\.[a-zA-Z0-9][a-zA-Z0-9-_]*(?:\[\d+\])*)+|(?:\[\d+\])+)+[ ]*})/g);
        for (const [all, escaped, interp, e, kvps] of matches) {
            if (escaped) {
                val = val.replace(all, interp);
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
                val = val.replace(all, v);
        }
        if (typeof val === 'string')
            val = val.replace(new RegExp(`\\\\(${token.delimiter})`, 'g'), '$1');
        return val;
    }
    parseVariable(token) {
        const value = this.vars[token.value] !== undefined
            ? this.vars[token.value]
            : uconfig.globalvars[token.value];
        if (value === undefined && !this.shouldOmit)
            throw new index_1.ftHTMLVariableDoesntExistError(token);
        return this.parseString({ value, type: token.type, position: token.position });
    }
    parseStringOrVariable(token) {
        if (_.isExpectedType(token, "Variable"))
            return this.parseVariable(token);
        return this.parseString(token);
    }
    parseKeyword() {
        var _a;
        const keyword = models_1.FTHTMLElement(this.consume());
        if (this.isEOF() || !_.isExpectedType(this.peek(), "String"))
            throw new index_1.ftHTMLIncompleteElementError(keyword.token, 'string values');
        const value = this.consume();
        switch (keyword.token.value) {
            case 'comment': {
                keyword.children = [models_1.ValueFTHTMLElement(value, `<!-- ${this.parseString(value)} -->`)];
                return keyword;
            }
            case 'doctype': {
                keyword.children = [models_1.ValueFTHTMLElement(value, `<!DOCTYPE ${this.parseString(value)}>`)];
                return keyword;
            }
            case 'import':
                const valElement = models_1.ValueFTHTMLElement(value, this.parseString(value));
                if (!this.isEOF() && _.isExpectedType(this.peek(), 'Symbol_{')) {
                    this.vars.import.import = valElement.parsedValue;
                    keyword.isParentElement = true;
                    const template = this.parseTemplate(keyword.token);
                    keyword.children.push(valElement, ...template.children);
                    keyword.parsedValue = template.parsedValue;
                    keyword.childrenStart = template.childrenStart;
                    keyword.childrenEnd = template.childrenEnd;
                    template.childrenStart = undefined;
                    template.childrenEnd = undefined;
                    return keyword;
                }
                let dir = (_a = uconfig.importDir, (_a !== null && _a !== void 0 ? _a : this.vars._$.__dir));
                if (valElement.parsedValue.startsWith('&')) {
                    dir = this.vars._$.__dir;
                    valElement.parsedValue = valElement.parsedValue.substring(1);
                }
                const file = path.resolve(dir, valElement.parsedValue);
                index_1.StackTrace.update(0, 'import', types_1.TokenPosition(keyword.token.position.line, keyword.token.position.column));
                const elements = new ftHTMLParser().parseFile(file);
                keyword.children.push(valElement);
                keyword.parsedValue = html_builder_1.HTMLBuilder.build(elements);
                return keyword;
            default:
                throw new index_1.ftHTMLInvalidKeywordError(keyword.token);
        }
    }
    parseTemplate(token) {
        var _a;
        const lBrace = this.consume(), template = Object.assign({}, this.vars.import), elements = this.consumeComments();
        while (!this.isEOF()) {
            const t = models_1.FTHTMLElement(this.consume());
            if (_.isExpectedType(t.token, 'Symbol_}')) {
                let dir = (_a = uconfig.importDir, (_a !== null && _a !== void 0 ? _a : this.vars._$.__dir));
                if (template.import.startsWith('&')) {
                    dir = this.vars._$.__dir;
                    template.import = template.import.substring(1);
                }
                const file = path.resolve(dir, template.import);
                index_1.StackTrace.update(0, 'import template', types_1.TokenPosition(lBrace.position.line, lBrace.position.column));
                const parsed = html_builder_1.HTMLBuilder.build(new ftHTMLParser({ import: template }).parseFile(file));
                const result = models_1.ValueFTHTMLElement(token, parsed, elements);
                result.childrenStart = lBrace.position;
                result.childrenEnd = t.token.position;
                return result;
            }
            if (!_.isExpectedType(t.token, "Word"))
                throw new index_1.ftHTMLInvalidVariableNameError(t.token, '[\w-]+');
            this.throwIfEOF(new index_1.ftHTMLIncompleteElementError(t.token, 'string, macro, function or ftHTML block values'));
            this.evaluateENForToken(t.token);
            const peek = this.peek();
            if (_.isOneOfExpectedTypes(peek, types_1.FTHTMLString)) {
                const str = this.parseStringOrVariable(this.consume());
                template[t.token.value] = str;
                t.children.push(models_1.ValueFTHTMLElement(peek, str));
            }
            else if (_.isExpectedType(peek, "Function")) {
                const func = this.parseFunction();
                template[t.token.value] = func.parsedValue;
                t.children.push(func);
            }
            else if (_.isExpectedType(peek, "Macro")) {
                const parsedValue = this.parseMacro();
                template[t.token.value] = parsedValue;
                t.children.push(models_1.ValueFTHTMLElement(peek, parsedValue));
            }
            else if (_.isExpectedType(peek, 'Symbol_{')) {
                const children = this.parseParentElementChildren(types_1.FTHTMLBlock);
                t.childrenStart = children.braces[0].position;
                t.childrenEnd = children.braces[1].position;
                t.children = children.children;
                t.isParentElement = true;
                t.parsedValue = html_builder_1.HTMLBuilder.build(t.children);
                template[t.token.value] = t.parsedValue;
            }
            else
                throw new index_1.ftHTMLInvalidTypeError(peek, 'string, macro, function or ftHTML block values');
            elements.push(t, ...this.consumeComments());
        }
        throw new index_1.ftHTMLInvalidTypeError(lBrace, `an opening and closing braces for template imports`);
    }
    parseTinyTemplate() {
        const word = models_1.FTHTMLElement(this.consume());
        const uconfigtt = uconfig.tinytemplates[word.token.value];
        const tt = this.tinytemplates[word.token.value] || uconfigtt;
        let element = token_1.clone(tt.element);
        let value = token_1.clone(tt.value);
        let fattrs = _.cloneAttributes(tt.attrs);
        if (uconfigtt !== undefined) {
            try {
                const tts = this.compileTinyTemplate(`#templates ${word.token.value} ${value.value} #end`);
                value = tts[word.token.value].value;
                element = tts[word.token.value].element;
                fattrs = _.cloneAttributes(tts[word.token.value].attrs);
            }
            catch (error) { }
        }
        if (_.isExpectedType(this.peek(), 'Symbol_(')) {
            this.consume();
            word.attrs = this.parseAttributes(word.token);
            if (!fattrs)
                fattrs = word.attrs;
            else {
                if (fattrs.get('id').length === 0)
                    fattrs.get('id').push(...word.attrs.get('id'));
                else if (fattrs.get('id').length > 0 && word.attrs.get('id').length > 0)
                    throw new index_1.ftHTMLParserError('Tiny template id is already declared in the global scope', word.token);
                fattrs.get('classes').push(...word.attrs.get('classes'));
                fattrs.get('kvps').push(...word.attrs.get('kvps'));
                fattrs.get('misc').push(...word.attrs.get('misc'));
            }
        }
        const attrPlaceholders = [];
        if (fattrs)
            fattrs.get('kvps').forEach((e, index) => {
                const matches = _.getAllMatches(e.children[0].parsedValue, /(?<!\\)(\${[ ]*val[ ]*})/g);
                if (matches.length === 0)
                    return;
                attrPlaceholders.push(index);
            });
        const placeholders = _.getAllMatches(value.value, /(?<!\\)(\${[ ]*val[ ]*})/g);
        if (placeholders.length === 0 && attrPlaceholders.length === 0)
            throw new index_1.ftHTMLInvalidTinyTemplatePlaceholderError(word.token, this.vars._$.__filename);
        let replacement = '';
        if (_.isExpectedType(this.peek(), 'Symbol_{')) {
            const elements = this.parseParentElementChildren(types_1.FTHTMLBlock);
            word.isParentElement = true;
            word.children = elements.children;
            word.childrenStart = elements.braces[0].position;
            word.childrenEnd = elements.braces[1].position;
            replacement += html_builder_1.HTMLBuilder.build(word.children);
        }
        if (_.isOneOfExpectedTypes(this.peek(), ["String", "Macro", "Function", "Variable"])) {
            const elements = this.parseWhileType(["String", "Macro", "Function", "Variable"], null, null, 1);
            word.children = elements;
            replacement += html_builder_1.HTMLBuilder.build(elements);
        }
        if (placeholders.length > 0)
            placeholders.forEach(() => value.value = value.value.replace(/(?<!\\)(\${[ ]*val[ ]*})/g, replacement));
        if (attrPlaceholders.length > 0)
            attrPlaceholders.forEach(ph => {
                const val = fattrs.get('kvps')[ph].children[0].parsedValue;
                fattrs.get('kvps')[ph].children[0].parsedValue = val.replace(/(?<!\\)(\${[ ]*val[ ]*})/g, replacement);
            });
        word.parsedValue = element
            ? html_builder_1.HTMLBuilder.build([models_1.FTHTMLElement(element, [models_1.ValueFTHTMLElement(value, this.parseString(value))], fattrs)])
            : html_builder_1.HTMLBuilder.build([models_1.ValueFTHTMLElement(value, this.parseString(value))]);
        return word;
    }
    parseElang() {
        const elang = models_1.FTHTMLElement(this.consume());
        if (this.isEOF() || !_.isExpectedType(this.peek(), "ElangB"))
            throw new index_1.ftHTMLIncompleteElementError(elang.token, 'opening and closing braces', this.peek());
        const elangb = this.consume();
        elang.children.push(models_1.ValueFTHTMLElement(elangb, elangb.value));
        switch (elang.token.value) {
            case 'js':
                elang.parsedValue = `<script>${elangb.value}</script>`;
                return elang;
            case 'css':
                elang.parsedValue = `<style>${elangb.value}</style>`;
                return elang;
            default:
                throw new index_1.ftHTMLInvalidTypeError(elang.token, "'css','js'");
        }
    }
    parseFunction() {
        const func = models_1.FTHTMLElement(this.consume());
        this.throwIfEOF(new index_1.ftHTMLIncompleteElementError(func.token, 'opening and closing parenthesis'));
        if (!_.isExpectedType(this.peek(), 'Symbol_('))
            throw new index_1.ftHTMLInvalidTypeError(this.peek(), 'opening and closing parenthesis');
        this.consume();
        const funcrules = grammar_1.default.functions[func.token.value], params = Object.values(funcrules.argPatterns);
        if (funcrules.argsSequenceStrict) {
            func.children = this.parseFunctionArgsInOrder(params.filter(param => param.isRestParameter === undefined), func.token);
            const restParameters = params.filter(param => param.isRestParameter !== undefined);
            if (restParameters.length === 1) {
                func.children.push(...this.parseFunctionArgsWhileType(restParameters[0].type, ['Symbol_)'], (elements, error) => {
                    if (error)
                        throw new index_1.ftHTMLIncompleteElementError(func.token, "opening and closing parenthesis");
                    this.consume();
                    return elements;
                }));
            }
            else if (this.isEOF()) {
                throw new index_1.ftHTMLIncompleteElementError(func.token, 'opening and closing parenthesis');
            }
            else if (!_.isExpectedType(this.peek(), 'Symbol_)')) {
                throw new index_1.ftHTMLInvalidTypeError(this.peek(), 'a closing parenthesis for functions');
            }
            this.consume();
        }
        else {
            func.children = this.parseFunctionArgsWhileType([...new Set(params.map(param => param.type).flat())], ['Symbol_)'], (elements, error) => {
                if (error)
                    throw new index_1.ftHTMLIncompleteElementError(func.token, "opening and closing parenthesis");
                this.consume();
                return elements;
            });
        }
        if (func.children.length < params.filter(m => !m.isOptional).length)
            throw new index_1.ftHTMLNotEnoughArgumentsError(func.token, params.filter(m => !m.isOptional).length, func.children.length);
        const values = func.children.map(m => {
            var _a;
            if (funcrules.useRawVariables && m.token.type === "Variable")
                return funcrules.returnTokenTypes ? [this.vars[m.token.value], m.token.type] : this.vars[m.token.value];
            let val = (_a = m.parsedValue, (_a !== null && _a !== void 0 ? _a : m.token.value));
            if ("String".includes(m.token.type))
                val = this.parseStringOrVariable(m.token);
            if (funcrules.returnTokenTypes)
                return [val, m.token.type];
            else
                return val;
        });
        const result = grammar_1.default.functions[func.token.value].do(...values);
        if (result.error)
            throw new index_1.ftHTMLFunctionError(result.msg, func.token);
        func.parsedValue = result.value;
        return func;
    }
    parseFunctionArgsWhileType(types, endingtypes, onendingtype) {
        let elements = [];
        const validArgTypes = ["String", "Variable", "Word", "Function", "Macro"];
        while (!this.isEOF()) {
            const peek = this.peek();
            if (endingtypes && _.isOneOfExpectedTypes(peek, endingtypes))
                return onendingtype(elements, false);
            if (!types.includes(peek.type))
                throw new index_1.ftHTMLInvalidTypeError(peek, types.join(", "));
            if (_.isExpectedType(peek, "Word") && (this.tinytemplates[peek.value] !== undefined || uconfig.tinytemplates[peek.value] !== undefined))
                throw new index_1.ftHTMLInvalidTypeError(peek, "values that aren't qualified tiny template identifiers");
            if (_.isExpectedType(peek, "Word"))
                elements.push(models_1.FTHTMLElement(this.consume()));
            else if (_.isOneOfExpectedTypes(peek, types_1.FTHTMLString))
                elements.push(models_1.ValueFTHTMLElement(peek, this.parseStringOrVariable(this.consume())));
            else if (_.isExpectedType(peek, "Function"))
                elements.push(this.parseFunction());
            else if (_.isExpectedType(peek, "Macro"))
                elements.push(models_1.ValueFTHTMLElement(peek, this.parseMacro()));
            else
                throw new index_1.ftHTMLInvalidTypeError(peek, validArgTypes.join(", "));
        }
        if (endingtypes)
            onendingtype(null, true);
        return elements;
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
            if (!_.isOneOfExpectedTypes(peek, arg.type))
                if (arg.isOptional === true)
                    return;
                else
                    throw new index_1.ftHTMLIllegalArgumentTypeError(arg, initiator, peek);
            if (_.isExpectedType(peek, "Function")) {
                tokens.push(models_1.FTHTMLElement(peek, [this.parseFunction()]));
                return;
            }
            else if (_.isExpectedType(peek, "Macro")) {
                tokens.push(models_1.ValueFTHTMLElement(peek, this.parseMacro()));
                return;
            }
            let val = ["Variable", "String"].includes(peek.type)
                ? this.parseStringOrVariable(peek)
                : peek.value;
            if (arg.possibleValues !== undefined && !arg.possibleValues.includes(val.toLowerCase()) && !arg.default)
                throw new index_1.ftHTMLIllegalArgumentError(arg, index, initiator, peek);
            tokens.push(models_1.ValueFTHTMLElement(this.consume(), val));
        });
        return tokens;
    }
    parseMacro() {
        return grammar_1.default.macros[this.consume().value].apply();
    }
    parseAttributes(parenthesis) {
        const attrs = models_1.DefaultAttributes();
        while (!this.isEOF()) {
            const t = this.consume();
            if (_.isExpectedType(t, 'Symbol_)'))
                return attrs;
            if (!["Word", "Attr_Class", "Attr_Class_Var", "Attr_Id", "Variable"].includes(t.type))
                throw new index_1.ftHTMLInvalidTypeError(t, 'an attribute selector, identifier or word');
            if (t.type == "Attr_Class")
                attrs.get('classes').push(models_1.ValueFTHTMLElement(t, t.value));
            else if (t.type == "Attr_Class_Var")
                attrs.get('classes').push(models_1.ValueFTHTMLElement(t, this.parseVariable(t)));
            else if (t.type == "Attr_Id") {
                if (attrs.get('id').length > 0)
                    throw new index_1.ftHTMLParserError('An id has already been assigned to this element', t);
                attrs.get('id').push(models_1.ValueFTHTMLElement(t, t.value));
            }
            else if (t.type == "Variable")
                attrs.get('misc').push(models_1.ValueFTHTMLElement(t, this.parseVariable(t)));
            else {
                let peek = this.peek();
                if (!this.isEOF() && _.isExpectedType(peek, 'Symbol_=')) {
                    this.consume();
                    peek = this.peek();
                    this.throwIfEOF(new index_1.ftHTMLInvalidTypeError(peek, 'a key value pair'));
                    if (!["String", "Word", "Variable", "Macro"].includes(peek.type))
                        throw new index_1.ftHTMLInvalidTypeError(peek, 'a key value pair');
                    if (_.isOneOfExpectedTypes(peek, types_1.FTHTMLString))
                        attrs.get('kvps').push(models_1.ValueFTHTMLElement(t, t.value, [models_1.ValueFTHTMLElement(peek, this.parseStringOrVariable(this.consume()))]));
                    else if (peek.type == "Macro")
                        attrs.get('kvps').push(models_1.ValueFTHTMLElement(t, t.value, [models_1.ValueFTHTMLElement(peek, this.parseMacro())]));
                    else
                        attrs.get('kvps').push(models_1.ValueFTHTMLElement(t, t.value, [models_1.ValueFTHTMLElement(peek, this.consume().value)]));
                }
                else
                    attrs.get('misc').push(models_1.ValueFTHTMLElement(t, t.value));
            }
        }
        ;
        throw new index_1.ftHTMLIncompleteElementError(parenthesis, 'opening and closing braces');
    }
    initElementWithAttrs(element) {
        this.consume();
        element.attrs = this.parseAttributes(element.token);
        if (this.isEOF() || self_closing_tags_1.SELF_CLOSING_TAGS.includes(element.token.value))
            return element;
        const peek = this.peek();
        if (_.isExpectedType(peek, 'Symbol_{')) {
            const children = this.parseParentElementChildren();
            element.children = children.children;
            element.isParentElement = true;
            element.childrenStart = children.braces[0].position;
            element.childrenEnd = children.braces[1].position;
        }
        else if (_.isOneOfExpectedTypes(peek, types_1.FTHTMLString))
            element.children.push(models_1.ValueFTHTMLElement(peek, this.parseStringOrVariable(this.consume())));
        else if (_.isExpectedType(peek, "Function"))
            element.children.push(this.parseFunction());
        else if (_.isExpectedType(peek, "Macro"))
            element.children.push(models_1.ValueFTHTMLElement(peek, this.parseMacro()));
        return element;
    }
    updateVariable(token, value) {
        if (!this.shouldOmit)
            this.vars[token.value] = value;
    }
    updateTinyTemplate(tinytempl, tinyt) {
        if (!this.shouldOmit)
            this.tinytemplates[tinytempl.token.value] = tinyt;
    }
    evaluateENForToken(token) {
        if (!/^[\w-]+$/.test(token.value))
            throw new index_1.ftHTMLInvalidElementNameError(token, `the following pattern: [\w-]+`);
    }
    consumeComments() {
        const comments = [];
        while (!this.isEOF() && _.isOneOfExpectedTypes(this.peek(), types_1.FTHTMLComment))
            comments.push(models_1.FTHTMLElement(this.consume()));
        return comments;
    }
    throwIfEOF(throwable) {
        if (this.isEOF())
            throw throwable;
    }
    peek() {
        return this.input.peek();
    }
    consume() {
        this.previous = this.input.previous();
        return this.input.next();
    }
    isEOF() {
        return this.input.eof();
    }
}
exports.ftHTMLParser = ftHTMLParser;
//# sourceMappingURL=fthtml-parser.js.map