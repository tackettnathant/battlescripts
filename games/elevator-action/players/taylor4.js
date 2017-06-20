importScripts("../../player-api.js", "../../../js/lodash.js");
/*
 * Notes
 * =====
 *
 * A* is 25% faster than BFS
 *
 * Numbers vs strings No time diff memory reduced
 */

_.mixin(_, {
  sum: function(xs) { return _.reduce(xs,function(acc,x) { return acc + x; },0) },
  lessEq: function(a, b) { return b <= a && b !== 0; },
  greaterEq: function(a, b) { return b >= a; }
});

//You know what a priorityQueue is right?
function PriorityQueue(a){this._comparator=a||PriorityQueue.DEFAULT_COMPARATOR,this._elements=[]}PriorityQueue.DEFAULT_COMPARATOR=function(a,b){return a instanceof Number&&b instanceof Number?a-b:(a=a.toString(),b=b.toString(),a==b?0:a>b?1:-1)},PriorityQueue.prototype={_swap:function(a,b){var c=this._elements[a];this._elements[a]=this._elements[b],this._elements[b]=c},_compare:function(a,b){return this._comparator(this._elements[a],this._elements[b])},size:function(){return this._elements.length},isEmpty:function(){return 0===this.size()},remove:function(a){return this._elements.splice(a,1),this.size()},peek:function(){if(this.isEmpty())throw new Error("Priority Queue is empty");return this._elements[0]},pop:function(){var a=this.peek(),b=this._elements.pop(),c=this.size();if(0===c)return a;this._elements[0]=b;for(var d=0;c>d;){var e=d,f=2*d+1,g=2*d+2;if(c>f&&this._compare(f,e)>0&&(e=f),c>g&&this._compare(g,e)>0&&(e=g),e===d)break;this._swap(e,d),d=e}return a},push:function(a){for(var b=this._elements.push(a),c=b-1;c>0;){var d=Math.floor((c-1)/2);if(this._compare(c,d)<0)break;this._swap(d,c),c=d}return b}};

//A formalization of the Elevator Action Problem described by http://mattkruse.com
var elevActnProb = {
  initialState: undefined,
  solution: undefined,
  cost: function() { return 1; },
  goal: function(state) { return 0 === _.sum(state.waiting_passengers) && state.elevator_floor === 1 && state.elevator_carrying === 0; }, 
  hash: function(state) { 
    function finitePairing(a, b) {
      return [a[0]*(b[1]+1) + (b[0]+1), (b[1]+1)*a[1] + b[1] + 1 ];
    }
    var simplifiedState = new Array(state.waiting_passengers.length + 2);
    for(var i=1; i<state.waiting_passengers.length; i++)
      simplifiedState[i+1] = [state.waiting_passengers[i], state.elevator_capacity - 1];
    simplifiedState[0] = [state.elevator_floor - 1, state.waiting_passengers.length - 1];
    simplifiedState[1] = [state.elevator_carrying, state.elevator_capacity];
    simplifiedState[simplifiedState.length - 1] = (state.elevator_open) ? [1, 1] : [0, 1];
    
    return _.reduce(simplifiedState, finitePairing, [0, 0])[0];
  },
  heuristic: function(state) {
    var numOccfloors = _.without(state.waiting_passengers,0).length;
    return 2 * numOccfloors + state.elevator_floor - 1;
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

//A simplified reflex agent
var reflex2 = {
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
    if(this.goal === undefined)
      this.goal = this.nextGoal(state);
    
    if(state.elevator_open) { this.goal = undefined; return "CLOSE"; }
    else if(this.goal === state.elevator_floor) return "OPEN";
    else if(this.goal > state.elevator_floor) return "UP";
    else if(this.goal < state.elevator_floor) return "DOWN";
    else return "SELF_DESTRUCT";
  }
};


var searchAgent = {
  problem: undefined,
  frontier : new PriorityQueue(function(a,b) { return b.cost - a.cost; }),
  frontierHash: {},
  closed: {},
  init: function(problem) {
    log(problem.initialState);
    this.problem = problem;
    this.problem.solution = [];
    this.frontier.push({ "state": problem.initialState, "parent": null, "action": null, "path": 0, "cost": undefined });
    this.frontierHash[problem.hash(problem.initialState)] = 0;
    this.searchHandle = setInterval(this.search.bind(this), 0);
  },
  searchHandle: undefined,
  searchItrs: 0,
  search : function() {
    this.searchItrs++;
    if(this.frontier.size() === 0) {
      this.problem.solution = null;
      log("No solution found");
      return clearInterval(this.searchHandle);
    }
    
    var leaf = this.frontier.pop();
    delete this.frontierHash[this.problem.hash(leaf.state)];
  
    if(this.problem.goal(leaf.state)) {
      this.problem.solution = this.solution(leaf);
      log("Solution Found in " + this.searchItrs + " iterations.");
      return clearInterval(this.searchHandle);
    }
  
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
        this.frontierHash[searchAgent.problem.hash(child.state)] = child.cost;
        this.frontier.push(child);
      }
    }, this);
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
    log("Reconstructing solution...");
    
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
  this.moveLimit = 2000;
  this.mode = "";
  this.init = function() { log("inited with" + JSON.stringify(arguments)); };
  this.start = function() { log("started with" + JSON.stringify(arguments)); /*this.moveLimit = config.time_limit;*/ };
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
      searchAgent.init(elevActnProb);
      this.mode = "reflex";
      log("Reflex agent taking control.");
    }
  
    //A reflex agent find the obvious moves
    if(this.mode === "reflex") {
      try {
        var m = reflex.move(state);
        if(elevActnProb.solution === null || elevActnProb.solution.length > 0)
          return move(m);
        else
          setTimeout(function() { move(m); }.bind(this), 0.95 * this.moveLimit);
      } catch(e) {
        log("planning time");
        this.mode = "planning";
        if(elevActnProb.solution === null)
          log("Couldn't find a solution. There is a bug in the formalization of the problem or the search algorithm.");
        else if(elevActnProb.solution.length === 0)
          log("Couldn't find a solution in " + searchAgent.searchItrs +" iterations. TODO buy more time...");
        else if(elevActnProb.solution.length > 0)
          log("Search agent taking control.");
        else
          log("The world is ending. Explode!");
      }
    }
    if(this.mode === "planning") {
      if(elevActnProb.solution.length === 0) {
        //No solution found yet. Try to buy more time....
        //Stop looking and proceed with secret....
        
        clearInterval(searchAgent.searchHandle);
        return move(reflex2.move(state));
      } else if(elevActnProb.solution.length > 0) {
        return move(elevActnProb.solution.shift());
      }
    }
  };
}