/// <reference path="./evaluation-system2.ts" />
/// <reference path="./editor-evaluator.ts" />
/// <reference path="./object-utils.ts" />
function runApp() {
    var editor = document.querySelector('#editor'), evaluator = new EditorEvaluator(editor);
    var get = ObjectUtils.httpGet;
    Promise
        .all([get('./data/partial-evaluation/example1.js'), get('./data/grammar.json')])
        .then(function (_a) {
        var file = _a[0], grammar = _a[1];
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
//# sourceMappingURL=main-partial-evaluation.js.map