const minimist = require('minimist');
const error = require('./utils/error');

module.exports = () => {
    const args = minimist(process.argv.slice(2), {
        string: ['convert', 'dest'],
        boolean: ['version', 'keep-tree', 'test'],
        alias: {
            d: 'dest',
            e: 'exclude',
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
            require('./cmds/version')();
            break;
        case 'convert':
            require('./cmds/convert')(args);
            break;
        case 'help':
            require('./cmds/help')(args);
            break;
        default:
            error(`"${cmd}" is not a valid command`);
            break;
    }
}