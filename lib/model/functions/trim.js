"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const abstract_1 = require("./abstract");
class Trim extends abstract_1.AbstractFunction {
    constructor() {
        super(true);
        this._argPatterns = [
            {
                types: [
                    "String",
                    "Variable",
                    "Literal Variable",
                    "Function",
                    "Macro"
                ],
                name: 'value'
            },
            { types: ["String"], name: 'trim style', enum: ['left', 'right', 'start', 'end'], default: 'trim', isOptional: true }
        ];
    }
    do(value, trimtype) {
        value = `${value}`, trimtype = trimtype || 'trim';
        let result = value;
        switch (trimtype.toLowerCase()) {
            case 'left':
                result = value.trimLeft();
                break;
            case 'right':
                result = value.trimRight();
                break;
            case 'start':
                result = value.trimStart();
                break;
            case 'end':
                result = value.trimEnd();
                break;
            default:
                result = value.trim();
                break;
        }
        return new abstract_1.Result(result);
    }
}
exports.Trim = Trim;
//# sourceMappingURL=trim.js.map