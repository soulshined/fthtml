This is a personal package created to simplify regular HTML markup and get rid of all the unnecessary typing needed for tags, selectors and special characters. More importantly this was practice for myself to get introduced into lexical analysis, parsing tokens and ASTs.

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
- Alternatively, you can just compile text with ftHTML.compile(text) if you don't want to use a file

# File Format Rules

The doctype keyword should always be used prior to first element or any pragmas of the file.

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

As shown below, the first parent element of the file doesn't need to be a traditional `<html>` tag, it can be any identifier, even custom ones, this is useful for when importing other files as templates (more on that later). It can simply even be an element with a body & no children:

```
body "Hello World"
```

# Documentation
## Attributes / Selectors

Notes: 
- Attributes and selectors are always enclosed in a `(` `)` set
- All selectors/attributes can be in any random order
- If you include multiple id's in a single attribute set, an error will be thrown
- If your attribute's value has spaces, wrap the value in quotations. 
- The only special characters allowed are '@'(at), '.'(period), '-'(hypen), '_'(underscore) -- all cases where a special character other than that will be used it is recommened to wrap it in quotations (for example a relative path: `a(href='../../index.fthtml')`, classes and id's can not be wrapped in quotations

Syntax:

`(<#id>, <.class>, <attr=value>, <attr="value">)`

You can also use variables as any of the above mentioned values, or simply use a variable for the attribute entirely:
`(<.@variablename>, <attr=@variable>)`

## Elements
There are 5 possible ways to create an element
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
- `<identifier> <@variable>`
```
div @var1

-- or --

div (#id @attrVar1) @var2

-- or --

div {
  "This is a div with a sibling variable " + @paraVar
}
```

- `<@variable>`
```
  body {
  ...
    @paraVar
  ...
  }
```

## Concating Elements
When wanting to concatenate elements or child elements you must wrap them in `{ }` set. Errors will be thrown when necessary to prevent ill-formed syntax.

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
Error: Elements can not start with symbols.
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

## Importing files

The idea behind importing files is for them to act like templates. For demonstration purposes lets use a navigation menu, which is usually found on every major page of your site. Instead of copying/pasting, you can create a file, let's say "header.fthtml", for demonstration, and import it inline using the keyword "import"

I would test each file individually before doing this to ensure proper syntax, as the parsing error handling does not take into account which file throws it at the moment. 

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

## Variables

Variables are key value pairs that are encapsulated in the new `#vars` pragma. The idea for variables to easily define a commonly used style, pattern, element in one place and be able to use it in many places.

Notes:
- Variables must be enclosed in th `#vars` pragma
- Variable values ___can only be string data types___
- Variables can **NOT** use another variable as it's value
- Variable values are evaluated **AS IS**
- You can not import vars from another file
- You can define variables anywhere in your markup as long as you meet the fundamental requirements noted above

Syntax [Defining]:

```
 #vars
  ...
   <var name> "<var value>"
  ...
 #end
```

Syntax [Referencing]:

`@<var name>`

The following demonstrates:
```
doctype "html"

#vars
  btn-style-danger 'style="color: red; font-weight: bold; font-size: 1.1rem;"'
  btn-classes-active "btn btn-group btn-primary active"

  sitelinks
    '<ul>
      <li><a href="#">Home</a></li>
      <li><a href="./profile">Profile</a></li>
      <li><a href="./contact">Contact</a></li>
      <li><a href="./policies">Terms</a></li>
     </ul>'
#end

<!-- Once defined, variables can be used anywhere in your markup 
      and the values are evaluated AS-IS
      
    Simply use the '@' symbol followed by the variables name -->
    
body 
{
  nav 
  {
    button(.@btn-classes-active) "Account"
    button(.btn-primary @btn-style-danger) "Log Out"

    div (.navbar) @sitelinks
  }

  ...

  footer
  {
    @sitelinks
  }
}

```

Produces:

```html
<body>
  <nav>
    <button class="btn btn-group btn-primary active">Home</button>
    <button class="btn-primary" style="color: red; font-weight: bold; font-size: 1.1rem;">Log Out</button>
    
    <div class="navbar">
      <ul>
        <li><a href="#">Home</a></li>
        <li><a href="./profile">Profile</a></li>
        <li><a href="./contact">Contact</a></li>
        <li><a href="./policies">Terms</a></li>
      </ul>
    </div>
  </nav>
  <footer>
    <ul>
      <li><a href="#">Home</a></li>
      <li><a href="./profile">Profile</a></li>
      <li><a href="./contact">Contact</a></li>
      <li><a href="./policies">Terms</a></li>
    </ul>
  </footer>
</body>
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