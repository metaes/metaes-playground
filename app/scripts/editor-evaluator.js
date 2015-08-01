/// <reference path="./evaluation-system2.ts" />
var EditorEvaluator = (function () {
    function EditorEvaluator(editor) {
        var _this = this;
        this.modesStack = [];
        this.modes = {
            Idle: function () {
                _this.setEditorListener({
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
                                    _this.startMode('Complete', { completions: _this.getCompletionsByCursor() });
                                }
                                return;
                        }
                    }
                });
            },
            EvaluateExpression: function () {
                var bestNode = _this.findBestMatchingASTNodeInExecutedNodes(), newEnv = bestNode.env, range = bestNode.range, wholeProgram = _this.editor.getValue(), parentNodeWrapper = ObjectUtils.parentNodeOf(bestNode, _this.evaluator.ast), parentNode = parentNodeWrapper.node;
                _this.setEditorListener({
                    changeListener: function () {
                        var editedAreaMarker = _this.editor.getMarkersByName('editedCode')[0].find(), editedText = _this.editor.getRange(editedAreaMarker.from, editedAreaMarker.to);
                        _this.evaluator.evaluate(editedText, newEnv)
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
                            _this.startMode('Idle');
                        }
                    }
                });
                _this.editor.markTextByRanges('disabledCode', [[0, range[0]], [range[1], wholeProgram.length]]);
                _this.editor.markTextByRange('editedCode', [range[0], range[1]]);
            },
            EvaluateEditor: function () {
                _this.setEditorListener({
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
                            var completionsComponent = _this.editor.completionsComponent;
                            _this.startMode("Complete", { extractor: extractor, offset: offset });
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
            },
            Complete: function (_a) {
                var completions = _a.completions, _b = _a.diff, diff = _b === void 0 ? 0 : _b;
                var start = _this.editor.getCurrentCursorIndex() + diff, stop;
                var completionsComponent = _this.editor.completionsComponent;
                var onCompletionSelected = function (e) {
                    completionsComponent.removeEventListener('selectedCompletion', onCompletionSelected);
                    _this.completionSelectedHandler(e, start, stop);
                    _this.startMode('EvaluateEditor');
                    _this.evaluate();
                };
                completionsComponent.addEventListener('selectedCompletion', onCompletionSelected);
                completionsComponent.setValues(completions);
                completionsComponent.setFilterText("");
                completionsComponent.show();
                _this.editor.updateCompletionsPosition();
                _this.setEditorListener({
                    changeListener: function () {
                        var now = _this.editor.getCurrentCursorIndex();
                        var filter = _this.editor.getValue().substring(start, stop = now);
                        completionsComponent.filterText = filter;
                    },
                    cursorActivityListener: function () {
                        var now = _this.editor.getCurrentCursorIndex();
                        if (now < start || now > stop) {
                            onCompletionSelected();
                            completionsComponent.hide();
                            return;
                        }
                    },
                    keydownListener: function (editor, event) {
                        completionsComponent.keyPressed(event);
                    }
                });
            },
            CompleteStructurally: function (grammar) {
                _this.lastGrammar = grammar;
                var start = _this.editor.getCurrentCursorIndex(), stop;
                var completionsComponent = _this.editor.completionsComponent;
                var onCompletionSelected = function (e) {
                    completionsComponent.removeEventListener('selectedCompletion', onCompletionSelected);
                    _this.completionSelectedHandler(e, start, stop);
                    _this.stopLastMode();
                };
                completionsComponent.addEventListener('selectedCompletion', onCompletionSelected);
                completionsComponent.setValues(StructuralCompletions.getHints(grammar, ""));
                completionsComponent.show();
                _this.setEditorListener({
                    changeListener: function () {
                        var now = _this.editor.getCurrentCursorIndex();
                        var filter = _this.editor.getValue().substring(start, stop = now);
                        completionsComponent.setFilterText(filter);
                        _this.editor.updateCompletionsPosition();
                    },
                    cursorActivityListener: function () {
                        var now = _this.editor.getCurrentCursorIndex();
                        if (now < start || now > stop) {
                            onCompletionSelected();
                            completionsComponent.hide();
                        }
                    },
                    keydownListener: function (editor, event) {
                        completionsComponent.keyPressed(event);
                    }
                });
            }
        };
        this.editor = editor;
        this.editorEvents = new EvaluationSystem2.EditorEvents(this.editor);
        this.evaluator = new EvaluationSystem2.Evaluator(this.markEvaluated.bind(this));
        this.startMode('EvaluateEditor');
        var completions = ObjectUtils.extractCompletions(window);
        this.editor.completionsComponent.setValues(completions);
    }
    EditorEvaluator.prototype.getCompletionsByCursor = function () {
        var node = this.findBestMatchingASTNodeInASTTree(this.evaluator.ast, this.editor.getCurrentCursorIndex()), env = ObjectUtils.findHighestEnv(node || this.evaluator.ast);
        return ObjectUtils.extractKeysAndValuesAsCompletionsFromEnv(env);
    };
    EditorEvaluator.prototype.setAdditionalMetaESConfigAndInterceptors = function (config, interceptors) {
        this.evaluator.setAdditionalMetaESConfigAndInterceptors(config, interceptors);
    };
    EditorEvaluator.prototype.evaluate = function () {
        this.editorEvents.executeChangeListener();
    };
    EditorEvaluator.prototype.startMode = function (modeName, params) {
        if (!(modeName in this.modes)) {
            throw new Error(modeName + " mode doesn't exist.");
        }
        var mode = this.modes[modeName];
        mode(params || {});
        this.modesStack.push({ mode: mode, params: params });
        if (!this.editor.modesNames) {
            this.editor.modesNames = [];
        }
        this.editor.modesNames.push(modeName);
    };
    EditorEvaluator.prototype.stopLastMode = function (alternativeParams) {
        var lastMode = this.modesStack.pop();
        this.editor.modesNames.pop();
        // run previous mode if present
        if (this.modesStack.length) {
            var _a = this.modesStack[this.modesStack.length - 1], mode = _a.mode, params = _a.params;
            mode(alternativeParams || params);
        }
        return lastMode.mode;
    };
    EditorEvaluator.prototype.completionSelectedHandler = function (e, start, stop) {
        if (e && e.detail) {
            var value = e.detail.completion;
            var from = this.editor.posFromIndex(start), to = this.editor.posFromIndex(stop);
            this.editor.codeMirror.getDoc().replaceRange(value, from, to);
            this.editor.completionsComponent.hide();
        }
    };
    EditorEvaluator.prototype.setEditorListener = function (listener) {
        this.editorEvents.setListener(listener);
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
//# sourceMappingURL=editor-evaluator.js.map