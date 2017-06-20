importScripts("../../player-api.js", "../../../js/lodash.js");

function Player() {
  var self = this;
  this.init = function() {
  };
  this.makeGoal = function(state) {
    var goal;
    if(state.elevator_capacity === state.elevator_carrying)
      goal = 0;
    else {
      var goal = _.findLastIndex(state.waiting_passengers, function(x) { return x >= state.elevator_capacity; });
      if( goal === -1 ) {
        //TOPDOWN
        goal = _.findLastIndex(state.waiting_passengers);
        if(goal === -1)
          goal = 0;
      }
    }
    //log("Goal of " + goal + " for "+ JSON.stringify(state));
    return goal + 1;
  };
  this.move = function(state) {
    if(self.goal === undefined)
      self.goal = self.makeGoal(state);
      
    var m;
      
    if(self.goal === 0)
      m = this.solution.shift();
    else if(state.elevator_open) {
      m =  "CLOSE";
      self.goal = undefined;
    } else if(self.goal === state.elevator_floor)
      m = "OPEN";
    else if(self.goal > state.elevator_floor)
      m = "UP";
    else
      m = "DOWN";
    
    return move(m);
  };
}
