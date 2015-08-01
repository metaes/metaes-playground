/// <reference path="../../scripts/object-utils.ts" />

module MetaesCompletions {

  interface CustomEvent extends Event {
    detail: any;
    constructor(type:string, detail:any);
  }
  declare var CustomEvent:{
    prototype: CustomEvent;
    new(type:string, detail:any): CustomEvent;
  };

  export interface CompletionRow {
    name:string;
    value?:string;
    type?:string;
  }

  interface CompletionElement extends CompletionRow {
    renderName:{pre:string, found:string, post:string};
    name:string;
  }

  function highlightSearch(filterText, value) {
    if (filterText) {
      var index = value.toLowerCase().indexOf(filterText.toLowerCase());
      if (index >= 0) {
        return {
          pre: value.substring(0, index),
          found: value.substring(index, index + filterText.length),
          post: value.substring(index + filterText.length, value.length)
        };
      }
    }
    return {pre: value};
  }

  function tryToFilter(filterText, value) {
    if (!filterText) {
      return true;
    }
    var index = value.name.toLowerCase().indexOf(filterText.toLowerCase());
    return index >= 0;
  }

  export class MetaesCompletionsElement extends ObjectUtils.PolymerElement {

    values;
    renderedValues;
    selectedElement;
    selectedElementIndex:number;
    filterText:string;

    or(a, b) {
      return a || b;
    }

    printPreSafe(value) {
      if (value.renderName) {
        return value.renderName.pre;
      } else {
        return value.name;
      }
    }

    ready() {
      this.values = [];
      this.setFilterText("");
    }

    renderValues(values, filterText) {
      if (Array.isArray(values)) {
        var
          tryToFilterThoseElements = tryToFilter.bind(null, filterText),
          maybeHighlightText = highlightSearch.bind(null, filterText);

        values = values
          .filter(tryToFilterThoseElements)
          .sort(function (a, b) {
            return a.name.length - b.name.length;
          });

        values.forEach(function (element:CompletionElement) {
          element.renderName = maybeHighlightText(element.name);
          return element;
        });

        this.renderedValues = values;
        this.selectElement(0);
        return values;
      }
    }

    setValues(values:CompletionRow[]) {
      this.values = values;
    }

    setFilterText(value) {
      this.filterText = value || "";
    }

    selectElement(index) {
      if (this.selectedElement) {
        delete this.selectedElement.selected;
      }
      if (index < 0) {
        index = this.renderedValues.length - 1;
      }
      if (index >= this.renderedValues.length) {
        index = 0;
      }
      this.selectedElementIndex = index;
      this.selectedElement = this.renderedValues[index];
      this.selectedElement.selected = 'selected';
    }

    hide() {
      this.style.display = 'none';
      this.dispatchCompleted();
    }

    dispatchCompleted() {
      var customEvent = new CustomEvent("selectedCompletion", {});
      this.dispatchEvent(customEvent);
    }

    show() {
      this.style.display = '';
    }

    isShown() {
      return this.style.display === '';
    }

    keyPressed(event) {
      if (!this.isShown() || !this.values.length) {
        return;
      }
      switch (event.keyCode) {
        case 27: // esc
          this.hide();
          break;
        case 38: // up
          event.preventDefault();
          this.selectElement(this.selectedElementIndex - 1);
          break;
        case 40: // down
          event.preventDefault();
          this.selectElement(this.selectedElementIndex + 1);
          break;
        case 13: // enter
          if (this.isShown() && this.selectedElement && this.values.length) {
            event.preventDefault();
            var customEvent = new CustomEvent("selectedCompletion", {
                "detail": {
                  "completion": this.selectedElement.name ||
                  this.selectedElement.renderName.pre +
                  this.selectedElement.renderName.found +
                  this.selectedElement.renderName.post
                }
              }
            );
            this.dispatchEvent(customEvent);
          }
          break;
      }
    }
  }
}
