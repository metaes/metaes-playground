/// <reference path="./evaluation-system2.ts" />

interface Mode {
  (params?:any):void;
}

class EditorEvaluator {
  private editor:Editor.MetaesEditor;
  private editorEvents:EvaluationSystem2.EditorEvents;
  private lastBestNode:EvaluationSystem2.ASTNode;
  private lastGrammar:Object;

  private modesStack:{mode:Mode, params:Object}[] = [];

  modes:{[name:string]: Mode} = {
    Idle: () => {
      this.setEditorListener({
        changeListener: () => {
        },
        cursorActivityListener: () => {
          this.highlightNodeUnderTheCursor();
        },
        keydownListener: (editor, event:KeyboardEvent) => {
          this.handleKeysForCompletion(event);
        }
      })
    },

    EvaluateExpression: () => {
      var
        bestNode = this.findBestMatchingASTNodeInExecutedNodes(),
        newEnv = bestNode.env,
        range = bestNode.range,
        wholeProgram = this.editor.getValue(),
        parentNodeWrapper = ObjectUtils.parentNodeOf(bestNode, this.evaluator.ast),
        parentNode = parentNodeWrapper.node;

      this.setEditorListener({
        changeListener: () => {
          var
            editedAreaMarker:any = this.editor.getMarkersByName('editedCode')[0].find(),
            editedText = this.editor.getRange(editedAreaMarker.from, editedAreaMarker.to);

          this.evaluator.evaluate(editedText, newEnv)
            .then((result:EvaluationSystem2.SuccessValue) => {
              if (parentNode.type === 'FunctionDeclaration') {
                parentNode.lastValue.metaFunction.e.body = result.ast;
              }
            })
            .catch((result:EvaluationSystem2.ErrorValue) => console.log('error', result.error, result.errorType));
        },
        cursorActivityListener: () => {
          this.highlightNodeUnderTheCursor();
        },
        keydownListener: (editor, event:KeyboardEvent) => {
          if (event.keyCode === 27) {
            event.preventDefault();

            this.editor.clearMarkers('disabledCode');
            this.editor.clearMarkers('editedCode');
            this.startMode('Idle');
          }
        }
      });
      this.editor.markTextByRanges('disabledCode', [[0, range[0]], [range[1], wholeProgram.length]]);
      this.editor.markTextByRange('editedCode', [range[0], range[1]]);
    },

    EvaluateEditor: () => {
      this.setEditorListener({
        changeListener: () => {
          this.evaluator.executedNodes.length = 0;
          this.evaluator.evaluate(this.editor.getValue())
            .then((result:EvaluationSystem2.SuccessValue) => {
              this.editor.log();
            })
            .catch((result:EvaluationSystem2.ErrorValue) => {
              this.editor.log(result.error || result.errorType);
            });
        },
        cursorActivityListener: () => {
          this.highlightNodeUnderTheCursor();
        },
        keydownListener: (editor, event:KeyboardEvent) => {
          let init = (extractor, offset = 0) => {
            var completionsComponent = this.editor.completionsComponent;
            this.startMode("Complete", {extractor, offset});
            this.editor.updateCompletionsPosition();
            completionsComponent.setFilterText(null);
            completionsComponent.setValues(extractor());
            completionsComponent.show();
          };
          this.handleKeysForCompletion(event);
        }
      });
    },

    Complete: ({completions, diff = 0}) => {
      var start = this.editor.getCurrentCursorIndex() + diff, stop;
      var completionsComponent = this.editor.completionsComponent;

      var onCompletionSelected = (e?) => {
        completionsComponent.removeEventListener('selectedCompletion', onCompletionSelected);
        this.completionSelectedHandler(e, start, stop);
        this.stopLastMode();
        this.evaluate();
      };

      completionsComponent.addEventListener('selectedCompletion', onCompletionSelected);
      completionsComponent.setValues(completions);
      completionsComponent.setFilterText("");
      completionsComponent.show();
      this.editor.updateCompletionsPosition();

      this.setEditorListener({
        changeListener: () => {
          var now = this.editor.getCurrentCursorIndex();
          var filter = this.editor.getValue().substring(start, stop = now);
          completionsComponent.filterText = filter;
        },
        cursorActivityListener: () => {
          var now = this.editor.getCurrentCursorIndex();
          if (now < start || now > stop) {
            onCompletionSelected();
            completionsComponent.hide();
            return;
          }
        },
        keydownListener: (editor, event:KeyboardEvent) => {
          switch (event.keyCode) {
            case 32: // ctrl + space
              if (event.ctrlKey) {
                event.preventDefault();
                completionsComponent.hide();
                this.startMode('EvaluateExpression');
              }
              return;
            default:
              completionsComponent.keyPressed(event);
              break;
          }
        }
      });
    },

    CompleteStructurally: (grammar) => {
      this.lastGrammar = grammar;

      var start = this.editor.getCurrentCursorIndex(), stop;
      var completionsComponent = this.editor.completionsComponent;

      var onCompletionSelected = (e?) => {
        completionsComponent.removeEventListener('selectedCompletion', onCompletionSelected);
        this.completionSelectedHandler(e, start, stop);
        this.stopLastMode();
      };
      completionsComponent.addEventListener('selectedCompletion', onCompletionSelected);
      completionsComponent.setValues(StructuralCompletions.getHints(grammar, ""));
      completionsComponent.show();

      this.setEditorListener({
        changeListener: () => {
          var now = this.editor.getCurrentCursorIndex();
          var filter = this.editor.getValue().substring(start, stop = now);
          completionsComponent.setFilterText(filter);
          this.editor.updateCompletionsPosition();
        },
        cursorActivityListener: () => {
          var now = this.editor.getCurrentCursorIndex();
          if (now < start || now > stop) {
            onCompletionSelected();
            completionsComponent.hide();
          }
        },
        keydownListener: (editor, event:KeyboardEvent) => {
          completionsComponent.keyPressed(event);
        }
      });
    }
  };

