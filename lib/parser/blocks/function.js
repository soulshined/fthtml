"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const grammar_1 = require("../../lexer/grammar");
const fthtml_exceptions_1 = require("../../model/exceptions/fthtml-exceptions");
const fthtmlelement_1 = require("../../model/fthtmlelement");
const token_1 = require("../../model/token");
const abstract_1 = require("./abstract");
class Function extends abstract_1.AbstractBlock {
    constructor(base) {
        super(base);
        this.parse();
    }
    get value() {
        return this._value;
    }
    parse() {
        const func = new fthtmlelement_1.FTHTMLElement(this.consume());
        this.throwIfEOF(new fthtml_exceptions_1.FTHTMLExceptions.Parser.IncompleteElement(func.token, 'opening and closing parenthesis'));
        if (!token_1.Token.isExpectedType(this.peek, 'Symbol_('))
            throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.InvalidType(this.peek, 'opening and closing parenthesis');
        this.consume();
        const funcrules = grammar_1.default.functions[func.token.value], params = Object.values(funcrules.argPatterns);
        if (funcrules.isArgsSequenceStrict) {
            func.children = this.parseFunctionArgsInOrder(params.filter(param => param.isRestParameter === undefined), func.token);
            const restParameters = params.filter(param => param.isRestParameter !== undefined);
            if (restParameters.length === 1) {
                func.children.push(...this.parseFunctionArgsWhileType(restParameters[0].types, ['Symbol_)'], (elements, error) => {
                    if (error)
                        throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.IncompleteElement(func.token, "opening and closing parenthesis");
                    this.consume();
                    return elements;
                }));
            }
            else if (this.isEOF) {
                throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.IncompleteElement(func.token, 'opening and closing parenthesis');
            }
            else if (!token_1.Token.isExpectedType(this.peek, 'Symbol_)')) {
                throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.InvalidType(this.peek, 'a closing parenthesis for functions');
            }
            this.consume();
        }
        else {
            func.children = this.parseFunctionArgsWhileType([...new Set(params.map(param => param.types).flat())], ['Symbol_)'], (elements, error) => {
                if (error)
                    throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.IncompleteElement(func.token, "opening and closing parenthesis");
                this.consume();
                return elements;
            });
        }
        if (func.children.length < params.filter(m => !m.isOptional).length)
            throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.NotEnoughArguments(func.token, params.filter(m => !m.isOptional).length, func.children.length);
        const values = func.children.map(m => {
            var _a;
            if (funcrules.shouldUseLiteralVariable && m.token.type === "Variable")
                return funcrules.shouldReturnTokenTypes ? [this.vars[m.token.value], m.token.type] : this.vars[m.token.value];
            let val = (_a = m.parsedValue, (_a !== null && _a !== void 0 ? _a : m.token.value));
            if ("String".includes(m.token.type))
                val = this.base.parseStringOrVariable(m.token);
            if (funcrules.shouldReturnTokenTypes)
                return [val, m.token.type];
            else
                return val;
        });
        const result = grammar_1.default.functions[func.token.value].do(...values);
        if (result.error)
            throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.Function(result.msg, func.token);
        func.parsedValue = result.value;
        this._value = func;
    }
    parseFunctionArgsWhileType(types, endingtypes, onendingtype) {
        let elements = [];
        const validArgTypes = ["String", "Variable", "Word", "Function", "Macro", "Literal Variable"];
        while (!this.isEOF) {
            const peek = this.peek;
            if (endingtypes && token_1.Token.isOneOfExpectedTypes(peek, endingtypes))
                return onendingtype(elements, false);
            if (!types.includes(peek.type))
                throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.InvalidType(peek, token_1.Token.joinTypes(types));
            if (token_1.Token.isExpectedType(peek, "Word") && (this.tinyts[peek.value] !== undefined || this.uconfig.tinytemplates[peek.value] !== undefined))
                throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.InvalidType(peek, "values that aren't qualified tiny template identifiers");
            if (token_1.Token.isExpectedType(peek, "Word"))
                elements.push(new fthtmlelement_1.FTHTMLElement(this.consume()));
            else if (token_1.Token.isOneOfExpectedTypes(peek, token_1.Token.Sequences.STRINGABLE))
                elements.push(new fthtmlelement_1.FTHTMLElement(peek, this.base.parseStringOrVariable(this.consume())));
            else if (token_1.Token.isExpectedType(peek, "Function"))
                elements.push(this.base.parseFunction());
            else if (token_1.Token.isExpectedType(peek, "Macro"))
                elements.push(new fthtmlelement_1.FTHTMLElement(peek, this.base.parseMacro()));
            else
                throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.InvalidType(peek, token_1.Token.joinTypes(validArgTypes));
        }
        if (endingtypes)
            onendingtype(null, true);
        return elements;
    }
    parseFunctionArgsInOrder(argPatterns, initiator) {
        let tokens = [];
        argPatterns.forEach((arg, index) => {
            if (this.isEOF) {
                const args = arg.types;
                const lastarg = args.pop();
                throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.IncompleteElement(initiator, `a ${token_1.Token.joinTypes(args)} or ${lastarg} arg for argument '${arg.name}' at position ${index + 1}`);
            }
            let peek = this.peek;
            if (!token_1.Token.isOneOfExpectedTypes(peek, arg.types))
                if (arg.isOptional === true)
                    return;
                else
                    throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.IllegalArgumentType(arg, initiator, peek);
            if (token_1.Token.isExpectedType(peek, "Function")) {
                tokens.push(this.base.parseFunction());
                return;
            }
            else if (token_1.Token.isExpectedType(peek, "Macro")) {
                tokens.push(new fthtmlelement_1.FTHTMLElement(peek, this.base.parseMacro()));
                return;
            }
            let val = token_1.Token.Sequences.STRINGABLE.includes(peek.type)
                ? this.base.parseStringOrVariable(peek)
                : peek.value;
            if (arg.enum !== undefined && !arg.enum.includes(val.toLowerCase()) && !arg.default)
                throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.IllegalArgument(arg, index, initiator, peek);
            tokens.push(new fthtmlelement_1.FTHTMLElement(this.consume(), val));
        });
        return tokens;
    }
}
exports.Function = Function;
//# sourceMappingURL=function.js.map