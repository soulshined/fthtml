import * as fs from 'fs';
import * as path from "path";
import { default as uconfig } from "../../cli/utils/user-config";
import { default as InputStream } from "../../lib/lexer/input-stream";
import { ftHTMLexer } from "../lexer/fthtml-lexer";
import grammar from "../lexer/grammar";
import { token, Tokenable, TokenPosition, TokenStream, TOKEN_TYPE as TT } from "../lexer/types";
import {
    ftHTMLIllegalArgumentError,
    ftHTMLIllegalArgumentTypeError,
    ftHTMLImportError,
    ftHTMLIncompleteElementError,
    ftHTMLInvalidElementNameError,
    ftHTMLInvalidKeywordError,
    ftHTMLInvalidTypeError,
    ftHTMLInvalidVariableNameError,
    ftHTMLNotEnoughArgumentsError,
    ftHTMLJSONError,
    ftHTMLParserError,
    ftHTMLVariableDoesntExistError,
    StackTrace,
    ftHTMLFunctionError
} from "../utils/exceptions/index";
import * as _ from "../utils/functions";
import { SELF_CLOSING_TAGS } from "../utils/self-closing-tags";

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

export class ftHTMLParser {
    private input: TokenStream;
    private vars;
    constructor(vars?) {
        this.vars = ParserVariables(vars);
    }

    compile(src: string) {
        return new ftHTMLParser().parse(ftHTMLexer.TokenStream(InputStream(src)));
    }
    renderFile(file: string) {
        if (file.startsWith('https:') || file.startsWith('http:'))
            throw new ftHTMLImportError(`Files must be local, can not access '${file}'`);

        try {
            file = path.resolve(`${file}.fthtml`);

            if (!fs.existsSync(file))
                throw new ftHTMLImportError(`Can not find file '${file}' to parse`);

            this.vars._$.__dir = path.dirname(file);
            this.vars._$.__filename = file;
            StackTrace.add(file);

            const tokens = ftHTMLexer.TokenStream(InputStream(fs.readFileSync(file, 'utf8')));

            let html = this.parse(tokens);
            StackTrace.remove(1);
            return html;
        } catch (error) {
            throw error;
        }
    }

    private parse(input: TokenStream): string {
        this.input = input;

        let html = this.parseIfOne(TT.KEYWORD_DOCTYPE);
        html += this.parseWhileType([
            TT.WORD,
            TT.ELANG,
            TT.FUNCTION,
            TT.MACRO,
            TT.PRAGMA,
            TT.KEYWORD,
            TT.VARIABLE
        ]);

        return html;
    }

    private parseWhileType(types: TT[], endingtype?: TT | string, onendingtype?: (html: string, err: boolean) => string, and_only_n_times: number = Number.POSITIVE_INFINITY) {
        let html = '';
        let iterations = 0;

        while (!this.input.eof() && iterations++ < and_only_n_times) {
            const t = this.peek();

            if (endingtype && this.isExpectedType(t, endingtype)) return onendingtype(html, false);
            if (!types.includes(t.type)) throw new ftHTMLInvalidTypeError(t, '');

            if (t.type == TT.WORD) html += this.parseTag();
            else if (t.type == TT.STRING) html += this.parseString(this.consume());
            else if (t.type == TT.VARIABLE) html += this.parseVariable(this.consume());
            else if (t.type == TT.ELANG) html += this.parseElang();
            else if (t.type == TT.KEYWORD) html += this.parseKeyword();
            else if (t.type == TT.PRAGMA) this.parseMaybePragma();
            else if (t.type == TT.KEYWORD_DOCTYPE) html += this.parseKeyword();
            else if (t.type == TT.FUNCTION) html += this.parseFunction();
            else if (t.type == TT.MACRO) html += this.parseMacro();
            else throw new ftHTMLInvalidTypeError(t, '');
        }

        if (endingtype) onendingtype(null, true);
        return html;
    }

