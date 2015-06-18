console.log("hello world!");
///
// MetaES supports AST information provided by esprima,
// so it contains both line/col and range values.
// This information can be used in tools based on source.
function interceptor(e, val, env) {
  console.log('[' + e.type + ']', JSON.stringify(e.loc), e.range);
}
metaes.evaluate(sourceInEditor, {console: console}, {interceptor: interceptor});
