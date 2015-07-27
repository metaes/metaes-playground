/// <reference path="./object-utils.ts" />
/// <reference path="./evaluation-system2.ts" />
/// <reference path="../elements/metaes-editor/metaes-editor.ts" />
var didRun = false, examples = [
    { title: "1. Basic evaluation", file: '1.default.js' },
    { title: "2. Reference error", file: '2.reference-error.js' },
    { title: "3. Line/col or range", file: '3.line-col-range.js' },
    { title: "4. Native and metacircular code interoperability", file: '4.native-and-metacircular.js' },
    { title: "5. Native and metacircular code interoperability 2", file: '5.native-and-metacircular2.js' },
    { title: "6. How eval works with MetaES?", file: '6.example-with-eval.js' },
    { title: "7. Complex environment", file: '7.complex-env.js' },
    { title: "8. Other parameters: error", file: '8.other-parameters-error.js' },
    { title: "9. Other parameters: success", file: '9.other-parameters-success.js' },
    { title: "10. ES7 await support", file: '10.es7-await.js' },
    { title: "11. AngularJS simple application", file: '11.angularjs.js' },
    { title: "12. React simple application", file: '12.react.js' },
    { title: "13. Drawing on canvas", file: '13.canvas-slow-mode.js' },
    { title: "14. Custom evaluation values", file: '14.custom-evaluation-values.js' },
    { title: "15. Interpreter VM information", file: '15.vm-information.js' }
], lastExample = localStorage.getItem('lastExample');
function runApp() {
    if (!didRun) {
        var examplesElement = document.querySelector('#examples');
        function onExampleChanged() {
            loadFile(examplesElement.value);
        }
        examplesElement.addEventListener('change', onExampleChanged);
        examples.forEach(function (_a) {
            var title = _a.title, file = _a.file;
            var option = document.createElement('option');
            option.textContent = title;
            option.value = file;
            examplesElement.appendChild(option);
        });
        var editor = document.querySelector('#editor');
        var bootstrap = document.querySelector('#bootstrap');
        function fixCss(dropdown) {
            dropdown.shadowRoot.querySelector('.dropdown-component').style.position = 'relative';
        }
        var output = document.querySelector('#output');
        var variables = document.querySelector('#variables');
        variables.shouldSort = false;
        var callstack = document.querySelector('#callstack');
        [variables, callstack].forEach(fixCss);
        var evaluator = new EvaluationSystem2.EditorEvaluator(editor), logsCounter = 0, console = {
            log: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i - 0] = arguments[_i];
                }
                (_a = window.console).log.apply(_a, arguments);
                output.value = output.value + (logsCounter++) + ". " + Array.prototype.join.call(arguments, " ") + '\n';
                output.scrollTop = output.scrollHeight;
                var _a;
            }
        }, variablesAndCallStackInterceptor = function (e, val, env) {
            var variablesSum = [], callstackSum = [];
            do {
                callstackSum.push(e);
                variablesSum.push.apply(variablesSum, ObjectUtils.extractKeysAndValuesAsCompletions(env.names));
                env = env.prev;
            } while (env);
            variables.values = variablesSum;
            callstack.values = callstackSum.map(function (e, i, array) {
                if (i === array.length - 1) {
                    return {
                        type: "",
                        name: "global",
                        value: ""
                    };
                }
                else {
                    return {
                        type: e.loc ? "line:" + e.loc.start.line : e.subProgram,
                        name: ObjectUtils.shortened(e.subProgram),
                        value: e.type
                    };
                }
            });
        };
        function onBootstrapChange() {
            execute(null, bootstrap.getValue());
            evaluator.evaluate();
        }
        function execute(sourceInEditor, bootstrapSource) {
            var args, metaes = {
                evaluate: function () {
                    args = arguments;
                }
            };
            // interceptor here should be created by `eval`
            eval(bootstrapSource);
            evaluator.setAdditionalMetaESConfigAndInterceptors(args, [variablesAndCallStackInterceptor, interceptor]);
            // if source in editor is not given it means that we're changing the code in `Bootstrap code`
            if (sourceInEditor) {
                editor.setValue(sourceInEditor);
                bootstrap.setValue(bootstrapSource);
            }
        }
        function loadFile(path) {
            ObjectUtils.httpGet('data/presentation/' + path).then(function (response) {
                if (path) {
                    localStorage.setItem('lastExample', path);
                }
                bootstrap.off('change', onBootstrapChange);
                execute.apply(void 0, response.split("///\n"));
                bootstrap.on('change', onBootstrapChange);
            });
        }
        examplesElement.value = localStorage.getItem('lastExample') || examples[0].file;
        onExampleChanged();
        didRun = true;
    }
}
(function (document) {
    'use strict';
    document.addEventListener('polymer-ready', runApp);
    // wrap document so it plays nice with other libraries
    // http://www.polymer-project.org/platform/shadow-dom.html#wrappers
})(wrap(document));
//# sourceMappingURL=main.js.map