/// <reference path="./evaluation-system2.ts" />
/// <reference path="./editor-evaluator.ts" />
/// <reference path="./object-utils.ts" />
function runApp() {
    var editor = document.querySelector('#editor'), evaluator = new EditorEvaluator(editor);
    ObjectUtils.httpGet('./data/grammar.json').then(function (grammar) {
        evaluator.startMode('CompleteStructurally', JSON.parse(grammar));
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
//# sourceMappingURL=main-structural-completions.js.map