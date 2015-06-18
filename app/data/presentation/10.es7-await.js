// watch `for loop` code to see that it's higlighted as await execution
// is being executed subsequent times
var
  results = [], // store results in this array
  textarea = document.createElement('textarea'),
  urls; // list of files to load

function start() {

  for (var i = 0; i < urls.length; i++) {
    var url = "data/presentation/" + urls[i].file;
    console.log('starting download ' + url);

    // here is the crucial part,
    // `await` is actually normal function in native JavaScript,
    // (see `Bootstrap code`)
    // but in MetaES VM it's treated in special way thanks to
    // interceptor.
    var result = await(httpGet(url));
    results.push(result);
    textarea.textContent = url + "\n\n" + result;
    console.log('just downloaded ' + url);
    console.log("loaded", results.length, "results");
  }
}

// create textfield with information about loaded files
var canvas = document.querySelector('#canvas');
canvas.innerHTML = '';
textarea.rows = 20;
textarea.cols = 50;
canvas.appendChild(textarea);

urls = [
  {title: "1. Basic evaluation", file: '1.default.js'},
  {title: "2. Reference error", file: '2.reference-error.js'},
  {title: "3. Line/col or range", file: '3.line-col-range.js'},
  {title: "4. Native and metacircular code interoperability", file: '4.native-and-metacircular.js'},
  {title: "5. Native and metacircular code interoperability 2", file: '5.native-and-metacircular2.js'},
  {title: "6. How eval works with MetaES?", file: '6.example-with-eval.js'},
  {title: "7. Complex environment", file: '7.complex-env.js'},
  {title: "8. Other parameters: error", file: '8.other-parameters-error.js'},
  {title: "9. Other parameters: success", file: '9.other-parameters-success.js'},
  {title: "10. ES7 await support", file: '10.es7-await.js'},
  {title: "11. AngularJS simple application", file: '11.angularjs.js'},
  {title: "12. React simple application", file: '12.react.js'},
  {title: "13. Drawing on canvas", file: '13.canvas-slow-mode.js'},
  {title: "14. Custom evaluation values", file: '14.custom-evaluation-values.js'},
  {title: "15. Interpreter VM information", file: '15.vm-information.js'}
];
start();
///
function await(promise) {
  // logic will be handled by VM
}

// normal JavaScript function
function httpGet(filePath) {
  return new Promise(function (success, reject) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
      if (xhr.status === 200) {
        success(xhr.responseText);
      } else {
        reject("File not found!");
      }
    };
    xhr.open("GET", filePath);
    xhr.send();
  })
}
function interceptor(e, value, env, pause) {
  if (e.type === "CallExpression" && value && value.callee === await) {

    var
    // pause is a function that returns another function,
    // that is a continuation, "resumes" execution with given value.
      resume = pause(),

    // arguments[0] contains promise object passed to the await as argument.
    // We are in the VM now and we can decide what to do next with it.
      promise = value.arguments[0];

    // let's wait a bit...
    setTimeout(
      function () {

        // resume is called with a values.
        // Here we could add try/catch to handle errors etc,
        // but it's not needed in the example.
        promise.then(resume);
      },
      // simulate network latency
      Math.random() * 1000);
  }
}
var env = {
  console: console,
  await: await,
  httpGet: httpGet,
  document: document
};

metaes.evaluate(sourceInEditor, env, {interceptor: interceptor});