    private parseWhileTypeForTokens(types: TT[], endingtype?: TT | string, onendingtype?: (token: token[], err: boolean) => token[]): token[] {
        let tokens: token[] = [];

        while (!this.input.eof()) {
            const t = this.peek();

            if (endingtype && this.isExpectedType(t, endingtype)) return onendingtype(tokens, false);
            if (!types.includes(t.type)) throw new ftHTMLInvalidTypeError(t, '');

            if ([TT.WORD, TT.STRING, TT.VARIABLE].includes(t.type))
                tokens.push(this.consume());
            else if ([TT.ELANG, TT.KEYWORD, TT.PRAGMA, TT.FUNCTION, TT.MACRO].includes(t.type))
                tokens.push({ type: t.type, position: t.position, value: this.parseWhileType([t.type], null, null, 1) });
            else throw new ftHTMLInvalidTypeError(t, '');
        }

        if (endingtype) onendingtype(null, true);
        return tokens;
    }

    private parseTypesInOrderForTokens(types: (TT | string)[][], initiator: token) {
        let tokens = [];

        types.forEach(subtypes => {
            if (this.isEOF())
                throw new ftHTMLIncompleteElementError(initiator, subtypes.join(', '));

            let last = this.peek();
            if (!this.isOneOfExpectedTypes(last, subtypes))
                throw new ftHTMLInvalidTypeError(last, subtypes.join(', '));

            tokens.push(this.consume());
        });

        return tokens;
    }

    private parseIfOne(type: TT): string {
        const t = this.peek();
        if (this.isExpectedType(t, type)) {
            return this.parseWhileType([type], null, null, 1);
        }
        return '';
    }

    private parseTag(): string {
        const tag = this.evaluateENForToken(this.consume());

        const peek = this.peek();
        if (SELF_CLOSING_TAGS.includes(tag)) {
            if (this.isExpectedType(peek, 'Symbol_(')) return this.initElementWithAttrs(tag);
            return this.createElement(tag);
        }
        else if (this.isExpectedType(peek, TT.STRING)) return this.createElement(tag, null, this.parseString(this.consume()));
        else if (this.isExpectedType(peek, TT.VARIABLE)) return this.createElement(tag, null, this.parseVariable(this.consume()));
        else if (this.isExpectedType(peek, 'Symbol_(')) return this.initElementWithAttrs(tag);
        else if (this.isExpectedType(peek, 'Symbol_{')) return this.initElementWithChildren(tag);
        else if (this.isExpectedType(peek, TT.FUNCTION)) return this.createElement(tag, null, this.parseFunction());
        else if (this.isExpectedType(peek, TT.MACRO)) return this.createElement(tag, null, this.parseMacro());
        else return this.createElement(tag);
    }

    private parseMaybePragma() {
        const pragma = this.consume();
        if (this.input.eof()) throw new ftHTMLIncompleteElementError(pragma, `a value body, value definition and possibly an '#end' keyword`);

        if (pragma.value === 'vars') {
            do {
                const t = this.consume();

                if (t.type == TT.PRAGMA && t.value == 'end') return;
                if (t.type != TT.WORD) throw new ftHTMLInvalidVariableNameError(t, '[\w-]+');

                if (this.input.eof()) throw new ftHTMLIncompleteElementError(t, 'a string or ftHTML block values for variables');

                const peek = this.input.peek();
                if (peek.type == TT.STRING) this.vars[this.evaluateENForToken(t)] = this.parseString(this.consume());
                else if (this.isExpectedType(peek, 'Symbol_{'))
                    this.vars[this.evaluateENForToken(t)] = this.parseBindingPropertyValueAsFTHTML();
                else if (this.isExpectedType(peek, TT.FUNCTION))
                    this.vars[this.evaluateENForToken(t)] = this.parseFunction();
                else if (this.isExpectedType(peek, TT.MACRO))
                    this.vars[this.evaluateENForToken(t)] = this.parseMacro();
                else if (this.isExpectedType(peek, 'Word_json')) {
                    this.consume();
                    const parsed = this.parseTypesInOrderForTokens([['Symbol_('], [TT.STRING], ['Symbol_)']], peek);
                    const [_, json_file] = parsed;

                    if (json_file.value.startsWith('https:') || json_file.value.startsWith('http:'))
                        throw new ftHTMLImportError(`Files must be local, can not access '${json_file.value}'`);

                    let dir = uconfig.jsonDir ?? this.vars._$.__dir;
                    if (json_file.value.startsWith('&')) {
                        dir = this.vars._$.__dir;
                        json_file.value = json_file.value.substring(1);
                    }
                    const file = path.resolve(dir, `${json_file.value}.json`);

                    if (!fs.existsSync(file))
                        throw new ftHTMLJSONError(`Can not find json file '${file}'`, json_file);

                    const filecontents = fs.readFileSync(file, 'utf-8');
                    try {
                        this.vars[this.evaluateENForToken(t)] = JSON.parse(filecontents);
                    }
                    catch (error) {
                        throw new ftHTMLJSONError(error.message, json_file);
                    }
                }
                else throw new ftHTMLInvalidTypeError(peek, 'string or ftHTML block values');
            } while (!this.input.eof());

            throw new ftHTMLIncompleteElementError(pragma, `Expecting '#end' pragma keyword for starting pragma '${pragma.value}' but none found`, pragma);
        }
        else throw new ftHTMLInvalidKeywordError(pragma);
    }

