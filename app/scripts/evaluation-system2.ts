/// <reference path="../elements/metaes-editor/metaes-editor.ts" />
/// <reference path="../../typings/es6-promise/es6-promise.d.ts" />
/// <reference path="./structural-completions.ts" />

module EvaluationSystem2 {

  interface RowCol {
    line: string, column:string;
  }
  export class ASTNode {
    type:string;
    range:[number, number];
    loc:{start: RowCol, end: RowCol};
    env:Env;
    lastValue:any;
    subProgram:string;
  }

  export class Env {
    prev:Env;
    names:{ [key: string]: any }
  }

  interface SuccessCallback {
    (ast:ASTNode, value:any): void;
  }

  interface SuccessValue {
    ast: ASTNode;
    value: any;
  }

  interface ErrorCallback {
    (ast:ASTNode, errorType:String, error:Error): void;
  }

  interface ErrorValue {
    ast: ASTNode;
    errorType: String;
    error: Error;
  }

  interface Interceptor {
    (e:ASTNode, val:any, env:Env, pause:()=>void):void;
  }

  interface EvaluationConfig {
    interceptor: Interceptor;
    name?: string
  }

  type EvaluationCallSignature = [string, Env, EvaluationConfig, SuccessCallback, ErrorCallback];

  interface Evaluate {
    (source:String, env:Env, cfg?:EvaluationConfig, success?:SuccessCallback, error?:ErrorCallback): any;
  }

  declare var metaes:{
    evaluate: Evaluate;
    parse: (source:String) => ASTNode;
  };

  function createTopEnvFromObject(object):Env {
    return {prev: null, names: object};
  }

  var defaultEnv:Env = createTopEnvFromObject(window);

  export class Evaluator {
    public executedNodes:ASTNode[] = [];
    public ast:ASTNode;
    private evaluationConfig:EvaluationCallSignature = [, , , , ,];

    interceptors:Interceptor[] = [];

    constructor(interceptor:Interceptor) {
      this.interceptors = [interceptor];
    }

    applyInterceptor(e:ASTNode, val:any, env:Env, pause) {
      if (this.executedNodes.indexOf(e) === -1) {
        this.executedNodes.push(e);
      }
      e.env = env;
      e.lastValue = val;
      if (val && typeof val === "object" && val.toString() === "[object Arguments]") {
        e.lastValue = val[0];
      }
      this.interceptors.forEach(interceptor => interceptor(e, val, env, pause));
    }

    setAdditionalMetaESConfigAndInterceptors(config:EvaluationCallSignature, interceptors:Interceptor[]) {
      if (config) {
        this.evaluationConfig = config;
      }

      // [hacky] remove previously added interceptors if still present
      this.interceptors.length = 1;

      // and add the new ones
      this.interceptors.push(...interceptors);
    }

    evaluate(source, env?:Env):Promise<SuccessValue | ErrorValue> {
      return new Promise((success:(val:SuccessValue) => void, error:(val:ErrorValue) => void) => {
        var
          config = {
            interceptor: this.applyInterceptor.bind(this)
          },
          evalSuccess = (ast:ASTNode, value:any) => {
            this.ast = ast;
            success({ast: ast, value: value});
          },
          evalError = (ast:ASTNode, errorType:String, errorValue:Error) => {
            if (ast) {
              this.ast = ast;
            }
            error({ast: ast, errorType: errorType, error: errorValue});
          };

        metaes.evaluate(source, this.evaluationConfig[1] || env || defaultEnv, config, evalSuccess, evalError);
      });
    }
  }

  interface EditorEventListener {
    changeListener();
    cursorActivityListener();
    keydownListener(editor, event:KeyboardEvent);
  }

  class EditorEventsBinder {
    editor:Editor.MetaesEditor;
    private lastListener:EditorEventListener;

    constructor(editor:Editor.MetaesEditor) {
      this.editor = editor;
    }

    executeChangeListener() {
      if (this.lastListener) {
        this.lastListener.changeListener();
      }
    }

