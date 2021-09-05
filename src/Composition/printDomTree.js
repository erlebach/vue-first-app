export function traverseDOMTree(targetDocument, currentElement, depth)
{
  if (currentElement)
  {
    var j;
    var tagName=currentElement.tagName;
    // Prints the node tagName, such as <A>, <IMG>, etc
    if (tagName)
      targetDocument.writeln("&lt;"+currentElement.tagName+"&gt;");
    else
      targetDocument.writeln("[unknown tag]");

    // Traverse the tree
    var i=0;
    var currentElementChild=currentElement.childNodes[i];
    while (currentElementChild)
    {
      // Formatting code (indent the tree so it looks nice on the screen)
      targetDocument.write("<BR>\n");
      for (j=0; j<depth; j++)
      {
        // &#166 is just a vertical line
        targetDocument.write("&nbsp;&nbsp;&#166");
      }								
      targetDocument.writeln("<BR>");
      for (j=0; j<depth; j++)
      {
        targetDocument.write("&nbsp;&nbsp;&#166");
      }					
      if (tagName)
        targetDocument.write("--");

      // Recursively traverse the tree structure of the child node
      traverseDOMTree(targetDocument, currentElementChild, depth+1);
      i++;
      currentElementChild=currentElement.childNodes[i];
    }
    // The remaining code is mostly for formatting the tree
    targetDocument.writeln("<BR>");
    for (j=0; j<depth-1; j++)
    {
      targetDocument.write("&nbsp;&nbsp;&#166");
    }			
    targetDocument.writeln("&nbsp;&nbsp;");
    if (tagName)
      targetDocument.writeln("&lt;/"+tagName+"&gt;");
  }
}
////////////////////////////////////////////
// This function accepts a DOM element as parameter and prints
// out the DOM tree structure of the element.
////////////////////////////////////////////
export function printDOMTree(domElement, destinationWindow)
{
  // Use destination window to print the tree.  If destinationWIndow is
  //   not specified, create a new window and print the tree into that window
  var outputWindow=destinationWindow;
  if (!outputWindow)
    outputWindow=window.open();

  // make a valid html page
  outputWindow.document.open("text/html", "replace");
  outputWindow.document.write("<HTML><HEAD><TITLE>DOM</TITLE></HEAD><BODY>\n");
  outputWindow.document.write("<CODE>\n");
  traverseDOMTree(outputWindow.document, domElement, 1);
  outputWindow.document.write("</CODE>\n");
  outputWindow.document.write("</BODY></HTML>\n");
  
  // Here we must close the document object, otherwise Mozilla browsers 
  //   might keep showing "loading in progress" state.
  outputWindow.document.close();
}

export function debugDOM(node, indent = 0) {
  let str = '';
  if (node) {
    str += ' '.repeat(indent);
    if (node.tagName) {
      str += node.tagName + ' ' + (node.dataset['testid'] || '') + '\n';
    } else {
      str += node.textContent + '\n';
    }

    for (let child of node.childNodes) {
      str += debugDOM(child, indent + 2);
    }
  }
  return str;
}

export function prettyDOM(node, indent = 0) {
  let str = '';
  if (node) {
    str += ' '.repeat(indent) + (node.tagName || node.textContent) + '\n';
    for (let child of node.childNodes) {
      str += debugDOM(child, indent + 2);
    }
  }
  return str;
}


export function getStyle(el, styleProp) {
  var value, defaultView = (el.ownerDocument || document).defaultView;
  // W3C standard way:
  if (defaultView && defaultView.getComputedStyle) {
    // sanitize property name to css notation
    // (hypen separated words eg. font-Size)
    styleProp = styleProp.replace(/([A-Z])/g, "-$1").toLowerCase();
    return defaultView.getComputedStyle(el, null).getPropertyValue(styleProp);
  } else if (el.currentStyle) { // IE
    // sanitize property name to camelCase
    styleProp = styleProp.replace(/(\w)/g, function(str, letter) {
    //styleProp = styleProp.replace(/\-(\w)/g, function(str, letter) {
      return letter.toUpperCase();
    });
    value = el.currentStyle[styleProp];
    // convert other units to pixels on IE
    if (/^\d+(em|pt|%|ex)?$/i.test(value)) {
      return (function(value) {
        var oldLeft = el.style.left, oldRsLeft = el.runtimeStyle.left;
        el.runtimeStyle.left = el.currentStyle.left;
        el.style.left = value || 0;
        value = el.style.pixelLeft + "px";
        el.style.left = oldLeft;
        el.runtimeStyle.left = oldRsLeft;
        return value;
      })(value);
    }
    return value;
  }
}

const convertRestArgsIntoStylesArr = ([...args]) => {
    return args.slice(1);
}

export const getStyles = function () {
    const args = [...arguments];
    const [element] = args;

    let stylesProps = [...args][1] instanceof Array ? args[1] : convertRestArgsIntoStylesArr(args);

    const styles = window.getComputedStyle(element);
    const stylesObj = stylesProps.reduce((acc, v) => {
        acc[v] = styles.getPropertyValue(v);
        return acc;
    }, {});

    return stylesObj;
};
