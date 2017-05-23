/*

 A console-based host environment POC for Node

 */
var Match = require('./Match.js');
var Game = require('./games/tic-tac-toe/game.js');
var RandomPlayer = require('./games/tic-tac-toe/players/random.js');

var player1 = new RandomPlayer();
var player2 = new RandomPlayer();

var game = new Game();
var match = new Match(game, [player1, player2], {
  "total_games": 5,
  "render_type": "text/plain",
  "move_delay": 250,
  "render_history": true
});

// We show what's happening by subscribing to events published by Match

match.subscribe("game.render", function (data) {
  console.log(data);
});
match.subscribe("match.start", function (data) {
  console.log(`NEW MATCH!\n${JSON.stringify(data)}\n\n`);
});
match.subscribe("game.start", function (data) {
  console.log(`Game #${data.current_game}\n\n`);
});
match.subscribe("game.end", function (data) {
  console.log(`Game Over\n${JSON.stringify(data)}`);
});
match.subscribe("match.end", function (data) {
  console.log(`MATCH END\n${JSON.stringify(data, null, 3)}`);
});

match.start();
