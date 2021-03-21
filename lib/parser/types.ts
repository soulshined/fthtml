import { token } from "../lexer/token";
import { Tokenable } from "../lexer/types";

export interface ITinyTemplate {
    element?: Tokenable,
    attrs?: object,
    value: token,
    origin: string
}