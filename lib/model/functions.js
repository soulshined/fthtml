"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const addslashes_1 = require("./functions/addslashes");
const choose_1 = require("./functions/choose");
const html_encoder_1 = require("./functions/html_encoder");
const join_1 = require("./functions/join");
const keys_1 = require("./functions/keys");
const len_1 = require("./functions/len");
const random_1 = require("./functions/random");
const range_1 = require("./functions/range");
const replace_1 = require("./functions/replace");
const sort_1 = require("./functions/sort");
const str_format_1 = require("./functions/str_format");
const str_repeat_1 = require("./functions/str_repeat");
const str_reverse_1 = require("./functions/str_reverse");
const str_split_1 = require("./functions/str_split");
const substring_1 = require("./functions/substring");
const tcase_1 = require("./functions/tcase");
const trim_1 = require("./functions/trim");
const values_1 = require("./functions/values");
const fallback_1 = require("./functions/fallback");
var FTHTMLFunction;
(function (FTHTMLFunction) {
    FTHTMLFunction.ALL = {
        addslashes: new addslashes_1.AddSlashes,
        choose: new choose_1.Choose,
        html_encode: new html_encoder_1.HTMLEncoder.Encode,
        html_decode: new html_encoder_1.HTMLEncoder.Decode,
        join: new join_1.Join,
        keys: new keys_1.Keys,
        len: new len_1.Len,
        range: new range_1.Range,
        random: new random_1.Random,
        replace: new replace_1.Replace,
        sort: new sort_1.Sort,
        str_repeat: new str_repeat_1.StrRepeat,
        str_reverse: new str_reverse_1.StrReverse,
        str_split: new str_split_1.StrSplit,
        str_format: new str_format_1.StrFormat,
        substring: new substring_1.Substring,
        tcase: new tcase_1.Tcase,
        trim: new trim_1.Trim,
        values: new values_1.Values,
        fallback: new fallback_1.Fallback
    };
})(FTHTMLFunction = exports.FTHTMLFunction || (exports.FTHTMLFunction = {}));
//# sourceMappingURL=functions.js.map