# MetaES Playground

This is a playground for MetaES interpreter. MetaES is a metacircular interpreter of JavaScript language written in JavaScript at EcmaScript 5.1 standard. Learn more about the [MetaES](https://github.com/metaes/metaes) project.

Playground allows to run JavaScript in MetaES interpreter and watch live results in its user interface.

Playground is written using [Polymer Project](https://www.polymer-project.org) and [TypeScript](http://www.typescriptlang.org/).
Currently recommended browser is Google Chrome. 
    
# Features

Although MetaES Playground is currently in early alpha state, it has a number of features:
   * On change evaluation - the code is re-evaluated everytime is changed
   * Code completion of variables and members. Press `ctrl+space` to see completions of variables. Press `.` after any `Identifier` to see its members. Highly experimental.
   
   <img src="https://raw.githubusercontent.com/metaes/metaes-playground/master/app/docs-assets/completion.gif?token=AMG8Xx0hRYSnUf-ef2YGtqn1PHEHH13tks5VjFHmwA%3D%3D" style="width: 700px;"/>
    
   * Error notification - red text below the editor. It can be both syntax error (static) or error from JavaScript execution (dynamic).
    
   <img src="https://raw.githubusercontent.com/metaes/metaes-playground/master/app/docs-assets/error.png?token=AMG8X7KTFOlj60BGaeyWiedIonvHr1HKks5VjFFYwA%3D%3D" style="width: 500px;"/>
   
   * Highlighting of just evaluated code with light green
   
   <img src="https://raw.githubusercontent.com/metaes/metaes-playground/master/app/docs-assets/highlighting.gif?token=AMG8X5OfyavXSs9vbPCGO4ufx7d1Xf6qks5VjFFpwA%3D%3D" style="width: 300px;"/>
   
   * Variables list display - variables in currently evaluated scope and all parent scopes
   
   <img src="https://raw.githubusercontent.com/metaes/metaes-playground/master/app/docs-assets/variables.png?token=AMG8X-5U7YxAUwIdR5Tv-A9SV135xa6vks5VjFF5wA%3D%3D" style="width: 500px;"/>
   
   * Callstack display - currently evaluated functions list
   
   <img src="https://raw.githubusercontent.com/metaes/metaes-playground/master/app/docs-assets/callstack.png?token=AMG8X9lP7H_tiJWb2E6NO79aUOnZfcF0ks5VjFAXwA%3D%3D" style="width: 500px;"/>
   
   * Display current token value below the editor, if evaluated before. Highlight token under the cursor in light blue.
   
   <img src="https://raw.githubusercontent.com/metaes/metaes-playground/master/app/docs-assets/values.png?token=AMG8X9F3kCGKNemAbG3OYNIgnlTF2tjUks5VjFGrwA%3D%3D" style="width: 500px;"/>
   
   * Output - mimic default `window.console.log`, but `log` everything to original `console` as well
   
   <img src="https://raw.githubusercontent.com/metaes/metaes-playground/master/app/docs-assets/output.png?token=AMG8Xw69DzEcfdgXp0Zo4mIAJqz2QzAfks5VjFHHwA%3D%3D" style="width: 500px;"/>
   
   * Canvas - small `div` element that for visual output
   
   <img src="https://raw.githubusercontent.com/metaes/metaes-playground/master/app/docs-assets/canvas.png?token=AMG8Xy_-HrrNOev7pv6eCtZPooTVIp7tks5VjFHVwA%3D%3D" style="width: 500px;"/>
   
   * `metaes.evaluate` patching - create special `metaes` object that intercepts call to original `metaes.evaluate`. It allows playground to see configuration for MetaES and hook its own interceptors. Slows down execution quite significantly.


## Installation 

Clone the repo and then:

    npm install && bower install

## Starting dev mode

    grunt serve
  
Browser should be automatically opened at http://localhost:9000/
  
## Building 

    grunt build
  
And then the build artifact is located in `./dist`.

## Types installation

To install types for example for `codemirror`, type in your cmd:

    ./node_modules/tsd/build/cli.js query codemirror --action install
    
## Contribute

 * You can report [issues and bugs](https://github.com/metaes/metaes-playground/issues).
 * Help with implementation of new features using [pull requests](https://github.com/metaes/metaes-playground/pulls).
    
## License

    The MIT License (MIT)
    
    Copyright (c) 2015 Bartosz Krupa
    
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:
    
    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.
