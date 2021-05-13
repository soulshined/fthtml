"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_1 = require("../../../model/token");
const abstract_1 = require("./abstract");
class PragmaDebug extends abstract_1.AbstractPragma {
    parse(pragma, prev) {
        var _a, _b;
        const value = this.base.parseTypesInOrder([[...token_1.Token.Sequences.STRINGABLE, "Word", "Function"]], pragma.token)[0];
        if (this.uconfig.isdebug) {
            let token = value.token;
            let msg = (_a = value.parsedValue, (_a !== null && _a !== void 0 ? _a : value.token.value));
            if ((_b = value.parsedValue, (_b !== null && _b !== void 0 ? _b : value.token.value)) === '$') {
                token = prev;
                msg = prev.value;
            }
            if (token_1.Token.isExpectedType(token, "Variable") && this.vars[token.value] !== undefined)
                msg = JSON.stringify(this.vars[token.value], null, this.uconfig.prettify ? 2 : 0);
            if (token_1.Token.isExpectedType(token, "Literal Variable"))
                msg = JSON.stringify(this.base.parseStringOrVariable(token), null, this.uconfig.prettify ? 2 : 0);
            if (this.uconfig.isdebug)
                console.log(`[Debug - ${this.vars._$.__filename}@${token.position.line}:${token.position.column}] ${token.type === "Variable" ? `@${token.value} => ` : ''}${msg}`);
        }
        pragma.parsedValue = value.parsedValue;
        pragma.children.push(value);
        this._value = pragma;
    }
}
exports.PragmaDebug = PragmaDebug;
//# sourceMappingURL=debug.js.map