    setListener(listener:EditorEventListener) {
      if (this.lastListener) {
        this.editor.off('change', this.lastListener.changeListener);
        this.editor.off('cursorActivity', this.lastListener.cursorActivityListener);
        this.editor.off('keydown', this.lastListener.keydownListener);
      }
      this.editor.on('change', listener.changeListener);
      this.editor.on('cursorActivity', listener.cursorActivityListener);
      this.editor.on('keydown', listener.keydownListener);
      this.lastListener = listener;
    }
  }

  export class EditorEvaluator {
    private editor:Editor.MetaesEditor;
    private evaluator:Evaluator;
    private editorEventsBinder:EditorEventsBinder;
    private lastBestNode:ASTNode;
    private lastGrammar:Object;

    constructor(editor:Editor.MetaesEditor) {
      this.editor = editor;
      this.evaluator = new Evaluator(this.markEvaluated.bind(this));
      this.editorEventsBinder = new EditorEventsBinder(this.editor);

      this.listenToWholeEditor();

      var completions = ObjectUtils.extractCompletions(window);
      this.editor.completionsComponent.setValues(completions);
    }

    setAdditionalMetaESConfigAndInterceptors(config:EvaluationCallSignature, interceptors:Interceptor[]) {
      this.evaluator.setAdditionalMetaESConfigAndInterceptors(config, interceptors);
    }

    evaluate() {
      this.editorEventsBinder.executeChangeListener();
    }

    startIdleMode() {
      this.editorEventsBinder.setListener({
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
      this.editorEventsBinder.setListener({
        changeListener: () => {
          this.evaluator.executedNodes.length = 0;
          this.evaluator.evaluate(this.editor.getValue())
            .then((result:SuccessValue) => {
              this.editor.log();
            })
            .catch((result:ErrorValue) => {
              this.editor.log(result.error || result.errorType);
            });
        },
        cursorActivityListener: () => {
          this.highlightNodeUnderTheCursor();
        },
        keydownListener: (editor, event:KeyboardEvent) => {
          let init = (extractor, offset = 0)=> {
            var
              coords = this.editor.codeMirror.cursorCoords(this.editor.getCurrentCursorIndex(), 'local'),
              completionsComponent = this.editor.completionsComponent;
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

    startStructuralCompletion(grammar) {
      this.lastGrammar = grammar;

      var start = this.editor.getCurrentCursorIndex(), stop;

      // TODO: DRY
      var onCompletionSelected = (e?) => {
        this.editor.completionsComponent.removeEventListener('selectedCompletion', onCompletionSelected);
        if (e && e.detail) {
          var value = e.detail.completion;
          var from = this.editor.posFromIndex(start), to = this.editor.posFromIndex(stop);
          this.editor.codeMirror.getDoc().replaceRange(value, from, to);
          this.editor.completionsComponent.hide();

          // repeat forever
          this.startIdleMode();
        }
      };
      this.editor.completionsComponent.addEventListener('selectedCompletion', onCompletionSelected);

      this.editorEventsBinder.setListener({
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
        if (e && e.detail) {
          var value = e.detail.completion;
          var from = this.editor.posFromIndex(start), to = this.editor.posFromIndex(stop);
          this.editor.codeMirror.getDoc().replaceRange(value, from, to);
          this.editor.completionsComponent.hide();
        }
        this.listenToWholeEditor();
        this.evaluate();
      };
      this.editor.completionsComponent.addEventListener('selectedCompletion', onCompletionSelected);

      this.editorEventsBinder.setListener({
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
      this.editorEventsBinder.setListener({
        changeListener: () => {
          this.evaluator.executedNodes.length = 0;
          var
            edited:any = this.editor.getMarkersByName('editedCode')[0].find(),
            editedText = this.editor.getRange(edited.from, edited.to);

          this.evaluator.evaluate(editedText, bestNode.env)
            .then((result:SuccessValue) => {
              if (parentNode.type === 'FunctionDeclaration') {
                parentNode.lastValue.metaFunction.e.body = result.ast;
              }
            })
            .catch((result:ErrorValue) => console.log('error', result.error, result.errorType));
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

    markEvaluated(e:ASTNode, val:any, env:Env) {
      if (e.range) {
        var marker = this.editor.markTextByNode("evaluatedCode", e);
        setTimeout(() => marker.clear(), 200);
      }
    }

    findBestMatchingASTNodeInExecutedNodes(cursorIndexOffset?):ASTNode {
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
}
