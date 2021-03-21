import { token } from "../lexer/token";
import { Tokenable } from "../lexer/types";
import { ITinyTemplate } from "./types";

export function TinyTemplate(value: token, origin: string, element?: Tokenable, attrs?: object): ITinyTemplate {
    return {
        element,
        attrs,
        value,
        origin
    }
}