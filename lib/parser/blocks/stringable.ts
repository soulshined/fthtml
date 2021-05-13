import grammar from "../../lexer/grammar";
import { FTHTMLExceptions } from "../../model/exceptions/fthtml-exceptions";
import { Token } from "../../model/token";
import { Utils } from "../../utils";
import DotNotationParser from "../dotnotation-parser";
import { FTHTMLBaseParser } from "../fthtml-parser";
import { AbstractBlock } from "./abstract";

export class Stringable extends AbstractBlock {
    private allowedPipes = [
        "asc",
        "desc",
        "lower",
        "upper",
        "alternating",
        "capital",
        "title",
        "kebab",
        "camel",
        "pascal",
        "keys",
        "values",
        "choose",
        "reverse",
        "len",
        "trim",
        "trimEnd",
        "trimStart",
        "trimLeft",
        "trimRight"
    ];

    constructor(token: Token<Token.TYPES>, base: FTHTMLBaseParser) {
        super(base);
        this.parse(token);
    }

    protected parse(token: Token<Token.TYPES>) {
        this._value = this.parseStringOrVariable(token);
    }

    protected parseStringOrVariable(token: Token<Token.TYPES>): string {
        if (Token.isOneOfExpectedTypes(token, [...Token.Sequences.VARIABLE, Token.TYPES.ATTR_CLASS_VAR, Token.TYPES.ATTR_CLASS_LITERAL_VAR]))
            return this.parseVariable(token);

        return this.parseString(token);
    }

    protected parseString(token: Token<Token.TYPES>): string {
        let val = token.value;
        let matches = Utils.Regex.getAllMatches(val, new RegExp(`(\\\\)?(\\\${[ ]*@([\\w-]+)[ ]*((?:[ ]*\\|[ ]*(?:${this.allowedPipes.join("|")}))*)[ ]*})`, 'gi'));
        for (const [all, escaped, interp, e, pipes] of matches) {
            if (escaped) {
                val = val.replace(all, interp);
                continue;
            }

            const v = this.base.vars[e] ?? this.uconfig.globalvars[e];
            if (v !== undefined) {
                const str = val.replace(all, this.execPipes(v, pipes.split("|"), token));
                if (matches.length === 1 && val.replace(all, '').trim().length === 0 &&
                    (Utils.Types.isObject(v) || Utils.Types.isArray(v))) {
                    val = this.execPipes(v, pipes.split("|"), token);
                    break;
                }
                else val = str;
            }
        }

        matches = Utils.Regex.getAllMatches(val, new RegExp(`(\\\\)?(\\\${[ ]*@([\\w-]+)((\\\[\\d+\\\])*(?:\\.[a-zA-Z0-9][a-zA-Z0-9-_]*(?:\\\[\\d+\\\])*)+|(?:\\\[\\d+\\\])+)+((?:[ ]*\\\|[ ]*(?:${this.allowedPipes.join("|")}))*)[ ]*})`, 'gi'));
        for (const [all, escaped, interp, e, kvps, _, pipes] of matches) {
            if (escaped) {
                val = val.replace(all, interp);
                continue;
            }

            let v = this.base.vars[e];
            if (v === undefined) continue;

            const keys = kvps.replace(/\[(\d+)\]/g, ".$1").split(".");
            keys.shift();

            keys.forEach(key => {
                if (v[key] === undefined)
                    throw new FTHTMLExceptions.Parser.JSON(`Cannot read property '${key}' of '${all}'`, token);
                v = v[key]
            });

            if (v !== undefined) {
                const str = val.replace(all, this.execPipes(v, pipes.split("|"), token));
                if (matches.length === 1 && val.replace(all, '').trim().length === 0 &&
                    (Utils.Types.isObject(v) || Utils.Types.isArray(v))) {
                    val = this.execPipes(v, pipes.split("|"), token);
                    break;
                }
                else val = str;
            }
        }

        matches = Utils.Regex.getAllMatches(val, new RegExp(`(\\\\)?(\\\${[ ]*([\\w-]+)(\\?)?[ ]*((?:[ ]*\\|[ ]*(?:${this.allowedPipes.join("|")}))*)[ ]*})`, 'gi'));
        for (const [all, escaped, interp, e, nullsafe, pipes] of matches) {
            if (escaped) {
                val = val.replace(all, interp);
                continue;
            }

            const v = this.base.vars.import[e];
            if (v !== undefined) {
                const str = val.replace(all, this.execPipes(v, pipes.split("|"), token));
                if (matches.length === 1 && val.replace(all, '').trim().length === 0 &&
                    (Utils.Types.isObject(v) || Utils.Types.isArray(v))) {
                    val = this.execPipes(v, pipes.split("|"), token);
                    break;
                }
                else val = str;
            }
            else if (nullsafe) {
                if (grammar.macros[e]) return;
                else val = val.replace(all, '');
            }
            else if (grammar.macros[e]) {
                val = val.replace(all, this.execPipes(grammar.macros[e].apply(), pipes.split("|"), token));
            }
        }

        if (typeof val === 'string')
            val = val.replace(new RegExp(`\\\\(${token.delimiter})`, 'g'), '$1');
        return val;
    }

