(function() {

  Error.stackTraceLimit = 0;
  
  class ftHTMLexerError extends Error {
    constructor(message, line, pos, stackTrace = []) {
      super();
      this.name = this.constructor.name;
      this.stack = undefined;
      this.position = {
        line : line,
        start: pos
      }
      stackTrace[0].pos = { line: this.position.line, start: this.position.start };
      this.message = `${message}
    ${stackTrace.map(m => `at ${m.caller == null ? '' : m.caller + ' '}(${m.file}:${m.pos.line}:${m.pos.start})`).join("\n    ")}`;
    }
  }

  class ftHTMLInvalidCharError extends ftHTMLexerError {
    constructor(char, line, pos, stackTrace = []) {
      super(`Invalid character '${char}'`, line, pos, stackTrace);
    }
  }

  class ftHTMLParserError extends Error {
    constructor(message, token, stackTrace = []) {
      super();
      this.name = this.constructor.name;
      this.stack = undefined;
      this.position = {
        line: token.line,
        start: token.pos,
        end: token.pos + token.value.length
      };
      stackTrace[0].pos = { line : token.line, start : token.pos };
      this.message = `${message}
    ${stackTrace.map(m => `at ${m.caller == null ? '' : m.caller + ' '}(${m.file}:${m.pos.line}:${m.pos.start})`).join("\n    ")}`;
    }
  }

  class ftHTMLInvalidTypeError extends ftHTMLParserError {
    constructor(token, expecting, stackTrace = []) {
      super(`Invalid type '${token.type}'. Expecting ${expecting}`, token, stackTrace);
      this.expecting = expecting;
      this.actual = token.type;
    }
  }

  class ftHTMLInvalidParentElementError extends ftHTMLParserError {
    constructor(token, stackTrace = []) {
      super(`A ${token.type} can not be a parent element, have children or attributes`, token, stackTrace);
    }
  }

  class ftHTMLIncompleteElementError extends ftHTMLParserError {
    constructor(token, actual, expecting, stackTrace = []) {
      super(`${token.type}'s require ${expecting}`,token, stackTrace);
      this.actual = actual.value;
    }
  }

  class ftHTMLInvalidKeywordError extends ftHTMLParserError {
    constructor(token,stackTrace = []) {
      super(`Invalid, unknown or not allowed keyword '${token.value}'`, token, stackTrace);
    }
  }

  class ftHTMLInvalidElementNameError extends ftHTMLParserError {
    constructor(token, expecting, stackTrace = []) {
      super(`Invalid element name '${token.value}', expecting ${expecting}`,token, stackTrace);
    }
  }

  class ftHTMLInvalidVariableNameError extends ftHTMLParserError {
    constructor(token, expecting, stackTrace = []) {
      super(`Invalid variable name '${token.value}', when declaring a variable, the following pattern should be honored: ${expecting}`, token, stackTrace);
    }
  }

  class ftHTMLVariableDoesntExistError extends ftHTMLParserError {
    constructor(token, stackTrace = []) {
      super(`The variable '${token.value.substring(1)}' has not been declared`, token, stackTrace);
    }
  }

  class ftHTMLImportError extends Error {
    constructor(message, stackTrace = []) {
      super();
      this.name = this.constructor.name;
      this.stack = undefined;
      this.message = `${message}
    ${stackTrace.map(m => `at ${m.caller == null ? '' : m.caller + ' '}(${m.file}:${m.pos.line}:${m.pos.start})`).join("\n    ")}`;
    }
  }

  module.exports = {
    ftHTMLexerError,
    ftHTMLInvalidCharError,
    ftHTMLParserError,
    ftHTMLInvalidTypeError,
    ftHTMLInvalidParentElementError,
    ftHTMLIncompleteElementError,
    ftHTMLInvalidKeywordError,
    ftHTMLInvalidElementNameError,
    ftHTMLInvalidVariableNameError,
    ftHTMLVariableDoesntExistError,
    ftHTMLImportError
  }

})();