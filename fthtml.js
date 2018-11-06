(function () {
  const fs = require('fs');
  const Lexer = require('./fthtml-lexer.js');
  const Parser = require('./fthtml-parser.js');

  function makeftHTML() {    
    return ({
      evaluteExpression: function(exp) {
        const { type, value} = exp;                
        let a,b,c;
        
        switch (type) {
          case 'DocumentEmpty':
          case 'Document':
          case 'Children': {
            return (value.map(x => {return this.evaluteExpression(x);}).join(''));
          }
          case 'Doctype': {
            if (value === '"html"') return ('<!doctype html>');
            console.warn(value);
          }
          case 'Key_comment': {
            return (`<!-- ${value.substring(1, value.length - 1)} -->`);
          }
          case 'Key_import': {
            return this.renderFile(value.substring(1, value.length - 1));
          }
          case 'Identifier': {
            return (value);
          }
          case 'SelectorID' : {            
            return `id="${this.evaluteExpression(value)}"`;
          }
          case 'SelectorClass' : {            
            return `.${this.evaluteExpression(value)}`;
          }
          case 'ElementIAC': {
            [a, b, c] = value.map(this.evaluteExpression.bind(this));
            return (`<${a}${b}>${c}</${a}>`);
          }
          case 'AttrList': {
            let selectors = value.map(x => {return this.evaluteExpression(x)});
            let classes = selectors.filter(x => x.startsWith('.')).map(m => {return m.substr(1)}).join(' ');
            let misc = selectors.filter(x => !x.startsWith('.'));
            
            return ((classes.length > 0 ? ` class="${classes}"` : "") + (misc.length > 0 ? ` ${misc.reduce((a,b) => a + ` ${b}`)}` : ""));
          }
          case 'Attr': {
            [a, b] = value.map((x) => { return this.evaluteExpression(x); });
            return (`${a}="${b}"`);
          }
          case 'String': {
            return value.substring(1,value.length-1);
          }
          case 'ElementIC': {
            [a, b] = value.map(this.evaluteExpression.bind(this));
            return (`<${a}>${b}</${a}>`);
          }
          case 'ElementIA': {
            [a, b] = value.map(this.evaluteExpression.bind(this));            
            return (`<${a}${b}></${a}>`);
          }
          case 'ElementI': {
            return (`<${value}></${value}>`);
          }
          default:
            break;
        }
      },
      compile: function (src) {    
        let lexer = new Lexer.lexer;
        let parser = new Parser.Parser;
        return this.evaluteExpression(parser.parse(lexer.tokenize(src)));
      },
      renderFile: function(file) {
        if (file.startsWith('https:') || file.startsWith('http:')) {
          throw new Error(`Import files must be local, can not access '${file}'`);
        }

        try {
          if (fs.existsSync(`${file}.fthtml`)) {
            var html = fs.readFileSync(`${file}.fthtml`, 'utf8');
            return this.compile(html);
          }
          else {
            console.warn(`Can not find file '${file}.fthtml' to import. File omitted`);
            return;
          }
        } catch (err) {
          throw new Error(err);
        }
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