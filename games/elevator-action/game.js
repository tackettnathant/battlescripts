var GameUtil = {
  // Build an array of objects
  fill_array: function(num, o) {
    var a = [];
    for (var i = 0; i < num; i++) {
      if (typeof o == "object") {
        a[i] = JSON.parse(JSON.stringify(o));
      }
      else {
        a[i] = o;
      }
    }
    return a;
  }

  ,random: function(min,max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

};

const ElevatorAction = function() {
    // Game state JSON object for Angular rendering
    this.canvas = {};
    // The scenario options that were initialized
    this.scenario = {
        min_floors:8,
        max_floors:12,
        min_passengers:50,
        max_passengers:70,
        min_elevators:1,
        max_elevators:1,
        elevator_capacity:5
    };
    
    // Called at the start of each multi-game match.
    this.start_match = function( players, config, scenario) {
        // Store some meta-data that persists between games
        Object.assign(this.scenario,scenario);

        // If an object is returned, it will be passed to each players' init() method.
        // Otherwise, undefined will be passed
        return {};
    };

    // Called at the start of each game
    this.start_game = function() {
        // Store the state of the current game. 
        // This is for internal use and may contain data that may not be visible to players
        this.scenario.num_floors = GameUtil.random(this.scenario.min_floors, this.scenario.max_floors);
        this.scenario.num_passengers = GameUtil.random(this.scenario.min_passengers, this.scenario.max_passengers);
        this.scenario.num_elevators = GameUtil.random(this.scenario.min_elevators, this.scenario.max_elevators);
        
        var passenger_floors = GameUtil.fill_array(this.scenario.num_floors,0);
        for (var i=0; i<this.scenario.num_passengers; i++) {
            var random_floor = GameUtil.random(2,this.scenario.num_floors);
            passenger_floors[random_floor-1]++;
        }
        //log(passenger_floors);
        this.game = {
            move_number:0,
            current_player:this.first_player,
            // Duplicate and store a data structure per player
            player_state: GameUtil.fill_array(this.scenario.total_players, {
                elevator_floor:GameUtil.fill_array(this.scenario.num_elevators,1),
                elevator_open:GameUtil.fill_array(this.scenario.num_elevators,false),
                elevator_carrying:GameUtil.fill_array(this.scenario.num_elevators,0),
                waiting_passengers:passenger_floors
            })
        };
        this.game.scenario = this.scenario;
        //log(this.game);
        
        // Initialize the canvas object
        this.canvas = {};

        return {"player_data":[]};
    };
    
    // Request a move from a player.
    // Internally, build a JSON structure that the player can see that may be different from the global game state
    this.get_next_move = function() {
        // For now, send only a single-elevator state
        var player_state = this.game.player_state[this.current_player];
        var send_state = {
            elevator_floor:player_state.elevator_floor[0],
            elevator_open:player_state.elevator_open[0],
            elevator_carrying:player_state.elevator_carrying[0],
            waiting_passengers:player_state.waiting_passengers,

            current_player:this.current_player,
            num_floors:this.scenario.num_floors,
            num_passengers:this.scenario.num_passengers,
            elevator_capacity:this.scenario.elevator_capacity
        };

        // Call the controller to request a move
        return {
            player_number:this.current_player
          ,data:send_state
        };
    };
    
	// Check if the game is over
	this.is_game_over = function() {
		var state = this.game.player_state[this.current_player];
		var waiting = state.waiting_passengers;
		var over = (state.elevator_floor[0]==1 && state.elevator_carrying[0]==0 && waiting.filter(x=>!!x).length==0);
		if (over) {
		  return {
		      winner:this.current_player
      }
    }
    return false;
	};

    // Handle a player move
    this.move = function(player_number,move,data) {
        this.game.move_number++;
        // Validate move
        // If an invalid move is made, call end() to end the game, and pass the winning player #
        
        var state = this.game.player_state[player_number];
        // Coding for only 1 elevator for now
        // Valid moves are UP,DOWN,OPEN,CLOSE
        // Invalid moves will be IGNORED for now
        if (move=="UP") {
            // Can't be OPEN or at the top floor
            if (!state.elevator_open[0] && state.elevator_floor[0]<this.scenario.num_floors) {
                state.elevator_floor[0]++;
            }
            else {
                // INVALID MOVE
            }
        }
        else if (move=="DOWN") {
            // Can't be OPEN or at the bottom floor
            if (!state.elevator_open[0] && state.elevator_floor[0]>1) {
                state.elevator_floor[0]--;
            }
            else {
                // INVALID MOVE
            }
        }
        else if (move=="OPEN") {
            if (!state.elevator_open[0]) {
                // Open the door
                state.elevator_open[0]=true;
                if (state.elevator_floor[0]==1) {
                    // If on floor 1, move passengers out of the elevator
                    state.elevator_carrying[0]=0;
                }
                else {
                    // Otherwise move waiting passengers on to the elevator
                    var waiting = state.waiting_passengers[state.elevator_floor-1];
                    var capacity = this.scenario.elevator_capacity;
                    var available = capacity - state.elevator_carrying[0];
                    if (waiting>0) {
                        var num_to_move = (waiting>available)?available:waiting;
                        state.elevator_carrying[0] += num_to_move;
                        state.waiting_passengers[state.elevator_floor-1] -= num_to_move;
                    }
                }
                
            }
            else {
                // INVALID MOVE
            }
        }
        else if (move=="CLOSE") {
            if (state.elevator_open[0]) {
                state.elevator_open[0] = false;
            }
            else {
                // INVALID MOVE
            }
        }
        else {
            // INVALID MOVE
        }

        // check to see if game is over
		if (!this.check_for_game_over()) {
          // Switch to the next player
          this.next_player();
          this.get_move();
        }
        else {
            end(this.current_player);
        }
        this.render();
    };

    // Paint the game
    this.render = function() {
        this.canvas = {players:[]};
        
        // Update the canvas
        for (var p=0; p<this.scenario.total_players; p++) {
            var player = {
                floors:[]
            };
            var state = this.game.player_state[p];
            for (var i=0; i<this.scenario.num_floors; i++) {
                var array_index = this.scenario.num_floors-i-1;
                var floor = {
                    number:array_index+1,
                    waiting:state.waiting_passengers[array_index],
                    elevators:[]
                };
                for (var j=0; j<this.scenario.num_elevators; j++) {
                    if (state.elevator_floor[j]==floor.number) {
                        floor.elevators.push({
                            open:state.elevator_open[j],
                            carrying:state.elevator_carrying[j]
                        })
                    }
                    else {
                        floor.elevators.push(null);
                    }
                }
                player.floors.push(floor);
            }
            this.canvas.players.push(player);
        }
        this.canvas.scenario = this.scenario;
        this.canvas.move_number = this.game.move_number;
        
        render(this.canvas);
    };
    
    // Called when a game ends
    this.end = function(data) {
        this.canvas_history.push(this.canvas);
        
        // Increment the player to start first next game
        this.increment_first_player();
    }
};
module.exports = ElevatorAction;