  private evaluator:EvaluationSystem2.Evaluator;

  constructor(editor:Editor.MetaesEditor) {
    this.editor = editor;
    this.editorEvents = new EvaluationSystem2.EditorEvents(this.editor);
    this.evaluator = new EvaluationSystem2.Evaluator(this.markEvaluated.bind(this));
    this.startMode('EvaluateEditor');

    var completions = ObjectUtils.extractCompletions(window);
    this.editor.completionsComponent.setValues(completions);
  }

  handleKeysForCompletion(event) {
    switch (event.keyCode) {
      case 32: // ctrl + space
        if (event.ctrlKey) {
          event.preventDefault();
          this.startMode('Complete', {completions: this.getCompletionsByCursor()});
        }
        return;
      case 190: // .
        var node = this.findBestMatchingASTNodeInASTTree(this.evaluator.ast, this.editor.getCurrentCursorIndex());
        if (node) {
          this.startMode('Complete', {
            completions: ObjectUtils.extractCompletions(node.lastValue),
            diff: 1
          });
        }
        return;
    }
  }

  getCompletionsByCursor() {
    var
      node = this.findBestMatchingASTNodeInASTTree(this.evaluator.ast, this.editor.getCurrentCursorIndex()),
      env = ObjectUtils.findHighestEnv(node || this.evaluator.ast);

    return ObjectUtils.extractKeysAndValuesAsCompletionsFromEnv(env);
  }

  setAdditionalMetaESConfigAndInterceptors(config:EvaluationSystem2.EvaluationCallSignature,
                                           interceptors:EvaluationSystem2.Interceptor[]) {
    this.evaluator.setAdditionalMetaESConfigAndInterceptors(config, interceptors);
  }

  evaluate() {
    this.editorEvents.executeChangeListener();
  }

  startMode(modeName, params?) {
    if (!(modeName in this.modes)) {
      throw new Error(`${modeName} mode doesn't exist.`);
    }
    var mode = this.modes[modeName];
    mode(params || {});

    this.modesStack.push({mode, params});
    if (!this.editor.modesNames) {
      this.editor.modesNames = [];
    }
    this.editor.modesNames.push(modeName);
  }

  stopLastMode(alternativeParams?):Mode {
    var lastMode = this.modesStack.pop();

    this.editor.modesNames.pop();

    // run previous mode if present
    if (this.modesStack.length) {
      var {mode, params}= this.modesStack[this.modesStack.length - 1];
      mode(alternativeParams || params);
    }
    return lastMode.mode;
  }

  completionSelectedHandler(e, start, stop) {
    if (e && e.detail) {
      var value = e.detail.completion;
      var from = this.editor.posFromIndex(start), to = this.editor.posFromIndex(stop);
      this.editor.codeMirror.getDoc().replaceRange(value, from, to);
      this.editor.completionsComponent.hide();
    }
  }

  setEditorListener(listener:EvaluationSystem2.EditorEventsListener) {
    this.editorEvents.setListener(listener);
  }

  highlightNodeUnderTheCursor() {
    var bestNode = this.lastBestNode = this.findBestMatchingASTNodeInExecutedNodes();
    if (bestNode) {
      this.editor.markTextDefault(bestNode.range);
      this.editor.updateTooltip(bestNode);
      console.log(bestNode.type, bestNode.lastValue);
    }
  }

  markEvaluated(e:EvaluationSystem2.ASTNode, val:any, env:EvaluationSystem2.Env) {
    if (e.range) {
      var marker = this.editor.markTextByNode("evaluatedCode", e);
      setTimeout(() => marker.clear(), 200);
    }
  }

  findBestMatchingASTNodeInExecutedNodes(cursorIndexOffset?):EvaluationSystem2.ASTNode {
    var
      bestAstNode,
      charIndex =
        this.editor.getCurrentCursorIndex() +
        (typeof cursorIndexOffset === "undefined" ? 0 : cursorIndexOffset),
      diff = Number.MAX_VALUE;

    this.evaluator.executedNodes.forEach(node => {
      if (node.range && charIndex >= node.range[0] && charIndex <= node.range[1]) {
        var thisDiff = node.range[1] - node.range[0];
        if (thisDiff < diff) {
          bestAstNode = node;
          diff = thisDiff;
        }
      }
    });
    return bestAstNode;
  }

  findBestMatchingASTNodeInASTTree(ast, charIndex) {
    var bestAstNode = null;

    function find(ast) {
      if (Array.isArray(ast)) {
        ast.forEach(find);
      } else if (typeof ast === "object") {
        if ('range' in ast &&
          charIndex >= ast.range[0] &&
          charIndex <= ast.range[1]) {

          if (!bestAstNode) {
            bestAstNode = ast;
          } else if (ast.range[0] >= bestAstNode.range[0] || ast.range[1] <= bestAstNode.range[1]) {
            bestAstNode = ast;
          }
          // maybe inside there is a better match?
          Object.keys(ast)
            .map((key) => ast[key])
            .filter(ObjectUtils.identity)
            .forEach(find);
        }
      }
    }

    find(ast);
    return bestAstNode;
  }
}
