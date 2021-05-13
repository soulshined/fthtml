"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const abstract_1 = require("./abstract");
class StrFormat extends abstract_1.AbstractFunction {
    constructor() {
        super(true);
        this._argPatterns = [
            {
                types: [
                    "String",
                    "Variable",
                    "Literal Variable",
                    "Function"
                ],
                name: 'value'
            },
            {
                types: ["String"],
                name: 'style',
                enum: ['currency', 'number', 'unit', 'percent', 'decimal', 'date']
            },
            {
                types: ["String"],
                name: 'options',
                isOptional: true
            }
        ];
    }
    do(value, formattype, opts = '') {
        return StringFormatter.format(value, formattype, opts);
    }
}
exports.StrFormat = StrFormat;
class StringFormatter {
    static format(value, formattype, options) {
        try {
            let opts = options.split(",")
                .map(m => {
                if (m.trim() === '')
                    return;
                let split = m.split(':');
                if (split.length < 2)
                    return;
                if (!split[0].startsWith('"') && !split[0].endsWith('"'))
                    split[0] = `\"${split[0].trim()}\"`;
                if (!split[1].startsWith('"') && !split[1].endsWith('"'))
                    split[1] = `\"${split[1].trim()}\"`;
                return split.join(":");
            });
            opts = JSON.parse(`{${opts}}`);
            if (formattype.toLocaleLowerCase() === 'date')
                return StringFormatter.asDate(value, opts);
            else
                return StringFormatter.asNumber(value, formattype, opts);
        }
        catch (error) {
            return new abstract_1.Result(value, true, error.message);
        }
    }
    static asDate(value, options) {
        try {
            const locale = options['locale'] || 'default';
            delete options['locale'];
            return new abstract_1.Result(Intl.DateTimeFormat(locale, options).format(new Date(Date.parse(value))));
        }
        catch (error) {
            return new abstract_1.Result(value, true, error.message);
        }
    }
    static asNumber(value, formattype, options) {
        if (Number.isNaN(+value))
            return new abstract_1.Result(value, true, `Value '${value}' is not a number`);
        value = +value;
        options['style'] = formattype.toLowerCase();
        options['locale'] = options['locale'] || 'en-US';
        switch (formattype.toLowerCase()) {
            case 'currency':
                options['currency'] = options['currency'] || 'USD';
                break;
            case 'number':
                delete options['style'];
                break;
        }
        try {
            return new abstract_1.Result(Intl.NumberFormat([options['locale'], 'en-US'], options).format(value));
        }
        catch (error) {
            return new abstract_1.Result(value, true, error.message);
        }
    }
}
//# sourceMappingURL=str_format.js.map