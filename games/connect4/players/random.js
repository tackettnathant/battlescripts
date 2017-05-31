// A stupid random-guessing player
const player_random = function () {
  this.move = function (board) {
    for (let i=0; i<50; i++) {
      let c = Math.floor(Math.random() * 7);
      if (board[c].length<5) {
        return c;
      }
    }
  };
};
module.exports = player_random;
