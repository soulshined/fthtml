import { FTHTMLExceptions } from "../../../model/exceptions/fthtml-exceptions";
import { FTHTMLElement } from "../../../model/fthtmlelement";
import { HTMLBuilder } from "../../../model/html-builder";
import { Token } from "../../../model/token";
import { Utils } from "../../../utils";
import { AbstractPragma } from "./abstract";

export class PragmaIfElse extends AbstractPragma {
    private hasTrueStatement: boolean = false;

    protected parse(pragma: FTHTMLElement, parent: FTHTMLElement): void {
        this.throwIfEOF(new FTHTMLExceptions.Parser.IncompleteElement(pragma.token, `a valid comparator expression`));

        const ifElseBlock = this.parseIfBlock(pragma, this.getIfElseExpression(pragma), parent);
        pragma.childrenEnd = this.consume().position;
        parent.children.unshift(new FTHTMLElement(pragma.token, HTMLBuilder.build(ifElseBlock.slice(3)), ifElseBlock));
        this._value = parent.children;
    }

    private getIfElseExpression(pragma: FTHTMLElement): Token.Sequences.IF_ELSE_EXPRESSION {
        const types = [...Token.Sequences.STRINGABLE, Token.TYPES.WORD, Token.TYPES.FUNCTION, Token.TYPES.MACRO];
        const [lhs, operator, rhs] = this.base.parseTypesInOrder([types, [Token.TYPES.OPERATOR], types], pragma.token);

        return [lhs, operator, rhs];
    }

    private resolveIfElseExpression(expression: Token.Sequences.IF_ELSE_EXPRESSION) {
        const [lhs, operator, rhs] = expression;

        let lhsVal: any = lhs.parsedValue ?? lhs.token.value;
        let rhsVal: any = rhs.parsedValue ?? rhs.token.value;

        if (Token.isExpectedType(lhs.token, Token.TYPES.WORD))
            lhsVal = Utils.Types.cast(lhsVal);
        if (Token.isExpectedType(rhs.token, Token.TYPES.WORD))
            rhsVal = Utils.Types.cast(rhsVal);

        if (Utils.String.isNumber(lhsVal)) lhsVal = +lhsVal;
        if (Utils.String.isNumber(rhsVal)) rhsVal = +rhsVal;

        if (Token.isExpectedType(operator.token, 'Operator_eq'))
            return Utils.Assert.equals(lhsVal, rhsVal);
        else if (Token.isExpectedType(operator.token, 'Operator_ie'))
            return Utils.Assert.equals(lhsVal, rhsVal, false);
        else if (Token.isExpectedType(operator.token, 'Operator_ne'))
            return !Utils.Assert.equals(lhsVal, rhsVal);
        else if (Token.isExpectedType(operator.token, 'Operator_gt'))
            return lhsVal > rhsVal;
        else if (Token.isExpectedType(operator.token, 'Operator_ge'))
            return lhsVal >= rhsVal;
        else if (Token.isExpectedType(operator.token, 'Operator_lt'))
            return lhsVal < rhsVal;
        else if (Token.isExpectedType(operator.token, 'Operator_le'))
            return lhsVal <= rhsVal;
        else if (Token.isExpectedType(operator.token, 'Operator_contains'))
            return Utils.Assert.contains(rhsVal, lhsVal);
        else if (Token.isExpectedType(operator.token, 'Operator_icontains'))
            return Utils.Assert.contains(rhsVal, lhsVal, false);
        else if (Token.isExpectedType(operator.token, 'Operator_starts'))
            return lhsVal.toString().startsWith(rhsVal.toString())
        else if (Token.isExpectedType(operator.token, 'Operator_istarts'))
            return Utils.String.lowercase(lhsVal).startsWith(Utils.String.lowercase(rhsVal))
        else if (Token.isExpectedType(operator.token, 'Operator_ends'))
            return lhsVal.toString().endsWith(rhsVal.toString())
        else if (Token.isExpectedType(operator.token, 'Operator_iends'))
            return Utils.String.lowercase(lhsVal).endsWith(Utils.String.lowercase(rhsVal))
        else if (Token.isOneOfExpectedTypes(operator.token, ['Operator_match', 'Operator_imatch'])) {
            const flags = Token.isExpectedType(operator.token, 'Operator_imatch') ? 'i' : '';
            return Utils.Regex.testMatchViaUserPattern(lhsVal.toString(), rhs, flags);
        }

        throw new FTHTMLExceptions.Parser('Unexpected operator', operator.token);
    }

    private parseElseIfElseBlock(pragma: FTHTMLElement, parent: FTHTMLElement) {
        this.base.shouldOmit = false;
        if (pragma.token.value === 'elif') {
            const expr = this.getIfElseExpression(pragma);
            const elifBlock = this.parseIfBlock(pragma, expr, parent);
            return new FTHTMLElement(pragma.token, parent.parsedValue, elifBlock);
        }

        const children = this.base.parseWhileType(Token.Sequences.TOP_LEVEL, ['Pragma_end'], (elements: FTHTMLElement[], error: boolean) => {
            if (error)
                throw new FTHTMLExceptions.Parser.IncompleteElement(pragma.token, `an '#end' pragma keyword for starting pragma '${pragma.token.value}' but none found`);
            return elements;
        })
        return new FTHTMLElement(pragma.token, HTMLBuilder.build(children), children);
    }

    private parseIfBlock(pragma: FTHTMLElement, expression: Token.Sequences.IF_ELSE_EXPRESSION, parent: FTHTMLElement) {
        const prevState = this.shouldOmit;
        const isExprResolvedToTrue = this.resolveIfElseExpression(expression) && !this.hasTrueStatement;

        if (isExprResolvedToTrue) this.hasTrueStatement = true;

        if (!isExprResolvedToTrue)
            this.base.shouldOmit = true;
        const children = this.base.parseWhileType(Token.Sequences.TOP_LEVEL, ['Pragma_end', 'Pragma_else', 'Pragma_elif'], (elements: FTHTMLElement[], error: boolean) => {
            if (error)
                throw new FTHTMLExceptions.Parser.IncompleteElement(pragma.token, `an '#end' pragma keyword for starting pragma '${pragma.token.value}' but none found`);
            if (Token.isOneOfExpectedTypes(this.peek, ['Pragma_else', 'Pragma_elif'])) {
                const subpragma = this.parseElseIfElseBlock(new FTHTMLElement(this.consume()), parent);
                parent.children.unshift(subpragma);

                if (!isExprResolvedToTrue)
                    parent.parsedValue = subpragma.parsedValue;
            }
            return elements;
        })

        if (isExprResolvedToTrue)
            parent.parsedValue = HTMLBuilder.build(children);
        this.base.shouldOmit = prevState;
        children.splice(0, 0, ...expression);
        return children;
    }

}