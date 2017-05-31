# PLAYER API
------------

A Player has a constructor that returns an object with the following methods. The only required method is move().

Players are not allowed to require() any modules, and must expose their Constructor using module.exports.

Players are written specifically for a single Game and contain the logic required to play that game.

## move ( data )

This is the core of the Player - a method that decides which move to make next.

### Returns

Move Data

The format and content of the player's "move" is specific to the game being played. In some cases, it could be just a number to say which position to take. In other games, it could be a more complex json structure containing lots of data.

### Parameters

data: A data structure describing the current state of the game. Simple players will be able to make their next move entirely based on this data. If a player wishes to be more advanced and track previous moves to determine their opponent's strategy, or to vary strategy across multiple games in a match, for example, they may wish to implement the other methods below. It is the responsibility of the code in the Player to do whatever necessary.

## start_match( data )

This method is optional. Not all players will benefit from implementing it.

### Returns

None

### Parameters

data: An object describing the match in general.
```
{
    player_number: 0,
    total_games: 1,
    data: {json}
}
```

The player is told which player number they are (if it matters), how many games will be played, and passed any data that the Game decides to tell players at the start of the match.  The format and content of the data are decided by the Game.

## start_game( data )

This method is optional. Not all players will benefit from implementing it.

### Returns

None

### Parameters

data: A data structure sent from the Game that is specific to this player, For example, it might contain some initial values of health, or board position, or type of player you have been assigned, etc.

## end_game( results )

This method is optional. Not all players will benefit from implementing it.

### Returns

None

### Parameters

results: A data structure informing the Player about the results of this one game
```
    {
        winner: 0     // Player number of the winner
        , draw: false // If the game was a tie
        , [...]       // Any additional Game-specific data
    }
```

## end_match( results )

This method is optional. Not all players will benefit from implementing it.

### Returns

None

### Parameters

results: A data structure describing the results of the overall match.
