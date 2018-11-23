(function () {
  const ftHTMLexer = require('./fthtml-lexer');
  const fs = require('fs');
  const ftHTMLParser = {};

  ftHTMLParser.Parser = (class Parser {
    constructor() {
      this.tokens = [];
    }
    compile(src) {
      let lexer = new ftHTMLexer.lexer;
      let parser = new Parser();
      return parser.parse(lexer.tokenize(src));
    }
    renderFile(file) {
      this.file = file;
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
    peek(index) {
      return this.tokens[index + 1];
    }
    parse(tokens, isChildIteration = false) {
      this.tokens = tokens;

      let body = "";
      for (let i = 0; i < tokens.length; i++) {
        const e = tokens[i];

        if (e.type === 'Symbol' && !['{', '}', '(', ')'].includes(e.value)) {
          if (isChildIteration && e.value === '+') continue;
          throw new Error(`Elements can not start with symbols. Error at @ ${e.line}:${e.pos}`);
        }

        if (e.type === 'Keyword') {
          body += this.parseKeyword(e.value, i);
          i = i + 1;
        }
        if (e.type === 'String' && isChildIteration) {
          console.log(e.value);

          let peek = this.peek(i);

          if (peek !== undefined && peek.value !== '+') {
            throw new Error(`Expecting a '+' symbol @ ${peek.line}:${peek.pos}`);
          }
          body += this.parseString(e.value);
        }

        WordIf:
        if (e.type === 'Word') {
          let peek = this.peek(i);

          if (peek === undefined && isChildIteration) {
            body += this.createElement(e.value, '', '');
            break WordIf;
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

          if (peek.type === 'Word') body += this.createElement(e.value, '', '');

          if (isChildIteration && this.peek(i) !== undefined) {
            if (this.peek(i).type === 'String')
              this.throwSymbolError('+', this.peek(i).value, this.peek(i).line, this.peek(i).pos);
          }
        }
      }

      return body;
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
    initElementChildrenOnly(start, end) {
      return {
        "element": this.createElement(this.tokens[start].value, '', this.parseChildren(start, end)),
        "end": end
      };
    }
    initElementWithAttrs(start, end) {
      let attrs = this.parseAttributes(start + 2, end);
      let innerHTML = '';
      let peek = this.tokens[end + 1];
      let _thisEnd = end;

      if (peek !== undefined) {
        if (peek.type === 'Symbol' && peek.value === '{') {
          _thisEnd = this.findClosingSymbol('}', end + 1);
          innerHTML = this.parseChildren(end + 1, _thisEnd);
        }
        if (peek.type === 'String') {
          innerHTML = this.parseString(peek.value);
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
    parseChildren(start, end) {
      if (start + 1 === end) return '';

      if (this.peek(start).type === 'String' && (end - (start + 1) === 1))
        return this.parseString(this.tokens[start + 1].value);

      return (new Parser().parse(this.tokens.slice(start + 1, end), true));
    }
    parseAttributes(start, end) {
      let classes = '';
      let id = '';
      let attrs = '';

      for (let i = start; i < end; i++) {
        const e = this.tokens[i];

        if (e.type === 'Symbol') {
          if (!['.', '#', '='].includes(e.value))
            this.throwSymbolError('[.,#,=]', e.value, e.line, e.pos);

          let peek = this.peek(i);
          if (peek.type === 'Symbol') throw new Error(`Not expecting symbols atfer a selector identifier. Error @ ${peek.line}:${peek.pos}`);

          if (e.value === '=') continue;
          if (e.value === '.') classes += ` ${peek.value}`;
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
              if (this.peek(i + 1).type === 'Word' || this.peek(i + 1).type === 'String') {
                if (this.peek(i + 1).type === 'String') {
                  attrs += ` ${e.value}=${this.peek(i + 1).value}`;
                }
                else {
                  attrs += ` ${e.value}="${this.peek(i + 1).value}"`;
                }
                i = i + 2;
              }
              else {
                throw new Error(`Expecting a key value pair for attribute @ ${e.line}:${e.pos}`);
              }
            }
            else {
              attrs += ` ${e.value}`;
            }
          }
        }
      }

      if (classes.length > 0) classes = ` class="${classes.trim()}"`;
      return `${id}${classes}${attrs}`;
    }
    parseString(value) {
      return value.substring(1, value.length - 1);
    }
    findClosingSymbol(closing, start) {
      let { line, pos, value } = this.tokens[start];

      if (!['{', '('].includes(value)) throw new Error(`Parser AST Error: Invalid identifier caught as symbol @ ${line}:${pos}`);

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
    throwError(type, expected, l, p) {
      throw new Error(`Parser Error: Invalid identifier '${type}', expecting ${expected} @ ${l}:${p}`);
    }
    throwSymbolError(expecting, actual, l, p) {
      throw new Error(`Expecting a '${expecting}' symbol @ ${l}:${p}, instead '${actual}' was recieved`);
    }
  });

  if (typeof module !== 'undefined' && 'exports' in module) {
    module.exports = ftHTMLParser;
  }
  else {
    this.ftHTMLParser = ftHTMLParser;
  }
})();