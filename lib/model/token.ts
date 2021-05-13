import { default as ftHTMLGrammar } from "../lexer/grammar/index";
import { Operator } from "./operators";
import { TYPES } from "../lexer/types/types";
import { FTHTMLElement } from "./fthtmlelement";
import { FTHTMLExceptions } from "./exceptions/fthtml-exceptions";

export enum ABSTRACT_TOKEN_TYPES {
    STRING = 'String',
    WORD = 'Word',
}

export abstract class AbstractToken<T> implements TYPES.Cloneable<T> {
    private _value: string;
    private _position: Token.Position;
    private _delimiter?: TYPES.char;

    constructor(value: string, position: Token.Position, delimiter?: TYPES.char) {
        this._value = value;
        this._position = position;
        this._position.end = position.column + value.length;
        this._delimiter = delimiter;
    }

    public get value() : string {
        return this._value;
    }

    public set value(v : string) {
        this._value = v;
    }

    public get position() : Token.Position {
        return this._position;
    }

    public get delimiter() : TYPES.char {
        return this._delimiter;
    }

    abstract clone(): T;

}

export class Token<V> extends AbstractToken<Token<V>> {
    protected _type: V | ABSTRACT_TOKEN_TYPES;

    constructor(type: V | ABSTRACT_TOKEN_TYPES, value: string, position: Token.Position, delimiter?: TYPES.char) {
        super(value, position, delimiter);
        this._type = type;
        if (['Variable', 'Literal Variable'].includes(type.toString()))
            this.position.end++
        else if (type === 'String') {
            this.position.end += 2;
        };
    }


    public get type() : V | ABSTRACT_TOKEN_TYPES {
        return this._type;
    }

    clone(): Token<V> {
        return new Token(this.type, this.value, this.position, this.delimiter);
    }
}

export namespace Token {
    export const enum TYPES {
        ATTR_CLASS = 'Attr_Class',
        ATTR_CLASS_VAR = 'Attr_Class_Var',
        ATTR_CLASS_LITERAL_VAR = 'Attr_Class_Literal_Var',
        ATTR_ID = 'Attr_Id',
        COMMENT = 'Comment',
        COMMENTB = 'Block Comment',
        ELANG = 'ELang',
        ELANGB = 'ElangB',
        FUNCTION = 'Function',
        MACRO = 'Macro',
        KEYWORD = 'Keyword',
        KEYWORD_DOCTYPE = 'Keyword_Doctype',
        OPERATOR = 'Operator',
        PRAGMA = 'Pragma',
        STRING = 'String',
        SYMBOL = 'Symbol',
        LITERAL_VARIABLE = 'Literal Variable',
        VARIABLE = 'Variable',
        WORD = 'Word',
    };

    export function getTypeForIdentifier(identifier: string): TYPES.KEYWORD_DOCTYPE |
        TYPES.KEYWORD |
        TYPES.ELANG |
        TYPES.FUNCTION |
        TYPES.MACRO |
        TYPES.PRAGMA |
        TYPES.WORD |
        TYPES.OPERATOR |
        TYPES.ATTR_ID {
        if (~ftHTMLGrammar.keywords.indexOf(identifier)) {
            if (identifier == 'doctype') return TYPES.KEYWORD_DOCTYPE;
            return TYPES.KEYWORD;
        }
        else if (ftHTMLGrammar.elangs[identifier]) return TYPES.ELANG;
        else if (~ftHTMLGrammar.pragmas.indexOf(identifier)) return TYPES.PRAGMA;
        else if (ftHTMLGrammar.functions[identifier]) return TYPES.FUNCTION;
        else if (ftHTMLGrammar.macros[identifier]) return TYPES.MACRO;
        else if (~ftHTMLGrammar.operators.indexOf(identifier)) return TYPES.OPERATOR;
        else return TYPES.WORD;
    }

    export function joinTypes(types: (Token.TYPES | string)[]) {
        const result = types.map(m => m.startsWith('Function_') ? `${m.substring(9)}()` : m);
        result.sort();
        return result.join(", ");
    }

    export interface Position {
        line: number;
        column: number;
        end: number;
    }
    export namespace Position {
        export function create(line: number, column: number): Position {
            return {
                line,
                column,
                end: column + 1
            }
        }
    }

    export namespace Sequences {
        export const COMMENTS = [TYPES.COMMENT, TYPES.COMMENTB];
        export const VARIABLE = [TYPES.VARIABLE, TYPES.LITERAL_VARIABLE];
        export const STRINGABLE = [TYPES.STRING, ...VARIABLE];
        export const ORDERED = [...Token.Sequences.STRINGABLE, Token.TYPES.ELANG, Token.TYPES.MACRO, Token.TYPES.FUNCTION, Token.TYPES.KEYWORD];
        export const CHILDREN_NO_PRAGMA = [TYPES.WORD, TYPES.ELANG, TYPES.KEYWORD, TYPES.FUNCTION, TYPES.MACRO, ...STRINGABLE, ...COMMENTS];
        export const CHILDREN = [...CHILDREN_NO_PRAGMA, TYPES.PRAGMA];
        export const TOP_LEVEL = [TYPES.WORD, TYPES.ELANG, TYPES.FUNCTION, TYPES.MACRO, TYPES.PRAGMA, TYPES.KEYWORD, ...VARIABLE, ...COMMENTS];
        export const OPERATORS = Operator.TYPES.getAllTypes();
        export type IF_ELSE_EXPRESSION = [FTHTMLElement, FTHTMLElement, FTHTMLElement];
    }

    export function isExpectedType(actual: Token<any>, expected: TYPES | ABSTRACT_TOKEN_TYPES | string): boolean {
        // NOTE [02-Jan-2020]: assumes eof is irrelevant
        return actual && (actual.type === expected || `${actual.type}_${actual.value}` === expected);
    }

    export function isOneOfExpectedTypes(actual: Token<any>, expected: (Token.TYPES | ABSTRACT_TOKEN_TYPES | string)[]): boolean {
        return actual && (expected.includes(actual.type) || expected.includes(`${actual.type}_${actual.value}`));
    }

    export function evaluate(token: Token<Token.TYPES>) {
        if (!/^[\w-]+$/.test(token.value))
            throw new FTHTMLExceptions.Parser.InvalidElementName(token, `the following pattern: [\w-]+`);
        if (Token.isExpectedType(token, 'Word_this'))
            throw new FTHTMLExceptions.Parser.InvalidElementName(token, `a valid word. Words can not be reserved keywords, '${token.value}' is a reserved keyword`);
    }

}