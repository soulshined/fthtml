"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fthtml_exceptions_1 = require("../../../model/exceptions/fthtml-exceptions");
const fthtmlelement_1 = require("../../../model/fthtmlelement");
const html_builder_1 = require("../../../model/html-builder");
const token_1 = require("../../../model/token");
const abstract_1 = require("./abstract");
const fs = require("fs");
const path = require("path");
class PragmaVars extends abstract_1.AbstractPragma {
    parse(pragma) {
        var _a;
        while (!this.isEOF) {
            pragma.children.push(...this.base.consumeComments());
            const t = this.consume();
            if (token_1.Token.isExpectedType(t, 'Pragma_end')) {
                pragma.childrenStart = pragma.token.position;
                pragma.childrenEnd = t.position;
                this._value = pragma;
                return;
            }
            if (!token_1.Token.isExpectedType(t, "Word"))
                throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.InvalidVariableName(t, '[\w-]+');
            token_1.Token.evaluate(t);
            this.throwIfEOF(new fthtml_exceptions_1.FTHTMLExceptions.Parser.IncompleteElement(t, 'a string or ftHTML block values or dot-notated accessors for variables'));
            const peek = this.peek;
            if (token_1.Token.isExpectedType(peek, "String")) {
                const parsed = this.base.parseStringOrVariable(this.consume());
                this.base.updateVariable(t, parsed);
                pragma.children.push(new fthtmlelement_1.FTHTMLElement(t, undefined, [new fthtmlelement_1.FTHTMLElement(peek, parsed)]));
            }
            else if (token_1.Token.isExpectedType(peek, "Literal Variable")) {
                const parsed = this.base.parseStringOrVariable(this.consume());
                this.base.updateVariable(t, parsed);
                pragma.children.push(new fthtmlelement_1.FTHTMLElement(t, undefined, [new fthtmlelement_1.FTHTMLElement(peek, parsed)]));
            }
            else if (token_1.Token.isExpectedType(peek, 'Symbol_{')) {
                const variable = new fthtmlelement_1.FTHTMLElement(t);
                const elems = this.base.parseParentElementChildren(token_1.Token.Sequences.CHILDREN_NO_PRAGMA);
                variable.children = elems.children;
                variable.childrenStart = elems.braces[0].position;
                variable.childrenEnd = elems.braces[1].position;
                variable.isParentElement = true;
                pragma.children.push(variable);
                this.base.updateVariable(t, html_builder_1.HTMLBuilder.build(variable.children));
            }
            else if (token_1.Token.isExpectedType(peek, "Function")) {
                const func = this.base.parseFunction();
                pragma.children.push(new fthtmlelement_1.FTHTMLElement(t, undefined, [func]));
                this.base.updateVariable(t, func.parsedValue);
            }
            else if (token_1.Token.isExpectedType(peek, "Macro")) {
                const parsed = this.base.parseMacro();
                this.base.updateVariable(t, parsed);
                pragma.children.push(new fthtmlelement_1.FTHTMLElement(t, undefined, [new fthtmlelement_1.FTHTMLElement(peek, parsed)]));
            }
            else if (token_1.Token.isExpectedType(peek, 'Word_json')) {
                const jsonElem = new fthtmlelement_1.FTHTMLElement(this.consume());
                const parsed = this.base.parseTypesInOrder([['Symbol_('], ["String"], ['Symbol_)']], peek);
                const [_, json_file] = parsed;
                json_file.parsedValue = json_file.parsedValue.toString();
                if (json_file.parsedValue.startsWith('https:') || json_file.parsedValue.startsWith('http:'))
                    throw new fthtml_exceptions_1.FTHTMLExceptions.Import(`Files must be local, can not access '${json_file.token.value}'`, json_file.token);
                let dir = (_a = this.uconfig.jsonDir, (_a !== null && _a !== void 0 ? _a : this.vars._$.__dir));
                if (json_file.parsedValue.startsWith('&')) {
                    dir = this.vars._$.__dir;
                    json_file.parsedValue = json_file.parsedValue.substring(1);
                }
                const file = path.resolve(dir, `${json_file.parsedValue}.json`);
                if (!fs.existsSync(file))
                    throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.JSON(`Can not find json file '${file}'`, json_file.token);
                jsonElem.children.push(new fthtmlelement_1.FTHTMLElement(json_file.token, file));
                const filecontents = fs.readFileSync(file, 'utf-8');
                try {
                    const parsed = JSON.parse(filecontents);
                    this.base.updateVariable(t, parsed);
                    jsonElem.parsedValue = parsed;
                    pragma.children.push(new fthtmlelement_1.FTHTMLElement(t, undefined, [jsonElem]));
                }
                catch (error) {
                    throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.JSON(error.message, json_file.token);
                }
            }
            else
                throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.InvalidType(peek, 'string or ftHTML block or dot-notated accessor values');
        }
        ;
        throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.IncompleteElement(pragma.token, `an '#end' pragma keyword for starting pragma '${pragma.token.value}' but none found`, pragma.token);
    }
}
exports.PragmaVars = PragmaVars;
//# sourceMappingURL=vars.js.map