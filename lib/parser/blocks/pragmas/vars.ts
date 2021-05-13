import { FTHTMLExceptions } from "../../../model/exceptions/fthtml-exceptions";
import { FTHTMLElement } from "../../../model/fthtmlelement";
import { HTMLBuilder } from "../../../model/html-builder";
import { Token } from "../../../model/token";
import { AbstractPragma } from "./abstract";
import * as fs from 'fs';
import * as path from "path";

export class PragmaVars extends AbstractPragma {

    protected parse(pragma: FTHTMLElement) {
        while (!this.isEOF) {
            pragma.children.push(...this.base.consumeComments());
            const t = this.consume();

            if (Token.isExpectedType(t, 'Pragma_end')) {
                pragma.childrenStart = pragma.token.position;
                pragma.childrenEnd = t.position;
                this._value = pragma;
                return;
            }
            if (!Token.isExpectedType(t, Token.TYPES.WORD)) throw new FTHTMLExceptions.Parser.InvalidVariableName(t, '[\w-]+');

            Token.evaluate(t);
            this.throwIfEOF(new FTHTMLExceptions.Parser.IncompleteElement(t, 'a string or ftHTML block values or dot-notated accessors for variables'));

            const peek = this.peek;
            if (Token.isExpectedType(peek, Token.TYPES.STRING)) {
                const parsed = this.base.parseStringOrVariable(this.consume());
                this.base.updateVariable(t, parsed);
                pragma.children.push(new FTHTMLElement(t, undefined, [new FTHTMLElement(peek, parsed)]));
            }
            else if (Token.isExpectedType(peek, Token.TYPES.LITERAL_VARIABLE)) {
                const parsed = this.base.parseStringOrVariable(this.consume());
                this.base.updateVariable(t, parsed);
                pragma.children.push(new FTHTMLElement(t, undefined, [new FTHTMLElement(peek, parsed)]));
            }
            else if (Token.isExpectedType(peek, 'Symbol_{')) {
                const variable = new FTHTMLElement(t);
                const elems = this.base.parseParentElementChildren(Token.Sequences.CHILDREN_NO_PRAGMA);
                variable.children = elems.children;
                variable.childrenStart = elems.braces[0].position;
                variable.childrenEnd = elems.braces[1].position;
                variable.isParentElement = true;
                pragma.children.push(variable);
                this.base.updateVariable(t, HTMLBuilder.build(variable.children));
            }
            else if (Token.isExpectedType(peek, Token.TYPES.FUNCTION)) {
                const func = this.base.parseFunction();
                pragma.children.push(new FTHTMLElement(t, undefined, [func]));
                this.base.updateVariable(t, func.parsedValue);
            }
            else if (Token.isExpectedType(peek, Token.TYPES.MACRO)) {
                const parsed = this.base.parseMacro();
                this.base.updateVariable(t, parsed);
                pragma.children.push(new FTHTMLElement(t, undefined, [new FTHTMLElement(peek, parsed)]));
            }
            else if (Token.isExpectedType(peek, 'Word_json')) {
                const jsonElem = new FTHTMLElement(this.consume());
                const parsed = this.base.parseTypesInOrder([['Symbol_('], [Token.TYPES.STRING], ['Symbol_)']], peek);
                const [_, json_file] = parsed;
                json_file.parsedValue = json_file.parsedValue.toString();

                if (json_file.parsedValue.startsWith('https:') || json_file.parsedValue.startsWith('http:'))
                    throw new FTHTMLExceptions.Import(`Files must be local, can not access '${json_file.token.value}'`, json_file.token);

                let dir = this.uconfig.jsonDir ?? this.vars._$.__dir;
                if (json_file.parsedValue.startsWith('&')) {
                    dir = this.vars._$.__dir;
                    json_file.parsedValue = json_file.parsedValue.substring(1);
                }
                const file = path.resolve(dir, `${json_file.parsedValue}.json`);

                if (!fs.existsSync(file))
                    throw new FTHTMLExceptions.Parser.JSON(`Can not find json file '${file}'`, json_file.token);

                jsonElem.children.push(new FTHTMLElement(json_file.token, file));

                const filecontents = fs.readFileSync(file, 'utf-8');
                try {
                    const parsed = JSON.parse(filecontents);
                    this.base.updateVariable(t, parsed);
                    jsonElem.parsedValue = parsed;
                    pragma.children.push(new FTHTMLElement(t, undefined, [jsonElem]));
                }
                catch (error) {
                    throw new FTHTMLExceptions.Parser.JSON(error.message, json_file.token);
                }
            }
            else throw new FTHTMLExceptions.Parser.InvalidType(peek, 'string or ftHTML block or dot-notated accessor values');
        };

        throw new FTHTMLExceptions.Parser.IncompleteElement(pragma.token, `an '#end' pragma keyword for starting pragma '${pragma.token.value}' but none found`, pragma.token);
    }

}