/// <reference path="../../scripts/object-utils.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var MetaesCompletions;
(function (MetaesCompletions) {
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
        return { pre: value };
    }
    function tryToFilter(filterText, value) {
        if (!filterText) {
            return true;
        }
        var index = value.name.toLowerCase().indexOf(filterText.toLowerCase());
        return index >= 0;
    }
    var MetaesCompletionsElement = (function (_super) {
        __extends(MetaesCompletionsElement, _super);
        function MetaesCompletionsElement() {
            _super.apply(this, arguments);
        }
        MetaesCompletionsElement.prototype.or = function (a, b) {
            return a || b;
        };
        MetaesCompletionsElement.prototype.printPreSafe = function (value) {
            if (value.renderName) {
                return value.renderName.pre;
            }
            else {
                return value.name;
            }
        };
        MetaesCompletionsElement.prototype.ready = function () {
            this.values = [];
            this.setFilterText("");
        };
        MetaesCompletionsElement.prototype.renderValues = function (values, filterText) {
            if (Array.isArray(values)) {
                var tryToFilterThoseElements = tryToFilter.bind(null, filterText), maybeHighlightText = highlightSearch.bind(null, filterText);
                values = values
                    .filter(tryToFilterThoseElements)
                    .sort(function (a, b) {
                    return a.name.length - b.name.length;
                });
                values.forEach(function (element) {
                    element.renderName = maybeHighlightText(element.name);
                    return element;
                });
                if (this.values.length) {
                    this.selectElement(0);
                    // redraw
                    var left = parseInt(this.style.left, 10);
                    this.style.left = left + 1 + 'px';
                    this.style.left = left + 'px';
                }
                return values;
            }
        };
        MetaesCompletionsElement.prototype.setValues = function (values) {
            this.values = values;
        };
        MetaesCompletionsElement.prototype.setFilterText = function (value) {
            this.filterText = value || "";
        };
        MetaesCompletionsElement.prototype.selectElement = function (index) {
            if (this.selectedElement) {
                delete this.selectedElement.selected;
            }
            if (index < 0) {
                index = this.values.length - 1;
            }
            if (index >= this.values.length) {
                index = 0;
            }
            this.selectedElementIndex = index;
            this.selectedElement = this.values[index];
            this.selectedElement.selected = 'selected';
        };
        MetaesCompletionsElement.prototype.hide = function () {
            this.style.display = 'none';
            this.dispatchCompleted();
        };
        MetaesCompletionsElement.prototype.dispatchCompleted = function () {
            var customEvent = new CustomEvent("selectedCompletion", {});
            this.dispatchEvent(customEvent);
        };
        MetaesCompletionsElement.prototype.show = function () {
            this.style.display = '';
        };
        MetaesCompletionsElement.prototype.isShown = function () {
            return this.style.display === '';
        };
        MetaesCompletionsElement.prototype.keyPressed = function (event) {
            if (!this.isShown() || !this.values.length) {
                return;
            }
            switch (event.keyCode) {
                case 27:
                    this.hide();
                    break;
                case 38:
                    event.preventDefault();
                    this.selectElement(this.selectedElementIndex - 1);
                    break;
                case 40:
                    event.preventDefault();
                    this.selectElement(this.selectedElementIndex + 1);
                    break;
                case 13:
                    if (this.isShown() && this.selectedElement && this.values.length) {
                        event.preventDefault();
                        var customEvent = new CustomEvent("selectedCompletion", {
                            "detail": {
                                "completion": this.selectedElement.name ||
                                    this.selectedElement.renderName.pre +
                                        this.selectedElement.renderName.found +
                                        this.selectedElement.renderName.post
                            }
                        });
                        this.dispatchEvent(customEvent);
                    }
                    break;
            }
        };
        return MetaesCompletionsElement;
    })(ObjectUtils.PolymerElement);
    MetaesCompletions.MetaesCompletionsElement = MetaesCompletionsElement;
})(MetaesCompletions || (MetaesCompletions = {}));
//# sourceMappingURL=metaes-completions.js.map