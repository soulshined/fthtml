import grammar from "../../lexer/grammar";
import { FTHTMLExceptions } from "../../model/exceptions/fthtml-exceptions";
import { FTHTMLElement } from "../../model/fthtmlelement";
import { FTHTMLFunction } from "../../model/functions";
import { AbstractFunction } from "../../model/functions/abstract";
import { Token } from "../../model/token";
import { FTHTMLBaseParser } from "../fthtml-parser";
import { AbstractBlock } from "./abstract";

export class Function extends AbstractBlock {
    constructor(base: FTHTMLBaseParser) {
        super(base);
        this.parse();
    }

    public get value(): FTHTMLElement {
        return this._value;
    }

    protected parse(): void {
        const func = new FTHTMLElement(this.consume());

        this.throwIfEOF(new FTHTMLExceptions.Parser.IncompleteElement(func.token, 'opening and closing parenthesis'));

        if (!Token.isExpectedType(this.peek, 'Symbol_('))
            throw new FTHTMLExceptions.Parser.InvalidType(this.peek, 'opening and closing parenthesis');
        this.consume();

        const funcrules: AbstractFunction = grammar.functions[func.token.value],
            params: FTHTMLFunction.Argument[] = Object.values(funcrules.argPatterns);

        if (funcrules.isArgsSequenceStrict) {
            func.children = this.parseFunctionArgsInOrder(params.filter(param => param.isRestParameter === undefined), func.token);
            const restParameters = params.filter(param => param.isRestParameter !== undefined);
            if (restParameters.length === 1) {
                func.children.push(...this.parseFunctionArgsWhileType(restParameters[0].types, ['Symbol_)'], (elements: FTHTMLElement[], error: boolean) => {
                    if (error) throw new FTHTMLExceptions.Parser.IncompleteElement(func.token, "opening and closing parenthesis")
                    this.consume();
                    return elements;
                }))
            }
            else if (this.isEOF) {
                throw new FTHTMLExceptions.Parser.IncompleteElement(func.token, 'opening and closing parenthesis');
            }
            else if (!Token.isExpectedType(this.peek, 'Symbol_)')) {
                throw new FTHTMLExceptions.Parser.InvalidType(this.peek, 'a closing parenthesis for functions');
            }

            this.consume();
        }
        else {
            func.children = this.parseFunctionArgsWhileType([...new Set(params.map(param => param.types).flat())], ['Symbol_)'], (elements: FTHTMLElement[], error: boolean) => {
                if (error) throw new FTHTMLExceptions.Parser.IncompleteElement(func.token, "opening and closing parenthesis")
                this.consume();
                return elements;
            });
        }

        if (func.children.length < params.filter(m => !m.isOptional).length)
            throw new FTHTMLExceptions.Parser.NotEnoughArguments(func.token, params.filter(m => !m.isOptional).length, func.children.length);

        const values = func.children.map(m => {
            if (funcrules.shouldUseLiteralVariable && m.token.type === Token.TYPES.VARIABLE)
                return funcrules.shouldReturnTokenTypes ? [this.vars[m.token.value], m.token.type] : this.vars[m.token.value];

            let val = m.parsedValue ?? m.token.value;
            if (Token.TYPES.STRING.includes(m.token.type))
                val = this.base.parseStringOrVariable(m.token);

            if (funcrules.shouldReturnTokenTypes)
                return [val, m.token.type];
            else return val;
        });

        const result = grammar.functions[func.token.value].do(...values);
        if (result.error)
            throw new FTHTMLExceptions.Parser.Function(result.msg, func.token);

        func.parsedValue = result.value;
        this._value = func;
    }

    private parseFunctionArgsWhileType(types: (Token.TYPES | string)[], endingtypes?: (Token.TYPES | string)[], onendingtype?: (elements: FTHTMLElement[], err: boolean) => FTHTMLElement[]) {
        let elements: FTHTMLElement[] = [];
        const validArgTypes = [Token.TYPES.STRING, Token.TYPES.VARIABLE, Token.TYPES.WORD, Token.TYPES.FUNCTION, Token.TYPES.MACRO, Token.TYPES.LITERAL_VARIABLE];

        while (!this.isEOF) {
            const peek = this.peek;

            if (endingtypes && Token.isOneOfExpectedTypes(peek, endingtypes)) return onendingtype(elements, false);
            if (!types.includes(peek.type)) throw new FTHTMLExceptions.Parser.InvalidType(peek, Token.joinTypes(types));

            if (Token.isExpectedType(peek, Token.TYPES.WORD) && (this.tinyts[peek.value] !== undefined || this.uconfig.tinytemplates[peek.value] !== undefined))
                throw new FTHTMLExceptions.Parser.InvalidType(peek, "values that aren't qualified tiny template identifiers");

            if (Token.isExpectedType(peek, Token.TYPES.WORD)) elements.push(new FTHTMLElement(this.consume()));
            else if (Token.isOneOfExpectedTypes(peek, Token.Sequences.STRINGABLE))
                elements.push(new FTHTMLElement(peek, this.base.parseStringOrVariable(this.consume())));
            else if (Token.isExpectedType(peek, Token.TYPES.FUNCTION)) elements.push(this.base.parseFunction());
            else if (Token.isExpectedType(peek, Token.TYPES.MACRO)) elements.push(new FTHTMLElement(peek, this.base.parseMacro()));
            else throw new FTHTMLExceptions.Parser.InvalidType(peek, Token.joinTypes(validArgTypes));
        }

        if (endingtypes) onendingtype(null, true);
        return elements;
    }

    private parseFunctionArgsInOrder(argPatterns, initiator: Token<Token.TYPES>) {
        let tokens: FTHTMLElement[] = [];

        argPatterns.forEach((arg: FTHTMLFunction.Argument, index: number) => {
            if (this.isEOF) {
                const args: string[] = arg.types;
                const lastarg = args.pop();
                throw new FTHTMLExceptions.Parser.IncompleteElement(initiator, `a ${Token.joinTypes(args)} or ${lastarg} arg for argument '${arg.name}' at position ${index + 1}`);
            }

            let peek = this.peek;

            if (!Token.isOneOfExpectedTypes(peek, arg.types))
                if (arg.isOptional === true) return;
                else throw new FTHTMLExceptions.Parser.IllegalArgumentType(arg, initiator, peek);

            if (Token.isExpectedType(peek, Token.TYPES.FUNCTION)) {
                tokens.push(this.base.parseFunction());
                return;
            }
            else if (Token.isExpectedType(peek, Token.TYPES.MACRO)) {
                tokens.push(new FTHTMLElement(peek, this.base.parseMacro()));
                return;
            }

            let val = Token.Sequences.STRINGABLE.includes(peek.type as Token.TYPES)
                ? this.base.parseStringOrVariable(peek)
                : peek.value;

            if (arg.enum !== undefined && !arg.enum.includes(val.toLowerCase()) && !arg.default)
                throw new FTHTMLExceptions.Parser.IllegalArgument(arg, index, initiator, peek);

            tokens.push(new FTHTMLElement(this.consume(), val));
        });

        return tokens;
    }


}