(function () {
  const ftHTMLexer = require('./fthtml-lexer');
  const fs = require('fs');
  const ftHTMLParser = {};

  ftHTMLParser.Parser = (class Parser {
    constructor() {
      this.tokens = [];
      this.vars = {};
    }
    compile(src) {
      return (new Parser).parse((new ftHTMLexer.Lexer).tokenize(src));
    }
    renderFile(file) {
      if (file.startsWith('https:') || file.startsWith('http:')) {
        throw new Error(`Import files must be local, can not access '${file}'`);
      }
      console.log(`\nRendering ${file}.fthtml`);

      try {
        if (fs.existsSync(`${file}.fthtml`)) {
          let html = fs.readFileSync(`${file}.fthtml`, 'utf8');
          return this.compile(html);
        }
        else {
          console.warn(`Can not find file '${file}.fthtml' to import. File omitted`); return '';
        }
      } catch (err) {
        throw new Error(err);
      }
    }
    peek(index) {
      return this.tokens[index + 1];
    }
    parse(tokens, isChildIteration = false, vars) {
      this.tokens = tokens;
      this.vars = vars || this.vars;

      let body = "";
      for (let i = 0; i < tokens.length; i++) {
        console.log('last token', tokens[i]);
        const e = tokens[i];
        let peek = this.peek(i);

        if (e.type === 'Symbol') {
          if (isChildIteration && e.value === '+') continue;

          if (e.value === '#' && peek !== undefined && peek.type === 'Pragma') {
            let end = this.findPragmaEnd(i);
            this.parsePragma(i, end);
            i = end;
            continue;
          }

          throw new Error(`Elements can not start with symbols. Error @ ${e.line}:${e.pos}`);
        }
        if (e.type === 'Keyword') {
          body += this.parseKeyword(e.value, i);
          i = i + 1;
        }
        if (e.type === 'Variable') {
          if (peek !== undefined && (peek.type === 'String' || (peek.type === 'Symbol' && ['{', '('].includes(peek.value))))
            throw new Error(`Variables can not define a parent HTML element or have children/attributes. Error @ ${e.line}:${e.pos}`);

          body += this.parseVarToken(e);
        }
        if (e.type === 'String') {
          if (!isChildIteration) throw new Error(`Strings can not be a parent element @ ${e.line}:${e.pos}`);
          else body += this.parseString(e.value);
        }
        if (e.type === 'Word') {
          if (peek === undefined) {
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
            i = i + 1;
          }
          if (peek.type === 'Word') body += this.createElement(e.value);
          if (peek.type === 'Variable') {
            body += this.createElement(e.value, '', this.parseVarToken(peek));
            i = i + 1;
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
          attrs += ` ${this.parseVarToken(e)}`;
          continue;
        }
        if (e.type === 'Symbol') {
          if (!['.', '#', '='].includes(e.value))
            this.throwSymbolError('[.,#,=]', e.value, e.line, e.pos);

          let peek = this.peek(i);
          if (peek.type === 'Symbol') throw new Error(`Not expecting symbols after a selector identifier. Error @ ${peek.line}:${peek.pos}`);
          if (peek.type === 'String') throw new Error(`Not expecting string only single-value attributes. Error @ ${peek.line}:${peek.pos}`);

          if (e.value === '=') continue;
          if (e.value === '.' && peek.type === 'Variable') classes += ` ${this.parseVarToken(peek)}`;
          if (e.value === '.' && peek.type !== 'Variable') classes += ` ${peek.value}`;
          if (e.value === '#') {
            if (id.length > 0)
              throw new Error(`An id has already been assigned to this element @ ${this.tokens[start + 1].line}:${this.tokens[start + 1].pos}`);
            id = ` id="${peek.value}"`;
          }

          i = i + 1;
        }
        else {
          if (e.type === 'Word') {
            if (this.peek(i).type === 'Symbol' && this.peek(i).value === '=') {
              if (this.peek(i + 1).type === 'Word' || this.peek(i + 1).type === 'String' || this.peek(i + 1).type === 'Variable') {
                if (this.peek(i + 1).type === 'String') {
                  attrs += ` ${e.value}=${this.peek(i + 1).value}`;
                }
                else if (this.peek(i + 1).type === 'Variable') {
                  attrs += ` ${e.value}=${this.parseVarToken(this.peek(i + 1))}`;
                }
                else {
                  attrs += ` ${e.value}="${this.peek(i + 1).value}"`;
                }
                i = i + 2;
              } else {
                throw new Error(`Expecting a key value pair for attribute @ ${e.line}:${e.pos}`);
              }
            }
            else {
              attrs += ` ${e.value}`;
            }
          }
          else {
            throw new Error(`Not expecting token type '${e.type}' @ ${e.line}:${e.pos}`);
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

      return (new Parser().parse(this.tokens.slice(start + 2, end), true, this.vars));
    }
    parseKeyword(keyword, index) {
      let { type, pos, line, value } = this.peek(index);
      if (type !== 'String') this.throwError(type, 'String', line, pos);

      switch (keyword.toLowerCase()) {
        case 'doctype':
          if (index !== 0)
            throw new Error(`Doctype is expected to be the first keyword in a file, when given. Error @ ${this.tokens[index].line}:${this.tokens[index].pos}`);
          return `<!DOCTYPE ${this.parseString(value)}>`;
        case 'comment':
          return `<!-- ${this.parseString(value)} -->`;
        case 'import':
          return this.renderFile(this.parseString(value));
        default:
          throw new Error(`Unkown keyword '${keyword} @ ${this.tokens[index].line}:${this.tokens[index].pos}`);
      }
    }
    parsePragma(start, end) {
      switch (this.tokens[start + 1].value) {
        case 'vars':
          for (let i = start + 2; i < end - 2; i++) {
            const e = this.tokens[i];
            let peek = this.peek(i);

            if (e.type !== 'Word')
              throw new Error(`ftHTMLParse Error: Variables must be a valid identifier. Error @ ${e.line}:${e.pos}`);
            if (peek === undefined || peek.type !== 'String')
              throw new Error(`ftHTMLParse Error: Expecting a string value for variable @ ${e.line}:${e.pos}`);

            this.vars[e.value] = peek.value;
            i += 1;
          }
          break;

        default:
          break;
      }
    }
    parseString(value) {
      return (value.substring(1, value.length - 1))
        .split(`\\${value.charAt(0)}`).join(value.charAt(0));
    }
    parseVarToken(token) {
      if (this.vars[token.value.substr(1)] === undefined) throw new Error(`ftHTMLParse Error: Variable not declared @ ${token.line}:${token.pos}`);
      return this.parseString(this.vars[token.value.substr(1)]);
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

      if (!['{', '('].includes(value)) throw new Error(`ftHTMLParse Error: Invalid identifier caught as symbol @ ${line}:${pos}`);

      let openMatches = 0;
      for (let i = start; i < this.tokens.length; i++) {
        const e = this.tokens[i];

        if (e.type === 'Symbol') {
          if (e.value === value) {
            openMatches++;
            continue;
          }
          if (e.value === closing) {
            openMatches--;
            if (openMatches === 0) return i;
          }
        }
      }

      throw new Error(`Expecting a closing '${closing}' symbol for starting point @ ${line}:${pos} but none found.`);
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

      throw new Error(`Expecting '#end' pragma keyword for starting pragma '${value}' @ ${line}:${pos} but none found.`);
    }
    throwError(type, expected, l, p) {
      throw new Error(`ftHTMLParse Error: Invalid identifier '${type}', expecting ${expected} @ ${l}:${p}`);
    }
    throwSymbolError(expecting, actual, l, p) {
      throw new Error(`ftHTMLParse Error: Expecting a '${expecting}' symbol @ ${l}:${p}, instead '${actual}' was recieved`);
    }
  });

  if (typeof module !== 'undefined' && 'exports' in module) {
    module.exports = ftHTMLParser;
  }
  else {
    this.ftHTMLParser = ftHTMLParser;
  }
})();