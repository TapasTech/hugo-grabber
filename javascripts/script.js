(function () {
  var figures = document.querySelectorAll('figure');
  Array.prototype.forEach.call(figures, function (figure) {
    var figcaption = figure.querySelector('figcaption');
    var orderNode = document.createTextNode(calcFigOrder(figure) + '. ');
    if (figcaption.firstChild)
      figcaption.insertBefore(orderNode, figcaption.firstChild);
    else
      figcaption.appendChild(orderNode);
  });
  function calcFigOrder(figure) {
    var parentNode = figure.parentNode;
    var childNodes = [];
    Array.prototype.forEach.call(parentNode.childNodes, function (node) {
      if (node.tagName && node.tagName.toLowerCase() === 'figure')
        childNodes.push(node);
    });
    var i;
    for (i = 0; i < childNodes.length; i++) {
      if (childNodes[i] === figure)
        return i + 1;
    }
  }
})();
