importScripts("../../player-api.js", "../../../js/lodash.js");


_.mixin(_, {
  sum: function(xs) { return _.reduce(xs,function(acc,x) { return acc + x; },0) }
});

//You know what a priorityQueue is right?
function PriorityQueue(a){this._comparator=a||PriorityQueue.DEFAULT_COMPARATOR,this._elements=[]}PriorityQueue.DEFAULT_COMPARATOR=function(a,b){return a instanceof Number&&b instanceof Number?a-b:(a=a.toString(),b=b.toString(),a==b?0:a>b?1:-1)},PriorityQueue.prototype={_swap:function(a,b){var c=this._elements[a];this._elements[a]=this._elements[b],this._elements[b]=c},_compare:function(a,b){return this._comparator(this._elements[a],this._elements[b])},size:function(){return this._elements.length},isEmpty:function(){return 0===this.size()},remove:function(a){return this._elements.splice(a,1),this.size()},peek:function(){if(this.isEmpty())throw new Error("Priority Queue is empty");return this._elements[0]},pop:function(){var a=this.peek(),b=this._elements.pop(),c=this.size();if(0===c)return a;this._elements[0]=b;for(var d=0;c>d;){var e=d,f=2*d+1,g=2*d+2;if(c>f&&this._compare(f,e)>0&&(e=f),c>g&&this._compare(g,e)>0&&(e=g),e===d)break;this._swap(e,d),d=e}return a},push:function(a){for(var b=this._elements.push(a),c=b-1;c>0;){var d=Math.floor((c-1)/2);if(this._compare(c,d)<0)break;this._swap(d,c),c=d}return b}};

//A formalization of the Elevator Action Problem described by http://mattkruse.com
var elevActnProb = {
  initialState: undefined,
  solution: undefined,
  cost: function() { return 1; },
  goal: function(state) { return 0 === _.sum(state.waiting_passengers) && state.elevator_floor === 1 && state.elevator_carrying === 0; }, 
  hash: function(state) { return state.elevator_floor + ":" + state.elevator_carrying + ":" + state.elevator_open + ":" + state.waiting_passengers.toString(); },
  heuristic: function(state) {
    var numOccfloors = _.without(state.waiting_passengers,0).length;
    return 2 * numOccfloors + state.elevator_floor - 1;
    //return 0;
  },
  actions: function(state) {
    if(state.elevator_open) return ["CLOSE"];
    if(state.elevator_carrying === state.elevator_capacity && state.elevator_floor === 1) return ["OPEN"];
    if(state.elevator_carrying === state.elevator_capacity && state.elevator_floor !== 1) return ["DOWN"];
    if(state.elevator_floor === 1 && state.elevator_carrying === 0) return ["UP"];
    if(state.elevator_floor === 1) return ["UP", "OPEN"];
    var as = ["DOWN", "UP"];
    if(state.elevator_floor === state.waiting_passengers.length) as.pop();
    if(state.waiting_passengers[state.elevator_floor - 1] !== 0 || state.elevator_floor === 1) as.push("OPEN");
    return as;
  },
  succ: function(state, action) {
    var stateP = _.clone(state, true);
    
    if(action === "UP") stateP.elevator_floor++;
    if(action === "DOWN") stateP.elevator_floor--;
    if(action === "CLOSE") stateP.elevator_open = false;
    if(action === "OPEN") {
      stateP.elevator_open = true;
      
      if (stateP.elevator_floor === 1) {
        stateP.elevator_carrying = 0;
      } else {
        var taken = Math.min(
          stateP.waiting_passengers[stateP.elevator_floor-1], 
          stateP.elevator_capacity - stateP.elevator_carrying
        );
        stateP.elevator_carrying += taken;
        stateP.waiting_passengers[state.elevator_floor-1] -= taken;
      }
    }
    return stateP;
  }
};


//A simplified reflex agent
var reflex = {
  goal : undefined,
  goalState : function(state) { var stateP = _.clone(state, true); stateP.waiting_passengers = _.map(state.waiting_passengers, function(n) { return n - state.elevator_capacity * Math.floor(n / state.elevator_capacity);}); return stateP; },
  lastFloorGEq : function(state, n) { return 1 + _.findLastIndex(state.waiting_passengers, function(x) { return x >= n }); },
  nextGoal : function(state) {
    if(state.elevator_capacity === state.elevator_carrying)
      return 1;
    
    var floor = this.lastFloorGEq(state, state.elevator_capacity);
    if(floor === 0)
      throw "No reflex goal";
    return floor;
  },
  move : function(state) {
    if(this.goal === undefined)
      this.goal = this.nextGoal(state);
    
    if(state.elevator_open) { this.goal = undefined; return "CLOSE"; }
    else if(this.goal === state.elevator_floor) return "OPEN";
    else if(this.goal > state.elevator_floor) return "UP";
    else if(this.goal < state.elevator_floor) return "DOWN";
    else return "SELF_DESTRUCT";
  }
};

