

// TODO: More/Better documentation.

// React stuff.
import React from 'react';
import ReactDOM from 'react-dom';

// I don't know why this is necessary?
import './index.css';

// This package helps manage this.state and this.setState() stuff.
import update from 'immutability-helper';

class Square extends React.Component {
  constructor(props) {
    super(props);
    var isOn = false;
    if (props.value) {
      isOn = true;
    }

    this.state = {
      isOn: isOn
    };
  }

  render() {
    return (
      <button className="square" onClick={() => this.handleClick()}>
        {this.getDisplay()}
      </button>
    );
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      isOn: nextProps.value
    });
  }

  getDisplay() {
    if (this.state.isOn) {
      return "X";
    } else {
      return " ";
    }
  }

  handleClick() {
    if (this.props.onClick) {
      this.props.onClick();
    }
  }
}


class Board {

  constructor(rows, cols, startMoves) {
    this.rows = rows;
    this.cols = cols;
    this.immutable = false;

    if (startMoves === undefined || startMoves === null) {
      startMoves = 1;
    }

    // Squares are stored [rows][cols]
    this.squares = [];
    for (let i = 0; i < this.rows; i++) {
      this.squares.push([]);
      for (let j = 0; j < this.cols; j++) {
        this.squares[i].push(false);
      }
    }

    // TODO: Initialize the board to something interesting.
    for (let i = 0; i < startMoves; i++) {
      let r = this.randomInt(this.rows);
      let c = this.randomInt(this.cols);
      this.doMove(r, c);
    }
  }

  // Helper function.
  randomInt(max) {
    return Math.floor(Math.random() * max);
  }

  // Returns whether the square is on.
  getSquare(r, c) {
    return this.squares[r][c];
  }

  // Sets whether the square is on.
  setSquare(r, c, isOn) {
    if (this.immutable) {
      var newBoard = this.copy();
      return newBoard.setSquare(r, c, isOn);
    }

    this.squares[r][c] = isOn;
    return this;
  }

  // Uses getSquare and setSquare to flip a square.
  flipSquare(r, c) {
    var original = this.getSquare(r, c);
    return this.setSquare(r, c, !original);
  }

  doMove(r, c) {
    if (this.immutable) {
      var newBoard = this.copy();
      return newBoard.doMove(r, c);
    }

    // Flip this square.
    this.flipSquare(r, c);

    // Flip all the squares around it.
    for (var coords of this.getNeighborCoords(r, c)) {
      this.flipSquare(coords.r, coords.c);
    }

    return this;
  }

  // Returns a deep copy of this board.
  copy() {
    if (!this.immutable) {
      console.log("Warning: Unnecessary Board.copy() call.");
      console.trace();
    }

    var newBoard = new Board(this.rows, this.cols, 0);
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        newBoard.setSquare(r, c, this.getSquare(r, c));
      }
    }

    return newBoard;
  }

  makeImmutable() {
    this.immutable = true;
    return this;
  }

  // Returns all neighboring squares. Does not return the given square.
  // It's a generator; yields {r: r, c:c} objects.
  * getNeighborCoords(r, c) {
    for (var i = -1; i < 2; i++) {
      for (var j = -1; j < 2; j++) {
        // Coords for the current square.
        var newR = r + i;
        var newC = c + j;
        
        // Check if this is the original square.
        if (newR === r && newC === c) {
          continue;
        }

        // Check if the square is off the edge of the board.
        if (newR < 0 || newR >= this.rows) {
          continue;
        }
        if (newC < 0 || newC >= this.cols) {
          continue;
        }

        // Return it.
        yield {r: newR, c: newC};
      }
    }
  }

  isWin() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.getSquare(r, c)) {
          return false;
        }
      }
    }

    // All squares are false.
    return true;
  }
}

// This is a grid of squares. The width is in this.cols, the height is in this.rows.
// When the board is made, the squares are initialized using this.startMoves random
// moves.
class BoardView extends React.Component {
  
  constructor(props) {
    super(props);

    // The dimensions of the board.
    // TODO: Make these into properties.
    var rows = props.rows;
    var cols = props.cols;
    var moves = props.moves;

    // Set the initial state.
    this.state = {
      board: new Board(rows, cols, moves).makeImmutable()
    };
  }

  // Returns whether the square is on.
  getSquare(r, c) {
    return this.state.board.getSquare(r, c);
  }

  getRows() {
    return this.state.board.rows;
  }

  getCols() {
    return this.state.board.cols;
  }

  // Returns the HTML for a square.
  renderSquare(r, c) {
    return <Square
      key={[r, c].toString()}
      value={this.getSquare(r, c)}
      onClick={() => this.handleSquareClicked(r, c)}
      />;
  }

