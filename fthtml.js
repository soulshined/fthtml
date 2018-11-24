(function () {
  const Parser = require('./fthtml-parser.js');

  function makeftHTML() {
    return ({
      compile: function (src) {
        return (new Parser.Parser).compile(src);
      },
      renderFile: function (file) {
        return (new Parser.Parser).renderFile(file);
      }
    });
  }

  if (typeof module !== 'undefined' && 'exports' in module) {
    module.exports = makeftHTML();
  }
  else {
    this.fthtml = makeftHTML();
  }
})();