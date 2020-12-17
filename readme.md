ftHTML is an HTML preprocessor created to simplify regular HTML markup and get rid of all the unnecessary typing needed for tags, selectors and special characters. The focus is on importing basic templates, utilizing limited variables and generating a more modularized project. Included is a CLI that helps make this transition easier by quickly converting `ftHTML` files to static resources you can upload to any server like normal.

Visit https://www.fthtml.com for more information and resources

Quickly build HTML resources without the limitations of HTML

## Features
* Variables and global variable support
* Basic template and property binding
* Import other files natively
* Native JSON support
* Macros like `__DATE__`, `__NOW__`, `__JS_URI__`
* Functions like `choose`, `html_encode`, `html_decode`, `random`, `replace`, `str_repeat`, `str_reverse`, `str_format`, `substring`, `tcase`, `trim`
* String interpolation
* Embedded languagues
* Easy typing
* Selector syntax sugar - use `#` for attribute ids and `.` for classes

__Turn this:__
```html
<!DOCTYPE html>
<html>
<head>
  <title>Page Title</title>
  <link rel="stylesheet" href="styles.css"/>
</head>
<body>

<h1>My First Heading</h1>
<p>My first paragraph.</p>
<img src="img_typo.jpg" alt="Girl with a jacket">
<p style="color:red">I am a paragraph</p>
<ul id="myList" class="drinks" data-drinktypes="morning">
  <li>Coffee</li>
  <li>Tea</li>
  <li>Milk</li>
</ul>
</body>
</html>
```
__Into ftHTML:__
```
doctype "html"
html
{
  head
  {
    title "Page Title"
    link(rel=stylesheet href=styles.css)
  }
  body
  {
    h1 "My First Heading"
    p "My First Paragraph"

    img(src=img_typo.jpg alt="Girl with a jacket")

    p (style="color:red") "I am a red paragraph"

    ul (#myList .drinks data-drinktypes=morning) {
      li "Coffee"
      li "Tea"
      li "Milk"
    }
  }
}
```

You can import other ftHTML files by simply using the `import` keyword. That way you only have to write markup once and use it anywhere! The following demonstrates importing a footer tag:

```
html
{
  import "header"
  body
  {
    ...
  }
  import "footer"
}
```
> Imported files must use ftHTML syntax.


# Installing

**npm:**

It is recommended to install ftHTML globally to take advantage of the CLI.

For those that don't know, installing globally allows you to use the module in any directory of your computer. This makes it easier to convert files to static resources, process tasks for IDE's and more.

> npm install -g fthtml

# Using
Node.js:
```
const ftHTML = require('fthtml');
ftHTML.renderFile('filename');
```

- `.fthtml` extn is intended to be omitted from the filename.
- `.renderFile()` returns the interpreted HTML syntax
- Alternatively, you can just compile text with ftHTML.compile(text) if you don't want to use a file

Additionally, you can convert .fthtml resources via [command line](https://www.fthtml.com/cli/) and export them as static resources.

Roadmap can be found [here](https://github.com/soulshined/fthtml/projects/1)
