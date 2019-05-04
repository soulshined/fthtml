(function () {
  const ftHTMLexer = require('./fthtml-lexer');
  const TT = require('./fthtml-lexer').TokenType;
  const fs = require('fs');
  const path = require('path');
  const ftHTMLParser = {};

  ftHTMLParser.Parser = (class Parser {
    constructor(vars = {}) {
      this.tokens = [];
      this.vars = vars;
      
      if (!this.vars._$)
        this.vars._$ = Object.seal({
          __dir: ''
        })
    }
    compile(src) {
      return (new Parser(this.vars)).parse((new ftHTMLexer.Lexer).tokenize(src));
    }
    renderFile(file) {
      if (file.startsWith('https:') || file.startsWith('http:')) {
        throw new Error(`Import files must be local, can not access '${file}'`);
      }

      try {
        file = path.resolve(`${file}.fthtml`)
        
        if (fs.existsSync(file)) {
          this.vars._$.__dir = path.dirname(file);
          return this.compile(fs.readFileSync(file, 'utf8'));
        }
        else {
          console.warn(`Can not find file '${file}' to import. File omitted`); return '';
        }
      } 
      catch (err) { throw new Error(err); }
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
          this.throwError('Elements can not start with symbols', t);
        }
        if (t.type === TT.Keyword) {
          body += this.parseKeyword(t.value, i);
          i++;
        }
        if (t.type === TT.Variable) {
          if (peek !== undefined && (peek.type === TT.String || (peek.type === TT.Symbol && ['{', '('].includes(peek.value))))
            this.throwError('Variables can not define a parent ftHTML element or have children/attributes', t);

          body += this.parseVarToken(t);
        }
        if (t.type === TT.String) {
          if (!isChildIteration) this.throwError('Strings can not be a parent element',t);
          else body += this.parseString(t.value);
        }
        if (t.type === TT.ELang) {
          if (peek.type === undefined || (peek.type !== TT.Symbol && peek.value !== '{'))
            this.throwError('Language specific tags require opening and closing braces', t);
            
          const end = this.findClosingSymbol('}', i + 1);
          if (this.tokens[end] !== this.tokens[i+3])
              this.throwError('Language specific tags require opening and closing braces', t);

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
            this.throwInvalidSymbol(t,'[.,#,=]');

          const peek = this.peek(i);
          if (peek.type === TT.Symbol) this.throwError('Not expecting symbols after a selector identifier',peek);
          if (peek.type === TT.String) this.throwError('Not expecting string only single-value attributes',peek);

          if (t.value === '=') continue;
          if (t.value === '.' && peek.type === TT.Variable) classes += ` ${this.parseVarToken(peek)}`;
          if (t.value === '.' && peek.type !== TT.Variable) classes += ` ${peek.value}`;
          if (t.value === '#') {
            if (id.length > 0)
              this.throwError('An id has already been assigned to this element',this.tokens[start + 1]);
            id = ` id="${peek.value}"`;
          }

          i++;
        }
        else {
          if (e.type === 'Word') {
            if (this.peek(i).type === 'Symbol' && this.peek(i).value === '=') {
              if (this.peek(i + 1).type === 'Word' || this.peek(i + 1).type === 'String' || this.peek(i + 1).type === 'Variable') {
                if (this.peek(i + 1).type === 'String') attrs += ` ${e.value}="${this.parseString(this.peek(i + 1).value)}"`;
                else if (this.peek(i + 1).type === 'Variable') attrs += ` ${e.value}="${this.parseVarToken(this.peek(i + 1))}"`;
                else attrs += ` ${e.value}="${this.peek(i + 1).value}"`;
                
                i = i + 2;
              } else {
                this.throwError('Expecting a key value pair for attribute', t);
              }
            }
            else {
              attrs += ` ${t.value}`;
            }
          }
          else {
            this.throwError(`Not expecting token type '${t.type}'`,t);
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
      if (type !== TT.String) this.throwInvalidType(this.peek(index), TT.String);

      switch (keyword.toLowerCase()) {
        case 'doctype':
          if (index !== 0)
            this.throwError('Doctype is expected to be the first keyword in a file, when given',this.tokens[index]);
          return `<!DOCTYPE ${this.parseString(value)}>`;
        case 'comment':
          return `<!-- ${this.parseString(value)} -->`;
        case 'import':
          return (new Parser().renderFile(path.resolve(this.vars._$.__dir, this.parseString(value))));
        default:
          this.throwError(`Unkown keyword '${keyword}'`,this.tokens[index]);
      }
    }
    parsePragma(start, end) {
      switch (this.tokens[start + 1].value) {
        case 'vars':
          for (let i = start + 2; i < end - 2; i++) {
            const t = this.tokens[i];
            const peek = this.peek(i);

            if (t.type !== TT.Word)
                this.throwError('Variables must be a valid element name ([\w-]+)',t);
            if (peek === undefined || peek.type !== TT.String)
                this.throwError('Expecting a string value for variable',t);

            this.vars[t.value] = peek.value;
            i++;
          }
          break;

        default:
          break;
      }
    }
    parseString(value) {
      let str = value.substring(1, value.length - 1)
        .split(`\\${value.charAt(0)}`).join(value.charAt(0));

      const regx = /\${[ ]*@([\w-]+)[ ]*}/gm;
      let matches;
      while ((matches = regx.exec(str)) !== null) {
        let match = this.vars[matches[1]];
        if (match) str = str.replace(matches[0], match.substring(1, match.length - 1));
      }

      return str;
    }
    parseVarToken(token) {
      if (this.vars[token.value.substring(1)] === undefined) this.throwError('Variable not declared', token);
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
          this.throwError(`Uknown embedded language '${this.tokens[start-2].value}'`, start);
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

      if (!['{', '('].includes(value)) this.throwInvalidType(this.tokens[start],TT.Symbol);

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

      this.throwError(`Expecting a closing '${closing}' symbol for starting point @ ${line}:${pos} but none found.`, this.tokens[start]);
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

      this.throwError(`Expecting '#end' pragma keyword for starting pragma '${value}' but none found`,this.tokens[start]);
    }
    evaluateENForToken(token) {
      if (!/^[\w-]+$/.test(token.value))
        this.throwError(`Invalid element name '${token.value}'. Element names should follow the pattern: '[\\w-]+' Error`, token);
      
      return token.value;
    }
    throwInvalidType(token, expected) {
      this.throwError(`Invalid identifier '${token.type}', expecting '${expected}'`, token);
    }
    throwInvalidSymbol(token, expecting) {
      this.throwError(`Invalid symbol '${token.value}', '${expecting}'`, token);
    }
    throwError(msg,token) {
      const { line, pos, value } = token;
      throw new Error(`ftHTMLParser Error: ${msg} @ ${line}:${pos}-${pos+value.length}`);
    }
  });

   module.exports = ftHTMLParser;
})();