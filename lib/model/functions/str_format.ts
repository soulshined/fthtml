import { AbstractFunction, Result } from "./abstract";
import { Token } from "../token";

export class StrFormat extends AbstractFunction {
    constructor() {
        super(true);

        this._argPatterns = [
            {
                types: [
                    Token.TYPES.STRING,
                    Token.TYPES.VARIABLE,
                    Token.TYPES.LITERAL_VARIABLE,
                    Token.TYPES.FUNCTION
                ],
                name: 'value'
            },
            {
                types: [Token.TYPES.STRING],
                name: 'style',
                enum: ['currency', 'number', 'unit', 'percent', 'decimal', 'date']
            },
            {
                types: [Token.TYPES.STRING],
                name: 'options',
                isOptional: true
            }
        ];

    }

    do(value: any, formattype: string, opts = '') {
        return StringFormatter.format(value, formattype, opts);
    }
}


class StringFormatter {

    static format(value: any, formattype: string, options: string): Result {
        try {
            let opts = options.split(",")
                .map(m => {
                    if (m.trim() === '') return;
                    let split = m.split(':');
                    if (split.length < 2) return;
                    if (!split[0].startsWith('"') && !split[0].endsWith('"'))
                        split[0] = `\"${split[0].trim()}\"`;
                    if (!split[1].startsWith('"') && !split[1].endsWith('"'))
                        split[1] = `\"${split[1].trim()}\"`;

                    return split.join(":");
                });

            opts = JSON.parse(`{${opts}}`);

            if (formattype.toLocaleLowerCase() === 'date')
                return StringFormatter.asDate(value, opts);
            else return StringFormatter.asNumber(value, formattype, opts);
        } catch (error) {
            return new Result(value, true, error.message);
        }
    }

    private static asDate(value: string, options: object) {
        try {
            const locale = options['locale'] || 'default';
            delete options['locale'];

            return new Result(
                Intl.DateTimeFormat(locale, options).format(new Date(Date.parse(value)))
            )
        } catch (error) {
            return new Result(value, true, error.message);
        }
    }

    private static asNumber(value: any, formattype: string, options: object) {
        if (Number.isNaN(+value))
            return new Result(value, true, `Value '${value}' is not a number`);

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
            return new Result(Intl.NumberFormat([options['locale'], 'en-US'], options).format(value));
        } catch (error) {
            return new Result(value, true, error.message);
        }
    }
}