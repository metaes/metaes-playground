// watch Output to see the success evaluation information
2+2;
///
function interceptor(e, val, env) {
  //console.log('[' + e.type + ']', val);
}

function success(ast, value) {
  console.log("success");
  console.log(value);
  console.log(JSON.stringify(ast, null, 2));
}

function error(ast, errorType, error) {
}

window.metaes.evaluate(sourceInEditor,
  window,
  {interceptor: interceptor},
  // the fourth parameter is a function that will accept
  // ast node and value of last evaluated expression
  success,
  error);
