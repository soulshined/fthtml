import * as fs from 'fs';
import * as path from "path";
import { defaults, FTHTMLConfig } from '../../cli/utils/user-config-helper';
import { FTHTMLLexer } from '../lexer/fthtml-lexer';
import grammar from "../lexer/grammar";
import { Streams } from '../lexer/streams';
import InputStream from '../lexer/streams/input-stream';
import { FTHTMLExceptions } from '../model/exceptions/fthtml-exceptions';
import { FTHTMLElement } from '../model/fthtmlelement';
import { HTMLBuilder } from '../model/html-builder';
import { Token } from '../model/token';
import { AbstractParser } from './abstract';
import { ELang } from './blocks/elang';
import { Function } from './blocks/function';
import { Keyword } from './blocks/keyword';
import { Loops } from './blocks/loops';
import { Pragma } from './blocks/pragma';
import { Stringable } from './blocks/stringable';
import { Tag } from './blocks/tag';
import { TinyT } from './blocks/tinyt';

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

export interface IFTHTMLBaseParser {
    vars: any;
    input: Streams.Token<Token<Token.TYPES>>;
    uconfig: FTHTMLConfig;
    shouldOmit: boolean;
    tinyts: {}
}

export class FTHTMLBaseParser extends AbstractParser<Token<Token.TYPES>> {
    public vars: any;
    public shouldOmit: boolean;
    public tinyts: {};
    public uconfig: FTHTMLConfig;

    constructor(input: Streams.Token<Token<Token.TYPES>>, configs, vars, shouldOmit: boolean, tinyts = {}) {
        super();
        this._input = input;
        this.vars = ParserVariables(vars);
        this.shouldOmit = shouldOmit;
        this.tinyts = tinyts;
        this.uconfig = configs;
    }

    protected parse(...args: any): void {
        throw new Error('Method not implemented.');
    }

    public parseWhileType(types: (Token.TYPES | string)[], endingtypes?: (Token.TYPES | string)[], onendingtype?: (elements: FTHTMLElement[], err: boolean) => FTHTMLElement[], and_only_n_times: number = Number.POSITIVE_INFINITY) {
        let elements: FTHTMLElement[] = [];
        let iterations = 0;

        while (!this.isEOF && iterations++ < and_only_n_times) {
            const peek = this.peek;

            if (endingtypes && Token.isOneOfExpectedTypes(peek, endingtypes)) return onendingtype(elements, false);
            if (!types.includes(peek.type)) throw new FTHTMLExceptions.Parser.InvalidType(peek, '');

            if (Token.isExpectedType(peek, Token.TYPES.WORD) && (this.tinyts[peek.value] !== undefined || this.uconfig.tinytemplates[peek.value] !== undefined))
                elements.push(new TinyT(this).value);
            else if (Token.isExpectedType(peek, Token.TYPES.WORD)) elements.push(new Tag(this).value);
            else if (Token.isOneOfExpectedTypes(peek, Token.Sequences.STRINGABLE))
                elements.push(new FTHTMLElement(peek, this.parseStringOrVariable(this.consume())));
            else if (Token.isExpectedType(peek, Token.TYPES.ELANG)) elements.push(this.parseElang());
            else if (Token.isExpectedType(peek, 'Keyword_each'))
                elements.push(new Loops(this).value);
            else if (Token.isOneOfExpectedTypes(peek, [Token.TYPES.KEYWORD, Token.TYPES.KEYWORD_DOCTYPE]))
                elements.push(new Keyword(this).value);
            else if (Token.isExpectedType(peek, Token.TYPES.PRAGMA)) elements.push(new Pragma(this).value);
            else if (Token.isExpectedType(peek, Token.TYPES.FUNCTION)) elements.push(this.parseFunction());
            else if (Token.isExpectedType(peek, Token.TYPES.MACRO)) elements.push(new FTHTMLElement(peek, this.parseMacro()));
            else if (Token.isExpectedType(peek, Token.TYPES.OPERATOR)) elements.push(new FTHTMLElement(peek, this.consume().value));
            else if (Token.isOneOfExpectedTypes(peek, Token.Sequences.COMMENTS))
                elements.push(new FTHTMLElement(this.consume()))
            else throw new FTHTMLExceptions.Parser.InvalidType(peek, '');
        }

        if (endingtypes) onendingtype(null, true);
        return elements;
    }

