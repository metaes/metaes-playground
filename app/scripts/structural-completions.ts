/**
 * Created by Bartek on 03.07.15.
 */

module StructuralCompletions {
  export function getHints(grammar, filterText:string, tokenName = 'Program') {

    var results = [], visited = [];

    function templateMath(token) {
      return 'template' in grammar[token] && grammar[token].template.some(template=>template.indexOf(filterText) >= 0)
    }

    function iter(token:string) {
      if (visited.indexOf(token) >= 0) {
        return;
      }
      visited.push(token);

      if (templateMath(token) || token.indexOf(filterText) >= 0) {
        grammar[token].template.forEach(template=> {
          results.push({type: token, name: template});
        });
      }
      var productions = grammar[token].productions;
      Object.keys(productions).forEach(productionName => {
        Object.keys(productions[productionName]).forEach(key => {
          let token = productions[productionName][key];
          if (token) {
            iter(token);
          }
        });
      });
    }

    iter(tokenName);

    return results;
  }
}
