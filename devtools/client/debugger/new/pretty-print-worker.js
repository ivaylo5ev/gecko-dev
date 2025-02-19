var Debugger =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/public/build";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ({

/***/ 0:
/***/ function(module, exports, __webpack_require__) {

	var prettyFast = __webpack_require__(366);
	
	self.onmessage = function (msg) {
	  var _prettyPrint = prettyPrint(msg.data);
	
	  var code = _prettyPrint.code;
	  var mappings = _prettyPrint.mappings;
	
	  mappings = invertMappings(mappings);
	  self.postMessage({ code, mappings });
	};
	
	function prettyPrint(_ref) {
	  var url = _ref.url;
	  var indent = _ref.indent;
	  var source = _ref.source;
	
	  try {
	    var prettified = prettyFast(source, {
	      url: url,
	      indent: " ".repeat(indent)
	    });
	
	    return {
	      code: prettified.code,
	      mappings: prettified.map._mappings
	    };
	  } catch (e) {
	    return new Error(e.message + "\n" + e.stack);
	  }
	}
	
	function invertMappings(mappings) {
	  return mappings._array.map(m => {
	    var mapping = {
	      generated: {
	        line: m.originalLine,
	        column: m.originalColumn
	      }
	    };
	    if (m.source) {
	      mapping.source = m.source;
	      mapping.original = {
	        line: m.generatedLine,
	        column: m.generatedColumn
	      };
	      mapping.name = m.name;
	    }
	    return mapping;
	  });
	}

/***/ },

/***/ 366:
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_RESULT__;/* -*- indent-tabs-mode: nil; js-indent-level: 2; fill-column: 80 -*- */
	/*
	 * Copyright 2013 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE.md or:
	 * http://opensource.org/licenses/BSD-2-Clause
	 */
	(function (root, factory) {
	  "use strict";
	
	  if (true) {
	    !(__WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.call(exports, __webpack_require__, exports, module)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  } else if (typeof exports === "object") {
	    module.exports = factory();
	  } else {
	    root.prettyFast = factory();
	  }
	}(this, function () {
	  "use strict";
	
	  var acorn = this.acorn || __webpack_require__(367);
	  var sourceMap = this.sourceMap || __webpack_require__(368);
	  var SourceNode = sourceMap.SourceNode;
	
	  // If any of these tokens are seen before a "[" token, we know that "[" token
	  // is the start of an array literal, rather than a property access.
	  //
	  // The only exception is "}", which would need to be disambiguated by
	  // parsing. The majority of the time, an open bracket following a closing
	  // curly is going to be an array literal, so we brush the complication under
	  // the rug, and handle the ambiguity by always assuming that it will be an
	  // array literal.
	  var PRE_ARRAY_LITERAL_TOKENS = {
	    "typeof": true,
	    "void": true,
	    "delete": true,
	    "case": true,
	    "do": true,
	    "=": true,
	    "in": true,
	    "{": true,
	    "*": true,
	    "/": true,
	    "%": true,
	    "else": true,
	    ";": true,
	    "++": true,
	    "--": true,
	    "+": true,
	    "-": true,
	    "~": true,
	    "!": true,
	    ":": true,
	    "?": true,
	    ">>": true,
	    ">>>": true,
	    "<<": true,
	    "||": true,
	    "&&": true,
	    "<": true,
	    ">": true,
	    "<=": true,
	    ">=": true,
	    "instanceof": true,
	    "&": true,
	    "^": true,
	    "|": true,
	    "==": true,
	    "!=": true,
	    "===": true,
	    "!==": true,
	    ",": true,
	
	    "}": true
	  };
	
	  /**
	   * Determines if we think that the given token starts an array literal.
	   *
	   * @param Object token
	   *        The token we want to determine if it is an array literal.
	   * @param Object lastToken
	   *        The last token we added to the pretty printed results.
	   *
	   * @returns Boolean
	   *          True if we believe it is an array literal, false otherwise.
	   */
	  function isArrayLiteral(token, lastToken) {
	    if (token.type.type != "[") {
	      return false;
	    }
	    if (!lastToken) {
	      return true;
	    }
	    if (lastToken.type.isAssign) {
	      return true;
	    }
	    return !!PRE_ARRAY_LITERAL_TOKENS[
	      lastToken.type.keyword || lastToken.type.type
	    ];
	  }
	
	  // If any of these tokens are followed by a token on a new line, we know that
	  // ASI cannot happen.
	  var PREVENT_ASI_AFTER_TOKENS = {
	    // Binary operators
	    "*": true,
	    "/": true,
	    "%": true,
	    "+": true,
	    "-": true,
	    "<<": true,
	    ">>": true,
	    ">>>": true,
	    "<": true,
	    ">": true,
	    "<=": true,
	    ">=": true,
	    "instanceof": true,
	    "in": true,
	    "==": true,
	    "!=": true,
	    "===": true,
	    "!==": true,
	    "&": true,
	    "^": true,
	    "|": true,
	    "&&": true,
	    "||": true,
	    ",": true,
	    ".": true,
	    "=": true,
	    "*=": true,
	    "/=": true,
	    "%=": true,
	    "+=": true,
	    "-=": true,
	    "<<=": true,
	    ">>=": true,
	    ">>>=": true,
	    "&=": true,
	    "^=": true,
	    "|=": true,
	    // Unary operators
	    "delete": true,
	    "void": true,
	    "typeof": true,
	    "~": true,
	    "!": true,
	    "new": true,
	    // Function calls and grouped expressions
	    "(": true
	  };
	
	  // If any of these tokens are on a line after the token before it, we know
	  // that ASI cannot happen.
	  var PREVENT_ASI_BEFORE_TOKENS = {
	    // Binary operators
	    "*": true,
	    "/": true,
	    "%": true,
	    "<<": true,
	    ">>": true,
	    ">>>": true,
	    "<": true,
	    ">": true,
	    "<=": true,
	    ">=": true,
	    "instanceof": true,
	    "in": true,
	    "==": true,
	    "!=": true,
	    "===": true,
	    "!==": true,
	    "&": true,
	    "^": true,
	    "|": true,
	    "&&": true,
	    "||": true,
	    ",": true,
	    ".": true,
	    "=": true,
	    "*=": true,
	    "/=": true,
	    "%=": true,
	    "+=": true,
	    "-=": true,
	    "<<=": true,
	    ">>=": true,
	    ">>>=": true,
	    "&=": true,
	    "^=": true,
	    "|=": true,
	    // Function calls
	    "(": true
	  };
	
	  /**
	   * Determines if Automatic Semicolon Insertion (ASI) occurs between these
	   * tokens.
	   *
	   * @param Object token
	   *        The current token.
	   * @param Object lastToken
	   *        The last token we added to the pretty printed results.
	   *
	   * @returns Boolean
	   *          True if we believe ASI occurs.
	   */
	  function isASI(token, lastToken) {
	    if (!lastToken) {
	      return false;
	    }
	    if (token.startLoc.line === lastToken.startLoc.line) {
	      return false;
	    }
	    if (PREVENT_ASI_AFTER_TOKENS[
	      lastToken.type.type || lastToken.type.keyword
	    ]) {
	      return false;
	    }
	    if (PREVENT_ASI_BEFORE_TOKENS[token.type.type || token.type.keyword]) {
	      return false;
	    }
	    return true;
	  }
	
	  /**
	   * Determine if we have encountered a getter or setter.
	   *
	   * @param Object token
	   *        The current token. If this is a getter or setter, it would be the
	   *        property name.
	   * @param Object lastToken
	   *        The last token we added to the pretty printed results. If this is a
	   *        getter or setter, it would be the `get` or `set` keyword
	   *        respectively.
	   * @param Array stack
	   *        The stack of open parens/curlies/brackets/etc.
	   *
	   * @returns Boolean
	   *          True if this is a getter or setter.
	   */
	  function isGetterOrSetter(token, lastToken, stack) {
	    return stack[stack.length - 1] == "{"
	      && lastToken
	      && lastToken.type.type == "name"
	      && (lastToken.value == "get" || lastToken.value == "set")
	      && token.type.type == "name";
	  }
	
	  /**
	   * Determine if we should add a newline after the given token.
	   *
	   * @param Object token
	   *        The token we are looking at.
	   * @param Array stack
	   *        The stack of open parens/curlies/brackets/etc.
	   *
	   * @returns Boolean
	   *          True if we should add a newline.
	   */
	  function isLineDelimiter(token, stack) {
	    if (token.isArrayLiteral) {
	      return true;
	    }
	    var ttt = token.type.type;
	    var top = stack[stack.length - 1];
	    return ttt == ";" && top != "("
	      || ttt == "{"
	      || ttt == "," && top != "("
	      || ttt == ":" && (top == "case" || top == "default");
	  }
	
	  /**
	   * Append the necessary whitespace to the result after we have added the given
	   * token.
	   *
	   * @param Object token
	   *        The token that was just added to the result.
	   * @param Function write
	   *        The function to write to the pretty printed results.
	   * @param Array stack
	   *        The stack of open parens/curlies/brackets/etc.
	   *
	   * @returns Boolean
	   *          Returns true if we added a newline to result, false in all other
	   *          cases.
	   */
	  function appendNewline(token, write, stack) {
	    if (isLineDelimiter(token, stack)) {
	      write("\n", token.startLoc.line, token.startLoc.column);
	      return true;
	    }
	    return false;
	  }
	
	  /**
	   * Determines if we need to add a space between the last token we added and
	   * the token we are about to add.
	   *
	   * @param Object token
	   *        The token we are about to add to the pretty printed code.
	   * @param Object lastToken
	   *        The last token added to the pretty printed code.
	   */
	  function needsSpaceAfter(token, lastToken) {
	    if (lastToken) {
	      if (lastToken.type.isLoop) {
	        return true;
	      }
	      if (lastToken.type.isAssign) {
	        return true;
	      }
	      if (lastToken.type.binop != null) {
	        return true;
	      }
	
	      var ltt = lastToken.type.type;
	      if (ltt == "?") {
	        return true;
	      }
	      if (ltt == ":") {
	        return true;
	      }
	      if (ltt == ",") {
	        return true;
	      }
	      if (ltt == ";") {
	        return true;
	      }
	
	      var ltk = lastToken.type.keyword;
	      if (ltk != null) {
	        if (ltk == "break" || ltk == "continue" || ltk == "return") {
	          return token.type.type != ";";
	        }
	        if (ltk != "debugger"
	            && ltk != "null"
	            && ltk != "true"
	            && ltk != "false"
	            && ltk != "this"
	            && ltk != "default") {
	          return true;
	        }
	      }
	
	      if (ltt == ")" && (token.type.type != ")"
	                         && token.type.type != "]"
	                         && token.type.type != ";"
	                         && token.type.type != ","
	                         && token.type.type != ".")) {
	        return true;
	      }
	    }
	
	    if (token.type.isAssign) {
	      return true;
	    }
	    if (token.type.binop != null) {
	      return true;
	    }
	    if (token.type.type == "?") {
	      return true;
	    }
	
	    return false;
	  }
	
	  /**
	   * Add the required whitespace before this token, whether that is a single
	   * space, newline, and/or the indent on fresh lines.
	   *
	   * @param Object token
	   *        The token we are about to add to the pretty printed code.
	   * @param Object lastToken
	   *        The last token we added to the pretty printed code.
	   * @param Boolean addedNewline
	   *        Whether we added a newline after adding the last token to the pretty
	   *        printed code.
	   * @param Function write
	   *        The function to write pretty printed code to the result SourceNode.
	   * @param Object options
	   *        The options object.
	   * @param Number indentLevel
	   *        The number of indents deep we are.
	   * @param Array stack
	   *        The stack of open curlies, brackets, etc.
	   */
	  function prependWhiteSpace(token, lastToken, addedNewline, write, options,
	                             indentLevel, stack) {
	    var ttk = token.type.keyword;
	    var ttt = token.type.type;
	    var newlineAdded = addedNewline;
	    var ltt = lastToken ? lastToken.type.type : null;
	
	    // Handle whitespace and newlines after "}" here instead of in
	    // `isLineDelimiter` because it is only a line delimiter some of the
	    // time. For example, we don't want to put "else if" on a new line after
	    // the first if's block.
	    if (lastToken && ltt == "}") {
	      if (ttk == "while" && stack[stack.length - 1] == "do") {
	        write(" ",
	              lastToken.startLoc.line,
	              lastToken.startLoc.column);
	      } else if (ttk == "else" ||
	                 ttk == "catch" ||
	                 ttk == "finally") {
	        write(" ",
	              lastToken.startLoc.line,
	              lastToken.startLoc.column);
	      } else if (ttt != "(" &&
	                 ttt != ";" &&
	                 ttt != "," &&
	                 ttt != ")" &&
	                 ttt != ".") {
	        write("\n",
	              lastToken.startLoc.line,
	              lastToken.startLoc.column);
	        newlineAdded = true;
	      }
	    }
	
	    if (isGetterOrSetter(token, lastToken, stack)) {
	      write(" ",
	            lastToken.startLoc.line,
	            lastToken.startLoc.column);
	    }
	
	    if (ttt == ":" && stack[stack.length - 1] == "?") {
	      write(" ",
	            lastToken.startLoc.line,
	            lastToken.startLoc.column);
	    }
	
	    if (lastToken && ltt != "}" && ttk == "else") {
	      write(" ",
	            lastToken.startLoc.line,
	            lastToken.startLoc.column);
	    }
	
	    function ensureNewline() {
	      if (!newlineAdded) {
	        write("\n",
	              lastToken.startLoc.line,
	              lastToken.startLoc.column);
	        newlineAdded = true;
	      }
	    }
	
	    if (isASI(token, lastToken)) {
	      ensureNewline();
	    }
	
	    if (decrementsIndent(ttt, stack)) {
	      ensureNewline();
	    }
	
	    if (newlineAdded) {
	      if (ttk == "case" || ttk == "default") {
	        write(repeat(options.indent, indentLevel - 1),
	              token.startLoc.line,
	              token.startLoc.column);
	      } else {
	        write(repeat(options.indent, indentLevel),
	              token.startLoc.line,
	              token.startLoc.column);
	      }
	    } else if (needsSpaceAfter(token, lastToken)) {
	      write(" ",
	            lastToken.startLoc.line,
	            lastToken.startLoc.column);
	    }
	  }
	
	  /**
	   * Repeat the `str` string `n` times.
	   *
	   * @param String str
	   *        The string to be repeated.
	   * @param Number n
	   *        The number of times to repeat the string.
	   *
	   * @returns String
	   *          The repeated string.
	   */
	  function repeat(str, n) {
	    var result = "";
	    while (n > 0) {
	      if (n & 1) {
	        result += str;
	      }
	      n >>= 1;
	      str += str;
	    }
	    return result;
	  }
	
	  /**
	   * Make sure that we output the escaped character combination inside string
	   * literals instead of various problematic characters.
	   */
	  var sanitize = (function () {
	    var escapeCharacters = {
	      // Backslash
	      "\\": "\\\\",
	      // Newlines
	      "\n": "\\n",
	      // Carriage return
	      "\r": "\\r",
	      // Tab
	      "\t": "\\t",
	      // Vertical tab
	      "\v": "\\v",
	      // Form feed
	      "\f": "\\f",
	      // Null character
	      "\0": "\\0",
	      // Single quotes
	      "'": "\\'"
	    };
	
	    var regExpString = "("
	      + Object.keys(escapeCharacters)
	              .map(function (c) { return escapeCharacters[c]; })
	              .join("|")
	      + ")";
	    var escapeCharactersRegExp = new RegExp(regExpString, "g");
	
	    return function (str) {
	      return str.replace(escapeCharactersRegExp, function (_, c) {
	        return escapeCharacters[c];
	      });
	    };
	  }());
	  /**
	   * Add the given token to the pretty printed results.
	   *
	   * @param Object token
	   *        The token to add.
	   * @param Function write
	   *        The function to write pretty printed code to the result SourceNode.
	   */
	  function addToken(token, write) {
	    if (token.type.type == "string") {
	      write("'" + sanitize(token.value) + "'",
	            token.startLoc.line,
	            token.startLoc.column);
	    } else if (token.type.type == "regexp") {
	      write(String(token.value.value),
	            token.startLoc.line,
	            token.startLoc.column);
	    } else {
	      write(String(token.value != null ? token.value : token.type.type),
	            token.startLoc.line,
	            token.startLoc.column);
	    }
	  }
	
	  /**
	   * Returns true if the given token type belongs on the stack.
	   */
	  function belongsOnStack(token) {
	    var ttt = token.type.type;
	    var ttk = token.type.keyword;
	    return ttt == "{"
	      || ttt == "("
	      || ttt == "["
	      || ttt == "?"
	      || ttk == "do"
	      || ttk == "switch"
	      || ttk == "case"
	      || ttk == "default";
	  }
	
	  /**
	   * Returns true if the given token should cause us to pop the stack.
	   */
	  function shouldStackPop(token, stack) {
	    var ttt = token.type.type;
	    var ttk = token.type.keyword;
	    var top = stack[stack.length - 1];
	    return ttt == "]"
	      || ttt == ")"
	      || ttt == "}"
	      || (ttt == ":" && (top == "case" || top == "default" || top == "?"))
	      || (ttk == "while" && top == "do");
	  }
	
	  /**
	   * Returns true if the given token type should cause us to decrement the
	   * indent level.
	   */
	  function decrementsIndent(tokenType, stack) {
	    return tokenType == "}"
	      || (tokenType == "]" && stack[stack.length - 1] == "[\n");
	  }
	
	  /**
	   * Returns true if the given token should cause us to increment the indent
	   * level.
	   */
	  function incrementsIndent(token) {
	    return token.type.type == "{"
	      || token.isArrayLiteral
	      || token.type.keyword == "switch";
	  }
	
	  /**
	   * Add a comment to the pretty printed code.
	   *
	   * @param Function write
	   *        The function to write pretty printed code to the result SourceNode.
	   * @param Number indentLevel
	   *        The number of indents deep we are.
	   * @param Object options
	   *        The options object.
	   * @param Boolean block
	   *        True if the comment is a multiline block style comment.
	   * @param String text
	   *        The text of the comment.
	   * @param Number line
	   *        The line number to comment appeared on.
	   * @param Number column
	   *        The column number the comment appeared on.
	   */
	  function addComment(write, indentLevel, options, block, text, line, column) {
	    var indentString = repeat(options.indent, indentLevel);
	
	    write(indentString, line, column);
	    if (block) {
	      write("/*");
	      write(text
	            .split(new RegExp("/\n" + indentString + "/", "g"))
	            .join("\n" + indentString));
	      write("*/");
	    } else {
	      write("//");
	      write(text);
	    }
	    write("\n");
	  }
	
	  /**
	   * The main function.
	   *
	   * @param String input
	   *        The ugly JS code we want to pretty print.
	   * @param Object options
	   *        The options object. Provides configurability of the pretty
	   *        printing. Properties:
	   *          - url: The URL string of the ugly JS code.
	   *          - indent: The string to indent code by.
	   *
	   * @returns Object
	   *          An object with the following properties:
	   *            - code: The pretty printed code string.
	   *            - map: A SourceMapGenerator instance.
	   */
	  return function prettyFast(input, options) {
	    // The level of indents deep we are.
	    var indentLevel = 0;
	
	    // We will accumulate the pretty printed code in this SourceNode.
	    var result = new SourceNode();
	
	    /**
	     * Write a pretty printed string to the result SourceNode.
	     *
	     * We buffer our writes so that we only create one mapping for each line in
	     * the source map. This enhances performance by avoiding extraneous mapping
	     * serialization, and flattening the tree that
	     * `SourceNode#toStringWithSourceMap` will have to recursively walk. When
	     * timing how long it takes to pretty print jQuery, this optimization
	     * brought the time down from ~390 ms to ~190ms!
	     *
	     * @param String str
	     *        The string to be added to the result.
	     * @param Number line
	     *        The line number the string came from in the ugly source.
	     * @param Number column
	     *        The column number the string came from in the ugly source.
	     */
	    var write = (function () {
	      var buffer = [];
	      var bufferLine = -1;
	      var bufferColumn = -1;
	      return function write(str, line, column) {
	        if (line != null && bufferLine === -1) {
	          bufferLine = line;
	        }
	        if (column != null && bufferColumn === -1) {
	          bufferColumn = column;
	        }
	        buffer.push(str);
	
	        if (str == "\n") {
	          var lineStr = "";
	          for (var i = 0, len = buffer.length; i < len; i++) {
	            lineStr += buffer[i];
	          }
	          result.add(new SourceNode(bufferLine, bufferColumn, options.url,
	                                    lineStr));
	          buffer.splice(0, buffer.length);
	          bufferLine = -1;
	          bufferColumn = -1;
	        }
	      };
	    }());
	
	    // Whether or not we added a newline on after we added the last token.
	    var addedNewline = false;
	
	    // The current token we will be adding to the pretty printed code.
	    var token;
	
	    // Shorthand for token.type.type, so we don't have to repeatedly access
	    // properties.
	    var ttt;
	
	    // Shorthand for token.type.keyword, so we don't have to repeatedly access
	    // properties.
	    var ttk;
	
	    // The last token we added to the pretty printed code.
	    var lastToken;
	
	    // Stack of token types/keywords that can affect whether we want to add a
	    // newline or a space. We can make that decision based on what token type is
	    // on the top of the stack. For example, a comma in a parameter list should
	    // be followed by a space, while a comma in an object literal should be
	    // followed by a newline.
	    //
	    // Strings that go on the stack:
	    //
	    //   - "{"
	    //   - "("
	    //   - "["
	    //   - "[\n"
	    //   - "do"
	    //   - "?"
	    //   - "switch"
	    //   - "case"
	    //   - "default"
	    //
	    // The difference between "[" and "[\n" is that "[\n" is used when we are
	    // treating "[" and "]" tokens as line delimiters and should increment and
	    // decrement the indent level when we find them.
	    var stack = [];
	
	    // Acorn's tokenizer will always yield comments *before* the token they
	    // follow (unless the very first thing in the source is a comment), so we
	    // have to queue the comments in order to pretty print them in the correct
	    // location. For example, the source file:
	    //
	    //     foo
	    //     // a
	    //     // b
	    //     bar
	    //
	    // When tokenized by acorn, gives us the following token stream:
	    //
	    //     [ '// a', '// b', foo, bar ]
	    var commentQueue = [];
	
	    var getToken = acorn.tokenize(input, {
	      locations: true,
	      sourceFile: options.url,
	      onComment: function (block, text, start, end, startLoc, endLoc) {
	        if (lastToken) {
	          commentQueue.push({
	            block: block,
	            text: text,
	            line: startLoc.line,
	            column: startLoc.column,
	            trailing: lastToken.endLoc.line == startLoc.line
	          });
	        } else {
	          addComment(write, indentLevel, options, block, text, startLoc.line,
	                     startLoc.column);
	          addedNewline = true;
	        }
	      }
	    });
	
	    for (;;) {
	      token = getToken();
	
	      ttk = token.type.keyword;
	      ttt = token.type.type;
	
	      if (ttt == "eof") {
	        if (!addedNewline) {
	          write("\n");
	        }
	        break;
	      }
	
	      token.isArrayLiteral = isArrayLiteral(token, lastToken);
	
	      if (belongsOnStack(token)) {
	        if (token.isArrayLiteral) {
	          stack.push("[\n");
	        } else {
	          stack.push(ttt || ttk);
	        }
	      }
	
	      if (decrementsIndent(ttt, stack)) {
	        indentLevel--;
	        if (ttt == "}"
	            && stack.length > 1
	            && stack[stack.length - 2] == "switch") {
	          indentLevel--;
	        }
	      }
	
	      prependWhiteSpace(token, lastToken, addedNewline, write, options,
	                        indentLevel, stack);
	      addToken(token, write);
	      if (commentQueue.length === 0 || !commentQueue[0].trailing) {
	        addedNewline = appendNewline(token, write, stack);
	      }
	
	      if (shouldStackPop(token, stack)) {
	        stack.pop();
	        if (token == "}" && stack.length
	            && stack[stack.length - 1] == "switch") {
	          stack.pop();
	        }
	      }
	
	      if (incrementsIndent(token)) {
	        indentLevel++;
	      }
	
	      // Acorn's tokenizer re-uses tokens, so we have to copy the last token on
	      // every iteration. We follow acorn's lead here, and reuse the lastToken
	      // object the same way that acorn reuses the token object. This allows us
	      // to avoid allocations and minimize GC pauses.
	      if (!lastToken) {
	        lastToken = { startLoc: {}, endLoc: {} };
	      }
	      lastToken.start = token.start;
	      lastToken.end = token.end;
	      lastToken.startLoc.line = token.startLoc.line;
	      lastToken.startLoc.column = token.startLoc.column;
	      lastToken.endLoc.line = token.endLoc.line;
	      lastToken.endLoc.column = token.endLoc.column;
	      lastToken.type = token.type;
	      lastToken.value = token.value;
	      lastToken.isArrayLiteral = token.isArrayLiteral;
	
	      // Apply all the comments that have been queued up.
	      if (commentQueue.length) {
	        if (!addedNewline && !commentQueue[0].trailing) {
	          write("\n");
	        }
	        if (commentQueue[0].trailing) {
	          write(" ");
	        }
	        for (var i = 0, n = commentQueue.length; i < n; i++) {
	          var comment = commentQueue[i];
	          var commentIndentLevel = commentQueue[i].trailing ? 0 : indentLevel;
	          addComment(write, commentIndentLevel, options, comment.block,
	                     comment.text, comment.line, comment.column);
	        }
	        addedNewline = true;
	        commentQueue.splice(0, commentQueue.length);
	      }
	    }
	
	    return result.toStringWithSourceMap({ file: options.url });
	  };
	
	}.bind(this)));


/***/ },

