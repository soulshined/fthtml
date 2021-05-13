"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fthtml_exceptions_1 = require("../../../model/exceptions/fthtml-exceptions");
const fthtmlelement_1 = require("../../../model/fthtmlelement");
const html_builder_1 = require("../../../model/html-builder");
const token_1 = require("../../../model/token");
const utils_1 = require("../../../utils");
const abstract_1 = require("./abstract");
class PragmaIfElse extends abstract_1.AbstractPragma {
    constructor() {
        super(...arguments);
        this.hasTrueStatement = false;
    }
    parse(pragma, parent) {
        this.throwIfEOF(new fthtml_exceptions_1.FTHTMLExceptions.Parser.IncompleteElement(pragma.token, `a valid comparator expression`));
        const ifElseBlock = this.parseIfBlock(pragma, this.getIfElseExpression(pragma), parent);
        pragma.childrenEnd = this.consume().position;
        parent.children.unshift(new fthtmlelement_1.FTHTMLElement(pragma.token, html_builder_1.HTMLBuilder.build(ifElseBlock.slice(3)), ifElseBlock));
        this._value = parent.children;
    }
    getIfElseExpression(pragma) {
        const types = [...token_1.Token.Sequences.STRINGABLE, "Word", "Function", "Macro"];
        const [lhs, operator, rhs] = this.base.parseTypesInOrder([types, ["Operator"], types], pragma.token);
        return [lhs, operator, rhs];
    }
    resolveIfElseExpression(expression) {
        var _a, _b;
        const [lhs, operator, rhs] = expression;
        let lhsVal = (_a = lhs.parsedValue, (_a !== null && _a !== void 0 ? _a : lhs.token.value));
        let rhsVal = (_b = rhs.parsedValue, (_b !== null && _b !== void 0 ? _b : rhs.token.value));
        if (token_1.Token.isExpectedType(lhs.token, "Word"))
            lhsVal = utils_1.Utils.Types.cast(lhsVal);
        if (token_1.Token.isExpectedType(rhs.token, "Word"))
            rhsVal = utils_1.Utils.Types.cast(rhsVal);
        if (utils_1.Utils.String.isNumber(lhsVal))
            lhsVal = +lhsVal;
        if (utils_1.Utils.String.isNumber(rhsVal))
            rhsVal = +rhsVal;
        if (token_1.Token.isExpectedType(operator.token, 'Operator_eq'))
            return utils_1.Utils.Assert.equals(lhsVal, rhsVal);
        else if (token_1.Token.isExpectedType(operator.token, 'Operator_ie'))
            return utils_1.Utils.Assert.equals(lhsVal, rhsVal, false);
        else if (token_1.Token.isExpectedType(operator.token, 'Operator_ne'))
            return !utils_1.Utils.Assert.equals(lhsVal, rhsVal);
        else if (token_1.Token.isExpectedType(operator.token, 'Operator_gt'))
            return lhsVal > rhsVal;
        else if (token_1.Token.isExpectedType(operator.token, 'Operator_ge'))
            return lhsVal >= rhsVal;
        else if (token_1.Token.isExpectedType(operator.token, 'Operator_lt'))
            return lhsVal < rhsVal;
        else if (token_1.Token.isExpectedType(operator.token, 'Operator_le'))
            return lhsVal <= rhsVal;
        else if (token_1.Token.isExpectedType(operator.token, 'Operator_contains'))
            return utils_1.Utils.Assert.contains(rhsVal, lhsVal);
        else if (token_1.Token.isExpectedType(operator.token, 'Operator_icontains'))
            return utils_1.Utils.Assert.contains(rhsVal, lhsVal, false);
        else if (token_1.Token.isExpectedType(operator.token, 'Operator_starts'))
            return lhsVal.toString().startsWith(rhsVal.toString());
        else if (token_1.Token.isExpectedType(operator.token, 'Operator_istarts'))
            return utils_1.Utils.String.lowercase(lhsVal).startsWith(utils_1.Utils.String.lowercase(rhsVal));
        else if (token_1.Token.isExpectedType(operator.token, 'Operator_ends'))
            return lhsVal.toString().endsWith(rhsVal.toString());
        else if (token_1.Token.isExpectedType(operator.token, 'Operator_iends'))
            return utils_1.Utils.String.lowercase(lhsVal).endsWith(utils_1.Utils.String.lowercase(rhsVal));
        else if (token_1.Token.isOneOfExpectedTypes(operator.token, ['Operator_match', 'Operator_imatch'])) {
            const flags = token_1.Token.isExpectedType(operator.token, 'Operator_imatch') ? 'i' : '';
            return utils_1.Utils.Regex.testMatchViaUserPattern(lhsVal.toString(), rhs, flags);
        }
        throw new fthtml_exceptions_1.FTHTMLExceptions.Parser('Unexpected operator', operator.token);
    }
    parseElseIfElseBlock(pragma, parent) {
        this.base.shouldOmit = false;
        if (pragma.token.value === 'elif') {
            const expr = this.getIfElseExpression(pragma);
            const elifBlock = this.parseIfBlock(pragma, expr, parent);
            return new fthtmlelement_1.FTHTMLElement(pragma.token, parent.parsedValue, elifBlock);
        }
        const children = this.base.parseWhileType(token_1.Token.Sequences.TOP_LEVEL, ['Pragma_end'], (elements, error) => {
            if (error)
                throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.IncompleteElement(pragma.token, `an '#end' pragma keyword for starting pragma '${pragma.token.value}' but none found`);
            return elements;
        });
        return new fthtmlelement_1.FTHTMLElement(pragma.token, html_builder_1.HTMLBuilder.build(children), children);
    }
    parseIfBlock(pragma, expression, parent) {
        const prevState = this.shouldOmit;
        const isExprResolvedToTrue = this.resolveIfElseExpression(expression) && !this.hasTrueStatement;
        if (isExprResolvedToTrue)
            this.hasTrueStatement = true;
        if (!isExprResolvedToTrue)
            this.base.shouldOmit = true;
        const children = this.base.parseWhileType(token_1.Token.Sequences.TOP_LEVEL, ['Pragma_end', 'Pragma_else', 'Pragma_elif'], (elements, error) => {
            if (error)
                throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.IncompleteElement(pragma.token, `an '#end' pragma keyword for starting pragma '${pragma.token.value}' but none found`);
            if (token_1.Token.isOneOfExpectedTypes(this.peek, ['Pragma_else', 'Pragma_elif'])) {
                const subpragma = this.parseElseIfElseBlock(new fthtmlelement_1.FTHTMLElement(this.consume()), parent);
                parent.children.unshift(subpragma);
                if (!isExprResolvedToTrue)
                    parent.parsedValue = subpragma.parsedValue;
            }
            return elements;
        });
        if (isExprResolvedToTrue)
            parent.parsedValue = html_builder_1.HTMLBuilder.build(children);
        this.base.shouldOmit = prevState;
        children.splice(0, 0, ...expression);
        return children;
    }
}
exports.PragmaIfElse = PragmaIfElse;
//# sourceMappingURL=ifelse.js.map