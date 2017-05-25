# GAME API
----------

A Game has a constructor that returns an object with the following methods. Every method must be implemented.

## start_match( [players], config, scenario) )

### Returns

{}

Any object returned will be passed to the start_match() method of each player, to inform them of any match-level information about the game.

### Parameters

players: An array of Player objects who are playing this match

config: An object containing properties about the match, with at least these properties:
    {
        total_games: 1
        , move_delay: 0
        , time_limit: 0
        , move_type: "sequential"
        , render_type: "text/json"
        , render_history: false
    };

scenario: An optional object describing a variation of options to be played in the game. For example, which map to use or which features to enable.

## start_game( match_results )

### Returns

{
    "player_data":[] 
}

An object containing array of objects to pass to the start_game() method of each player. This may be used to tell the players what role they are in, what qualities their player has, what position they are in, etc. This is arbitrary game-specific data.

### Parameters

match_results: An object containing results of the match so far, including a "current_game" property to tell the game which game in the match is starting.

## get_next_move

### Returns

### Parameters

## move

### Returns

### Parameters

## is_game_over

### Returns

### Parameters

## render( render_type )

### Returns

### Parameters