/***/ 367:
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// Acorn is a tiny, fast JavaScript parser written in JavaScript.
	//
	// Acorn was written by Marijn Haverbeke and various contributors and
	// released under an MIT license. The Unicode regexps (for identifiers
	// and whitespace) were taken from [Esprima](http://esprima.org) by
	// Ariya Hidayat.
	//
	// Git repositories for Acorn are available at
	//
	//     http://marijnhaverbeke.nl/git/acorn
	//     https://github.com/marijnh/acorn.git
	//
	// Please use the [github bug tracker][ghbt] to report issues.
	//
	// [ghbt]: https://github.com/marijnh/acorn/issues
	//
	// This file defines the main parser interface. The library also comes
	// with a [error-tolerant parser][dammit] and an
	// [abstract syntax tree walker][walk], defined in other files.
	//
	// [dammit]: acorn_loose.js
	// [walk]: util/walk.js
	
	(function(root, mod) {
	  if (true) return mod(exports); // CommonJS
	  if (true) return !(__WEBPACK_AMD_DEFINE_ARRAY__ = [exports], __WEBPACK_AMD_DEFINE_FACTORY__ = (mod), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	  mod(root.acorn || (root.acorn = {})); // Plain browser env
	})(this, function(exports) {
	  "use strict";
	
	  exports.version = "0.11.0";
	
	  // The main exported interface (under `self.acorn` when in the
	  // browser) is a `parse` function that takes a code string and
	  // returns an abstract syntax tree as specified by [Mozilla parser
	  // API][api], with the caveat that inline XML is not recognized.
	  //
	  // [api]: https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API
	
	  var options, input, inputLen, sourceFile;
	
	  exports.parse = function(inpt, opts) {
	    input = String(inpt); inputLen = input.length;
	    setOptions(opts);
	    initTokenState();
	    var startPos = options.locations ? [tokPos, curPosition()] : tokPos;
	    initParserState();
	    return parseTopLevel(options.program || startNodeAt(startPos));
	  };
	
	  // A second optional argument can be given to further configure
	  // the parser process. These options are recognized:
	
	  var defaultOptions = exports.defaultOptions = {
	    // `ecmaVersion` indicates the ECMAScript version to parse. Must
	    // be either 3, or 5, or 6. This influences support for strict
	    // mode, the set of reserved words, support for getters and
	    // setters and other features.
	    ecmaVersion: 5,
	    // Turn on `strictSemicolons` to prevent the parser from doing
	    // automatic semicolon insertion.
	    strictSemicolons: false,
	    // When `allowTrailingCommas` is false, the parser will not allow
	    // trailing commas in array and object literals.
	    allowTrailingCommas: true,
	    // By default, reserved words are not enforced. Enable
	    // `forbidReserved` to enforce them. When this option has the
	    // value "everywhere", reserved words and keywords can also not be
	    // used as property names.
	    forbidReserved: false,
	    // When enabled, a return at the top level is not considered an
	    // error.
	    allowReturnOutsideFunction: false,
	    // When enabled, import/export statements are not constrained to
	    // appearing at the top of the program.
	    allowImportExportEverywhere: false,
	    // When `locations` is on, `loc` properties holding objects with
	    // `start` and `end` properties in `{line, column}` form (with
	    // line being 1-based and column 0-based) will be attached to the
	    // nodes.
	    locations: false,
	    // A function can be passed as `onToken` option, which will
	    // cause Acorn to call that function with object in the same
	    // format as tokenize() returns. Note that you are not
	    // allowed to call the parser from the callback—that will
	    // corrupt its internal state.
	    onToken: null,
	    // A function can be passed as `onComment` option, which will
	    // cause Acorn to call that function with `(block, text, start,
	    // end)` parameters whenever a comment is skipped. `block` is a
	    // boolean indicating whether this is a block (`/* */`) comment,
	    // `text` is the content of the comment, and `start` and `end` are
	    // character offsets that denote the start and end of the comment.
	    // When the `locations` option is on, two more parameters are
	    // passed, the full `{line, column}` locations of the start and
	    // end of the comments. Note that you are not allowed to call the
	    // parser from the callback—that will corrupt its internal state.
	    onComment: null,
	    // Nodes have their start and end characters offsets recorded in
	    // `start` and `end` properties (directly on the node, rather than
	    // the `loc` object, which holds line/column data. To also add a
	    // [semi-standardized][range] `range` property holding a `[start,
	    // end]` array with the same numbers, set the `ranges` option to
	    // `true`.
	    //
	    // [range]: https://bugzilla.mozilla.org/show_bug.cgi?id=745678
	    ranges: false,
	    // It is possible to parse multiple files into a single AST by
	    // passing the tree produced by parsing the first file as
	    // `program` option in subsequent parses. This will add the
	    // toplevel forms of the parsed file to the `Program` (top) node
	    // of an existing parse tree.
	    program: null,
	    // When `locations` is on, you can pass this to record the source
	    // file in every node's `loc` object.
	    sourceFile: null,
	    // This value, if given, is stored in every node, whether
	    // `locations` is on or off.
	    directSourceFile: null,
	    // When enabled, parenthesized expressions are represented by
	    // (non-standard) ParenthesizedExpression nodes
	    preserveParens: false
	  };
	
	  // This function tries to parse a single expression at a given
	  // offset in a string. Useful for parsing mixed-language formats
	  // that embed JavaScript expressions.
	
	  exports.parseExpressionAt = function(inpt, pos, opts) {
	    input = String(inpt); inputLen = input.length;
	    setOptions(opts);
	    initTokenState(pos);
	    initParserState();
	    return parseExpression();
	  };
	
	  var isArray = function (obj) {
	    return Object.prototype.toString.call(obj) === "[object Array]";
	  };
	
	  function setOptions(opts) {
	    options = {};
	    for (var opt in defaultOptions)
	      options[opt] = opts && has(opts, opt) ? opts[opt] : defaultOptions[opt];
	    sourceFile = options.sourceFile || null;
	    if (isArray(options.onToken)) {
	      var tokens = options.onToken;
	      options.onToken = function (token) {
	        tokens.push(token);
	      };
	    }
	    if (isArray(options.onComment)) {
	      var comments = options.onComment;
	      options.onComment = function (block, text, start, end, startLoc, endLoc) {
	        var comment = {
	          type: block ? 'Block' : 'Line',
	          value: text,
	          start: start,
	          end: end
	        };
	        if (options.locations) {
	          comment.loc = new SourceLocation();
	          comment.loc.start = startLoc;
	          comment.loc.end = endLoc;
	        }
	        if (options.ranges)
	          comment.range = [start, end];
	        comments.push(comment);
	      };
	    }
	    isKeyword = options.ecmaVersion >= 6 ? isEcma6Keyword : isEcma5AndLessKeyword;
	  }
	
	  // The `getLineInfo` function is mostly useful when the
	  // `locations` option is off (for performance reasons) and you
	  // want to find the line/column position for a given character
	  // offset. `input` should be the code string that the offset refers
	  // into.
	
	  var getLineInfo = exports.getLineInfo = function(input, offset) {
	    for (var line = 1, cur = 0;;) {
	      lineBreak.lastIndex = cur;
	      var match = lineBreak.exec(input);
	      if (match && match.index < offset) {
	        ++line;
	        cur = match.index + match[0].length;
	      } else break;
	    }
	    return {line: line, column: offset - cur};
	  };
	
	  function Token() {
	    this.type = tokType;
	    this.value = tokVal;
	    this.start = tokStart;
	    this.end = tokEnd;
	    if (options.locations) {
	      this.loc = new SourceLocation();
	      this.loc.end = tokEndLoc;
	      // TODO: remove in next major release
	      this.startLoc = tokStartLoc;
	      this.endLoc = tokEndLoc;
	    }
	    if (options.ranges)
	      this.range = [tokStart, tokEnd];
	  }
	
	  exports.Token = Token;
	
	  // Acorn is organized as a tokenizer and a recursive-descent parser.
	  // The `tokenize` export provides an interface to the tokenizer.
	  // Because the tokenizer is optimized for being efficiently used by
	  // the Acorn parser itself, this interface is somewhat crude and not
	  // very modular. Performing another parse or call to `tokenize` will
	  // reset the internal state, and invalidate existing tokenizers.
	
	  exports.tokenize = function(inpt, opts) {
	    input = String(inpt); inputLen = input.length;
	    setOptions(opts);
	    initTokenState();
	    skipSpace();
	
	    function getToken(forceRegexp) {
	      lastEnd = tokEnd;
	      readToken(forceRegexp);
	      return new Token();
	    }
	    getToken.jumpTo = function(pos, reAllowed) {
	      tokPos = pos;
	      if (options.locations) {
	        tokCurLine = 1;
	        tokLineStart = lineBreak.lastIndex = 0;
	        var match;
	        while ((match = lineBreak.exec(input)) && match.index < pos) {
	          ++tokCurLine;
	          tokLineStart = match.index + match[0].length;
	        }
	      }
	      tokRegexpAllowed = reAllowed;
	      skipSpace();
	    };
	    getToken.noRegexp = function() {
	      tokRegexpAllowed = false;
	    };
	    getToken.options = options;
	    return getToken;
	  };
	
	  // State is kept in (closure-)global variables. We already saw the
	  // `options`, `input`, and `inputLen` variables above.
	
	  // The current position of the tokenizer in the input.
	
	  var tokPos;
	
	  // The start and end offsets of the current token.
	
	  var tokStart, tokEnd;
	
	  // When `options.locations` is true, these hold objects
	  // containing the tokens start and end line/column pairs.
	
	  var tokStartLoc, tokEndLoc;
	
	  // The type and value of the current token. Token types are objects,
	  // named by variables against which they can be compared, and
	  // holding properties that describe them (indicating, for example,
	  // the precedence of an infix operator, and the original name of a
	  // keyword token). The kind of value that's held in `tokVal` depends
	  // on the type of the token. For literals, it is the literal value,
	  // for operators, the operator name, and so on.
	
	  var tokType, tokVal;
	
	  // Internal state for the tokenizer. To distinguish between division
	  // operators and regular expressions, it remembers whether the last
	  // token was one that is allowed to be followed by an expression.
	  // (If it is, a slash is probably a regexp, if it isn't it's a
	  // division operator. See the `parseStatement` function for a
	  // caveat.)
	
	  var tokRegexpAllowed;
	
	  // When `options.locations` is true, these are used to keep
	  // track of the current line, and know when a new line has been
	  // entered.
	
	  var tokCurLine, tokLineStart;
	
	  // These store the position of the previous token, which is useful
	  // when finishing a node and assigning its `end` position.
	
	  var lastStart, lastEnd, lastEndLoc;
	
	  // This is the parser's state. `inFunction` is used to reject
	  // `return` statements outside of functions, `inGenerator` to
	  // reject `yield`s outside of generators, `labels` to verify
	  // that `break` and `continue` have somewhere to jump to, and
	  // `strict` indicates whether strict mode is on.
	
	  var inFunction, inGenerator, labels, strict;
	
	  // This counter is used for checking that arrow expressions did
	  // not contain nested parentheses in argument list.
	
	  var metParenL;
	
	  // This is used by the tokenizer to track the template strings it is
	  // inside, and count the amount of open braces seen inside them, to
	  // be able to switch back to a template token when the } to match ${
	  // is encountered. It will hold an array of integers.
	
	  var templates;
	
	  function initParserState() {
	    lastStart = lastEnd = tokPos;
	    if (options.locations) lastEndLoc = curPosition();
	    inFunction = inGenerator = strict = false;
	    labels = [];
	    skipSpace();
	    readToken();
	  }
	
	  // This function is used to raise exceptions on parse errors. It
	  // takes an offset integer (into the current `input`) to indicate
	  // the location of the error, attaches the position to the end
	  // of the error message, and then raises a `SyntaxError` with that
	  // message.
	
	  function raise(pos, message) {
	    var loc = getLineInfo(input, pos);
	    message += " (" + loc.line + ":" + loc.column + ")";
	    var err = new SyntaxError(message);
	    err.pos = pos; err.loc = loc; err.raisedAt = tokPos;
	    throw err;
	  }
	
	  // Reused empty array added for node fields that are always empty.
	
	  var empty = [];
	
	  // ## Token types
	
	  // The assignment of fine-grained, information-carrying type objects
	  // allows the tokenizer to store the information it has about a
	  // token in a way that is very cheap for the parser to look up.
	
	  // All token type variables start with an underscore, to make them
	  // easy to recognize.
	
	  // These are the general types. The `type` property is only used to
	  // make them recognizeable when debugging.
	
	  var _num = {type: "num"}, _regexp = {type: "regexp"}, _string = {type: "string"};
	  var _name = {type: "name"}, _eof = {type: "eof"};
	
	  // Keyword tokens. The `keyword` property (also used in keyword-like
	  // operators) indicates that the token originated from an
	  // identifier-like word, which is used when parsing property names.
	  //
	  // The `beforeExpr` property is used to disambiguate between regular
	  // expressions and divisions. It is set on all token types that can
	  // be followed by an expression (thus, a slash after them would be a
	  // regular expression).
	  //
	  // `isLoop` marks a keyword as starting a loop, which is important
	  // to know when parsing a label, in order to allow or disallow
	  // continue jumps to that label.
	
	  var _break = {keyword: "break"}, _case = {keyword: "case", beforeExpr: true}, _catch = {keyword: "catch"};
	  var _continue = {keyword: "continue"}, _debugger = {keyword: "debugger"}, _default = {keyword: "default"};
	  var _do = {keyword: "do", isLoop: true}, _else = {keyword: "else", beforeExpr: true};
	  var _finally = {keyword: "finally"}, _for = {keyword: "for", isLoop: true}, _function = {keyword: "function"};
	  var _if = {keyword: "if"}, _return = {keyword: "return", beforeExpr: true}, _switch = {keyword: "switch"};
	  var _throw = {keyword: "throw", beforeExpr: true}, _try = {keyword: "try"}, _var = {keyword: "var"};
	  var _let = {keyword: "let"}, _const = {keyword: "const"};
	  var _while = {keyword: "while", isLoop: true}, _with = {keyword: "with"}, _new = {keyword: "new", beforeExpr: true};
	  var _this = {keyword: "this"};
	  var _class = {keyword: "class"}, _extends = {keyword: "extends", beforeExpr: true};
	  var _export = {keyword: "export"}, _import = {keyword: "import"};
	  var _yield = {keyword: "yield", beforeExpr: true};
	
	  // The keywords that denote values.
	
	  var _null = {keyword: "null", atomValue: null}, _true = {keyword: "true", atomValue: true};
	  var _false = {keyword: "false", atomValue: false};
	
	  // Some keywords are treated as regular operators. `in` sometimes
	  // (when parsing `for`) needs to be tested against specifically, so
	  // we assign a variable name to it for quick comparing.
	
	  var _in = {keyword: "in", binop: 7, beforeExpr: true};
	
	  // Map keyword names to token types.
	
	  var keywordTypes = {"break": _break, "case": _case, "catch": _catch,
	                      "continue": _continue, "debugger": _debugger, "default": _default,
	                      "do": _do, "else": _else, "finally": _finally, "for": _for,
	                      "function": _function, "if": _if, "return": _return, "switch": _switch,
	                      "throw": _throw, "try": _try, "var": _var, "let": _let, "const": _const,
	                      "while": _while, "with": _with,
	                      "null": _null, "true": _true, "false": _false, "new": _new, "in": _in,
	                      "instanceof": {keyword: "instanceof", binop: 7, beforeExpr: true}, "this": _this,
	                      "typeof": {keyword: "typeof", prefix: true, beforeExpr: true},
	                      "void": {keyword: "void", prefix: true, beforeExpr: true},
	                      "delete": {keyword: "delete", prefix: true, beforeExpr: true},
	                      "class": _class, "extends": _extends,
	                      "export": _export, "import": _import, "yield": _yield};
	
	  // Punctuation token types. Again, the `type` property is purely for debugging.
	
	  var _bracketL = {type: "[", beforeExpr: true}, _bracketR = {type: "]"}, _braceL = {type: "{", beforeExpr: true};
	  var _braceR = {type: "}"}, _parenL = {type: "(", beforeExpr: true}, _parenR = {type: ")"};
	  var _comma = {type: ",", beforeExpr: true}, _semi = {type: ";", beforeExpr: true};
	  var _colon = {type: ":", beforeExpr: true}, _dot = {type: "."}, _question = {type: "?", beforeExpr: true};
	  var _arrow = {type: "=>", beforeExpr: true}, _template = {type: "template"}, _templateContinued = {type: "templateContinued"};
	  var _ellipsis = {type: "...", prefix: true, beforeExpr: true};
	
	  // Operators. These carry several kinds of properties to help the
	  // parser use them properly (the presence of these properties is
	  // what categorizes them as operators).
	  //
	  // `binop`, when present, specifies that this operator is a binary
	  // operator, and will refer to its precedence.
	  //
	  // `prefix` and `postfix` mark the operator as a prefix or postfix
	  // unary operator. `isUpdate` specifies that the node produced by
	  // the operator should be of type UpdateExpression rather than
	  // simply UnaryExpression (`++` and `--`).
	  //
	  // `isAssign` marks all of `=`, `+=`, `-=` etcetera, which act as
	  // binary operators with a very low precedence, that should result
	  // in AssignmentExpression nodes.
	
	  var _slash = {binop: 10, beforeExpr: true}, _eq = {isAssign: true, beforeExpr: true};
	  var _assign = {isAssign: true, beforeExpr: true};
	  var _incDec = {postfix: true, prefix: true, isUpdate: true}, _prefix = {prefix: true, beforeExpr: true};
	  var _logicalOR = {binop: 1, beforeExpr: true};
	  var _logicalAND = {binop: 2, beforeExpr: true};
	  var _bitwiseOR = {binop: 3, beforeExpr: true};
	  var _bitwiseXOR = {binop: 4, beforeExpr: true};
	  var _bitwiseAND = {binop: 5, beforeExpr: true};
	  var _equality = {binop: 6, beforeExpr: true};
	  var _relational = {binop: 7, beforeExpr: true};
	  var _bitShift = {binop: 8, beforeExpr: true};
	  var _plusMin = {binop: 9, prefix: true, beforeExpr: true};
	  var _modulo = {binop: 10, beforeExpr: true};
	
	  // '*' may be multiply or have special meaning in ES6
	  var _star = {binop: 10, beforeExpr: true};
	
	  // Provide access to the token types for external users of the
	  // tokenizer.
	
	  exports.tokTypes = {bracketL: _bracketL, bracketR: _bracketR, braceL: _braceL, braceR: _braceR,
	                      parenL: _parenL, parenR: _parenR, comma: _comma, semi: _semi, colon: _colon,
	                      dot: _dot, ellipsis: _ellipsis, question: _question, slash: _slash, eq: _eq,
	                      name: _name, eof: _eof, num: _num, regexp: _regexp, string: _string,
	                      arrow: _arrow, template: _template, templateContinued: _templateContinued, star: _star,
	                      assign: _assign};
	  for (var kw in keywordTypes) exports.tokTypes["_" + kw] = keywordTypes[kw];
	
	  // This is a trick taken from Esprima. It turns out that, on
	  // non-Chrome browsers, to check whether a string is in a set, a
	  // predicate containing a big ugly `switch` statement is faster than
	  // a regular expression, and on Chrome the two are about on par.
	  // This function uses `eval` (non-lexical) to produce such a
	  // predicate from a space-separated string of words.
	  //
	  // It starts by sorting the words by length.
	
	  function makePredicate(words) {
	    words = words.split(" ");
	    var f = "", cats = [];
	    out: for (var i = 0; i < words.length; ++i) {
	      for (var j = 0; j < cats.length; ++j)
	        if (cats[j][0].length == words[i].length) {
	          cats[j].push(words[i]);
	          continue out;
	        }
	      cats.push([words[i]]);
	    }
	    function compareTo(arr) {
	      if (arr.length == 1) return f += "return str === " + JSON.stringify(arr[0]) + ";";
	      f += "switch(str){";
	      for (var i = 0; i < arr.length; ++i) f += "case " + JSON.stringify(arr[i]) + ":";
	      f += "return true}return false;";
	    }
	
	    // When there are more than three length categories, an outer
	    // switch first dispatches on the lengths, to save on comparisons.
	
	    if (cats.length > 3) {
	      cats.sort(function(a, b) {return b.length - a.length;});
	      f += "switch(str.length){";
	      for (var i = 0; i < cats.length; ++i) {
	        var cat = cats[i];
	        f += "case " + cat[0].length + ":";
	        compareTo(cat);
	      }
	      f += "}";
	
	    // Otherwise, simply generate a flat `switch` statement.
	
	    } else {
	      compareTo(words);
	    }
	    return new Function("str", f);
	  }
	
	  // The ECMAScript 3 reserved word list.
	
	  var isReservedWord3 = makePredicate("abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile");
	
	  // ECMAScript 5 reserved words.
	
	  var isReservedWord5 = makePredicate("class enum extends super const export import");
	
	  // The additional reserved words in strict mode.
	
	  var isStrictReservedWord = makePredicate("implements interface let package private protected public static yield");
	
	  // The forbidden variable names in strict mode.
	
	  var isStrictBadIdWord = makePredicate("eval arguments");
	
	  // And the keywords.
	
	  var ecma5AndLessKeywords = "break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this";
	
	  var isEcma5AndLessKeyword = makePredicate(ecma5AndLessKeywords);
	
	  var isEcma6Keyword = makePredicate(ecma5AndLessKeywords + " let const class extends export import yield");
	
	  var isKeyword = isEcma5AndLessKeyword;
	
	  // ## Character categories
	
	  // Big ugly regular expressions that match characters in the
	  // whitespace, identifier, and identifier-start categories. These
	  // are only applied when a character is found to actually have a
	  // code point above 128.
	  // Generated by `tools/generate-identifier-regex.js`.
	
	  var nonASCIIwhitespace = /[\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]/;
	  var nonASCIIidentifierStartChars = "\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC";
	  var nonASCIIidentifierChars = "\u0300-\u036F\u0483-\u0487\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u0669\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u06F0-\u06F9\u0711\u0730-\u074A\u07A6-\u07B0\u07C0-\u07C9\u07EB-\u07F3\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08E4-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0966-\u096F\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u09E6-\u09EF\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A66-\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B62\u0B63\u0B66-\u0B6F\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0CE6-\u0CEF\u0D01-\u0D03\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D66-\u0D6F\u0D82\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0E50-\u0E59\u0EB1\u0EB4-\u0EB9\u0EBB\u0EBC\u0EC8-\u0ECD\u0ED0-\u0ED9\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1040-\u1049\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F-\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u18A9\u1920-\u192B\u1930-\u193B\u1946-\u194F\u19B0-\u19C0\u19C8\u19C9\u19D0-\u19D9\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AB0-\u1ABD\u1B00-\u1B04\u1B34-\u1B44\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BB0-\u1BB9\u1BE6-\u1BF3\u1C24-\u1C37\u1C40-\u1C49\u1C50-\u1C59\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF2-\u1CF4\u1CF8\u1CF9\u1DC0-\u1DF5\u1DFC-\u1DFF\u200C\u200D\u203F\u2040\u2054\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\uA620-\uA629\uA66F\uA674-\uA67D\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA880\uA881\uA8B4-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F1\uA900-\uA909\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9D0-\uA9D9\uA9E5\uA9F0-\uA9F9\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA50-\uAA59\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uABF0-\uABF9\uFB1E\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFF10-\uFF19\uFF3F";
	  var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
	  var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");
	
	  // Whether a single character denotes a newline.
	
	  var newline = /[\n\r\u2028\u2029]/;
	
	  function isNewLine(code) {
	    return code === 10 || code === 13 || code === 0x2028 || code == 0x2029;
	  }
	
	  // Matches a whole line break (where CRLF is considered a single
	  // line break). Used to count lines.
	
	  var lineBreak = /\r\n|[\n\r\u2028\u2029]/g;
	
	  // Test whether a given character code starts an identifier.
	
	  var isIdentifierStart = exports.isIdentifierStart = function(code) {
	    if (code < 65) return code === 36;
	    if (code < 91) return true;
	    if (code < 97) return code === 95;
	    if (code < 123)return true;
	    return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code));
	  };
	
	  // Test whether a given character is part of an identifier.
	
	  var isIdentifierChar = exports.isIdentifierChar = function(code) {
	    if (code < 48) return code === 36;
	    if (code < 58) return true;
	    if (code < 65) return false;
	    if (code < 91) return true;
	    if (code < 97) return code === 95;
	    if (code < 123)return true;
	    return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code));
	  };
	
	  // ## Tokenizer
	
	  // These are used when `options.locations` is on, for the
	  // `tokStartLoc` and `tokEndLoc` properties.
	
	  function Position(line, col) {
	    this.line = line;
	    this.column = col;
	  }
	
	  Position.prototype.offset = function(n) {
	    return new Position(this.line, this.column + n);
	  }
	
	  function curPosition() {
	    return new Position(tokCurLine, tokPos - tokLineStart);
	  }
	
	  // Reset the token state. Used at the start of a parse.
	
	  function initTokenState(pos) {
	    if (pos) {
	      tokPos = pos;
	      tokLineStart = Math.max(0, input.lastIndexOf("\n", pos));
	      tokCurLine = input.slice(0, tokLineStart).split(newline).length;
	    } else {
	      tokCurLine = 1;
	      tokPos = tokLineStart = 0;
	    }
	    tokRegexpAllowed = true;
	    metParenL = 0;
	    templates = [];
	  }
	
	  // Called at the end of every token. Sets `tokEnd`, `tokVal`, and
	  // `tokRegexpAllowed`, and skips the space after the token, so that
	  // the next one's `tokStart` will point at the right position.
	
	  function finishToken(type, val, shouldSkipSpace) {
	    tokEnd = tokPos;
	    if (options.locations) tokEndLoc = curPosition();
	    tokType = type;
	    if (shouldSkipSpace !== false) skipSpace();
	    tokVal = val;
	    tokRegexpAllowed = type.beforeExpr;
	    if (options.onToken) {
	      options.onToken(new Token());
	    }
	  }
	
	  function skipBlockComment() {
	    var startLoc = options.onComment && options.locations && curPosition();
	    var start = tokPos, end = input.indexOf("*/", tokPos += 2);
	    if (end === -1) raise(tokPos - 2, "Unterminated comment");
	    tokPos = end + 2;
	    if (options.locations) {
	      lineBreak.lastIndex = start;
	      var match;
	      while ((match = lineBreak.exec(input)) && match.index < tokPos) {
	        ++tokCurLine;
	        tokLineStart = match.index + match[0].length;
	      }
	    }
	    if (options.onComment)
	      options.onComment(true, input.slice(start + 2, end), start, tokPos,
	                        startLoc, options.locations && curPosition());
	  }
	
	  function skipLineComment(startSkip) {
	    var start = tokPos;
	    var startLoc = options.onComment && options.locations && curPosition();
	    var ch = input.charCodeAt(tokPos+=startSkip);
	    while (tokPos < inputLen && ch !== 10 && ch !== 13 && ch !== 8232 && ch !== 8233) {
	      ++tokPos;
	      ch = input.charCodeAt(tokPos);
	    }
	    if (options.onComment)
	      options.onComment(false, input.slice(start + startSkip, tokPos), start, tokPos,
	                        startLoc, options.locations && curPosition());
	  }
	
	  // Called at the start of the parse and after every token. Skips
	  // whitespace and comments, and.
	
	  function skipSpace() {
	    while (tokPos < inputLen) {
	      var ch = input.charCodeAt(tokPos);
	      if (ch === 32) { // ' '
	        ++tokPos;
	      } else if (ch === 13) {
	        ++tokPos;
	        var next = input.charCodeAt(tokPos);
	        if (next === 10) {
	          ++tokPos;
	        }
	        if (options.locations) {
	          ++tokCurLine;
	          tokLineStart = tokPos;
	        }
	      } else if (ch === 10 || ch === 8232 || ch === 8233) {
	        ++tokPos;
	        if (options.locations) {
	          ++tokCurLine;
	          tokLineStart = tokPos;
	        }
	      } else if (ch > 8 && ch < 14) {
	        ++tokPos;
	      } else if (ch === 47) { // '/'
	        var next = input.charCodeAt(tokPos + 1);
	        if (next === 42) { // '*'
	          skipBlockComment();
	        } else if (next === 47) { // '/'
	          skipLineComment(2);
	        } else break;
	      } else if (ch === 160) { // '\xa0'
	        ++tokPos;
	      } else if (ch >= 5760 && nonASCIIwhitespace.test(String.fromCharCode(ch))) {
	        ++tokPos;
	      } else {
	        break;
	      }
	    }
	  }
	
	  // ### Token reading
	
	  // This is the function that is called to fetch the next token. It
	  // is somewhat obscure, because it works in character codes rather
	  // than characters, and because operator parsing has been inlined
	  // into it.
	  //
	  // All in the name of speed.
	  //
	  // The `forceRegexp` parameter is used in the one case where the
	  // `tokRegexpAllowed` trick does not work. See `parseStatement`.
	
	  function readToken_dot() {
	    var next = input.charCodeAt(tokPos + 1);
	    if (next >= 48 && next <= 57) return readNumber(true);
	    var next2 = input.charCodeAt(tokPos + 2);
	    if (options.ecmaVersion >= 6 && next === 46 && next2 === 46) { // 46 = dot '.'
	      tokPos += 3;
	      return finishToken(_ellipsis);
	    } else {
	      ++tokPos;
	      return finishToken(_dot);
	    }
	  }
	
	  function readToken_slash() { // '/'
	    var next = input.charCodeAt(tokPos + 1);
	    if (tokRegexpAllowed) {++tokPos; return readRegexp();}
	    if (next === 61) return finishOp(_assign, 2);
	    return finishOp(_slash, 1);
	  }
	
	  function readToken_mult_modulo(code) { // '%*'
	    var next = input.charCodeAt(tokPos + 1);
	    if (next === 61) return finishOp(_assign, 2);
	    return finishOp(code === 42 ? _star : _modulo, 1);
	  }
	
	  function readToken_pipe_amp(code) { // '|&'
	    var next = input.charCodeAt(tokPos + 1);
	    if (next === code) return finishOp(code === 124 ? _logicalOR : _logicalAND, 2);
	    if (next === 61) return finishOp(_assign, 2);
	    return finishOp(code === 124 ? _bitwiseOR : _bitwiseAND, 1);
	  }
	
	  function readToken_caret() { // '^'
	    var next = input.charCodeAt(tokPos + 1);
	    if (next === 61) return finishOp(_assign, 2);
	    return finishOp(_bitwiseXOR, 1);
	  }
	
	  function readToken_plus_min(code) { // '+-'
	    var next = input.charCodeAt(tokPos + 1);
	    if (next === code) {
	      if (next == 45 && input.charCodeAt(tokPos + 2) == 62 &&
	          newline.test(input.slice(lastEnd, tokPos))) {
	        // A `-->` line comment
	        skipLineComment(3);
	        skipSpace();
	        return readToken();
	      }
	      return finishOp(_incDec, 2);
	    }
	    if (next === 61) return finishOp(_assign, 2);
	    return finishOp(_plusMin, 1);
	  }
	
	  function readToken_lt_gt(code) { // '<>'
	    var next = input.charCodeAt(tokPos + 1);
	    var size = 1;
	    if (next === code) {
	      size = code === 62 && input.charCodeAt(tokPos + 2) === 62 ? 3 : 2;
	      if (input.charCodeAt(tokPos + size) === 61) return finishOp(_assign, size + 1);
	      return finishOp(_bitShift, size);
	    }
	    if (next == 33 && code == 60 && input.charCodeAt(tokPos + 2) == 45 &&
	        input.charCodeAt(tokPos + 3) == 45) {
	      // `<!--`, an XML-style comment that should be interpreted as a line comment
	      skipLineComment(4);
	      skipSpace();
	      return readToken();
	    }
	    if (next === 61)
	      size = input.charCodeAt(tokPos + 2) === 61 ? 3 : 2;
	    return finishOp(_relational, size);
	  }
	
	  function readToken_eq_excl(code) { // '=!', '=>'
	    var next = input.charCodeAt(tokPos + 1);
	    if (next === 61) return finishOp(_equality, input.charCodeAt(tokPos + 2) === 61 ? 3 : 2);
	    if (code === 61 && next === 62 && options.ecmaVersion >= 6) { // '=>'
	      tokPos += 2;
	      return finishToken(_arrow);
	    }
	    return finishOp(code === 61 ? _eq : _prefix, 1);
	  }
	
	  function getTokenFromCode(code) {
	    switch (code) {
	    // The interpretation of a dot depends on whether it is followed
	    // by a digit or another two dots.
	    case 46: // '.'
	      return readToken_dot();
	
	    // Punctuation tokens.
	    case 40: ++tokPos; return finishToken(_parenL);
	    case 41: ++tokPos; return finishToken(_parenR);
	    case 59: ++tokPos; return finishToken(_semi);
	    case 44: ++tokPos; return finishToken(_comma);
	    case 91: ++tokPos; return finishToken(_bracketL);
	    case 93: ++tokPos; return finishToken(_bracketR);
	    case 123:
	      ++tokPos;
	      if (templates.length) ++templates[templates.length - 1];
	      return finishToken(_braceL);
	    case 125:
	      ++tokPos;
	      if (templates.length && --templates[templates.length - 1] === 0)
	        return readTemplateString(_templateContinued);
	      else
	        return finishToken(_braceR);
	    case 58: ++tokPos; return finishToken(_colon);
	    case 63: ++tokPos; return finishToken(_question);
	
	    case 96: // '`'
	      if (options.ecmaVersion >= 6) {
	        ++tokPos;
	        return readTemplateString(_template);
	      }
	
	    case 48: // '0'
	      var next = input.charCodeAt(tokPos + 1);
	      if (next === 120 || next === 88) return readRadixNumber(16); // '0x', '0X' - hex number
	      if (options.ecmaVersion >= 6) {
	        if (next === 111 || next === 79) return readRadixNumber(8); // '0o', '0O' - octal number
	        if (next === 98 || next === 66) return readRadixNumber(2); // '0b', '0B' - binary number
	      }
	    // Anything else beginning with a digit is an integer, octal
	    // number, or float.
	    case 49: case 50: case 51: case 52: case 53: case 54: case 55: case 56: case 57: // 1-9
	      return readNumber(false);
	
	    // Quotes produce strings.
	    case 34: case 39: // '"', "'"
	      return readString(code);
	
	    // Operators are parsed inline in tiny state machines. '=' (61) is
	    // often referred to. `finishOp` simply skips the amount of
	    // characters it is given as second argument, and returns a token
	    // of the type given by its first argument.
	
	    case 47: // '/'
	      return readToken_slash();
	
	    case 37: case 42: // '%*'
	      return readToken_mult_modulo(code);
	
	    case 124: case 38: // '|&'
	      return readToken_pipe_amp(code);
	
	    case 94: // '^'
	      return readToken_caret();
	
	    case 43: case 45: // '+-'
	      return readToken_plus_min(code);
	
	    case 60: case 62: // '<>'
	      return readToken_lt_gt(code);
	
	    case 61: case 33: // '=!'
	      return readToken_eq_excl(code);
	
	    case 126: // '~'
	      return finishOp(_prefix, 1);
	    }
	
	    return false;
	  }
	
	  function readToken(forceRegexp) {
	    if (!forceRegexp) tokStart = tokPos;
	    else tokPos = tokStart + 1;
	    if (options.locations) tokStartLoc = curPosition();
	    if (forceRegexp) return readRegexp();
	    if (tokPos >= inputLen) return finishToken(_eof);
	
	    var code = input.charCodeAt(tokPos);
	
	    // Identifier or keyword. '\uXXXX' sequences are allowed in
	    // identifiers, so '\' also dispatches to that.
	    if (isIdentifierStart(code) || code === 92 /* '\' */) return readWord();
	
	    var tok = getTokenFromCode(code);
	
	    if (tok === false) {
	      // If we are here, we either found a non-ASCII identifier
	      // character, or something that's entirely disallowed.
	      var ch = String.fromCharCode(code);
	      if (ch === "\\" || nonASCIIidentifierStart.test(ch)) return readWord();
	      raise(tokPos, "Unexpected character '" + ch + "'");
	    }
	    return tok;
	  }
	
	  function finishOp(type, size) {
	    var str = input.slice(tokPos, tokPos + size);
	    tokPos += size;
	    finishToken(type, str);
	  }
	
	  var regexpUnicodeSupport = false;
	  try { new RegExp("\uffff", "u"); regexpUnicodeSupport = true; }
	  catch(e) {}
	
	  // Parse a regular expression. Some context-awareness is necessary,
	  // since a '/' inside a '[]' set does not end the expression.
	
	  function readRegexp() {
	    var content = "", escaped, inClass, start = tokPos;
	    for (;;) {
	      if (tokPos >= inputLen) raise(start, "Unterminated regular expression");
	      var ch = input.charAt(tokPos);
	      if (newline.test(ch)) raise(start, "Unterminated regular expression");
	      if (!escaped) {
	        if (ch === "[") inClass = true;
	        else if (ch === "]" && inClass) inClass = false;
	        else if (ch === "/" && !inClass) break;
	        escaped = ch === "\\";
	      } else escaped = false;
	      ++tokPos;
	    }
	    var content = input.slice(start, tokPos);
	    ++tokPos;
	    // Need to use `readWord1` because '\uXXXX' sequences are allowed
	    // here (don't ask).
	    var mods = readWord1();
	    var tmp = content;
	    if (mods) {
	      var validFlags = /^[gmsiy]*$/;
	      if (options.ecmaVersion >= 6) validFlags = /^[gmsiyu]*$/;
	      if (!validFlags.test(mods)) raise(start, "Invalid regular expression flag");
	      if (mods.indexOf('u') >= 0 && !regexpUnicodeSupport) {
	        // Replace each astral symbol and every Unicode code point
	        // escape sequence that represents such a symbol with a single
	        // ASCII symbol to avoid throwing on regular expressions that
	        // are only valid in combination with the `/u` flag.
	        tmp = tmp
	          .replace(/\\u\{([0-9a-fA-F]{5,6})\}/g, "x")
	          .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "x");
	      }
	    }
	    // Detect invalid regular expressions.
	    try {
	      new RegExp(tmp);
	    } catch (e) {
	      if (e instanceof SyntaxError) raise(start, "Error parsing regular expression: " + e.message);
	      raise(e);
	    }
	    // Get a regular expression object for this pattern-flag pair, or `null` in
	    // case the current environment doesn't support the flags it uses.
	    try {
	      var value = new RegExp(content, mods);
	    } catch (err) {
	      value = null;
	    }
	    return finishToken(_regexp, {pattern: content, flags: mods, value: value});
	  }
	
	  // Read an integer in the given radix. Return null if zero digits
	  // were read, the integer value otherwise. When `len` is given, this
	  // will return `null` unless the integer has exactly `len` digits.
	
	  function readInt(radix, len) {
	    var start = tokPos, total = 0;
	    for (var i = 0, e = len == null ? Infinity : len; i < e; ++i) {
	      var code = input.charCodeAt(tokPos), val;
	      if (code >= 97) val = code - 97 + 10; // a
	      else if (code >= 65) val = code - 65 + 10; // A
	      else if (code >= 48 && code <= 57) val = code - 48; // 0-9
	      else val = Infinity;
	      if (val >= radix) break;
	      ++tokPos;
	      total = total * radix + val;
	    }
	    if (tokPos === start || len != null && tokPos - start !== len) return null;
	
	    return total;
	  }
	
	  function readRadixNumber(radix) {
	    tokPos += 2; // 0x
	    var val = readInt(radix);
	    if (val == null) raise(tokStart + 2, "Expected number in radix " + radix);
	    if (isIdentifierStart(input.charCodeAt(tokPos))) raise(tokPos, "Identifier directly after number");
	    return finishToken(_num, val);
	  }
	
	  // Read an integer, octal integer, or floating-point number.
	
	  function readNumber(startsWithDot) {
	    var start = tokPos, isFloat = false, octal = input.charCodeAt(tokPos) === 48;
	    if (!startsWithDot && readInt(10) === null) raise(start, "Invalid number");
	    if (input.charCodeAt(tokPos) === 46) {
	      ++tokPos;
	      readInt(10);
	      isFloat = true;
	    }
	    var next = input.charCodeAt(tokPos);
	    if (next === 69 || next === 101) { // 'eE'
	      next = input.charCodeAt(++tokPos);
	      if (next === 43 || next === 45) ++tokPos; // '+-'
	      if (readInt(10) === null) raise(start, "Invalid number");
	      isFloat = true;
	    }
	    if (isIdentifierStart(input.charCodeAt(tokPos))) raise(tokPos, "Identifier directly after number");
	
	    var str = input.slice(start, tokPos), val;
	    if (isFloat) val = parseFloat(str);
	    else if (!octal || str.length === 1) val = parseInt(str, 10);
	    else if (/[89]/.test(str) || strict) raise(start, "Invalid number");
	    else val = parseInt(str, 8);
	    return finishToken(_num, val);
	  }
	
	  // Read a string value, interpreting backslash-escapes.
	
	  function readCodePoint() {
	    var ch = input.charCodeAt(tokPos), code;
	
	    if (ch === 123) {
	      if (options.ecmaVersion < 6) unexpected();
	      ++tokPos;
	      code = readHexChar(input.indexOf('}', tokPos) - tokPos);
	      ++tokPos;
	      if (code > 0x10FFFF) unexpected();
	    } else {
	      code = readHexChar(4);
	    }
	
	    // UTF-16 Encoding
	    if (code <= 0xFFFF) {
	      return String.fromCharCode(code);
	    }
	    var cu1 = ((code - 0x10000) >> 10) + 0xD800;
	    var cu2 = ((code - 0x10000) & 1023) + 0xDC00;
	    return String.fromCharCode(cu1, cu2);
	  }
	
	  function readString(quote) {
	    ++tokPos;
	    var out = "";
	    for (;;) {
	      if (tokPos >= inputLen) raise(tokStart, "Unterminated string constant");
	      var ch = input.charCodeAt(tokPos);
	      if (ch === quote) {
	        ++tokPos;
	        return finishToken(_string, out);
	      }
	      if (ch === 92) { // '\'
	        out += readEscapedChar();
	      } else {
	        ++tokPos;
	        if (newline.test(String.fromCharCode(ch))) {
	          raise(tokStart, "Unterminated string constant");
	        }
	        out += String.fromCharCode(ch); // '\'
	      }
	    }
	  }
	
	  function readTemplateString(type) {
	    if (type == _templateContinued) templates.pop();
	    var out = "", start = tokPos;;
	    for (;;) {
	      if (tokPos >= inputLen) raise(tokStart, "Unterminated template");
	      var ch = input.charAt(tokPos);
	      if (ch === "`" || ch === "$" && input.charCodeAt(tokPos + 1) === 123) { // '`', '${'
	        var raw = input.slice(start, tokPos);
	        ++tokPos;
	        if (ch == "$") { ++tokPos; templates.push(1); }
	        return finishToken(type, {cooked: out, raw: raw});
	      }
	
	      if (ch === "\\") { // '\'
	        out += readEscapedChar();
	      } else {
	        ++tokPos;
	        if (newline.test(ch)) {
	          if (ch === "\r" && input.charCodeAt(tokPos) === 10) {
	            ++tokPos;
	            ch = "\n";
	          }
	          if (options.locations) {
	            ++tokCurLine;
	            tokLineStart = tokPos;
	          }
	        }
	        out += ch;
	      }
	    }
	  }
	
	  // Used to read escaped characters
	
	  function readEscapedChar() {
	    var ch = input.charCodeAt(++tokPos);
	    var octal = /^[0-7]+/.exec(input.slice(tokPos, tokPos + 3));
	    if (octal) octal = octal[0];
	    while (octal && parseInt(octal, 8) > 255) octal = octal.slice(0, -1);
	    if (octal === "0") octal = null;
	    ++tokPos;
	    if (octal) {
	      if (strict) raise(tokPos - 2, "Octal literal in strict mode");
	      tokPos += octal.length - 1;
	      return String.fromCharCode(parseInt(octal, 8));
	    } else {
	      switch (ch) {
	        case 110: return "\n"; // 'n' -> '\n'
	        case 114: return "\r"; // 'r' -> '\r'
	        case 120: return String.fromCharCode(readHexChar(2)); // 'x'
	        case 117: return readCodePoint(); // 'u'
	        case 116: return "\t"; // 't' -> '\t'
	        case 98: return "\b"; // 'b' -> '\b'
	        case 118: return "\u000b"; // 'v' -> '\u000b'
	        case 102: return "\f"; // 'f' -> '\f'
	        case 48: return "\0"; // 0 -> '\0'
	        case 13: if (input.charCodeAt(tokPos) === 10) ++tokPos; // '\r\n'
	        case 10: // ' \n'
	          if (options.locations) { tokLineStart = tokPos; ++tokCurLine; }
	          return "";
	        default: return String.fromCharCode(ch);
	      }
	    }
	  }
	
	  // Used to read character escape sequences ('\x', '\u', '\U').
	
	  function readHexChar(len) {
	    var n = readInt(16, len);
	    if (n === null) raise(tokStart, "Bad character escape sequence");
	    return n;
	  }
	
	  // Used to signal to callers of `readWord1` whether the word
	  // contained any escape sequences. This is needed because words with
	  // escape sequences must not be interpreted as keywords.
	
	  var containsEsc;
	
	  // Read an identifier, and return it as a string. Sets `containsEsc`
	  // to whether the word contained a '\u' escape.
	  //
	  // Only builds up the word character-by-character when it actually
	  // containeds an escape, as a micro-optimization.
	
	  function readWord1() {
	    containsEsc = false;
	    var word, first = true, start = tokPos;
	    for (;;) {
	      var ch = input.charCodeAt(tokPos);
	      if (isIdentifierChar(ch)) {
	        if (containsEsc) word += input.charAt(tokPos);
	        ++tokPos;
	      } else if (ch === 92) { // "\"
	        if (!containsEsc) word = input.slice(start, tokPos);
	        containsEsc = true;
	        if (input.charCodeAt(++tokPos) != 117) // "u"
	          raise(tokPos, "Expecting Unicode escape sequence \\uXXXX");
	        ++tokPos;
	        var esc = readHexChar(4);
	        var escStr = String.fromCharCode(esc);
	        if (!escStr) raise(tokPos - 1, "Invalid Unicode escape");
	        if (!(first ? isIdentifierStart(esc) : isIdentifierChar(esc)))
	          raise(tokPos - 4, "Invalid Unicode escape");
	        word += escStr;
	      } else {
	        break;
	      }
	      first = false;
	    }
	    return containsEsc ? word : input.slice(start, tokPos);
	  }
	
	  // Read an identifier or keyword token. Will check for reserved
	  // words when necessary.
	
	  function readWord() {
	    var word = readWord1();
	    var type = _name;
	    if (!containsEsc && isKeyword(word))
	      type = keywordTypes[word];
	    return finishToken(type, word);
	  }
	
	  // ## Parser
	
	  // A recursive descent parser operates by defining functions for all
	  // syntactic elements, and recursively calling those, each function
	  // advancing the input stream and returning an AST node. Precedence
	  // of constructs (for example, the fact that `!x[1]` means `!(x[1])`
	  // instead of `(!x)[1]` is handled by the fact that the parser
	  // function that parses unary prefix operators is called first, and
	  // in turn calls the function that parses `[]` subscripts — that
	  // way, it'll receive the node for `x[1]` already parsed, and wraps
	  // *that* in the unary operator node.
	  //
	  // Acorn uses an [operator precedence parser][opp] to handle binary
	  // operator precedence, because it is much more compact than using
	  // the technique outlined above, which uses different, nesting
	  // functions to specify precedence, for all of the ten binary
	  // precedence levels that JavaScript defines.
	  //
	  // [opp]: http://en.wikipedia.org/wiki/Operator-precedence_parser
	
	  // ### Parser utilities
	
	  // Continue to the next token.
	
	  function next() {
	    lastStart = tokStart;
	    lastEnd = tokEnd;
	    lastEndLoc = tokEndLoc;
	    readToken();
	  }
	
	  // Enter strict mode. Re-reads the next token to please pedantic
	  // tests ("use strict"; 010; -- should fail).
	
	  function setStrict(strct) {
	    strict = strct;
	    tokPos = tokStart;
	    if (options.locations) {
	      while (tokPos < tokLineStart) {
	        tokLineStart = input.lastIndexOf("\n", tokLineStart - 2) + 1;
	        --tokCurLine;
	      }
	    }
	    skipSpace();
	    readToken();
	  }
	
	  // Start an AST node, attaching a start offset.
	
	  function Node() {
	    this.type = null;
	    this.start = tokStart;
	    this.end = null;
	  }
	
	  exports.Node = Node;
	
	  function SourceLocation() {
	    this.start = tokStartLoc;
	    this.end = null;
	    if (sourceFile !== null) this.source = sourceFile;
	  }
	
	  function startNode() {
	    var node = new Node();
	    if (options.locations)
	      node.loc = new SourceLocation();
	    if (options.directSourceFile)
	      node.sourceFile = options.directSourceFile;
	    if (options.ranges)
	      node.range = [tokStart, 0];
	    return node;
	  }
	
	  // Sometimes, a node is only started *after* the token stream passed
	  // its start position. The functions below help storing a position
	  // and creating a node from a previous position.
	
	  function storeCurrentPos() {
	    return options.locations ? [tokStart, tokStartLoc] : tokStart;
	  }
	
	  function startNodeAt(pos) {
	    var node = new Node(), start = pos;
	    if (options.locations) {
	      node.loc = new SourceLocation();
	      node.loc.start = start[1];
	      start = pos[0];
	    }
	    node.start = start;
	    if (options.directSourceFile)
	      node.sourceFile = options.directSourceFile;
	    if (options.ranges)
	      node.range = [start, 0];
	
	    return node;
	  }
	
	  // Finish an AST node, adding `type` and `end` properties.
	
	  function finishNode(node, type) {
	    node.type = type;
	    node.end = lastEnd;
	    if (options.locations)
	      node.loc.end = lastEndLoc;
	    if (options.ranges)
	      node.range[1] = lastEnd;
	    return node;
	  }
	
	  function finishNodeAt(node, type, pos) {
	    if (options.locations) { node.loc.end = pos[1]; pos = pos[0]; }
	    node.type = type;
	    node.end = pos;
	    if (options.ranges)
	      node.range[1] = pos;
	    return node;
	  }
	
	  // Test whether a statement node is the string literal `"use strict"`.
	
	  function isUseStrict(stmt) {
	    return options.ecmaVersion >= 5 && stmt.type === "ExpressionStatement" &&
	      stmt.expression.type === "Literal" && stmt.expression.value === "use strict";
	  }
	
	  // Predicate that tests whether the next token is of the given
	  // type, and if yes, consumes it as a side effect.
	
	  function eat(type) {
	    if (tokType === type) {
	      next();
	      return true;
	    } else {
	      return false;
	    }
	  }
	
	  // Test whether a semicolon can be inserted at the current position.
	
	  function canInsertSemicolon() {
	    return !options.strictSemicolons &&
	      (tokType === _eof || tokType === _braceR || newline.test(input.slice(lastEnd, tokStart)));
	  }
	
	  // Consume a semicolon, or, failing that, see if we are allowed to
	  // pretend that there is a semicolon at this position.
	
	  function semicolon() {
	    if (!eat(_semi) && !canInsertSemicolon()) unexpected();
	  }
	
	  // Expect a token of a given type. If found, consume it, otherwise,
	  // raise an unexpected token error.
	
	  function expect(type) {
	    eat(type) || unexpected();
	  }
	
	  // Raise an unexpected token error.
	
	  function unexpected(pos) {
	    raise(pos != null ? pos : tokStart, "Unexpected token");
	  }
	
	  // Checks if hash object has a property.
	
	  function has(obj, propName) {
	    return Object.prototype.hasOwnProperty.call(obj, propName);
	  }
	  // Convert existing expression atom to assignable pattern
	  // if possible.
	
	  function toAssignable(node, allowSpread, checkType) {
	    if (options.ecmaVersion >= 6 && node) {
	      switch (node.type) {
	        case "Identifier":
	        case "MemberExpression":
	          break;
	
	        case "ObjectExpression":
	          node.type = "ObjectPattern";
	          for (var i = 0; i < node.properties.length; i++) {
	            var prop = node.properties[i];
	            if (prop.kind !== "init") unexpected(prop.key.start);
	            toAssignable(prop.value, false, checkType);
	          }
	          break;
	
	        case "ArrayExpression":
	          node.type = "ArrayPattern";
	          for (var i = 0, lastI = node.elements.length - 1; i <= lastI; i++) {
	            toAssignable(node.elements[i], i === lastI, checkType);
	          }
	          break;
	
	        case "SpreadElement":
	          if (allowSpread) {
	            toAssignable(node.argument, false, checkType);
	            checkSpreadAssign(node.argument);
	          } else {
	            unexpected(node.start);
	          }
	          break;
	
	        default:
	          if (checkType) unexpected(node.start);
	      }
	    }
	    return node;
	  }
	
	  // Checks if node can be assignable spread argument.
	
	  function checkSpreadAssign(node) {
	    if (node.type !== "Identifier" && node.type !== "ArrayPattern")
	      unexpected(node.start);
	  }
	
	  // Verify that argument names are not repeated, and it does not
	  // try to bind the words `eval` or `arguments`.
	
	  function checkFunctionParam(param, nameHash) {
	    switch (param.type) {
	      case "Identifier":
	        if (isStrictReservedWord(param.name) || isStrictBadIdWord(param.name))
	          raise(param.start, "Defining '" + param.name + "' in strict mode");
	        if (has(nameHash, param.name))
	          raise(param.start, "Argument name clash in strict mode");
	        nameHash[param.name] = true;
	        break;
	
	      case "ObjectPattern":
	        for (var i = 0; i < param.properties.length; i++)
	          checkFunctionParam(param.properties[i].value, nameHash);
	        break;
	
	      case "ArrayPattern":
	        for (var i = 0; i < param.elements.length; i++) {
	          var elem = param.elements[i];
	          if (elem) checkFunctionParam(elem, nameHash);
	        }
	        break;
	    }
	  }
	
	  // Check if property name clashes with already added.
	  // Object/class getters and setters are not allowed to clash —
	  // either with each other or with an init property — and in
	  // strict mode, init properties are also not allowed to be repeated.
	
	  function checkPropClash(prop, propHash) {
	    if (options.ecmaVersion >= 6) return;
	    var key = prop.key, name;
	    switch (key.type) {
	      case "Identifier": name = key.name; break;
	      case "Literal": name = String(key.value); break;
	      default: return;
	    }
	    var kind = prop.kind || "init", other;
	    if (has(propHash, name)) {
	      other = propHash[name];
	      var isGetSet = kind !== "init";
	      if ((strict || isGetSet) && other[kind] || !(isGetSet ^ other.init))
	        raise(key.start, "Redefinition of property");
	    } else {
	      other = propHash[name] = {
	        init: false,
	        get: false,
	        set: false
	      };
	    }
	    other[kind] = true;
	  }
	
	  // Verify that a node is an lval — something that can be assigned
	  // to.
	
	  function checkLVal(expr, isBinding) {
	    switch (expr.type) {
	      case "Identifier":
	        if (strict && (isStrictBadIdWord(expr.name) || isStrictReservedWord(expr.name)))
	          raise(expr.start, isBinding
	            ? "Binding " + expr.name + " in strict mode"
	            : "Assigning to " + expr.name + " in strict mode"
	          );
	        break;
	
	      case "MemberExpression":
	        if (!isBinding) break;
	
	      case "ObjectPattern":
	        for (var i = 0; i < expr.properties.length; i++)
	          checkLVal(expr.properties[i].value, isBinding);
	        break;
	
	      case "ArrayPattern":
	        for (var i = 0; i < expr.elements.length; i++) {
	          var elem = expr.elements[i];
	          if (elem) checkLVal(elem, isBinding);
	        }
	        break;
	
	      case "SpreadElement":
	        break;
	
	      default:
	        raise(expr.start, "Assigning to rvalue");
	    }
	  }
	
	  // ### Statement parsing
	
	  // Parse a program. Initializes the parser, reads any number of
	  // statements, and wraps them in a Program node.  Optionally takes a
	  // `program` argument.  If present, the statements will be appended
	  // to its body instead of creating a new node.
	
	  function parseTopLevel(node) {
	    var first = true;
	    if (!node.body) node.body = [];
	    while (tokType !== _eof) {
	      var stmt = parseStatement(true);
	      node.body.push(stmt);
	      if (first && isUseStrict(stmt)) setStrict(true);
	      first = false;
	    }
	
	    lastStart = tokStart;
	    lastEnd = tokEnd;
	    lastEndLoc = tokEndLoc;
	    return finishNode(node, "Program");
	  }
	
	  var loopLabel = {kind: "loop"}, switchLabel = {kind: "switch"};
	
	  // Parse a single statement.
	  //
	  // If expecting a statement and finding a slash operator, parse a
	  // regular expression literal. This is to handle cases like
	  // `if (foo) /blah/.exec(foo);`, where looking at the previous token
	  // does not help.
	
	  function parseStatement(topLevel) {
	    if (tokType === _slash || tokType === _assign && tokVal == "/=")
	      readToken(true);
	
	    var starttype = tokType, node = startNode();
	
	    // Most types of statements are recognized by the keyword they
	    // start with. Many are trivial to parse, some require a bit of
	    // complexity.
	
	    switch (starttype) {
	    case _break: case _continue: return parseBreakContinueStatement(node, starttype.keyword);
	    case _debugger: return parseDebuggerStatement(node);
	    case _do: return parseDoStatement(node);
	    case _for: return parseForStatement(node);
	    case _function: return parseFunctionStatement(node);
	    case _class: return parseClass(node, true);
	    case _if: return parseIfStatement(node);
	    case _return: return parseReturnStatement(node);
	    case _switch: return parseSwitchStatement(node);
	    case _throw: return parseThrowStatement(node);
	    case _try: return parseTryStatement(node);
	    case _var: case _let: case _const: return parseVarStatement(node, starttype.keyword);
	    case _while: return parseWhileStatement(node);
	    case _with: return parseWithStatement(node);
	    case _braceL: return parseBlock(); // no point creating a function for this
	    case _semi: return parseEmptyStatement(node);
	    case _export:
	    case _import:
	      if (!topLevel && !options.allowImportExportEverywhere)
	        raise(tokStart, "'import' and 'export' may only appear at the top level");
	      return starttype === _import ? parseImport(node) : parseExport(node);
	
	      // If the statement does not start with a statement keyword or a
	      // brace, it's an ExpressionStatement or LabeledStatement. We
	      // simply start parsing an expression, and afterwards, if the
	      // next token is a colon and the expression was a simple
	      // Identifier node, we switch to interpreting it as a label.
	    default:
	      var maybeName = tokVal, expr = parseExpression();
	      if (starttype === _name && expr.type === "Identifier" && eat(_colon))
	        return parseLabeledStatement(node, maybeName, expr);
	      else return parseExpressionStatement(node, expr);
	    }
	  }
	
	  function parseBreakContinueStatement(node, keyword) {
	    var isBreak = keyword == "break";
	    next();
	    if (eat(_semi) || canInsertSemicolon()) node.label = null;
	    else if (tokType !== _name) unexpected();
	    else {
	      node.label = parseIdent();
	      semicolon();
	    }
	
	    // Verify that there is an actual destination to break or
	    // continue to.
	    for (var i = 0; i < labels.length; ++i) {
	      var lab = labels[i];
	      if (node.label == null || lab.name === node.label.name) {
	        if (lab.kind != null && (isBreak || lab.kind === "loop")) break;
	        if (node.label && isBreak) break;
	      }
	    }
	    if (i === labels.length) raise(node.start, "Unsyntactic " + keyword);
	    return finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement");
	  }
	
	  function parseDebuggerStatement(node) {
	    next();
	    semicolon();
	    return finishNode(node, "DebuggerStatement");
	  }
	
	  function parseDoStatement(node) {
	    next();
	    labels.push(loopLabel);
	    node.body = parseStatement();
	    labels.pop();
	    expect(_while);
	    node.test = parseParenExpression();
	    if (options.ecmaVersion >= 6)
	      eat(_semi);
	    else
	      semicolon();
	    return finishNode(node, "DoWhileStatement");
	  }
	
	  // Disambiguating between a `for` and a `for`/`in` or `for`/`of`
	  // loop is non-trivial. Basically, we have to parse the init `var`
	  // statement or expression, disallowing the `in` operator (see
	  // the second parameter to `parseExpression`), and then check
	  // whether the next token is `in` or `of`. When there is no init
	  // part (semicolon immediately after the opening parenthesis), it
	  // is a regular `for` loop.
	
	  function parseForStatement(node) {
	    next();
	    labels.push(loopLabel);
	    expect(_parenL);
	    if (tokType === _semi) return parseFor(node, null);
	    if (tokType === _var || tokType === _let) {
	      var init = startNode(), varKind = tokType.keyword, isLet = tokType === _let;
	      next();
	      parseVar(init, true, varKind);
	      finishNode(init, "VariableDeclaration");
	      if ((tokType === _in || (options.ecmaVersion >= 6 && tokType === _name && tokVal === "of")) && init.declarations.length === 1 &&
	          !(isLet && init.declarations[0].init))
	        return parseForIn(node, init);
	      return parseFor(node, init);
	    }
	    var init = parseExpression(false, true);
	    if (tokType === _in || (options.ecmaVersion >= 6 && tokType === _name && tokVal === "of")) {
	      checkLVal(init);
	      return parseForIn(node, init);
	    }
	    return parseFor(node, init);
	  }
	
	  function parseFunctionStatement(node) {
	    next();
	    return parseFunction(node, true);
	  }
	
	  function parseIfStatement(node) {
	    next();
	    node.test = parseParenExpression();
	    node.consequent = parseStatement();
	    node.alternate = eat(_else) ? parseStatement() : null;
	    return finishNode(node, "IfStatement");
	  }
	
	  function parseReturnStatement(node) {
	    if (!inFunction && !options.allowReturnOutsideFunction)
	      raise(tokStart, "'return' outside of function");
	    next();
	
	    // In `return` (and `break`/`continue`), the keywords with
	    // optional arguments, we eagerly look for a semicolon or the
	    // possibility to insert one.
	
	    if (eat(_semi) || canInsertSemicolon()) node.argument = null;
	    else { node.argument = parseExpression(); semicolon(); }
	    return finishNode(node, "ReturnStatement");
	  }
	
	  function parseSwitchStatement(node) {
	    next();
	    node.discriminant = parseParenExpression();
	    node.cases = [];
	    expect(_braceL);
	    labels.push(switchLabel);
	
	    // Statements under must be grouped (by label) in SwitchCase
	    // nodes. `cur` is used to keep the node that we are currently
	    // adding statements to.
	
	    for (var cur, sawDefault; tokType != _braceR;) {
	      if (tokType === _case || tokType === _default) {
	        var isCase = tokType === _case;
	        if (cur) finishNode(cur, "SwitchCase");
	        node.cases.push(cur = startNode());
	        cur.consequent = [];
	        next();
	        if (isCase) cur.test = parseExpression();
	        else {
	          if (sawDefault) raise(lastStart, "Multiple default clauses"); sawDefault = true;
	          cur.test = null;
	        }
	        expect(_colon);
	      } else {
	        if (!cur) unexpected();
	        cur.consequent.push(parseStatement());
	      }
	    }
	    if (cur) finishNode(cur, "SwitchCase");
	    next(); // Closing brace
	    labels.pop();
	    return finishNode(node, "SwitchStatement");
	  }
	
	  function parseThrowStatement(node) {
	    next();
	    if (newline.test(input.slice(lastEnd, tokStart)))
	      raise(lastEnd, "Illegal newline after throw");
	    node.argument = parseExpression();
	    semicolon();
	    return finishNode(node, "ThrowStatement");
	  }
	
	  function parseTryStatement(node) {
	    next();
	    node.block = parseBlock();
	    node.handler = null;
	    if (tokType === _catch) {
	      var clause = startNode();
	      next();
	      expect(_parenL);
	      clause.param = parseIdent();
	      if (strict && isStrictBadIdWord(clause.param.name))
	        raise(clause.param.start, "Binding " + clause.param.name + " in strict mode");
	      expect(_parenR);
	      clause.guard = null;
	      clause.body = parseBlock();
	      node.handler = finishNode(clause, "CatchClause");
	    }
	    node.guardedHandlers = empty;
	    node.finalizer = eat(_finally) ? parseBlock() : null;
	    if (!node.handler && !node.finalizer)
	      raise(node.start, "Missing catch or finally clause");
	    return finishNode(node, "TryStatement");
	  }
	
	  function parseVarStatement(node, kind) {
	    next();
	    parseVar(node, false, kind);
	    semicolon();
	    return finishNode(node, "VariableDeclaration");
	  }
	
	  function parseWhileStatement(node) {
	    next();
	    node.test = parseParenExpression();
	    labels.push(loopLabel);
	    node.body = parseStatement();
	    labels.pop();
	    return finishNode(node, "WhileStatement");
	  }
	
	  function parseWithStatement(node) {
	    if (strict) raise(tokStart, "'with' in strict mode");
	    next();
	    node.object = parseParenExpression();
	    node.body = parseStatement();
	    return finishNode(node, "WithStatement");
	  }
	
	  function parseEmptyStatement(node) {
	    next();
	    return finishNode(node, "EmptyStatement");
	  }
	
	  function parseLabeledStatement(node, maybeName, expr) {
	    for (var i = 0; i < labels.length; ++i)
	      if (labels[i].name === maybeName) raise(expr.start, "Label '" + maybeName + "' is already declared");
	    var kind = tokType.isLoop ? "loop" : tokType === _switch ? "switch" : null;
	    labels.push({name: maybeName, kind: kind});
	    node.body = parseStatement();
	    labels.pop();
	    node.label = expr;
	    return finishNode(node, "LabeledStatement");
	  }
	
	  function parseExpressionStatement(node, expr) {
	    node.expression = expr;
	    semicolon();
	    return finishNode(node, "ExpressionStatement");
	  }
	
	  // Used for constructs like `switch` and `if` that insist on
	  // parentheses around their expression.
	
	  function parseParenExpression() {
	    expect(_parenL);
	    var val = parseExpression();
	    expect(_parenR);
	    return val;
	  }
	
	  // Parse a semicolon-enclosed block of statements, handling `"use
	  // strict"` declarations when `allowStrict` is true (used for
	  // function bodies).
	
	  function parseBlock(allowStrict) {
	    var node = startNode(), first = true, oldStrict;
	    node.body = [];
	    expect(_braceL);
	    while (!eat(_braceR)) {
	      var stmt = parseStatement();
	      node.body.push(stmt);
	      if (first && allowStrict && isUseStrict(stmt)) {
	        oldStrict = strict;
	        setStrict(strict = true);
	      }
	      first = false;
	    }
	    if (oldStrict === false) setStrict(false);
	    return finishNode(node, "BlockStatement");
	  }
	
	  // Parse a regular `for` loop. The disambiguation code in
	  // `parseStatement` will already have parsed the init statement or
	  // expression.
	
	  function parseFor(node, init) {
	    node.init = init;
	    expect(_semi);
	    node.test = tokType === _semi ? null : parseExpression();
	    expect(_semi);
	    node.update = tokType === _parenR ? null : parseExpression();
	    expect(_parenR);
	    node.body = parseStatement();
	    labels.pop();
	    return finishNode(node, "ForStatement");
	  }
	
	  // Parse a `for`/`in` and `for`/`of` loop, which are almost
	  // same from parser's perspective.
	
	  function parseForIn(node, init) {
	    var type = tokType === _in ? "ForInStatement" : "ForOfStatement";
	    next();
	    node.left = init;
	    node.right = parseExpression();
	    expect(_parenR);
	    node.body = parseStatement();
	    labels.pop();
	    return finishNode(node, type);
	  }
	
	  // Parse a list of variable declarations.
	
	  function parseVar(node, noIn, kind) {
	    node.declarations = [];
	    node.kind = kind;
	    for (;;) {
	      var decl = startNode();
	      decl.id = options.ecmaVersion >= 6 ? toAssignable(parseExprAtom()) : parseIdent();
	      checkLVal(decl.id, true);
	      decl.init = eat(_eq) ? parseExpression(true, noIn) : (kind === _const.keyword ? unexpected() : null);
	      node.declarations.push(finishNode(decl, "VariableDeclarator"));
	      if (!eat(_comma)) break;
	    }
	    return node;
	  }
	
	  // ### Expression parsing
	
	  // These nest, from the most general expression type at the top to
	  // 'atomic', nondivisible expression types at the bottom. Most of
	  // the functions will simply let the function(s) below them parse,
	  // and, *if* the syntactic construct they handle is present, wrap
	  // the AST node that the inner parser gave them in another node.
	
	  // Parse a full expression. The arguments are used to forbid comma
	  // sequences (in argument lists, array literals, or object literals)
	  // or the `in` operator (in for loops initalization expressions).
	
	  function parseExpression(noComma, noIn) {
	    var start = storeCurrentPos();
	    var expr = parseMaybeAssign(noIn);
	    if (!noComma && tokType === _comma) {
	      var node = startNodeAt(start);
	      node.expressions = [expr];
	      while (eat(_comma)) node.expressions.push(parseMaybeAssign(noIn));
	      return finishNode(node, "SequenceExpression");
	    }
	    return expr;
	  }
	
	  // Parse an assignment expression. This includes applications of
	  // operators like `+=`.
	
	  function parseMaybeAssign(noIn) {
	    var start = storeCurrentPos();
	    var left = parseMaybeConditional(noIn);
	    if (tokType.isAssign) {
	      var node = startNodeAt(start);
	      node.operator = tokVal;
	      node.left = tokType === _eq ? toAssignable(left) : left;
	      checkLVal(left);
	      next();
	      node.right = parseMaybeAssign(noIn);
	      return finishNode(node, "AssignmentExpression");
	    }
	    return left;
	  }
	
	  // Parse a ternary conditional (`?:`) operator.
	
	  function parseMaybeConditional(noIn) {
	    var start = storeCurrentPos();
	    var expr = parseExprOps(noIn);
	    if (eat(_question)) {
	      var node = startNodeAt(start);
	      node.test = expr;
	      node.consequent = parseExpression(true);
	      expect(_colon);
	      node.alternate = parseExpression(true, noIn);
	      return finishNode(node, "ConditionalExpression");
	    }
	    return expr;
	  }
	
	  // Start the precedence parser.
	
	  function parseExprOps(noIn) {
	    var start = storeCurrentPos();
	    return parseExprOp(parseMaybeUnary(), start, -1, noIn);
	  }
	
	  // Parse binary operators with the operator precedence parsing
	  // algorithm. `left` is the left-hand side of the operator.
	  // `minPrec` provides context that allows the function to stop and
	  // defer further parser to one of its callers when it encounters an
	  // operator that has a lower precedence than the set it is parsing.
	
	  function parseExprOp(left, leftStart, minPrec, noIn) {
	    var prec = tokType.binop;
	    if (prec != null && (!noIn || tokType !== _in)) {
	      if (prec > minPrec) {
	        var node = startNodeAt(leftStart);
	        node.left = left;
	        node.operator = tokVal;
	        var op = tokType;
	        next();
	        var start = storeCurrentPos();
	        node.right = parseExprOp(parseMaybeUnary(), start, prec, noIn);
	        finishNode(node, (op === _logicalOR || op === _logicalAND) ? "LogicalExpression" : "BinaryExpression");
	        return parseExprOp(node, leftStart, minPrec, noIn);
	      }
	    }
	    return left;
	  }
	
	  // Parse unary operators, both prefix and postfix.
	
	  function parseMaybeUnary() {
	    if (tokType.prefix) {
	      var node = startNode(), update = tokType.isUpdate, nodeType;
	      if (tokType === _ellipsis) {
	        nodeType = "SpreadElement";
	      } else {
	        nodeType = update ? "UpdateExpression" : "UnaryExpression";
	        node.operator = tokVal;
	        node.prefix = true;
	      }
	      tokRegexpAllowed = true;
	      next();
	      node.argument = parseMaybeUnary();
	      if (update) checkLVal(node.argument);
	      else if (strict && node.operator === "delete" &&
	               node.argument.type === "Identifier")
	        raise(node.start, "Deleting local variable in strict mode");
	      return finishNode(node, nodeType);
	    }
	    var start = storeCurrentPos();
	    var expr = parseExprSubscripts();
	    while (tokType.postfix && !canInsertSemicolon()) {
	      var node = startNodeAt(start);
	      node.operator = tokVal;
	      node.prefix = false;
	      node.argument = expr;
	      checkLVal(expr);
	      next();
	      expr = finishNode(node, "UpdateExpression");
	    }
	    return expr;
	  }
	
	  // Parse call, dot, and `[]`-subscript expressions.
	
	  function parseExprSubscripts() {
	    var start = storeCurrentPos();
	    return parseSubscripts(parseExprAtom(), start);
	  }
	
	  function parseSubscripts(base, start, noCalls) {
	    if (eat(_dot)) {
	      var node = startNodeAt(start);
	      node.object = base;
	      node.property = parseIdent(true);
	      node.computed = false;
	      return parseSubscripts(finishNode(node, "MemberExpression"), start, noCalls);
	    } else if (eat(_bracketL)) {
	      var node = startNodeAt(start);
	      node.object = base;
	      node.property = parseExpression();
	      node.computed = true;
	      expect(_bracketR);
	      return parseSubscripts(finishNode(node, "MemberExpression"), start, noCalls);
	    } else if (!noCalls && eat(_parenL)) {
	      var node = startNodeAt(start);
	      node.callee = base;
	      node.arguments = parseExprList(_parenR, false);
	      return parseSubscripts(finishNode(node, "CallExpression"), start, noCalls);
	    } else if (tokType === _template) {
	      var node = startNodeAt(start);
	      node.tag = base;
	      node.quasi = parseTemplate();
	      return parseSubscripts(finishNode(node, "TaggedTemplateExpression"), start, noCalls);
	    } return base;
	  }
	
	  // Parse an atomic expression — either a single token that is an
	  // expression, an expression started by a keyword like `function` or
	  // `new`, or an expression wrapped in punctuation like `()`, `[]`,
	  // or `{}`.
	
	  function parseExprAtom() {
	    switch (tokType) {
	    case _this:
	      var node = startNode();
	      next();
	      return finishNode(node, "ThisExpression");
	
	    case _yield:
	      if (inGenerator) return parseYield();
	
	    case _name:
	      var start = storeCurrentPos();
	      var id = parseIdent(tokType !== _name);
	      if (eat(_arrow)) {
	        return parseArrowExpression(startNodeAt(start), [id]);
	      }
	      return id;
	
	    case _regexp:
	      var node = startNode();
	      node.regex = {pattern: tokVal.pattern, flags: tokVal.flags};
	      node.value = tokVal.value;
	      node.raw = input.slice(tokStart, tokEnd);
	      next();
	      return finishNode(node, "Literal");
	
	    case _num: case _string:
	      var node = startNode();
	      node.value = tokVal;
	      node.raw = input.slice(tokStart, tokEnd);
	      next();
	      return finishNode(node, "Literal");
	
	    case _null: case _true: case _false:
	      var node = startNode();
	      node.value = tokType.atomValue;
	      node.raw = tokType.keyword;
	      next();
	      return finishNode(node, "Literal");
	
	    case _parenL:
	      var start = storeCurrentPos();
	      var val, exprList;
	      next();
	      // check whether this is generator comprehension or regular expression
	      if (options.ecmaVersion >= 7 && tokType === _for) {
	        val = parseComprehension(startNodeAt(start), true);
	      } else {
	        var oldParenL = ++metParenL;
	        if (tokType !== _parenR) {
	          val = parseExpression();
	          exprList = val.type === "SequenceExpression" ? val.expressions : [val];
	        } else {
	          exprList = [];
	        }
	        expect(_parenR);
	        // if '=>' follows '(...)', convert contents to arguments
	        if (metParenL === oldParenL && eat(_arrow)) {
	          val = parseArrowExpression(startNodeAt(start), exprList);
	        } else {
	          // forbid '()' before everything but '=>'
	          if (!val) unexpected(lastStart);
	          // forbid '...' in sequence expressions
	          if (options.ecmaVersion >= 6) {
	            for (var i = 0; i < exprList.length; i++) {
	              if (exprList[i].type === "SpreadElement") unexpected();
	            }
	          }
	
	          if (options.preserveParens) {
	            var par = startNodeAt(start);
	            par.expression = val;
	            val = finishNode(par, "ParenthesizedExpression");
	          }
	        }
	      }
	      return val;
	
	    case _bracketL:
	      var node = startNode();
	      next();
	      // check whether this is array comprehension or regular array
	      if (options.ecmaVersion >= 7 && tokType === _for) {
	        return parseComprehension(node, false);
	      }
	      node.elements = parseExprList(_bracketR, true, true);
	      return finishNode(node, "ArrayExpression");
	
	    case _braceL:
	      return parseObj();
	
	    case _function:
	      var node = startNode();
	      next();
	      return parseFunction(node, false);
	
	    case _class:
	      return parseClass(startNode(), false);
	
	    case _new:
	      return parseNew();
	
	    case _template:
	      return parseTemplate();
	
	    default:
	      unexpected();
	    }
	  }
	
	  // New's precedence is slightly tricky. It must allow its argument
	  // to be a `[]` or dot subscript expression, but not a call — at
	  // least, not without wrapping it in parentheses. Thus, it uses the
	
	  function parseNew() {
	    var node = startNode();
	    next();
	    var start = storeCurrentPos();
	    node.callee = parseSubscripts(parseExprAtom(), start, true);
	    if (eat(_parenL)) node.arguments = parseExprList(_parenR, false);
	    else node.arguments = empty;
	    return finishNode(node, "NewExpression");
	  }
	
	  // Parse template expression.
	
	  function parseTemplateElement() {
	    var elem = startNodeAt(options.locations ? [tokStart + 1, tokStartLoc.offset(1)] : tokStart + 1);
	    elem.value = tokVal;
	    elem.tail = input.charCodeAt(tokEnd - 1) !== 123; // '{'
	    next();
	    var endOff = elem.tail ? 1 : 2;
	    return finishNodeAt(elem, "TemplateElement", options.locations ? [lastEnd - endOff, lastEndLoc.offset(-endOff)] : lastEnd - endOff);
	  }
	
	  function parseTemplate() {
	    var node = startNode();
	    node.expressions = [];
	    var curElt = parseTemplateElement();
	    node.quasis = [curElt];
	    while (!curElt.tail) {
	      node.expressions.push(parseExpression());
	      if (tokType !== _templateContinued) unexpected();
	      node.quasis.push(curElt = parseTemplateElement());
	    }
	    return finishNode(node, "TemplateLiteral");
	  }
	
	  // Parse an object literal.
	
	  function parseObj() {
	    var node = startNode(), first = true, propHash = {};
	    node.properties = [];
	    next();
	    while (!eat(_braceR)) {
	      if (!first) {
	        expect(_comma);
	        if (options.allowTrailingCommas && eat(_braceR)) break;
	      } else first = false;
	
	      var prop = startNode(), isGenerator;
	      if (options.ecmaVersion >= 6) {
	        prop.method = false;
	        prop.shorthand = false;
	        isGenerator = eat(_star);
	      }
	      parsePropertyName(prop);
	      if (eat(_colon)) {
	        prop.value = parseExpression(true);
	        prop.kind = "init";
	      } else if (options.ecmaVersion >= 6 && tokType === _parenL) {
	        prop.kind = "init";
	        prop.method = true;
	        prop.value = parseMethod(isGenerator);
	      } else if (options.ecmaVersion >= 5 && !prop.computed && prop.key.type === "Identifier" &&
	                 (prop.key.name === "get" || prop.key.name === "set")) {
	        if (isGenerator) unexpected();
	        prop.kind = prop.key.name;
	        parsePropertyName(prop);
	        prop.value = parseMethod(false);
	      } else if (options.ecmaVersion >= 6 && !prop.computed && prop.key.type === "Identifier") {
	        prop.kind = "init";
	        prop.value = prop.key;
	        prop.shorthand = true;
	      } else unexpected();
	
	      checkPropClash(prop, propHash);
	      node.properties.push(finishNode(prop, "Property"));
	    }
	    return finishNode(node, "ObjectExpression");
	  }
	
	  function parsePropertyName(prop) {
	    if (options.ecmaVersion >= 6) {
	      if (eat(_bracketL)) {
	        prop.computed = true;
	        prop.key = parseExpression();
	        expect(_bracketR);
	        return;
	      } else {
	        prop.computed = false;
	      }
	    }
	    prop.key = (tokType === _num || tokType === _string) ? parseExprAtom() : parseIdent(true);
	  }
	
	  // Initialize empty function node.
	
	  function initFunction(node) {
	    node.id = null;
	    node.params = [];
	    if (options.ecmaVersion >= 6) {
	      node.defaults = [];
	      node.rest = null;
	      node.generator = false;
	    }
	  }
	
	  // Parse a function declaration or literal (depending on the
	  // `isStatement` parameter).
	
	  function parseFunction(node, isStatement, allowExpressionBody) {
	    initFunction(node);
	    if (options.ecmaVersion >= 6) {
	      node.generator = eat(_star);
	    }
	    if (isStatement || tokType === _name) {
	      node.id = parseIdent();
	    }
	    parseFunctionParams(node);
	    parseFunctionBody(node, allowExpressionBody);
	    return finishNode(node, isStatement ? "FunctionDeclaration" : "FunctionExpression");
	  }
	
	  // Parse object or class method.
	
	  function parseMethod(isGenerator) {
	    var node = startNode();
	    initFunction(node);
	    parseFunctionParams(node);
	    var allowExpressionBody;
	    if (options.ecmaVersion >= 6) {
	      node.generator = isGenerator;
	      allowExpressionBody = true;
	    } else {
	      allowExpressionBody = false;
	    }
	    parseFunctionBody(node, allowExpressionBody);
	    return finishNode(node, "FunctionExpression");
	  }
	
	  // Parse arrow function expression with given parameters.
	
	  function parseArrowExpression(node, params) {
	    initFunction(node);
	
	    var defaults = node.defaults, hasDefaults = false;
	
	    for (var i = 0, lastI = params.length - 1; i <= lastI; i++) {
	      var param = params[i];
	
	      if (param.type === "AssignmentExpression" && param.operator === "=") {
	        hasDefaults = true;
	        params[i] = param.left;
	        defaults.push(param.right);
	      } else {
	        toAssignable(param, i === lastI, true);
	        defaults.push(null);
	        if (param.type === "SpreadElement") {
	          params.length--;
	          node.rest = param.argument;
	          break;
	        }
	      }
	    }
	
	    node.params = params;
	    if (!hasDefaults) node.defaults = [];
	
	    parseFunctionBody(node, true);
	    return finishNode(node, "ArrowFunctionExpression");
	  }
	
	  // Parse function parameters.
	
	  function parseFunctionParams(node) {
	    var defaults = [], hasDefaults = false;
	
	    expect(_parenL);
	    for (;;) {
	      if (eat(_parenR)) {
	        break;
	      } else if (options.ecmaVersion >= 6 && eat(_ellipsis)) {
	        node.rest = toAssignable(parseExprAtom(), false, true);
	        checkSpreadAssign(node.rest);
	        expect(_parenR);
	        defaults.push(null);
	        break;
	      } else {
	        node.params.push(options.ecmaVersion >= 6 ? toAssignable(parseExprAtom(), false, true) : parseIdent());
	        if (options.ecmaVersion >= 6) {
	          if (eat(_eq)) {
	            hasDefaults = true;
	            defaults.push(parseExpression(true));
	          } else {
	            defaults.push(null);
	          }
	        }
	        if (!eat(_comma)) {
	          expect(_parenR);
	          break;
	        }
	      }
	    }
	
	    if (hasDefaults) node.defaults = defaults;
	  }
	
	  // Parse function body and check parameters.
	
	  function parseFunctionBody(node, allowExpression) {
	    var isExpression = allowExpression && tokType !== _braceL;
	
	    if (isExpression) {
	      node.body = parseExpression(true);
	      node.expression = true;
	    } else {
	      // Start a new scope with regard to labels and the `inFunction`
	      // flag (restore them to their old value afterwards).
	      var oldInFunc = inFunction, oldInGen = inGenerator, oldLabels = labels;
	      inFunction = true; inGenerator = node.generator; labels = [];
	      node.body = parseBlock(true);
	      node.expression = false;
	      inFunction = oldInFunc; inGenerator = oldInGen; labels = oldLabels;
	    }
	
	    // If this is a strict mode function, verify that argument names
	    // are not repeated, and it does not try to bind the words `eval`
	    // or `arguments`.
	    if (strict || !isExpression && node.body.body.length && isUseStrict(node.body.body[0])) {
	      var nameHash = {};
	      if (node.id)
	        checkFunctionParam(node.id, {});
	      for (var i = 0; i < node.params.length; i++)
	        checkFunctionParam(node.params[i], nameHash);
	      if (node.rest)
	        checkFunctionParam(node.rest, nameHash);
	    }
	  }
	
	  // Parse a class declaration or literal (depending on the
	  // `isStatement` parameter).
	
	  function parseClass(node, isStatement) {
	    next();
	    node.id = tokType === _name ? parseIdent() : isStatement ? unexpected() : null;
	    node.superClass = eat(_extends) ? parseExpression() : null;
	    var classBody = startNode();
	    classBody.body = [];
	    expect(_braceL);
	    while (!eat(_braceR)) {
	      var method = startNode();
	      if (tokType === _name && tokVal === "static") {
	        next();
	        method['static'] = true;
	      } else {
	        method['static'] = false;
	      }
	      var isGenerator = eat(_star);
	      parsePropertyName(method);
	      if (tokType !== _parenL && !method.computed && method.key.type === "Identifier" &&
	          (method.key.name === "get" || method.key.name === "set")) {
	        if (isGenerator) unexpected();
	        method.kind = method.key.name;
	        parsePropertyName(method);
	      } else {
	        method.kind = "";
	      }
	      method.value = parseMethod(isGenerator);
	      classBody.body.push(finishNode(method, "MethodDefinition"));
	      eat(_semi);
	    }
	    node.body = finishNode(classBody, "ClassBody");
	    return finishNode(node, isStatement ? "ClassDeclaration" : "ClassExpression");
	  }
	
	  // Parses a comma-separated list of expressions, and returns them as
	  // an array. `close` is the token type that ends the list, and
	  // `allowEmpty` can be turned on to allow subsequent commas with
	  // nothing in between them to be parsed as `null` (which is needed
	  // for array literals).
	
	  function parseExprList(close, allowTrailingComma, allowEmpty) {
	    var elts = [], first = true;
	    while (!eat(close)) {
	      if (!first) {
	        expect(_comma);
	        if (allowTrailingComma && options.allowTrailingCommas && eat(close)) break;
	      } else first = false;
	
	      if (allowEmpty && tokType === _comma) elts.push(null);
	      else elts.push(parseExpression(true));
	    }
	    return elts;
	  }
	
	  // Parse the next token as an identifier. If `liberal` is true (used
	  // when parsing properties), it will also convert keywords into
	  // identifiers.
	
	  function parseIdent(liberal) {
	    var node = startNode();
	    if (liberal && options.forbidReserved == "everywhere") liberal = false;
	    if (tokType === _name) {
	      if (!liberal &&
	          (options.forbidReserved &&
	           (options.ecmaVersion === 3 ? isReservedWord3 : isReservedWord5)(tokVal) ||
	           strict && isStrictReservedWord(tokVal)) &&
	          input.slice(tokStart, tokEnd).indexOf("\\") == -1)
	        raise(tokStart, "The keyword '" + tokVal + "' is reserved");
	      node.name = tokVal;
	    } else if (liberal && tokType.keyword) {
	      node.name = tokType.keyword;
	    } else {
	      unexpected();
	    }
	    tokRegexpAllowed = false;
	    next();
	    return finishNode(node, "Identifier");
	  }
	
	  // Parses module export declaration.
	
	  function parseExport(node) {
	    next();
	    // export var|const|let|function|class ...;
	    if (tokType === _var || tokType === _const || tokType === _let || tokType === _function || tokType === _class) {
	      node.declaration = parseStatement();
	      node['default'] = false;
	      node.specifiers = null;
	      node.source = null;
	    } else
	    // export default ...;
	    if (eat(_default)) {
	      node.declaration = parseExpression(true);
	      node['default'] = true;
	      node.specifiers = null;
	      node.source = null;
	      semicolon();
	    } else {
	      // export * from '...';
	      // export { x, y as z } [from '...'];
	      var isBatch = tokType === _star;
	      node.declaration = null;
	      node['default'] = false;
	      node.specifiers = parseExportSpecifiers();
	      if (tokType === _name && tokVal === "from") {
	        next();
	        node.source = tokType === _string ? parseExprAtom() : unexpected();
	      } else {
	        if (isBatch) unexpected();
	        node.source = null;
	      }
	      semicolon();
	    }
	    return finishNode(node, "ExportDeclaration");
	  }
	
	  // Parses a comma-separated list of module exports.
	
	  function parseExportSpecifiers() {
	    var nodes = [], first = true;
	    if (tokType === _star) {
	      // export * from '...'
	      var node = startNode();
	      next();
	      nodes.push(finishNode(node, "ExportBatchSpecifier"));
	    } else {
	      // export { x, y as z } [from '...']
	      expect(_braceL);
	      while (!eat(_braceR)) {
	        if (!first) {
	          expect(_comma);
	          if (options.allowTrailingCommas && eat(_braceR)) break;
	        } else first = false;
	
	        var node = startNode();
	        node.id = parseIdent(tokType === _default);
	        if (tokType === _name && tokVal === "as") {
	          next();
	          node.name = parseIdent(true);
	        } else {
	          node.name = null;
	        }
	        nodes.push(finishNode(node, "ExportSpecifier"));
	      }
	    }
	    return nodes;
	  }
	
	  // Parses import declaration.
	
	  function parseImport(node) {
	    next();
	    // import '...';
	    if (tokType === _string) {
	      node.specifiers = [];
	      node.source = parseExprAtom();
	      node.kind = "";
	    } else {
	      node.specifiers = parseImportSpecifiers();
	      if (tokType !== _name || tokVal !== "from") unexpected();
	      next();
	      node.source = tokType === _string ? parseExprAtom() : unexpected();
	    }
	    semicolon();
	    return finishNode(node, "ImportDeclaration");
	  }
	
	  // Parses a comma-separated list of module imports.
	
	  function parseImportSpecifiers() {
	    var nodes = [], first = true;
	    if (tokType === _name) {
	      // import defaultObj, { x, y as z } from '...'
	      var node = startNode();
	      node.id = parseIdent();
	      checkLVal(node.id, true);
	      node.name = null;
	      node['default'] = true;
	      nodes.push(finishNode(node, "ImportSpecifier"));
	      if (!eat(_comma)) return nodes;
	    }
	    if (tokType === _star) {
	      var node = startNode();
	      next();
	      if (tokType !== _name || tokVal !== "as") unexpected();
	      next();
	      node.name = parseIdent();
	      checkLVal(node.name, true);
	      nodes.push(finishNode(node, "ImportBatchSpecifier"));
	      return nodes;
	    }
	    expect(_braceL);
	    while (!eat(_braceR)) {
	      if (!first) {
	        expect(_comma);
	        if (options.allowTrailingCommas && eat(_braceR)) break;
	      } else first = false;
	
	      var node = startNode();
	      node.id = parseIdent(true);
	      if (tokType === _name && tokVal === "as") {
	        next();
	        node.name = parseIdent();
	      } else {
	        node.name = null;
	      }
	      checkLVal(node.name || node.id, true);
	      node['default'] = false;
	      nodes.push(finishNode(node, "ImportSpecifier"));
	    }
	    return nodes;
	  }
	
	  // Parses yield expression inside generator.
	
	  function parseYield() {
	    var node = startNode();
	    next();
	    if (eat(_semi) || canInsertSemicolon()) {
	      node.delegate = false;
	      node.argument = null;
	    } else {
	      node.delegate = eat(_star);
	      node.argument = parseExpression(true);
	    }
	    return finishNode(node, "YieldExpression");
	  }
	
	  // Parses array and generator comprehensions.
	
	  function parseComprehension(node, isGenerator) {
	    node.blocks = [];
	    while (tokType === _for) {
	      var block = startNode();
	      next();
	      expect(_parenL);
	      block.left = toAssignable(parseExprAtom());
	      checkLVal(block.left, true);
	      if (tokType !== _name || tokVal !== "of") unexpected();
	      next();
	      // `of` property is here for compatibility with Esprima's AST
	      // which also supports deprecated [for (... in ...) expr]
	      block.of = true;
	      block.right = parseExpression();
	      expect(_parenR);
	      node.blocks.push(finishNode(block, "ComprehensionBlock"));
	    }
	    node.filter = eat(_if) ? parseParenExpression() : null;
	    node.body = parseExpression();
	    expect(isGenerator ? _parenR : _bracketR);
	    node.generator = isGenerator;
	    return finishNode(node, "ComprehensionExpression");
	  }
	
	});


