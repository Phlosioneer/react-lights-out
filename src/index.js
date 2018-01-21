
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
      return "O";
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
      console.log("setSquare: this.immutable = true");
      var newBoard = this.copy();
      return newBoard.setSquare(r, c, isOn);
    }

    console.log("setSquare(" + r + ", " + c + ", " + isOn + ")");

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
    console.log("getNeighborCoords(" + r + ", " + c + ")");
    for (var i = -1; i < 2; i++) {
      for (var j = -1; j < 2; j++) {
        // Coords for the current square.
        var newR = r + i;
        var newC = c + j;
        console.log("i=" + i + " j=" + j + " newR: " + newR + " newC: " + newC);
        
        // Check if this is the original square.
        if (newR === r && newC === c) {
          console.log("Original square.");
          continue;
        }

        // Check if the square is off the edge of the board.
        if (newR < 0 || newR >= this.rows) {
          console.log("Row max: " + this.rows);
          continue;
        }
        if (newC < 0 || newC >= this.cols) {
          console.log("Col max: " + this.cols);
          continue;
        }

        // Return it.
        yield {r: newR, c: newC};
      }
    }
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
          </div>);
    }
    return (
        <div>
        {ret}
        </div>
        );
  }

  handleSquareClicked(r, c) {
    var newBoard = this.state.board.doMove(r, c).makeImmutable();
    this.setState({board: newBoard});
  }

}


class Game extends React.Component {
  render() {
    return (
      <div className="game">
        <div className="game-board">
          <BoardView />
        </div>
        <div className="game-info">
          <div>{/* status */}</div>
          <ol>{/* TODO */}</ol>
        </div>
      </div>
    );
  }
}

// ========================================

// I don't know what this does.
ReactDOM.render(
  <Game />,
  document.getElementById('root')
);

