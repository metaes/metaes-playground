/**
 * Created by Bartek on 03.07.15.
 */

module StructuralCompletions {
  export function getHints(grammar, filterText:string, tokenName = 'Program') {

    var results = [], visited = [];

    function templateMatch(token) {
      return 'template' in grammar[token]
        && grammar[token].template.some(template => template.indexOf(filterText) >= 0);
    }

    function iter(tokenName:string) {
      if (visited.indexOf(tokenName) >= 0) {
        return;
      }
      visited.push(tokenName);

      if (templateMatch(tokenName) || tokenName.indexOf(filterText) >= 0) {
        grammar[tokenName].template.forEach(template=> {
          results.push({type: tokenName, name: template});
        });
      } else {
        var productions = grammar[tokenName].productions;

        Object.keys(productions).forEach(productionName => {
          Object.keys(productions[productionName]).forEach(key => {
            let token = productions[productionName][key];
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
}
