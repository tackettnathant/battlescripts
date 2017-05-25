const Game = function () {
  this.state = {
    board: []
  };
  this.first_player = 1; // Player #1 goes first in the first game, will rotate for next games
  this.current_player = this.first_player;

  this.start_match = function (players, config, scenario) {
    // Return match-level data
    return {};
  };

  this.start_game = function (results) {
    this.state.board = [-1, -1, -1, -1, -1, -1, -1, -1, -1];

    // Increment the player to start first next game
    this.first_player = 1 - this.first_player;

    return {
      player_data: [{}, {}]
    };
  };

  // Return a json structure to render
  this.render = function (render_type) {
    // Convert the display board into X's and O's
    var b = [];
    for (var i = 0; i < 9; i++) {
      b[i] = [" ", "X", "O"][this.state.board[i] + 1];
    }
    if ("text/plain" == render_type) {
      // Render a plain text version of the board
      var separator = "-+-+-\n";
      return `${b[0]}|${b[1]}|${b[2]}\n${separator}${b[3]}|${b[4]}|${b[5]}\n${separator}${b[6]}|${b[7]}|${b[8]}\n\n`;
    }
    else {
      // Otherwise return JSON for rendering by the host environment
      return {board:b};
    }
  };

  // Tell the game controller which player should move next and pass them game state
  this.get_next_move = function () {
    // Switch to the next player
    this.current_player = 1 - this.current_player;
    return {
      player_number: this.current_player
      , data: this.state.board
    };
  };

  // Accept a move from a player
  this.move = function (player_number, move) {
    // Validate move
    if (move < 0 || move > 8) {
      throw "BAD MOVE!";
    }
    if (this.state.board[move] != -1) {
      throw "BAD MOVE!";
    }

    this.state.board[move] = player_number;
  };

  // If the game is over, return the results
  this.is_game_over = function () {
    var wins = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    var b = this.state.board;
    for (var i = 0; i < wins.length; i++) {
      var x = wins[i];
      if (b[x[0]] >= 0 && b[x[0]] == b[x[1]] && b[x[1]] == b[x[2]]) {
        var winner = b[x[0]];
        return {
          winner: winner
        }
      }
    }
    // If there are no wins and the board is full, it's a draw
    if (!b.includes(-1)) {
      return {
        draw: true
      };
    }
    return false;
  };

};
module.exports = Game;