/***/ },

/***/ 368:
/***/ function(module, exports, __webpack_require__) {

	/*
	 * Copyright 2009-2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE.txt or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */
	exports.SourceMapGenerator = __webpack_require__(369).SourceMapGenerator;
	exports.SourceMapConsumer = __webpack_require__(375).SourceMapConsumer;
	exports.SourceNode = __webpack_require__(377).SourceNode;


/***/ },

/***/ 369:
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* -*- Mode: js; js-indent-level: 2; -*- */
	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */
	if (false) {
	    var define = require('amdefine')(module, require);
	}
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
	
	  var base64VLQ = __webpack_require__(370);
	  var util = __webpack_require__(372);
	  var ArraySet = __webpack_require__(373).ArraySet;
	  var MappingList = __webpack_require__(374).MappingList;
	
	  /**
	   * An instance of the SourceMapGenerator represents a source map which is
	   * being built incrementally. You may pass an object with the following
	   * properties:
	   *
	   *   - file: The filename of the generated source.
	   *   - sourceRoot: A root for all relative URLs in this source map.
	   */
	  function SourceMapGenerator(aArgs) {
	    if (!aArgs) {
	      aArgs = {};
	    }
	    this._file = util.getArg(aArgs, 'file', null);
	    this._sourceRoot = util.getArg(aArgs, 'sourceRoot', null);
	    this._skipValidation = util.getArg(aArgs, 'skipValidation', false);
	    this._sources = new ArraySet();
	    this._names = new ArraySet();
	    this._mappings = new MappingList();
	    this._sourcesContents = null;
	  }
	
	  SourceMapGenerator.prototype._version = 3;
	
	  /**
	   * Creates a new SourceMapGenerator based on a SourceMapConsumer
	   *
	   * @param aSourceMapConsumer The SourceMap.
	   */
	  SourceMapGenerator.fromSourceMap =
	    function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
	      var sourceRoot = aSourceMapConsumer.sourceRoot;
	      var generator = new SourceMapGenerator({
	        file: aSourceMapConsumer.file,
	        sourceRoot: sourceRoot
	      });
	      aSourceMapConsumer.eachMapping(function (mapping) {
	        var newMapping = {
	          generated: {
	            line: mapping.generatedLine,
	            column: mapping.generatedColumn
	          }
	        };
	
	        if (mapping.source != null) {
	          newMapping.source = mapping.source;
	          if (sourceRoot != null) {
	            newMapping.source = util.relative(sourceRoot, newMapping.source);
	          }
	
	          newMapping.original = {
	            line: mapping.originalLine,
	            column: mapping.originalColumn
	          };
	
	          if (mapping.name != null) {
	            newMapping.name = mapping.name;
	          }
	        }
	
	        generator.addMapping(newMapping);
	      });
	      aSourceMapConsumer.sources.forEach(function (sourceFile) {
	        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
	        if (content != null) {
	          generator.setSourceContent(sourceFile, content);
	        }
	      });
	      return generator;
	    };
	
	  /**
	   * Add a single mapping from original source line and column to the generated
	   * source's line and column for this source map being created. The mapping
	   * object should have the following properties:
	   *
	   *   - generated: An object with the generated line and column positions.
	   *   - original: An object with the original line and column positions.
	   *   - source: The original source file (relative to the sourceRoot).
	   *   - name: An optional original token name for this mapping.
	   */
	  SourceMapGenerator.prototype.addMapping =
	    function SourceMapGenerator_addMapping(aArgs) {
	      var generated = util.getArg(aArgs, 'generated');
	      var original = util.getArg(aArgs, 'original', null);
	      var source = util.getArg(aArgs, 'source', null);
	      var name = util.getArg(aArgs, 'name', null);
	
	      if (!this._skipValidation) {
	        this._validateMapping(generated, original, source, name);
	      }
	
	      if (source != null && !this._sources.has(source)) {
	        this._sources.add(source);
	      }
	
	      if (name != null && !this._names.has(name)) {
	        this._names.add(name);
	      }
	
	      this._mappings.add({
	        generatedLine: generated.line,
	        generatedColumn: generated.column,
	        originalLine: original != null && original.line,
	        originalColumn: original != null && original.column,
	        source: source,
	        name: name
	      });
	    };
	
	  /**
	   * Set the source content for a source file.
	   */
	  SourceMapGenerator.prototype.setSourceContent =
	    function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
	      var source = aSourceFile;
	      if (this._sourceRoot != null) {
	        source = util.relative(this._sourceRoot, source);
	      }
	
	      if (aSourceContent != null) {
	        // Add the source content to the _sourcesContents map.
	        // Create a new _sourcesContents map if the property is null.
	        if (!this._sourcesContents) {
	          this._sourcesContents = {};
	        }
	        this._sourcesContents[util.toSetString(source)] = aSourceContent;
	      } else if (this._sourcesContents) {
	        // Remove the source file from the _sourcesContents map.
	        // If the _sourcesContents map is empty, set the property to null.
	        delete this._sourcesContents[util.toSetString(source)];
	        if (Object.keys(this._sourcesContents).length === 0) {
	          this._sourcesContents = null;
	        }
	      }
	    };
	
	  /**
	   * Applies the mappings of a sub-source-map for a specific source file to the
	   * source map being generated. Each mapping to the supplied source file is
	   * rewritten using the supplied source map. Note: The resolution for the
	   * resulting mappings is the minimium of this map and the supplied map.
	   *
	   * @param aSourceMapConsumer The source map to be applied.
	   * @param aSourceFile Optional. The filename of the source file.
	   *        If omitted, SourceMapConsumer's file property will be used.
	   * @param aSourceMapPath Optional. The dirname of the path to the source map
	   *        to be applied. If relative, it is relative to the SourceMapConsumer.
	   *        This parameter is needed when the two source maps aren't in the same
	   *        directory, and the source map to be applied contains relative source
	   *        paths. If so, those relative source paths need to be rewritten
	   *        relative to the SourceMapGenerator.
	   */
	  SourceMapGenerator.prototype.applySourceMap =
	    function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
	      var sourceFile = aSourceFile;
	      // If aSourceFile is omitted, we will use the file property of the SourceMap
	      if (aSourceFile == null) {
	        if (aSourceMapConsumer.file == null) {
	          throw new Error(
	            'SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, ' +
	            'or the source map\'s "file" property. Both were omitted.'
	          );
	        }
	        sourceFile = aSourceMapConsumer.file;
	      }
	      var sourceRoot = this._sourceRoot;
	      // Make "sourceFile" relative if an absolute Url is passed.
	      if (sourceRoot != null) {
	        sourceFile = util.relative(sourceRoot, sourceFile);
	      }
	      // Applying the SourceMap can add and remove items from the sources and
	      // the names array.
	      var newSources = new ArraySet();
	      var newNames = new ArraySet();
	
	      // Find mappings for the "sourceFile"
	      this._mappings.unsortedForEach(function (mapping) {
	        if (mapping.source === sourceFile && mapping.originalLine != null) {
	          // Check if it can be mapped by the source map, then update the mapping.
	          var original = aSourceMapConsumer.originalPositionFor({
	            line: mapping.originalLine,
	            column: mapping.originalColumn
	          });
	          if (original.source != null) {
	            // Copy mapping
	            mapping.source = original.source;
	            if (aSourceMapPath != null) {
	              mapping.source = util.join(aSourceMapPath, mapping.source)
	            }
	            if (sourceRoot != null) {
	              mapping.source = util.relative(sourceRoot, mapping.source);
	            }
	            mapping.originalLine = original.line;
	            mapping.originalColumn = original.column;
	            if (original.name != null) {
	              mapping.name = original.name;
	            }
	          }
	        }
	
	        var source = mapping.source;
	        if (source != null && !newSources.has(source)) {
	          newSources.add(source);
	        }
	
	        var name = mapping.name;
	        if (name != null && !newNames.has(name)) {
	          newNames.add(name);
	        }
	
	      }, this);
	      this._sources = newSources;
	      this._names = newNames;
	
	      // Copy sourcesContents of applied map.
	      aSourceMapConsumer.sources.forEach(function (sourceFile) {
	        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
	        if (content != null) {
	          if (aSourceMapPath != null) {
	            sourceFile = util.join(aSourceMapPath, sourceFile);
	          }
	          if (sourceRoot != null) {
	            sourceFile = util.relative(sourceRoot, sourceFile);
	          }
	          this.setSourceContent(sourceFile, content);
	        }
	      }, this);
	    };
	
	  /**
	   * A mapping can have one of the three levels of data:
	   *
	   *   1. Just the generated position.
	   *   2. The Generated position, original position, and original source.
	   *   3. Generated and original position, original source, as well as a name
	   *      token.
	   *
	   * To maintain consistency, we validate that any new mapping being added falls
	   * in to one of these categories.
	   */
	  SourceMapGenerator.prototype._validateMapping =
	    function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource,
	                                                aName) {
	      if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
	          && aGenerated.line > 0 && aGenerated.column >= 0
	          && !aOriginal && !aSource && !aName) {
	        // Case 1.
	        return;
	      }
	      else if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
	               && aOriginal && 'line' in aOriginal && 'column' in aOriginal
	               && aGenerated.line > 0 && aGenerated.column >= 0
	               && aOriginal.line > 0 && aOriginal.column >= 0
	               && aSource) {
	        // Cases 2 and 3.
	        return;
	      }
	      else {
	        throw new Error('Invalid mapping: ' + JSON.stringify({
	          generated: aGenerated,
	          source: aSource,
	          original: aOriginal,
	          name: aName
	        }));
	      }
	    };
	
	  /**
	   * Serialize the accumulated mappings in to the stream of base 64 VLQs
	   * specified by the source map format.
	   */
	  SourceMapGenerator.prototype._serializeMappings =
	    function SourceMapGenerator_serializeMappings() {
	      var previousGeneratedColumn = 0;
	      var previousGeneratedLine = 1;
	      var previousOriginalColumn = 0;
	      var previousOriginalLine = 0;
	      var previousName = 0;
	      var previousSource = 0;
	      var result = '';
	      var mapping;
	
	      var mappings = this._mappings.toArray();
	
	      for (var i = 0, len = mappings.length; i < len; i++) {
	        mapping = mappings[i];
	
	        if (mapping.generatedLine !== previousGeneratedLine) {
	          previousGeneratedColumn = 0;
	          while (mapping.generatedLine !== previousGeneratedLine) {
	            result += ';';
	            previousGeneratedLine++;
	          }
	        }
	        else {
	          if (i > 0) {
	            if (!util.compareByGeneratedPositions(mapping, mappings[i - 1])) {
	              continue;
	            }
	            result += ',';
	          }
	        }
	
	        result += base64VLQ.encode(mapping.generatedColumn
	                                   - previousGeneratedColumn);
	        previousGeneratedColumn = mapping.generatedColumn;
	
	        if (mapping.source != null) {
	          result += base64VLQ.encode(this._sources.indexOf(mapping.source)
	                                     - previousSource);
	          previousSource = this._sources.indexOf(mapping.source);
	
	          // lines are stored 0-based in SourceMap spec version 3
	          result += base64VLQ.encode(mapping.originalLine - 1
	                                     - previousOriginalLine);
	          previousOriginalLine = mapping.originalLine - 1;
	
	          result += base64VLQ.encode(mapping.originalColumn
	                                     - previousOriginalColumn);
	          previousOriginalColumn = mapping.originalColumn;
	
	          if (mapping.name != null) {
	            result += base64VLQ.encode(this._names.indexOf(mapping.name)
	                                       - previousName);
	            previousName = this._names.indexOf(mapping.name);
	          }
	        }
	      }
	
	      return result;
	    };
	
	  SourceMapGenerator.prototype._generateSourcesContent =
	    function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
	      return aSources.map(function (source) {
	        if (!this._sourcesContents) {
	          return null;
	        }
	        if (aSourceRoot != null) {
	          source = util.relative(aSourceRoot, source);
	        }
	        var key = util.toSetString(source);
	        return Object.prototype.hasOwnProperty.call(this._sourcesContents,
	                                                    key)
	          ? this._sourcesContents[key]
	          : null;
	      }, this);
	    };
	
	  /**
	   * Externalize the source map.
	   */
	  SourceMapGenerator.prototype.toJSON =
	    function SourceMapGenerator_toJSON() {
	      var map = {
	        version: this._version,
	        sources: this._sources.toArray(),
	        names: this._names.toArray(),
	        mappings: this._serializeMappings()
	      };
	      if (this._file != null) {
	        map.file = this._file;
	      }
	      if (this._sourceRoot != null) {
	        map.sourceRoot = this._sourceRoot;
	      }
	      if (this._sourcesContents) {
	        map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
	      }
	
	      return map;
	    };
	
	  /**
	   * Render the source map being generated to a string.
	   */
	  SourceMapGenerator.prototype.toString =
	    function SourceMapGenerator_toString() {
	      return JSON.stringify(this);
	    };
	
	  exports.SourceMapGenerator = SourceMapGenerator;
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },

