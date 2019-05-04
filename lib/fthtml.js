(function () {
  const ftHTMLParser = require('./fthtml-parser.js');

  function makeftHTML() {
    return ({
      compile: function (src) {
        return (new ftHTMLParser.Parser).compile(src);
      },
      renderFile: function (file) {
        return (new ftHTMLParser.Parser).renderFile(file);
      }
    });
  }

  module.exports = makeftHTML();
})();