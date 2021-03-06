"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const abstract_1 = require("./abstract");
class Tcase extends abstract_1.AbstractFunction {
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
            {
                types: ["String"],
                name: 'text case',
                enum: ['capitalization', 'upper', 'lower', 'alternating', 'title', 'snake', 'kebab', 'camel', 'pascal']
            }
        ];
    }
    do(value, tcase) {
        value = `${value}`;
        let result = value;
        switch (tcase.toLowerCase()) {
            case 'upper':
                result = value.toUpperCase();
                break;
            case 'lower':
                result = value.toLowerCase();
                break;
            case 'capitalization':
                result = value.split(" ").map(v => v.charAt(0).toUpperCase() + v.substring(1).toLowerCase()).join(" ");
                break;
            case 'title':
                result = value.split(" ").map(v => {
                    if (v.length > 3)
                        return v.charAt(0).toUpperCase() + v.substring(1);
                    else
                        return v.toLowerCase();
                }).join(" ");
                break;
            case 'alternating':
                let char_count = 0;
                result = value.split('').map((char) => {
                    const charCode = char.charCodeAt(0);
                    if (charCode >= 65 && charCode <= 90 ||
                        charCode >= 97 && charCode <= 122) {
                        if (char_count++ % 2 === 0)
                            return char.toUpperCase();
                        else
                            return char.toLowerCase();
                    }
                    return char;
                }).join('');
                break;
            case 'snake':
            case 'kebab':
                const delimiter = tcase === 'snake' ? '_' : '-';
                result = value.replace(/\W/g, ' ').replace(/[ ]+/g, ' ').split(' ').join(delimiter);
                break;
            case 'camel':
            case 'pascal':
                let [firstWord, ...words] = value.split(' ');
                firstWord = firstWord.charAt(0).toLowerCase() + firstWord.substring(1);
                if (tcase === 'pascal')
                    firstWord = firstWord.charAt(0).toUpperCase() + firstWord.substring(1);
                result = firstWord + words.map(w => {
                    return w.charAt(0).toUpperCase() + w.substring(1).toLowerCase();
                }).join('');
                break;
        }
        return new abstract_1.Result(result);
    }
}
exports.Tcase = Tcase;
//# sourceMappingURL=tcase.js.map