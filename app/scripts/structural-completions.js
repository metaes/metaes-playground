/**
 * Created by Bartek on 03.07.15.
 */
var StructuralCompletions;
(function (StructuralCompletions) {
    function getHints(grammar, filterText, tokenName) {
        if (tokenName === void 0) { tokenName = 'Program'; }
        var results = [], visited = [];
        function templateMatch(token) {
            return 'template' in grammar[token]
                && grammar[token].template.some(function (template) { return template.indexOf(filterText) >= 0; });
        }
        function iter(tokenName) {
            if (visited.indexOf(tokenName) >= 0) {
                return;
            }
            visited.push(tokenName);
            if (templateMatch(tokenName) || tokenName.indexOf(filterText) >= 0) {
                grammar[tokenName].template.forEach(function (template) {
                    results.push({ type: tokenName, name: template });
                });
            }
            else {
                var productions = grammar[tokenName].productions;
                Object.keys(productions).forEach(function (productionName) {
                    Object.keys(productions[productionName]).forEach(function (key) {
                        var token = productions[productionName][key];
                        if (token) {
                            iter(token);
                        }
                    });
                });
            }
        }
        iter(tokenName);
        return results;
    }
    StructuralCompletions.getHints = getHints;
})(StructuralCompletions || (StructuralCompletions = {}));
//# sourceMappingURL=structural-completions.js.map