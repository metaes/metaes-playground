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
    var EditorEventsBinder = (function () {
        function EditorEventsBinder(editor) {
            this.editor = editor;
        }
        EditorEventsBinder.prototype.executeChangeListener = function () {
            if (this.lastListener) {
                this.lastListener.changeListener();
            }
        };
        EditorEventsBinder.prototype.setListener = function (listener) {
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
        return EditorEventsBinder;
    })();
    var EditorEvaluator = (function () {
        function EditorEvaluator(editor) {
            this.editor = editor;
            this.evaluator = new Evaluator(this.markEvaluated.bind(this));
            this.editorEventsBinder = new EditorEventsBinder(this.editor);
            this.listenToWholeEditor();
            var completions = ObjectUtils.extractCompletions(window);
            this.editor.completionsComponent.setValues(completions);
        }
        EditorEvaluator.prototype.setAdditionalMetaESConfigAndInterceptors = function (config, interceptors) {
            this.evaluator.setAdditionalMetaESConfigAndInterceptors(config, interceptors);
        };
        EditorEvaluator.prototype.evaluate = function () {
            this.editorEventsBinder.executeChangeListener();
        };
        EditorEvaluator.prototype.startIdleMode = function () {
            var _this = this;
            this.editorEventsBinder.setListener({
                changeListener: function () {
                },
                cursorActivityListener: function () {
                    _this.highlightNodeUnderTheCursor();
                },
                keydownListener: function (editor, event) {
                    switch (event.keyCode) {
                        case 32:
                            if (event.ctrlKey) {
                                event.preventDefault();
                                _this.startStructuralCompletion(_this.lastGrammar);
                            }
                            return;
                    }
                }
            });
        };
        EditorEvaluator.prototype.listenToWholeEditor = function () {
            var _this = this;
            this.editorEventsBinder.setListener({
                changeListener: function () {
                    _this.evaluator.executedNodes.length = 0;
                    _this.evaluator.evaluate(_this.editor.getValue())
                        .then(function (result) {
                        _this.editor.log();
                    })
                        .catch(function (result) {
                        _this.editor.log(result.error || result.errorType);
                    });
                },
                cursorActivityListener: function () {
                    _this.highlightNodeUnderTheCursor();
                },
                keydownListener: function (editor, event) {
                    var init = function (extractor, offset) {
                        if (offset === void 0) { offset = 0; }
                        var coords = _this.editor.codeMirror.cursorCoords(_this.editor.getCurrentCursorIndex(), 'local'), completionsComponent = _this.editor.completionsComponent;
                        _this.startCompletionMode(extractor, offset);
                        _this.editor.updateCompletionsPosition();
                        completionsComponent.setFilterText(null);
                        completionsComponent.setValues(extractor());
                        completionsComponent.show();
                    };
                    switch (event.keyCode) {
                        case 32:
                            if (event.ctrlKey) {
                                event.preventDefault();
                                var node = _this.findBestMatchingASTNodeInASTTree(_this.evaluator.ast, _this.editor.getCurrentCursorIndex()), env = ObjectUtils.findHighestEnv(node || _this.evaluator.ast);
                                init(function () { return ObjectUtils.extractKeysAndValuesAsCompletionsFromEnv(env); });
                            }
                            return;
                        case 190:
                            var node = _this.findBestMatchingASTNodeInASTTree(_this.evaluator.ast, _this.editor.getCurrentCursorIndex());
                            if (_this.lastBestNode) {
                                init(function () { return ObjectUtils.extractCompletions(node.lastValue || _this.lastBestNode.lastValue); }, 1);
                            }
                            return;
                    }
                }
            });
        };
        EditorEvaluator.prototype.completionSelectedHandler = function (e, start, stop) {
            if (e && e.detail) {
                var value = e.detail.completion;
                var from = this.editor.posFromIndex(start), to = this.editor.posFromIndex(stop);
                this.editor.codeMirror.getDoc().replaceRange(value, from, to);
                this.editor.completionsComponent.hide();
            }
        };
        EditorEvaluator.prototype.setMode = function (listener) {
            this.editorEventsBinder.setListener(listener);
        };
        EditorEvaluator.prototype.startStructuralCompletion = function (grammar) {
            var _this = this;
            this.lastGrammar = grammar;
            var start = this.editor.getCurrentCursorIndex(), stop;
            var onCompletionSelected = function (e) {
                _this.editor.completionsComponent.removeEventListener('selectedCompletion', onCompletionSelected);
                _this.completionSelectedHandler(e, start, stop);
                // repeat forever
                _this.startIdleMode();
            };
            this.editor.completionsComponent.addEventListener('selectedCompletion', onCompletionSelected);
            this.setMode({
                changeListener: function () {
                    var now = _this.editor.getCurrentCursorIndex();
                    var filter = _this.editor.getValue().substring(start, stop = now);
                    var completionsComponent = _this.editor.completionsComponent;
                    completionsComponent.setFilterText(filter);
                    completionsComponent.setValues(StructuralCompletions.getHints(grammar, filter));
                    completionsComponent.show();
                    _this.editor.updateCompletionsPosition();
                },
                cursorActivityListener: function () {
                    // TODO: DRY
                    var now = _this.editor.getCurrentCursorIndex();
                    if (now < start || now > stop) {
                        onCompletionSelected();
                        _this.editor.completionsComponent.hide();
                        return;
                    }
                },
                keydownListener: function (editor, event) {
                    _this.editor.completionsComponent.keyPressed(event);
                }
            });
        };
        EditorEvaluator.prototype.startCompletionMode = function (extractor, diff) {
            var _this = this;
            if (diff === void 0) { diff = 0; }
            var start = this.editor.getCurrentCursorIndex() + diff, stop;
            var onCompletionSelected = function (e) {
                _this.editor.completionsComponent.removeEventListener('selectedCompletion', onCompletionSelected);
                _this.completionSelectedHandler(e, start, stop);
                _this.listenToWholeEditor();
                _this.evaluate();
            };
            this.editor.completionsComponent.addEventListener('selectedCompletion', onCompletionSelected);
            this.setMode({
                changeListener: function () {
                    var now = _this.editor.getCurrentCursorIndex();
                    var filter = _this.editor.getValue().substring(start, stop = now);
                    _this.editor.completionsComponent.filterText = filter;
                    _this.editor.completionsComponent.setValues(extractor());
                },
                cursorActivityListener: function () {
                    var now = _this.editor.getCurrentCursorIndex();
                    if (now < start || now > stop) {
                        onCompletionSelected();
                        _this.editor.completionsComponent.hide();
                        return;
                    }
                },
                keydownListener: function (editor, event) {
                    _this.editor.completionsComponent.keyPressed(event);
                }
            });
        };
        EditorEvaluator.prototype.startSubEvaluation = function () {
            var _this = this;
            var bestNode = this.findBestMatchingASTNodeInExecutedNodes(), range = bestNode.range, wholeProgram = this.editor.getValue(), parentNodeWrapper = ObjectUtils.parentNodeOf(bestNode, this.evaluator.ast), parentNodeKey = parentNodeWrapper.key, parentNode = parentNodeWrapper.node, lastGlobalAst = this.evaluator.ast;
            // listen to part
            this.setMode({
                changeListener: function () {
                    _this.evaluator.executedNodes.length = 0;
                    var edited = _this.editor.getMarkersByName('editedCode')[0].find(), editedText = _this.editor.getRange(edited.from, edited.to);
                    _this.evaluator.evaluate(editedText, bestNode.env)
                        .then(function (result) {
                        if (parentNode.type === 'FunctionDeclaration') {
                            parentNode.lastValue.metaFunction.e.body = result.ast;
                        }
                    })
                        .catch(function (result) { return console.log('error', result.error, result.errorType); });
                },
                cursorActivityListener: function () {
                    _this.highlightNodeUnderTheCursor();
                },
                keydownListener: function (editor, event) {
                    if (event.keyCode === 27) {
                        event.preventDefault();
                        _this.editor.clearMarkers('disabledCode');
                        _this.editor.clearMarkers('editedCode');
                        _this.listenToWholeEditor();
                    }
                }
            });
            this.editor.markTextByRanges('disabledCode', [[0, range[0]], [range[1], wholeProgram.length]]);
            this.editor.markTextByRange('editedCode', [range[0], range[1]]);
        };
        EditorEvaluator.prototype.highlightNodeUnderTheCursor = function () {
            var bestNode = this.lastBestNode = this.findBestMatchingASTNodeInExecutedNodes();
            if (bestNode) {
                this.editor.markTextDefault(bestNode.range);
                this.editor.updateTooltip(bestNode);
                console.log(bestNode.type, bestNode.lastValue);
            }
        };
        EditorEvaluator.prototype.markEvaluated = function (e, val, env) {
            if (e.range) {
                var marker = this.editor.markTextByNode("evaluatedCode", e);
                setTimeout(function () { return marker.clear(); }, 200);
            }
        };
        EditorEvaluator.prototype.findBestMatchingASTNodeInExecutedNodes = function (cursorIndexOffset) {
            var bestAstNode, charIndex = this.editor.getCurrentCursorIndex() +
                (typeof cursorIndexOffset === "undefined" ? 0 : cursorIndexOffset), diff = Number.MAX_VALUE;
            this.evaluator.executedNodes.forEach(function (node) {
                if (node.range && charIndex >= node.range[0] && charIndex <= node.range[1]) {
                    var thisDiff = node.range[1] - node.range[0];
                    if (thisDiff < diff) {
                        bestAstNode = node;
                        diff = thisDiff;
                    }
                }
            });
            return bestAstNode;
        };
        EditorEvaluator.prototype.findBestMatchingASTNodeInASTTree = function (ast, charIndex) {
            var bestAstNode = null;
            function find(ast) {
                if (Array.isArray(ast)) {
                    ast.forEach(find);
                }
                else if (typeof ast === "object") {
                    if ('range' in ast &&
                        charIndex >= ast.range[0] &&
                        charIndex <= ast.range[1]) {
                        if (!bestAstNode) {
                            bestAstNode = ast;
                        }
                        else if (ast.range[0] >= bestAstNode.range[0] || ast.range[1] <= bestAstNode.range[1]) {
                            bestAstNode = ast;
                        }
                        // maybe inside there is a better match?
                        Object.keys(ast)
                            .map(function (key) { return ast[key]; })
                            .filter(ObjectUtils.identity)
                            .forEach(find);
                    }
                }
            }
            find(ast);
            return bestAstNode;
        };
        return EditorEvaluator;
    })();
    EvaluationSystem2.EditorEvaluator = EditorEvaluator;
})(EvaluationSystem2 || (EvaluationSystem2 = {}));
//# sourceMappingURL=evaluation-system2.js.map