  // Renders the whole board.
  render() {
    var ret = [];
    for (let r = 0; r < this.getRows(); r++) {
      var row = [];
      for (let c = 0; c < this.getCols(); c++) {
        row.push(this.renderSquare(r, c));
      }
      ret.push(
          <div key={r.toString()} className="board-row">
          {row}
          </div>
      );
    }
    return (
        <div>
        {ret}
        </div>
        );
  }

  handleSquareClicked(r, c) {
    if (this.props.freezeGame) {
      return;
    }

    var newBoard = this.state.board.doMove(r, c).makeImmutable();
    this.setState({board: newBoard});

    if (this.props.onMove) {
      this.props.onMove();
    }

    if (this.props.onWin && newBoard.isWin()) {
      this.props.onWin();
    }
  }

  componentWillReceiveProps(newProps) {
    if (newProps.rows !== this.props.rows
        || newProps.cols !== this.props.cols
        || newProps.moves !== this.props.moves
        || newProps.gameID !== this.props.gameID
       ) {
         this.setState({
           board: new Board(newProps.rows, newProps.cols, newProps.moves)
         });
    }
  }
}

class IncDecButton extends React.Component {
  render() {
    return (
        <div>
          <button
            key="+"
            onClick={() => this.handleChange(1)}
            >{this.props.name + "+"}</button>
          <button
            key="-"
            onClick={() => this.handleChange(-1)}
            >{this.props.name + "-"}</button>
        </div>
    );
  }

  handleChange(delta) {
    if (this.props.onChange) {
      this.props.onChange(delta);
    }
  }
}

class Game extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      isWin: false,
      moveCount: 0,
      gameID: 0,      // Hack to force Board to reset whenever New Game is pressed.
      rows: 4,
      cols: 4,
      difficulty: 0   // moves = 2 ^ difficulty
    }
  }

  renderWin() {
    if (this.state.isWin) {
      return (
          <div>You win!</div>
      );
    } else {
      return "";
    }

  }

  renderBoard() {
    return (
        <BoardView
        onMove={() => this.handleMove()}
        onWin={() => this.handleWin()}
        freezeGame={this.state.isWin}
        rows={this.state.rows}
        cols={this.state.cols}
        moves={this.calcMoves()}
        gameID={this.state.gameID}
        />
    );
  }

  renderButtons() {
    return (
        <div>
          <IncDecButton
            key="rows"
            onChange={(delta) => this.handleRowChange(delta)}
            name="rows"
            />
          <IncDecButton
            key="cols"
            onChange={(delta) => this.handleColChange(delta)}
            name="cols"
            />
          <IncDecButton
            key="difficulty"
            onChange={(delta) => this.handleDifficultyChange(delta)}
            name="difficulty"
            />
          <button onClick={() => this.handleNewGame()}>New Game</button>
        </div>
    );
  }

  
  render() {
    return (
      <div className="game">
        <div className="game-board">
          {this.renderBoard()}
        </div>
        <div className="game-info">
          <div>Your goal: {"Remove all X's from the board!"}</div>
          <div>Move count: {this.state.moveCount}</div>
          <div>Current Difficulty: {this.state.difficulty}</div>
          {this.renderButtons()}
          {this.renderWin()}
        </div>
      </div>
    );
  }

  calcMoves() {
    var ret = Math.pow(2, this.state.difficulty);
    console.log(ret);
    return ret;
  }

  handleMove() {
    if (this.state.isWin) {
      throw "Error: Game.handleMove() called after Game.handleWin()"
    }
    
    var newState = update(this.state, {
      moveCount: {$apply: (x) => x + 1}
    });
    this.setState(newState);
  }

  handleWin() {
    if (this.state.isWin) {
      throw "Error: Game.handleWin() called more than once"
    }

    // Note: this clobbers any state change from handleMove().
    var newState = update(this.state, {
      moveCount: {$apply: (x) => x + 1},
      isWin: {$set: true}
    })
    this.setState(newState);
  }

  applyNewGame(state) {
    return update(state, {
      moveCount: {$set: 0},
      isWin: {$set: false},
      gameID: {$apply: (x) => x + 1}
    });
  }

  handleRowChange(delta) {
    var newState = update(this.state, {
      rows: {$apply: (x) => Math.max(x + delta, 2)}
    });
    newState = this.applyNewGame(newState);
    this.setState(newState);
  }

  handleColChange(delta) {
    var newState = update(this.state, {
      cols: {$apply: (x) => Math.max(x + delta, 2)}
    });
    newState = this.applyNewGame(newState);
    this.setState(newState);
  }

  handleDifficultyChange(delta) {
    
    var newState = update(this.state, {
      difficulty: {$apply: (x) => Math.max(x + delta, 0)}
    });
    newState = this.applyNewGame(newState);
    this.setState(newState);
  }

  handleNewGame() {
    var newState = this.applyNewGame(this.state);
    this.setState(newState);
  }

}

// ========================================

// I don't know what this does.
ReactDOM.render(
  <Game />,
  document.getElementById('root')
);

