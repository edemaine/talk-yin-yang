# These widths must match the widths in yinyang.styl
minorWidth = 0.05
majorWidth = 0.15

circleDiameter = 0.7

EMPTY = 0
WHITE = 1
BLACK = 2
opposite = (cell) -> 3-cell
char2cell =
  '.': EMPTY
  O: WHITE
  o: WHITE
  x: BLACK
  X: BLACK
cell2char = {}
do -> cell2char[k] = c for c, k of char2cell

class Puzzle
  constructor: (@cell = []) ->
    @nrow = @cell.length
    @ncol = @cell[0].length
    @branch = 0
  clone: ->
    new @constructor (
      for row in @cell
        row[..]
    )
  @fromAscii: (ascii) ->
    new @ (
      for row in ascii.trimEnd().split '\n'
        for char in row
          console.warn "Invalid character #{char}" unless char of char2cell
          char2cell[char] ? EMPTY
    )
  toAscii: ->
    (for row in @cell
      (for cell in row
        cell2char[cell]
      ).join ''
    ).join '\n'
  padLeftTop: (color = WHITE) ->
    ## Pad border around top and left sides, as in font
    new @constructor (
      [color for j in [0...@ncol+1]]
      .concat (
        for row in @cell
          [color, ...row]
      )
    )
  padRight: (color = WHITE) ->
    ## Pad border around right side, as in font
    new @constructor (
      for row in @cell
        [...row, color]
    )
  pad: ->
    ## Pad white border around top and sides, as in single letter
    @padLeftTop().padRight()
  padBottom: (color = WHITE) ->
    ## Pad border around bottom side
    new @constructor (
      [...row] for row in @cell
    ).concat [color for j in [0...@ncol]]
  concat: (other) ->
    new @constructor (
      for row, i in @cell
        row.concat other.cell[i]
    )

  cellsMatching: (color, negate) ->
    for row, i in @cell
      for cell, j in row
        condition = cell == color
        condition = not condition if negate
        yield [i,j] if condition
  numCellsMatching: (...args) -> Array.from(@cellsMatching ...args).length
  allCells: -> @cellsMatching -999, true
  filledCells: -> @cellsMatching EMPTY, true
  numFilledCells: -> Array.from(@filledCells()).length
  firstCellMatching: (color, negate) ->
    for ij from @cellsMatching color, negate
      return ij
  bestEmptyCell: ->
    @firstCellMatching EMPTY
    ## Bottom-left empty cell:
    #for i in [@cell.length-1 .. 0]
    #  for cell, j in @cell[i]
    #    if cell == EMPTY
    #      return [i,j]
  boundaryCells: ->
    cells = []
    for i in [0...@nrow]
      cells.push [i, 0]
    for j in [1...@ncol]
      cells.push [@nrow-1, j]
    for i in [@nrow-2 .. 0]
      cells.push [i, @ncol-1]
    for j in [@ncol-2 .. 1]
      cells.push [0, j]
    cells

  bad2x2s: ->
    ## Check for violations to 2x2 constraint
    for row, i in @cell when i
      for cell, j in row when j and cell != EMPTY
        if cell == @cell[i-1][j] == @cell[i][j-1] == @cell[i-1][j-1]
          yield [i, j]
    return
  bad2x2: ->
    for bad from @bad2x2s()
      return true
    false
  alt2x2s: ->
    ## Check for violations to lemma of no alternating 2x2
    for row, i in @cell when i
      for cell, j in row when j and cell != EMPTY
        if cell == @cell[i-1][j-1] and @cell[i-1][j] == @cell[i][j-1] == opposite cell
          yield [i, j]
    return
  alt2x2: ->
    for alt from @alt2x2s()
      return true
    false
  solved: ->
    (not @firstCellMatching EMPTY) and
    not @bad2x2() and
    @dfs().count <= 2

  local2x2: (i, j, color) ->
    ###
    Check for local violation to 2x2 constraint,
    if we set cell (i,j) to specified color.
    ###
    if i > 0 and color == @cell[i-1][j]
      if j > 0
        return true if color == @cell[i][j-1] == @cell[i-1][j-1]
      if j+1 < @ncol
        return true if color == @cell[i][j+1] == @cell[i-1][j+1]
    if i+1 < @nrow and color == @cell[i+1][j]
      if j > 0
        return true if color == @cell[i][j-1] == @cell[i+1][j-1]
      if j+1 < @ncol
        return true if color == @cell[i][j+1] == @cell[i+1][j+1]
    false
  local2x2alt: (i, j, color) ->
    ###
    Check for local violation to lemma that no 2x2 square has alternating
    colors, if we set cell (i,j) to specified color.
    ###
    opp = opposite color
    if i > 0 and opp == @cell[i-1][j]
      if j > 0
        return true if opp == @cell[i][j-1] and color == @cell[i-1][j-1]
      if j+1 < @ncol
        return true if opp == @cell[i][j+1] and color == @cell[i-1][j+1]
    if i+1 < @nrow and opp == @cell[i+1][j]
      if j > 0
        return true if opp == @cell[i][j-1] and color == @cell[i+1][j-1]
      if j+1 < @ncol
        return true if opp == @cell[i][j+1] and color == @cell[i+1][j+1]
    false
  force2x2: (i, j) ->
    forced = []
    for [i, j] from @cellsMatching EMPTY
      for color in [BLACK, WHITE]
        if @local2x2(i, j, color) or @local2x2alt(i, j, color)
          opp = opposite color
          return false if @local2x2(i, j, opp) or @local2x2alt(i, j, opp)
          forced.push [i, j, opp]
    forced if forced.length

  neighbors: (i,j) ->
    yield [i-1,j] if i > 0
    yield [i+1,j] if i+1 < @nrow
    yield [i,j-1] if j > 0
    yield [i,j+1] if j+1 < @ncol
  dfs: (roots = Array.from @allCells()) ->
    if typeof roots == 'number'
      roots = Array.from @cellsMatching roots
    cc = {}    # map from coordinates to connected component id
    count = 0  # number of connected components / current component id
    recurse = (i, j, color) =>
      cc[[i,j]] = count
      for [i2,j2] from @neighbors i, j
        continue if cc[[i2,j2]]?
        continue unless @cell[i2][j2] in [color, EMPTY]  # stay within color
        recurse i2, j2, color
      undefined
    for [i,j] in roots
      continue if cc[[i,j]]?
      recurse i, j, @cell[i][j]
      count++
    {cc, count}
  articulation: (color) ->
    ###
    Return an array of articulation points (cut vertices) that are EMPTY,
    so should receive specified color.  Assumes color+EMPTY is connected.
    Based on linear-time algorithm from CLRS Problem 22-2, as solved here:
    https://walkccc.me/CLRS/Chap22/Problems/22-2/
    ###
    depth =  {} # map from coordinates to depth
    low = {}    # map from coordinates to min depth among self and back edges from descendants of this node
    nonempty = {} # map from coordinates to whether descendant has color
    articulation = []
    recurse = (i, j, d) =>
      depth[[i,j]] = d
      low[[i,j]] = d
      cell = @cell[i][j]
      nonempty[[i,j]] = (cell == color)
      minLow = (newLow) ->
        low[[i,j]] = newLow if newLow < low[[i,j]]
      articulate = false
      #children = 0
      for [i2,j2] from @neighbors i, j
        continue unless @cell[i2][j2] in [color, EMPTY]  # stay within color
        if depth[[i2,j2]]?  # back or parent edge
          minLow depth[[i2,j2]]
        else
          #children++
          recurse i2, j2, d+1
          nonempty[[i,j]] or= nonempty[[i2,j2]]
          minLow childLow = low[[i2,j2]]
          ## If some child doesn't have a back pointer above us,
          ## we are an articulation point.
          articulate = true if nonempty[[i2,j2]] and childLow >= d
      articulation.push [i,j] if articulate and cell == EMPTY
      undefined
      #children
    if (root = @firstCellMatching color)?
      [i, j] = root
      ## Root is an articulation point if it has >= 2 children.
      ## But we don't need to list this, because it isn't EMPTY.
      #if 2 <= recurse i, j, 0
      #  articulation.push [i,j]
      recurse i, j, 0
    articulation
  forceArticulation: ->
    ###
    Return [i, j, color] triples for all empty cells forced by
    articulation point heuristic.
    ###
    forced = []
    for color in [BLACK, WHITE]
      for [i,j] in @articulation color
        forced.push [i, j, color]
    forced if forced.length
  isolated: ->
    ## Check for two components of the same color that can't meet up.
    for color in [BLACK, WHITE]
      {count} = @dfs color
      return true if count > 1
    false
  prune: ->
    @bad2x2() or
    @alt2x2() or
    @isolated()
  forceBoundary: ->
    ###
    Heuristic for coloring boundary circles.  Returns one of:
    * undefined: nothing learned
    * false: puzzle is unsolvable
    * Array of [i, j, c]: empty cells (i, j) must in fact be the color c
    ###
    boundary = @boundaryCells()
    ## Count the number of black/white/empty circles on the boundary,
    ## and alternations between black and white (not counting wraparound).
    num =
      [BLACK]: 0
      [WHITE]: 0
      [EMPTY]: 0
    current = null
    alt = 0
    for [i, j] in boundary
      color = @cell[i][j]
      num[color]++
      unless color == EMPTY
        unless color == current
          alt++ if current?
          current = color
    ## Ensure there are both black and white colors on the boundary
    return unless num[BLACK] and num[WHITE]
    ## Check for four alternating groups => puzzle unsolvable
    return false if alt > 2
    ## Check for something to do
    return if num[EMPTY] == 0
    ## Check each color with multiple instances.
    empty = []
    for color in [BLACK, WHITE] when num[color] > 1
      opp = opposite color
      ## Find some opposite color, and split the boundary there.
      k = boundary.findIndex ([i, j]) => @cell[i][j] == opp
      console.assert k >= 0, 'boundary no opposite color'
      cbound = boundary[k+1..].concat boundary[...k]
      ## Find longest (circular) interval of color
      k = cbound.findIndex ([i, j]) => @cell[i][j] == color
      console.assert k >= 0, 'boundary no color'
      cbound = cbound[k..]
      isntColor = ([i, j]) => @cell[i][j] != color
      cbound.pop() while isntColor cbound[cbound.length-1]
      ## Check for empty colors in the interval
      empty.push ...([i, j, color] for [i, j] in cbound when @cell[i][j] == EMPTY)
    return unless empty.length
    empty

  solutions: ->
    ###
    Generator for all solutions to a puzzle, yielding itself as it modifies
    into each solution.  Clone each result to store all solutions.
    ###
    #return if @pruneSkip2x2()
    #console.log @toAscii(); console.log()
    ## Filled-in puzzle => potential solution
    unless (cell = @bestEmptyCell())?
      yield @ if @solved()
      return
    ## Apply boundary, articulation, and 2x2 heuristics
    for heuristic in [@force2x2, @forceBoundary, @forceArticulation]
      if (forced = heuristic.call @)?
        return if forced == false
        for [i, j, c] in forced
          @cell[i][j] = c
        unless @prune()
          yield from @solutions()
        for [i, j, c] in forced
          @cell[i][j] = EMPTY
        return
    ## Branch on first cell
    [i, j] = cell
    @branch++
    for color in [BLACK, WHITE]
      @cell[i][j] = color
      #console.log '> recursing', i, j, cell2char[color]
      yield from @solutions()
      @cell[i][j] = EMPTY
    #console.log '< returning'
    return
  solve: ->
    ###
    Modify puzzle into a solution and return it, or undefined upon failure.
    Use clone() first if you want a copy instead of in-place modification.
    ###
    for solution from @solutions()
      return solution
  uniqueSolution: ->
    ###
    Returns false if no solution or solution isn't unique.
    Otherwise, returns number of branches required to determine unique solution.
    ###
    @branch = 0
    count = 0
    for solution from @solutions()
      count++
      return false if count > 1
    if count == 1
      @branch
    else
      false

  reduceUnique: ->
    cells = Array.from @filledCells()
    console.log "reducing from #{@numFilledCells()} clues"
    while cells.length
      ## Extract a candidate cell from the list
      index = Math.floor Math.random() * cells.length
      [i,j] = cells[index]
      last = cells.pop()
      cells[index] = last if index < cells.length
      console.log "testing #{cell2char[@cell[i][j]]} at (#{i}, #{j}) -- #{cells.length} clues remain"
      opp = opposite @cell[i][j]
      if @local2x2(i, j, opp) or @local2x2alt(i, j, opp)
        necessary = false
      else
        other = @clone()
        other.cell[i][j] = opp
        necessary = other.solve()
      unless necessary
        ## Clue wasn't necessary: empty it and report reduction.
        @cell[i][j] = EMPTY
        console.log @toAscii()
        console.log "reducing from #{@numFilledCells()} clues"
    @
  reducePrune: ->
    cells = Array.from @filledCells()
    while cells.length
      index = Math.floor Math.random() * cells.length
      [i,j] = cells[index]
      old = @cell[i][j]
      opp = opposite old
      necessary = true
      if @local2x2(i, j, opp) or @local2x2alt(i, j, opp)
        necessary = false
      else
        @cell[i][j] = opp
        necessary = false if @pruneExcept2x2()
        @cell[i][j] = old
      if necessary
        ## Clue was necessary; remove from candidate list
        last = cells.pop()
        cells[index] = last if index < cells.length
      else
        ## Clue wasn't necessary: empty it and start search over.
        @cell[i][j] = EMPTY
        break
    @

