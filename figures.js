(function() {
  var contents;

  contents = function(elt) {
    return elt.innerText.trim().replace(/^[ \t]+|[ \t]+$/gm, '').replace(/^\n+|\n+$/g, ''); // remove indentation on each line // remove initial/final line breaks
  };

  window.addEventListener('DOMContentLoaded', function() {
    var mapping, vertex;
    document.querySelectorAll('.puzzle').forEach(function(elt) {
      var player, puzzle, svg, text;
      text = contents(elt);
      puzzle = Puzzle.fromAscii(text.replace(/[%0]/g, '.'));
      elt.innerHTML = '';
      svg = SVG().addTo(elt);
      player = new Player(svg, puzzle);
      if (/[%0]/.test(text)) {
        player.user = Puzzle.fromAscii(text.replace(/%/g, 'X').replace(/0/g, 'O'));
        player.drawUser();
      }
      if (elt.classList.contains('no2x2')) {
        player.user.bad2x2s = (function() {
          return [];
        });
      }
      return player.drawErrors();
    });
    vertex = function(color) {
      return function() {
        return `<symbol viewBox="-0.5 -0.5 1 1">
  ${this.neighbor(1, 0).key != null ? '<line x2="1" stroke="white" stroke-width="0.15"/>' : ''}
  ${this.neighbor(0, 1).key != null ? '<line y2="1" stroke="white" stroke-width="0.15"/>' : ''}
  <circle r="0.3" fill="${color}" stroke="white" style="stroke-width: 0.1 !important"/>
</symbol>`;
      };
    };
    mapping = new svgtiler.Mapping({
      X: vertex('#0377fc'),
      x: vertex('#0377fc'),
      O: vertex('#c70000'),
      o: vertex('#c70000'),
      '.': vertex('#aaa')
    });
    return svgtiler.renderDOM(mapping, '.graph', {
      filename: 'graph.asc',
      keepParent: true
    });
  });

}).call(this);
