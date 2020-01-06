import { token } from "./token";

export type char = string;
export type Tokenable = token | null;
export type TokenStream = {
    next: () => Tokenable;
    peek: () => Tokenable;
    eof: () => boolean;
}

export { LEX_MODE } from './lexmode';
export { TOKEN_TYPE, TokenPosition, tokenposition, default as Token, getTokenTypeForIdentifier, token } from './token';