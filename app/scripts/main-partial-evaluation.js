/// <reference path="./evaluation-system2.ts" />
/// <reference path="./editor-evaluator.ts" />
/// <reference path="./object-utils.ts" />
function runApp() {
    var editor = document.querySelector('#editor'), evaluator = new EditorEvaluator(editor);
    var get = ObjectUtils.httpGet;
    ObjectUtils.httpGet('./data/partial-evaluation/example1.js')
        .then(function (file) {
        editor.setValue(file);
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