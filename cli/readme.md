It is recommended to install ftHTML globally to take advantage of the CLI. 

For those that don't know, installing globally allows you to use the module in any directory of your computer. This makes it easier to convert files, process tasks and more.

> npm install -g fthtml

# CLI

### Commands

`fthtml --version`

  > alias : -v
  > description: Show version of package

`fthtml --help`

  > alias : -h
  > description: Show respective help, can intercept other command flags

`fthtml convert <dir, filename> <flags>`

  > description: Convert a directory full of files or a specific .fthtml file to HTML syntax

  ##### Notes:

  - Converting files will only look for `.fthtml` files in the specified directory and nothing else. 
  - By default, 'node_modules' and 'test' directories are omitted from the process

  ##### Flags:

  - `--dest | -d` [optional = same dir as file] `<dir>` - the directory where you want the file[s] to export to
  - `--exclude | -e | -e -- <dirs>` [optional = [node_modules, test]] - the directories to exclude from converting
  - `--keep-tree | -k` [optional = false] - keep the tree structure of the imported files to export as-is in the destination dir
  - `--pretty | -p` [optional = false] - exports the HTML syntax in a somewhat human readable format (not perfect but good enough)
  
# Examples:

For demonstration purposes, let's assume your project folder resembles the following:


```
C:\Documents\nodeapp
|--package.json
`--node_modules\
    `--browserify\
`--index.js
`--out\
`--imports\
    `--scripts.imp.fthtml
    `--header.imp.fthtml
    `--footer.imp.fthtml
`--contact\
    `--styles.css
    `--index.fthtml
`--about\
    `--styles.css
    `--index.fthtml
```

*please note, your project does NOT have to actually be a node.js application to use ftHTML CLI with*

**Converting a file without any flags**

> `fthtml convert ./about/index.fthtml`

```
C:\Documents\nodeapp
|--package.json
`--node_modules\
    `--browserify\
`--index.js
`--out\
`--imports\
    `--scripts.imp.fthtml
    `--header.imp.fthtml
    `--footer.imp.fthtml
`--contact\
    `--styles.css
    `--index.fthtml
`--about\
    `--styles.css
    `--index.fthtml
  ++`--index.html
```

**Converting a directory of files without any flags**

> `fthtml convert ./imports`

```
C:\Documents\nodeapp
|--package.json
`--node_modules\
    `--browserify\
`--index.js
`--out\
`--imports\
    `--scripts.imp.fthtml
  ++`--scripts.imp.html
    `--header.imp.fthtml
  ++`--header.imp.html
    `--footer.imp.fthtml
  ++`--footer.imp.html
`--contact\
    `--styles.css
    `--index.fthtml
`--about\
    `--styles.css
    `--index.fthtml
```

**Converting a directory of files and exporting to a specific directory**

> `fthtml convert ./ --dest ./out`

```
C:\Documents\nodeapp
|--package.json
`--node_modules\
    `--browserify\
`--index.js
`--out\
  ++`--scripts.imp.html
  ++`--header.imp.html
  ++`--footer.imp.html
  ++`--index.fthtml
`--imports\
    `--scripts.imp.fthtml
    `--header.imp.fthtml
    `--footer.imp.fthtml
`--contact\
    `--styles.css
    `--index.fthtml
`--about\
    `--styles.css
    `--index.fthtml
```

*please note:*

  *1)  that the 'out' folder must be a valid directory prior to running the command*

  *2)  the `out/index.fthtml` only contains one index.html, even though `contact\` & `about\` both have one. The file simply gets written over in this circumstance*



**Converting a directory of files and exporting to a specific directory while keeping tree structure**

> `fthtml convert ./ --dest ./out -k`

```
C:\Documents\nodeapp
|--package.json
`--node_modules\
    `--browserify\
`--index.js
`--out\
  ++`--imports\
      ++`--scripts.imp.html
      ++`--header.imp.html
      ++`--footer.imp.html
  ++`--contact\
      ++`--index.fthtml
  ++`--about\
      ++`--index.fthtml
`--imports\
    `--scripts.imp.fthtml
    `--header.imp.fthtml
    `--footer.imp.fthtml
`--contact\
    `--styles.css
    `--index.fthtml
`--about\
    `--styles.css
    `--index.fthtml
```

*please note that the 'out' folder must be a valid directory prior to running the command*

**Converting a directory of files and exporting to a specific directory while excluding a directory and keeping tree structure**

> `fthtml convert ./ -d ./out -k -e imports`

```
C:\Documents\nodeapp
|--package.json
`--node_modules\
    `--browserify\
`--index.js
`--out\
  ++`--contact\
      ++`--index.fthtml
  ++`--about\
      ++`--index.fthtml
`--imports\
    `--scripts.imp.fthtml
    `--header.imp.fthtml
    `--footer.imp.fthtml
`--contact\
    `--styles.css
    `--index.fthtml
`--about\
    `--styles.css
    `--index.fthtml
```

*please note that the excluded directories are relative to the convert directory*

**Converting a directory of files and exporting to a specific directory while excluding many directories and keeping tree structure** 

> `fthtml convert ./ -d ./out -k -e imports -e contact`

> `fthtml convert ./ -d ./out -k -e -- imports contact` (repeat as many directories seperated by a space)

> `fthtml convert ./ -d ./out -k --exclude -- imports contact` (repeat as many directories separated by a space)

```
C:\Documents\nodeapp
|--package.json
`--node_modules\
    `--browserify\
`--index.js
`--out\
  ++`--about\
      ++`--index.fthtml
`--imports\
    `--scripts.imp.fthtml
    `--header.imp.fthtml
    `--footer.imp.fthtml
`--contact\
    `--styles.css
    `--index.fthtml
`--about\
    `--styles.css
    `--index.fthtml
```

*please note that the excluded directories are relative to the convert directory*