    public parseTypesInOrder(types: (Token.TYPES | string)[][], initiator: Token<Token.TYPES>): FTHTMLElement[] {
        let elements = [];

        types.forEach(subtypes => {
            this.throwIfEOF(new FTHTMLExceptions.Parser.IncompleteElement(initiator, Token.joinTypes(subtypes)));

            let last = this.peek;
            if (Token.isOneOfExpectedTypes(last, subtypes)) {
                if (Token.isOneOfExpectedTypes(last, Token.Sequences.ORDERED))
                    elements.push(...this.parseWhileType(Token.Sequences.ORDERED, null, null, 1));
                else elements.push(new FTHTMLElement(this.consume()));
            }
            else throw new FTHTMLExceptions.Parser.InvalidType(last, Token.joinTypes(subtypes));
        })

        return elements;
    }

    public parseIfOne(type: Token.TYPES): FTHTMLElement {
        const peek = this.peek;
        if (Token.isExpectedType(peek, type))
            return this.parseWhileType([type], null, null, 1)[0];
    }

    public parseParentElementChildren(types: string[] = Token.Sequences.CHILDREN): { children: FTHTMLElement[], braces: Token<Token.TYPES>[] } {
        const braces = [this.consume()];
        const children = this.parseWhileType(types, ['Symbol_}'], (elements: FTHTMLElement[], error: boolean) => {
            if (error) throw new FTHTMLExceptions.Parser.InvalidType(braces[0], 'Symbol_}');
            braces.push(this.consume());
            return elements;
        });
        return { children, braces }
    }

    public parseAttributes(parenthesis: Token<Token.TYPES>): FTHTMLElement.Attributes {
        //assumes beginning parenthesis has already been consumed
        const attrs: FTHTMLElement.Attributes = new FTHTMLElement.Attributes().default;
        while (!this.isEOF) {
            const t = this.consume();

            if (Token.isExpectedType(t, 'Symbol_)')) return attrs;
            if (![Token.TYPES.WORD, Token.TYPES.ATTR_CLASS, Token.TYPES.ATTR_CLASS_VAR, Token.TYPES.ATTR_CLASS_LITERAL_VAR, Token.TYPES.ATTR_ID, ...Token.Sequences.VARIABLE].includes(t.type as Token.TYPES)) throw new FTHTMLExceptions.Parser.InvalidType(t, 'an attribute selector, identifier or word');

            if (t.type == Token.TYPES.ATTR_CLASS) attrs.get('classes').push(new FTHTMLElement(t, t.value));
            else if (Token.isOneOfExpectedTypes(t, [Token.TYPES.ATTR_CLASS_VAR, Token.TYPES.ATTR_CLASS_LITERAL_VAR])) attrs.get('classes').push(new FTHTMLElement(t, this.parseStringOrVariable(t)));
            else if (t.type == Token.TYPES.ATTR_ID) {
                if (attrs.get('id').length > 0) throw new FTHTMLExceptions.Parser('An id has already been assigned to this element', t);
                attrs.get('id').push(new FTHTMLElement(t, t.value));
            }
            else if (Token.Sequences.VARIABLE.includes(t.type as Token.TYPES)) attrs.get('misc').push(new FTHTMLElement(t, this.parseStringOrVariable(t)));
            else {
                let peek = this.peek;
                if (!this.isEOF && Token.isExpectedType(peek, 'Symbol_=')) {
                    this.consume();

                    peek = this.peek;
                    this.throwIfEOF(new FTHTMLExceptions.Parser.InvalidType(peek, 'a key value pair'));

                    if (![...Token.Sequences.STRINGABLE, Token.TYPES.WORD, Token.TYPES.MACRO].includes(peek.type as Token.TYPES))
                        throw new FTHTMLExceptions.Parser.InvalidType(peek, 'a key value pair');

                    if (Token.isOneOfExpectedTypes(peek, Token.Sequences.STRINGABLE))
                        attrs.get('kvps').push(new FTHTMLElement(t, t.value, [new FTHTMLElement(peek, this.parseStringOrVariable(this.consume()))]));
                    else if (peek.type == Token.TYPES.MACRO) attrs.get('kvps').push(new FTHTMLElement(t, t.value, [new FTHTMLElement(peek, this.parseMacro())]));
                    else attrs.get('kvps').push(new FTHTMLElement(t, t.value, [new FTHTMLElement(peek, this.consume().value)]));
                }
                else attrs.get('misc').push(new FTHTMLElement(t, t.value));
            }
        };

        throw new FTHTMLExceptions.Parser.IncompleteElement(parenthesis, 'opening and closing braces');
    }

