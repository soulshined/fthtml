import minimist = require('minimist');
import { default as version } from "./cmds/version";
import { default as help } from "./cmds/help";
import { default as convert } from "./cmds/convert";
import { default as error } from "./utils/error";

function cli() {
    const args = minimist(process.argv.slice(2), {
        string: ['covert', 'dest', 'config'],
        boolean: ['version', 'keep-tree', 'test', 'debug'],
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

    if (args.version || args.v) cmd = 'version';
    if (args.help || args.h) cmd = 'help';

    switch (cmd) {
        case 'version':
            version();
            break;
        case 'help':
            help(args);
            break;
        case 'convert':
            convert(args);
            break;
        default:
            error(`"${cmd}" is not a valid command`)
            break;
    }
}

export default cli();