var search = {
  problem: undefined,
  frontier : new PriorityQueue(function(a,b) { return b.cost - a.cost; }),
  frontierHash: {},
  closed: {},
  init: function(problem) {
    log(problem.initialState);
    this.frontier.push({ "state": problem.initialState, "parent": null, "action": null, "path": 0, "cost": undefined });
    this.frontierHash[problem.hash(problem.initialState)] = 0;
    this.problem = problem;
  },
  searchItrs: 0,
  search : function() {
    while(this.frontier.size() !== 0) {
      this.searchItrs++;
      var leaf = this.frontier.pop();
      
      delete this.frontierHash[this.problem.hash(leaf.state)];
  
      if(this.problem.goal(leaf.state))
        return this.solution(leaf);
  
      this.closed[this.problem.hash(leaf.state)] = true;
      _.each(this.problem.actions(leaf.state), function(action) {
        var child = this.node(this.problem, leaf, action);
        var frontierCost = this.frontierHash[this.problem.hash(child.state)];

        if( undefined === frontierCost && !this.closed[this.problem.hash(child.state)] ) {
          this.frontierHash[this.problem.hash(child.state)] = child.cost;
          this.frontier.push(child);
        } else if( undefined !== frontierCost && frontierCost > child.cost) {
          var index = _.findIndex(this.frontier._elements, function(node) { return _.isEqual(node.state, child.state); });
          this.frontier.remove(index, 1);
          this.frontierHash[search.problem.hash(child.state)] = child.cost;
          this.frontier.push(child);
        }
      }, this);
    }
    log("No solution found");
    return undefined;
  },
  node: function (problem, parent, action) {
    var cost = parent.path + problem.cost(parent.state, action);
    var child = problem.succ(parent.state, action);
    return {
      "state": child,
      "parent": parent,
      "action": action,
      "path": cost,
      "cost": cost + problem.heuristic(child)
    };
  },
  solution: function(node) {
    log("Solution found in " + search.searchItrs + " Iterations");
    
    var result = [];
    while(node.parent !== null) {
      result.unshift(node.action);
      node = node.parent;
    }
    
    log(result);
    return result;
  }
};

function Player() {
  this.moveLimit = 0;
  this.mode = "";
  this.init = function() { };
  this.start = function(config) { this.moveLimit = config.time_limit; };
  this.error = function() { log("Error Recieved:" + JSON.stringify(arguments)); };
  this.end = function(results) {
    if(!results.won)
      log("Lost game" + JSON.stringify(elevActnProb.initialState));
    elevActnProb.initialState = undefined;
    
  };
  
  this.move = function(state) {
    //If we havn't started to solve the problem, start
    if(elevActnProb.initialState === undefined) {
      elevActnProb.initialState = reflex.goalState(state);
      search.init(elevActnProb);
      elevActnProb.solution = [];
      elevActnProb.solution = search.search();
      this.mode = "reflex";
      log("Reflex agent taking control.")
    }
  
    //A reflex agent find the obvious moves
    if(this.mode === "reflex") {
      try { return move(reflex.move(state)); } 
      catch(e) {
        this.mode = "planning";
        if(elevActnProb.solution === undefined)
          log("Couldn't find a solution. There is a bug in the formalization of the problem or the search algorithm.");
        else if(elevActnProb.solution.length === 0)
          log("Couldn't find a solution in time. TODO buy more time...");
        else if(elevActnProb.solution.length > 0)
          log("Search agent taking control.")
        else
          log("The world is ending. Explode!")
        
      }
    }
    if(this.mode === "planning") {
      if(elevActnProb.solution === undefined) { //Top Down
        if(reflex.goal === undefined) {
          var g = reflex.lastFloorGEq(state, 1);
          
          if(state.elevator_carrying === state.elevator_capacity || g === 0)
            reflex.goal = 1;
          else
            reflex.goal = g;
        }
            
        
        return move(reflex.move(state));
      } else if(elevActnProb.solution.length === 0) {
        //TODO
        //No solution found yet. Try to buy more time....
      } else if(elevActnProb.solution.length > 0) {
        return move(elevActnProb.solution.shift());
      }
    }
  };
}


/*

function asSearchA(problem) {
  var frontier = new PriorityQueue(function(a,b) { return b.cost - a.cost; });
  frontier.push({ "state": problem.initialState, "parent": null, "action": null, "path": 0, "cost": Infinity });
  var frontierHash = {};
  frontierHash[problem.hash(problem.initialState)] = 0;
  var closed = {};

  while(frontier.size() !== 0) {
    var leaf = frontier.pop();
    delete frontierHash[problem.hash(leaf.state)];

    if(problem.goal(leaf.state))
      return solution(leaf);

    closed[problem.hash(leaf.state)] = true;
    _.each(problem.actions(leaf.state), function(action) {
      var child = node(problem, leaf, action);
      var frontierCost = frontierHash[problem.hash(child.state)];

      if( undefined === frontierCost && !closed[problem.hash(child.state)] ) {
        frontierHash[problem.hash(child.state)] = child.cost;
        frontier.push(child);
      } else if( undefined !== frontierCost && frontierCost > child.cost) {
        var index = _.findIndex(frontier._elements, function(node) { return _.isEqual(node.state, child.state); });
        frontier.remove(index, 1);
        frontierHash[problem.hash(child.state)] = child.cost;
        frontier.push(child);
      }
    });
  }
  log("No solution possible");
  return undefined;
}

function node(problem, parent, action) {
  var cost = parent.path + problem.cost(parent.state, action);
  var child = problem.succ(parent.state, action);
  return {
    "state": child,
    "parent": parent,
    "action": action,
    "path": cost,
    "cost": cost + problem.heuristic(child)
  };
}

function solution(node) {
  var result = [];
  while(node.parent !== null) {
    result.unshift(node.action);
    node = node.parent;
  }
  return result;
}

*/

