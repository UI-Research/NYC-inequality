#NYC-inequality

This project consists of static css, js, and html files (with embedded svg). The data that powers the project is stored in [data/data.csv](data/data.csv), and read into the visualization using [d3.js](http://d3js.org/).

The main project file is [index.html](index.html). The small amount of code in this file should be loaded wherever you wish to load the project (with the rest of the files and relative paths intact). The project uses [pym.js](http://blog.apps.npr.org/pym.js/) to create a responsive-width iframe. The code that goes inside the iframe is inside the child.html file.

Within index.html, the following lines are neccessary:

```
 <base target="_blank" />
 <meta charset="utf-8">
```

in the head are required for proper text rendering and link behavior.

Take note of the following two inline-styles:

```
 <body style="margin: 0">
 <div id="graphic" style = "max-width: 1200px"></div>
```

Which get rid of the iframe border, and set a maxium width for the responsive graphic.

Finally

```
 <script type="text/javascript" src="js/vendor/pym.min.js"></script>
 <script src="js/vendor/jquery-1.11.2.min.js"></script>
 <script>
	var scrollFunc = function(){
	  $('html,body', window.document).animate({
	    scrollTop: '900px'
	  }, 200);
	};
    var parent = new pym.Parent('graphic', 'child.html', {});
 </script> 
```

Are required libraries, followed by a function which allows the iframe to trigger scrolling events on the parent, and a call to pym.js to create the responsive iframe.

CSS, JS, and image files are contained within the css, js, and img folders respectively. Within js and css the "vendor" folders contain external libraries (d3, pym, jquery, modernizr, and jquery-ui).

[print.html](print.html) and [print_child.html](print_child.html) are the printable layout files (along with [print.js](js/print.js)). When the user clicks the print button, print.html will open, which contains print_child.html in a responsive iframe with a set width appropriate for portrait 8 1/2 x 11 printing (similarl to the structure of index.html and child.html).
