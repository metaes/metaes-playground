/// <reference path="./evaluation-system2.ts" />
/// <reference path="./editor-evaluator.ts" />
/// <reference path="./object-utils.ts" />

function runApp() {
  var
    editor:Editor.MetaesEditor = <any>document.querySelector('#editor'),
    evaluator = new EditorEvaluator(editor);

  let get = ObjectUtils.httpGet;

  Promise
    .all([get('./data/partial-evaluation/example1.js'), get('./data/grammar.json')])
    .then(([file, grammar])=> {
      editor.setValue(file);
      evaluator.startMode('EvaluateExpression', JSON.parse(grammar));
    });
}

(function (document) {
  'use strict';
  var run = false;
  document.addEventListener('polymer-ready', function () {
    if (!run) {
      runApp();
    }
    run = true;
  });

// wrap document so it plays nice with other libraries
// http://www.polymer-project.org/platform/shadow-dom.html#wrappers
})(wrap(document));