class Viewer
  constructor: (@svg, @puzzle, @solution) ->
    @backgroundRect = @svg.rect @puzzle.ncol, @puzzle.nrow
    .addClass 'background'
    @gridGroup = @svg.group()
    .addClass 'grid'
    @puzzleGroup = @svg.group()
    .addClass 'puzzle'
    @solutionGroup = @svg.group()
    .addClass 'solution'
    @drawGrid()
    @drawPuzzle()
    @drawSolution()

  drawGrid: ->
    @gridGroup.clear()
    @backgroundRect.size @puzzle.ncol, @puzzle.nrow
    for x in [1...@puzzle.ncol]
      @gridGroup.line x, 0, x, @puzzle.nrow
    for y in [1...@puzzle.nrow]
      @gridGroup.line 0, y, @puzzle.ncol, y
    @gridGroup.rect @puzzle.ncol, @puzzle.nrow
    .addClass 'border'
    @svg.viewbox
      x: 0 - majorWidth/2
      y: 0 - majorWidth/2
      width: @puzzle.ncol + majorWidth
      height: @puzzle.nrow + majorWidth

  drawPuzzle: ->
    @puzzleGroup.clear()
    for row, y in @puzzle.cell
      for cell, x in row
        continue if cell == EMPTY
        @puzzleGroup.circle circleDiameter
        .center x + 0.5, y + 0.5
        .addClass cell2char[cell].toUpperCase()
    undefined

  drawSolution: ->
    @solutionGroup.clear()
    return unless @solution?
    for row, y in @solution.cell
      for cell, x in row
        continue if cell == EMPTY
        continue unless @puzzle.cell[y][x] == EMPTY
        @solutionGroup.circle circleDiameter
        .center x + 0.5, y + 0.5
        .addClass cell2char[cell].toUpperCase()
    undefined

