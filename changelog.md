# 1.0.3
  - Fixed an issue with keeping tree source flag

# 1.0.2
  - Minor adjustments to fix issues with respective paths for import

# 0.7.3
  - Reverting index.js
  
# 0.7.2
- Small fixes
  - Simplified errors on parser & lexer for a fthtml language support extension for visual studio code and, in the future, other editors

# 0.7.0

- Introducing variable functionality 
  - Use variables to define frequently used styling, links, elements
  - You can use a variable anywhere in your ftHTML markup by simply prefixing the variable name with an '@' symbol
  - Variables can not hold ftHTML syntax, only as-is string values
  - See [readme.md](https://github.com/soulshined/fthtml/blob/master/readme.md#variables) for more details/examples
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
