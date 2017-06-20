var GameUtil = {
  // Build an array of objects
  fill_array: function (num, o) {
    var a = [];
    for (var i = 0; i < num; i++) {
      if (typeof o == "object") {
        a[i] = JSON.parse(JSON.stringify(o));
      }
      else {
        a[i] = o;
      }
    }
    return a;
  }

  , random: function (min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

};

const Game = function () {
  // Game state JSON object for Angular rendering
  this.canvas = {};
  this.current_player = 0;
  this.first_player = 0;

  // Called at the start of each multi-game match.
  this.start_match = function (players, config, scenario) {

    // Return the data to be passed to each player's start_match() method
    return {};
  };

  // Called at the start of each game
  this.start_game = function () {
    this.current_player = this.first_player;
    // Return data per player that will be passed to the player's start_game() method
    return {"player_data": []};
  };

  // Request a move from a player.
  // Internally, build a JSON structure that the player can see that may be different from the global game state
  this.get_next_move = function () {
    let data = {};

    this.current_player = 1-this.current_player;

    // Tell Match who should move and what data they should be sent
    return {
      player_number: this.current_player
      , data: data
    };
  };

  // Check if the game is over
  this.is_game_over = function () {
    let over = false;
    if (over) {
      return {
        winner: this.current_player
      }
    }
    return false;
  };

  // Handle a player move
  this.move = function (player_number, move, data) {

    // Validate move
    if (!valid) {
      throw "Invalid move!";
    }

  };

  // Paint the game
  this.render = function () {
    return this.canvas;
  };

  // Called when a game ends
  this.game_end = function (data) {
    // Increment the player to start first next game
    this.first_player = 1 - this.first_player;
  };

  // Called when the whole match is over
  this.match_end = function (results) {
    // Typically do nothing
  };
};
module.exports = Game;