// watch Output to see the error information
// See the red text under the text editor as well.
2 /;
///
function interceptor(e, val, env) {
  //console.log('[' + e.type + ']', val);
}

function success(ast, value) {
}

function error(ast, errorType, error) {
  console.log("error");
  console.log(errorType, error);
  console.log(JSON.stringify(ast));
}

window.metaes.evaluate(sourceInEditor,
  window,
  {interceptor: interceptor},
  success,
  // the fifth parameter is a function that will accept
  // ast node (if available, there can be syntax error),
  // errorType and error reference
  error);
