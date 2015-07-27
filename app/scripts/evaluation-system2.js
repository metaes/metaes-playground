/// <reference path="../elements/metaes-editor/metaes-editor.ts" />
/// <reference path="../../typings/es6-promise/es6-promise.d.ts" />
/// <reference path="./structural-completions.ts" />
var EvaluationSystem2;
(function (EvaluationSystem2) {
    var ASTNode = (function () {
        function ASTNode() {
        }
        return ASTNode;
    })();
    EvaluationSystem2.ASTNode = ASTNode;
    var Env = (function () {
        function Env() {
        }
        return Env;
    })();
    EvaluationSystem2.Env = Env;
    function createTopEnvFromObject(object) {
        return { prev: null, names: object };
    }
    var defaultEnv = createTopEnvFromObject(window);
    var Evaluator = (function () {
        function Evaluator(interceptor) {
            this.executedNodes = [];
            this.evaluationConfig = [, , , , ,];
            this.interceptors = [];
            this.interceptors = [interceptor];
        }
        Evaluator.prototype.applyInterceptor = function (e, val, env, pause) {
            if (this.executedNodes.indexOf(e) === -1) {
                this.executedNodes.push(e);
            }
            e.env = env;
            e.lastValue = val;
            if (val && typeof val === "object" && val.toString() === "[object Arguments]") {
                e.lastValue = val[0];
            }
            this.interceptors.forEach(function (interceptor) { return interceptor(e, val, env, pause); });
        };
        Evaluator.prototype.setAdditionalMetaESConfigAndInterceptors = function (config, interceptors) {
            if (config) {
                this.evaluationConfig = config;
            }
            // [hacky] remove previously added interceptors if still present
            this.interceptors.length = 1;
            // and add the new ones
            (_a = this.interceptors).push.apply(_a, interceptors);
            var _a;
        };
        Evaluator.prototype.evaluate = function (source, env) {
            var _this = this;
            return new Promise(function (success, error) {
                var config = {
                    interceptor: _this.applyInterceptor.bind(_this)
                }, evalSuccess = function (ast, value) {
                    _this.ast = ast;
                    success({ ast: ast, value: value });
                }, evalError = function (ast, errorType, errorValue) {
                    if (ast) {
                        _this.ast = ast;
                    }
                    error({ ast: ast, errorType: errorType, error: errorValue });
                };
                metaes.evaluate(source, _this.evaluationConfig[1] || env || defaultEnv, config, evalSuccess, evalError);
            });
        };
        return Evaluator;
    })();
    EvaluationSystem2.Evaluator = Evaluator;
    var EditorEvents = (function () {
        function EditorEvents(editor) {
            this.editor = editor;
        }
        EditorEvents.prototype.executeChangeListener = function () {
            if (this.lastListener) {
                this.lastListener.changeListener();
            }
        };
        EditorEvents.prototype.setListener = function (listener) {
            if (this.lastListener) {
                this.editor.off('change', this.lastListener.changeListener);
                this.editor.off('cursorActivity', this.lastListener.cursorActivityListener);
                this.editor.off('keydown', this.lastListener.keydownListener);
            }
            this.editor.on('change', listener.changeListener);
            this.editor.on('cursorActivity', listener.cursorActivityListener);
            this.editor.on('keydown', listener.keydownListener);
            this.lastListener = listener;
        };
        return EditorEvents;
    })();
    EvaluationSystem2.EditorEvents = EditorEvents;
})(EvaluationSystem2 || (EvaluationSystem2 = {}));
//# sourceMappingURL=evaluation-system2.js.map