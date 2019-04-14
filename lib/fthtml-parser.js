(function () {
  const ftHTMLexer = require('./fthtml-lexer');
  const fs = require('fs');
  const path = require('path');
  const ftHTMLParser = {};
  require('../utils/extensions');

  ftHTMLParser.Parser = (class Parser {
    constructor(vars) {
      this.tokens = [];
      this.vars = vars || {};
      this.vars.import = this.vars.import || {};

      let __dir = (this.vars._$) ? this.vars._$.__dir || '' : '';

      this.vars._$ = Object.seal({ __dir })
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
        const e = tokens[i];
        let peek = this.peek(i);

        if (e.type === 'Symbol') {
          if (isChildIteration && e.value === '+') continue;

          if (e.value === '#' && peek !== undefined && peek.type === 'Pragma') {
            let end = this.findPragmaEnd(i);
            this.parsePragma(i, end);
            i = end; continue;
          }
          this.throwError('Elements can not start with symbols', e);
        }
        if (e.type === 'Keyword') {
          if (e.value === 'import' && peek.type === 'Symbol' && peek.value === '{') {
            let end = this.findClosingSymbol('}', i+1);
            body += this.parseImportBlock(i, end);
            i = end;
          }
          else {
            body += this.parseKeyword(e.value, i);
            i++;
          }
        }
        if (e.type === 'Variable') {
          if (peek !== undefined && (peek.type === 'String' || (peek.type === 'Symbol' && ['{', '('].includes(peek.value))))
            this.throwError('Variables can not define a parent ftHTML element or have children/attributes', e);

          body += this.parseVarToken(e);
        }
        if (e.type === 'String') {
          if (!isChildIteration) this.throwError('Strings can not be a parent element',e);
          else body += this.parseString(e.value);
        }
        if (e.type === 'Word') {
          if (peek === undefined || peek.type === 'Keyword') {
            body += this.createElement(e.value); continue;
          }
          if (isChildIteration) {
            if (peek.type === 'Symbol' && peek.value === '+') {
              body += this.createElement(e.value); continue;
            }
          }
          if (peek.type === 'Symbol' && peek.value === '(') {
            let result = this.initElementWithAttrs(i, this.findClosingSymbol(')', i + 1));
            body += result.element;
            i = result.end;
          }
          if (peek.type === 'Symbol' && peek.value === '{') {
            let result = this.initElementChildrenOnly(i, this.findClosingSymbol('}', i + 1));
            body += result.element;
            i = result.end;
          }
          if (peek.type === 'String') {
            body += this.createElement(e.value, '', this.parseString(peek.value));
            i++;
          }
          if (peek.type === 'Word') body += this.createElement(e.value);
          if (peek.type === 'Variable') {
            body += this.createElement(e.value, '', this.parseVarToken(peek));
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
        const e = this.tokens[i];

        if (e.type === 'Variable') {
          attrs += ` ${this.parseVarToken(e)}`; continue;
        }
        if (e.type === 'Symbol') {
          if (!['.', '#', '='].includes(e.value))
            this.throwInvalidSymbol(e,'[.,#,=]');

          let peek = this.peek(i);
          if (peek.type === 'Symbol') this.throwError('Not expecting symbols after a selector identifier',peek);
          if (peek.type === 'String') this.throwError('Not expecting string only single-value attributes',peek);

          if (e.value === '=') continue;
          if (e.value === '.' && peek.type === 'Variable') classes += ` ${this.parseVarToken(peek)}`;
          if (e.value === '.' && peek.type !== 'Variable') classes += ` ${peek.value}`;
          if (e.value === '#') {
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
                if (this.peek(i + 1).type === 'String') attrs += ` ${e.value}=${this.peek(i + 1).value}`;
                else if (this.peek(i + 1).type === 'Variable') attrs += ` ${e.value}=${this.parseVarToken(this.peek(i + 1))}`;
                else attrs += ` ${e.value}="${this.peek(i + 1).value}"`;
                
                i = i + 2;
              } else {
                this.throwError('Expecting a key value pair for attribute', e);
              }
            }
            else {
              attrs += ` ${e.value}`;
            }
          }
          else {
            this.throwError(`Not expecting token type '${e.type}'`,e);
          }
        }
      }

      if (classes.length > 0) classes = ` class="${classes.trim()}"`;
      return `${id}${classes}${attrs}`;
    }
    parseChildren(start, end) {
      if (start + 2 === end) return '';

      if (this.peek(start + 1).type === 'String' && (end - (start + 2) === 1))
        return this.parseString(this.tokens[start + 2].value);

      if (this.peek(start + 1).type === 'Variable' && (end - (start + 2) === 1))
        return this.parseVarToken(this.tokens[start + 2]);

      return (new Parser(this.vars).parse(this.tokens.slice(start + 2, end), true));
    }
    parseKeyword(keyword, index) {
      let { type, pos, line, value } = this.peek(index);
      if (type !== 'String') this.throwInvalidType(this.peek(index), 'String');

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
    parseImportBlock(start, end) {
      this.vars.import = {};
      
      for (let i = start + 2; i < end -1; i++) {
        const e = this.tokens[i];
        let peek = this.peek(i);

        if (e.type !== 'Word')
          this.throwError('Variables must be a valid identifier ([\w-]+)', e);
        if (peek === undefined || peek.type !== 'String')
          this.throwError('Expecting a string value for variable', e);

        this.vars.import[e.value] = peek.value;
        i++;
      }
      if (!this.vars.import.filename)
        this.throwError(`Expecting binding property 'filename' for import statement @ ${this.tokens[start].line}:${this.tokens[start].pos} but none found.`, this.tokens[start]);

      return (new Parser({import: this.vars.import}).renderFile(path.resolve(this.vars._$.__dir, this.parseString(this.vars.import.filename))));
    }
    parsePragma(start, end) {
      switch (this.tokens[start + 1].value) {
        case 'vars':
          for (let i = start + 2; i < end - 2; i++) {
            const e = this.tokens[i];
            let peek = this.peek(i);

            if (e.type !== 'Word')
                this.throwError('Variables must be a valid identifier ([\w-]+)',e);
            if (peek === undefined || peek.type !== 'String')
                this.throwError('Expecting a string value for variable',e);

            this.vars[e.value] = peek.value;
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

      let matches = str.matchAll(/\${[ ]*@([\w-]+)[ ]*}/gm);
      for (let i of matches) {
        let match = this.vars[i[1]];
        if (match) str = str.replace(i[0], match.substring(1, match.length - 1));
      }

      matches = str.matchAll(/\${[ ]*([\w-]+)[ ]*}/gm);
      matches.forEach(i => {
        let match = this.vars.import[i[1]];
        if (match) str = str.replace(i[0], match.substring(1, match.length - 1));
      })

      return str;
    }
    parseVarToken(token) {
      if (this.vars[token.value.substring(1)] === undefined) this.throwError('Variable not declared', token);
      return this.parseString(this.vars[token.value.substring(1)]);
    }
    initElementChildrenOnly(start, end) {
      return {
        "element": this.createElement(this.tokens[start].value, '', this.parseChildren(start, end)),
        "end": end
      };
    }
    initElementWithAttrs(start, end) {
      let attrs = this.parseAttributes(start + 2, end);
      let innerHTML = '';
      let peek = this.peek(end);
      let _thisEnd = end;

      if (peek !== undefined) {
        if (peek.type === 'Symbol' && peek.value === '{') {
          _thisEnd = this.findClosingSymbol('}', end + 1);
          innerHTML = this.parseChildren(end, _thisEnd);
        }
        if (peek.type === 'String') {
          innerHTML = this.parseString(peek.value);
          _thisEnd = end + 1;
        }
        if (peek.type === 'Variable') {
          innerHTML = this.parseVarToken(peek);
          _thisEnd = end + 1;
        }
      }

      return {
        "element": this.createElement(this.tokens[start].value, attrs, innerHTML),
        "end": _thisEnd
      };
    }
    createElement(identifier, attrs = "", value = "") {
      return `<${identifier}${attrs}>${value}</${identifier}>`;
    }
    findClosingSymbol(closing, start) {
      let { line, pos, value } = this.tokens[start];

      if (!['{', '('].includes(value)) this.throwInvalidType(this.tokens[start],'Symbol');

      let openMatches = 0;
      for (let i = start; i < this.tokens.length; i++) {
        const e = this.tokens[i];

        if (e.type === 'Symbol') {
          if (e.value === value) {
            openMatches++; continue;
          }
          if (e.value === closing) {
            openMatches--;
            if (openMatches === 0) return i;
          }
        }
      }

      this.throwError(`Expecting a closing '${closing}' symbol for starting point @ ${line}:${pos} but none found.`, this.tokens[start]);
    }
    findPragmaEnd(start) {
      let { line, pos, value } = this.tokens[start];

      for (let i = start; i < this.tokens.length; i++) {
        const e = this.tokens[i];
        let peek = this.peek(i);
        if (e.type === 'Symbol' && e.value === '#' && peek.type === 'Keyword' && peek.value === 'end') {
          return i + 1;
        }
      }

      this.throwError(`Expecting '#end' pragma keyword for starting pragma '${value}' but none found`,this.tokens[start]);
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

  if (typeof module !== 'undefined' && 'exports' in module) {
    module.exports = ftHTMLParser;
  }
  else {
    this.ftHTMLParser = ftHTMLParser;
  }
})();