"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const he_1 = require("he");
const abstract_1 = require("./abstract");
var HTMLEncoder;
(function (HTMLEncoder) {
    class Encode extends abstract_1.AbstractFunction {
        constructor() {
            super(false);
            this._argPatterns = [
                {
                    types: [
                        "String",
                        "Variable",
                        "Literal Variable",
                        "Function"
                    ],
                    name: 'value'
                }
            ];
        }
        do(html) {
            return new abstract_1.Result(he_1.encode(`${html}`));
        }
    }
    HTMLEncoder.Encode = Encode;
    class Decode extends abstract_1.AbstractFunction {
        constructor() {
            super(false);
            this._argPatterns = [
                {
                    types: [
                        "String",
                        "Variable",
                        "Literal Variable",
                        "Function"
                    ],
                    name: 'value'
                }
            ];
        }
        do(html) {
            return new abstract_1.Result(he_1.decode(`${html}`));
        }
    }
    HTMLEncoder.Decode = Decode;
})(HTMLEncoder = exports.HTMLEncoder || (exports.HTMLEncoder = {}));
//# sourceMappingURL=html_encoder.js.map