    private parseString(token: token): string {
        let matches = _.getAllMatches(token.value, /(\\)?(\${[ ]*([\w-]+)\?[ ]*})/g);
        for (const [all, escaped, interp, e] of matches) {
            if (escaped) {
                token.value = token.value.replace(all, interp);
                continue;
            }

            const v = this.vars.import[e];
            if (v) token.value = token.value.replace(all, v);
            else if (grammar.macros[e]) return;
            else token.value = token.value.replace(all, '');
        }

        matches = _.getAllMatches(token.value, /(\\)?(\${[ ]*([\w-]+)[ ]*})/g);
        for (const [all, escaped, interp, e] of matches) {
            if (escaped) {
                token.value = token.value.replace(all, interp);
                continue;
            }

            const v = this.vars.import[e];
            if (v) token.value = token.value.replace(all, v);
            else if (grammar.macros[e]) token.value = token.value.replace(all, grammar.macros[e].apply());
        }

        matches = _.getAllMatches(token.value, /(\\)?(\${[ ]*@([\w-]+)[ ]*})/g);
        for (const [all, escaped, interp, e] of matches) {
            if (escaped) {
                token.value = token.value.replace(all, interp);
                continue;
            }

            const v = this.vars[e] || uconfig.globalvars[e];
            if (v !== undefined) token.value = token.value.replace(all, v);
        }

        matches = _.getAllMatches(token.value, /(\\)?(\${[ ]*@([\w-]+)((\[\d+\])*(?:\.[a-zA-Z0-9][a-zA-Z0-9-_]*(?:\[\d+\])*)+|(?:\[\d+\])+)+[ ]*})/g);
        for (const [all, escaped, interp, e, kvps] of matches) {
            if (escaped) {
                token.value = token.value.replace(all, interp);
                continue;
            }

            let v = this.vars[e];
            if (v === undefined) continue;

            const keys = kvps.replace(/\[(\d+)\]/g, ".$1").split(".");
            keys.shift();

            keys.forEach(key => {
                if (v[key] === undefined)
                    throw new ftHTMLJSONError(`Cannot read property '${key}' of '${all}'`, token);
                v = v[key]
            });

            if (v !== undefined)
                token.value = token.value.replace(all, v);
        }

        return token.value;
    }

    private parseVariable(token: token): string {
        const value = this.vars[token.value] !== undefined
            ? this.vars[token.value]
            : uconfig.globalvars[token.value];

        if (value === undefined)
            throw new ftHTMLVariableDoesntExistError(token);

        return this.parseString({ value, type: token.type, position: token.position });
    }

    private parseStringOrVariable(token: token): string {
        if (token.type === TT.VARIABLE) return this.parseVariable(token);

        return this.parseString(token);
    }

