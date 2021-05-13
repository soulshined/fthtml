import { FTHTMLFunctionArgument, AbstractFunction } from "./functions/abstract";
import { AddSlashes } from "./functions/addslashes";
import { Choose } from "./functions/choose";
import { HTMLEncoder } from "./functions/html_encoder";
import { Join } from "./functions/join";
import { Keys } from "./functions/keys";
import { Len } from "./functions/len";
import { Random } from "./functions/random";
import { Range } from "./functions/range";
import { Replace } from "./functions/replace";
import { Sort } from "./functions/sort";
import { StrFormat } from "./functions/str_format";
import { StrRepeat } from "./functions/str_repeat";
import { StrReverse } from "./functions/str_reverse";
import { StrSplit } from "./functions/str_split";
import { Substring } from "./functions/substring";
import { Tcase } from "./functions/tcase";
import { Trim } from "./functions/trim";
import { Values } from "./functions/values";

export namespace FTHTMLFunction {

    export type Argument = FTHTMLFunctionArgument;

    export const ALL: { [key: string]: AbstractFunction } = {
        addslashes: new AddSlashes,
        choose: new Choose,
        html_encode: new HTMLEncoder.Encode,
        html_decode: new HTMLEncoder.Decode,
        join: new Join,
        keys: new Keys,
        len: new Len,
        range: new Range,
        random: new Random,
        replace: new Replace,
        sort: new Sort,
        str_repeat: new StrRepeat,
        str_reverse: new StrReverse,
        str_split: new StrSplit,
        str_format: new StrFormat,
        substring: new Substring,
        tcase: new Tcase,
        trim: new Trim,
        values: new Values
    };
}