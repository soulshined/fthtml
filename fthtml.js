(function () {
  const Parser = require('./fthtml-parser.js');

  function makeftHTML() {
    return ({
      compile: function (src) {
        let parser = new Parser.Parser;
        return parser.compile(src);
      },
      renderFile: function (file) {
        console.time('parser');
        let parser = new Parser.Parser;
        return parser.renderFile(file);
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