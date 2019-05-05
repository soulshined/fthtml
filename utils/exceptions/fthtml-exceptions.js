(function() {
  class ftHTMLError {
    constructor(error, stack = []) {
      this.name = error.name;
      this.message = error.message || '';
      this.stack = stack;
      this.nestedException = error;
      this.position = error.position;
    }

    toString() {
      let position = this.position.line;
      
      if (this.position.start) position += `:${this.position.start}`;
      if (this.position.end) position += `-${this.position.end}`;

      if (this.stack.length > 0)
        this.stack[0] = `${this.stack[0]}:${position}`;
      
      return `${this.name}: ${this.message}
    ${this.stack.map(f => `at ${f}`).join('\n    ')}`;
    }
  }

  class ftHTMLexerError {
    constructor(message, line, pos) {
      this.name = this.constructor.name;
      this.message = message;
      this.position = {
        line : line,
        start: pos
      }
    }
  }

  class ftHTMLInvalidCharError extends ftHTMLexerError {
    constructor(char, line, pos) {
      super(`Invalid character '${char}'`, line, pos);
    }
  }

  class ftHTMLParserError {
    constructor(message, token) {
      this.name = this.constructor.name;
      this.message = message;
      this.position = {
        line : token.line,
        start: token.pos,
        end : token.pos+token.value.length
      };
    }
  }

  class ftHTMLInvalidTypeError extends ftHTMLParserError {
    constructor(token, expecting) {
      super(`Invalid type '${token.type}'. Expecting ${expecting}`, token);
      this.expecting = expecting;
      this.actual = token.type;
    }
  }

  class ftHTMLInvalidParentElementError extends ftHTMLParserError {
    constructor(token) {
      super(`A ${token.type} can not be a parent element, have children or attributes`, token);
    }
  }

  class ftHTMLIncompleteElementError extends ftHTMLParserError {
    constructor(token, actual, expecting) {
      super(`${token.type}'s require ${expecting}`,token);
      this.actual = actual.value;
    }
  }

  class ftHTMLInvalidKeywordError extends ftHTMLParserError {
    constructor(token) {
      super(`Invalid or unknown keyword '${token.value}`, token);
    }
  }

  class ftHTMLInvalidElementNameError extends ftHTMLParserError {
    constructor(token, expecting) {
      super(`Invalid element name '${token.value}', expecting ${expecting}`,token);
    }
  }

  class ftHTMLInvalidVariableNameError extends ftHTMLParserError {
    constructor(token, expecting) {
      super(`Invalid variable name '${token.value}', when declaring a variable, the following pattern should be honored: ${expecting}`, token);
    }
  }

  class ftHTMLVariableDoesntExistError extends ftHTMLParserError {
    constructor(token) {
      super(`The variable '${token.value.substring(1)}' has not been declared`, token);
    }
  }

  class ftHTMLImportError extends ftHTMLexerError {
    constructor(message) {
      super(message, undefined, undefined);
    }
  }

  module.exports = {
    ftHTMLError,
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