class Player extends Viewer
  constructor: (...args) ->
    super ...args
    @user = @puzzle.clone()
    @errorGroup = @svg.group()
    .addClass 'error'
    .insertAfter @backgroundRect
    @drawErrors()
    @userGroup = @svg.group()
    .addClass 'user'
    @dashGroup = @svg.group()
    .addClass 'dash'
    @userCircles = {}
    @highlight = @svg.rect 1, 1
    .addClass 'target'
    .opacity 0
    event2coord = (e) =>
      pt = @svg.point e.clientX, e.clientY
      pt.x = Math.floor pt.x
      pt.y = Math.floor pt.y
      return unless 0 <= pt.x < @puzzle.ncol and 0 <= pt.y < @puzzle.nrow
      return unless @puzzle.cell[pt.y][pt.x] == EMPTY
      pt
    @svg.mousemove (e) =>
      pt = event2coord e
      if pt?
        @highlight
        .move pt.x, pt.y
        .opacity 0.333
        if e.buttons and @lastColor?
          @toggle pt.y, pt.x, @lastColor, true
      else
        @highlight.opacity 0
    @svg.on 'mouseleave', (e) =>
      @highlight.opacity 0
      @lastColor = undefined
    @svg.mousedown (e) =>
      e.preventDefault() if e.button in [0, 1, 2]
      pt = event2coord e
      return unless pt?
      @toggle pt.y, pt.x,
        switch e.button
          when 0  # left click
            undefined  # => cycle through 3 options
          when 1  # middle click
            EMPTY
          when 2  # right click
            WHITE
    @svg.on 'contextmenu', (e) =>
      e.preventDefault()
    @svg.on 'auxclick', (e) =>
      e.preventDefault()
  toggle: (...args) ->
    for copy in @linked ? [@]
      copy.toggleSelf ...args
  toggleSelf: (i, j, color, force) ->
    if @userCircles[[i,j]]?
      for circle in @userCircles[[i,j]]
        circle.remove()
      delete @userCircles[[i,j]]
    if color?
      if force or color == EMPTY
        @user.cell[i][j] = color
      else
        @user.cell[i][j] =
          if @user.cell[i][j] == color
            EMPTY
          else
            color
    else
      @user.cell[i][j] =
        switch @user.cell[i][j]
          when EMPTY
            BLACK
          when BLACK
            WHITE
          when WHITE
            EMPTY
    @lastColor = @user.cell[i][j]
    if @lastColor != EMPTY
      @userCircles[[i,j]] =
        for group in [@userGroup, @dashGroup]
          group.circle circleDiameter
          .center j + 0.5, i + 0.5
          .addClass cell2char[@lastColor].toUpperCase()

    @drawErrors()
    if solved = @user.solved()
      @svg.addClass 'solved'
    else
      @svg.removeClass 'solved'

  drawErrors: ->
    @errorGroup.clear()
    for [i, j] from @user.bad2x2s()
      @errorGroup.rect 2, 2
      .center j, i
    for [i, j] from @user.alt2x2s()
      @errorGroup.rect 2, 2
      .center j, i
      .addClass 'alt'

