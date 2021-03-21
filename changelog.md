# 3.0.0 - Smaragdine Update

  For a complete overview of this update see https://fthtml.com/changelog/#Smaragdine

  - Breaking changes
    * Removed the `template` keyword since deprecation.
      - Templates syntax has changed
      - Templates directory (`templateDir`) no longer exists for `fthtmlconfig` files
      - All templates are now handled intuitively by the `import` statement
    * Updated escaping sequence rules.
      - `\` are now parsed as is, unless immediately infront of a string delimiter
  - New Features
    * Global Variables
    * Tiny Templates (and global tiny templates)
      - Cascade style overwrites
      - Templates that are 'tiny' and specifically intended for tag aliases. For example, if you
      create the same element over and over with the same attributes, let's say, an inline code highlighter:

      ```
      code(.code-inline data-lang=shell) "> foo bar ./"
      ```

      You can now make tiny templates that give this a specific element name to call and that converts at runtime:

      ```
      #tinytemplates
        shell code(.code-inline data-lang=shell) "${val}"
      #end

      html {
        body {
          h1 "Hello World"
          p "To import:"
          shell "> foo bar ./"
          p "To export"
          shell "> foo bar ./ --destination ../out"
        }
      }
      ```

      Which outputs the following html:
      ```
      <html>
        <body>
          <h1>Hello World</h1>
          <p>To import:</p>
          <code class="code-inline" data-lang="shell">> foo bar ./</code>
          <p>To export:</p>
          <code class="code-inline" data-lang="shell">> foo bar ./ --destination ../out</code>
        </body>
      </html>
      ```

    * Forced relative imports support
    * ftHTML Blocks for binding properties
    * Native json support
    * Functions
      - Added `addslashes`, `choose`, `html_encode`, `html_decode`, `random`, `replace`, `str_repeat`, `str_reverse`, `str_format`, `substring`, `tcase`, `trim`
    * Macros
      - Added `__DATE__`, `__DATETIME__`, `__ISO_DATE__`, `__LOCAL_DATE__`, `__LOCAL_DATETIME__`, `__NOW__`, `__UUID__`, `__JS_AGENT__`, `__JS_URI__`, `___JS_URI_HASH_`, `__JS_URI__HOSTNAME_`, `__JS_URI_HOST__`, `__JS_URI_PORT__`, `__JS_URI_PATH__`, `__JS_URI_PROTOCOL__`, `__JS_URI_SEARCH__`
    * Variables as property binding values are now supported without needing string interpolation
  - fthtmlconfig
    * Added `globalvars` property support
    * Added `jsonDir` property support
    * Added `prettify` property support
    * Added `globaltemplates` property support
      - supports fthtml syntax
    * Added `extend` property support
      - extend another local fthtmlconfig file



# 2.1.5
  - This release deprecates the 'template' keyword as it conflicts with a native html tag, preparring for future release.
  - Fixed issue where variables would fail in some instances as child elements
  - Removed php from supported embedded languages



# 2.1.0 - Parser Redone & Typescript & CLI enhancements
  - Parser redone from ground up
    - NOTE: The `+` is now deprecated. It is considered invalid markup. It was optional before, but we found users preferred not to use it anyways. Please ajust accordingly as you upgrade.
    - Better lexing and parser techniques
        - Compile time is now 90% faster! A file using imports (which reads sync) before clocked in at ~100ms to compile, a file with imports now is ~10ms, depending on garbage collection and amount of content of course. Building the ftHTML website with a bunch of imports and templates and over 80 files total now only takes a whopping 103ms
    - Changes to errors and error messages
    - No changes to syntax but more enforcements for some use cases have been implemented to better support future features (this shouldn't change much but it's best to test your projects before upgrading and rendering with this version)
  - Moved to typescript!
    - This package is now developed with typescript; other than that no additional changes have been made, the vanilla js code you have now will still work. We've even included the js files in the lib so end users aren't required to have typescript installed before installing
  - CLI
    - Removed useless dependencies ('cli-spinner' was just for show, provided no value)
    - Moved away from `node-dir` package to the `glob` package because the features are more valuable
        - You can now use glob patterns for excluding directories
          - See [here](https://www.npmjs.com/package/glob#glob-primer) for pattern examples
        - **NOTE YOU WILL NEED TO UPDATE YOUR EXCLUDED ARRAY if you have saved them with some kind of task or script for building/converting**
    - introducing the `fthtmlconfig.json` file (out of beta)
      - easily convert a file or directory to html by saving your configurations to a json file
      - when this config file is in your project root dir and you configure it to your liking, all you have to do is execute `fthtml convert` from your root dir and that's it!

# 2.0.1 - Unit testing
  - Added unit testing
  - Small changes to formatting

# 2.0.0 - Glaucous Update
  - Added string interpolation
  - Added template binding (very basic template binding)
  - Added embedded language tags (js, css)
      > type language in it's raw syntax
  - Better error handling
  - Updated attributes values to automatically add double quotes; & convert single to double

# 1.0.3
  - Fixed an issue with keeping tree source flag

# 1.0.2
  - Minor adjustments to fix issues with respective paths for import

# 0.7.2
- Small fixes
  - Simplified errors on parser & lexer for a fthtml language support extension for visual studio code and, in the future, other editors

# 0.7.0

- Introducing variable functionality
  - Use variables to define frequently used styling, links, elements
  - You can use a variable anywhere in your ftHTML markup by simply prefixing the variable name with an '@' symbol
  - Variables can not hold ftHTML syntax, only as-is string values
- Keywords & Pragmas are now case-sensitive (all lowercase)

# 0.6.2

- Trivial Adjustments
- Escaped strings support

# 0.6.0

- Removed the strict rules of file formats (you can now have as many parent elements as you wish)
- Overhauled parsing (made it faster by using less iterations)
- Better parsing error handling
- Removed the rule for an id to be the first attribute in a set, now if there is more than 1 id set an error will be thrown instead. It can be placed randomly as any other attribute
- Ill-formed concatenation now throws errors instead of silently omitting
- Syntax rules are less strict now, for example you can have an empty child ( `div {}` ) or an empty attribute set ( `div () {}` )
