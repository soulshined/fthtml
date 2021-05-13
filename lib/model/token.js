"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../lexer/grammar/index");
const operators_1 = require("./operators");
const fthtml_exceptions_1 = require("./exceptions/fthtml-exceptions");
var ABSTRACT_TOKEN_TYPES;
(function (ABSTRACT_TOKEN_TYPES) {
    ABSTRACT_TOKEN_TYPES["STRING"] = "String";
    ABSTRACT_TOKEN_TYPES["WORD"] = "Word";
})(ABSTRACT_TOKEN_TYPES = exports.ABSTRACT_TOKEN_TYPES || (exports.ABSTRACT_TOKEN_TYPES = {}));
class AbstractToken {
    constructor(value, position, delimiter) {
        this._value = value;
        this._position = position;
        this._position.end = position.column + value.length;
        this._delimiter = delimiter;
    }
    get value() {
        return this._value;
    }
    set value(v) {
        this._value = v;
    }
    get position() {
        return this._position;
    }
    get delimiter() {
        return this._delimiter;
    }
}
exports.AbstractToken = AbstractToken;
class Token extends AbstractToken {
    constructor(type, value, position, delimiter) {
        super(value, position, delimiter);
        this._type = type;
        if (['Variable', 'Literal Variable'].includes(type.toString()))
            this.position.end++;
        else if (type === 'String') {
            this.position.end += 2;
        }
        ;
    }
    get type() {
        return this._type;
    }
    clone() {
        return new Token(this.type, this.value, this.position, this.delimiter);
    }
}
exports.Token = Token;
(function (Token) {
    let TYPES;
    (function (TYPES) {
        TYPES["ATTR_CLASS"] = "Attr_Class";
        TYPES["ATTR_CLASS_VAR"] = "Attr_Class_Var";
        TYPES["ATTR_CLASS_LITERAL_VAR"] = "Attr_Class_Literal_Var";
        TYPES["ATTR_ID"] = "Attr_Id";
        TYPES["COMMENT"] = "Comment";
        TYPES["COMMENTB"] = "Block Comment";
        TYPES["ELANG"] = "ELang";
        TYPES["ELANGB"] = "ElangB";
        TYPES["FUNCTION"] = "Function";
        TYPES["MACRO"] = "Macro";
        TYPES["KEYWORD"] = "Keyword";
        TYPES["KEYWORD_DOCTYPE"] = "Keyword_Doctype";
        TYPES["OPERATOR"] = "Operator";
        TYPES["PRAGMA"] = "Pragma";
        TYPES["STRING"] = "String";
        TYPES["SYMBOL"] = "Symbol";
        TYPES["LITERAL_VARIABLE"] = "Literal Variable";
        TYPES["VARIABLE"] = "Variable";
        TYPES["WORD"] = "Word";
    })(TYPES = Token.TYPES || (Token.TYPES = {}));
    ;
    function getTypeForIdentifier(identifier) {
        if (~index_1.default.keywords.indexOf(identifier)) {
            if (identifier == 'doctype')
                return "Keyword_Doctype";
            return "Keyword";
        }
        else if (index_1.default.elangs[identifier])
            return "ELang";
        else if (~index_1.default.pragmas.indexOf(identifier))
            return "Pragma";
        else if (index_1.default.functions[identifier])
            return "Function";
        else if (index_1.default.macros[identifier])
            return "Macro";
        else if (~index_1.default.operators.indexOf(identifier))
            return "Operator";
        else
            return "Word";
    }
    Token.getTypeForIdentifier = getTypeForIdentifier;
    function joinTypes(types) {
        const result = types.map(m => m.startsWith('Function_') ? `${m.substring(9)}()` : m);
        result.sort();
        return result.join(", ");
    }
    Token.joinTypes = joinTypes;
    let Position;
    (function (Position) {
        function create(line, column) {
            return {
                line,
                column,
                end: column + 1
            };
        }
        Position.create = create;
    })(Position = Token.Position || (Token.Position = {}));
    let Sequences;
    (function (Sequences) {
        Sequences.COMMENTS = ["Comment", "Block Comment"];
        Sequences.VARIABLE = ["Variable", "Literal Variable"];
        Sequences.STRINGABLE = ["String", ...Sequences.VARIABLE];
        Sequences.ORDERED = [...Token.Sequences.STRINGABLE, "ELang", "Macro", "Function", "Keyword"];
        Sequences.CHILDREN_NO_PRAGMA = ["Word", "ELang", "Keyword", "Function", "Macro", ...Sequences.STRINGABLE, ...Sequences.COMMENTS];
        Sequences.CHILDREN = [...Sequences.CHILDREN_NO_PRAGMA, "Pragma"];
        Sequences.TOP_LEVEL = ["Word", "ELang", "Function", "Macro", "Pragma", "Keyword", ...Sequences.VARIABLE, ...Sequences.COMMENTS];
        Sequences.OPERATORS = operators_1.Operator.TYPES.getAllTypes();
    })(Sequences = Token.Sequences || (Token.Sequences = {}));
    function isExpectedType(actual, expected) {
        return actual && (actual.type === expected || `${actual.type}_${actual.value}` === expected);
    }
    Token.isExpectedType = isExpectedType;
    function isOneOfExpectedTypes(actual, expected) {
        return actual && (expected.includes(actual.type) || expected.includes(`${actual.type}_${actual.value}`));
    }
    Token.isOneOfExpectedTypes = isOneOfExpectedTypes;
    function evaluate(token) {
        if (!/^[\w-]+$/.test(token.value))
            throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.InvalidElementName(token, `the following pattern: [\w-]+`);
        if (Token.isExpectedType(token, 'Word_this'))
            throw new fthtml_exceptions_1.FTHTMLExceptions.Parser.InvalidElementName(token, `a valid word. Words can not be reserved keywords, '${token.value}' is a reserved keyword`);
    }
    Token.evaluate = evaluate;
})(Token = exports.Token || (exports.Token = {}));
//# sourceMappingURL=token.js.map