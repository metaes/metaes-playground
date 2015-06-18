// just change the value of `foo` defined in native `window` object.
foo = "world";
///
function interceptor(e, val, env) {
  //console.log('[' + e.type + ']', val);
}

// Here, the whole `window` - global environment is given to the VM.
// Let's create a variable foo:
window.foo = "hello";
// and modify it inside the VM (`JavaScript code` does it).
metaes.evaluate(sourceInEditor, window, {interceptor: interceptor});

// and log `foo` here, in native code that
// was modified by metacircular code.
// It has to use `setTimeout`,
// because the editor uses listeners and evaluation
// is based on `change` event in editor.
// Normally you could omit `setTimeout`.
setTimeout(function () {
  console.log('`', foo, "` from native code");
});

// ... like here in this example, but bypassing Playground's editor:
window.variable = 0;
window.metaes.evaluate(
  'variable=1',
  window,
  {
    // interceptor can be also passed as anonymous function, of course
    interceptor: function interceptor(e, val, env) {
      //console.log('[' + e.type + ']', e.subProgram, String(val));
    }
  });
console.log("done:", variable);
