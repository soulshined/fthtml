import { funcrules, TOKEN_TYPE as TT } from "../../../lib/lexer/types";
import { decode, encode } from "he";

const func = (argsSequenceStrict: boolean, argPatterns: {
    type: TT[];
    name: string;
    possibleValues?: string[];
    isRestParameter?: boolean;
    isOptional?: boolean;
    default?: any;
}[], func: (...values: any[]) => { value: any, error: boolean, msg?: string }): funcrules => {
    return {
        argsSequenceStrict,
        argPatterns,
        do: func
    }
}

const functions: { [key: string]: funcrules } = {
    addslashes: func(false, [
        { type: [TT.STRING, TT.VARIABLE, TT.FUNCTION, TT.MACRO], name: 'value' }
    ], (value: string) => {
        return { value: (`${value}`).replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0'), error: false }
    }),
    choose: func(false, [
        { type: [TT.STRING, TT.VARIABLE, TT.WORD, TT.FUNCTION, TT.MACRO], name: 'value', isRestParameter: true }
    ], (...values) => {
        return { value: values[Math.floor(Math.random() * values.length)], error: false };
    }),
    html_encode: func(false, [
        { type: [TT.STRING, TT.VARIABLE, TT.FUNCTION], name: 'value' }
    ], (html: string) => {
        return { value: encode(`${html}`), error: false };
    }),
    html_decode: func(false, [
        { type: [TT.STRING, TT.VARIABLE, TT.FUNCTION], name: 'value' }
    ], (html: string) => {
        return { value: decode(`${html}`), error: false };
    }),
    random: func(false, [
        { type: [TT.STRING, TT.VARIABLE, TT.WORD, TT.FUNCTION], name: 'min' },
        { type: [TT.STRING, TT.VARIABLE, TT.WORD, TT.FUNCTION], name: 'max' }
    ], (min: number, max: number) => {
        if (!Number.isSafeInteger(+min))
            return { value: min, error: true, msg: 'Min range value is not a valid number' };

        if (!Number.isSafeInteger(+max))
            return { value: max, error: true, msg: 'Max range value is not a valid number' };

        min = +min, max = +max;

        if (max < min || min > max)
            return { value: '', error: true, msg: 'Range is invalid' }
        return { value: ~~(Math.random() * (max - min + 1) + min), error: false };
    }),
    replace: func(true, [
        { type: [TT.STRING, TT.VARIABLE, TT.FUNCTION, TT.MACRO], name: 'value' },
        { type: [TT.STRING], name: 'pattern' },
        { type: [TT.STRING, TT.VARIABLE, TT.FUNCTION], name: 'replace' }
    ], (value: string, pattern: string, replace: string) => {
        value = `${value}`;

        try {
            const regx = new RegExp(pattern, 'g');

            return { value: value.replace(regx, replace), error: false };
        } catch (error) {
            return { value: value, error: true, msg: error.message };
        }
    }),
    str_repeat: func(true, [
        { type: [TT.STRING, TT.VARIABLE, TT.FUNCTION, TT.MACRO], name: 'value' },
        { type: [TT.STRING, TT.WORD], name: 'quantity' }
    ], (value: string, quantity: number) => {
        value = `${value}`;

        if (!Number.isSafeInteger(+quantity))
            return { value, error: true, msg: 'Repeat quantity is not a valid number' };

        return { value: value.repeat(Math.max(+quantity + 1, 1)), error: false };
    }),
    str_reverse: func(true, [
        { type: [TT.STRING, TT.VARIABLE, TT.FUNCTION, TT.MACRO], name: 'value' },
    ], (value: string) => {
        return { value: (`${value}`).split('').reverse().join(''), error: false };
    }),
    str_format: func(true, [
        { type: [TT.STRING, TT.VARIABLE, TT.FUNCTION], name: 'value' },
        { type: [TT.STRING], name: 'style', possibleValues: ['currency', 'number', 'unit', 'percent', 'decimal'] },
        { type: [TT.STRING], name: 'options', isOptional: true }
    ], (value: number, formattype: string, opts = '') => {
        if (Number.isNaN(+value))
            return { value, error: true, msg: `Value '${value}' is not a number` };

        value = +value;
        try {
            opts = opts.split(",")
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
        } catch (error) {
            return { value, error: true, msg: error.message };
        }
        opts['style'] = formattype.toLowerCase();
        opts['locale'] = opts['locale'] || 'en-US';

        switch (formattype.toLowerCase()) {
            case 'currency':
                opts['currency'] = opts['currency'] || 'USD';
                break;
            case 'number':
                delete opts['style'];
                break;
        }

        try {
            return { value: Intl.NumberFormat([opts.locale, 'en-US'], opts).format(value), error: false };
        } catch (error) {
            return { value, error: true, msg: error.message };
        }
    }),
    substring: func(true, [
        { type: [TT.STRING, TT.VARIABLE, TT.FUNCTION, TT.MACRO], name: 'value' },
        { type: [TT.STRING, TT.VARIABLE, TT.WORD], name: 'start' },
        { type: [TT.STRING, TT.VARIABLE, TT.WORD], name: 'end', isOptional: true }
    ], (value: string, start: number, end: number) => {
        value = String.raw`${value}`;

        if (!Number.isSafeInteger(+start))
            return { value: start, error: true, msg: 'Start range value is not a valid number' };

        if (!Number.isSafeInteger(+end))
            end = value.length;

        start = +start, end = +end;
        let result = value;

        if (start < 0) {
            if (end < 0 && end <= start)
                result = value.substring(Math.max(value.length + start, 0), value.length);
            else if (end < 0 && end >= start)
                result = value.substring(Math.max(value.length + start, 0), Math.max(start, value.length + end));
            else if (end < Math.max(value.length + start, 0))
                result = value.substring(Math.max(value.length + start, 0));
            else
                result = value.substring(Math.max(value.length + start, 0), end)

            return { value: result, error: false }
        }

        if (end < start && end >= 0 ||
            end < 0 && value.length + end <= start) {
            result = value.substring(start);
        }
        else if (end < 0)
            result = value.substring(start, Math.max(value.length + end, start))
        else result = value.substring(start, end);

        return { value: result, error: false }
    }),
    tcase: func(true, [
        { type: [TT.STRING, TT.VARIABLE, TT.FUNCTION, TT.MACRO], name: 'value' },
        { type: [TT.STRING], name: 'text case', possibleValues: ['capitalization', 'upper', 'lower', 'alternating', 'title', 'snake', 'kebab', 'camel', 'pascal'] }
    ], (value: string, tcase: string) => {
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
                    if (v.length > 3) return v.charAt(0).toUpperCase() + v.substring(1);
                    else return v.toLowerCase();
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
                        else return char.toLowerCase();
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
        return { value: result, error: false }
    }),
    trim: func(true, [
        { type: [TT.STRING, TT.VARIABLE, TT.FUNCTION, TT.MACRO], name: 'value' },
        { type: [TT.STRING], name: 'trim style', possibleValues: ['left', 'right', 'start', 'end'], default: 'trim', isOptional: true }
    ], (value: string, trimtype: string) => {
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
        return { value: result, error: false }
    })
};

export default functions;