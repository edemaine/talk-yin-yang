contents = (elt) ->
  elt.innerText.trim()
  .replace /^[ \t]+|[ \t]+$/gm, ''  # remove indentation on each line
  .replace /^\n+|\n+$/g, ''         # remove initial/final line breaks

window.addEventListener 'DOMContentLoaded', ->
  document.querySelectorAll('.puzzle').forEach (elt) ->
    puzzle = Puzzle.fromAscii contents elt
    elt.innerHTML = ''
    svg = SVG().addTo elt
    new Player svg, puzzle

  document.querySelectorAll('.figure').forEach (elt) ->
    svgtiler.Drawing.useHref = true
    drawing = svgtiler.ASCIIDrawing.parseFile 'figure.txt', contents elt
    mapping = new svgtiler.Mapping
    vertex = (color) -> ->
      """
        <symbol viewBox="-0.5 -0.5 1 1">
          #{if @neighbor(1, 0).key? then '<line x2="1" stroke="white" stroke-width="0.15"/>' else ''}
          #{if @neighbor(0, 1).key? then '<line y2="1" stroke="white" stroke-width="0.15"/>' else ''}
          <circle r="0.3" fill="#{color}" stroke="white" style="stroke-width: 0.1 !important"/>
        </symbol>
      """
    mapping.load
      X: vertex 'blue'
      x: vertex 'blue'
      O: vertex 'red'
      o: vertex 'red'
      '.': vertex 'gray'
    elt.innerHTML = ''
    #elt.appendChild (drawing.renderSVGDOM new svgtiler.Mappings [mapping]).documentElement
    elt.innerHTML = drawing.renderSVG new svgtiler.Mappings [mapping]
