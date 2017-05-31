# GAME API
----------

A Game has a constructor that returns an object with the following methods. Every method must be implemented.

Games are not allowed to require() any modules, and must expose their Constructor using module.exports.

## start_match( [players], config, scenario) )

### Returns
```
{}
```
Any object returned will be passed to the start_match() method of each player, to inform them of any match-level information about the game.

### Parameters

players: An array of Player objects who are playing this match

config: An object containing properties about the match, with at least these properties:
```
    {
        total_games: 1
        , move_delay: 0
        , time_limit: 0
        , move_type: "sequential"
        , render_type: "text/json"
        , render_history: false
    };
```

scenario: An optional object describing a variation of options to be played in the game. For example, which map to use or which features to enable.

## start_game( match_results )

### Returns
```
{
    "player_data":[] 
}
```
An object containing array of objects to pass to the start_game() method of each player. This may be used to tell the players what role they are in, what qualities their player has, what position they are in, etc. This is arbitrary game-specific data.

### Parameters

match_results: An object containing results of the match so far, including a "current_game" property to tell the game which game in the match is starting.

## get_next_move ()

This method is called by Match when it needs to know which player(s) should move next.

### Returns

An object containing the player number whose turn it is next, and data that describes the current game status. Note that the data delivered to the player can be specific to that player. For example, many games do not allow players to know everything about the board when making their move. It is up to the Game to decide what data to send to each player, using a data structure that is defined by the game itself and understood by the players. It is the responsibility of the Game to keep track of which player's turn is next, since it can be common for a player to be skipped under some circumstances, for example.
```
    {
      player_number: 0
      , data: {json}
    };
```
### Parameters

None

## move ( player_number, move )

Accept a move from a player. The Game should validate the move and update its internal state to reflect the move.

### Returns

None

### Throws

If the move passed in is invalid, throw an exception with a description of the reason why. The player will be informed. This does not automatically end the game. It is the responsibility of the Game to keep track of this if it's an error and handle it appropriately in the is_game_over() method.

### Parameters

player_number: Identifies which player has made the move

move: A data structure or value that represents the player's move. The format of this value is to be decided by the Game API.

## is_game_over ()

Called by Match to ask the Game if it's over or not.

### Returns

Returns false if the game is not over.

If the game is over, returns a data structure describing the outcome:
```
    {
        winner: 0     // Player number of the winner
        , draw: false // If the game was a tie
        , [...]       // Any additional Game-specific data
    }
```

This object will be passed to each Player object to inform them that the game is over, as well as published to any subscribers of the game.end message.

### Parameters

None

## render( render_type )

A request from Match for the Game to return a representation of its current state so it can be shown to the user.

### Returns

A representation of the game's state in the format requested. By default it is "text/json", which is a data structure that describes the game state and is suitable for rendering using whatever UI is being used. A value of "text/plain" is a request for an ASCII representation of the game. If it cannot be represented visually in plain text, the Game may still return json.

### Parameters

render_type: A mime-type describing what format Match wants the return value in.

## end_game( game_results )

### Returns

None

### Parameters

game_results: the same json object as returned by is_game_over()

## end_match( match_results )

### Returns

None

### Parameters

match_results: An object containing results of the match so far, including a "current_game" property to tell the game which game in the match is starting.