    public parseStringOrVariable(token: Token<Token.TYPES>): any {
        return new Stringable(token, this).value;
    }

    public consumeComments() {
        const comments = [];
        while (!this.isEOF && Token.isOneOfExpectedTypes(this.peek, Token.Sequences.COMMENTS))
            comments.push(new FTHTMLElement(this.consume()));

        return comments;
    }

    public parseFunction(): FTHTMLElement {
        return new Function(this).value;
    }

    public callFunction(name: string, caller: Token<Token.TYPES>, expecting: string | string[], ...args: any) {
        const result = grammar.functions[name].do(...args);
        if (result.error)
            throw new FTHTMLExceptions.Parser(result.msg, caller, expecting);

        return result.value;
    }

    public parseMacro() {
        return grammar.macros[this.consume().value].apply();
    }

    public parseElang() {
        return new ELang(this).value;
    }

    public updateVariable(token: Token<Token.TYPES>, value: any) {
        if (!this.shouldOmit)
            this.vars[token.value] = value;
    }

    public updateTinyTemplate(tinytempl: FTHTMLElement, tinyt: FTHTMLElement.TinyTemplate) {
        if (!this.shouldOmit)
            this.tinyts[tinytempl.token.value] = tinyt;
    }

    get value(): FTHTMLElement[] {
        return this._value;
    }

    public clone() {
        const p = new FTHTMLParser(this.uconfig, this.vars, this.tinyts);
        p._input = new FTHTMLLexer(this._input.clone()).stream();
        return p;
    }

}

export class FTHTMLParser extends FTHTMLBaseParser {
    constructor(config?: FTHTMLConfig, vars?, tinyts?) {
        super(null, config ?? defaults, vars, false, tinyts);
    }

    private initStack(filepath: string) {
        const file = path.resolve(`${filepath}.fthtml`);

        if (!fs.existsSync(file))
            throw new FTHTMLExceptions.Import(`Can not find file '${file}' to parse`, null, this.vars._$.__filename);

        this.vars._$.__dir = path.dirname(file);
        this.vars._$.__filename = file;
        FTHTMLExceptions.Stack.add(file);
    }

    compile(src: string) {
        return HTMLBuilder.build(this.parseSrc(src));
    }

    compileTinyTemplate(src: string) {
        const parser = new FTHTMLParser(this.uconfig, this.vars);
        parser.parse(new FTHTMLLexer(InputStream(src)).stream());
        return parser.tinyts;
    }

    parseSrc(src: string, filepath?: string) {
        try {
            if (filepath) this.initStack(filepath);
            const elements = new FTHTMLParser(this.uconfig, this.vars).parse(new FTHTMLLexer(InputStream(src)).stream());

            if (filepath) FTHTMLExceptions.Stack.remove(1);
            return elements;
        }
        catch (error) {
            throw error;
        }
    }
    renderFile(file: string) {
        const elements = this.parseFile(file);
        return HTMLBuilder.build(elements);
    }
    parseFile(file: string): FTHTMLElement[] {
        if (file.startsWith('https:') || file.startsWith('http:'))
            throw new FTHTMLExceptions.Import(`Files must be local, can not access '${file}'`, null, this.vars._$.__filename);

        this.initStack(file);
        file = path.resolve(`${file}.fthtml`);

        const tokens = new FTHTMLLexer(InputStream(fs.readFileSync(file, 'utf8'))).stream();
        const elements = this.parse(tokens);
        FTHTMLExceptions.Stack.remove(1);
        return elements;
    }

    protected parse(input: Streams.Token<Token<Token.TYPES>>): FTHTMLElement[] {
        this._input = input;
        let elements: FTHTMLElement[] = [];

        const doctype = this.parseIfOne(Token.TYPES.KEYWORD_DOCTYPE);
        if (doctype) elements.push(doctype);

        elements.push(...this.parseWhileType(Token.Sequences.TOP_LEVEL));
        return elements;
    }

}