reviewGUI = ->
  review = document.getElementById 'review'
  selection = {}
  solution = {}
  for letter, puzzles of window.review
    clues = (puzzle.clues for puzzle in puzzles when not puzzle.solution)
    branch = (puzzle.branch for puzzle in puzzles when not puzzle.solution)
    review.appendChild header = document.createElement 'h2'
    header.innerHTML = "#{letter} &mdash; #{puzzles.length} puzzles &mdash; clues [#{Math.min ...clues}, #{Math.max ...clues}], branch [#{Math.min ...branch}, #{Math.max ...branch}]"
    review.appendChild container = document.createElement 'div'
    container.className = 'container'
    for puzzle in puzzles
      container.appendChild div = document.createElement 'div'
      div.className = 'review'
      new Viewer SVG().addTo(div), Puzzle.fromAscii puzzle.puzzle
      div.appendChild caption = document.createElement 'figcaption'
      if puzzle.solution
        solution[letter] = puzzle.puzzle
        caption.innerHTML = 'Solution'
        div.classList.add 'solution'
      else
        caption.innerHTML = "<b>#{puzzle.clues} clues</b>: #{puzzle.black} black, #{puzzle.white} white &mdash; <b>branch #{puzzle.branch}</b>"
        div.addEventListener 'click', click =
          do (container, letter, div, puzzle) -> ->
            container.querySelectorAll('.selected').forEach (el) ->
              el.classList.remove 'selected'
            div.classList.add 'selected'
            selection[letter] = puzzle.puzzle
        click() if window.font?[letter]?.puzzle == puzzle.puzzle
  document.getElementById('downloadFont').addEventListener 'click', ->
    out = {}
    for letter of window.review
      continue unless solution[letter]? and selection[letter]?
      out[letter] =
        puzzle: selection[letter]
        solution: solution[letter]
    FontWebapp.downloadFile 'font.js', """
      window.font = #{window.stringify(out)};

    """, 'text/javascript'
  document.getElementById('testInput').addEventListener 'input', ->
    document.getElementById('testOutput').innerHTML = ''
    new Viewer SVG().addTo('#testOutput'),
      Puzzle.fromAscii document.getElementById('testInput').value

fontGUI = ->
  symbolCache = {}
  app = new FontWebappHTML
    root: '#output'
    sizeSlider: '#size'
    charWidth: 225
    charPadding: 5
    charKern: 0
    lineKern: 22.5
    spaceWidth: 112.5
    shouldRender: (changed) ->
      changed.text
    renderChar: (char, state, parent) ->
      char = char.toUpperCase()
      letter = window.font[char]
      return unless letter?
      symbolCache[char] ?= [
        Puzzle.fromAscii letter.puzzle
        Puzzle.fromAscii letter.solution
      ]
      svg = SVG().addTo parent
      new Player svg, ...symbolCache[char]
    linkIdenticalChars: (glyphs) ->
      glyph.linked = glyphs for glyph in glyphs

  document.getElementById('reset').addEventListener 'click', ->
    app.render()

window?.onload = ->
  if document.getElementById 'review'
    reviewGUI()
  else if review = document.getElementById 'output'
    fontGUI()

exports = {Puzzle, Viewer, Player, BLACK, WHITE, EMPTY}
module?.exports = exports
if window?
  window[key] = value for key, value of exports
