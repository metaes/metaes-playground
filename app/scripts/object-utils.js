/// <reference path="../../typings/es6-promise/es6-promise.d.ts" />
/// <reference path="../elements/metaes-completions/metaes-completions.ts" />
/// <reference path="./evaluation-system2.ts" />
var ObjectUtils;
(function (ObjectUtils) {
    var PolymerElement = (function () {
        function PolymerElement() {
        }
        PolymerElement.prototype.fire = function (eventname, payload) {
        };
        PolymerElement.prototype.dispatchEvent = function (event) {
        };
        PolymerElement.prototype.addEventListener = function (eventName, handler) {
        };
        PolymerElement.prototype.removeEventListener = function (eventName, handler) {
        };
        return PolymerElement;
    })();
    ObjectUtils.PolymerElement = PolymerElement;
    function and() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var fns = [].slice.call(arguments);
        return function () {
            var args = arguments;
            fns.forEach(function (fn) {
                fn.apply(null, args);
            });
        };
    }
    ObjectUtils.and = and;
    function keyValueLooksLikeAnASTNode(astNode, key) {
        var value = astNode[key];
        return key !== 'range' && value && (Array.isArray(value) ||
            (typeof value === 'object' && 'type' in value));
    }
    ObjectUtils.keyValueLooksLikeAnASTNode = keyValueLooksLikeAnASTNode;
    function identity(x) {
        return x;
    }
    ObjectUtils.identity = identity;
    function shortened(value) {
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
    ObjectUtils.shortened = shortened;
    function getValuePropertyNames(val) {
        var acc = [], pro = val;
        while (pro) {
            try {
                if (typeof pro !== "string") {
                    acc = acc.concat(Object.getOwnPropertyNames(pro));
                }
                pro = Object.getPrototypeOf(pro);
            }
            catch (e) {
                var list = [];
                if (typeof pro === 'number') {
                    list = Object.getOwnPropertyNames(Number.prototype);
                }
                else if (typeof pro === 'string') {
                    list = Object.getOwnPropertyNames(String.prototype);
                }
                else if (Array.isArray(val)) {
                    list = val;
                }
                acc = acc.concat(list);
                pro = null;
            }
        }
        return acc;
    }
    ObjectUtils.getValuePropertyNames = getValuePropertyNames;
    function toRow(object, key) {
        try {
            return {
                type: typeof object[key],
                name: key,
                value: shortened(typeof object[key] !== 'undefined' && object[key] !== null ?
                    object[key] : object[key]),
                realValue: object[key]
            };
        }
        catch (e) {
            console.log(e);
            return {
                name: key
            };
        }
    }
    ObjectUtils.toRow = toRow;
    function extractKeysAndValuesAsCompletions(object) {
        return Object.keys(object).map(toRow.bind(null, object));
    }
    ObjectUtils.extractKeysAndValuesAsCompletions = extractKeysAndValuesAsCompletions;
    function extractKeysAndValuesAsCompletionsFromEnv(env) {
        var variablesSum = [];
        var existingNames = {};
        do {
            // don't add to completion list statically hidden variables from outer scopes
            var completions = extractCompletions(env.names);
            variablesSum.push.apply(variablesSum, completions.filter(function (completion) { return !(completion.name in existingNames); }));
            for (var _i = 0; _i < completions.length; _i++) {
                var completion = completions[_i];
                existingNames[completion.name] = 1;
            }
            env = env.prev;
        } while (env);
        return variablesSum;
    }
    ObjectUtils.extractKeysAndValuesAsCompletionsFromEnv = extractKeysAndValuesAsCompletionsFromEnv;
    function findHighestEnv(ast) {
        var env;
        walkAst(ast, function (node) {
            if (node.env) {
                env = node.env;
            }
        });
        return env;
    }
    ObjectUtils.findHighestEnv = findHighestEnv;
    function extractCompletions(object) {
        return getValuePropertyNames(object).map(toRow.bind(null, object));
    }
    ObjectUtils.extractCompletions = extractCompletions;
    function findIdentifier(ast) {
        if (!ast) {
            return null;
        }
        var result;
        walkAst(ast, function (node) {
            if (node.type === 'Identifier') {
                result = node;
            }
        });
        return result;
    }
    ObjectUtils.findIdentifier = findIdentifier;
    function envOf(node) {
        var env = node.env, obj = {};
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
    ObjectUtils.envOf = envOf;
    function walkAst(ast, visitor) {
        function walkAstInner(ast) {
            if (Array.isArray(ast)) {
                ast.forEach(function (childAst) {
                    walkAstInner(childAst);
                });
            }
            else {
                visitor(ast);
                if (typeof ast === 'object') {
                    Object.keys(ast)
                        .filter(keyValueLooksLikeAnASTNode.bind(null, ast))
                        .forEach(function (childAstKey) {
                        walkAstInner(ast[childAstKey]);
                    });
                }
            }
        }
        walkAstInner(ast);
    }
    ObjectUtils.walkAst = walkAst;
    function parentNodeOf(astNode, lastAst) {
        var node, returnKey;
        function walk(ast, parent, key, index) {
            if (Array.isArray(ast)) {
                ast.forEach(function (childAst, index) {
                    walk(childAst, parent, key, index);
                });
            }
            else {
                if (ast === astNode) {
                    returnKey = key;
                    return node = parent;
                }
                if (typeof ast === 'object') {
                    Object.keys(ast)
                        .filter(keyValueLooksLikeAnASTNode.bind(null, ast))
                        .forEach(function (childAstKey) {
                        walk(ast[childAstKey], ast, childAstKey);
                    });
                }
            }
        }
        walk(lastAst, null, null);
        return { node: node, key: returnKey };
    }
    ObjectUtils.parentNodeOf = parentNodeOf;
    function parse(source) {
        var parseConfig = {
            loc: true,
            range: true
        };
        return originalEsprima.parse(source, parseConfig);
    }
    ObjectUtils.parse = parse;
    function httpGet(filePath) {
        return new Promise(function (resolve) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", filePath);
            xhr.send();
            xhr.onload = function () {
                resolve(xhr.responseText);
            };
        });
    }
    ObjectUtils.httpGet = httpGet;
})(ObjectUtils || (ObjectUtils = {}));
//# sourceMappingURL=object-utils.js.map