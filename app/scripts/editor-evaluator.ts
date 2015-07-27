/// <reference path="./evaluation-system2.ts" />

class EditorEvaluator {
  private editor:Editor.MetaesEditor;
  private editorEvents:EvaluationSystem2.EditorEvents;
  private lastBestNode:EvaluationSystem2.ASTNode;
  private lastGrammar:Object;

  private evaluator:EvaluationSystem2.Evaluator;

  constructor(editor:Editor.MetaesEditor) {
    this.editor = editor;
    this.editorEvents = new EvaluationSystem2.EditorEvents(this.editor);
    this.evaluator = new EvaluationSystem2.Evaluator(this.markEvaluated.bind(this));

    this.listenToWholeEditor();

    var completions = ObjectUtils.extractCompletions(window);
    this.editor.completionsComponent.setValues(completions);
  }

  setAdditionalMetaESConfigAndInterceptors(config:EvaluationSystem2.EvaluationCallSignature,
                                           interceptors:EvaluationSystem2.Interceptor[]) {
    this.evaluator.setAdditionalMetaESConfigAndInterceptors(config, interceptors);
  }

  evaluate() {
    this.editorEvents.executeChangeListener();
  }

  startIdleMode() {
    this.editorEvents.setListener({
      changeListener: () => {
      },
      cursorActivityListener: () => {
        this.highlightNodeUnderTheCursor();
      },
      keydownListener: (editor, event:KeyboardEvent) => {
        switch (event.keyCode) {
          case 32: // ctrl + space
            if (event.ctrlKey) {
              event.preventDefault();
              this.startStructuralCompletion(this.lastGrammar);
            }
            return;
        }
      }
    });
  }

  listenToWholeEditor() {
    this.editorEvents.setListener({
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
        let init = (extractor, offset = 0)=> {
          var completionsComponent = this.editor.completionsComponent;
          this.startCompletionMode(extractor, offset);
          this.editor.updateCompletionsPosition();
          completionsComponent.setFilterText(null);
          completionsComponent.setValues(extractor());
          completionsComponent.show();
        };
        switch (event.keyCode) {
          case 32: // ctrl + space
            if (event.ctrlKey) {
              event.preventDefault();
              var
                node = this.findBestMatchingASTNodeInASTTree(this.evaluator.ast, this.editor.getCurrentCursorIndex()),
                env = ObjectUtils.findHighestEnv(node || this.evaluator.ast);
              init(() => ObjectUtils.extractKeysAndValuesAsCompletionsFromEnv(env))
            }
            return;
          case 190: // .
            var node = this.findBestMatchingASTNodeInASTTree(this.evaluator.ast, this.editor.getCurrentCursorIndex())
            if (this.lastBestNode) {
              init(()=>ObjectUtils.extractCompletions(node.lastValue || this.lastBestNode.lastValue), 1);
            }
            return;
        }
      }
    });
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

  startStructuralCompletion(grammar) {
    this.lastGrammar = grammar;

    var start = this.editor.getCurrentCursorIndex(), stop;

    var onCompletionSelected = (e?) => {
      this.editor.completionsComponent.removeEventListener('selectedCompletion', onCompletionSelected);
      this.completionSelectedHandler(e, start, stop);
      // repeat forever
      this.startIdleMode();
    };
    this.editor.completionsComponent.addEventListener('selectedCompletion', onCompletionSelected);

    this.setEditorListener({
      changeListener: () => {
        var now = this.editor.getCurrentCursorIndex();
        var filter = this.editor.getValue().substring(start, stop = now);
        var completionsComponent = this.editor.completionsComponent;
        completionsComponent.setFilterText(filter);
        completionsComponent.setValues(StructuralCompletions.getHints(grammar, filter));
        completionsComponent.show();
        this.editor.updateCompletionsPosition();
      },
      cursorActivityListener: () => {
        // TODO: DRY
        var now = this.editor.getCurrentCursorIndex();
        if (now < start || now > stop) {
          onCompletionSelected();
          this.editor.completionsComponent.hide();
          return;
        }
      },
      keydownListener: (editor, event:KeyboardEvent) => {
        this.editor.completionsComponent.keyPressed(event);
      }
    });
  }

  startCompletionMode(extractor, diff = 0) {
    var start = this.editor.getCurrentCursorIndex() + diff, stop;

    var onCompletionSelected = (e?) => {
      this.editor.completionsComponent.removeEventListener('selectedCompletion', onCompletionSelected);
      this.completionSelectedHandler(e, start, stop);
      this.listenToWholeEditor();
      this.evaluate();
    };
    this.editor.completionsComponent.addEventListener('selectedCompletion', onCompletionSelected);

    this.setEditorListener({
      changeListener: () => {
        var now = this.editor.getCurrentCursorIndex();
        var filter = this.editor.getValue().substring(start, stop = now);
        this.editor.completionsComponent.filterText = filter;
        this.editor.completionsComponent.setValues(extractor());
      },
      cursorActivityListener: () => {
        var now = this.editor.getCurrentCursorIndex();
        if (now < start || now > stop) {
          onCompletionSelected();
          this.editor.completionsComponent.hide();
          return;
        }
      },
      keydownListener: (editor, event:KeyboardEvent) => {
        this.editor.completionsComponent.keyPressed(event);
      }
    });
  }

  startSubEvaluation() {
    var
      bestNode = this.findBestMatchingASTNodeInExecutedNodes(),
      range = bestNode.range,
      wholeProgram = this.editor.getValue(),
      parentNodeWrapper = ObjectUtils.parentNodeOf(bestNode, this.evaluator.ast),
      parentNodeKey = parentNodeWrapper.key,
      parentNode = parentNodeWrapper.node,
      lastGlobalAst = this.evaluator.ast;

    // listen to part
    this.setEditorListener({
      changeListener: () => {
        this.evaluator.executedNodes.length = 0;
        var
          edited:any = this.editor.getMarkersByName('editedCode')[0].find(),
          editedText = this.editor.getRange(edited.from, edited.to);

        this.evaluator.evaluate(editedText, bestNode.env)
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
          this.listenToWholeEditor();
        }
      }
    });

    this.editor.markTextByRanges('disabledCode', [[0, range[0]], [range[1], wholeProgram.length]]);
    this.editor.markTextByRange('editedCode', [range[0], range[1]]);
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
