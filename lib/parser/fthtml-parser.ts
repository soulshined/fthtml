import * as fs from 'fs';
import * as path from "path";
import configs from "../../cli/utils/user-config";
import { FTHTMLConfig } from '../../cli/utils/user-config-helper';
import InputStream from "../../lib/lexer/input-stream";
import { ftHTMLexer } from "../lexer/fthtml-lexer";
import grammar from "../lexer/grammar";
import { clone, getOperatorExpression } from '../lexer/token';
import { token, Tokenable, TokenPosition, TokenStream, TOKEN_TYPE as TT, FTHTMLBlock, FTHTMLChildren, FTHTMLString, FTHTMLTopLevelElements, FTHTMLOperator, FTHTMLExpression, FTHTMLComment } from "../lexer/types";
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
    ftHTMLFunctionError,
    ftHTMLInvalidTinyTemplateNameError,
    ftHTMLInvalidTinyTemplatePlaceholderError
} from "../utils/exceptions/index";
import * as _ from "../utils/functions";
import { HTMLBuilder } from '../utils/html-builder';
import { SELF_CLOSING_TAGS } from "../utils/self-closing-tags";
import { DefaultAttributes, FTHTMLElement, TinyTemplate, ValueFTHTMLElement } from './models';
import { IFTHTMLElement, ITinyTemplate } from './types';

