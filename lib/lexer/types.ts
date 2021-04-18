import { IFTHTMLElement } from "../parser/types";
import { token, TOKEN_TYPE as TT } from "./token";

export type char = string;
export type Tokenable = token | null;
export type TokenStream = {
    next: () => Tokenable;
    peek: () => Tokenable;
    previous: () => Tokenable;
    eof: () => boolean;
};

export const FTHTMLComment = [TT.COMMENT, TT.COMMENTB];
export const FTHTMLString = [TT.STRING, TT.VARIABLE];
export const FTHTMLBlock = [TT.WORD, TT.ELANG, TT.KEYWORD, TT.FUNCTION, TT.MACRO, ...FTHTMLString, ...FTHTMLComment];
export const FTHTMLChildren = [...FTHTMLBlock, TT.PRAGMA];
export const FTHTMLTopLevelElements = [TT.WORD, TT.ELANG, TT.FUNCTION, TT.MACRO, TT.PRAGMA, TT.KEYWORD, TT.VARIABLE, ...FTHTMLComment];
export const FTHTMLOperator = ['Operator_eq', 'Operator_ne', 'Operator_gt', 'Operator_ge', 'Operator_lt', 'Operator_le', 'Operator_ie', 'Operator_contains', 'Operator_icontains', 'Operator_istarts', 'Operator_starts', 'Operator_iends', 'Operator_ends', 'Operator_match', 'Operator_imatch'];
export type FTHTMLExpression = [ IFTHTMLElement, IFTHTMLElement, IFTHTMLElement ];

export type funcrules = {
    argsSequenceStrict: boolean;
    useRawVariables: boolean;
    returnTokenTypes: boolean;
    argPatterns: {
        type: TT[],
        name: string,
        possibleValues?: string[],
        isOptional?: boolean,
        isRestParameter?: boolean
    }[];
    do: (...values: any[]) => any;
}

export { LEX_MODE } from './lexmode';
export { TOKEN_TYPE, TokenPosition, tokenposition, default as Token, getTokenTypeForIdentifier, token } from './token';