/***/ 370:
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* -*- Mode: js; js-indent-level: 2; -*- */
	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 *
	 * Based on the Base 64 VLQ implementation in Closure Compiler:
	 * https://code.google.com/p/closure-compiler/source/browse/trunk/src/com/google/debugging/sourcemap/Base64VLQ.java
	 *
	 * Copyright 2011 The Closure Compiler Authors. All rights reserved.
	 * Redistribution and use in source and binary forms, with or without
	 * modification, are permitted provided that the following conditions are
	 * met:
	 *
	 *  * Redistributions of source code must retain the above copyright
	 *    notice, this list of conditions and the following disclaimer.
	 *  * Redistributions in binary form must reproduce the above
	 *    copyright notice, this list of conditions and the following
	 *    disclaimer in the documentation and/or other materials provided
	 *    with the distribution.
	 *  * Neither the name of Google Inc. nor the names of its
	 *    contributors may be used to endorse or promote products derived
	 *    from this software without specific prior written permission.
	 *
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
	 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
	 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
	 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
	 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
	 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
	 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */
	if (false) {
	    var define = require('amdefine')(module, require);
	}
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
	
	  var base64 = __webpack_require__(371);
	
	  // A single base 64 digit can contain 6 bits of data. For the base 64 variable
	  // length quantities we use in the source map spec, the first bit is the sign,
	  // the next four bits are the actual value, and the 6th bit is the
	  // continuation bit. The continuation bit tells us whether there are more
	  // digits in this value following this digit.
	  //
	  //   Continuation
	  //   |    Sign
	  //   |    |
	  //   V    V
	  //   101011
	
	  var VLQ_BASE_SHIFT = 5;
	
	  // binary: 100000
	  var VLQ_BASE = 1 << VLQ_BASE_SHIFT;
	
	  // binary: 011111
	  var VLQ_BASE_MASK = VLQ_BASE - 1;
	
	  // binary: 100000
	  var VLQ_CONTINUATION_BIT = VLQ_BASE;
	
	  /**
	   * Converts from a two-complement value to a value where the sign bit is
	   * placed in the least significant bit.  For example, as decimals:
	   *   1 becomes 2 (10 binary), -1 becomes 3 (11 binary)
	   *   2 becomes 4 (100 binary), -2 becomes 5 (101 binary)
	   */
	  function toVLQSigned(aValue) {
	    return aValue < 0
	      ? ((-aValue) << 1) + 1
	      : (aValue << 1) + 0;
	  }
	
	  /**
	   * Converts to a two-complement value from a value where the sign bit is
	   * placed in the least significant bit.  For example, as decimals:
	   *   2 (10 binary) becomes 1, 3 (11 binary) becomes -1
	   *   4 (100 binary) becomes 2, 5 (101 binary) becomes -2
	   */
	  function fromVLQSigned(aValue) {
	    var isNegative = (aValue & 1) === 1;
	    var shifted = aValue >> 1;
	    return isNegative
	      ? -shifted
	      : shifted;
	  }
	
	  /**
	   * Returns the base 64 VLQ encoded value.
	   */
	  exports.encode = function base64VLQ_encode(aValue) {
	    var encoded = "";
	    var digit;
	
	    var vlq = toVLQSigned(aValue);
	
	    do {
	      digit = vlq & VLQ_BASE_MASK;
	      vlq >>>= VLQ_BASE_SHIFT;
	      if (vlq > 0) {
	        // There are still more digits in this value, so we must make sure the
	        // continuation bit is marked.
	        digit |= VLQ_CONTINUATION_BIT;
	      }
	      encoded += base64.encode(digit);
	    } while (vlq > 0);
	
	    return encoded;
	  };
	
	  /**
	   * Decodes the next base 64 VLQ value from the given string and returns the
	   * value and the rest of the string via the out parameter.
	   */
	  exports.decode = function base64VLQ_decode(aStr, aOutParam) {
	    var i = 0;
	    var strLen = aStr.length;
	    var result = 0;
	    var shift = 0;
	    var continuation, digit;
	
	    do {
	      if (i >= strLen) {
	        throw new Error("Expected more digits in base 64 VLQ value.");
	      }
	      digit = base64.decode(aStr.charAt(i++));
	      continuation = !!(digit & VLQ_CONTINUATION_BIT);
	      digit &= VLQ_BASE_MASK;
	      result = result + (digit << shift);
	      shift += VLQ_BASE_SHIFT;
	    } while (continuation);
	
	    aOutParam.value = fromVLQSigned(result);
	    aOutParam.rest = aStr.slice(i);
	  };
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },

