import { FTHTMLConfig } from "../../cli/utils/user-config-helper";
import { DNToken, DNTOKEN_TYPES, DotNotationLexer } from "../lexer/dot-notation-lexer";
import InputStream from "../lexer/streams/input-stream";
import { FTHTMLExceptions } from "../model/exceptions/fthtml-exceptions";
import { Token } from "../model/token";
export default class DotNotationParser {

    public static parse(token: Token<any>, vars: object, uconfig: FTHTMLConfig, shouldOmit: boolean): object {

        let variable = token.value;

        let index = -1;
        if (~(index = variable.search(/[\.\[]/)))
            variable = variable.substring(0, index);
        const varName = variable;

        if (!/^[\w-]+$/.test(varName) || varName === 'import')
            throw new FTHTMLExceptions.Parser.InvalidVariableName(new DNToken(token.type, varName, Token.Position.create(token.position.line, token.position.column + 1), token.delimiter), '[\w-]+');

        variable = vars[varName] !== undefined
            ? vars[varName]
            : uconfig.globalvars[varName];

        if (variable === undefined && !shouldOmit)
            throw new FTHTMLExceptions.Parser.VariableDoesntExist(new DNToken(token.type, varName, Token.Position.create(token.position.line, token.position.column + 1), token.delimiter));

        const segments = new DotNotationLexer(InputStream(token.value.substring(index)), new Token(token.type, varName, token.position, token.delimiter)).stream();
        let result: any = variable;
        let prev = new DNToken(token.type, varName, Token.Position.create(token.position.line, token.position.column), token.delimiter);
        while (!segments.eof()) {
            prev = segments.previous() ?? prev;
            let v = segments.next();
            let key = v.value;
            if (v.type === DNTOKEN_TYPES.NUMBER)
                key = v.value.replace(/_/g, '');
            result = result[key];
            if (result === undefined)
                throw new FTHTMLExceptions.Parser.JSON(`Key '${key}' does not exist for property '${prev.value}'`, new DNToken(v.type, v.value, v.position, v.delimiter));
        }

        return result;

    }

}