let uconfig = configs;

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
    private tinytemplates = {};
    private shouldOmit = false;
    private previous: Tokenable = null;

    constructor(vars?) {
        this.vars = ParserVariables(vars);
    }

    private initStack(filepath: string) {
        const file = path.resolve(`${filepath}.fthtml`);

        if (!fs.existsSync(file))
            throw new ftHTMLImportError(`Can not find file '${file}' to parse`, null, this.vars._$.__filename);

        this.vars._$.__dir = path.dirname(file);
        this.vars._$.__filename = file;
        StackTrace.add(file);
    }

    compile(src: string) {
        return HTMLBuilder.build(this.parseSrc(src));
    }
    parseSrc(src: string, filepath?: string, userconfig?: FTHTMLConfig) {
        if (userconfig) uconfig = userconfig;
        try {
            if (filepath) this.initStack(filepath);
            const elements = new ftHTMLParser(this.vars).parse(ftHTMLexer.TokenStream(InputStream(src)));

            if (filepath) StackTrace.remove(1);
            return elements;
        }
        catch (error) {
            throw error;
        }
    }
    renderFile(file: string) {
        return HTMLBuilder.build(this.parseFile(file));
    }
    parseFile(file: string, userconfig?: FTHTMLConfig): IFTHTMLElement[] {
        if (userconfig) uconfig = userconfig;
        if (file.startsWith('https:') || file.startsWith('http:'))
            throw new ftHTMLImportError(`Files must be local, can not access '${file}'`, null, this.vars._$.__filename);

        try {
            this.initStack(file);

            file = path.resolve(`${file}.fthtml`);

            const tokens = ftHTMLexer.TokenStream(InputStream(fs.readFileSync(file, 'utf8')));
            const elements = this.parse(tokens);
            StackTrace.remove(1);
            return elements;
        } catch (error) {
            throw error;
        }
    }

    private compileTinyTemplate(src: string) {
        const parser = new ftHTMLParser();
        parser.parse(ftHTMLexer.TokenStream(InputStream(src)));
        return parser.tinytemplates;
    }

    private parse(input: TokenStream): IFTHTMLElement[] {
        this.input = input;
        let elements: IFTHTMLElement[] = [];

        const doctype = this.parseIfOne(TT.KEYWORD_DOCTYPE);
        if (doctype) elements.push(doctype);

        elements.push(...this.parseWhileType(FTHTMLTopLevelElements));
        return elements;
    }

    private parseWhileType(types: (TT | string)[], endingtypes?: (TT | string)[], onendingtype?: (elements: IFTHTMLElement[], err: boolean) => IFTHTMLElement[], and_only_n_times: number = Number.POSITIVE_INFINITY) {
        let elements: IFTHTMLElement[] = [];
        let iterations = 0;

        while (!this.isEOF() && iterations++ < and_only_n_times) {
            const peek = this.peek();

            if (endingtypes && _.isOneOfExpectedTypes(peek, endingtypes)) return onendingtype(elements, false);
            if (!types.includes(peek.type)) throw new ftHTMLInvalidTypeError(peek, '');

            if (_.isExpectedType(peek, TT.WORD) && (this.tinytemplates[peek.value] !== undefined || uconfig.tinytemplates[peek.value] !== undefined))
                elements.push(this.parseTinyTemplate());
            else if (_.isExpectedType(peek, TT.WORD)) elements.push(this.parseTag());
            else if (_.isOneOfExpectedTypes(peek, FTHTMLString))
                elements.push(ValueFTHTMLElement(peek, this.parseStringOrVariable(this.consume())));
            else if (_.isExpectedType(peek, TT.ELANG)) elements.push(this.parseElang());
            else if (_.isOneOfExpectedTypes(peek, [TT.KEYWORD, TT.KEYWORD_DOCTYPE]))
                elements.push(this.parseKeyword());
            else if (_.isExpectedType(peek, TT.PRAGMA)) elements.push(this.parseMaybePragma());
            else if (_.isExpectedType(peek, TT.FUNCTION)) elements.push(this.parseFunction());
            else if (_.isExpectedType(peek, TT.MACRO)) elements.push(ValueFTHTMLElement(peek, this.parseMacro()));
            else if (_.isExpectedType(peek, TT.OPERATOR)) elements.push(ValueFTHTMLElement(peek, this.consume().value));
            else if (_.isOneOfExpectedTypes(peek, FTHTMLComment))
                elements.push(FTHTMLElement(this.consume()))
            else throw new ftHTMLInvalidTypeError(peek, '');
        }

        if (endingtypes) onendingtype(null, true);
        return elements;
    }

    private parseTypesInOrder(types: (TT | string)[][], initiator: token): IFTHTMLElement[] {
        let elements = [];

        types.forEach(subtypes => {
            this.throwIfEOF(new ftHTMLIncompleteElementError(initiator, subtypes.join(', ')));

            let last = this.peek();
            if (_.isOneOfExpectedTypes(last, [TT.SYMBOL, TT.OPERATOR]) && _.isOneOfExpectedTypes(last, subtypes))
                elements.push(FTHTMLElement(this.consume()));
            else if (_.isOneOfExpectedTypes(last, subtypes))
                elements.push(...this.parseWhileType(subtypes, null, null, 1));
            else throw new ftHTMLInvalidTypeError(last, subtypes.join(', '));

        });

        return elements;
    }

    private parseIfOne(type: TT): IFTHTMLElement {
        const peek = this.peek();
        if (_.isExpectedType(peek, type))
            return this.parseWhileType([type], null, null, 1)[0];
    }

    private parseParentElementChildren(types: TT[] = FTHTMLChildren): { children: IFTHTMLElement[], braces: token[] } {
        const braces = [this.consume()];
        const children = this.parseWhileType(types, ['Symbol_}'], (elements: IFTHTMLElement[], error: boolean) => {
            if (error) throw new ftHTMLInvalidTypeError(braces[0], 'Symbol_}');
            braces.push(this.consume());
            return elements;
        });
        return { children, braces }
    }

    private parseTag(): IFTHTMLElement {
        const tag = FTHTMLElement(this.consume());
        this.evaluateENForToken(tag.token);

        const peek = this.peek();
        if (SELF_CLOSING_TAGS.includes(tag.token.value)) {
            if (_.isExpectedType(peek, 'Symbol_(')) return this.initElementWithAttrs(tag);
        }
        else if (_.isOneOfExpectedTypes(peek, FTHTMLString))
            tag.children.push(ValueFTHTMLElement(peek, this.parseStringOrVariable(this.consume())));
        else if (_.isExpectedType(peek, 'Symbol_(')) return this.initElementWithAttrs(tag);
        else if (_.isExpectedType(peek, 'Symbol_{')) {
            const children = this.parseParentElementChildren();
            tag.children = children.children;
            tag.childrenStart = children.braces[0].position;
            tag.childrenEnd = children.braces[1].position;
            tag.isParentElement = true;
        }
        else if (_.isExpectedType(peek, TT.FUNCTION))
            tag.children.push(this.parseFunction());
        else if (_.isExpectedType(peek, TT.MACRO))
            tag.children.push(ValueFTHTMLElement(peek, this.parseMacro()));

        return tag;
    }

    private parseVarsPragma(pragma: IFTHTMLElement): IFTHTMLElement {
        while (!this.isEOF()) {
            pragma.children.push(...this.consumeComments());
            const t = this.consume();

            if (_.isExpectedType(t, 'Pragma_end')) {
                pragma.childrenStart = pragma.token.position;
                pragma.childrenEnd = t.position;
                return pragma;
            }
            if (!_.isExpectedType(t, TT.WORD)) throw new ftHTMLInvalidVariableNameError(t, '[\w-]+');

            this.evaluateENForToken(t);
            this.throwIfEOF(new ftHTMLIncompleteElementError(t, 'a string or ftHTML block values for variables'));

            const peek = this.peek();
            if (_.isExpectedType(peek, TT.STRING)) {
                const parsed = this.parseString(this.consume());
                this.updateVariable(t, parsed);
                pragma.children.push(FTHTMLElement(t, [ValueFTHTMLElement(peek, parsed)]));
            }
            else if (_.isExpectedType(peek, 'Symbol_{')) {
                const variable = FTHTMLElement(t);
                const elems = this.parseParentElementChildren(FTHTMLBlock);
                variable.children = elems.children;
                variable.childrenStart = elems.braces[0].position;
                variable.childrenEnd = elems.braces[1].position;
                variable.isParentElement = true;
                pragma.children.push(variable);
                this.updateVariable(t, HTMLBuilder.build(variable.children));
            }
            else if (_.isExpectedType(peek, TT.FUNCTION)) {
                const func = this.parseFunction();
                pragma.children.push(FTHTMLElement(t, [func]));
                this.updateVariable(t, func.parsedValue);
            }
            else if (_.isExpectedType(peek, TT.MACRO)) {
                const parsed = this.parseMacro();
                this.updateVariable(t, parsed);
                pragma.children.push(FTHTMLElement(t, [ValueFTHTMLElement(peek, parsed)]));
            }
            else if (_.isExpectedType(peek, 'Word_json')) {
                const jsonElem = FTHTMLElement(this.consume());
                this.parseTypesInOrder([['Symbol_(']], peek);

                if (_.isExpectedType(this.peek(), TT.STRING)) {
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
                                        if (v[key] === undefined) return;
                                        v = v[key]
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
                                    jsonElem.children.push(ValueFTHTMLElement(next, v));
                                    pragma.children.push(FTHTMLElement(t, [jsonElem]));
                                    continue;
                                }
                            }
                        }
                    }
                }
                const parsed = this.parseTypesInOrder([[TT.STRING], ['Symbol_)']], peek);
                const [json_file] = parsed;

                if (json_file.parsedValue.startsWith('https:') || json_file.parsedValue.startsWith('http:'))
                    throw new ftHTMLImportError(`Files must be local, can not access '${json_file.token.value}'`, json_file.token);

                let dir = uconfig.jsonDir ?? this.vars._$.__dir;
                if (json_file.parsedValue.startsWith('&')) {
                    dir = this.vars._$.__dir;
                    json_file.parsedValue = json_file.parsedValue.substring(1);
                }
                const file = path.resolve(dir, `${json_file.parsedValue}.json`);

                if (!fs.existsSync(file))
                    throw new ftHTMLJSONError(`Can not find json file '${file}'`, json_file.token);

                jsonElem.children.push(ValueFTHTMLElement(json_file.token, file));

                const filecontents = fs.readFileSync(file, 'utf-8');
                try {
                    const parsed = JSON.parse(filecontents);
                    this.updateVariable(t, parsed);
                    jsonElem.parsedValue = parsed;
                    pragma.children.push(FTHTMLElement(t, [jsonElem]));
                }
                catch (error) {
                    throw new ftHTMLJSONError(error.message, json_file.token);
                }
            }
            else throw new ftHTMLInvalidTypeError(peek, 'string or ftHTML block values');
        };

        throw new ftHTMLIncompleteElementError(pragma.token, `an '#end' pragma keyword for starting pragma '${pragma.token.value}' but none found`, pragma.token);
    }
    private parseTinyTsPragma(pragma: IFTHTMLElement): IFTHTMLElement {
        while (!this.isEOF()) {
            pragma.children.push(...this.consumeComments());
            const tinytempl = FTHTMLElement(this.consume());

            if (_.isExpectedType(tinytempl.token, 'Pragma_end')) {
                pragma.childrenStart = pragma.token.position;
                pragma.childrenEnd = tinytempl.token.position;
                return pragma;
            }
            if (!_.isOneOfExpectedTypes(tinytempl.token, [TT.WORD]))
                throw new ftHTMLInvalidTinyTemplateNameError(tinytempl.token, "[\w-]+", this.vars._$.__filename);

            this.evaluateENForToken(tinytempl.token);
            this.throwIfEOF(new ftHTMLIncompleteElementError(pragma.token, `an '#end' pragma keyword for starting pragma '${pragma.token.value}' but none found`));

            const element = FTHTMLElement(this.consume());
            if (!_.isOneOfExpectedTypes(element.token, [TT.WORD, TT.STRING]))
                throw new ftHTMLInvalidTypeError(element.token, 'a string or single ftHTML element');

            if (_.isExpectedType(element.token, TT.STRING)) {
                this.updateTinyTemplate(tinytempl, TinyTemplate(element.token, this.vars._$.__filename));
                element.parsedValue = element.token.value;
                tinytempl.children.push(element);
                pragma.children.push(tinytempl);
                continue;
            }

            this.throwIfEOF(new ftHTMLIncompleteElementError(pragma.token, `an '#end' pragma keyword for starting pragma '${pragma.token.value}' but none found`));

            const peek = this.peek();
            if (_.isExpectedType(peek, 'Pragma_end')) {
                this.updateTinyTemplate(tinytempl, TinyTemplate({
                    type: TT.STRING,
                    value: '${val}',
                    position: element.token.position
                }, this.vars._$.__filename, element.token));
                tinytempl.children.push(element);
                pragma.children.push(tinytempl);
                continue;
            }

            if (_.isExpectedType(peek, TT.STRING)) {
                const str = this.consume();
                this.updateTinyTemplate(tinytempl, TinyTemplate(str, this.vars._$.__filename, element.token));
                element.children.push(ValueFTHTMLElement(str, str.value));
            }
            else if (_.isExpectedType(peek, 'Symbol_(')) {
                const lParenth = this.consume();
                this.throwIfEOF(new ftHTMLIncompleteElementError(element.token, 'closing and opening parenthesis'));

                element.attrs = this.parseAttributes(lParenth);

                let value;
                if (_.isExpectedType(this.peek(), TT.STRING)) {
                    const str = this.consume();
                    value = str;
                    element.children.push(ValueFTHTMLElement(str, str.value));
                }
                else if (this.isEOF() || !_.isExpectedType(this.peek(), TT.WORD) && !_.isExpectedType(this.peek(), 'Pragma_end') && !_.isOneOfExpectedTypes(this.peek(), FTHTMLComment))
                    throw new ftHTMLInvalidTypeError(element.token, 'a string or single ftHTML element');

                this.updateTinyTemplate(tinytempl, TinyTemplate(value ?? {
                    type: TT.STRING,
                    value: '${val}',
                    position: element.token.position
                }, this.vars._$.__filename, element.token, element.attrs));
            }
            else if (_.isExpectedType(peek, TT.WORD))
                this.updateTinyTemplate(tinytempl, TinyTemplate(element.token, this.vars._$.__filename));
            else
                throw new ftHTMLInvalidTypeError(element.token, 'a string or single ftHTML element');

            tinytempl.children.push(element);
            pragma.children.push(tinytempl);
        };

        throw new ftHTMLIncompleteElementError(pragma.token, `an '#end' pragma keyword for starting pragma '${pragma.token.value}' but none found`);
    }

    private parseElseIfElseBlock(pragma: IFTHTMLElement, parent: IFTHTMLElement) {
        this.shouldOmit = false;
        if (pragma.token.value === 'elif') {
            const expr = this.getIfElseExpression(pragma);
            const elifBlock = this.parseIfBlock(pragma, expr, parent);
            return ValueFTHTMLElement(pragma.token, parent.parsedValue, elifBlock);
        }

        const children = this.parseWhileType(FTHTMLTopLevelElements, ['Pragma_end'], (elements: IFTHTMLElement[], error: boolean) => {
            if (error)
                throw new ftHTMLIncompleteElementError(pragma.token, `an '#end' pragma keyword for starting pragma '${pragma.token.value}' but none found`);
            return elements;
        })
        return ValueFTHTMLElement(pragma.token, HTMLBuilder.build(children), children);
    }
    private parseIfBlock(pragma: IFTHTMLElement, expression: FTHTMLExpression, parent: IFTHTMLElement) {
        const prevState = this.shouldOmit;
        const isExprResolvedToTrue = getOperatorExpression(expression);

        if (!isExprResolvedToTrue)
            this.shouldOmit = true;
        const children = this.parseWhileType(FTHTMLTopLevelElements, ['Pragma_end', 'Pragma_else', 'Pragma_elif'], (elements: IFTHTMLElement[], error: boolean) => {
            if (error)
                throw new ftHTMLIncompleteElementError(pragma.token, `an '#end' pragma keyword for starting pragma '${pragma.token.value}' but none found`);
            if (_.isOneOfExpectedTypes(this.peek(), ['Pragma_else', 'Pragma_elif'])) {
                const subpragma = this.parseElseIfElseBlock(FTHTMLElement(this.consume()), parent);
                parent.children.unshift(subpragma);

                if (!isExprResolvedToTrue)
                    parent.parsedValue = subpragma.parsedValue;
            }
            return elements;
        })

        if (isExprResolvedToTrue)
            parent.parsedValue = HTMLBuilder.build(children);
        this.shouldOmit = prevState;
        children.splice(0, 0, ...expression);
        return children;
    }

    private getIfElseExpression(pragma: IFTHTMLElement): FTHTMLExpression {
        const types = [TT.STRING, TT.VARIABLE, TT.WORD, TT.FUNCTION, TT.MACRO];
        const [lhs, operator, rhs] = this.parseTypesInOrder([types, FTHTMLOperator, types], pragma.token);

        return [lhs, operator, rhs];
    }

    private parseIfElsePragma(pragma: IFTHTMLElement, parent: IFTHTMLElement) {
        while (!this.isEOF()) {
            const ifElseBlock = this.parseIfBlock(pragma, this.getIfElseExpression(pragma), parent);
            pragma.childrenEnd = this.consume().position;
            parent.children.unshift(ValueFTHTMLElement(pragma.token, HTMLBuilder.build(ifElseBlock.slice(3)), ifElseBlock));
            return parent.children;
        }

        throw new ftHTMLIncompleteElementError(pragma.token, `a valid comparator expression`);
    }

    private parseMaybePragma(): IFTHTMLElement {
        const pragma = FTHTMLElement(this.consume());

        if (_.isExpectedType(pragma.token, 'Pragma_vars'))
            return this.parseVarsPragma(pragma);
        else if (_.isExpectedType(pragma.token, TT.PRAGMA) && pragma.token.value.endsWith('templates'))
            return this.parseTinyTsPragma(pragma);
        else if (_.isExpectedType(pragma.token, 'Pragma_if')) {
            pragma.children = this.parseIfElsePragma(pragma, pragma);
            return pragma;
        }
        else if (_.isExpectedType(pragma.token, 'Pragma_ifdef')) {
            const result = FTHTMLElement(pragma.token);
            const value = this.parseTypesInOrder([[TT.WORD]], pragma.token)[0];
            result.childrenStart = value.token.position;
            const prevState = this.shouldOmit;
            const shouldOmit = this.vars[value.token.value] === undefined &&
                uconfig.globalvars[value.token.value] === undefined &&
                uconfig.tinytemplates[value.token.value] === undefined &&
                this.tinytemplates[value.token.value] === undefined;
            this.shouldOmit = shouldOmit;

            result.children = this.parseWhileType(FTHTMLTopLevelElements, ['Pragma_end'], (elements: IFTHTMLElement[], error: boolean) => {
                if (error)
                    throw new ftHTMLIncompleteElementError(pragma.token, `an '#end' pragma keyword for starting pragma '${pragma.token.value}' but none found`);
                result.childrenEnd = this.consume().position;
                return elements;
            })

            this.shouldOmit = prevState;
            result.parsedValue = shouldOmit ? '' : HTMLBuilder.build(result.children);
            result.children.unshift(value);
            return result;
        }
        else if (_.isExpectedType(pragma.token, 'Pragma_debug')) {
            const prev = this.previous;
            const value = this.parseTypesInOrder([[TT.STRING, TT.VARIABLE, TT.WORD, TT.FUNCTION]], pragma.token)[0];

            if (uconfig.isdebug) {
                let token = value.token;
                let msg = value.parsedValue ?? value.token.value;
                if ((value.parsedValue ?? value.token.value) === '$') {
                    token = prev;
                    msg = prev.value;
                }
                if (_.isExpectedType(token, TT.VARIABLE) && this.vars[token.value] !== undefined)
                    msg = JSON.stringify(this.vars[token.value], null, uconfig.prettify ? 2 : 0);

                if (uconfig.isdebug)
                    console.log(`[Debug - ${this.vars._$.__filename}@${token.position.line}:${token.position.column}] ${token.type === TT.VARIABLE ? `@${token.value} => ` : ''}${msg}`);
            }
            pragma.parsedValue = value.parsedValue;
            pragma.children.push(value);
            return pragma;
        }
        else throw new ftHTMLInvalidKeywordError(pragma.token);
    }

    private parseString(token: token): string {
        let val = token.value;
        let matches = _.getAllMatches(val, /(\\)?(\${[ ]*([\w-]+)\?[ ]*})/g);
        for (const [all, escaped, interp, e] of matches) {
            if (escaped) {
                val = val.replace(all, interp);
                continue;
            }

            const v = this.vars.import[e];
            if (v) val = val.replace(all, v);
            else if (grammar.macros[e]) return;
            else val = val.replace(all, '');
        }

        matches = _.getAllMatches(val, /(\\)?(\${[ ]*([\w-]+)[ ]*})/g);
        for (const [all, escaped, interp, e] of matches) {
            if (escaped) {
                val = val.replace(all, interp);
                continue;
            }

            const v = this.vars.import[e];
            if (v) val = val.replace(all, v);
            else if (grammar.macros[e]) val = val.replace(all, grammar.macros[e].apply());
        }

        matches = _.getAllMatches(val, /(\\)?(\${[ ]*@([\w-]+)[ ]*})/g);
        for (const [all, escaped, interp, e] of matches) {
            if (escaped) {
                val = val.replace(all, interp);
                continue;
            }

            const v = this.vars[e] || uconfig.globalvars[e];
            if (v !== undefined) val = val.replace(all, v);
        }

        matches = _.getAllMatches(val, /(\\)?(\${[ ]*@([\w-]+)((\[\d+\])*(?:\.[a-zA-Z0-9][a-zA-Z0-9-_]*(?:\[\d+\])*)+|(?:\[\d+\])+)+[ ]*})/g);
        for (const [all, escaped, interp, e, kvps] of matches) {
            if (escaped) {
                val = val.replace(all, interp);
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
                val = val.replace(all, v);
        }

        if (typeof val === 'string')
            val = val.replace(new RegExp(`\\\\(${token.delimiter})`, 'g'), '$1');
        return val;
    }

    private parseVariable(token: token): string {
        const value = this.vars[token.value] !== undefined
            ? this.vars[token.value]
            : uconfig.globalvars[token.value];

        if (value === undefined && !this.shouldOmit)
            throw new ftHTMLVariableDoesntExistError(token);

        return this.parseString({ value, type: token.type, position: token.position });
    }

    private parseStringOrVariable(token: token): string {
        if (_.isExpectedType(token, TT.VARIABLE)) return this.parseVariable(token);

        return this.parseString(token);
    }

    private parseKeyword(): IFTHTMLElement {
        const keyword = FTHTMLElement(this.consume());

        if (this.isEOF() || !_.isExpectedType(this.peek(), TT.STRING))
            throw new ftHTMLIncompleteElementError(keyword.token, 'string values');

        const value = this.consume();
        switch (keyword.token.value) {
            case 'comment': {
                keyword.children = [ValueFTHTMLElement(value, `<!-- ${this.parseString(value)} -->`)];
                return keyword;
            }
            case 'doctype': {
                keyword.children = [ValueFTHTMLElement(value, `<!DOCTYPE ${this.parseString(value)}>`)];
                return keyword;
            }
            case 'import':
                const valElement = ValueFTHTMLElement(value, this.parseString(value));
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
                let dir = uconfig.importDir ?? this.vars._$.__dir;
                if (valElement.parsedValue.startsWith('&')) {
                    dir = this.vars._$.__dir;
                    valElement.parsedValue = valElement.parsedValue.substring(1);
                }
                const file = path.resolve(dir, valElement.parsedValue);
                StackTrace.update(0, 'import', TokenPosition(keyword.token.position.line, keyword.token.position.column));

                const elements = new ftHTMLParser().parseFile(file);
                keyword.children.push(valElement);
                keyword.parsedValue = HTMLBuilder.build(elements);
                return keyword;
            default:
                throw new ftHTMLInvalidKeywordError(keyword.token);
        }
    }

    private parseTemplate(token: token): IFTHTMLElement {
        const lBrace = this.consume(),
            template = Object.assign({}, this.vars.import),
            elements: IFTHTMLElement[] = this.consumeComments();

        while (!this.isEOF()) {
            const t = FTHTMLElement(this.consume());

            if (_.isExpectedType(t.token, 'Symbol_}')) {
                let dir = uconfig.importDir ?? this.vars._$.__dir;
                if (template.import.startsWith('&')) {
                    dir = this.vars._$.__dir;
                    template.import = template.import.substring(1);
                }
                const file = path.resolve(dir, template.import);

                StackTrace.update(0, 'import template', TokenPosition(lBrace.position.line, lBrace.position.column));

                const parsed = HTMLBuilder.build(new ftHTMLParser({ import: template }).parseFile(file))
                const result = ValueFTHTMLElement(token, parsed, elements);
                result.childrenStart = lBrace.position;
                result.childrenEnd = t.token.position;
                return result;
            }

            if (!_.isExpectedType(t.token, TT.WORD)) throw new ftHTMLInvalidVariableNameError(t.token, '[\w-]+');
            this.throwIfEOF(new ftHTMLIncompleteElementError(t.token, 'string, macro, function or ftHTML block values'));
            this.evaluateENForToken(t.token);

            const peek = this.peek();
            if (_.isOneOfExpectedTypes(peek, FTHTMLString)) {
                const str = this.parseStringOrVariable(this.consume());
                template[t.token.value] = str;
                t.children.push(ValueFTHTMLElement(peek, str));
            }
            else if (_.isExpectedType(peek, TT.FUNCTION)) {
                const func = this.parseFunction();
                template[t.token.value] = func.parsedValue;
                t.children.push(func);
            }
            else if (_.isExpectedType(peek, TT.MACRO)) {
                const parsedValue = this.parseMacro();
                template[t.token.value] = parsedValue;
                t.children.push(ValueFTHTMLElement(peek, parsedValue));
            }
            else if (_.isExpectedType(peek, 'Symbol_{')) {
                const children = this.parseParentElementChildren(FTHTMLBlock);
                t.childrenStart = children.braces[0].position;
                t.childrenEnd = children.braces[1].position;
                t.children = children.children;
                t.isParentElement = true;
                t.parsedValue = HTMLBuilder.build(t.children);
                template[t.token.value] = t.parsedValue;
            }
            else throw new ftHTMLInvalidTypeError(peek, 'string, macro, function or ftHTML block values');

            elements.push(t, ...this.consumeComments());
        }

        throw new ftHTMLInvalidTypeError(lBrace, `an opening and closing braces for template imports`);
    }

    private parseTinyTemplate(): IFTHTMLElement {
        const word = FTHTMLElement(this.consume());
        const uconfigtt = uconfig.tinytemplates[word.token.value];
        const tt = this.tinytemplates[word.token.value] || uconfigtt;

        let element = clone(tt.element);
        let value = clone(tt.value);
        let fattrs: Map<string, IFTHTMLElement[]> = _.cloneAttributes(tt.attrs);

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
            if (!fattrs) fattrs = word.attrs;
            else {
                if (fattrs.get('id').length === 0)
                    fattrs.get('id').push(...word.attrs.get('id'));
                else if (fattrs.get('id').length > 0 && word.attrs.get('id').length > 0)
                    throw new ftHTMLParserError('Tiny template id is already declared in the global scope', word.token);

                fattrs.get('classes').push(...word.attrs.get('classes'));
                fattrs.get('kvps').push(...word.attrs.get('kvps'));
                fattrs.get('misc').push(...word.attrs.get('misc'));
            }
        }

        const attrPlaceholders = [];
        if (fattrs)
            fattrs.get('kvps').forEach((e, index) => {
                const matches = _.getAllMatches(e.children[0].parsedValue, /(?<!\\)(\${[ ]*val[ ]*})/g);
                if (matches.length === 0) return;
                attrPlaceholders.push(index);
            })

        const placeholders = _.getAllMatches(value.value, /(?<!\\)(\${[ ]*val[ ]*})/g);
        if (placeholders.length === 0 && attrPlaceholders.length === 0)
            throw new ftHTMLInvalidTinyTemplatePlaceholderError(word.token, this.vars._$.__filename);

        let replacement = '';
        if (_.isExpectedType(this.peek(), 'Symbol_{')) {
            const elements = this.parseParentElementChildren(FTHTMLBlock);
            word.isParentElement = true;
            word.children = elements.children;
            word.childrenStart = elements.braces[0].position;
            word.childrenEnd = elements.braces[1].position;
            replacement += HTMLBuilder.build(word.children);
        }

        if (_.isOneOfExpectedTypes(this.peek(), [TT.STRING, TT.MACRO, TT.FUNCTION, TT.VARIABLE])) {
            const elements = this.parseWhileType([TT.STRING, TT.MACRO, TT.FUNCTION, TT.VARIABLE], null, null, 1);
            word.children = elements;
            replacement += HTMLBuilder.build(elements);
        }

        if (placeholders.length > 0)
            placeholders.forEach(() => value.value = value.value.replace(/(?<!\\)(\${[ ]*val[ ]*})/g, replacement));

        if (attrPlaceholders.length > 0)
            attrPlaceholders.forEach(ph => {
                const val = fattrs.get('kvps')[ph].children[0].parsedValue;
                fattrs.get('kvps')[ph].children[0].parsedValue = val.replace(/(?<!\\)(\${[ ]*val[ ]*})/g, replacement);
            })

        word.parsedValue = element
            ? HTMLBuilder.build([FTHTMLElement(element, [ValueFTHTMLElement(value, this.parseString(value))], fattrs)])
            : HTMLBuilder.build([ValueFTHTMLElement(value, this.parseString(value))]);

        return word;
    }

    private parseElang(): IFTHTMLElement {
        const elang = FTHTMLElement(this.consume());

        if (this.isEOF() || !_.isExpectedType(this.peek(), TT.ELANGB)) throw new ftHTMLIncompleteElementError(elang.token, 'opening and closing braces', this.peek());

        const elangb = this.consume();
        elang.children.push(ValueFTHTMLElement(elangb, elangb.value));
        switch (elang.token.value) {
            case 'js':
                elang.parsedValue = `<script>${elangb.value}</script>`;
                return elang;
            case 'css':
                elang.parsedValue = `<style>${elangb.value}</style>`;
                return elang;
            default:
                throw new ftHTMLInvalidTypeError(elang.token, "'css','js'");
        }
    }

    private parseFunction(): IFTHTMLElement {
        const func = FTHTMLElement(this.consume());

        this.throwIfEOF(new ftHTMLIncompleteElementError(func.token, 'opening and closing parenthesis'));

        if (!_.isExpectedType(this.peek(), 'Symbol_('))
            throw new ftHTMLInvalidTypeError(this.peek(), 'opening and closing parenthesis');
        this.consume();

        const funcrules = grammar.functions[func.token.value],
            params = Object.values(funcrules.argPatterns);

        if (funcrules.argsSequenceStrict) {
            func.children = this.parseFunctionArgsInOrder(params.filter(param => param.isRestParameter === undefined), func.token);
            const restParameters = params.filter(param => param.isRestParameter !== undefined);
            if (restParameters.length === 1) {
                func.children.push(...this.parseFunctionArgsWhileType(restParameters[0].type, ['Symbol_)'], (elements: IFTHTMLElement[], error: boolean) => {
                    if (error) throw new ftHTMLIncompleteElementError(func.token, "opening and closing parenthesis")
                    this.consume();
                    return elements;
                }))
            }
            else if (this.isEOF()) {
                throw new ftHTMLIncompleteElementError(func.token, 'opening and closing parenthesis');
            }
            else if (!_.isExpectedType(this.peek(), 'Symbol_)')) {
                throw new ftHTMLInvalidTypeError(this.peek(), 'a closing parenthesis for functions');
            }

            this.consume();
        }
        else {
            func.children = this.parseFunctionArgsWhileType([...new Set(params.map(param => param.type).flat())], ['Symbol_)'], (elements: IFTHTMLElement[], error: boolean) => {
                if (error) throw new ftHTMLIncompleteElementError(func.token, "opening and closing parenthesis")
                this.consume();
                return elements;
            });
        }

        if (func.children.length < params.filter(m => !m.isOptional).length)
            throw new ftHTMLNotEnoughArgumentsError(func.token, params.filter(m => !m.isOptional).length, func.children.length);

        const values = func.children.map(m => {
            if (funcrules.useRawVariables && m.token.type === TT.VARIABLE)
                return funcrules.returnTokenTypes ? [this.vars[m.token.value], m.token.type] : this.vars[m.token.value];

            let val = m.parsedValue ?? m.token.value;
            if (TT.STRING.includes(m.token.type))
                val = this.parseStringOrVariable(m.token);

            if (funcrules.returnTokenTypes)
                return [val, m.token.type];
            else return val;
        });

        const result = grammar.functions[func.token.value].do(...values);
        if (result.error)
            throw new ftHTMLFunctionError(result.msg, func.token);

        func.parsedValue = result.value;
        return func;
    }

    private parseFunctionArgsWhileType(types: (TT | string)[], endingtypes?: (TT | string)[], onendingtype?: (elements: IFTHTMLElement[], err: boolean) => IFTHTMLElement[]) {
        let elements: IFTHTMLElement[] = [];
        const validArgTypes = [TT.STRING, TT.VARIABLE, TT.WORD, TT.FUNCTION, TT.MACRO];

        while (!this.isEOF()) {
            const peek = this.peek();

            if (endingtypes && _.isOneOfExpectedTypes(peek, endingtypes)) return onendingtype(elements, false);
            if (!types.includes(peek.type)) throw new ftHTMLInvalidTypeError(peek, types.join(", "));

            if (_.isExpectedType(peek, TT.WORD) && (this.tinytemplates[peek.value] !== undefined || uconfig.tinytemplates[peek.value] !== undefined))
                throw new ftHTMLInvalidTypeError(peek, "values that aren't qualified tiny template identifiers");

            if (_.isExpectedType(peek, TT.WORD)) elements.push(FTHTMLElement(this.consume()));
            else if (_.isOneOfExpectedTypes(peek, FTHTMLString))
                elements.push(ValueFTHTMLElement(peek, this.parseStringOrVariable(this.consume())));
            else if (_.isExpectedType(peek, TT.FUNCTION)) elements.push(this.parseFunction());
            else if (_.isExpectedType(peek, TT.MACRO)) elements.push(ValueFTHTMLElement(peek, this.parseMacro()));
            else throw new ftHTMLInvalidTypeError(peek, validArgTypes.join(", "));
        }

        if (endingtypes) onendingtype(null, true);
        return elements;
    }

    private parseFunctionArgsInOrder(argPatterns, initiator: token) {
        let tokens: IFTHTMLElement[] = [];

        argPatterns.forEach((arg, index) => {
            if (this.isEOF()) {
                const args: TT[] = arg.type;
                const lastarg = args.pop();
                throw new ftHTMLIncompleteElementError(initiator, `a ${args.join(', ')} or ${lastarg} arg for argument '${arg.name}' at position ${index + 1}`);
            }

            let peek = this.peek();

            if (!_.isOneOfExpectedTypes(peek, arg.type))
                if (arg.isOptional === true) return;
                else throw new ftHTMLIllegalArgumentTypeError(arg, initiator, peek);

            if (_.isExpectedType(peek, TT.FUNCTION)) {
                tokens.push(FTHTMLElement(peek, [this.parseFunction()]));
                return;
            }
            else if (_.isExpectedType(peek, TT.MACRO)) {
                tokens.push(ValueFTHTMLElement(peek, this.parseMacro()));
                return;
            }

            let val = [TT.VARIABLE, TT.STRING].includes(peek.type)
                ? this.parseStringOrVariable(peek)
                : peek.value;

            if (arg.possibleValues !== undefined && !arg.possibleValues.includes(val.toLowerCase()) && !arg.default)
                throw new ftHTMLIllegalArgumentError(arg, index, initiator, peek);

            tokens.push(ValueFTHTMLElement(this.consume(), val));
        });

        return tokens;
    }

    private parseMacro() {
        return grammar.macros[this.consume().value].apply();
    }

    private parseAttributes(parenthesis: token): Map<string, IFTHTMLElement[]> {
        //assumes beginning parenthesis has already been consumed
        const attrs: Map<string, IFTHTMLElement[]> = DefaultAttributes();

        while (!this.isEOF()) {
            const t = this.consume();

            if (_.isExpectedType(t, 'Symbol_)')) return attrs;

            if (![TT.WORD, TT.ATTR_CLASS, TT.ATTR_CLASS_VAR, TT.ATTR_ID, TT.VARIABLE].includes(t.type)) throw new ftHTMLInvalidTypeError(t, 'an attribute selector, identifier or word');

            if (t.type == TT.ATTR_CLASS) attrs.get('classes').push(ValueFTHTMLElement(t, t.value));
            else if (t.type == TT.ATTR_CLASS_VAR) attrs.get('classes').push(ValueFTHTMLElement(t, this.parseVariable(t)));
            else if (t.type == TT.ATTR_ID) {
                if (attrs.get('id').length > 0) throw new ftHTMLParserError('An id has already been assigned to this element', t);
                attrs.get('id').push(ValueFTHTMLElement(t, t.value));
            }
            else if (t.type == TT.VARIABLE) attrs.get('misc').push(ValueFTHTMLElement(t, this.parseVariable(t)));
            else {
                let peek = this.peek();
                if (!this.isEOF() && _.isExpectedType(peek, 'Symbol_=')) {
                    this.consume();

                    peek = this.peek();
                    this.throwIfEOF(new ftHTMLInvalidTypeError(peek, 'a key value pair'));

                    if (![TT.STRING, TT.WORD, TT.VARIABLE, TT.MACRO].includes(peek.type))
                        throw new ftHTMLInvalidTypeError(peek, 'a key value pair');

                    if (_.isOneOfExpectedTypes(peek, FTHTMLString))
                        attrs.get('kvps').push(ValueFTHTMLElement(t, t.value, [ValueFTHTMLElement(peek, this.parseStringOrVariable(this.consume()))]));
                    else if (peek.type == TT.MACRO) attrs.get('kvps').push(ValueFTHTMLElement(t, t.value, [ValueFTHTMLElement(peek, this.parseMacro())]));
                    else attrs.get('kvps').push(ValueFTHTMLElement(t, t.value, [ValueFTHTMLElement(peek, this.consume().value)]));
                }
                else attrs.get('misc').push(ValueFTHTMLElement(t, t.value));
            }
        };

        throw new ftHTMLIncompleteElementError(parenthesis, 'opening and closing braces');
    }

    private initElementWithAttrs(element: IFTHTMLElement): IFTHTMLElement {
        this.consume();
        element.attrs = this.parseAttributes(element.token);

        if (this.isEOF() || SELF_CLOSING_TAGS.includes(element.token.value))
            return element;

        const peek = this.peek();
        if (_.isExpectedType(peek, 'Symbol_{')) {
            const children = this.parseParentElementChildren()
            element.children = children.children;
            element.isParentElement = true;
            element.childrenStart = children.braces[0].position;
            element.childrenEnd = children.braces[1].position;
        }
        else if (_.isOneOfExpectedTypes(peek, FTHTMLString))
            element.children.push(ValueFTHTMLElement(peek, this.parseStringOrVariable(this.consume())));
        else if (_.isExpectedType(peek, TT.FUNCTION))
            element.children.push(this.parseFunction());
        else if (_.isExpectedType(peek, TT.MACRO))
            element.children.push(ValueFTHTMLElement(peek, this.parseMacro()));

        return element;
    }

    private updateVariable(token: token, value: any) {
        if (!this.shouldOmit)
            this.vars[token.value] = value;
    }

    private updateTinyTemplate(tinytempl: IFTHTMLElement, tinyt: ITinyTemplate) {
        if (!this.shouldOmit)
            this.tinytemplates[tinytempl.token.value] = tinyt;
    }

    private evaluateENForToken(token: token) {
        if (!/^[\w-]+$/.test(token.value))
            throw new ftHTMLInvalidElementNameError(token, `the following pattern: [\w-]+`);
    }

    private consumeComments() {
        const comments = [];
        while (!this.isEOF() && _.isOneOfExpectedTypes(this.peek(), FTHTMLComment))
            comments.push(FTHTMLElement(this.consume()));

        return comments;
    }

    private throwIfEOF(throwable: Error) {
        if (this.isEOF()) throw throwable;
    }

    private peek(): Tokenable {
        return this.input.peek();
    }
    private consume(): Tokenable {
        this.previous = this.input.previous();
        return this.input.next();
    }
    private isEOF(): boolean {
        return this.input.eof();
    }
}