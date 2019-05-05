(function () {
  const { ftHTMLInvalidCharError } = require('../utils/exceptions/fthtml-exceptions');
  const ftHTMLexer = {};

  ftHTMLexer.TokenType = (Object.freeze({
    Keyword: 'Keyword',
    Pragma: 'Pragma',
    String: 'String',
    Symbol: 'Symbol',
    Variable: 'Variable',
    Word: 'Word',
    ELang: 'ELang',
    ElangB : 'ElangB'
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

  ftHTMLexer.LexMode = Object.freeze({
    Definition: 0,
    LComment: 1,
    BComment: 2,
    String: 3,
    Variable: 4,
    ELang: 5,
    ELangString: 6
  });

  ftHTMLexer.ElangProps = Object.seal({
    openBrace : 1,
    buffer : '',
    mode : null
  });

  ftHTMLexer.Lexer = (class Lexer {
    constructor() {
      this.keywords = ['doctype', 'comment', 'import', 'end'];
      this.elangs = {
        js : {
          stringSyms : ["'",'"','`']
        },
        css : {
          stringSyms : ["'",'"']
        },
        php : {
          stringSyms : ['"','"', '<<<']
        }
      }
      this.symbols = ['{', '}', '(', ')', '=', '.', '+', '#'];
      this.stringSyms = ['"', "'"];
      this.pragmas = ['vars'];
    }
    isValidLetter(c) {
      return ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z'));
    }
    isValidChar(c) {
      return (this.isValidLetter(c) || (c >= '0' && c <= '9') || c === '-' || c === '_');
    }
    tokenize(source) {
      let tokens = new Array();

      //strip line comments from source, we will leave block comments in, in order to maintain accurate line, pos references (this is on todo list)
      source = source.replace(/^[ ]*[\/]{2}.*$/gm, "");

      let mode = ftHTMLexer.LexMode.Definition;
      var buffer = "";
      let line = 1;
      let pos = 1;

      for (let c of source + " ") {
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
                  if (buffer.endsWith('/*')) mode = ftHTMLexer.LexMode.BComment;

                  break;
                case '"':
                case "'":
                  if (buffer.length > 0) throw new ftHTMLInvalidCharError(c, line, pos);

                  buffer += c;
                  mode = ftHTMLexer.LexMode.String;
                  break;
                case '@':
                  if (buffer.length > 0) throw new ftHTMLInvalidCharError(c, line, pos);

                  buffer += c;
                  mode = ftHTMLexer.LexMode.Variable;
                  break;
                default:
                  if (c === ' ' || c === '\n' || this.symbols.includes(c)) {
                    if (buffer.length > 0) {
                      if (c === '.') {
                        buffer += c;
                        break;
                      }

                      if (buffer.length === 1 && ['/', '*'].includes(buffer)) throw new ftHTMLInvalidCharError(buffer, line, pos-1);
                      tokens.push(new ftHTMLexer.Token(this.getTokenType(buffer), line, pos - buffer.length, buffer));
                      buffer = "";
                    }
                    if (this.symbols.includes(c)) {
                      tokens.push(new ftHTMLexer.Token(ftHTMLexer.TokenType.Symbol, line, pos, c));
                      if (c === '{' && tokens[tokens.length-2]) {
                        if (tokens[tokens.length - 2].type === ftHTMLexer.TokenType.ELang) {
                          ftHTMLexer.ElangProps.mode = tokens[tokens.length-2].value;
                          mode = ftHTMLexer.LexMode.ELang; 
                        }
                      }
                    }
                    break;
                  }
                  else {
                    if (!['\t', '\r'].includes(c)) throw new ftHTMLInvalidCharError(c, line, pos);
                    continue;
                  }
              }
            }
            break;
          }
          case ftHTMLexer.LexMode.ELang: {
            if (c === '}' && !buffer.endsWith('\\}') && !buffer.endsWith('\\\\}')) {
              ftHTMLexer.ElangProps.openBrace--;
              
              if (ftHTMLexer.ElangProps.openBrace === 0) {
                tokens.push(new ftHTMLexer.Token(ftHTMLexer.TokenType.ElangB, tokens[tokens.length -2].line, tokens[tokens.length - 2].pos, buffer));
                tokens.push(new ftHTMLexer.Token(ftHTMLexer.TokenType.Symbol, line, pos, c));
                
                buffer = '';
                mode = ftHTMLexer.LexMode.Definition;
                ftHTMLexer.ElangProps.openBrace = 1;
                continue;
              }
            }

            buffer += c;

            if (c === '{' && !buffer.endsWith('\\{') && !buffer.endsWith('\\\\{')) {
              ftHTMLexer.ElangProps.openBrace++;
            }

            if (this.elangs[ftHTMLexer.ElangProps.mode].stringSyms.includes(c)) {
                mode = ftHTMLexer.LexMode.ELangString;
                ftHTMLexer.ElangProps.buffer = c;
            }
            if (ftHTMLexer.ElangProps.mode === 'php' && buffer.endsWith('<<<') && !buffer.endsWith('\\<<<') && !buffer.endsWith('\\\\<<<')) {
              mode = ftHTMLexer.LexMode.ELangString;
              ftHTMLexer.ElangProps.buffer = "<<<";
            }
            break;
          }
          case ftHTMLexer.LexMode.ELangString: {
            buffer += c;
            ftHTMLexer.ElangProps.buffer += c;
            
            if (ftHTMLexer.ElangProps.mode === 'php' && ftHTMLexer.ElangProps.buffer.startsWith('<<<')) {
              if (/<<<([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)[\r\n]+.*?[\r\n]+\1;[\r\n]+/gs.test(ftHTMLexer.ElangProps.buffer) ||
                  /<<<(['"])([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)\1[\r\n]+.*?[\r\n]+\2;[\r\n]+/gs.test(ftHTMLexer.ElangProps.buffer)) {
                  mode = ftHTMLexer.LexMode.ELang;
                }
            }
            else {
              if (c === ftHTMLexer.ElangProps.buffer.charAt(0)) {
                if ((!(ftHTMLexer.ElangProps.buffer.endsWith("\\" + c))) != (ftHTMLexer.ElangProps.buffer.endsWith("\\\\" + c)))
                  mode = ftHTMLexer.LexMode.ELang;
              }
            }
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
          case ftHTMLexer.LexMode.Variable: {
            if (c === ' ' || c === '\n') {
              tokens.push(new ftHTMLexer.Token(ftHTMLexer.TokenType.Variable, line, pos - buffer.length, buffer));
              mode = ftHTMLexer.LexMode.Definition;
              buffer = "";
            }
            else {
              if (!this.isValidChar(c)) {
                if (this.symbols.includes(c)) {
                  tokens.push(new ftHTMLexer.Token(ftHTMLexer.TokenType.Variable, line, pos - buffer.length, buffer));
                  tokens.push(new ftHTMLexer.Token(ftHTMLexer.TokenType.Symbol, line, pos, c));
                  mode = ftHTMLexer.LexMode.Definition;
                  buffer = "";
                  break;
                }
                if (!['\t', '\r'].includes(c)) throw new ftHTMLInvalidCharError(c, line, pos);
              }

              if (!['\t', '\r'].includes(c)) buffer += c;
            }
          }
        }

        pos += 1;
        if (c !== '\n') continue;
        line += 1;
        pos = 1;
      }

      return tokens;
    }
    getTokenType(val) {
      //assumes value is > 0 length
      if (this.elangs[val]) return ftHTMLexer.TokenType.ELang;
      if (this.symbols.includes(val)) return ftHTMLexer.TokenType.Symbol;
      if (this.keywords.includes(val)) return ftHTMLexer.TokenType.Keyword;
      if (this.pragmas.includes(val)) return ftHTMLexer.TokenType.Pragma;
      if (this.stringSyms.includes(val.charAt(0)) && (val.substr(-1) === val.charAt(0)))
        return ftHTMLexer.TokenType.String;

      return ftHTMLexer.TokenType.Word;
    }
  });

  module.exports = ftHTMLexer;
})();
