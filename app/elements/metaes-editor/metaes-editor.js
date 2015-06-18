/// <reference path="../../../typings/codemirror/codemirror.d.ts" />
/// <reference path="../metaes-completions/metaes-completions.ts" />
/// <reference path="../../scripts/evaluation-system2.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Editor;
(function (Editor) {
    var MetaesEditor = (function (_super) {
        __extends(MetaesEditor, _super);
        function MetaesEditor() {
            _super.apply(this, arguments);
            this.height = 500;
        }
        MetaesEditor.prototype.heightChanged = function () {
            var value = this.height || 500;
            this.codeMirror.setSize(null, value - 20);
            this.$.editor.style.height = value - 20 + 'px';
            this.style.height = value + 'px';
        };
        MetaesEditor.prototype.ready = function () {
            this.markersByName = {};
            this.codeMirror = this.$.editor.mirror;
            this.codeMirror.setOption('mode', 'javascript');
            this.codeMirror.focus();
            this.tooltip = this.$.tooltip;
            this.heightChanged();
            this.completionsComponent = this.$.completionsComponent;
        };
        MetaesEditor.prototype.on = function (type, callback) {
            this.codeMirror.on(type, callback);
        };
        MetaesEditor.prototype.off = function (type, callback) {
            this.codeMirror.off(type, callback);
        };
        MetaesEditor.prototype.getCurrentCursorIndex = function () {
            return this.codeMirror.getDoc().indexFromPos(this.codeMirror.getDoc().getCursor());
        };
        MetaesEditor.prototype.markTextDefault = function (range) {
            this.clearMarkers('markedText');
            this.markText('markedText', this.posFromIndex(range[0]), this.posFromIndex(range[1]));
        };
        MetaesEditor.prototype.markText = function (className, start, stop) {
            var markers = (this.markersByName[className] = this.markersByName[className] || []);
            var marker = this.codeMirror.getDoc().markText(start, stop, {
                className: className
            });
            markers.push(marker);
            return marker;
        };
        MetaesEditor.prototype.markTextByNode = function (className, node) {
            var range = node.range;
            return this.markText(className, this.posFromIndex(range[0]), this.posFromIndex(range[1]));
        };
        MetaesEditor.prototype.markTextByRange = function (className, range) {
            this.clearMarkers(className);
            this.markText(className, this.posFromIndex(range[0]), this.posFromIndex(range[1]));
        };
        MetaesEditor.prototype.markTextByRanges = function (className, ranges) {
            var _this = this;
            this.clearMarkers(className);
            ranges.forEach(function (range) {
                _this.markText(className, _this.posFromIndex(range[0]), _this.posFromIndex(range[1]));
            });
        };
        MetaesEditor.prototype.getMarkersByName = function (className) {
            return this.markersByName[className];
        };
        MetaesEditor.prototype.clearMarkers = function (className) {
            var markers = this.markersByName[className];
            if (markers) {
                markers.forEach(function (marker) { return marker.clear(); });
                markers.length = 0;
            }
        };
        MetaesEditor.prototype.posFromIndex = function (index) {
            return this.codeMirror.getDoc().posFromIndex(index);
        };
        MetaesEditor.prototype.getRange = function (from, to) {
            return this.codeMirror.getDoc().getRange(from, to);
        };
        MetaesEditor.prototype.updateCompletionsPosition = function () {
            var coords = this.codeMirror.cursorCoords(false);
            this.completionsComponent.style.left = coords.right + 5 + "px";
            this.completionsComponent.style.top = coords.bottom + 5 + "px";
        };
        MetaesEditor.prototype.showCompletionsComponent = function () {
            this.completionsComponent.show();
        };
        MetaesEditor.prototype.hideCompletionsComponent = function () {
            this.completionsComponent.hide();
        };
        MetaesEditor.prototype.getValue = function () {
            return this.codeMirror.getDoc().getValue();
        };
        MetaesEditor.prototype.setValue = function (value) {
            return this.codeMirror.getDoc().setValue(value);
        };
        MetaesEditor.prototype.setCompletionFilterAndValues = function (filter, valuesObject) {
            this.showCompletionsComponent();
            this.completionsComponent.setFilterText(filter);
            this.completionsComponent.setValues(ObjectUtils.extractCompletions(valuesObject));
        };
        MetaesEditor.prototype.logHelper = function (arg) {
            this.$.error.innerHTML = arg;
        };
        MetaesEditor.prototype.decorate = function (arg) {
            return "<span class='single-value'>" + arg + "</span>";
        };
        MetaesEditor.prototype.log = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            if (arguments.length) {
                this.logHelper([].slice.call(arguments).map(this.decorate).join(" "));
            }
            else {
                this.logHelper('');
            }
        };
        MetaesEditor.prototype.clearLog = function () {
            this.log();
        };
        MetaesEditor.prototype.updateTooltip = function (bestNode) {
            var value;
            value = bestNode.lastValue;
            this.tooltip.type = bestNode.type;
            this.tooltip.value = value;
        };
        return MetaesEditor;
    })(ObjectUtils.PolymerElement);
    Editor.MetaesEditor = MetaesEditor;
})(Editor || (Editor = {}));
//# sourceMappingURL=metaes-editor.js.map