/***/ 371:
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* -*- Mode: js; js-indent-level: 2; -*- */
	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */
	if (false) {
	    var define = require('amdefine')(module, require);
	}
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
	
	  var charToIntMap = {};
	  var intToCharMap = {};
	
	  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
	    .split('')
	    .forEach(function (ch, index) {
	      charToIntMap[ch] = index;
	      intToCharMap[index] = ch;
	    });
	
	  /**
	   * Encode an integer in the range of 0 to 63 to a single base 64 digit.
	   */
	  exports.encode = function base64_encode(aNumber) {
	    if (aNumber in intToCharMap) {
	      return intToCharMap[aNumber];
	    }
	    throw new TypeError("Must be between 0 and 63: " + aNumber);
	  };
	
	  /**
	   * Decode a single base 64 digit to an integer.
	   */
	  exports.decode = function base64_decode(aChar) {
	    if (aChar in charToIntMap) {
	      return charToIntMap[aChar];
	    }
	    throw new TypeError("Not a valid base 64 digit: " + aChar);
	  };
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },

/***/ 372:
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* -*- Mode: js; js-indent-level: 2; -*- */
	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */
	if (false) {
	    var define = require('amdefine')(module, require);
	}
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
	
	  /**
	   * This is a helper function for getting values from parameter/options
	   * objects.
	   *
	   * @param args The object we are extracting values from
	   * @param name The name of the property we are getting.
	   * @param defaultValue An optional value to return if the property is missing
	   * from the object. If this is not specified and the property is missing, an
	   * error will be thrown.
	   */
	  function getArg(aArgs, aName, aDefaultValue) {
	    if (aName in aArgs) {
	      return aArgs[aName];
	    } else if (arguments.length === 3) {
	      return aDefaultValue;
	    } else {
	      throw new Error('"' + aName + '" is a required argument.');
	    }
	  }
	  exports.getArg = getArg;
	
	  var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.]*)(?::(\d+))?(\S*)$/;
	  var dataUrlRegexp = /^data:.+\,.+$/;
	
	  function urlParse(aUrl) {
	    var match = aUrl.match(urlRegexp);
	    if (!match) {
	      return null;
	    }
	    return {
	      scheme: match[1],
	      auth: match[2],
	      host: match[3],
	      port: match[4],
	      path: match[5]
	    };
	  }
	  exports.urlParse = urlParse;
	
	  function urlGenerate(aParsedUrl) {
	    var url = '';
	    if (aParsedUrl.scheme) {
	      url += aParsedUrl.scheme + ':';
	    }
	    url += '//';
	    if (aParsedUrl.auth) {
	      url += aParsedUrl.auth + '@';
	    }
	    if (aParsedUrl.host) {
	      url += aParsedUrl.host;
	    }
	    if (aParsedUrl.port) {
	      url += ":" + aParsedUrl.port
	    }
	    if (aParsedUrl.path) {
	      url += aParsedUrl.path;
	    }
	    return url;
	  }
	  exports.urlGenerate = urlGenerate;
	
	  /**
	   * Normalizes a path, or the path portion of a URL:
	   *
	   * - Replaces consequtive slashes with one slash.
	   * - Removes unnecessary '.' parts.
	   * - Removes unnecessary '<dir>/..' parts.
	   *
	   * Based on code in the Node.js 'path' core module.
	   *
	   * @param aPath The path or url to normalize.
	   */
	  function normalize(aPath) {
	    var path = aPath;
	    var url = urlParse(aPath);
	    if (url) {
	      if (!url.path) {
	        return aPath;
	      }
	      path = url.path;
	    }
	    var isAbsolute = (path.charAt(0) === '/');
	
	    var parts = path.split(/\/+/);
	    for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
	      part = parts[i];
	      if (part === '.') {
	        parts.splice(i, 1);
	      } else if (part === '..') {
	        up++;
	      } else if (up > 0) {
	        if (part === '') {
	          // The first part is blank if the path is absolute. Trying to go
	          // above the root is a no-op. Therefore we can remove all '..' parts
	          // directly after the root.
	          parts.splice(i + 1, up);
	          up = 0;
	        } else {
	          parts.splice(i, 2);
	          up--;
	        }
	      }
	    }
	    path = parts.join('/');
	
	    if (path === '') {
	      path = isAbsolute ? '/' : '.';
	    }
	
	    if (url) {
	      url.path = path;
	      return urlGenerate(url);
	    }
	    return path;
	  }
	  exports.normalize = normalize;
	
	  /**
	   * Joins two paths/URLs.
	   *
	   * @param aRoot The root path or URL.
	   * @param aPath The path or URL to be joined with the root.
	   *
	   * - If aPath is a URL or a data URI, aPath is returned, unless aPath is a
	   *   scheme-relative URL: Then the scheme of aRoot, if any, is prepended
	   *   first.
	   * - Otherwise aPath is a path. If aRoot is a URL, then its path portion
	   *   is updated with the result and aRoot is returned. Otherwise the result
	   *   is returned.
	   *   - If aPath is absolute, the result is aPath.
	   *   - Otherwise the two paths are joined with a slash.
	   * - Joining for example 'http://' and 'www.example.com' is also supported.
	   */
	  function join(aRoot, aPath) {
	    if (aRoot === "") {
	      aRoot = ".";
	    }
	    if (aPath === "") {
	      aPath = ".";
	    }
	    var aPathUrl = urlParse(aPath);
	    var aRootUrl = urlParse(aRoot);
	    if (aRootUrl) {
	      aRoot = aRootUrl.path || '/';
	    }
	
	    // `join(foo, '//www.example.org')`
	    if (aPathUrl && !aPathUrl.scheme) {
	      if (aRootUrl) {
	        aPathUrl.scheme = aRootUrl.scheme;
	      }
	      return urlGenerate(aPathUrl);
	    }
	
	    if (aPathUrl || aPath.match(dataUrlRegexp)) {
	      return aPath;
	    }
	
	    // `join('http://', 'www.example.com')`
	    if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
	      aRootUrl.host = aPath;
	      return urlGenerate(aRootUrl);
	    }
	
	    var joined = aPath.charAt(0) === '/'
	      ? aPath
	      : normalize(aRoot.replace(/\/+$/, '') + '/' + aPath);
	
	    if (aRootUrl) {
	      aRootUrl.path = joined;
	      return urlGenerate(aRootUrl);
	    }
	    return joined;
	  }
	  exports.join = join;
	
	  /**
	   * Make a path relative to a URL or another path.
	   *
	   * @param aRoot The root path or URL.
	   * @param aPath The path or URL to be made relative to aRoot.
	   */
	  function relative(aRoot, aPath) {
	    if (aRoot === "") {
	      aRoot = ".";
	    }
	
	    aRoot = aRoot.replace(/\/$/, '');
	
	    // XXX: It is possible to remove this block, and the tests still pass!
	    var url = urlParse(aRoot);
	    if (aPath.charAt(0) == "/" && url && url.path == "/") {
	      return aPath.slice(1);
	    }
	
	    return aPath.indexOf(aRoot + '/') === 0
	      ? aPath.substr(aRoot.length + 1)
	      : aPath;
	  }
	  exports.relative = relative;
	
	  /**
	   * Because behavior goes wacky when you set `__proto__` on objects, we
	   * have to prefix all the strings in our set with an arbitrary character.
	   *
	   * See https://github.com/mozilla/source-map/pull/31 and
	   * https://github.com/mozilla/source-map/issues/30
	   *
	   * @param String aStr
	   */
	  function toSetString(aStr) {
	    return '$' + aStr;
	  }
	  exports.toSetString = toSetString;
	
	  function fromSetString(aStr) {
	    return aStr.substr(1);
	  }
	  exports.fromSetString = fromSetString;
	
	  function strcmp(aStr1, aStr2) {
	    var s1 = aStr1 || "";
	    var s2 = aStr2 || "";
	    return (s1 > s2) - (s1 < s2);
	  }
	
	  /**
	   * Comparator between two mappings where the original positions are compared.
	   *
	   * Optionally pass in `true` as `onlyCompareGenerated` to consider two
	   * mappings with the same original source/line/column, but different generated
	   * line and column the same. Useful when searching for a mapping with a
	   * stubbed out mapping.
	   */
	  function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
	    var cmp;
	
	    cmp = strcmp(mappingA.source, mappingB.source);
	    if (cmp) {
	      return cmp;
	    }
	
	    cmp = mappingA.originalLine - mappingB.originalLine;
	    if (cmp) {
	      return cmp;
	    }
	
	    cmp = mappingA.originalColumn - mappingB.originalColumn;
	    if (cmp || onlyCompareOriginal) {
	      return cmp;
	    }
	
	    cmp = strcmp(mappingA.name, mappingB.name);
	    if (cmp) {
	      return cmp;
	    }
	
	    cmp = mappingA.generatedLine - mappingB.generatedLine;
	    if (cmp) {
	      return cmp;
	    }
	
	    return mappingA.generatedColumn - mappingB.generatedColumn;
	  };
	  exports.compareByOriginalPositions = compareByOriginalPositions;
	
	  /**
	   * Comparator between two mappings where the generated positions are
	   * compared.
	   *
	   * Optionally pass in `true` as `onlyCompareGenerated` to consider two
	   * mappings with the same generated line and column, but different
	   * source/name/original line and column the same. Useful when searching for a
	   * mapping with a stubbed out mapping.
	   */
	  function compareByGeneratedPositions(mappingA, mappingB, onlyCompareGenerated) {
	    var cmp;
	
	    cmp = mappingA.generatedLine - mappingB.generatedLine;
	    if (cmp) {
	      return cmp;
	    }
	
	    cmp = mappingA.generatedColumn - mappingB.generatedColumn;
	    if (cmp || onlyCompareGenerated) {
	      return cmp;
	    }
	
	    cmp = strcmp(mappingA.source, mappingB.source);
	    if (cmp) {
	      return cmp;
	    }
	
	    cmp = mappingA.originalLine - mappingB.originalLine;
	    if (cmp) {
	      return cmp;
	    }
	
	    cmp = mappingA.originalColumn - mappingB.originalColumn;
	    if (cmp) {
	      return cmp;
	    }
	
	    return strcmp(mappingA.name, mappingB.name);
	  };
	  exports.compareByGeneratedPositions = compareByGeneratedPositions;
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },

