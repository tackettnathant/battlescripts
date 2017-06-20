importScripts("../../player-api.js", "../../../js/lodash.js");

_.mixin({
  lessEq: function(a, b) { return b <= a && b !== 0; },
  greaterEq: function(a, b) { return b >= a; }
});

//A simplified reflex agent
var reflex = {
  initialState: undefined,
  goal: undefined,
  nextGoal: function(state) {
    return _.find([
      (state.elevator_capacity === state.elevator_carrying) ? 1 : 0,
      1 + _.findIndex(state.waiting_passengers, _.partial(_.greaterEq, state.elevator_capacity)),
      1 + _.findLastIndex(state.waiting_passengers, _.partial(_.lessEq, state.elevator_capacity - state.elevator_carrying)),
      1
    ], _.partial(_.greaterEq, 1));
  },
  move: function(state) {
    if(!this.initialState) this.initialState = state;
    
    if(this.goal === undefined)
      this.goal = this.nextGoal(state);
    
    if(state.elevator_open) { this.goal = undefined; return "CLOSE"; }
    else if(this.goal === state.elevator_floor) return "OPEN";
    else if(this.goal > state.elevator_floor) return "UP";
    else if(this.goal < state.elevator_floor) return "DOWN";
    else return "SELF_DESTRUCT";
  }
};

function Player() {
  this.init = function() { };
  this.start = function(config) { };
  this.error = function() { log("Error Recieved:" + JSON.stringify(arguments)); };
  this.end = function(results) {
    if(!results.won)
      log("Lost game" + JSON.stringify(reflex.initialState));
    reflex.initialState = undefined;
  };
  
  this.move = function(state) {
    //A reflex agent find the obvious moves
    return move(reflex.move(state));

  };
}