    private parseKeyword(): string {
        const keyword = this.consume();

        if (this.input.eof() || !this.isExpectedType(this.peek(), TT.STRING))
            throw new ftHTMLIncompleteElementError(keyword, 'string values');

        const token = this.consume();
        switch (keyword.value) {
            case 'comment': return `<!-- ${this.parseString(token)} -->`;
            case 'doctype': return `<!DOCTYPE ${this.parseString(token)}>`;
            case 'import':
                if (this.isExpectedType(this.peek(), 'Symbol_{')) {
                    this.vars.import.import = this.parseString(token);
                    return this.parseTemplate();
                }
                let dir = uconfig.importDir ?? this.vars._$.__dir;
                if (token.value.startsWith('&')) {
                    dir = this.vars._$.__dir;
                    token.value = token.value.substring(1);
                }
                const file = path.resolve(dir, token.value);
                StackTrace.update(0, 'import', TokenPosition(keyword.position.line, keyword.position.column));

                return new ftHTMLParser().renderFile(file);
            default:
                throw new ftHTMLInvalidKeywordError(keyword);
        }
    }

    private parseTemplate(): string {
        const brace = this.consume(),
            template = Object.assign({}, this.vars.import);

        do {
            const t = this.consume();

            if (this.isExpectedType(t, 'Symbol_}')) {
                let dir = uconfig.importDir ?? this.vars._$.__dir;
                if (template.import.startsWith('&')) {
                    dir = this.vars._$.__dir;
                    template.import = template.import.substring(1);
                }
                const file = path.resolve(dir, template.import);

                StackTrace.update(0, 'import template', TokenPosition(brace.position.line, brace.position.column));

                return new ftHTMLParser({ import: template }).renderFile(file);
            }

            if (t.type != TT.WORD) throw new ftHTMLInvalidVariableNameError(t, '[\w-]+');
            if (this.input.eof()) throw new ftHTMLIncompleteElementError(t, 'string, macro, function or ftHTML block values');

            const peek = this.input.peek();
            if ([TT.STRING, TT.VARIABLE].includes(peek.type)) template[this.evaluateENForToken(t)] = this.parseStringOrVariable(this.consume());
            else if (this.isExpectedType(peek, TT.FUNCTION)) template[this.evaluateENForToken(t)] = this.parseFunction();
            else if (this.isExpectedType(peek, TT.MACRO)) template[this.evaluateENForToken(t)] = this.parseMacro();
            else if (this.isExpectedType(peek, 'Symbol_{'))
                template[this.evaluateENForToken(t)] = this.parseBindingPropertyValueAsFTHTML();
            else throw new ftHTMLInvalidTypeError(peek, 'string, macro, function or ftHTML block values');
        } while (!this.input.eof())

        throw new ftHTMLInvalidTypeError(brace, `an opening and closing braces for template imports`);
    }

    private parseBindingPropertyValueAsFTHTML(): string {
        const brace = this.consume();
        return this.parseWhileType([TT.WORD, TT.ELANG, TT.STRING, TT.KEYWORD, TT.VARIABLE, TT.FUNCTION, TT.MACRO], 'Symbol_}', (html: string, error: boolean) => {
            if (error) throw new ftHTMLInvalidTypeError(brace, 'Symbol_}');
            this.consume();
            return html;
        })
    }

    private parseElang(): string {
        const elang = this.input.next();
        const peek = this.peek();
        if (this.input.eof() || peek.type != TT.ELANGB) throw new ftHTMLIncompleteElementError(elang, 'opening and closing braces', peek);

        const { value } = this.input.next();
        switch (elang.value) {
            case 'js':
                return this.createElement('script', null, value);
            case 'css':
                return this.createElement('style', null, value);
            default:
                throw new ftHTMLInvalidTypeError(elang, "'css','js'");
        }
    }