/***/ 373:
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* -*- Mode: js; js-indent-level: 2; -*- */
	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */
	if (false) {
	    var define = require('amdefine')(module, require);
	}
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
	
	  var util = __webpack_require__(372);
	
	  /**
	   * A data structure which is a combination of an array and a set. Adding a new
	   * member is O(1), testing for membership is O(1), and finding the index of an
	   * element is O(1). Removing elements from the set is not supported. Only
	   * strings are supported for membership.
	   */
	  function ArraySet() {
	    this._array = [];
	    this._set = {};
	  }
	
	  /**
	   * Static method for creating ArraySet instances from an existing array.
	   */
	  ArraySet.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
	    var set = new ArraySet();
	    for (var i = 0, len = aArray.length; i < len; i++) {
	      set.add(aArray[i], aAllowDuplicates);
	    }
	    return set;
	  };
	
	  /**
	   * Add the given string to this set.
	   *
	   * @param String aStr
	   */
	  ArraySet.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
	    var isDuplicate = this.has(aStr);
	    var idx = this._array.length;
	    if (!isDuplicate || aAllowDuplicates) {
	      this._array.push(aStr);
	    }
	    if (!isDuplicate) {
	      this._set[util.toSetString(aStr)] = idx;
	    }
	  };
	
	  /**
	   * Is the given string a member of this set?
	   *
	   * @param String aStr
	   */
	  ArraySet.prototype.has = function ArraySet_has(aStr) {
	    return Object.prototype.hasOwnProperty.call(this._set,
	                                                util.toSetString(aStr));
	  };
	
	  /**
	   * What is the index of the given string in the array?
	   *
	   * @param String aStr
	   */
	  ArraySet.prototype.indexOf = function ArraySet_indexOf(aStr) {
	    if (this.has(aStr)) {
	      return this._set[util.toSetString(aStr)];
	    }
	    throw new Error('"' + aStr + '" is not in the set.');
	  };
	
	  /**
	   * What is the element at the given index?
	   *
	   * @param Number aIdx
	   */
	  ArraySet.prototype.at = function ArraySet_at(aIdx) {
	    if (aIdx >= 0 && aIdx < this._array.length) {
	      return this._array[aIdx];
	    }
	    throw new Error('No element indexed by ' + aIdx);
	  };
	
	  /**
	   * Returns the array representation of this set (which has the proper indices
	   * indicated by indexOf). Note that this is a copy of the internal array used
	   * for storing the members so that no one can mess with internal state.
	   */
	  ArraySet.prototype.toArray = function ArraySet_toArray() {
	    return this._array.slice();
	  };
	
	  exports.ArraySet = ArraySet;
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },

