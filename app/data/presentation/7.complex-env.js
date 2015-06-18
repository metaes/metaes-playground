// `parseInt` is a user modified parseInt,
// but this VM has no access to the original one
console.log("additon result:", parseInt(a) + parseInt(b));
///
function interceptor(e, val, env) {
  //console.log('[' + e.type + ']', val);
}
var
  env = {
    names: {
      // give `a` and `b` as variables to the VM
      a: '1',
      b: '2',

      // `parseInt` is instrumented with additional JavaScript code
      // that is run natively. But could be run metacircullary as well
      parseInt: function () {
        console.log('instrumented parseInt is called with arguments:', [].join.call(arguments, ", "));

        // and call the original `parseInt`, from current window
        return parseInt.apply(null, arguments);
      },
      console: console
    },
    prev: {
      names: window
    }
  };
metaes.evaluate(sourceInEditor,
  env,
  {interceptor: interceptor});
