"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const branding_1 = require("../utils/branding");
const menus = {
    main: `
    fthtml-cli <command> <options>

    convert ............ convert a directory of .fthtml files to html
    help ............... show help menu for a command
    version ............ show package version
  `,
    convert: `
    fthtml-cli convert <options>

    -d <path> | --dest <path>....................... the dir to write converted files to (default same dir)
    -e <dir> | --exclude <dir> | -e -- <dirs>....... exclude directories
    -k | --keep-tree ............................... keep tree structure (default false)
    -p | --pretty .................................. display unminified version (default false)
  `
};
function default_1(args) {
    const cmd = args._[0] === 'help' ? args._[1] : args._[0];
    branding_1.default();
    console.log(menus[cmd] || menus.main);
}
exports.default = default_1;
//# sourceMappingURL=help.js.map