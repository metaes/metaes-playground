/// <reference path="../../typings/es6-promise/es6-promise.d.ts" />
/// <reference path="../elements/metaes-completions/metaes-completions.ts" />
/// <reference path="./evaluation-system2.ts" />
declare
var originalEsprima;

module ObjectUtils {

  export class PolymerElement {
    $:any;
    style:any;

    fire(eventname:string, payload?:any) {
    }

    dispatchEvent(event:Event) {
    }

    addEventListener(eventName:string, handler:(e:CustomEvent) => void) {
    }

    removeEventListener(eventName:string, handler:(e:CustomEvent) => void) {
    }
  }

  export function and(...args:Function[]) {
    var fns = [].slice.call(arguments);

    return function () {
      var args = arguments;
      fns.forEach(function (fn) {
        fn.apply(null, args);
      });
    };
  }

  export function keyValueLooksLikeAnASTNode(astNode, key) {
    var value = astNode[key];
    return key !== 'range' && value && (Array.isArray(value) ||
      (typeof value === 'object' && 'type' in value));
  }

  export function identity(x) {
    return x;
  }

  export function shortened(value) {
    if (value === null) {
      return 'null';
    }
    if (value === undefined) {
      return 'undefined';
    }
    var maxLength = 100;
    value = value.toString().split('\n')[0];
    if (value.length > maxLength) {
      value = value.substring(0, maxLength) + "...";
    }
    return value;
  }

  export function getValuePropertyNames(val) {
    var
      acc = [],
      pro = val;
    while (pro) {
      try {
        if (typeof pro !== "string") {
          acc = acc.concat(Object.getOwnPropertyNames(pro));
        }
        pro = Object.getPrototypeOf(pro);
      } catch (e) {
        var list = [];
        if (typeof pro === 'number') {
          list = Object.getOwnPropertyNames(Number.prototype);
        } else if (typeof pro === 'string') {
          list = Object.getOwnPropertyNames(String.prototype);
        } else if (Array.isArray(val)) {
          list = val;
        }
        acc = acc.concat(list);
        pro = null;
      }
    }
    return acc;
  }

  export function toRow(object, key):MetaesCompletions.CompletionRow {
    try {
      return {
        type: typeof object[key],
        name: key,
        value: shortened(typeof object[key] !== 'undefined' && object[key] !== null ?
          object[key] : object[key]),
        realValue: object[key]
      }
    } catch (e) {
      console.log(e);
      return {
        name: key,
      };
    }
  }

  export function extractKeysAndValuesAsCompletions(object) {
    return Object.keys(object).map(toRow.bind(null, object));
  }

  export function extractKeysAndValuesAsCompletionsFromEnv(env:EvaluationSystem2.Env) {
    var variablesSum = [];
    var existingNames = {};
    do {
      // don't add to completion list statically hidden variables from outer scopes
      var completions = extractCompletions(env.names);
      variablesSum.push(...completions.filter(completion=>!(completion.name in existingNames)));
      for (var completion of completions) {
        existingNames[completion.name] = 1;
      }
      env = env.prev;
    } while (env);
    return variablesSum;
  }

  export function findHighestEnv(ast:EvaluationSystem2.ASTNode):EvaluationSystem2.Env {
    var env;
    walkAst(ast, (node)=> {
      if (node.env) {
        env = node.env;
      }
    });
    return env;
  }

  export function extractCompletions(object):MetaesCompletions.CompletionRow[] {
    return <any>getValuePropertyNames(object).map(toRow.bind(null, object));
  }

  export function findIdentifier(ast:EvaluationSystem2.ASTNode):EvaluationSystem2.ASTNode {
    if (!ast) {
      return null;
    }
    var result;
    walkAst(ast, (node) => {
      if (node.type === 'Identifier') {
        result = node;
      }
    });
    return result;
  }

  export function envOf(node) {
    var
      env = node.env,
      obj = {};
    do {
      getValuePropertyNames(env.names)
        .forEach(function (key) {
          if (!(key in obj)) {
            obj[key] = env.names[key];
          }
        });
      env = env.prev;
    } while (env);

    return obj;
  }

  export function walkAst(ast, visitor:(node:EvaluationSystem2.ASTNode)=>void) {

    function walkAstInner(ast) {
      if (Array.isArray(ast)) {
        ast.forEach((childAst) => {
          walkAstInner(childAst);
        });
      } else {
        visitor(ast);
        if (typeof ast === 'object') {
          Object.keys(ast)
            .filter(keyValueLooksLikeAnASTNode.bind(null, ast))
            .forEach((childAstKey) => {
              walkAstInner(ast[childAstKey]);
            });
        }
      }
    }

    walkAstInner(ast);
  }

  export function parentNodeOf(astNode, lastAst):{key:string; node:any} {
    var node, returnKey;

    function walk(ast, parent, key, index?) {

      if (Array.isArray(ast)) {
        ast.forEach((childAst, index) => {
          walk(childAst, parent, key, index);
        });
      } else {
        if (ast === astNode) {
          returnKey = key;
          return node = parent;
        }
        if (typeof ast === 'object') {
          Object.keys(ast)
            .filter(keyValueLooksLikeAnASTNode.bind(null, ast))
            .forEach((childAstKey) => {
              walk(ast[childAstKey], ast, childAstKey);
            });
        }
      }
    }

    walk(lastAst, null, null);
    return {node: node, key: returnKey};
  }

  export function parse(source) {
    var parseConfig = {
      loc: true,
      range: true
    };
    return originalEsprima.parse(source, parseConfig);
  }

  export function httpGet(filePath):Promise<string> {
    return new Promise(function (resolve) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", filePath);
      xhr.send();
      xhr.onload = function () {
        resolve(xhr.responseText);
      }
    });
  }
}
