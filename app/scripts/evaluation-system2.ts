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

  export interface SuccessCallback {
    (ast:ASTNode, value:any): void;
  }

  export interface SuccessValue {
    ast: ASTNode;
    value: any;
  }

  export interface ErrorCallback {
    (ast:ASTNode, errorType:String, error:Error): void;
  }

  export interface ErrorValue {
    ast: ASTNode;
    errorType: String;
    error: Error;
  }

  export interface Interceptor {
    (e:ASTNode, val:any, env:Env, pause:()=>void):void;
  }

  interface EvaluationConfig {
    interceptor: Interceptor;
    name?: string
  }

  export type EvaluationCallSignature = [string, Env, EvaluationConfig, SuccessCallback, ErrorCallback];

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

  export interface EditorEventsListener {
    changeListener();
    cursorActivityListener();
    keydownListener(editor:Editor.MetaesEditor, event:KeyboardEvent);
  }

  export class EditorEvents {
    editor:Editor.MetaesEditor;
    private lastListener:EditorEventsListener;

    constructor(editor:Editor.MetaesEditor) {
      this.editor = editor;
    }

    executeChangeListener() {
      if (this.lastListener) {
        this.lastListener.changeListener();
      }
    }

    setListener(listener:EditorEventsListener) {
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
}
