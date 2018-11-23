# v6.0

- Removed the strict rules of file formats (you can now have as many parent elements as you wish)
- Overhauled parsing (made it faster by using less iterations)
- Better parsing error handling
- Removed the rule for an id to be the first attribute in a set, now if there is more than 1 id set an error will be thrown instead. It can be placed randomly as any other attribute
- Ill-formed concatenation now throws errors instead of silently omitting
- Syntax rules are less strict now, for example you can have an empty child ( `div {}` ) or an empty attribute set ( `div () {}` ) 