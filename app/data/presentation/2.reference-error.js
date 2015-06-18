// `world` is not defined as a local variable
// nor given by the VM, so MetaES throws
// an error to the runner of the VM.
// Therefore `console.log` doesn't have a chance to run.
console.log("hello" + world);
///
function interceptor(e, val, env) {
  //console.log('[' + e.type + ']', e.subProgram, String(val));
}
metaes.evaluate(sourceInEditor, {console: console}, {interceptor: interceptor});