/***/ 374:
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* -*- Mode: js; js-indent-level: 2; -*- */
	/*
	 * Copyright 2014 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */
	if (false) {
	    var define = require('amdefine')(module, require);
	}
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
	
	  var util = __webpack_require__(372);
	
	  /**
	   * Determine whether mappingB is after mappingA with respect to generated
	   * position.
	   */
	  function generatedPositionAfter(mappingA, mappingB) {
	    // Optimized for most common case
	    var lineA = mappingA.generatedLine;
	    var lineB = mappingB.generatedLine;
	    var columnA = mappingA.generatedColumn;
	    var columnB = mappingB.generatedColumn;
	    return lineB > lineA || lineB == lineA && columnB >= columnA ||
	           util.compareByGeneratedPositions(mappingA, mappingB) <= 0;
	  }
	
	  /**
	   * A data structure to provide a sorted view of accumulated mappings in a
	   * performance conscious manner. It trades a neglibable overhead in general
	   * case for a large speedup in case of mappings being added in order.
	   */
	  function MappingList() {
	    this._array = [];
	    this._sorted = true;
	    // Serves as infimum
	    this._last = {generatedLine: -1, generatedColumn: 0};
	  }
	
	  /**
	   * Iterate through internal items. This method takes the same arguments that
	   * `Array.prototype.forEach` takes.
	   *
	   * NOTE: The order of the mappings is NOT guaranteed.
	   */
	  MappingList.prototype.unsortedForEach =
	    function MappingList_forEach(aCallback, aThisArg) {
	      this._array.forEach(aCallback, aThisArg);
	    };
	
	  /**
	   * Add the given source mapping.
	   *
	   * @param Object aMapping
	   */
	  MappingList.prototype.add = function MappingList_add(aMapping) {
	    var mapping;
	    if (generatedPositionAfter(this._last, aMapping)) {
	      this._last = aMapping;
	      this._array.push(aMapping);
	    } else {
	      this._sorted = false;
	      this._array.push(aMapping);
	    }
	  };
	
	  /**
	   * Returns the flat, sorted array of mappings. The mappings are sorted by
	   * generated position.
	   *
	   * WARNING: This method returns internal data without copying, for
	   * performance. The return value must NOT be mutated, and should be treated as
	   * an immutable borrow. If you want to take ownership, you must make your own
	   * copy.
	   */
	  MappingList.prototype.toArray = function MappingList_toArray() {
	    if (!this._sorted) {
	      this._array.sort(util.compareByGeneratedPositions);
	      this._sorted = true;
	    }
	    return this._array;
	  };
	
	  exports.MappingList = MappingList;
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },

/***/ 375:
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* -*- Mode: js; js-indent-level: 2; -*- */
	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */
	if (false) {
	    var define = require('amdefine')(module, require);
	}
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
	
	  var util = __webpack_require__(372);
	  var binarySearch = __webpack_require__(376);
	  var ArraySet = __webpack_require__(373).ArraySet;
	  var base64VLQ = __webpack_require__(370);
	
	  /**
	   * A SourceMapConsumer instance represents a parsed source map which we can
	   * query for information about the original file positions by giving it a file
	   * position in the generated source.
	   *
	   * The only parameter is the raw source map (either as a JSON string, or
	   * already parsed to an object). According to the spec, source maps have the
	   * following attributes:
	   *
	   *   - version: Which version of the source map spec this map is following.
	   *   - sources: An array of URLs to the original source files.
	   *   - names: An array of identifiers which can be referrenced by individual mappings.
	   *   - sourceRoot: Optional. The URL root from which all sources are relative.
	   *   - sourcesContent: Optional. An array of contents of the original source files.
	   *   - mappings: A string of base64 VLQs which contain the actual mappings.
	   *   - file: Optional. The generated file this source map is associated with.
	   *
	   * Here is an example source map, taken from the source map spec[0]:
	   *
	   *     {
	   *       version : 3,
	   *       file: "out.js",
	   *       sourceRoot : "",
	   *       sources: ["foo.js", "bar.js"],
	   *       names: ["src", "maps", "are", "fun"],
	   *       mappings: "AA,AB;;ABCDE;"
	   *     }
	   *
	   * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?pli=1#
	   */
	  function SourceMapConsumer(aSourceMap) {
	    var sourceMap = aSourceMap;
	    if (typeof aSourceMap === 'string') {
	      sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
	    }
	
	    var version = util.getArg(sourceMap, 'version');
	    var sources = util.getArg(sourceMap, 'sources');
	    // Sass 3.3 leaves out the 'names' array, so we deviate from the spec (which
	    // requires the array) to play nice here.
	    var names = util.getArg(sourceMap, 'names', []);
	    var sourceRoot = util.getArg(sourceMap, 'sourceRoot', null);
	    var sourcesContent = util.getArg(sourceMap, 'sourcesContent', null);
	    var mappings = util.getArg(sourceMap, 'mappings');
	    var file = util.getArg(sourceMap, 'file', null);
	
	    // Once again, Sass deviates from the spec and supplies the version as a
	    // string rather than a number, so we use loose equality checking here.
	    if (version != this._version) {
	      throw new Error('Unsupported version: ' + version);
	    }
	
	    // Some source maps produce relative source paths like "./foo.js" instead of
	    // "foo.js".  Normalize these first so that future comparisons will succeed.
	    // See bugzil.la/1090768.
	    sources = sources.map(util.normalize);
	
	    // Pass `true` below to allow duplicate names and sources. While source maps
	    // are intended to be compressed and deduplicated, the TypeScript compiler
	    // sometimes generates source maps with duplicates in them. See Github issue
	    // #72 and bugzil.la/889492.
	    this._names = ArraySet.fromArray(names, true);
	    this._sources = ArraySet.fromArray(sources, true);
	
	    this.sourceRoot = sourceRoot;
	    this.sourcesContent = sourcesContent;
	    this._mappings = mappings;
	    this.file = file;
	  }
	
	  /**
	   * Create a SourceMapConsumer from a SourceMapGenerator.
	   *
	   * @param SourceMapGenerator aSourceMap
	   *        The source map that will be consumed.
	   * @returns SourceMapConsumer
	   */
	  SourceMapConsumer.fromSourceMap =
	    function SourceMapConsumer_fromSourceMap(aSourceMap) {
	      var smc = Object.create(SourceMapConsumer.prototype);
	
	      smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
	      smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
	      smc.sourceRoot = aSourceMap._sourceRoot;
	      smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(),
	                                                              smc.sourceRoot);
	      smc.file = aSourceMap._file;
	
	      smc.__generatedMappings = aSourceMap._mappings.toArray().slice();
	      smc.__originalMappings = aSourceMap._mappings.toArray().slice()
	        .sort(util.compareByOriginalPositions);
	
	      return smc;
	    };
	
	  /**
	   * The version of the source mapping spec that we are consuming.
	   */
	  SourceMapConsumer.prototype._version = 3;
	
	  /**
	   * The list of original sources.
	   */
	  Object.defineProperty(SourceMapConsumer.prototype, 'sources', {
	    get: function () {
	      return this._sources.toArray().map(function (s) {
	        return this.sourceRoot != null ? util.join(this.sourceRoot, s) : s;
	      }, this);
	    }
	  });
	
	  // `__generatedMappings` and `__originalMappings` are arrays that hold the
	  // parsed mapping coordinates from the source map's "mappings" attribute. They
	  // are lazily instantiated, accessed via the `_generatedMappings` and
	  // `_originalMappings` getters respectively, and we only parse the mappings
	  // and create these arrays once queried for a source location. We jump through
	  // these hoops because there can be many thousands of mappings, and parsing
	  // them is expensive, so we only want to do it if we must.
	  //
	  // Each object in the arrays is of the form:
	  //
	  //     {
	  //       generatedLine: The line number in the generated code,
	  //       generatedColumn: The column number in the generated code,
	  //       source: The path to the original source file that generated this
	  //               chunk of code,
	  //       originalLine: The line number in the original source that
	  //                     corresponds to this chunk of generated code,
	  //       originalColumn: The column number in the original source that
	  //                       corresponds to this chunk of generated code,
	  //       name: The name of the original symbol which generated this chunk of
	  //             code.
	  //     }
	  //
	  // All properties except for `generatedLine` and `generatedColumn` can be
	  // `null`.
	  //
	  // `_generatedMappings` is ordered by the generated positions.
	  //
	  // `_originalMappings` is ordered by the original positions.
	
	  SourceMapConsumer.prototype.__generatedMappings = null;
	  Object.defineProperty(SourceMapConsumer.prototype, '_generatedMappings', {
	    get: function () {
	      if (!this.__generatedMappings) {
	        this.__generatedMappings = [];
	        this.__originalMappings = [];
	        this._parseMappings(this._mappings, this.sourceRoot);
	      }
	
	      return this.__generatedMappings;
	    }
	  });
	
	  SourceMapConsumer.prototype.__originalMappings = null;
	  Object.defineProperty(SourceMapConsumer.prototype, '_originalMappings', {
	    get: function () {
	      if (!this.__originalMappings) {
	        this.__generatedMappings = [];
	        this.__originalMappings = [];
	        this._parseMappings(this._mappings, this.sourceRoot);
	      }
	
	      return this.__originalMappings;
	    }
	  });
	
	  SourceMapConsumer.prototype._nextCharIsMappingSeparator =
	    function SourceMapConsumer_nextCharIsMappingSeparator(aStr) {
	      var c = aStr.charAt(0);
	      return c === ";" || c === ",";
	    };
	
	  /**
	   * Parse the mappings in a string in to a data structure which we can easily
	   * query (the ordered arrays in the `this.__generatedMappings` and
	   * `this.__originalMappings` properties).
	   */
	  SourceMapConsumer.prototype._parseMappings =
	    function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
	      var generatedLine = 1;
	      var previousGeneratedColumn = 0;
	      var previousOriginalLine = 0;
	      var previousOriginalColumn = 0;
	      var previousSource = 0;
	      var previousName = 0;
	      var str = aStr;
	      var temp = {};
	      var mapping;
	
	      while (str.length > 0) {
	        if (str.charAt(0) === ';') {
	          generatedLine++;
	          str = str.slice(1);
	          previousGeneratedColumn = 0;
	        }
	        else if (str.charAt(0) === ',') {
	          str = str.slice(1);
	        }
	        else {
	          mapping = {};
	          mapping.generatedLine = generatedLine;
	
	          // Generated column.
	          base64VLQ.decode(str, temp);
	          mapping.generatedColumn = previousGeneratedColumn + temp.value;
	          previousGeneratedColumn = mapping.generatedColumn;
	          str = temp.rest;
	
	          if (str.length > 0 && !this._nextCharIsMappingSeparator(str)) {
	            // Original source.
	            base64VLQ.decode(str, temp);
	            mapping.source = this._sources.at(previousSource + temp.value);
	            previousSource += temp.value;
	            str = temp.rest;
	            if (str.length === 0 || this._nextCharIsMappingSeparator(str)) {
	              throw new Error('Found a source, but no line and column');
	            }
	
	            // Original line.
	            base64VLQ.decode(str, temp);
	            mapping.originalLine = previousOriginalLine + temp.value;
	            previousOriginalLine = mapping.originalLine;
	            // Lines are stored 0-based
	            mapping.originalLine += 1;
	            str = temp.rest;
	            if (str.length === 0 || this._nextCharIsMappingSeparator(str)) {
	              throw new Error('Found a source and line, but no column');
	            }
	
	            // Original column.
	            base64VLQ.decode(str, temp);
	            mapping.originalColumn = previousOriginalColumn + temp.value;
	            previousOriginalColumn = mapping.originalColumn;
	            str = temp.rest;
	
	            if (str.length > 0 && !this._nextCharIsMappingSeparator(str)) {
	              // Original name.
	              base64VLQ.decode(str, temp);
	              mapping.name = this._names.at(previousName + temp.value);
	              previousName += temp.value;
	              str = temp.rest;
	            }
	          }
	
	          this.__generatedMappings.push(mapping);
	          if (typeof mapping.originalLine === 'number') {
	            this.__originalMappings.push(mapping);
	          }
	        }
	      }
	
	      this.__generatedMappings.sort(util.compareByGeneratedPositions);
	      this.__originalMappings.sort(util.compareByOriginalPositions);
	    };
	
	  /**
	   * Find the mapping that best matches the hypothetical "needle" mapping that
	   * we are searching for in the given "haystack" of mappings.
	   */
	  SourceMapConsumer.prototype._findMapping =
	    function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName,
	                                           aColumnName, aComparator) {
	      // To return the position we are searching for, we must first find the
	      // mapping for the given position and then return the opposite position it
	      // points to. Because the mappings are sorted, we can use binary search to
	      // find the best mapping.
	
	      if (aNeedle[aLineName] <= 0) {
	        throw new TypeError('Line must be greater than or equal to 1, got '
	                            + aNeedle[aLineName]);
	      }
	      if (aNeedle[aColumnName] < 0) {
	        throw new TypeError('Column must be greater than or equal to 0, got '
	                            + aNeedle[aColumnName]);
	      }
	
	      return binarySearch.search(aNeedle, aMappings, aComparator);
	    };
	
	  /**
	   * Compute the last column for each generated mapping. The last column is
	   * inclusive.
	   */
	  SourceMapConsumer.prototype.computeColumnSpans =
	    function SourceMapConsumer_computeColumnSpans() {
	      for (var index = 0; index < this._generatedMappings.length; ++index) {
	        var mapping = this._generatedMappings[index];
	
	        // Mappings do not contain a field for the last generated columnt. We
	        // can come up with an optimistic estimate, however, by assuming that
	        // mappings are contiguous (i.e. given two consecutive mappings, the
	        // first mapping ends where the second one starts).
	        if (index + 1 < this._generatedMappings.length) {
	          var nextMapping = this._generatedMappings[index + 1];
	
	          if (mapping.generatedLine === nextMapping.generatedLine) {
	            mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
	            continue;
	          }
	        }
	
	        // The last mapping for each line spans the entire line.
	        mapping.lastGeneratedColumn = Infinity;
	      }
	    };
	
	  /**
	   * Returns the original source, line, and column information for the generated
	   * source's line and column positions provided. The only argument is an object
	   * with the following properties:
	   *
	   *   - line: The line number in the generated source.
	   *   - column: The column number in the generated source.
	   *
	   * and an object is returned with the following properties:
	   *
	   *   - source: The original source file, or null.
	   *   - line: The line number in the original source, or null.
	   *   - column: The column number in the original source, or null.
	   *   - name: The original identifier, or null.
	   */
	  SourceMapConsumer.prototype.originalPositionFor =
	    function SourceMapConsumer_originalPositionFor(aArgs) {
	      var needle = {
	        generatedLine: util.getArg(aArgs, 'line'),
	        generatedColumn: util.getArg(aArgs, 'column')
	      };
	
	      var index = this._findMapping(needle,
	                                    this._generatedMappings,
	                                    "generatedLine",
	                                    "generatedColumn",
	                                    util.compareByGeneratedPositions);
	
	      if (index >= 0) {
	        var mapping = this._generatedMappings[index];
	
	        if (mapping.generatedLine === needle.generatedLine) {
	          var source = util.getArg(mapping, 'source', null);
	          if (source != null && this.sourceRoot != null) {
	            source = util.join(this.sourceRoot, source);
	          }
	          return {
	            source: source,
	            line: util.getArg(mapping, 'originalLine', null),
	            column: util.getArg(mapping, 'originalColumn', null),
	            name: util.getArg(mapping, 'name', null)
	          };
	        }
	      }
	
	      return {
	        source: null,
	        line: null,
	        column: null,
	        name: null
	      };
	    };
	
	  /**
	   * Returns the original source content. The only argument is the url of the
	   * original source file. Returns null if no original source content is
	   * availible.
	   */
	  SourceMapConsumer.prototype.sourceContentFor =
	    function SourceMapConsumer_sourceContentFor(aSource) {
	      if (!this.sourcesContent) {
	        return null;
	      }
	
	      if (this.sourceRoot != null) {
	        aSource = util.relative(this.sourceRoot, aSource);
	      }
	
	      if (this._sources.has(aSource)) {
	        return this.sourcesContent[this._sources.indexOf(aSource)];
	      }
	
	      var url;
	      if (this.sourceRoot != null
	          && (url = util.urlParse(this.sourceRoot))) {
	        // XXX: file:// URIs and absolute paths lead to unexpected behavior for
	        // many users. We can help them out when they expect file:// URIs to
	        // behave like it would if they were running a local HTTP server. See
	        // https://bugzilla.mozilla.org/show_bug.cgi?id=885597.
	        var fileUriAbsPath = aSource.replace(/^file:\/\//, "");
	        if (url.scheme == "file"
	            && this._sources.has(fileUriAbsPath)) {
	          return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)]
	        }
	
	        if ((!url.path || url.path == "/")
	            && this._sources.has("/" + aSource)) {
	          return this.sourcesContent[this._sources.indexOf("/" + aSource)];
	        }
	      }
	
	      throw new Error('"' + aSource + '" is not in the SourceMap.');
	    };
	
	  /**
	   * Returns the generated line and column information for the original source,
	   * line, and column positions provided. The only argument is an object with
	   * the following properties:
	   *
	   *   - source: The filename of the original source.
	   *   - line: The line number in the original source.
	   *   - column: The column number in the original source.
	   *
	   * and an object is returned with the following properties:
	   *
	   *   - line: The line number in the generated source, or null.
	   *   - column: The column number in the generated source, or null.
	   */
	  SourceMapConsumer.prototype.generatedPositionFor =
	    function SourceMapConsumer_generatedPositionFor(aArgs) {
	      var needle = {
	        source: util.getArg(aArgs, 'source'),
	        originalLine: util.getArg(aArgs, 'line'),
	        originalColumn: util.getArg(aArgs, 'column')
	      };
	
	      if (this.sourceRoot != null) {
	        needle.source = util.relative(this.sourceRoot, needle.source);
	      }
	
	      var index = this._findMapping(needle,
	                                    this._originalMappings,
	                                    "originalLine",
	                                    "originalColumn",
	                                    util.compareByOriginalPositions);
	
	      if (index >= 0) {
	        var mapping = this._originalMappings[index];
	
	        return {
	          line: util.getArg(mapping, 'generatedLine', null),
	          column: util.getArg(mapping, 'generatedColumn', null),
	          lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
	        };
	      }
	
	      return {
	        line: null,
	        column: null,
	        lastColumn: null
	      };
	    };
	
	  /**
	   * Returns all generated line and column information for the original source
	   * and line provided. The only argument is an object with the following
	   * properties:
	   *
	   *   - source: The filename of the original source.
	   *   - line: The line number in the original source.
	   *
	   * and an array of objects is returned, each with the following properties:
	   *
	   *   - line: The line number in the generated source, or null.
	   *   - column: The column number in the generated source, or null.
	   */
	  SourceMapConsumer.prototype.allGeneratedPositionsFor =
	    function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
	      // When there is no exact match, SourceMapConsumer.prototype._findMapping
	      // returns the index of the closest mapping less than the needle. By
	      // setting needle.originalColumn to Infinity, we thus find the last
	      // mapping for the given line, provided such a mapping exists.
	      var needle = {
	        source: util.getArg(aArgs, 'source'),
	        originalLine: util.getArg(aArgs, 'line'),
	        originalColumn: Infinity
	      };
	
	      if (this.sourceRoot != null) {
	        needle.source = util.relative(this.sourceRoot, needle.source);
	      }
	
	      var mappings = [];
	
	      var index = this._findMapping(needle,
	                                    this._originalMappings,
	                                    "originalLine",
	                                    "originalColumn",
	                                    util.compareByOriginalPositions);
	      if (index >= 0) {
	        var mapping = this._originalMappings[index];
	
	        while (mapping && mapping.originalLine === needle.originalLine) {
	          mappings.push({
	            line: util.getArg(mapping, 'generatedLine', null),
	            column: util.getArg(mapping, 'generatedColumn', null),
	            lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
	          });
	
	          mapping = this._originalMappings[--index];
	        }
	      }
	
	      return mappings.reverse();
	    };
	
	  SourceMapConsumer.GENERATED_ORDER = 1;
	  SourceMapConsumer.ORIGINAL_ORDER = 2;
	
	  /**
	   * Iterate over each mapping between an original source/line/column and a
	   * generated line/column in this source map.
	   *
	   * @param Function aCallback
	   *        The function that is called with each mapping.
	   * @param Object aContext
	   *        Optional. If specified, this object will be the value of `this` every
	   *        time that `aCallback` is called.
	   * @param aOrder
	   *        Either `SourceMapConsumer.GENERATED_ORDER` or
	   *        `SourceMapConsumer.ORIGINAL_ORDER`. Specifies whether you want to
	   *        iterate over the mappings sorted by the generated file's line/column
	   *        order or the original's source/line/column order, respectively. Defaults to
	   *        `SourceMapConsumer.GENERATED_ORDER`.
	   */
	  SourceMapConsumer.prototype.eachMapping =
	    function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
	      var context = aContext || null;
	      var order = aOrder || SourceMapConsumer.GENERATED_ORDER;
	
	      var mappings;
	      switch (order) {
	      case SourceMapConsumer.GENERATED_ORDER:
	        mappings = this._generatedMappings;
	        break;
	      case SourceMapConsumer.ORIGINAL_ORDER:
	        mappings = this._originalMappings;
	        break;
	      default:
	        throw new Error("Unknown order of iteration.");
	      }
	
	      var sourceRoot = this.sourceRoot;
	      mappings.map(function (mapping) {
	        var source = mapping.source;
	        if (source != null && sourceRoot != null) {
	          source = util.join(sourceRoot, source);
	        }
	        return {
	          source: source,
	          generatedLine: mapping.generatedLine,
	          generatedColumn: mapping.generatedColumn,
	          originalLine: mapping.originalLine,
	          originalColumn: mapping.originalColumn,
	          name: mapping.name
	        };
	      }).forEach(aCallback, context);
	    };
	
	  exports.SourceMapConsumer = SourceMapConsumer;
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },

