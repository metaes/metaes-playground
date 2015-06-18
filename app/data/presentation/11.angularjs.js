// This example shows that MetaES is intended to run any JavaScript code.

// let's load AngularJS and wait till it's loaded
var script = document.createElement('script');
script.src = 'https://ajax.googleapis.com/ajax/libs/angularjs/1.3.15/angular.js';
script.onload = start;
document.body.appendChild(script);

function start() {
  var ngApp = angular.module('exampleApp', []);
  ngApp.directive('clicker', function () {
    return {
      template: '<button ng-click="sayHello()">Hello world!</button>',
      controller: function ($scope) {
        var iterator = 0;

        // this function will be highlighted
        // everytime you click on the button in `Canvas`
        $scope.sayHello = function () {
          alert("Hello!" + iterator++);
        }
      }
    };
  });

  var canvas = document.querySelector('#canvas');
  canvas.innerHTML = '<div id="angular-app"><clicker></clicker></div>';
  angular.bootstrap(document.querySelector('#angular-app'), ['exampleApp']);
}
///
function interceptor(e, val, env) {
  //console.log('[' + e.type + ']', e.subProgram, String(val));
}
metaes.evaluate(sourceInEditor, window, {interceptor: interceptor});


