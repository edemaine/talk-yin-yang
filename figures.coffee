contents = (elt) ->
  elt.innerText.trim()
  .replace /^[ \t]+|[ \t]+$/gm, ''  # remove indentation on each line
  .replace /^\n+|\n+$/g, ''         # remove initial/final line breaks

window.addEventListener 'DOMContentLoaded', ->
  document.querySelectorAll('.puzzle').forEach (elt) ->
    text = contents elt
    puzzle = Puzzle.fromAscii text.replace /[%0]/g, '.'
    elt.innerHTML = ''
    svg = SVG().addTo elt
    player = new Player svg, puzzle
    if /[%0]/.test text
      player.user = Puzzle.fromAscii (
        text.replace /%/g, 'X'
        .replace /0/g, 'O'
      )
      player.drawUser()
    player.user.bad2x2s = (-> []) if elt.classList.contains 'no2x2'
    player.drawErrors()

  vertex = (color) -> ->
    """
      <symbol viewBox="-0.5 -0.5 1 1">
        #{if @neighbor(1, 0).key? then '<line x2="1" stroke="white" stroke-width="0.15"/>' else ''}
        #{if @neighbor(0, 1).key? then '<line y2="1" stroke="white" stroke-width="0.15"/>' else ''}
        <circle r="0.3" fill="#{color}" stroke="white" style="stroke-width: 0.1 !important"/>
      </symbol>
    """
  mapping = new svgtiler.Mapping
    X: vertex '#0377fc'
    x: vertex '#0377fc'
    O: vertex '#c70000'
    o: vertex '#c70000'
    '.': vertex '#aaa'
  svgtiler.renderDOM mapping, '.graph',
    filename: 'graph.asc'
    keepParent: true