/***/ 376:
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* -*- Mode: js; js-indent-level: 2; -*- */
	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */
	if (false) {
	    var define = require('amdefine')(module, require);
	}
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
	
	  /**
	   * Recursive implementation of binary search.
	   *
	   * @param aLow Indices here and lower do not contain the needle.
	   * @param aHigh Indices here and higher do not contain the needle.
	   * @param aNeedle The element being searched for.
	   * @param aHaystack The non-empty array being searched.
	   * @param aCompare Function which takes two elements and returns -1, 0, or 1.
	   */
	  function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare) {
	    // This function terminates when one of the following is true:
	    //
	    //   1. We find the exact element we are looking for.
	    //
	    //   2. We did not find the exact element, but we can return the index of
	    //      the next closest element that is less than that element.
	    //
	    //   3. We did not find the exact element, and there is no next-closest
	    //      element which is less than the one we are searching for, so we
	    //      return -1.
	    var mid = Math.floor((aHigh - aLow) / 2) + aLow;
	    var cmp = aCompare(aNeedle, aHaystack[mid], true);
	    if (cmp === 0) {
	      // Found the element we are looking for.
	      return mid;
	    }
	    else if (cmp > 0) {
	      // aHaystack[mid] is greater than our needle.
	      if (aHigh - mid > 1) {
	        // The element is in the upper half.
	        return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare);
	      }
	      // We did not find an exact match, return the next closest one
	      // (termination case 2).
	      return mid;
	    }
	    else {
	      // aHaystack[mid] is less than our needle.
	      if (mid - aLow > 1) {
	        // The element is in the lower half.
	        return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare);
	      }
	      // The exact needle element was not found in this haystack. Determine if
	      // we are in termination case (2) or (3) and return the appropriate thing.
	      return aLow < 0 ? -1 : aLow;
	    }
	  }
	
	  /**
	   * This is an implementation of binary search which will always try and return
	   * the index of next lowest value checked if there is no exact hit. This is
	   * because mappings between original and generated line/col pairs are single
	   * points, and there is an implicit region between each of them, so a miss
	   * just means that you aren't on the very start of a region.
	   *
	   * @param aNeedle The element you are looking for.
	   * @param aHaystack The array that is being searched.
	   * @param aCompare A function which takes the needle and an element in the
	   *     array and returns -1, 0, or 1 depending on whether the needle is less
	   *     than, equal to, or greater than the element, respectively.
	   */
	  exports.search = function search(aNeedle, aHaystack, aCompare) {
	    if (aHaystack.length === 0) {
	      return -1;
	    }
	    return recursiveSearch(-1, aHaystack.length, aNeedle, aHaystack, aCompare)
	  };
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },

/***/ 377:
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* -*- Mode: js; js-indent-level: 2; -*- */
	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */
	if (false) {
	    var define = require('amdefine')(module, require);
	}
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
	
	  var SourceMapGenerator = __webpack_require__(369).SourceMapGenerator;
	  var util = __webpack_require__(372);
	
	  // Matches a Windows-style `\r\n` newline or a `\n` newline used by all other
	  // operating systems these days (capturing the result).
	  var REGEX_NEWLINE = /(\r?\n)/;
	
	  // Newline character code for charCodeAt() comparisons
	  var NEWLINE_CODE = 10;
	
	  // Private symbol for identifying `SourceNode`s when multiple versions of
	  // the source-map library are loaded. This MUST NOT CHANGE across
	  // versions!
	  var isSourceNode = "$$$isSourceNode$$$";
	
	  /**
	   * SourceNodes provide a way to abstract over interpolating/concatenating
	   * snippets of generated JavaScript source code while maintaining the line and
	   * column information associated with the original source code.
	   *
	   * @param aLine The original line number.
	   * @param aColumn The original column number.
	   * @param aSource The original source's filename.
	   * @param aChunks Optional. An array of strings which are snippets of
	   *        generated JS, or other SourceNodes.
	   * @param aName The original identifier.
	   */
	  function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
	    this.children = [];
	    this.sourceContents = {};
	    this.line = aLine == null ? null : aLine;
	    this.column = aColumn == null ? null : aColumn;
	    this.source = aSource == null ? null : aSource;
	    this.name = aName == null ? null : aName;
	    this[isSourceNode] = true;
	    if (aChunks != null) this.add(aChunks);
	  }
	
	  /**
	   * Creates a SourceNode from generated code and a SourceMapConsumer.
	   *
	   * @param aGeneratedCode The generated code
	   * @param aSourceMapConsumer The SourceMap for the generated code
	   * @param aRelativePath Optional. The path that relative sources in the
	   *        SourceMapConsumer should be relative to.
	   */
	  SourceNode.fromStringWithSourceMap =
	    function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer, aRelativePath) {
	      // The SourceNode we want to fill with the generated code
	      // and the SourceMap
	      var node = new SourceNode();
	
	      // All even indices of this array are one line of the generated code,
	      // while all odd indices are the newlines between two adjacent lines
	      // (since `REGEX_NEWLINE` captures its match).
	      // Processed fragments are removed from this array, by calling `shiftNextLine`.
	      var remainingLines = aGeneratedCode.split(REGEX_NEWLINE);
	      var shiftNextLine = function() {
	        var lineContents = remainingLines.shift();
	        // The last line of a file might not have a newline.
	        var newLine = remainingLines.shift() || "";
	        return lineContents + newLine;
	      };
	
	      // We need to remember the position of "remainingLines"
	      var lastGeneratedLine = 1, lastGeneratedColumn = 0;
	
	      // The generate SourceNodes we need a code range.
	      // To extract it current and last mapping is used.
	      // Here we store the last mapping.
	      var lastMapping = null;
	
	      aSourceMapConsumer.eachMapping(function (mapping) {
	        if (lastMapping !== null) {
	          // We add the code from "lastMapping" to "mapping":
	          // First check if there is a new line in between.
	          if (lastGeneratedLine < mapping.generatedLine) {
	            var code = "";
	            // Associate first line with "lastMapping"
	            addMappingWithCode(lastMapping, shiftNextLine());
	            lastGeneratedLine++;
	            lastGeneratedColumn = 0;
	            // The remaining code is added without mapping
	          } else {
	            // There is no new line in between.
	            // Associate the code between "lastGeneratedColumn" and
	            // "mapping.generatedColumn" with "lastMapping"
	            var nextLine = remainingLines[0];
	            var code = nextLine.substr(0, mapping.generatedColumn -
	                                          lastGeneratedColumn);
	            remainingLines[0] = nextLine.substr(mapping.generatedColumn -
	                                                lastGeneratedColumn);
	            lastGeneratedColumn = mapping.generatedColumn;
	            addMappingWithCode(lastMapping, code);
	            // No more remaining code, continue
	            lastMapping = mapping;
	            return;
	          }
	        }
	        // We add the generated code until the first mapping
	        // to the SourceNode without any mapping.
	        // Each line is added as separate string.
	        while (lastGeneratedLine < mapping.generatedLine) {
	          node.add(shiftNextLine());
	          lastGeneratedLine++;
	        }
	        if (lastGeneratedColumn < mapping.generatedColumn) {
	          var nextLine = remainingLines[0];
	          node.add(nextLine.substr(0, mapping.generatedColumn));
	          remainingLines[0] = nextLine.substr(mapping.generatedColumn);
	          lastGeneratedColumn = mapping.generatedColumn;
	        }
	        lastMapping = mapping;
	      }, this);
	      // We have processed all mappings.
	      if (remainingLines.length > 0) {
	        if (lastMapping) {
	          // Associate the remaining code in the current line with "lastMapping"
	          addMappingWithCode(lastMapping, shiftNextLine());
	        }
	        // and add the remaining lines without any mapping
	        node.add(remainingLines.join(""));
	      }
	
	      // Copy sourcesContent into SourceNode
	      aSourceMapConsumer.sources.forEach(function (sourceFile) {
	        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
	        if (content != null) {
	          if (aRelativePath != null) {
	            sourceFile = util.join(aRelativePath, sourceFile);
	          }
	          node.setSourceContent(sourceFile, content);
	        }
	      });
	
	      return node;
	
	      function addMappingWithCode(mapping, code) {
	        if (mapping === null || mapping.source === undefined) {
	          node.add(code);
	        } else {
	          var source = aRelativePath
	            ? util.join(aRelativePath, mapping.source)
	            : mapping.source;
	          node.add(new SourceNode(mapping.originalLine,
	                                  mapping.originalColumn,
	                                  source,
	                                  code,
	                                  mapping.name));
	        }
	      }
	    };
	
	  /**
	   * Add a chunk of generated JS to this source node.
	   *
	   * @param aChunk A string snippet of generated JS code, another instance of
	   *        SourceNode, or an array where each member is one of those things.
	   */
	  SourceNode.prototype.add = function SourceNode_add(aChunk) {
	    if (Array.isArray(aChunk)) {
	      aChunk.forEach(function (chunk) {
	        this.add(chunk);
	      }, this);
	    }
	    else if (aChunk[isSourceNode] || typeof aChunk === "string") {
	      if (aChunk) {
	        this.children.push(aChunk);
	      }
	    }
	    else {
	      throw new TypeError(
	        "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
	      );
	    }
	    return this;
	  };
	
	  /**
	   * Add a chunk of generated JS to the beginning of this source node.
	   *
	   * @param aChunk A string snippet of generated JS code, another instance of
	   *        SourceNode, or an array where each member is one of those things.
	   */
	  SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
	    if (Array.isArray(aChunk)) {
	      for (var i = aChunk.length-1; i >= 0; i--) {
	        this.prepend(aChunk[i]);
	      }
	    }
	    else if (aChunk[isSourceNode] || typeof aChunk === "string") {
	      this.children.unshift(aChunk);
	    }
	    else {
	      throw new TypeError(
	        "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
	      );
	    }
	    return this;
	  };
	
	  /**
	   * Walk over the tree of JS snippets in this node and its children. The
	   * walking function is called once for each snippet of JS and is passed that
	   * snippet and the its original associated source's line/column location.
	   *
	   * @param aFn The traversal function.
	   */
	  SourceNode.prototype.walk = function SourceNode_walk(aFn) {
	    var chunk;
	    for (var i = 0, len = this.children.length; i < len; i++) {
	      chunk = this.children[i];
	      if (chunk[isSourceNode]) {
	        chunk.walk(aFn);
	      }
	      else {
	        if (chunk !== '') {
	          aFn(chunk, { source: this.source,
	                       line: this.line,
	                       column: this.column,
	                       name: this.name });
	        }
	      }
	    }
	  };
	
	  /**
	   * Like `String.prototype.join` except for SourceNodes. Inserts `aStr` between
	   * each of `this.children`.
	   *
	   * @param aSep The separator.
	   */
	  SourceNode.prototype.join = function SourceNode_join(aSep) {
	    var newChildren;
	    var i;
	    var len = this.children.length;
	    if (len > 0) {
	      newChildren = [];
	      for (i = 0; i < len-1; i++) {
	        newChildren.push(this.children[i]);
	        newChildren.push(aSep);
	      }
	      newChildren.push(this.children[i]);
	      this.children = newChildren;
	    }
	    return this;
	  };
	
	  /**
	   * Call String.prototype.replace on the very right-most source snippet. Useful
	   * for trimming whitespace from the end of a source node, etc.
	   *
	   * @param aPattern The pattern to replace.
	   * @param aReplacement The thing to replace the pattern with.
	   */
	  SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
	    var lastChild = this.children[this.children.length - 1];
	    if (lastChild[isSourceNode]) {
	      lastChild.replaceRight(aPattern, aReplacement);
	    }
	    else if (typeof lastChild === 'string') {
	      this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
	    }
	    else {
	      this.children.push(''.replace(aPattern, aReplacement));
	    }
	    return this;
	  };
	
	  /**
	   * Set the source content for a source file. This will be added to the SourceMapGenerator
	   * in the sourcesContent field.
	   *
	   * @param aSourceFile The filename of the source file
	   * @param aSourceContent The content of the source file
	   */
	  SourceNode.prototype.setSourceContent =
	    function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
	      this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
	    };
	
	  /**
	   * Walk over the tree of SourceNodes. The walking function is called for each
	   * source file content and is passed the filename and source content.
	   *
	   * @param aFn The traversal function.
	   */
	  SourceNode.prototype.walkSourceContents =
	    function SourceNode_walkSourceContents(aFn) {
	      for (var i = 0, len = this.children.length; i < len; i++) {
	        if (this.children[i][isSourceNode]) {
	          this.children[i].walkSourceContents(aFn);
	        }
	      }
	
	      var sources = Object.keys(this.sourceContents);
	      for (var i = 0, len = sources.length; i < len; i++) {
	        aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
	      }
	    };
	
	  /**
	   * Return the string representation of this source node. Walks over the tree
	   * and concatenates all the various snippets together to one string.
	   */
	  SourceNode.prototype.toString = function SourceNode_toString() {
	    var str = "";
	    this.walk(function (chunk) {
	      str += chunk;
	    });
	    return str;
	  };
	
	  /**
	   * Returns the string representation of this source node along with a source
	   * map.
	   */
	  SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
	    var generated = {
	      code: "",
	      line: 1,
	      column: 0
	    };
	    var map = new SourceMapGenerator(aArgs);
	    var sourceMappingActive = false;
	    var lastOriginalSource = null;
	    var lastOriginalLine = null;
	    var lastOriginalColumn = null;
	    var lastOriginalName = null;
	    this.walk(function (chunk, original) {
	      generated.code += chunk;
	      if (original.source !== null
	          && original.line !== null
	          && original.column !== null) {
	        if(lastOriginalSource !== original.source
	           || lastOriginalLine !== original.line
	           || lastOriginalColumn !== original.column
	           || lastOriginalName !== original.name) {
	          map.addMapping({
	            source: original.source,
	            original: {
	              line: original.line,
	              column: original.column
	            },
	            generated: {
	              line: generated.line,
	              column: generated.column
	            },
	            name: original.name
	          });
	        }
	        lastOriginalSource = original.source;
	        lastOriginalLine = original.line;
	        lastOriginalColumn = original.column;
	        lastOriginalName = original.name;
	        sourceMappingActive = true;
	      } else if (sourceMappingActive) {
	        map.addMapping({
	          generated: {
	            line: generated.line,
	            column: generated.column
	          }
	        });
	        lastOriginalSource = null;
	        sourceMappingActive = false;
	      }
	      for (var idx = 0, length = chunk.length; idx < length; idx++) {
	        if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
	          generated.line++;
	          generated.column = 0;
	          // Mappings end at eol
	          if (idx + 1 === length) {
	            lastOriginalSource = null;
	            sourceMappingActive = false;
	          } else if (sourceMappingActive) {
	            map.addMapping({
	              source: original.source,
	              original: {
	                line: original.line,
	                column: original.column
	              },
	              generated: {
	                line: generated.line,
	                column: generated.column
	              },
	              name: original.name
	            });
	          }
	        } else {
	          generated.column++;
	        }
	      }
	    });
	    this.walkSourceContents(function (sourceFile, sourceContent) {
	      map.setSourceContent(sourceFile, sourceContent);
	    });
	
	    return { code: generated.code, map: map };
	  };
	
	  exports.SourceNode = SourceNode;
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }

/******/ });
//# sourceMappingURL=pretty-print-worker.js.map