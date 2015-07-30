/// <reference path="./object-utils.ts" />
/// <reference path="./evaluation-system2.ts" />
/// <reference path="./editor-evaluator.ts" />
/// <reference path="../elements/metaes-editor/metaes-editor.ts" />

declare
var wrap:Function;

var
  didRun = false,
  examples = [
    {title: "1. Basic evaluation", file: '1.default.js'},
    {title: "2. Reference error", file: '2.reference-error.js'},
    {title: "3. Line/col or range", file: '3.line-col-range.js'},
    {title: "4. Native and metacircular code interoperability", file: '4.native-and-metacircular.js'},
    {title: "5. Native and metacircular code interoperability 2", file: '5.native-and-metacircular2.js'},
    {title: "6. How eval works with MetaES?", file: '6.example-with-eval.js'},
    {title: "7. Complex environment", file: '7.complex-env.js'},
    {title: "8. Other parameters: error", file: '8.other-parameters-error.js'},
    {title: "9. Other parameters: success", file: '9.other-parameters-success.js'},
    {title: "10. ES7 await support", file: '10.es7-await.js'},
    {title: "11. AngularJS simple application", file: '11.angularjs.js'},
    {title: "12. React simple application", file: '12.react.js'},
    {title: "13. Drawing on canvas", file: '13.canvas-slow-mode.js'},
    {title: "14. Custom evaluation values", file: '14.custom-evaluation-values.js'},
    {title: "15. Interpreter VM information", file: '15.vm-information.js'}
  ],
  lastExample = localStorage.getItem('lastExample');

function runApp() {
  if (!didRun) {

    var examplesElement = <HTMLOptionElement>document.querySelector('#examples');

    function onExampleChanged() {
      loadFile(examplesElement.value);
    }

    examplesElement.addEventListener('change', onExampleChanged);

    examples.forEach(({title,file}) => {
      var option = document.createElement('option');
      option.textContent = title;
      option.value = file;
      examplesElement.appendChild(option);
    });

    var editor:Editor.MetaesEditor = <any>document.querySelector('#editor');
    var bootstrap:Editor.MetaesEditor = <any>document.querySelector('#bootstrap');

    function fixCss(dropdown) {
      dropdown.shadowRoot.querySelector('.dropdown-component').style.position = 'relative';
    }

    var output = <HTMLTextAreaElement>document.querySelector('#output');

    var variables:MetaesCompletions.MetaesCompletionsElement = <any>document.querySelector('#variables');
    variables.shouldSort = false;

    var callstack:MetaesCompletions.MetaesCompletionsElement = <any>document.querySelector('#callstack');
    [variables, callstack].forEach(fixCss);

    var
      evaluator = new EditorEvaluator(editor),
      logsCounter = 0,
      console = {
        log(...args) {
          window.console.log(...arguments);
          output.value = output.value + (logsCounter++) + ". " + Array.prototype.join.call(arguments, " ") + '\n';
          output.scrollTop = output.scrollHeight
        }
      },
      variablesAndCallStackInterceptor = (e:EvaluationSystem2.ASTNode, val, env)=> {
        var variablesSum = [], callstackSum:EvaluationSystem2.ASTNode[] = [];
        do {
          callstackSum.push(e);
          variablesSum.push(...ObjectUtils.extractKeysAndValuesAsCompletions(env.names));
          env = env.prev;
        } while (env);

        variables.values = variablesSum;
        callstack.values = callstackSum.map((e, i, array) => {
          if (i === array.length - 1) {
            return {
              type: "",
              name: "global",
              value: ""
            }
          } else {
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
      var
        args,
        metaes = {
          evaluate() {
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
      ObjectUtils.httpGet('data/presentation/' + path).then((response)=> {
        if (path) {
          localStorage.setItem('lastExample', path);
        }
        bootstrap.off('change', onBootstrapChange);
        execute(...response.split("///\n"));
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
