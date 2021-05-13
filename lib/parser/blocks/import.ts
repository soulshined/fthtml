import * as path from "path";
import { FTHTMLExceptions } from "../../model/exceptions/fthtml-exceptions";
import { FTHTMLElement } from "../../model/fthtmlelement";
import { HTMLBuilder } from "../../model/html-builder";
import { Token } from "../../model/token";
import { FTHTMLBaseParser, FTHTMLParser } from "../fthtml-parser";
import { AbstractBlock } from "./abstract";

export class ImportBlock extends AbstractBlock {
    constructor(keyword, value, base: FTHTMLBaseParser) {
        super(base);
        this.parse(keyword, value);
    }

    public get value(): FTHTMLElement | FTHTMLElement[] {
        return this._value;
    }
    protected parse(keyword, value): void {
        const valElement = new FTHTMLElement(value, this.base.parseStringOrVariable(value).toString());
        if (!this.isEOF && Token.isExpectedType(this.peek, 'Symbol_{')) {
            this.vars.import.import = valElement.parsedValue;
            keyword.isParentElement = true;
            const template = this.parseTemplate(keyword.token);
            keyword.children.push(valElement, ...template.children);
            keyword.parsedValue = template.parsedValue;
            keyword.childrenStart = template.childrenStart;
            keyword.childrenEnd = template.childrenEnd;
            template.childrenStart = undefined;
            template.childrenEnd = undefined;
            this._value = keyword;
            return;
        }
        let dir = this.uconfig.importDir ?? this.base.vars._$.__dir;
        if (valElement.parsedValue.startsWith('&')) {
            dir = this.base.vars._$.__dir;
            valElement.parsedValue = valElement.parsedValue.substring(1);
        }
        const file = path.resolve(dir, valElement.parsedValue);
        FTHTMLExceptions.Stack.update(0, 'import', Token.Position.create(keyword.token.position.line, keyword.token.position.column));

        const elements = new FTHTMLParser(this.uconfig).parseFile(file);
        keyword.children.push(valElement);
        keyword.parsedValue = HTMLBuilder.build(elements);
        this._value = keyword;
    }

    private parseTemplate(token: Token<Token.TYPES>): FTHTMLElement {
        const lBrace = this.consume(),
            template = Object.assign({}, this.vars.import),
            elements: FTHTMLElement[] = this.base.consumeComments();

        while (!this.isEOF) {
            const t = new FTHTMLElement(this.consume());

            if (Token.isExpectedType(t.token, 'Symbol_}')) {
                let dir = this.uconfig.importDir ?? this.base.vars._$.__dir;
                if (template.import.startsWith('&')) {
                    dir = this.vars._$.__dir;
                    template.import = template.import.substring(1);
                }
                const file = path.resolve(dir, template.import);

                FTHTMLExceptions.Stack.update(0, 'import template', Token.Position.create(lBrace.position.line, lBrace.position.column));

                const parsed = HTMLBuilder.build(new FTHTMLParser(this.uconfig, { import: template }).parseFile(file))
                const result = new FTHTMLElement(token, parsed, elements);
                result.childrenStart = lBrace.position;
                result.childrenEnd = t.token.position;
                return result;
            }

            if (!Token.isExpectedType(t.token, Token.TYPES.WORD)) throw new FTHTMLExceptions.Parser.InvalidVariableName(t.token, '[\w-]+');
            this.throwIfEOF(new FTHTMLExceptions.Parser.IncompleteElement(t.token, 'string, macro, function or ftHTML block values'));
            Token.evaluate(t.token);

            const peek = this.peek;
            if (Token.isOneOfExpectedTypes(peek, Token.Sequences.STRINGABLE)) {
                const str = this.base.parseStringOrVariable(this.consume());
                template[t.token.value] = str;
                t.children.push(new FTHTMLElement(peek, str));
            }
            else if (Token.isExpectedType(peek, Token.TYPES.FUNCTION)) {
                const func = this.base.parseFunction();
                template[t.token.value] = func.parsedValue;
                t.children.push(func);
            }
            else if (Token.isExpectedType(peek, Token.TYPES.MACRO)) {
                const parsedValue = this.base.parseMacro();
                template[t.token.value] = parsedValue;
                t.children.push(new FTHTMLElement(peek, parsedValue));
            }
            else if (Token.isExpectedType(peek, 'Symbol_{')) {
                const children = this.base.parseParentElementChildren(Token.Sequences.CHILDREN_NO_PRAGMA);
                t.childrenStart = children.braces[0].position;
                t.childrenEnd = children.braces[1].position;
                t.children = children.children;
                t.isParentElement = true;
                t.parsedValue = HTMLBuilder.build(t.children);
                template[t.token.value] = t.parsedValue;
            }
            else throw new FTHTMLExceptions.Parser.InvalidType(peek, 'string, macro, function or ftHTML block values');

            elements.push(t, ...this.base.consumeComments());
        }

        throw new FTHTMLExceptions.Parser.InvalidType(lBrace, `an opening and closing braces for template imports`);
    }

}
