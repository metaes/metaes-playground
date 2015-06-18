var script = document.createElement('script');
script.src = 'https://fb.me/react-0.13.3.js';
script.onload = start;
document.body.appendChild(script);

function start() {

  var TodoList = React.createClass({
    displayName: "TodoList",
    render: function () {
      var createItem = function (itemText, index) {
        return React.createElement("li", {key: index + itemText}, itemText);
      };
      return React.createElement("ul", null, this.props.items.map(createItem));
    }
  });
  var TodoApp = React.createClass({
    displayName: "TodoApp",
    getInitialState: function () {
      return {items: [], text: ''};
    },
    // this function will be called and highlighted
    // every time text in textfield is changed
    onChange: function (e) {
      this.setState({text: e.target.value});
    },
    // Click on `Add #X` button to see execution of this function.
    handleSubmit: function (e) {
      e.preventDefault();
      var nextItems = this.state.items.concat([this.state.text]);
      var nextText = '';
      this.setState({items: nextItems, text: nextText});
    },
    // `render` is called every time `onChange` happens.
    // Highlighting happens here as well
    render: function () {
      return (
        React.createElement("div", null,
          React.createElement("h3", null, "TODO"),
          React.createElement(TodoList, {items: this.state.items}),
          React.createElement("form", {onSubmit: this.handleSubmit},
            React.createElement("input", {onChange: this.onChange, value: this.state.text}),
            React.createElement("button", null, 'Add #' + (this.state.items.length + 1))
          )
        )
      );
    }
  });

  React.render(React.createElement(TodoApp, null), document.querySelector('#canvas'));
}
///
function interceptor(e, val, env) {
  //console.log('[' + e.type + ']', e.subProgram, String(val));
}
metaes.evaluate(sourceInEditor, window, {interceptor: interceptor});


