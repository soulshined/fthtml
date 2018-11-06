This is a personal package created to simplify regular HTML markup and get rid of all the unnecessary typing needed for tags, selectors and special characters. More importantly this was practice for myself to get introduced into lexical analysis, parsing tokens and ASTs.

This preprocessor is not in final form, Parsing Error Handling for example is extremely weak as it stands now. However, provided you have a syntactically well formed ftHTML file per ftHTML standards, it will translate accordingly just fine.  

This was made specifically with node.js in mind.

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

You can import other ftHTML files by simply using the `import` keyword:

```
html
{
  body
  {
    ...
  }
  import "footer"
}
```
> Imported files must be local files and use ftHTML syntax.

# Installing

Using npm:

```
 npm install fthtml
```

# Using
Node.js:
```
const ftHTML = require('fthtml');
ftHTML.renderFile('filename');
```

- `.fthtml` extn is intended to be omitted.
- `.renderFile()` returns the interpreted HTML syntax

# File Format Rules

The .fthtml file is expected to be formatted with one element (identifier + body) or one parent element, with many children elements. The following demonstrates:

#### Good Form
```
main 
{
  "This is the main content"
}
```
or
```
main 
{
  section 
  {
    ...
  }
  section
  {
    ...
  }
  section
  {
    ...
  }
  article 
  {
    ...
  }
}
```
#### Bad Form
```
header
{
  ...
}
main
{
  ...
}
footer 
{
  ...
}
```

In other words, the file should be formed as such as there is only 1 parent per file. Otherwise you will recieve a generic AST error.

The only exception is when you use doctype, the doctype keyword will always be used prior to first element of the file.

The following is an example of a well formed ftHTML file:

```
//This is a parent element
div (#myDiv .firstDivClass .secondDivClass .thirdDivClass)
{
  //many children
  div "This is first child div"
  div "This is second child div"
  div
  {
    "This is the third child div, with an example " + a (href=index.html target=_blank) "link"
  }
  div
  {
    p "Just a paragraph"
  }
}
```

As shown below, the first parent element of the file doesn't need to be a traditional `<html>` tag, it can be any identifier, even custom ones, this is useful for when importing other files as templates (more on that later), but this illustrates it is indeed expecting one parent element. It can simply even be an element with a body & no children:

```
body "Hello World"
```

# Documentation
## Attributes / Selectors

