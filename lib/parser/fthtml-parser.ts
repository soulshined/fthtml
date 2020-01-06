import { ftHTMLexer } from "../lexer/fthtml-lexer";
import { TOKEN_TYPE as TT, TokenStream, TokenPosition, token, Tokenable } from "../lexer/types";
import {
    ftHTMLImportError,
    ftHTMLIncompleteElementError,
    ftHTMLInvalidElementNameError,
    ftHTMLInvalidKeywordError,
    ftHTMLInvalidTypeError,
    ftHTMLInvalidVariableNameError,
    ftHTMLParserError,
    ftHTMLVariableDoesntExistError,
    StackTrace
} from "../utils/exceptions/index";
import { SELF_CLOSING_TAGS } from "../utils/self-closing-tags";
import { default as uconfig } from "../../cli/utils/user-config";
import { default as InputStream } from "../../lib/lexer/input-stream";
import * as _ from "../utils/functions";
import * as path from "path";
import * as fs from 'fs';

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
            TT.PRAGMA,
            TT.KEYWORD,
            TT.VARIABLE
        ]);

        return html;
    }

    private parseWhileType(types: TT[], endingtype?: TT | string, onendingtype?: (html: string, err: boolean) => string, and_only_n_times: number = Number.POSITIVE_INFINITY) {
        const t = this.peek();
        let html = '';
        let iterations = 0;

        while (!this.input.eof() && iterations++ < and_only_n_times) {
            const t = this.peek();

            if (endingtype && this.isExpectedType(t, endingtype)) return onendingtype(html, false);
            if (!types.includes(t.type)) throw new ftHTMLInvalidTypeError(t, '');

            if (t.type == TT.WORD) html += this.parseTag();
            else if (t.type == TT.STRING) html += this.parseString(this.consume().value);
            else if (t.type == TT.VARIABLE) html += this.parseVariable(this.consume());
            else if (t.type == TT.ELANG) html += this.parseElang();
            else if (t.type == TT.KEYWORD) {
                if (t.value == 'template') html += this.parseTemplate();
                else html += this.parseKeyword();
            }
            else if (t.type == TT.PRAGMA) this.parseMaybePragma();
            else if (t.type == TT.KEYWORD_DOCTYPE) html += this.parseKeyword();
            else throw new ftHTMLInvalidTypeError(t, '');
        }

        if (endingtype) onendingtype(null, true);
        return html;
    }

    private parseIfOne(type: TT): string {
        if (this.isEOF()) return '';

        const t = this.peek();
        if (this.isExpectedType(t, type)) {
            try {
                return this.parseWhileType([type], null, null, 1);
            } catch (error) {
                if (!(error instanceof ftHTMLInvalidTypeError)) throw error;
            }
        }
        return '';
    }

    private parseTag(): string {
        const tag = this.evaluateENForToken(this.consume());

        const peek = this.peek();
        if (this.isExpectedType(peek, TT.STRING)) return this.createElement(tag, null, this.parseString(this.consume().value));
        else if (this.isExpectedType(peek, TT.VARIABLE)) return this.createElement(tag, null, this.parseVariable(this.consume()));
        else if (this.isExpectedType(peek, 'Symbol_(')) return this.initElementWithAttrs(tag);
        else if (this.isExpectedType(peek, 'Symbol_{')) return this.initElementWithChildren(tag);
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

                const peek = this.input.peek();
                if (this.input.eof()) throw new ftHTMLInvalidTypeError(t, 'a string value for variables');

                if (peek.type == TT.STRING) this.vars[this.evaluateENForToken(t)] = this.parseString(this.consume().value);
                else throw new ftHTMLInvalidTypeError(peek, TT.STRING);
            } while (!this.input.eof());

            throw new ftHTMLIncompleteElementError(pragma, `Expecting '#end' pragma keyword for starting pragma '${pragma.value}' but none found`, pragma);
        }
        else throw new ftHTMLInvalidKeywordError(pragma);
    }

    private parseString(value: string): string {
        let matches = _.getAllMatches(value, /\${[ ]*([\w-]+)\?[ ]*}/g);
        matches.forEach(i => {
            const v = this.vars.import[i[1]];
            if (v) value = value.replace(i[0], v);
            else value = value.replace(i[0], '');
        });

        matches = _.getAllMatches(value, /\${[ ]*([\w-]+)[ ]*}/g);
        matches.forEach(i => {
            const v = this.vars.import[i[1]];
            if (v) value = value.replace(i[0], v);
        });

        matches = _.getAllMatches(value, /\${[ ]*@([\w-]+)[ ]*}/g);
        matches.forEach(i => {
            const v = this.vars[i[1]];
            if (v) value = value.replace(i[0], v);
        });

        return value;
    }

    private parseVariable(token: token): string {
        if (this.vars[token.value] === undefined) throw new ftHTMLVariableDoesntExistError(token);
        return this.parseString(this.vars[token.value]);
    }

    private parseKeyword(): string {
        const keyword = this.consume();

        if (this.input.eof() || !this.isExpectedType(this.peek(), TT.STRING))
            throw new ftHTMLIncompleteElementError(keyword, 'string values');

        const { value } = this.consume();
        switch (keyword.value) {
            case 'comment': return `<!-- ${this.parseString(value)} -->`;
            case 'doctype': return `<!DOCTYPE ${this.parseString(value)}>`;
            case 'import':
                let file = path.resolve(uconfig.importDir ?? this.vars._$.__dir, value);
                StackTrace.update(0, 'import', TokenPosition(keyword.position.line, keyword.position.column));

                return new ftHTMLParser().renderFile(file);
            default:
                throw new ftHTMLInvalidKeywordError(keyword);
        }
    }

    private parseTemplate(): string {
        const template = this.consume();
        if (!this.isExpectedType(this.peek(), 'Symbol_{')) throw new ftHTMLIncompleteElementError(template, `an opening and closing braces for 'template' keyword`, this.peek());
        this.consume();

        do {
            const t = this.consume();

            if (this.isExpectedType(t, 'Symbol_}')) {
                if (!this.vars.import.import) throw new ftHTMLParserError(`templates require a valid import statement`, t);

                let file = path.resolve(uconfig.templateDir ?? this.vars._$.__dir, this.vars.import.import);

                StackTrace.update(0, 'template', TokenPosition(template.position.line, template.position.column));

                return new ftHTMLParser({ import: this.vars.import }).renderFile(file);
            }

            if (t.type != TT.WORD && !this.isExpectedType(t, 'Keyword_import')) throw new ftHTMLInvalidVariableNameError(t, '[\w-]+');

            const peek = this.input.peek();
            if (this.input.eof()) throw new ftHTMLIncompleteElementError(t, 'string values');

            if (peek.type == TT.STRING) this.vars.import[this.evaluateENForToken(t)] = this.parseString(this.consume().value);
            else throw new ftHTMLIncompleteElementError(peek, 'string values');
        } while (!this.input.eof())

        throw new ftHTMLInvalidTypeError(template, `an opening and closing braces for 'template' keyword`);
    }

    private parseElang(): string {
        const elang = this.input.next();
        const peek = this.peek();
        if (this.input.eof() || peek.type != TT.ELANGB) throw new ftHTMLIncompleteElementError(elang, 'opening and closing braces', peek);

        const { value } = this.input.next();
        switch (elang.value) {
            case 'js':
                return this.createElement('script', null, value);
            case 'php':
                return `<?php${value}?>`;
            case 'css':
                return this.createElement('style', null, value);
            default:
                throw new ftHTMLInvalidTypeError(elang, "'css','js','php'");
        }
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
                if (this.isExpectedType(peek, 'Symbol_{')) return this.initElementWithChildren(tag, attrs);
                else if (this.isExpectedType(peek, TT.STRING)) return this.createElement(tag, attrs, this.parseString(this.consume().value));
                else if (this.isExpectedType(peek, TT.VARIABLE)) return this.createElement(tag, attrs, this.parseVariable(this.consume()));
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
                    if (![TT.STRING, TT.WORD, TT.VARIABLE].includes(peek.type))
                        throw new ftHTMLInvalidTypeError(peek, 'a key value pair');

                    const kvp = this.consume();
                    if (kvp.type == TT.STRING) attrs.misc += ` ${t.value}="${this.parseString(kvp.value)}"`;
                    else if (kvp.type == TT.VARIABLE) attrs.misc += ` ${t.value}="${this.parseVariable(kvp)}"`
                    else attrs.misc += ` ${t.value}="${kvp.value}"`;
                }
                else attrs.misc += ` ${t.value}`;
            }
        } while (!this.input.eof());

        throw new ftHTMLIncompleteElementError(t, 'opening and closing braces');
    }

    private initElementWithChildren(tag: string, attrs?: object): string {
        const sym = this.consume();
        return this.parseWhileType([TT.WORD, TT.ELANG, TT.PRAGMA, TT.STRING, TT.KEYWORD], 'Symbol_}', (html: string, error: boolean) => {
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