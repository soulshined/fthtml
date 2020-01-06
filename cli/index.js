"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const minimist = require("minimist");
const version_1 = require("./cmds/version");
const help_1 = require("./cmds/help");
const convert_1 = require("./cmds/convert");
const error_1 = require("./utils/error");
function cli() {
    const args = minimist(process.argv.slice(2), {
        string: ['covert', 'dest'],
        boolean: ['version', 'keep-tree', 'test'],
        alias: {
            d: 'dest', e: 'exclude',
            k: 'keep-tree',
            p: 'pretty',
            t: 'test',
            v: 'version'
        },
        '--': true
    });
    let cmd = args._[0] || 'help';
    if (args.version || args.v)
        cmd = 'version';
    if (args.help || args.h)
        cmd = 'help';
    switch (cmd) {
        case 'version':
            version_1.default();
            break;
        case 'help':
            help_1.default(args);
            break;
        case 'convert':
            convert_1.default(args);
            break;
        default:
            error_1.default(`"${cmd}" is not a valid command`);
            break;
    }
}
exports.default = cli();
