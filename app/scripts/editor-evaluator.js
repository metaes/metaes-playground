/// <reference path="./evaluation-system2.ts" />
var EditorEvaluator = (function () {
    function EditorEvaluator(editor) {
        var _this = this;
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
                                    _this.startMode('CompleteStructurally', _this.lastGrammar);
                                }
                                return;
                        }
                    }
                });
            },
            EvaluateExpression: function () {
                var bestNode = _this.findBestMatchingASTNodeInExecutedNodes(), range = bestNode.range, wholeProgram = _this.editor.getValue(), parentNodeWrapper = ObjectUtils.parentNodeOf(bestNode, _this.evaluator.ast), parentNodeKey = parentNodeWrapper.key, parentNode = parentNodeWrapper.node, lastGlobalAst = _this.evaluator.ast;
                _this.setEditorListener({
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
                            _this.startMode('EvaluateEditor');
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
                var extractor = _a.extractor, _b = _a.diff, diff = _b === void 0 ? 0 : _b;
                var start = _this.editor.getCurrentCursorIndex() + diff, stop;
                var onCompletionSelected = function (e) {
                    _this.editor.completionsComponent.removeEventListener('selectedCompletion', onCompletionSelected);
                    _this.completionSelectedHandler(e, start, stop);
                    _this.startMode('EvaluateEditor');
                    _this.evaluate();
                };
                _this.editor.completionsComponent.addEventListener('selectedCompletion', onCompletionSelected);
                _this.setEditorListener({
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
            },
            CompleteStructurally: function (grammar) {
                _this.lastGrammar = grammar;
                var start = _this.editor.getCurrentCursorIndex(), stop;
                var onCompletionSelected = function (e) {
                    _this.editor.completionsComponent.removeEventListener('selectedCompletion', onCompletionSelected);
                    _this.completionSelectedHandler(e, start, stop);
                    // repeat forever
                    _this.startMode('Idle');
                };
                _this.editor.completionsComponent.addEventListener('selectedCompletion', onCompletionSelected);
                _this.setEditorListener({
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
            }
        };
        this.editor = editor;
        this.editorEvents = new EvaluationSystem2.EditorEvents(this.editor);
        this.evaluator = new EvaluationSystem2.Evaluator(this.markEvaluated.bind(this));
        this.startMode('EvaluateEditor');
        var completions = ObjectUtils.extractCompletions(window);
        this.editor.completionsComponent.setValues(completions);
    }
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
        this.modes[modeName](params);
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