var x, y, z;

// let's call the special method on `vm` object
// constructed for this instance of interpreter.
console.log(vm.getScopeVariablesNames());
///
function interceptor(e, value, env, pause) {

  // the actual logic of `getScopeVariablesNames`
  // is handled inside interceptor,
  // but in fact the code could be moved anywhere.
  if (e.type === 'CallExpression' && value && value.callee == vm.getScopeVariablesNames) {
    pause()(Object.keys(env.names));
  }
}

// let's create special object called `vm`
// and give it a method responsible for list of variables in current scope
var vm = {
  getScopeVariablesNames: function getScopeVariablesNames() {
    // [Interpreter code]
  }
};
metaes.evaluate(sourceInEditor, {
    x: 1,
    console: console,
    JSON: JSON,
    vm: vm
  },
  {interceptor: interceptor});
