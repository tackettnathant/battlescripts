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

  , clone: function(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

};

const Connect4 = function () {
  // A 7x6 array to represent the board
  this.state = [ [],[],[],[],[],[],[] ];
  this.winning_moves = [ [],[],[],[],[],[],[] ];
  this.current_player = 0;
  this.first_player = 0;
  this.last_move = null;
  this.last_player = null;

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
    this.current_player = 1-this.current_player;

    // Tell Match who should move and what data they should be sent
    return {
      player_number: this.current_player
      , data: GameUtil.clone(this.state)
    };
  };

  // Check if the game is over
  this.is_game_over = function () {
    if (this.last_move===null) { return false; }
    // A game can only become over from the last move, so only check outward from that point
    let player = this.last_player;
    let col = this.state[this.last_move];
    let move_col = this.last_move;
    let move_row = col.length-1;
    //console.log(`Last move: ${move_col},${move_row}\n`);
    let is_player = (c,r)=>{
      var ret = false;
      if (r>=0 && c>=0 && r<6 && c<7 && typeof this.state[c][r]!="undefined" && this.state[c][r]==player) { ret = true; }
      //console.log(`is_player(${c},${r}) = ${ret}`);
      return ret;
    };
    // winning lines need to be next to each other in any direction
    // Search outward from the last move
    let checks = [
       [ [-1, 0],[1, 0] ]
      ,[ [ 0,-1],[0, 1] ]
      ,[ [-1,-1],[1, 1] ]
      ,[ [-1, 1],[1,-1] ]
    ];
    for (let i=0; i<checks.length; i++) {
      let check = checks[i];
      //console.log(`Checking ${check}\n`);
      let total=1; // total squares counted in line
      this.winning_moves = [ [],[],[],[],[],[],[] ];
      this.winning_moves[move_col][move_row]=true;

      for (let j=0; j<=1; j++) {
        let c = move_col + check[j][0];
        let r = move_row + check[j][1];
        while (is_player(c, r)) {
          total++;
          this.winning_moves[c][r]=true;
          c = c + check[j][0];
          r = r + check[j][1];
        }
      }
      //console.log(`total:${total}\n`);
      if (total>=4) {
        return {
          winner: player
        }
      }
    }
    this.winning_moves = [ [],[],[],[],[],[],[] ];
    //Check for Draw
    for (let i=0; i<7; i++) {
      if (this.state[i].length<6) {
        return false;
      }
    }
    // If we got here, it's a draw
    return {
      draw:true
    };
  };

  // Handle a player move
  this.move = function (player_number, move) {
    let col = this.state[move];
    if (col.length===6) {
      throw "Invalid move, column is already full!";
    }
    col.push(player_number);
    this.last_move = move;
    this.last_player = player_number;
  };

  // Paint the game
  this.render = function (mime_type) {
    if ("text/plain"!==mime_type) {
      return this.state;
    }

    let board = "";
    for (let i=5; i>=0; i--) {
      let row=[];
      for (let col=0; col<7; col++) {
        if (typeof this.state[col][i]=="undefined") {
          row.push(" ");
        }
        else {
          var p = this.state[col][i];
          if (this.winning_moves[col][i]) {
            row.push(["X", "O"][p]);
          }
          else {
            row.push(["x", "o"][p]);
          }
        }
      }
      board += row.join("|")+"\n";
    }
    board += "-+-+-+-+-+-+-\n";
    return board;
  };

  // Called when a game ends
  this.end_game = function (data) {
    // Increment the player to start first next game
    this.first_player = 1 - this.first_player;
  };

  // Called when the whole match is over
  this.end_match = function (results) {
    // Typically do nothing
  };
};
module.exports = Connect4;
