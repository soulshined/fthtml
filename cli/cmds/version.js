(function () {
    const cli = require('../package.json').version;
    const fthtml = require('../../package.json').version;

    require('../utils/branding')();
    module.exports = () => console.log(`ftHTML v${fthtml}\nftHTML-cli v${cli}`);
})();