    protected parseVariable(token: Token<Token.TYPES>): any {
        if (Token.isOneOfExpectedTypes(token, [Token.TYPES.LITERAL_VARIABLE, Token.TYPES.ATTR_CLASS_LITERAL_VAR]))
            return DotNotationParser.parse(token, this.base.vars, this.uconfig, this.base.shouldOmit);

        const value = this.base.vars[token.value] !== undefined
            ? this.base.vars[token.value]
            : this.uconfig.globalvars[token.value];

        if (value === undefined || token.value === 'import') {
            if (!this.base.shouldOmit)
                throw new FTHTMLExceptions.Parser.VariableDoesntExist(token);

            return '';
        }

        return this.parseString(new Token(token.type, value, token.position, token.delimiter));
    }

    private execPipes(varValue: any, pipes: string[], token: Token<Token.TYPES>) {
        let value = varValue;
        pipes.shift();
        pipes.forEach(cmd => {
            cmd = cmd.trim().toLowerCase();
            if (['lower', 'upper', 'alternating', 'capital', 'title', 'kebab', 'camel', 'pascal'].includes(cmd)) {
                if (Utils.Types.isArray(value)) {
                    value = value.map(e => this.callFunction('tcase', token, e, cmd));
                }
                else
                    value = this.callFunction('tcase', token, value, cmd);
            }
            else if ('reverse' === cmd) {
                if (Utils.Types.isArray(value)) {
                    value = value.map(e => this.callFunction('str_reverse', token, e));
                }
                else
                    value = this.callFunction('str_reverse', token, value);
            }
            else if ('choose' === cmd) {
                value = this.callFunction('choose', token, ...value);
            }
            else if (['trim', 'trimleft', 'trimright', 'trimstart', 'trimend'].includes(cmd)) {
                if (Utils.Types.isArray(value)) {
                    value = value.map(e => this.callFunction('trim', token, e, cmd.substring(4)));
                }
                else value = this.callFunction('trim', token, value, cmd.substring(4));
            }
            else if ('len' === cmd) {
                let t = Utils.Types.isArray(varValue) || Utils.Types.isObject(varValue) ? Token.TYPES.VARIABLE : Token.TYPES.STRING;
                value = this.callFunction('len', token, [value, t]);
            }
            else if (['keys', 'values'].includes(cmd)) {
                value = this.callFunction(cmd, token, value);
            }
            else if (['asc', 'desc'].includes(cmd)) {
                value = this.callFunction('sort', token, value, cmd);
            }
            else throw new FTHTMLExceptions.Parser(`Unsupported pipe function '${cmd}'`, token, this.allowedPipes);
        });

        return value;
    }

    private callFunction(name: string, token: Token<Token.TYPES>, ...args: any) {
        return this.base.callFunction(name, token, this.allowedPipes, ...args);
    }

    public get value(): any {
        return this._value;
    }
}
