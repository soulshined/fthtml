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
