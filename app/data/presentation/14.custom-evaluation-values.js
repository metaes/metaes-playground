// weekdays will be capitalized using interceptor logic
// and pause/resume capabilities of the VM
var weekdays = ['monday', 'tuesday', 'Wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
console.log(weekdays);

var money = ['1USD', '2USD', '1.23USD', '-0.23USD'];

// here you can see an example
// of initial support for lambda expression in ES6
console.log(money.reduce((a, b) => {

  // `a` and `b` are our currency values handled by interceptor
  console.log("intermediate values: ", a, ",", b);
  return a + b;
}));
///
function interceptor(e, value, env, pause) {
  // capitalize week days
  if (e.type === 'Literal' && typeof e.value === 'string') {
    pause()(e.value.charAt(0).toUpperCase() + e.value.substr(1));
  }

  function isUSD(value) {
    return typeof value === 'string' && value.indexOf('USD') >= 0;
  }

  // fix USD addition
  if (e.type === 'BinaryExpression' && value && isUSD(value[1]) && isUSD(value[2])) {
    pause()(parseFloat(value[1]) + parseFloat(value[2]) + "USD");
  }
}
metaes.evaluate(sourceInEditor, {
    x: 1,
    console: console,
    JSON: JSON
  },
  {interceptor: interceptor});
