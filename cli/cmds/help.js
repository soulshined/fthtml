(function () {
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
  }

  module.exports = (args) => {
    const cmd = args._[0] === 'help' ? args._[1] : args._[0];

    require('../utils/branding')();
    console.log(menus[cmd] || menus.main);
  }

})();