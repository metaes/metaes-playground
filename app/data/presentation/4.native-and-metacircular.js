// In here, mapper is a metacircular function,
// but uses native console.log
// You can go to your devtools console and write for example:
// >> mapper(2) // will output interceptor logs and `40`
// >> [1,2,3].map(mapper) // will output interceptor logs as well
// and [10,40,90]
// Of course, you can live edit this code
// and see the results in devtools console.
//
// Calling `mapper.toString()` will output metacircular source, but calling
// `Function.prototype.toString.call(mapper)` will give
// `function (x) {return MetaInvokerInner.apply(this,arguments)}`
// that is the actual JavaScript code what will be called.
//
// You may guess that `MetaInvokerInner` is a variable available inside MetaES code
// and inits all the metacircular interpretation of source.
var mapper = window.mapper = function (x) {
  console.log(x);
  return x * x * c;
};
// Array.prototype.map is native function,
// but `mapper` is metacircular one
var result = [1, 2, 3, 4, 5].map(mapper);

console.log(result);
///
function interceptor(e, val, env) {
  //console.log('[' + e.type + ']', val);
}
metaes.evaluate(
  sourceInEditor,
  {
    window: window,
    console: console,

    // let's add additional variable to the VM
    // to see that everything works fine
    c: 10
  },
  {interceptor: interceptor});

// by the way, MetaES automatically
// converts functions to metacircular ones:
// (remember that `window.metaes` is the original one)
var reducer = window.metaes.evaluate(
  function reduce(a, b) {
    return a + b + c
  },
  {c: 10},
  {inteceptor: interceptor});

console.log("reduction result", [1, 2, 3, 4].reduce(reducer));
