(function() {
  const ftHTMLexer = require('./fthtml-lexer');
  const ftHTMLParser = {};

  ftHTMLParser.Expression = (class Expression {
    constructor(type) {
      this.type = type;
    }
  });

  ftHTMLParser.SingleExpression = (class SingleExpression extends ftHTMLParser.Expression {
    constructor(type, val) {
      super(type);
      this.value = val;
    }
  });

  ftHTMLParser.MultiExpression = (class MultiExpression extends ftHTMLParser.Expression {
    constructor(type, val) {
      super(type);
      this.value = val;
    }
  });

  ftHTMLParser.Pattern = (class Pattern {
    constructor(keys, success) {
      this.keys = keys;
      this.onSuccess = success;
    }
  });

  ftHTMLParser.Parser = (class Parser {
    constructor() {
      this.patterns = new Array();

      this.addPattern(["Key_doctype", "String"], function (list, i) {
        return new ftHTMLParser.SingleExpression("Doctype", list[i + 1].value);
      });

      //keywords will always be <keyword><string value>
      const KEYWORDS = ["comment", "import"].map(m => { return "Key_" + m });
      this.addPattern([KEYWORDS, "String"], function (list, i) {
        return new ftHTMLParser.SingleExpression(list[i].type, list[i + 1].value);
      });

      this.addPattern(["Identifier", "String"], function (list, i) {
        return new ftHTMLParser.MultiExpression("ElementIC", [list[i], list[i + 1]]);
      });

      //BEGIN SELECTORS
      this.addPattern(["Identifier", "Sym_=", "Identifier"], function (list, i) {
        return new ftHTMLParser.MultiExpression("Attr", [list[i], list[i + 2]]);
      });
      this.addPattern(["Identifier", "Sym_=", "String"], function (list, i) {
        return new ftHTMLParser.MultiExpression("Attr", [list[i], list[i + 2]]);
      });

      this.addPattern(["Sym_#", "Identifier"], function (list, i) {
        return new ftHTMLParser.SingleExpression("SelectorID", list[i + 1]);
      });
      this.addPattern(["Sym_.", "Identifier"], function (list, i) {
        return new ftHTMLParser.SingleExpression("SelectorClass", list[i + 1]);
      });

      this.addPattern(["Sym_(", "SelectorID"], function (list, i) {
        return new ftHTMLParser.MultiExpression("AttrListPart", [list[i + 1]]);
      });
      this.addPattern(["Sym_(", "SelectorClass"], function (list, i) {
        return new ftHTMLParser.MultiExpression("AttrListPart", [list[i + 1]]);
      });

      this.addPattern(["Sym_(", "Attr"], function (list, i) {
        return new ftHTMLParser.MultiExpression("AttrListPart", [list[i + 1]]);
      });

      this.addPattern(["AttrListPart", "Sym_)"], function (list, i) {
        return new ftHTMLParser.MultiExpression("AttrList", list[i].value);
      });

      this.addPattern(["AttrListPart", "Attr"], function (list, i) {
        return new ftHTMLParser.MultiExpression("AttrListPart", [...list[i].value, list[i + 1]]);
      });
      this.addPattern(["AttrListPart", "SelectorClass"], function (list, i) {
        return new ftHTMLParser.MultiExpression("AttrListPart", [...list[i].value, list[i + 1]]);
      });

      this.addPattern(["Identifier", "AttrList"], function (list, i) {
        return new ftHTMLParser.MultiExpression("ElementIA", [list[i], list[i + 1]]);
      });

      //END SELECTORS

      const ELEMENTS = ["ElementI", "ElementIA", "ElementIC", "ElementIAC", ...KEYWORDS];
      this.addPattern(["Sym_+", "ChildsPart"], function (list, i) {
        return new ftHTMLParser.MultiExpression("ChildsPart", [list[i], ...list[i + 1].value]);
      });

      this.addPattern(["Identifier", "Children"], function (list, i) {
        return new ftHTMLParser.MultiExpression("ElementIC", [list[i], list[i + 1]]);
      });

      this.addPattern(["ElementIA", "Children"], function (list, i) {
        const [a, b] = list[i].value;
        return new ftHTMLParser.MultiExpression("ElementIAC", [a, b, list[i + 1]]);
      });
      this.addPattern(["ElementIA", "String"], function (list, i) {
        const [a, b] = list[i].value;
        return new ftHTMLParser.MultiExpression("ElementIAC", [a, b, list[i + 1]]);
      });

      this.addPattern(["Identifier", ELEMENTS], function (list, i) {
        return new ftHTMLParser.MultiExpression("ElementIC", [list[i], list[i + 1]]);
      });

      this.addPattern([ELEMENTS, "Sym_}"], function (list, i) {
        return new ftHTMLParser.MultiExpression("ChildsPart", [list[i]]);
      });

      this.addPattern([ELEMENTS, "ChildsPart"], function (list, i) {
        return new ftHTMLParser.MultiExpression("ChildsPart", [list[i], ...list[i + 1].value]);
      });

      this.addPattern(["Sym_{", "ChildsPart"], function (list, i) {
        return new ftHTMLParser.MultiExpression("Children", list[i + 1].value);
      });

      this.addPattern(["Identifier", "ChildsPart"], function (list, i) {
        return new ftHTMLParser.MultiExpression("ChildsPart", [
          new ftHTMLParser.SingleExpression("ElementI", list[i].value),
          ...list[i + 1].value
        ]);
      });

      this.addPattern(["Identifier", "Sym_}"], function (list, i) {
        return new ftHTMLParser.MultiExpression("ChildsPart", [
          new ftHTMLParser.SingleExpression("ElementI", list[i].value),
          ...list[i + 1].value
        ]);
      });

      this.addPattern(["String", "Sym_+", "ChildsPart"], function (list, i) {
        return new ftHTMLParser.MultiExpression("ChildsPart", [list[i], ...list[i + 2].value]);
      });
      this.addPattern(["String", "Sym_}"], function (list, i) {

        return new ftHTMLParser.MultiExpression("ChildsPart", [list[i], list[i + 1]]);
      });

      this.addPattern(["Doctype", ELEMENTS], function (list, i) {
        return new ftHTMLParser.MultiExpression("DocumentEmpty", [list[i], list[i + 1]]);
      });

      this.addPattern(["DocumentEmpty", "Children"], function (list, i) {
        const [a, b] = list[i].value;
        const [c, d] = b.value;
        return new ftHTMLParser.MultiExpression("Document", [
          a,
          new ftHTMLParser.MultiExpression("ElementIAC", [c, d, list[i + 1]])]);
      });
    }

    parse(tokens) {
      const expressions = tokens.map(x => {
        switch (x.type) {
          case ftHTMLexer.TokenType.Keyword:              
            return new ftHTMLParser.SingleExpression ("Key_" + x.value, "");
          case ftHTMLexer.TokenType.Symbol:
            return new ftHTMLParser.SingleExpression ("Sym_" + x.value, "");
          case ftHTMLexer.TokenType.String:
            return new ftHTMLParser.SingleExpression ("String", x.value);
          case ftHTMLexer.TokenType.Word:            
            return new ftHTMLParser.SingleExpression ("Identifier", x.value);
        }
      });

      let len = 0;

      do {
        len = expressions.length;
        
        for (let pattern of this.patterns) {
          loopEval:
          for (let i = 0; i < expressions.length; i++) {           
            for (let j=0; j < pattern.keys.length; j++) {             
              let k = pattern.keys[j];

              if (!expressions[j]) {
                throw new Error(`Parser Error: Invalid value for '${tokens[i].value}' @ ${expressions[i].line}:${expressions[i].pos}`);
              }
              
              if (i + j >= expressions.length) {
                continue loopEval;
              } 
              if (k.__proto__.constructor === String) {
                if (!(expressions[i + j].type === k)) {
                  continue loopEval;
                }
              }
              if (k.__proto__.constructor === Array && !k.includes(expressions[i+j].type)) {
                continue loopEval;
              } 
            }
            
            const exp = pattern.onSuccess(expressions, i);
            expressions[i] = exp;            
            expressions.splice(i + 1, pattern.keys.length - 1);
            
            if (expressions.length === 1) return expressions[0];
          }
        }
      } while(expressions.length !== len);
      throw new Error('fthTMLParser Error: Parsing AST could not evaluate syntax.');
    }
    throwError(t, v, l, p) {
      console.log(t);
      throw new Error(`ParserError: Invalid identifier '${v}' @ ${l}:${p}`);
    }
    addPattern(array, callback) {
      this.patterns.push(new ftHTMLParser.Pattern(array, callback));
    }
  });

  if (typeof module !== 'undefined' && 'exports' in module) {
    module.exports = ftHTMLParser;
  }
  else {
    this.ftHTMLParser = ftHTMLParser;
  }
})();