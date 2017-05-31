"use strict";

const Match = function (game, players, config) {
  this.game = game || this.die("No game passed to start()");
  this.players = players || this.die("No players passed to start()");

  // Simple pub/sub
  let pubsub = {}, pubsub_id=0;
  this.subscribe = function(topic,func) {
    if (!pubsub[topic]) {
      pubsub[topic]=[];
    }
    let id = pubsub_id++;
    pubsub[topic].push({
      id:id,
      func:func
    });
    return id;
  };
  this.publish = function(topic,data) {
    if (!pubsub[topic]) { return false; }
    setTimeout(()=>{
      (pubsub[topic] || []).forEach((subscriber)=>{
        subscriber.func(data,topic);
      });
    },0);
    return true;
  };
  this.unsubscribe = function(id) {
    // TODO
  };

  this.started = false;
  // These are to be implemented later for games that allow multiple players to move on the same turn
  //this.waiting_on_players = {};
  //this.moves_recieved = {};

  this.config = { // Container for match config
    total_games: 1
    , move_delay: 0
    , time_limit: 0
    , move_type: "sequential"
    , render_type: "text/json"
    , render_history: false
  };
  Object.assign(this.config, config || {});
  this.reset_results(); //Results Container

};

Match.prototype.start = function (scenario) {
  if (this.started) {
    return this.die("ERROR: start() called by a match is already in progress!");
  }
  this.log("Starting Match");
  // Tell the world a match is starting
  this.publish("match.start", {"config": this.config, "scenario": this.scenario});

  this.scenario = scenario || {};
  this.reset_results();
  this.started = true;

  this.scenario.total_games = this.results.total_games;
  this.scenario.total_players = this.players.length;

  // Tell the Game to start a match
  // It can return a json object to pass to Players to start
  this.match_data = this.game.start_match(this.players, this.config, this.scenario);
  this.players.forEach((p, i) => {
    if (typeof p.start_match != "function") {
      return;
    }
    p.start_match({
      player_number: i,
      total_games: this.config.total_games,
      data: this.match_data
    });
  })
  ;

  // Trigger a game to start
  setTimeout(()=>{ this.start_game(); },0);
};

Match.prototype.start_game = function () {
  // Tell the world a game is starting
  this.publish("game.start", this.results);

  // Tell the Game to start a new game
  // It can optionally return data to tell each player when they start
  let game_data = this.game.start_game(this.results) || [];
  this.publish("game.setup", game_data.player_data);
  this.players.forEach(function (p, i) {
    if (typeof p.start_game != "function") {
      return;
    }
    p.start_game(game_data.player_data[i] || {});
  });

  // Render the initial state
  this.render(true);

  // Start asking players for moves
  setTimeout(()=>{ this.get_next_move(); },0);
};

Match.prototype.get_next_move = function() {
  // Game Loop
  let game_results = this.game.is_game_over();
  if (!game_results) {
    // Tell the game to do something
    let move_request = this.game.get_next_move();
    // If it's a single player request, make it an array
    if (!move_request.length) {
      move_request = [move_request];
    }

    // Ask the player(s) to move
    move_request.forEach((req) => {
      let p = this.players[req.player_number];
      let player_move = p.move(req.data || {});

      // Tell the game about this player's move
      try {
        this.game.move(req.player_number, player_move);
      }
      catch (results) {
        // If the game throws an exception on a move, the move was invalid
        // Inform the player?
        // End the game with a winner?
        // TODO: Decide what to do here
        throw results;
      }
    });
    this.render();
    // Do it in a loop until the game is over
    setTimeout(()=>{ this.get_next_move(); },this.config.move_delay);
  }
  else {
    // Game is over!
    setTimeout(()=>{ this.end_game(game_results); });
  }
};

Match.prototype.end_game = function (game_results) {
  if (game_results.draw) {
    this.results.draws++// No winner
  }
  else {
    this.results.player_wins[game_results.winner]++;
  }
  this.results.games_played++;
  this.results.current_game++;

  this.game.end_game(game_results);

  this.players.forEach(function (p) {
    if (typeof p.end_game != "function") {
      return;
    }
    p.end_game(game_results);
  });

  this.publish("game.end", game_results);
  this.publish("match.results", this.results);

  if (this.results.current_game < this.results.total_games) {
    setTimeout(()=>{ this.start_game(); },0);
  }
  else {
    setTimeout(()=>{ this.end_match(); },0);
  }
};

Match.prototype.end_match = function () {
  this.game.end_match(this.results);

  // Tell each player that the match has ended?
  this.players.forEach((p) => {
    if (typeof p.end_match != "function") {
      return;
    }
    p.end_match(this.results);
  })
  ;

  this.results.current_game = 0;
  this.started = false;

  this.publish("match.end", this.results);
  this.publish("match.results", this.results);
};

Match.prototype.render = function(new_game) {
  let state = this.game.render(this.config.render_type);
  // Store this render state in the list
  if (this.config.render_history) {
    if (new_game) {
      // Make a new slot for this game's render history
      this.results.render_history.push([]);
    }
    this.results.render_history[this.results.current_game].push(state);
  }
  this.publish("game.render", state);
};

Match.prototype.reset_results = function () {
  this.results = {
    total_games: this.config.total_games,
    games_played: 0,
    current_game: 0,
    player_wins: new Array(this.players.length).fill(0),
    draws: 0,
    render_history: []
  };
  this.publish("match.results", this.results);
};

Match.prototype.log = function (message) {
  console.log(message);
  this.publish("match.log", typeof s === "object" ? JSON.stringify(message) : message);
};

Match.prototype.die = function (msg) {
  throw new Error(msg);
};

module.exports = Match;
