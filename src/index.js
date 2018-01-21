
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

  // React gave a warning for spelling Receive wrong. Neat!
  componentWillReceiveProps(nextProps) {
    // I do it this way because otherwise newValue isn't false
    // when nextProps.value = undefined.
    var newValue = false;
    if (nextProps.value) {
      newValue = true;
    }

    this.setState({
      isOn: newValue
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
      this.doMove(0, 0);
    }
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
    console.log(this.squares);
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        let isOn = this.getSquare(r, c);
        if (this.getSquare(r, c)) {
          return false;
        }
      }
    }

    // All squares are false.
    return true;
  }
}

// This is a gird of squares. The width is in this.cols, the height is in this.rows.
// When the board is made, the squares are initialized using this.startMoves random
// moves.
class BoardView extends React.Component {
  
  constructor(props) {
    super(props);

    // The dimensions of the board.
    // TODO: Make these into properties.
    var rows = 3;
    var cols = 3;


    // Set the initial state.
    this.state = {
      board: new Board(rows, cols).makeImmutable()
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

}


class Game extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      isWin: false,
      moveCount: 0
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
  
  render() {
    return (
      <div className="game">
        <div className="game-board">
          <BoardView
            onMove={() => this.handleMove()}
            onWin={() => this.handleWin()}
            freezeGame={this.state.isWin}
            />
        </div>
        <div className="game-info">
          <div>Your goal: {"Remove all X's from the board!"}</div>
          <div>Move count: {this.state.moveCount}</div>
          {this.renderWin()}
        </div>
      </div>
    );
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

    var newState = update(this.state, {
      isWin: {$set: true}
    })
    this.setState(newState);
  }
}

// ========================================

// I don't know what this does.
ReactDOM.render(
  <Game />,
  document.getElementById('root')
);

