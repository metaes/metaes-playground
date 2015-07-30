/// <reference path="../../../typings/codemirror/codemirror.d.ts" />
/// <reference path="../metaes-completions/metaes-completions.ts" />
/// <reference path="../../scripts/evaluation-system2.ts" />

module Editor {
  type Range = [number, number];

  export class MetaesEditor extends ObjectUtils.PolymerElement {
    height = 500;
    markersByName:{[key:string]: CodeMirror.TextMarker[]};
    completionsComponent:MetaesCompletions.MetaesCompletionsElement;
    codeMirror:CodeMirror.Editor;
    tooltip:HTMLElement;

    // evaluator mode name
    modeName:string;

    heightChanged() {
      var value = this.height || 500;
      this.codeMirror.setSize(null, value - 20);
      this.$.editor.style.height = value - 20 + 'px';
      this.style.height = value + 'px';
    }

    ready() {
      this.markersByName = {};

      this.codeMirror = this.$.editor.mirror;
      this.codeMirror.setOption('mode', 'javascript');
      this.codeMirror.focus();

      this.tooltip = this.$.tooltip;

      this.heightChanged();

      this.completionsComponent = this.$.completionsComponent;
    }

    on(type, callback) {
      this.codeMirror.on(type, callback);
    }

    off(type, callback) {
      this.codeMirror.off(type, callback);
    }

    getCurrentCursorIndex() {
      return this.codeMirror.getDoc().indexFromPos(this.codeMirror.getDoc().getCursor());
    }

    markTextDefault(range:Range) {
      this.clearMarkers('markedText');
      this.markText('markedText', this.posFromIndex(range[0]), this.posFromIndex(range[1]));
    }

    markText(className:string, start:CodeMirror.Position, stop:CodeMirror.Position):CodeMirror.TextMarker {
      var markers = (this.markersByName[className] = this.markersByName[className] || []);
      var marker = this.codeMirror.getDoc().markText(start, stop, {
        className: className
      });
      markers.push(marker);
      return marker;
    }

    markTextByNode(className:string, node:EvaluationSystem2.ASTNode):CodeMirror.TextMarker {
      var range = node.range;
      return this.markText(className, this.posFromIndex(range[0]), this.posFromIndex(range[1]));
    }

    markTextByRange(className:string, range:Range) {
      this.clearMarkers(className);
      this.markText(className, this.posFromIndex(range[0]), this.posFromIndex(range[1]));
    }

    markTextByRanges(className:string, ranges:[Range, Range]) {
      this.clearMarkers(className);
      ranges.forEach(range=> {
        this.markText(className, this.posFromIndex(range[0]), this.posFromIndex(range[1]));
      });
    }

    getMarkersByName(className:string):CodeMirror.TextMarker[] {
      return this.markersByName[className];
    }

    clearMarkers(className:string) {
      var markers = this.markersByName[className];
      if (markers) {
        markers.forEach(marker=>marker.clear());
        markers.length = 0;
      }
    }

    posFromIndex(index:number) {
      return this.codeMirror.getDoc().posFromIndex(index);
    }

    getRange(from, to) {
      return this.codeMirror.getDoc().getRange(from, to);
    }

    updateCompletionsPosition() {
      var coords = (<any>this.codeMirror).cursorCoords(false);
      this.completionsComponent.style.left = (<any>coords).right + 5 + "px";
      this.completionsComponent.style.top = coords.bottom + 5 + "px";
    }

    showCompletionsComponent() {
      this.completionsComponent.show();
    }

    hideCompletionsComponent() {
      this.completionsComponent.hide();
    }

    getValue() {
      return this.codeMirror.getDoc().getValue();
    }

    setValue(value) {
      return this.codeMirror.getDoc().setValue(value);
    }

    setCompletionFilterAndValues(filter, valuesObject) {
      this.showCompletionsComponent();
      this.completionsComponent.setFilterText(filter);
      this.completionsComponent.setValues(ObjectUtils.extractCompletions(valuesObject));
    }

    logHelper(arg) {
      this.$.error.innerHTML = arg;
    }

    decorate(arg) {
      return "<span class='single-value'>" + arg + "</span>";
    }

    log(...args:any[]) {
      if (arguments.length) {
        this.logHelper([].slice.call(arguments).map(this.decorate).join(" "));
      } else {
        this.logHelper('');
      }
    }

    clearLog() {
      this.log();
    }

    updateTooltip(bestNode) {
      var value;
      value = bestNode.lastValue;
      this.tooltip.type = bestNode.type;
      this.tooltip.value = value;
    }
  }
}