    private parseFunction(): string {
        const func = this.consume();

        if (!this.isExpectedType(this.peek(), 'Symbol_('))
            throw new ftHTMLInvalidTypeError(this.peek(), 'opening and closing parenthesis');
        this.consume();

        const funcrules = grammar.functions[func.value],
            params = Object.values(funcrules.argPatterns);

        let args = [];
        if (funcrules.argsSequenceStrict) {
            args = this.parseFunctionArgsInOrder(params.filter(param => param.isRestParameter === undefined), func);
            const restParameters = params.filter(param => param.isRestParameter !== undefined);
            if (restParameters.length === 1) {
                args.push(...this.parseWhileTypeForTokens(restParameters[0].type, 'Symbol_)', (tokens: token[], error: boolean) => {
                    if (error) throw new ftHTMLIncompleteElementError(func, "opening and closing parenthesis")
                    this.consume();
                    return tokens;
                }))
            }
            else if (this.isEOF()) {
                throw new ftHTMLIncompleteElementError(func, 'opening and closing parenthesis');
            }
            else if (!this.isExpectedType(this.peek(), 'Symbol_)')) {
                throw new ftHTMLInvalidTypeError(this.peek(), 'a closing parenthesis for functions');
            }
            else {
                this.consume();
            }
        }
        else {
            args = this.parseWhileTypeForTokens([...new Set(params.map(param => param.type).flat())], 'Symbol_)', (tokens: token[], error: boolean) => {
                if (error) throw new ftHTMLIncompleteElementError(func, "opening and closing parenthesis")
                this.consume();
                return tokens;
            });
        }

        if (args.length < params.filter(m => !m.isOptional).length)
            throw new ftHTMLNotEnoughArgumentsError(func, params.filter(m => !m.isOptional).length, args.length);

        const values = args.map(m => {
            return [TT.VARIABLE, TT.STRING].includes(m.type)
                ? this.parseStringOrVariable(m)
                : m.value;
        });

        const result = grammar.functions[func.value].do(...values);
        if (result.error)
            throw new ftHTMLFunctionError(result.msg, func);

        return result.value;
    }

    private parseFunctionArgsInOrder(argPatterns, initiator: token) {
        let tokens: token[] = [];

        argPatterns.forEach((arg, index) => {
            if (this.isEOF()) {
                const args: TT[] = arg.type;
                const lastarg = args.pop();
                throw new ftHTMLIncompleteElementError(initiator, `a ${args.join(', ')} or ${lastarg} arg for argument '${arg.name}' at position ${index + 1}`);
            }

            let peek = this.peek();

            if (!this.isOneOfExpectedTypes(peek, arg.type))
                if (arg.isOptional === true) return;
                else throw new ftHTMLIllegalArgumentTypeError(arg, initiator, peek);

            if (this.isExpectedType(peek, TT.FUNCTION)) {
                tokens.push({ value: this.parseFunction(), type: TT.STRING, position: peek.position })
                return;
            }
            else if (this.isExpectedType(peek, TT.MACRO)) {
                tokens.push({ value: this.parseMacro(), type: TT.STRING, position: peek.position });
                return;
            }

            let val = [TT.VARIABLE, TT.STRING].includes(peek.type)
                ? this.parseStringOrVariable(peek)
                : peek.value;

            if (arg.possibleValues !== undefined && !arg.possibleValues.includes(val.toLowerCase()) && !arg.default)
                throw new ftHTMLIllegalArgumentError(arg, index, initiator, peek);

            tokens.push(this.consume());
        });

        return tokens;
    }

    private parseMacro() {
        return grammar.macros[this.consume().value].apply();
    }

    private evaluateENForToken(token: token) {
        if (!/^[\w-]+$/.test(token.value))
            throw new ftHTMLInvalidElementNameError(token, `the following pattern: [\w-]+`);

        return token.value;
    }

