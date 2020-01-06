import { default as branding } from "../utils/branding";

export default function () {
    const fthtml = require('../../package.json').version;
    const cli = require('../package.json').version;
    branding();
    console.log(`ftHTML v${fthtml}\nftHTML-cli v${cli}`);
}