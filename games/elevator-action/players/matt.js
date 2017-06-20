// If we are not in a web worker define these for debugging (Node)
if( typeof importScripts === "undefined") {
  var _ = require("underscore");
  var log = console.log;
  var move = function(x) {console.log("Move Recieved: " + JSON.stringify(x))};
} else //In Web worker
  importScripts("../../player-api.js", "../../../js/lodash.js");

/*











DON'T LOOK AT MY ALGORITHM, CHEATER!!!! ;) 












*/
function Player() {
    // Make a move. A game state data structure is passed in.
    this.move = function(game) {
        /*
        game:
        {
            elevator_floor:1,
            elevator_open:false,
            elevator_carrying:0,
            waiting_passengers:[0,1,2,3,4,5],
            current_player:1,
            num_floors:10,
            num_passengers:50,
            elevator_capacity:5
        }
        */
        // Are there any passengers waiting on floors above us?
        var waiting_above = 0;
        for (var i=game.elevator_floor+1;i<=game.num_floors;i++) {
            waiting_above += game.waiting_passengers[i-1];
        }
        var look_floor = function(floor,count) {
            return (game.waiting_passengers[floor-1]==count);
        }
        var look_below = function(count) {
            for (var i=game.elevator_floor-1;i>0;i--) {
                if (look_floor(i,count)) { return i; }
            }
            return 0;
        }
        var look_above = function(count) {
            for (var i=game.elevator_floor+1;i<game.num_floors; i++) {
                if (look_floor(i,count)) { return i; }
            }
            return 0;
        }

        // These are ALWAYS correct, for any strategy
        if (game.elevator_open) {return move("CLOSE");}
        else if (game.elevator_floor==1) {
            if (game.elevator_carrying>0) {return move("OPEN");}
            else {return move("UP");}
        }
        else if (game.elevator_carrying==game.elevator_capacity) {
            return move("DOWN");
        }
        // Now begin the real algorithm
        var f=0;
        var need_to_fill = game.elevator_capacity - game.elevator_carrying;
        
        // First, go immediately grab any floors which have exactly our capacity
        if (game.elevator_carrying==0 && look_above(game.elevator_capacity)) {
            return move("UP");
        }
        
        // Check the floor we're on to see if it's exactly how many we need
        if (look_floor(game.elevator_floor,need_to_fill)) {
            // This floor has exactly how many we need, take them!
            return move("OPEN");
        }
        // If we are carrying passengers
        if (game.elevator_carrying>0) {
            // Check below to see if there is an exact match
            if (look_below(need_to_fill)) {
                return move("DOWN");
            }
            // Check to see if there is an exact match above us
            if (look_above(need_to_fill)) {
                return move("UP");
            }
        }
        // Maybe not an exact count, but go up to get more people
        if (waiting_above) {
            return move("UP");
        }
        if (game.waiting_passengers[game.elevator_floor-1]>0) {
            return move("OPEN");
        }
        return move("DOWN");
    };
    
}
