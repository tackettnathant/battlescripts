// If we are not in a web worker define these for debugging (Node)
if( typeof importScripts === "undefined") {
  var _ = require("underscore");
  var log = console.log;
  var move = function(x) {console.log("Move Recieved: " + JSON.stringify(x))};
} else //In Web worker
  importScripts("../../player-api.js", "../../../js/lodash.js");

// Player Template
function Player() {
    
    // Do something at the start of a multi-game match
    this.init = function(data) {
        
    };
    
    // do something at the start of each game
    this.start = function(data) {
        
    };
    
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
        for (var i=game.elevator_floor;i<=game.num_floors;i++) {
            waiting_above += game.waiting_passengers[i-1];
        }
        // If the elevator is at capacity (or no more waiting above) and on the 1st floor, open it to let them out
        if (game.elevator_floor==1) {
            if (waiting_above==0 || game.elevator_carrying==game.elevator_capacity) {
                return move("OPEN");
            }
            else if (game.elevator_open) {
                return move("CLOSE");
            }
            else {
                return move("UP");
            }
        }
        else if (game.elevator_carrying==game.elevator_capacity) {
            if (game.elevator_open) {
                return move("CLOSE");
            }
            else {
                return move("DOWN");
            }
        }
        else if (game.waiting_passengers[game.elevator_floor-1]>0) {
            return move("OPEN");
        }
        else if (game.elevator_open) {
            return move("CLOSE");
        }
        else {
            if (waiting_above>0 && game.elevator_floor<game.num_floors) {
                return move("UP");
            }
            return move("DOWN");
        }
    };
    
    // Do something at the end of each game
    this.end = function(did_i_win_flag,winning_player) {
        
    };
    
    // Do something at the end of the match
    this.match_end = function(results) {
        // At some point in the future, you may be able to persist data from here...
    };
    
}
