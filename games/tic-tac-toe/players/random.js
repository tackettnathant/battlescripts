// A stupid random-guessing player
const player_random = function () {
  this.move = function (board) {
    // Try 50 times to move
    for (var i = 0; i < 50; i++) {
      var m = Math.floor(Math.random() * 9);
      if (board[m] == -1) {
        return m;
      }
    }
    return 0;
  }
};
module.exports = player_random;
