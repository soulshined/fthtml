"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const grammar_1 = require("../../lexer/grammar");
const fthtml_exceptions_1 = require("../../model/exceptions/fthtml-exceptions");
const token_1 = require("../../model/token");
const utils_1 = require("../../utils");
const dotnotation_parser_1 = require("../dotnotation-parser");
const abstract_1 = require("./abstract");
class Stringable extends abstract_1.AbstractBlock {
    constructor(token, base) {
        super(base);
        this.allowedPipes = [
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
        this.parse(token);
    }
    parse(token) {
        this._value = this.parseStringOrVariable(token);
    }
    parseStringOrVariable(token) {
        if (token_1.Token.isOneOfExpectedTypes(token, [...token_1.Token.Sequences.VARIABLE, "Attr_Class_Var", "Attr_Class_Literal_Var"]))
            return this.parseVariable(token);
        return this.parseString(token);
    }
    parseString(token) {
        var _a;
        let val = token.value;
        let matches = utils_1.Utils.Regex.getAllMatches(val, new RegExp(`(\\\\)?(\\\${[ ]*@([\\w-]+)[ ]*((?:[ ]*\\|[ ]*(?:${this.allowedPipes.join("|")}))*)[ ]*})`, 'gi'));
        for (const [all, escaped, interp, e, pipes] of matches) {
            if (escaped) {
                val = val.replace(all, interp);
                continue;
            }
            const v = (_a = this.base.vars[e], (_a !== null && _a !== void 0 ? _a : this.uconfig.globalvars[e]));
            if (v !== undefined) {
                const str = val.replace(all, this.execPipes(v, pipes.split("|"), token));
                if (matches.length === 1 && val.replace(all, '').trim().length === 0 &&
                    (utils_1.Utils.Types.isObject(v) || utils_1.Utils.Types.isArray(v))) {
                    val = this.execPipes(v, pipes.split("|"), token);
                    break;
                }
                else
                    val = str;
            }
        }
        matches = utils_1.Utils.Regex.getAllMatches(val, new RegExp(`(\\\\)?(\\\${[ ]*@([\\w-]+)((\\\[\\d+\\\])*(?:\\.[a-zA-Z0-9][a-zA-Z0-9-_]*\\??(?:\\\[\\d+\\\])*)+|(?:\\\[\\d+\\\])+)+((?:[ ]*\\\|[ ]*(?:${this.allowedPipes.join("|")}))*)[ ]*})`, 'gi'));
        for (const [all, escaped, interp, e, kvps, _, pipes] of matches) {
            if (escaped) {
                val = val.replace(all, interp);
                continue;
            }
            let v = this.base.vars[e];
            if (v === undefined)
                continue;
            const keys = kvps.replace(/\[(\d+)\]/g, ".$1").split(".");
            keys.shift();
            for (let key of keys) {
                const isOptional = key.endsWith("?");
                if (isOptional)
                    key = key.substring(0, key.length - 1);
                if (v[key] === undefined) {
                    if (isOptional) {
                        v = undefined;
                        val = val.replace(all, "");
                        break;
                    }
                    throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.JSON(`Cannot read property '${key}' of '${all}'`, token);
                }
                v = v[key];
            }
            if (v !== undefined) {
                const str = val.replace(all, this.execPipes(v, pipes.split("|"), token));
                if (matches.length === 1 && val.replace(all, '').trim().length === 0 &&
                    (utils_1.Utils.Types.isObject(v) || utils_1.Utils.Types.isArray(v))) {
                    val = this.execPipes(v, pipes.split("|"), token);
                    break;
                }
                else
                    val = str;
            }
        }
        matches = utils_1.Utils.Regex.getAllMatches(val, new RegExp(`(\\\\)?(\\\${[ ]*([\\w-]+)(\\?)?[ ]*((?:[ ]*\\|[ ]*(?:${this.allowedPipes.join("|")}))*)[ ]*})`, 'gi'));
        for (const [all, escaped, interp, e, nullsafe, pipes] of matches) {
            if (escaped) {
                val = val.replace(all, interp);
                continue;
            }
            const v = this.base.vars.import[e];
            if (v !== undefined) {
                const str = val.replace(all, this.execPipes(v, pipes.split("|"), token));
                if (matches.length === 1 && val.replace(all, '').trim().length === 0 &&
                    (utils_1.Utils.Types.isObject(v) || utils_1.Utils.Types.isArray(v))) {
                    val = this.execPipes(v, pipes.split("|"), token);
                    break;
                }
                else
                    val = str;
            }
            else if (nullsafe) {
                if (grammar_1.default.macros[e])
                    return;
                else
                    val = val.replace(all, '');
            }
            else if (grammar_1.default.macros[e]) {
                val = val.replace(all, this.execPipes(grammar_1.default.macros[e].apply(), pipes.split("|"), token));
            }
        }
        if (typeof val === 'string')
            val = val.replace(new RegExp(`\\\\(${token.delimiter})`, 'g'), '$1');
        return val;
    }
    parseVariable(token) {
        if (token_1.Token.isOneOfExpectedTypes(token, ["Literal Variable", "Attr_Class_Literal_Var"]))
            return dotnotation_parser_1.default.parse(token, this.base.vars, this.uconfig, this.base.shouldOmit);
        const value = this.base.vars[token.value] !== undefined
            ? this.base.vars[token.value]
            : this.uconfig.globalvars[token.value];
        if (value === undefined || token.value === 'import') {
            if (!this.base.shouldOmit)
                throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.VariableDoesntExist(token);
            return '';
        }
        return this.parseString(new token_1.Token(token.type, value, token.position, token.delimiter));
    }
    execPipes(varValue, pipes, token) {
        let value = varValue;
        pipes.shift();
        pipes.forEach(cmd => {
            cmd = cmd.trim().toLowerCase();
            if (['lower', 'upper', 'alternating', 'capital', 'title', 'kebab', 'camel', 'pascal'].includes(cmd)) {
                if (utils_1.Utils.Types.isArray(value)) {
                    value = value.map(e => this.callFunction('tcase', token, e, cmd));
                }
                else
                    value = this.callFunction('tcase', token, value, cmd);
            }
            else if ('reverse' === cmd) {
                if (utils_1.Utils.Types.isArray(value)) {
                    value = value.map(e => this.callFunction('str_reverse', token, e));
                }
                else
                    value = this.callFunction('str_reverse', token, value);
            }
            else if ('choose' === cmd) {
                value = this.callFunction('choose', token, ...value);
            }
            else if (['trim', 'trimleft', 'trimright', 'trimstart', 'trimend'].includes(cmd)) {
                if (utils_1.Utils.Types.isArray(value)) {
                    value = value.map(e => this.callFunction('trim', token, e, cmd.substring(4)));
                }
                else
                    value = this.callFunction('trim', token, value, cmd.substring(4));
            }
            else if ('len' === cmd) {
                let t = utils_1.Utils.Types.isArray(varValue) || utils_1.Utils.Types.isObject(varValue) ? "Variable" : "String";
                value = this.callFunction('len', token, [value, t]);
            }
            else if (['keys', 'values'].includes(cmd)) {
                value = this.callFunction(cmd, token, value);
            }
            else if (['asc', 'desc'].includes(cmd)) {
                value = this.callFunction('sort', token, value, cmd);
            }
            else
                throw new fthtml_exceptions_1.FTHTMLExceptions.Parser(`Unsupported pipe function '${cmd}'`, token, this.allowedPipes);
        });
        return value;
    }
    callFunction(name, token, ...args) {
        return this.base.callFunction(name, token, this.allowedPipes, ...args);
    }
    get value() {
        return this._value;
    }
}
exports.Stringable = Stringable;
//# sourceMappingURL=stringable.js.map