    private initElementWithAttrs(tag: string): string {
        const t = this.consume();
        if (this.input.eof()) throw new ftHTMLIncompleteElementError(t, 'opening and closing braces');

        const attrs = {
            misc: '',
            classes: [],
            id: null,
            toString() {
                let c = this.classes.length > 0 ? ` class="${this.classes.join(' ')}"` : '';
                let i = this.id ? ` id="${this.id}"` : '';
                return `${i}${c}${this.misc}`;
            }
        }

        do {
            const t = this.consume();
            let peek = this.peek();

            if (t.type == TT.SYMBOL && t.value == ')') {
                if (SELF_CLOSING_TAGS.includes(tag)) return this.createElement(tag, attrs);

                if (this.isExpectedType(peek, 'Symbol_{')) return this.initElementWithChildren(tag, attrs);
                else if (this.isExpectedType(peek, TT.STRING)) return this.createElement(tag, attrs, this.parseString(this.consume()));
                else if (this.isExpectedType(peek, TT.VARIABLE)) return this.createElement(tag, attrs, this.parseVariable(this.consume()));
                else if (this.isExpectedType(peek, TT.FUNCTION)) return this.createElement(tag, attrs, this.parseFunction());
                else if (this.isExpectedType(peek, TT.MACRO)) return this.createElement(tag, attrs, this.parseMacro());
                else return this.createElement(tag, attrs);
            }

            if (![TT.WORD, TT.ATTR_CLASS, TT.ATTR_CLASS_VAR, TT.ATTR_ID, TT.VARIABLE].includes(t.type)) throw new ftHTMLInvalidTypeError(t, 'an attribute selector, identifier or word');

            if (t.type == TT.ATTR_CLASS) attrs.classes.push(t.value);
            else if (t.type == TT.ATTR_CLASS_VAR) attrs.classes.push(this.parseVariable(t));
            else if (t.type == TT.ATTR_ID) {
                if (attrs.id) throw new ftHTMLParserError('An id has already been assigned to this element', t);
                attrs.id = t.value;
            }
            else if (t.type == TT.VARIABLE) attrs.misc += ` ${this.parseVariable(t)}`;
            else {
                if (this.isExpectedType(peek, 'Symbol_=')) {
                    this.consume();
                    peek = this.peek();
                    if (![TT.STRING, TT.WORD, TT.VARIABLE, TT.MACRO].includes(peek.type))
                        throw new ftHTMLInvalidTypeError(peek, 'a key value pair');

                    if (peek.type == TT.STRING) attrs.misc += ` ${t.value}="${this.parseString(this.consume())}"`;
                    else if (peek.type == TT.VARIABLE) attrs.misc += ` ${t.value}="${this.parseVariable(this.consume())}"`;
                    else if (peek.type == TT.MACRO) attrs.misc += ` ${t.value}="${this.parseMacro()}"`;
                    else attrs.misc += ` ${t.value}="${this.consume().value}"`;
                }
                else attrs.misc += ` ${t.value}`;
            }
        } while (!this.input.eof());

        throw new ftHTMLIncompleteElementError(t, 'opening and closing braces');
    }

    private initElementWithChildren(tag: string, attrs?: object): string {
        const sym = this.consume();
        return this.parseWhileType([TT.WORD, TT.ELANG, TT.PRAGMA, TT.STRING, TT.KEYWORD, TT.VARIABLE, TT.FUNCTION, TT.MACRO], 'Symbol_}', (html: string, error: boolean) => {
            if (error) throw new ftHTMLInvalidTypeError(sym, 'Symbol_}');
            this.consume();
            return this.createElement(tag, attrs, html);
        })
    }

    private createElement(element: string, attrs?: object, value?: string): string {
        if (SELF_CLOSING_TAGS.includes(element))
            return `<${element}${attrs ? attrs.toString() : ''}/>`;

        return `<${element}${attrs ? attrs.toString() : ''}>${value ?? ''}</${element}>`;
    }

    private isExpectedType(actual: token, expected: TT | string): boolean {
        // NOTE [02-Jan-2020]: assumes eof is irrelevant
        return actual && (actual.type === expected || `${actual.type}_${actual.value}` === expected);
    }

    private isOneOfExpectedTypes(actual: token, expected: (TT | string)[]): boolean {
        return actual && (expected.includes(actual.type) || expected.includes(`${actual.type}_${actual.value}`));
    }

    private peek(): Tokenable {
        return this.input.peek();
    }
    private consume(): Tokenable {
        return this.input.next();
    }
    private isEOF(): boolean {
        return this.input.eof();
    }
}