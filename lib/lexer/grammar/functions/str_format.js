"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
            return { value, error: true, msg: error.message };
        }
    }
    static asDate(value, options) {
        try {
            const locale = options['locale'] || 'default';
            delete options['locale'];
            return {
                value: Intl.DateTimeFormat(locale, options).format(new Date(Date.parse(value))), error: false
            };
        }
        catch (error) {
            return { value, error: true, msg: error.message };
        }
    }
    static asNumber(value, formattype, options) {
        if (Number.isNaN(+value))
            return { value, error: true, msg: `Value '${value}' is not a number` };
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
            return { value: Intl.NumberFormat([options['locale'], 'en-US'], options).format(value), error: false };
        }
        catch (error) {
            return { value, error: true, msg: error.message };
        }
    }
}
exports.StringFormatter = StringFormatter;
//# sourceMappingURL=str_format.js.map