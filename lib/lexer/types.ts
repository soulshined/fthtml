import { token, TOKEN_TYPE as TT } from "./token";

export type char = string;
export type Tokenable = token | null;
export type TokenStream = {
    next: () => Tokenable;
    peek: () => Tokenable;
    eof: () => boolean;
};

export type funcrules = {
    argsSequenceStrict: boolean;
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