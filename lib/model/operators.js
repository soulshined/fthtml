"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Operator;
(function (Operator) {
    let TYPES;
    (function (TYPES) {
        TYPES["EQ"] = "eq";
        TYPES["NE"] = "ne";
        TYPES["GT"] = "gt";
        TYPES["GE"] = "ge";
        TYPES["LT"] = "lt";
        TYPES["LE"] = "le";
        TYPES["IE"] = "ie";
        TYPES["CONTAINS"] = "contains";
        TYPES["ICONTAINS"] = "icontains";
        TYPES["ISTARTS"] = "istarts";
        TYPES["STARTS"] = "starts";
        TYPES["IENDS"] = "iends";
        TYPES["ENDS"] = "ends";
        TYPES["MATCH"] = "match";
        TYPES["IMATCH"] = "imatch";
    })(TYPES = Operator.TYPES || (Operator.TYPES = {}));
    ;
    (function (TYPES) {
        function getAllTypes() {
            const types = [];
            Object.keys(TYPES).forEach(key => {
                if (typeof TYPES[key] === 'string')
                    types.push(TYPES[key]);
            });
            return types;
        }
        TYPES.getAllTypes = getAllTypes;
    })(TYPES = Operator.TYPES || (Operator.TYPES = {}));
})(Operator = exports.Operator || (exports.Operator = {}));
//# sourceMappingURL=operators.js.map