Notes: 
- Attributes and selectors are always enclosed in a `(` `)` set
- If you include an id, it is REQUIRED that the id be the first selector in the set. This is to ensure only 1 id is included for the element. All following selectors/attributes can be in any random order
- There can ___not___ be an empty attribute set. In other words, `div()` is considered fatal, and simply `div` is recommended.
- If your attribute's value has spaces, wrap the value in quotations. 
- The only special characters allowed are '.'(period), '-'(hypen), '_'(underscore) -- all cases where a special character other than that will be used it is recommened to wrap it in quotations (for example a relative path: `a(href='../../index.fthtml')`, classes and id's can not be wrapped in quotations

Syntax:

`(<id> [<.class>] [<attr=value> || <attr="value">])`

## Elements
There are 3 possible ways to create an element
- `<identifier> <string>`
```
div "content"
```
- `<identifier> <selectors/attributes> <string>`
```
div (#id .class1 .class2 .class3 ) "content"
```
- `<identifier> <selectors/attributes> <body>`
```
div (#id .class1 .class2 data-foo=bar)
{
  "content"
}

-- or --

div (#id .class1 .class2 data-foo=bar) "content"

--or--

div (#id .class1 data-foo=bar .class2) 
{
  div 
  {
    ...
  }
}
```

## Concating Elements
When wanting to concatenate elements or child elements you must wrap them in `{ }` set. It will ___not___ prove fatal, however, they will become sibling elements instead of a single concatenated element.

The following demonstrates:
#### Good Form
```
p { "Paragraph content with an interpolated link " + a (href=index.html target=_blank) "here" }
```
Produces:
```
<p>Paragraph content with an interpolated link <a href="index.html" target="_blank">here</a></p>
```
#### Bad Form
```
p "Paragraph content  with an interpolated link " + a (href=index.html target=_blank) "here" 
```
Produces:
```
<p>Paragraph content with an interpolated link</p>
<a href="index.html" target="_blank">here</a>
```

> You can continue concatenating as long as concatenated elements are in a `{ }` set

Example:
```
p { 
  "To go home click " + 
  a (href=index.html target=_blank) "here" + 
  " or to contact us click " + 
  a (href=contact.fthtml target=_blank) "here" 
}
```
Produces:
```
<p>To go home click <a href="index.html" target="_blank">here</a> or to contact us click <a href="contact.fthtml" target="_blank">here</a></p>
```

Without the concatenation symbol the elements will be siblings

## Importing files

The idea behind importing files is for them to act like templates. For demonstration purposes lets use a navigation menu, which is usually found on every major page of your site. Instead of copying/pasting, you can create a file, let's say "header.fthtml", for demonstration, and import it inline using the keyword "import"

I would test each file individually before doing this to ensure proper syntax, as the parsing error handling is weak as noted above. Until better error handling is implemented test each file before importing. 

Notes:
- Import supports relative paths (ex: "../../header")
- Import DOES NOT support absolute urls
- It is REQUIRED that the imported file be .fthtml syntax
- It is REQUIRED that you omit the extension
- Imported files can not complete an element from calling file. Meaning, no opened tags allowed and then the import file closes that tag. It will produce a fatal error if any file is not well formed
- Imports happen synchronously
- Import is wrapped in a try/catch so if there is issues that are not fatal, it will simply be omitted and the parsing will continue.

Syntax:

`import "<filename>"`

Full example:

`header.fthtml`
```
header (.topnav)
{
  a (.active href=index.fthtml) "Home"
  a (href=news.fthtml) "News"
  a (href=contact.fthtml) "Contact"
  a (href=about.fthtml) "About"
}
```
`index.fthtml`
```
html 
{
  head 
  {
    title "Test Import Page"
    link(rel=stylesheet href=styles.css)
  }

  comment "The following elements were imported using ftHTML import keyword"
  import "header"
  comment "End of import using ftHTML import keyword"

  main
  {
    ....
  }
  footer 
  {
    ....
  }
}
```
Produces:
```html
<html>
<head>
  <title>Test Import Page</title>
  <link href="style.css"/>
</head>
<!-- The following elements were imported using ftHTML import keyword -->
<header class="topnav">
  <a class="active" href="index.fthtml">Home</a>
  <a href="news.fthtml">News</a>
  <a href="contact.fthtml">Contact</a>
  <a href="about.fthtml">About</a>
</header>
<!-- End of import using ftHTML import keyword -->
<main>
  ...
</main>
<footer>
  ...
</footer>
</html>
```

## Comments

There are 3 types of comments to use in ftHTML syntax:
- Line Comments
- Block Comments
- DOM comments

All comments are omitted from output except the DOM comments. In other words, line comments and block comments are simply for dev purposes and will not show up in the final HTML output. DOM comments are different, you can explicitly ensure a comment will be with the output by using the 'comment' keyword.

The following demonstrates:

Line comment:
```
div
{
  //this is a div that will contain the users profile pic
  img (src=img.jpg)
}
```
Produces:
```html
<div>
  <img src="img.jpg">
</div>
```

Block comment: (supports multiline)
```
/*
  this comment will not be in the output. 
  It supports multiple lines and can be used anywhere in the markup
*/

-- or --

div /* profile picture div */ {

}
```
Produces:
```html
<div></div>
```

DOM comment:

Syntax:
`comment "<value>"`
```
div 
{
  comment "If you are reading this, then you can see it when inspecting the source"
  img (src=img.jpg)
}
```

Produces:
```html
<div>
  <!-- If you are reading this, then you can see it when inspecting the source -->
  <img src="img.jpg">
</div>
```

Therefore, in this particular preprocessor, you can not use comment as a custom tag identifier as it will maintain as a keyword, and therefore it can not have a child body

## Special Mentions
It is easy to include scripts such as javascript by wrapping them in quotations of choice.

For example:
```
html
{
  head 
  {
    script {
      '
        let body = document.body;
        body.innerHTML = "navigator.product is " + navigator.product;
      '
    }
  }
}
```
Produces:
```html
<html>
<head>
  <script>
    let body = document.body;
    body.innerHTML = "navigator.product is " + navigator.product;
  </script>
</head>
</html>
```

---

To fully demonstrate ftHTML syntax making a here is an example of a modal tutorial taken from W3 Schools:

```
doctype "html"
html
{
  head 
  {
    meta (name=viewport content="width=device-width, initial-scale=1")
    style 
    {
      '
      body {font-family: Arial, Helvetica, sans-serif;}

      /* The Modal (background) */
      .modal {
          display: none; /* Hidden by default */
          position: fixed; /* Stay in place */
          z-index: 1; /* Sit on top */
          padding-top: 100px; /* Location of the box */
          left: 0;
          top: 0;
          width: 100%; /* Full width */
          height: 100%; /* Full height */
          overflow: auto; /* Enable scroll if needed */
          background-color: rgb(0,0,0); /* Fallback color */
          background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
      }

      /* Modal Content */
      .modal-content {
          background-color: #fefefe;
          margin: auto;
          padding: 20px;
          border: 1px solid #888;
          width: 80%;
      }

      /* The Close Button */
      .close {
          color: #aaaaaa;
          float: right;
          font-size: 28px;
          font-weight: bold;
      }

      .close:hover,
      .close:focus {
          color: #000;
          text-decoration: none;
          cursor: pointer;
      }
      '
    }
  }
  body 
  {
    h2 "Modal Example"
    
    // Trigger/Open The Modal
    button (#myBtn) "Open Modal"

    //The modal
    div (#myModal .modal) 
    {
      //modal content
      div (.modal-content) {
        span (.close) "&times;"
        p "Some text in the Modal..."
      }
    }

    script 
    {
      '
      // Get the modal
      var modal = document.getElementById('myModal');

      // Get the button that opens the modal
      var btn = document.getElementById("myBtn");

      // Get the <span> element that closes the modal
      var span = document.getElementsByClassName("close")[0];

      // When the user clicks the button, open the modal 
      btn.onclick = function() {
          modal.style.display = "block";
      }

      // When the user clicks on <span> (x), close the modal
      span.onclick = function() {
          modal.style.display = "none";
      }

      // When the user clicks anywhere outside of the modal, close it
      window.onclick = function(event) {
          if (event.target == modal) {
              modal.style.display = "none";
          }
      }
      '
    }
  }
}
```

Produces:

```html
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body {font-family: Arial, Helvetica, sans-serif;}

/* The Modal (background) */
.modal {
    display: none; /* Hidden by default */
    position: fixed; /* Stay in place */
    z-index: 1; /* Sit on top */
    padding-top: 100px; /* Location of the box */
    left: 0;
    top: 0;
    width: 100%; /* Full width */
    height: 100%; /* Full height */
    overflow: auto; /* Enable scroll if needed */
    background-color: rgb(0,0,0); /* Fallback color */
    background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
}

/* Modal Content */
.modal-content {
    background-color: #fefefe;
    margin: auto;
    padding: 20px;
    border: 1px solid #888;
    width: 80%;
}

/* The Close Button */
.close {
    color: #aaaaaa;
    float: right;
    font-size: 28px;
    font-weight: bold;
}

.close:hover,
.close:focus {
    color: #000;
    text-decoration: none;
    cursor: pointer;
}
</style>
</head>
<body>

<h2>Modal Example</h2>

<button id="myBtn">Open Modal</button>

<div id="myModal" class="modal">
  <div class="modal-content">
    <span class="close">&times;</span>
    <p>Some text in the Modal..</p>
  </div>
</div>

<script>
// Get the modal
var modal = document.getElementById('myModal');

// Get the button that opens the modal
var btn = document.getElementById("myBtn");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the modal 
btn.onclick = function() {
    modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
    modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}
</script>

</body>
</html>
```