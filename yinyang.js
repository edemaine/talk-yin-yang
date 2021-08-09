(function() {
  // These widths must match the widths in yinyang.styl
  var BLACK, EMPTY, Player, Puzzle, Viewer, WHITE, cell2char, char2cell, circleDiameter, exports, fontGUI, key, majorWidth, minorWidth, opposite, reviewGUI, value;

  minorWidth = 0.05;

  majorWidth = 0.15;

  circleDiameter = 0.7;

  EMPTY = 0;

  WHITE = 1;

  BLACK = 2;

  opposite = function(cell) {
    return 3 - cell;
  };

  char2cell = {
    '.': EMPTY,
    O: WHITE,
    o: WHITE,
    x: BLACK,
    X: BLACK
  };

  cell2char = {};

  (function() {
    var c, k, results;
    results = [];
    for (c in char2cell) {
      k = char2cell[c];
      results.push(cell2char[k] = c);
    }
    return results;
  })();

  Puzzle = class Puzzle {
    constructor(cell1 = []) {
      this.cell = cell1;
      this.nrow = this.cell.length;
      this.ncol = this.cell[0].length;
      this.branch = 0;
    }

    clone() {
      var row;
      return new this.constructor((function() {
        var l, len, ref, results;
        ref = this.cell;
        results = [];
        for (l = 0, len = ref.length; l < len; l++) {
          row = ref[l];
          results.push(row.slice(0));
        }
        return results;
      }).call(this));
    }

    static fromAscii(ascii) {
      var char, row;
      return new this((function() {
        var l, len, ref, results;
        ref = ascii.trimEnd().split('\n');
        results = [];
        for (l = 0, len = ref.length; l < len; l++) {
          row = ref[l];
          results.push((function() {
            var len1, m, ref1, results1;
            results1 = [];
            for (m = 0, len1 = row.length; m < len1; m++) {
              char = row[m];
              if (!(char in char2cell)) {
                console.warn(`Invalid character ${char}`);
              }
              results1.push((ref1 = char2cell[char]) != null ? ref1 : EMPTY);
            }
            return results1;
          })());
        }
        return results;
      })());
    }

    toAscii() {
      var cell, row;
      return ((function() {
        var l, len, ref, results;
        ref = this.cell;
        results = [];
        for (l = 0, len = ref.length; l < len; l++) {
          row = ref[l];
          results.push(((function() {
            var len1, m, results1;
            results1 = [];
            for (m = 0, len1 = row.length; m < len1; m++) {
              cell = row[m];
              results1.push(cell2char[cell]);
            }
            return results1;
          })()).join(''));
        }
        return results;
      }).call(this)).join('\n');
    }

    padLeftTop(color = WHITE) {
      var j, row;
      //# Pad border around top and left sides, as in font
      return new this.constructor([
        (function() {
          var l,
        ref,
        results;
          results = [];
          for (j = l = 0, ref = this.ncol + 1; (0 <= ref ? l < ref : l > ref); j = 0 <= ref ? ++l : --l) {
            results.push(color);
          }
          return results;
        }).call(this)
      ].concat((function() {
        var l, len, ref, results;
        ref = this.cell;
        results = [];
        for (l = 0, len = ref.length; l < len; l++) {
          row = ref[l];
          results.push([color, ...row]);
        }
        return results;
      }).call(this)));
    }

    padRight(color = WHITE) {
      var row;
      //# Pad border around right side, as in font
      return new this.constructor((function() {
        var l, len, ref, results;
        ref = this.cell;
        results = [];
        for (l = 0, len = ref.length; l < len; l++) {
          row = ref[l];
          results.push([...row, color]);
        }
        return results;
      }).call(this));
    }

    pad() {
      //# Pad white border around top and sides, as in single letter
      return this.padLeftTop().padRight();
    }

    padBottom(color = WHITE) {
      var j, row;
      //# Pad border around bottom side
      return new this.constructor(((function() {
        var l, len, ref, results;
        ref = this.cell;
        results = [];
        for (l = 0, len = ref.length; l < len; l++) {
          row = ref[l];
          results.push([...row]);
        }
        return results;
      }).call(this)).concat([
        (function() {
          var l,
        ref,
        results;
          results = [];
          for (j = l = 0, ref = this.ncol; (0 <= ref ? l < ref : l > ref); j = 0 <= ref ? ++l : --l) {
            results.push(color);
          }
          return results;
        }).call(this)
      ]));
    }

    concat(other) {
      var i, row;
      return new this.constructor((function() {
        var l, len, ref, results;
        ref = this.cell;
        results = [];
        for (i = l = 0, len = ref.length; l < len; i = ++l) {
          row = ref[i];
          results.push(row.concat(other.cell[i]));
        }
        return results;
      }).call(this));
    }

    * cellsMatching(color, negate) {
      var cell, condition, i, j, l, len, ref, results, row;
      ref = this.cell;
      results = [];
      for (i = l = 0, len = ref.length; l < len; i = ++l) {
        row = ref[i];
        results.push((yield* (function*() {
          var len1, m, results1;
          results1 = [];
          for (j = m = 0, len1 = row.length; m < len1; j = ++m) {
            cell = row[j];
            condition = cell === color;
            if (negate) {
              condition = !condition;
            }
            if (condition) {
              results1.push((yield [i, j]));
            } else {
              results1.push(void 0);
            }
          }
          return results1;
        })()));
      }
      return results;
    }

    numCellsMatching(...args) {
      return Array.from(this.cellsMatching(...args)).length;
    }

    allCells() {
      return this.cellsMatching(-999, true);
    }

    filledCells() {
      return this.cellsMatching(EMPTY, true);
    }

    numFilledCells() {
      return Array.from(this.filledCells()).length;
    }

    firstCellMatching(color, negate) {
      var ij, ref;
      ref = this.cellsMatching(color, negate);
      for (ij of ref) {
        return ij;
      }
    }

    bestEmptyCell() {
      return this.firstCellMatching(EMPTY);
    }

    //# Bottom-left empty cell:
    //for i in [@cell.length-1 .. 0]
    //  for cell, j in @cell[i]
    //    if cell == EMPTY
    //      return [i,j]
    boundaryCells() {
      var cells, i, j, l, m, n, o, ref, ref1, ref2, ref3;
      cells = [];
      for (i = l = 0, ref = this.nrow; (0 <= ref ? l < ref : l > ref); i = 0 <= ref ? ++l : --l) {
        cells.push([i, 0]);
      }
      for (j = m = 1, ref1 = this.ncol; (1 <= ref1 ? m < ref1 : m > ref1); j = 1 <= ref1 ? ++m : --m) {
        cells.push([this.nrow - 1, j]);
      }
      for (i = n = ref2 = this.nrow - 2; (ref2 <= 0 ? n <= 0 : n >= 0); i = ref2 <= 0 ? ++n : --n) {
        cells.push([i, this.ncol - 1]);
      }
      for (j = o = ref3 = this.ncol - 2; (ref3 <= 1 ? o <= 1 : o >= 1); j = ref3 <= 1 ? ++o : --o) {
        cells.push([0, j]);
      }
      return cells;
    }

    * bad2x2s() {
      var cell, i, j, l, len, len1, m, ref, ref1, ref2, row;
      ref = this.cell;
      //# Check for violations to 2x2 constraint
      for (i = l = 0, len = ref.length; l < len; i = ++l) {
        row = ref[i];
        if (i) {
          for (j = m = 0, len1 = row.length; m < len1; j = ++m) {
            cell = row[j];
            if (j && cell !== EMPTY) {
              if (((cell === (ref2 = this.cell[i - 1][j]) && ref2 === (ref1 = this.cell[i][j - 1])) && ref1 === this.cell[i - 1][j - 1])) {
                yield [i, j];
              }
            }
          }
        }
      }
    }

    bad2x2() {
      var bad, ref;
      ref = this.bad2x2s();
      for (bad of ref) {
        return true;
      }
      return false;
    }

    * alt2x2s() {
      var cell, i, j, l, len, len1, m, ref, ref1, row;
      ref = this.cell;
      //# Check for violations to lemma of no alternating 2x2
      for (i = l = 0, len = ref.length; l < len; i = ++l) {
        row = ref[i];
        if (i) {
          for (j = m = 0, len1 = row.length; m < len1; j = ++m) {
            cell = row[j];
            if (j && cell !== EMPTY) {
              if (cell === this.cell[i - 1][j - 1] && (this.cell[i - 1][j] === (ref1 = this.cell[i][j - 1]) && ref1 === opposite(cell))) {
                yield [i, j];
              }
            }
          }
        }
      }
    }

    alt2x2() {
      var alt, ref;
      ref = this.alt2x2s();
      for (alt of ref) {
        return true;
      }
      return false;
    }

    solved() {
      return (!this.firstCellMatching(EMPTY)) && !this.bad2x2() && this.dfs().count <= 2;
    }

    local2x2(i, j, color) {
      var ref, ref1, ref2, ref3;
      /*
      Check for local violation to 2x2 constraint,
      if we set cell (i,j) to specified color.
      */
      if (i > 0 && color === this.cell[i - 1][j]) {
        if (j > 0) {
          if ((color === (ref = this.cell[i][j - 1]) && ref === this.cell[i - 1][j - 1])) {
            return true;
          }
        }
        if (j + 1 < this.ncol) {
          if ((color === (ref1 = this.cell[i][j + 1]) && ref1 === this.cell[i - 1][j + 1])) {
            return true;
          }
        }
      }
      if (i + 1 < this.nrow && color === this.cell[i + 1][j]) {
        if (j > 0) {
          if ((color === (ref2 = this.cell[i][j - 1]) && ref2 === this.cell[i + 1][j - 1])) {
            return true;
          }
        }
        if (j + 1 < this.ncol) {
          if ((color === (ref3 = this.cell[i][j + 1]) && ref3 === this.cell[i + 1][j + 1])) {
            return true;
          }
        }
      }
      return false;
    }

    local2x2alt(i, j, color) {
      /*
      Check for local violation to lemma that no 2x2 square has alternating
      colors, if we set cell (i,j) to specified color.
      */
      var opp;
      opp = opposite(color);
      if (i > 0 && opp === this.cell[i - 1][j]) {
        if (j > 0) {
          if (opp === this.cell[i][j - 1] && color === this.cell[i - 1][j - 1]) {
            return true;
          }
        }
        if (j + 1 < this.ncol) {
          if (opp === this.cell[i][j + 1] && color === this.cell[i - 1][j + 1]) {
            return true;
          }
        }
      }
      if (i + 1 < this.nrow && opp === this.cell[i + 1][j]) {
        if (j > 0) {
          if (opp === this.cell[i][j - 1] && color === this.cell[i + 1][j - 1]) {
            return true;
          }
        }
        if (j + 1 < this.ncol) {
          if (opp === this.cell[i][j + 1] && color === this.cell[i + 1][j + 1]) {
            return true;
          }
        }
      }
      return false;
    }

    force2x2(i, j) {
      var color, forced, l, len, opp, ref, ref1, z;
      forced = [];
      ref = this.cellsMatching(EMPTY);
      for (z of ref) {
        [i, j] = z;
        ref1 = [BLACK, WHITE];
        for (l = 0, len = ref1.length; l < len; l++) {
          color = ref1[l];
          if (this.local2x2(i, j, color) || this.local2x2alt(i, j, color)) {
            opp = opposite(color);
            if (this.local2x2(i, j, opp) || this.local2x2alt(i, j, opp)) {
              return false;
            }
            forced.push([i, j, opp]);
          }
        }
      }
      if (forced.length) {
        return forced;
      }
    }

    * neighbors(i, j) {
      if (i > 0) {
        yield [i - 1, j];
      }
      if (i + 1 < this.nrow) {
        yield [i + 1, j];
      }
      if (j > 0) {
        yield [i, j - 1];
      }
      if (j + 1 < this.ncol) {
        return (yield [i, j + 1]);
      }
    }

    dfs(roots = Array.from(this.allCells())) {
      var cc, count, i, j, l, len, recurse;
      if (typeof roots === 'number') {
        roots = Array.from(this.cellsMatching(roots));
      }
      cc = {}; // map from coordinates to connected component id
      count = 0; // number of connected components / current component id
      recurse = (i, j, color) => {
        var i2, j2, ref, ref1, z;
        cc[[i, j]] = count;
        ref = this.neighbors(i, j);
        for (z of ref) {
          [i2, j2] = z;
          if (cc[[i2, j2]] != null) {
            continue;
          }
          if ((ref1 = this.cell[i2][j2]) !== color && ref1 !== EMPTY) { // stay within color
            continue;
          }
          recurse(i2, j2, color);
        }
        return void 0;
      };
      for (l = 0, len = roots.length; l < len; l++) {
        [i, j] = roots[l];
        if (cc[[i, j]] != null) {
          continue;
        }
        recurse(i, j, this.cell[i][j]);
        count++;
      }
      return {cc, count};
    }

    articulation(color) {
      var articulation, depth, i, j, low, nonempty, recurse, root;
      /*
      Return an array of articulation points (cut vertices) that are EMPTY,
      so should receive specified color.  Assumes color+EMPTY is connected.
      Based on linear-time algorithm from CLRS Problem 22-2, as solved here:
      https://walkccc.me/CLRS/Chap22/Problems/22-2/
      */
      depth = {}; // map from coordinates to depth
      low = {}; // map from coordinates to min depth among self and back edges from descendants of this node
      nonempty = {}; // map from coordinates to whether descendant has color
      articulation = [];
      recurse = (i, j, d) => {
        var articulate, cell, childLow, i2, j2, minLow, ref, ref1, z;
        depth[[i, j]] = d;
        low[[i, j]] = d;
        cell = this.cell[i][j];
        nonempty[[i, j]] = cell === color;
        minLow = function(newLow) {
          if (newLow < low[[i, j]]) {
            return low[[i, j]] = newLow;
          }
        };
        articulate = false;
        ref = this.neighbors(i, j);
        //children = 0
        for (z of ref) {
          [i2, j2] = z;
          if ((ref1 = this.cell[i2][j2]) !== color && ref1 !== EMPTY) { // stay within color
            continue;
          }
          if (depth[[i2, j2]] != null) {
            minLow(depth[[i2, j2]]);
          } else {
            //children++
            recurse(i2, j2, d + 1);
            nonempty[[i, j]] || (nonempty[[i, j]] = nonempty[[i2, j2]]);
            minLow(childLow = low[[i2, j2]]);
            if (nonempty[[i2, j2]] && childLow >= d) {
              //# If some child doesn't have a back pointer above us,
              //# we are an articulation point.
              articulate = true;
            }
          }
        }
        if (articulate && cell === EMPTY) {
          articulation.push([i, j]);
        }
        return void 0;
      };
      //children
      if ((root = this.firstCellMatching(color)) != null) {
        [i, j] = root;
        //# Root is an articulation point if it has >= 2 children.
        //# But we don't need to list this, because it isn't EMPTY.
        //if 2 <= recurse i, j, 0
        //  articulation.push [i,j]
        recurse(i, j, 0);
      }
      return articulation;
    }

    forceArticulation() {
      /*
      Return [i, j, color] triples for all empty cells forced by
      articulation point heuristic.
      */
      var color, forced, i, j, l, len, len1, m, ref, ref1;
      forced = [];
      ref = [BLACK, WHITE];
      for (l = 0, len = ref.length; l < len; l++) {
        color = ref[l];
        ref1 = this.articulation(color);
        for (m = 0, len1 = ref1.length; m < len1; m++) {
          [i, j] = ref1[m];
          forced.push([i, j, color]);
        }
      }
      if (forced.length) {
        return forced;
      }
    }

    isolated() {
      var color, count, l, len, ref;
      ref = [BLACK, WHITE];
      //# Check for two components of the same color that can't meet up.
      for (l = 0, len = ref.length; l < len; l++) {
        color = ref[l];
        ({count} = this.dfs(color));
        if (count > 1) {
          return true;
        }
      }
      return false;
    }

    prune() {
      return this.bad2x2() || this.alt2x2() || this.isolated();
    }

    forceBoundary() {
      /*
      Heuristic for coloring boundary circles.  Returns one of:
      * undefined: nothing learned
      * false: puzzle is unsolvable
      * Array of [i, j, c]: empty cells (i, j) must in fact be the color c
       */
      var alt, boundary, cbound, color, current, empty, i, isntColor, j, k, l, len, len1, m, num, opp, ref;
      boundary = this.boundaryCells();
      //# Count the number of black/white/empty circles on the boundary,
      //# and alternations between black and white (not counting wraparound).
      num = {
        [BLACK]: 0,
        [WHITE]: 0,
        [EMPTY]: 0
      };
      current = null;
      alt = 0;
      for (l = 0, len = boundary.length; l < len; l++) {
        [i, j] = boundary[l];
        color = this.cell[i][j];
        num[color]++;
        if (color !== EMPTY) {
          if (color !== current) {
            if (current != null) {
              alt++;
            }
            current = color;
          }
        }
      }
      //# Ensure there are both black and white colors on the boundary
      if (!(num[BLACK] && num[WHITE])) {
        return;
      }
      if (alt > 2) {
        //# Check for four alternating groups => puzzle unsolvable
        return false;
      }
      //# Check for something to do
      if (num[EMPTY] === 0) {
        return;
      }
      //# Check each color with multiple instances.
      empty = [];
      ref = [BLACK, WHITE];
      for (m = 0, len1 = ref.length; m < len1; m++) {
        color = ref[m];
        if (!(num[color] > 1)) {
          continue;
        }
        opp = opposite(color);
        //# Find some opposite color, and split the boundary there.
        k = boundary.findIndex(([i, j]) => {
          return this.cell[i][j] === opp;
        });
        console.assert(k >= 0, 'boundary no opposite color');
        cbound = boundary.slice(k + 1).concat(boundary.slice(0, k));
        //# Find longest (circular) interval of color
        k = cbound.findIndex(([i, j]) => {
          return this.cell[i][j] === color;
        });
        console.assert(k >= 0, 'boundary no color');
        cbound = cbound.slice(k);
        isntColor = ([i, j]) => {
          return this.cell[i][j] !== color;
        };
        while (isntColor(cbound[cbound.length - 1])) {
          cbound.pop();
        }
        //# Check for empty colors in the interval
        empty.push(...((function() {
          var len2, n, results;
          results = [];
          for (n = 0, len2 = cbound.length; n < len2; n++) {
            [i, j] = cbound[n];
            if (this.cell[i][j] === EMPTY) {
              results.push([i, j, color]);
            }
          }
          return results;
        }).call(this)));
      }
      if (!empty.length) {
        return;
      }
      return empty;
    }

    * solutions() {
      var c, cell, color, forced, heuristic, i, j, l, len, len1, len2, len3, m, n, o, ref, ref1;
      /*
      Generator for all solutions to a puzzle, yielding itself as it modifies
      into each solution.  Clone each result to store all solutions.
      */
      //return if @pruneSkip2x2()
      //console.log @toAscii(); console.log()
      //# Filled-in puzzle => potential solution
      if ((cell = this.bestEmptyCell()) == null) {
        if (this.solved()) {
          yield this;
        }
        return;
      }
      ref = [this.force2x2, this.forceBoundary, this.forceArticulation];
      //# Apply boundary, articulation, and 2x2 heuristics
      for (l = 0, len = ref.length; l < len; l++) {
        heuristic = ref[l];
        if ((forced = heuristic.call(this)) != null) {
          if (forced === false) {
            return;
          }
          for (m = 0, len1 = forced.length; m < len1; m++) {
            [i, j, c] = forced[m];
            this.cell[i][j] = c;
          }
          if (!this.prune()) {
            yield* this.solutions();
          }
          for (n = 0, len2 = forced.length; n < len2; n++) {
            [i, j, c] = forced[n];
            this.cell[i][j] = EMPTY;
          }
          return;
        }
      }
      //# Branch on first cell
      [i, j] = cell;
      this.branch++;
      ref1 = [BLACK, WHITE];
      for (o = 0, len3 = ref1.length; o < len3; o++) {
        color = ref1[o];
        this.cell[i][j] = color;
        yield* this.solutions();
        this.cell[i][j] = EMPTY;
      }
    }

    //console.log '< returning'
    solve() {
      var ref, solution;
      ref = this.solutions();
      /*
      Modify puzzle into a solution and return it, or undefined upon failure.
      Use clone() first if you want a copy instead of in-place modification.
      */
      for (solution of ref) {
        return solution;
      }
    }

    uniqueSolution() {
      var count, ref, solution;
      /*
      Returns false if no solution or solution isn't unique.
      Otherwise, returns number of branches required to determine unique solution.
      */
      this.branch = 0;
      count = 0;
      ref = this.solutions();
      for (solution of ref) {
        count++;
        if (count > 1) {
          return false;
        }
      }
      if (count === 1) {
        return this.branch;
      } else {
        return false;
      }
    }

    reduceUnique() {
      var cells, i, index, j, last, necessary, opp, other;
      cells = Array.from(this.filledCells());
      console.log(`reducing from ${this.numFilledCells()} clues`);
      while (cells.length) {
        //# Extract a candidate cell from the list
        index = Math.floor(Math.random() * cells.length);
        [i, j] = cells[index];
        last = cells.pop();
        if (index < cells.length) {
          cells[index] = last;
        }
        console.log(`testing ${cell2char[this.cell[i][j]]} at (${i}, ${j}) -- ${cells.length} clues remain`);
        opp = opposite(this.cell[i][j]);
        if (this.local2x2(i, j, opp) || this.local2x2alt(i, j, opp)) {
          necessary = false;
        } else {
          other = this.clone();
          other.cell[i][j] = opp;
          necessary = other.solve();
        }
        if (!necessary) {
          //# Clue wasn't necessary: empty it and report reduction.
          this.cell[i][j] = EMPTY;
          console.log(this.toAscii());
          console.log(`reducing from ${this.numFilledCells()} clues`);
        }
      }
      return this;
    }

    reducePrune() {
      var cells, i, index, j, last, necessary, old, opp;
      cells = Array.from(this.filledCells());
      while (cells.length) {
        index = Math.floor(Math.random() * cells.length);
        [i, j] = cells[index];
        old = this.cell[i][j];
        opp = opposite(old);
        necessary = true;
        if (this.local2x2(i, j, opp) || this.local2x2alt(i, j, opp)) {
          necessary = false;
        } else {
          this.cell[i][j] = opp;
          if (this.pruneExcept2x2()) {
            necessary = false;
          }
          this.cell[i][j] = old;
        }
        if (necessary) {
          //# Clue was necessary; remove from candidate list
          last = cells.pop();
          if (index < cells.length) {
            cells[index] = last;
          }
        } else {
          //# Clue wasn't necessary: empty it and start search over.
          this.cell[i][j] = EMPTY;
          break;
        }
      }
      return this;
    }

  };

  Viewer = class Viewer {
    constructor(svg1, puzzle1, solution1) {
      this.svg = svg1;
      this.puzzle = puzzle1;
      this.solution = solution1;
      this.backgroundRect = this.svg.rect(this.puzzle.ncol, this.puzzle.nrow).addClass('background');
      this.gridGroup = this.svg.group().addClass('grid');
      this.puzzleGroup = this.svg.group().addClass('puzzle');
      this.solutionGroup = this.svg.group().addClass('solution');
      this.drawGrid();
      this.drawPuzzle();
      this.drawSolution();
    }

    drawGrid() {
      var l, m, ref, ref1, x, y;
      this.gridGroup.clear();
      this.backgroundRect.size(this.puzzle.ncol, this.puzzle.nrow);
      for (x = l = 1, ref = this.puzzle.ncol; (1 <= ref ? l < ref : l > ref); x = 1 <= ref ? ++l : --l) {
        this.gridGroup.line(x, 0, x, this.puzzle.nrow);
      }
      for (y = m = 1, ref1 = this.puzzle.nrow; (1 <= ref1 ? m < ref1 : m > ref1); y = 1 <= ref1 ? ++m : --m) {
        this.gridGroup.line(0, y, this.puzzle.ncol, y);
      }
      this.gridGroup.rect(this.puzzle.ncol, this.puzzle.nrow).addClass('border');
      return this.svg.viewbox({
        x: 0 - majorWidth / 2,
        y: 0 - majorWidth / 2,
        width: this.puzzle.ncol + majorWidth,
        height: this.puzzle.nrow + majorWidth
      });
    }

    drawPuzzle() {
      var cell, l, len, len1, m, ref, row, x, y;
      this.puzzleGroup.clear();
      ref = this.puzzle.cell;
      for (y = l = 0, len = ref.length; l < len; y = ++l) {
        row = ref[y];
        for (x = m = 0, len1 = row.length; m < len1; x = ++m) {
          cell = row[x];
          if (cell === EMPTY) {
            continue;
          }
          this.puzzleGroup.circle(circleDiameter).center(x + 0.5, y + 0.5).addClass(cell2char[cell].toUpperCase());
        }
      }
      return void 0;
    }

    drawSolution() {
      var cell, l, len, len1, m, ref, row, x, y;
      this.solutionGroup.clear();
      if (this.solution == null) {
        return;
      }
      ref = this.solution.cell;
      for (y = l = 0, len = ref.length; l < len; y = ++l) {
        row = ref[y];
        for (x = m = 0, len1 = row.length; m < len1; x = ++m) {
          cell = row[x];
          if (cell === EMPTY) {
            continue;
          }
          if (this.puzzle.cell[y][x] !== EMPTY) {
            continue;
          }
          this.solutionGroup.circle(circleDiameter).center(x + 0.5, y + 0.5).addClass(cell2char[cell].toUpperCase());
        }
      }
      return void 0;
    }

  };

  Player = class Player extends Viewer {
    constructor(...args) {
      var event2coord, ignore, l, len, ref;
      super(...args);
      this.user = this.puzzle.clone();
      this.errorGroup = this.svg.group().addClass('error').insertAfter(this.backgroundRect);
      this.userGroup = this.svg.group().addClass('user');
      this.dashGroup = this.svg.group().addClass('dash');
      this.userCircles = {};
      this.highlight = this.svg.rect(1, 1).addClass('target').opacity(0);
      event2coord = (e) => {
        var ctm, pt, ref, ref1, zoom;
        //pt = @svg.point e.clientX, e.clientY
        //pt = new SVG.Point(e.offsetX, e.offsetY).transform(@svg.ctm().inverse())
        //pt = new SVG.Point(e.clientX, e.clientY).transform(@svg.screenCTM().inverse())
        //# Accomodate for CSS zoom, which RevealJS uses on Chrome, and related
        //# bug: https://bugs.chromium.org/p/chromium/issues/detail?id=1238104
        ctm = this.svg.screenCTM().inverse();
        zoom = document.querySelector('.slides').style.zoom || 1;
        if (zoom !== 1) {
          ctm.a /= zoom;
          ctm.d /= zoom;
        }
        pt = new SVG.Point(e.clientX, e.clientY).transform(ctm);
        pt.x = Math.floor(pt.x);
        pt.y = Math.floor(pt.y);
        if (!((0 <= (ref = pt.x) && ref < this.puzzle.ncol) && (0 <= (ref1 = pt.y) && ref1 < this.puzzle.nrow))) {
          return;
        }
        if (this.puzzle.cell[pt.y][pt.x] !== EMPTY) {
          return;
        }
        return pt;
      };
      this.svg.on('pointermove', (e) => {
        var pt;
        pt = event2coord(e);
        if (pt != null) {
          this.highlight.move(pt.x, pt.y).opacity(0.333);
          if (e.buttons && (this.lastColor != null)) {
            return this.toggle(pt.y, pt.x, this.lastColor, true);
          }
        } else {
          return this.highlight.opacity(0);
        }
      });
      this.svg.on('pointerleave', (e) => {
        this.highlight.opacity(0);
        return this.lastColor = void 0;
      });
      this.svg.on('pointerdown', (e) => {
        var pt, ref;
        if ((ref = e.button) === 0 || ref === 1 || ref === 2) {
          e.preventDefault();
        }
        pt = event2coord(e);
        if (pt == null) {
          return;
        }
        return this.toggle(pt.y, pt.x, (function() {
          switch (e.button) {
            case 0: // left click
              return void 0; // => cycle through 3 options
            case 1: // middle click
              return WHITE;
            case 2: // right click
              return EMPTY;
            case 5: // pen eraser
              return EMPTY;
          }
        })());
      });
      ref = ['click', 'contextmenu', 'auxclick'];
      for (l = 0, len = ref.length; l < len; l++) {
        ignore = ref[l];
        this.svg.on(ignore, function(e) {
          return e.preventDefault();
        });
      }
    }

    toggle(...args) {
      var copy, l, len, ref, ref1, results;
      ref1 = (ref = this.linked) != null ? ref : [this];
      results = [];
      for (l = 0, len = ref1.length; l < len; l++) {
        copy = ref1[l];
        results.push(copy.toggleSelf(...args));
      }
      return results;
    }

    toggleSelf(i, j, color, force) {
      var circle, group, l, len, ref, solved;
      if (this.userCircles[[i, j]] != null) {
        ref = this.userCircles[[i, j]];
        for (l = 0, len = ref.length; l < len; l++) {
          circle = ref[l];
          circle.remove();
        }
        delete this.userCircles[[i, j]];
      }
      if (color != null) {
        if (force || color === EMPTY) {
          this.user.cell[i][j] = color;
        } else {
          this.user.cell[i][j] = this.user.cell[i][j] === color ? EMPTY : color;
        }
      } else {
        this.user.cell[i][j] = (function() {
          switch (this.user.cell[i][j]) {
            case EMPTY:
              return BLACK;
            case BLACK:
              return WHITE;
            case WHITE:
              return EMPTY;
          }
        }).call(this);
      }
      this.lastColor = this.user.cell[i][j];
      if (this.lastColor !== EMPTY) {
        this.userCircles[[i, j]] = (function() {
          var len1, m, ref1, results;
          ref1 = [this.userGroup, this.dashGroup];
          results = [];
          for (m = 0, len1 = ref1.length; m < len1; m++) {
            group = ref1[m];
            results.push(group.circle(circleDiameter).center(j + 0.5, i + 0.5).addClass(cell2char[this.lastColor].toUpperCase()));
          }
          return results;
        }).call(this);
      }
      this.drawErrors();
      if (solved = this.user.solved()) {
        return this.svg.addClass('solved');
      } else {
        return this.svg.removeClass('solved');
      }
    }

    drawUser() {
      var cell, group, i, j, l, len, len1, m, ref, ref1, results, row;
      ref = [this.userGroup, this.dashGroup];
      for (l = 0, len = ref.length; l < len; l++) {
        group = ref[l];
        //# Force redraw of user solution (e.g. if changed externally)
        group.clear();
      }
      this.userCircles = {};
      ref1 = this.user.cell;
      results = [];
      for (i = m = 0, len1 = ref1.length; m < len1; i = ++m) {
        row = ref1[i];
        results.push((function() {
          var len2, n, results1;
          results1 = [];
          for (j = n = 0, len2 = row.length; n < len2; j = ++n) {
            cell = row[j];
            if (this.puzzle.cell[i][j] !== EMPTY) {
              continue;
            }
            results1.push(this.userCircles[[i, j]] = (function() {
              var len3, o, ref2, results2;
              ref2 = [this.userGroup, this.dashGroup];
              results2 = [];
              for (o = 0, len3 = ref2.length; o < len3; o++) {
                group = ref2[o];
                results2.push(group.circle(circleDiameter).center(j + 0.5, i + 0.5).addClass(cell2char[cell].toUpperCase()));
              }
              return results2;
            }).call(this));
          }
          return results1;
        }).call(this));
      }
      return results;
    }

    drawErrors() {
      var i, j, ref, ref1, results, x1, z;
      this.errorGroup.clear();
      ref = this.user.bad2x2s();
      for (z of ref) {
        [i, j] = z;
        this.errorGroup.rect(2, 2).center(j, i);
      }
      ref1 = this.user.alt2x2s();
      results = [];
      for (x1 of ref1) {
        [i, j] = x1;
        results.push(this.errorGroup.rect(2, 2).center(j, i).addClass('alt'));
      }
      return results;
    }

  };

  reviewGUI = function() {
    var branch, caption, click, clues, container, div, header, l, len, letter, puzzle, puzzles, ref, ref1, ref2, review, selection, solution;
    review = document.getElementById('review');
    selection = {};
    solution = {};
    ref = window.review;
    for (letter in ref) {
      puzzles = ref[letter];
      clues = (function() {
        var l, len, results;
        results = [];
        for (l = 0, len = puzzles.length; l < len; l++) {
          puzzle = puzzles[l];
          if (!puzzle.solution) {
            results.push(puzzle.clues);
          }
        }
        return results;
      })();
      branch = (function() {
        var l, len, results;
        results = [];
        for (l = 0, len = puzzles.length; l < len; l++) {
          puzzle = puzzles[l];
          if (!puzzle.solution) {
            results.push(puzzle.branch);
          }
        }
        return results;
      })();
      review.appendChild(header = document.createElement('h2'));
      header.innerHTML = `${letter} &mdash; ${puzzles.length} puzzles &mdash; clues [${Math.min(...clues)}, ${Math.max(...clues)}], branch [${Math.min(...branch)}, ${Math.max(...branch)}]`;
      review.appendChild(container = document.createElement('div'));
      container.className = 'container';
      for (l = 0, len = puzzles.length; l < len; l++) {
        puzzle = puzzles[l];
        container.appendChild(div = document.createElement('div'));
        div.className = 'review';
        new Viewer(SVG().addTo(div), Puzzle.fromAscii(puzzle.puzzle));
        div.appendChild(caption = document.createElement('figcaption'));
        if (puzzle.solution) {
          solution[letter] = puzzle.puzzle;
          caption.innerHTML = 'Solution';
          div.classList.add('solution');
        } else {
          caption.innerHTML = `<b>${puzzle.clues} clues</b>: ${puzzle.black} black, ${puzzle.white} white &mdash; <b>branch ${puzzle.branch}</b>`;
          div.addEventListener('click', click = (function(container, letter, div, puzzle) {
            return function() {
              container.querySelectorAll('.selected').forEach(function(el) {
                return el.classList.remove('selected');
              });
              div.classList.add('selected');
              return selection[letter] = puzzle.puzzle;
            };
          })(container, letter, div, puzzle));
          if (((ref1 = window.font) != null ? (ref2 = ref1[letter]) != null ? ref2.puzzle : void 0 : void 0) === puzzle.puzzle) {
            click();
          }
        }
      }
    }
    document.getElementById('downloadFont').addEventListener('click', function() {
      var out;
      out = {};
      for (letter in window.review) {
        if (!((solution[letter] != null) && (selection[letter] != null))) {
          continue;
        }
        out[letter] = {
          puzzle: selection[letter],
          solution: solution[letter]
        };
      }
      return FontWebapp.downloadFile('font.js', `window.font = ${window.stringify(out)};
`, 'text/javascript');
    });
    return document.getElementById('testInput').addEventListener('input', function() {
      document.getElementById('testOutput').innerHTML = '';
      return new Viewer(SVG().addTo('#testOutput'), Puzzle.fromAscii(document.getElementById('testInput').value));
    });
  };

  fontGUI = function() {
    var app, symbolCache;
    symbolCache = {};
    app = new FontWebappHTML({
      root: '#output',
      sizeSlider: '#size',
      charWidth: 225,
      charPadding: 5,
      charKern: 0,
      lineKern: 22.5,
      spaceWidth: 112.5,
      shouldRender: function(changed) {
        return changed.text;
      },
      renderChar: function(char, state, parent) {
        var letter, svg;
        char = char.toUpperCase();
        letter = window.font[char];
        if (letter == null) {
          return;
        }
        if (symbolCache[char] == null) {
          symbolCache[char] = [Puzzle.fromAscii(letter.puzzle), Puzzle.fromAscii(letter.solution)];
        }
        svg = SVG().addTo(parent);
        return new Player(svg, ...symbolCache[char]);
      },
      linkIdenticalChars: function(glyphs) {
        var glyph, l, len, results;
        results = [];
        for (l = 0, len = glyphs.length; l < len; l++) {
          glyph = glyphs[l];
          results.push(glyph.linked = glyphs);
        }
        return results;
      }
    });
    return document.getElementById('reset').addEventListener('click', function() {
      return app.render();
    });
  };

  if (typeof window !== "undefined" && window !== null) {
    window.onload = function() {
      var review;
      if (document.getElementById('review')) {
        return reviewGUI();
      } else if (review = document.getElementById('output')) {
        return fontGUI();
      } else if (review = document.getElementById('puzzle')) {
        return new Player(SVG().addTo('#puzzle'), Puzzle.fromAscii(window.puzzle));
      }
    };
  }

  exports = {Puzzle, Viewer, Player, BLACK, WHITE, EMPTY};

  if (typeof module !== "undefined" && module !== null) {
    module.exports = exports;
  }

  if (typeof window !== "undefined" && window !== null) {
    for (key in exports) {
      value = exports[key];
      window[key] = value;
    }
  }

}).call(this);
