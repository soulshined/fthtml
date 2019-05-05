(function () {
  const ftHTMLexer = require('./fthtml-lexer');
  const TT = require('./fthtml-lexer').TokenType;
  const fs = require('fs');
  const path = require('path');
  const ftHTMLParser = {};
  const { ftHTMLBaseError, ftHTMLError, ftHTMLInvalidCharError, ftHTMLParserError, ftHTMLInvalidTypeError, ftHTMLInvalidParentElementError, ftHTMLIncompleteElementError, ftHTMLInvalidKeywordError, ftHTMLInvalidElementNameError, ftHTMLInvalidVariableNameError, ftHTMLVariableDoesntExistError, ftHTMLImportError } = require('../utils/exceptions/fthtml-exceptions');
  require('../utils/extensions');

  ftHTMLParser.Parser = (class Parser {
    constructor(vars) {
      this.tokens = [];
      this.vars = vars || {};
      this.vars.import = this.vars.import || {};

      let __dir = '';
      let __stack = [];
      if (this.vars._$) {
        __dir = this.vars._$.__dir || '';
        __stack = this.vars._$.__stack || [];
      }
      this.vars._$ = Object.seal({ __dir, __stack });
    }
    compile(src) {
      return (new Parser(this.vars)).parse((new ftHTMLexer.Lexer).tokenize(src));
    }
    renderFile(file) {
      if (file.startsWith('https:') || file.startsWith('http:')) {
        throw new ftHTMLImportError(`Import files must be local, can not access '${file}'`);
      }

      try {
        file = path.resolve(`${file}.fthtml`);
        
        if (fs.existsSync(file)) {
          this.vars._$.__stack.unshift(file);
          this.vars._$.__dir = path.dirname(file);
          return this.compile(fs.readFileSync(file, 'utf8'));
        }
        else {
          throw new ftHTMLImportError(`Can not find file '${file}' to import`);
        }
      }
      catch (err) { 
        if (err.name.startsWith('ftHTML'))
          throw new ftHTMLError(new ftHTMLBaseError(err, this.vars._$.__stack));
        else throw new Error(err.message);
      }
    }
    peek(index) {
      return this.tokens[index + 1];
    }
    parse(tokens, isChildIteration = false) {
      this.tokens = tokens;

      let body = "";
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        const peek = this.peek(i);

        if (t.type === TT.Symbol) {
          if (isChildIteration && t.value === '+') continue;

          if (t.value === '#' && peek !== undefined && peek.type === TT.Pragma) {
            const end = this.findPragmaEnd(i);
            this.parsePragma(i, end);
            i = end; continue;
          }
          throw new ftHTMLInvalidParentElementError(t);
        }
        if (t.type === TT.Keyword) {
          if (t.value === 'import' && peek.type === TT.Symbol && peek.value === '{') {
            const end = this.findClosingSymbol('}', i+1);
            body += this.parseImportBlock(i, end);
            i = end;
          }
          else {
            body += this.parseKeyword(t.value, i);
            i++;
          }
        }
        if (t.type === TT.Variable) {
          if (peek !== undefined && (peek.type === TT.String || (peek.type === TT.Symbol && ['{', '('].includes(peek.value))))
            throw new ftHTMLInvalidParentElementError(t);

          body += this.parseVarToken(t);
        }
        if (t.type === TT.String) {
          if (!isChildIteration) throw new ftHTMLInvalidParentElementError(t);
          else body += this.parseString(t.value);
        }
        if (t.type === TT.ELang) {
          if (peek.type === undefined || (peek.type !== TT.Symbol && peek.value !== '{'))
            throw new ftHTMLIncompleteElementError(t,peek, 'opening and closing braces');
            
          const end = this.findClosingSymbol('}', i + 1);
          if (this.tokens[end] !== this.tokens[i+3])
              throw new ftHTMLIncompleteElementError(t,peek, 'opening and closing braces');

          body += this.parseELang(i + 2);
          i = i + 3; continue;
        }
        if (t.type === TT.Word) {
          if (peek === undefined || [TT.Keyword, TT.Word, TT.ELang].includes(peek.type)) {
            body += this.createElement(this.evaluateENForToken(t)); continue;
          }
          if (isChildIteration) {
            if (peek.type === TT.Symbol && peek.value === '+') {
              body += this.createElement(this.evaluateENForToken(t)); continue;
            }
          }
          if (peek.type === TT.Symbol && peek.value === '(') {
            const result = this.initElementWithAttrs(i, this.findClosingSymbol(')', i + 1));
            body += result.element;
            i = result.end;
          }
          if (peek.type === TT.Symbol && peek.value === '{') {
            const result = this.initElementChildrenOnly(i, this.findClosingSymbol('}', i + 1));
            body += result.element;
            i = result.end;
          }
          if (peek.type === TT.String) {
            body += this.createElement(this.evaluateENForToken(t), '', this.parseString(peek.value));
            i++;
          }
          if (peek.type === TT.Variable) {
            body += this.createElement(this.evaluateENForToken(t), '', this.parseVarToken(peek));
            i++;
          }
        }
      }

      return body;
    }
    parseAttributes(start, end) {
      let classes = '';
      let id = '';
      let attrs = '';

      for (let i = start; i < end; i++) {
        const t = this.tokens[i];

        if (t.type === TT.Variable) {
          attrs += ` ${this.parseVarToken(t)}`; continue;
        }
        if (t.type === TT.Symbol) {
          if (!['.', '#', '='].includes(t.value))
            throw new ftHTMLInvalidCharError(t.value,t.line,t.pos);

          const peek = this.peek(i);
          if ([TT.Symbol,TT.String].includes(peek.type)) throw new ftHTMLInvalidTypeError(peek, 'a selector or identifier');

          if (t.value === '=') continue;
          if (t.value === '.' && peek.type === TT.Variable) classes += ` ${this.parseVarToken(peek)}`;
          if (t.value === '.' && peek.type !== TT.Variable) classes += ` ${peek.value}`;
          if (t.value === '#') {
            if (id.length > 0)
              throw new ftHTMLParserError('An id has already been assigned to this element', this.tokens[start+1]);
            id = ` id="${peek.value}"`;
          }

          i++;
        }
        else {
          if (t.type === TT.Word) {
            if (this.peek(i).type === TT.Symbol && this.peek(i).value === '=') {
              if (this.peek(i + 1).type === TT.Word || this.peek(i + 1).type === TT.String || this.peek(i + 1).type === TT.Variable) {
                if (this.peek(i + 1).type === TT.String) attrs += ` ${t.value}="${this.parseString(this.peek(i + 1).value)}"`;
                else if (this.peek(i + 1).type === TT.Variable) attrs += ` ${t.value}="${this.parseVarToken(this.peek(i + 1))}"`;
                else attrs += ` ${t.value}="${this.peek(i + 1).value}"`;
                
                i = i + 2;
              } else {
                throw new ftHTMLInvalidTypeError(t, 'a key value pair for attributes');
              }
            }
            else {
              attrs += ` ${t.value}`;
            }
          }
          else {
            throw new ftHTMLInvalidTypeError(t, 'an attribute selector, identifier or word');
          }
        }
      }

      if (classes.length > 0) classes = ` class="${classes.trim()}"`;
      return `${id}${classes}${attrs}`;
    }
    parseChildren(start, end) {
      if (start + 2 === end) return '';

      if (this.peek(start + 1).type === TT.String && (end - (start + 2) === 1))
        return this.parseString(this.tokens[start + 2].value);

      if (this.peek(start + 1).type === TT.Variable && (end - (start + 2) === 1))
        return this.parseVarToken(this.tokens[start + 2]);

      return (new Parser(this.vars).parse(this.tokens.slice(start + 2, end), true));
    }
    parseKeyword(keyword, index) {
      const { type, value } = this.peek(index);
      if (type !== TT.String) throw new ftHTMLInvalidTypeError(this.peek(index), 'string values only')

      switch (keyword.toLowerCase()) {
        case 'doctype':
          if (index !== 0)
            throw new ftHTMLInvalidTypeError(this.tokens[index], 'Doctype to be the first element in a file, when given');
          return `<!DOCTYPE ${this.parseString(value)}>`;
        case 'comment':
          return `<!-- ${this.parseString(value)} -->`;
        case 'import':
          this.updateStackForCaller("import", this.tokens[index]);
          return (new Parser({_$: { __stack : this.vars._$.__stack }}).renderFile(path.resolve(this.vars._$.__dir, this.parseString(value))));
        default:
          throw new ftHTMLInvalidKeywordError(this.tokens[index]);
      }
    }
    parseImportBlock(start, end) {
      this.vars.import = {};
      
      for (let i = start + 2; i < end -1; i++) {
        const t = this.tokens[i];
        const peek = this.peek(i);

        if (t.type !== 'Word')
          throw new ftHTMLInvalidVariableNameError(t, '[\w-]+');
        if (peek === undefined || peek.type !== 'String')
          throw new ftHTMLInvalidTypeError(t, 'a string value for template properties');

        this.vars.import[t.value] = this.parseString(`'${peek.value}'`);
        i++;
      }
      
      if (!this.vars.import.filename)
        throw new ftHTMLParserError(`import template statements require a 'filename' property and a string value of the path to import`, this.tokens[start]);

      this.updateStackForCaller("import", this.tokens[start]);
      return (new Parser({import: this.vars.import, _$ : { __stack : this.vars._$.__stack }}).renderFile(path.resolve(this.vars._$.__dir, this.parseString(this.vars.import.filename))));
    }
    parsePragma(start, end) {
      switch (this.tokens[start + 1].value) {
        case 'vars':
          for (let i = start + 2; i < end - 2; i++) {
            const t = this.tokens[i];
            const peek = this.peek(i);

            if (t.type !== TT.Word)
                throw new ftHTMLInvalidVariableNameError(t, '[\w-]+');
            if (peek === undefined || peek.type !== TT.String)
              throw new ftHTMLInvalidTypeError(t, 'a string value for variables');

            this.vars[t.value] = this.parseString(`'${peek.value}'`);
            i++;
          }
          break;

        default:
          break;
      }
    }
    parseString(value) {
      let str = value.slice(1,-1)
        .split(`\\${value.charAt(0)}`).join(value.charAt(0));

      let matches = str.matchAll(/\${[ ]*@([\w-]+)[ ]*}/gm);
      matches.forEach(i => {
        const match = this.vars[i[1]];
        if (match) str = str.replace(i[0], match.slice(1,-1));
      });
      
      matches = str.matchAll(/\${[ ]*([\w-]+)[ ]*}/gm);
      matches.forEach(i => {
        const match = this.vars.import[i[1]];
        if (match) str = str.replace(i[0], match.slice(1,-1));
      });

      return str;
    }
    parseVarToken(token) {
      if (this.vars[token.value.substring(1)] === undefined) throw new ftHTMLVariableDoesntExistError(token);
      return this.parseString(this.vars[token.value.substring(1)]);
    }
    parseELang(start) {
      const elangb = this.tokens[start];

      switch (this.tokens[start - 2].value) {
        case 'js':
          return this.createElement('script', '', elangb.value);
        case 'php':
          return `<?php${elangb.value}?>`;
        case 'css':
          return this.createElement('style', '', elangb.value);
        default:
          throw new ftHTMLInvalidTypeError(this.tokens[start-2], "'css','js','php'");
      }
    }
    initElementChildrenOnly(start, end) {
      return {
        "element": this.createElement(this.evaluateENForToken(this.tokens[start]), '', this.parseChildren(start, end)),
        "end": end
      };
    }
    initElementWithAttrs(start, end) {
      const attrs = this.parseAttributes(start + 2, end);
      let innerHTML = '';
      const peek = this.peek(end);
      let _thisEnd = end;

      if (peek !== undefined) {
        if (peek.type === TT.Symbol && peek.value === '{') {
          _thisEnd = this.findClosingSymbol('}', end + 1);
          innerHTML = this.parseChildren(end, _thisEnd);
        }
        if (peek.type === TT.String) {
          innerHTML = this.parseString(peek.value);
          _thisEnd = end + 1;
        }
        if (peek.type === TT.Variable) {
          innerHTML = this.parseVarToken(peek);
          _thisEnd = end + 1;
        }
      }

      return {
        "element": this.createElement(this.evaluateENForToken(this.tokens[start]), attrs, innerHTML),
        "end": _thisEnd
      };
    }
    createElement(element, attrs = "", value = "") {
      return `<${element}${attrs}>${value}</${element}>`;
    }
    findClosingSymbol(closing, start) {
      const { line, pos, value } = this.tokens[start];

      if (!['{', '('].includes(value)) throw new ftHTMLInvalidTypeError(this.tokens[start], "a valid child or attribute body constructor symbol");

      let openMatches = 0;
      for (let i = start; i < this.tokens.length; i++) {
        const t = this.tokens[i];

        if (t.type === TT.Symbol) {
          if (t.value === value) {
            openMatches++; continue;
          }
          if (t.value === closing) {
            openMatches--;
            if (openMatches === 0) return i;
          }
        }
      }

      throw new ftHTMLParserError(`Expecting a closing '${closing}' symbol for '${this.tokens[start].value}'`, this.tokens[start]);
    }
    findPragmaEnd(start) {
      const { value } = this.tokens[start];

      for (let i = start; i < this.tokens.length; i++) {
        const t = this.tokens[i];
        const peek = this.peek(i);
        if (t.type === TT.Symbol && t.value === '#' && peek.type === TT.Keyword && peek.value === 'end') {
          return i + 1;
        }
      }

      throw new ftHTMLParserError(`Expecting '#end' pragma keyword for starting pragma '${value}' but none found`,this.tokens[start]);
    }
    evaluateENForToken(token) {
      if (!/^[\w-]+$/.test(token.value))
        throw new ftHTMLInvalidElementNameError(token, `the following pattern: [\w-]+`);
      
      return token.value;
    }
    updateStackForCaller(caller, token) {
      let s = this.vars._$.__stack;
      if (s.length == 0) return;

      s[0] = `${caller} (${s[0]}:${token.line}:${token.pos})`;
    }
  });

   module.exports = ftHTMLParser;
})();