// to start off, just "console log" some expression
console.log('just from console:', 2 + 2);

// now evaluate it using metacircular eval
eval("console.log('from eval:', 2 + 2)");

// let's create another VM from metacircular code,
// passing native console. Otherwise, we'll get
// Reference error
metaes.evaluate('console.log("from MetaES inside MetaES:", 2+2)', {console: console});

// metaes.evaluate returns an immediate value, here's the example
console.log("evaluated MetaES:", eval("metaes.evaluate('2+2',{})"));
///
function interceptor(e, val, env) {

}
metaes.evaluate(sourceInEditor,
  // we have to use `window.metaes`,
  // because plain `metaes` is a wrapper that is used
  // by this Playground to support editors.
  // Like so:

  // metaes = {
  //   evaluate() {
  //     args = arguments;
  //     console.log(arguments);
  //   }
  // }

  // and `args` are later passed to the playground code.
  {metaes: window.metaes, console: console, eval: eval},
  {interceptor: interceptor});
