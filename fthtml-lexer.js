(function () {
  const ftHTMLexer = {};

  ftHTMLexer.TokenType = (Object.freeze({
    Keyword: 'Keyword',
    Symbol: 'Symbol',
    Word: 'Word',
    String: 'String'
  }));

  ftHTMLexer.Token = (class Token {
    constructor(type, line, pos, val) {
      this.type = type;
      this.value = val;
      this.line = line;
      this.pos = pos;
    }
    toString() {
      return String.format("T_%c(%s)", this.type, this.value, this.line, this.pos);
    }
  });

  ftHTMLexer.LexMode = (Object.freeze({
    Definition: 0,
    Directive: 1,
    LComment: 2,
    BComment: 3,
    String: 4
  }));

  ftHTMLexer.lexer = (class Lexer {
    constructor() {
      this.keywords = ['doctype', 'comment', 'import'];
      this.symbols = ['{', '}', '(', ')', '=', '.', '+', '#'];
      // this.directives = ['region'];
    }
    isValidChar(c) {
      return ((c >= 'a') && (c <= 'z') || ((c >= 'A') && (c <= 'Z')) || ((c >= '0') && (c <= '9')) || (c === '-') || (c === '_'));
    }
    tokenize(source) {
      let tokens = new Array();

      //strip line comments from source, we will leave block comments in, in order to maintain accurate line, pos references (this is on todo list)
      source = source.replace(/^[ ]*[\/]{2}.*$/gm, "");

      let mode = ftHTMLexer.LexMode.Definition;
      var buffer = "";
      let line = 1;
      let pos = 1;

      for (let c of source) {
        switch (mode) {
          case ftHTMLexer.LexMode.Definition: {
            if (this.isValidChar(c)) {
              buffer += c;
            }
            else {
              switch (c) {
                case '/':
                  buffer += c;
                  if (buffer.endsWith('//')) {
                    buffer = "";
                    mode = ftHTMLexer.LexMode.LComment;
                  }
                  break;
                case '*':
                  buffer += c;
                  if (buffer.endsWith('/*')) {
                    mode = ftHTMLexer.LexMode.BComment;
                  }
                  break;
                case '"':
                case "'":
                  if (buffer.length > 0) {
                    this.throwError(c, line, pos);
                  }
                  buffer += c;
                  mode = ftHTMLexer.LexMode.String;
                  break;
                default:
                  if (c === ' ' || c === '\n' || this.symbols.includes(c)) {
                    if (buffer.length > 0) {
                      if (c === '.') {
                        buffer += c;
                        break;
                      }

                      let _tokenType = ftHTMLexer.TokenType.Keyword;
                      if (!this.keywords.includes(buffer)) _tokenType = ftHTMLexer.TokenType.Word;
                      tokens.push(new ftHTMLexer.Token(_tokenType, line, pos - buffer.length, buffer));
                      buffer = "";
                    }
                    if (this.symbols.includes(c)) {
                      tokens.push(new ftHTMLexer.Token(ftHTMLexer.TokenType.Symbol, line, pos, c));
                    }
                    break;
                  }
                  else {
                    if (!['\t', '\r'].includes(c)) {
                      this.throwError(c, line, pos);
                    }
                  }
                  break;
              }
            }
          }
          case ftHTMLexer.LexMode.Directive: {
            //not implemented yet
            //directives for regions, version checking etc
            break;
          }
          case ftHTMLexer.LexMode.LComment: {
            if (c === '\n') {
              mode = ftHTMLexer.LexMode.Definition;
              buffer = "";
            }
            break;
          }
          case ftHTMLexer.LexMode.BComment: {
            buffer += c;
            if (buffer.endsWith("*/")) {
              mode = ftHTMLexer.LexMode.Definition;
              buffer = "";
            }
            break;
          }
          case ftHTMLexer.LexMode.String: {
            buffer += c;
            if (c === buffer.charAt(0)) {
              if ((!(buffer.endsWith("\\" + c))) != (buffer.endsWith("\\\\" + c))) {
                tokens.push(new ftHTMLexer.Token(ftHTMLexer.TokenType.String, line, pos - buffer.length + 1, buffer));
                buffer = "";
                mode = ftHTMLexer.LexMode.Definition;
              }
            }
            break;
          }
        }

        pos += 1;
        if (c !== '\n') continue;
        line += 1;
        pos = 1;
      }

      return tokens;
    }
    throwError(char, line, pos) {
      throw new Error(`ftHTMLexer Error: Invalid character '${char}' @ ${line}:${pos}`);
    }
  });

  if (typeof module !== 'undefined' && 'exports' in module) {
    module.exports = ftHTMLexer;
  }
  else {
    this.ftHTMLexer = ftHTMLexer;
  }
})();
