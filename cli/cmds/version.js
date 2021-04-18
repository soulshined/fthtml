"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const branding_1 = require("../utils/branding");
function default_1() {
    const fthtml = require('../../package.json').version;
    const cli = require('../package.json').version;
    branding_1.default();
    console.log(`ftHTML v${fthtml}\nftHTML-cli v${cli}`);
}
exports.default = default_1;
//# sourceMappingURL=version.js.map