// This example shows that it's possible to run JavaScript code in a `step` mode
// that can be useful for debugging purposes.

// BE CAREFUL!! This example is not optimized and may throttle your browser
// especially when you start to modify the code. Each code change will run
// another instance of MetaES VM that tries to draw on canvas. Please experiment with
// other examples.

var canvas = document.createElement("canvas");
canvas.width = 300;
canvas.height = 300;
var playground = document.querySelector('#canvas');
playground.innerHTML = '';
playground.appendChild(canvas);
var context = canvas.getContext("2d");

for (var i = 0; i < 10; i++) {
  context.fillStyle = getRandomColor();
  drawCircle(Math.random() * canvas.width,
    Math.random() * canvas.height,
    Math.random() * 40 + 10,
    context);
}

function drawCircle(x, y, r, context) {
  context.beginPath();
  context.arc(x, y, r, 0, Math.PI * 2, true);
  context.closePath();
  context.fill();
}

function getRandomColor() {
  // creating a random number between 0 and 255
  var
    r = Math.floor(Math.random() * 256),
    g = Math.floor(Math.random() * 256),
    b = Math.floor(Math.random() * 256);

  // going from decimal to hex
  var hexR = r.toString(16), hexG = g.toString(16), hexB = b.toString(16);

  // making sure single character values are prepended with a "0"
  if (hexR.length == 1) hexR = "0" + hexR;
  if (hexG.length == 1) hexG = "0" + hexG;
  if (hexB.length == 1) hexB = "0" + hexB;

  // creating the hex value by concatenatening the string values
  var hexColor = "#" + hexR + hexG + hexB;
  return hexColor.toUpperCase();
}

///
function interceptor(e, val, env, pause) {
  if (pause) {
    var resume = pause();

    // wait 5ms before execution of each token
    setTimeout(resume, 5);
  }
}
metaes.evaluate(sourceInEditor, window, {interceptor: interceptor});
