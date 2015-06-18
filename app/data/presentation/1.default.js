// `message` is a local variable,
// but `name` is created by VM in Bootstrap code
var message = 'hello ';
console.log(message + name + '!');

try {
  // Number is not given
  // (and nothing except `console`, `name` and `setTimeout`)
  // in the VM global environment.
  Number;
} catch (e) {
  // There should be `ReferenceError: Number is not defined.`
  // in the console or the Output.
  console.log(e);
}

setTimeout(function () {
  // After this code is called, the callstack contains
  // context for this function and the surrounding closure
  console.log(message);
}, 1000);

var object = {foo: 'bar'};
// Press ctrl+space to see possible completions.
// Start writing for example: [ctrl+space] and then `object.foo.length;`


///
// FYI:
// The whole code (`JavaScript code` and `Boostrap code`) is called with `eval`
// and the variable `sourceInEditor`
// is defined in some scope of the Playground`s code.

// This is a function called for each AST node.
function interceptor(e, val, env, pause) {

  // uncomment this line to evaluation history
  //console.log('[' + e.type + ']', String(val));
}
metaes.evaluate(
  // This is the code in `JavaScript code` editor
  sourceInEditor,
  // Environment given to the VM. It's really limited now,
  // only those three global variables are available.
  {console: console, name: "Joe", setTimeout: setTimeout},
  {interceptor: interceptor});
