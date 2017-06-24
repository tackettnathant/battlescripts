var bsapp = angular.module('battlescripts', ['firebase','ngSanitize']);

// Convert markdown to HTML
bsapp.filter('markdown', function() {
  return function(md) {
    return (typeof micromarkdown!="undefined") ? micromarkdown.parse(md) : md;
  };
});

bsapp.directive('json', function() {
  return {
    restrict: 'A', // only activate on element attribute
    require: 'ngModel', // get a hold of NgModelController
    link: function(scope, element, attrs, ngModelCtrl) {
      function fromUser(text) {
        // Beware: trim() is not available in old browsers
        if (!text || text.trim() === '')
          return {};
        else
          // TODO catch SyntaxError, and set validation error..
          return angular.fromJson(text);
      }

      function toUser(object) {
          // better than JSON.stringify(), because it formats + filters $$hashKey etc.
          return angular.toJson(object, true);
      }

      // push() if faster than unshift(), and avail. in IE8 and earlier (unshift isn't)
      ngModelCtrl.$parsers.push(fromUser);
      ngModelCtrl.$formatters.push(toUser);

      // $watch(attrs.ngModel) wouldn't work if this directive created a new scope;
      // see http://stackoverflow.com/questions/14693052/watch-ngmodel-from-inside-directive-using-isolate-scope how to do it then
      scope.$watch(attrs.ngModel, function(newValue, oldValue) {
        if (newValue != oldValue) {
          ngModelCtrl.$setViewValue(toUser(newValue));
          // TODO avoid this causing the focus of the input to be lost..
          ngModelCtrl.$render();
        }
      }, true); // MUST use objectEquality (true) here, for some reason..
    }
  };
});

// A "reverse" filter for arrays
bsapp.filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
});

// Filtering of log messages
bsapp.filter('log_filter',function() {
   return function(logs,log_player,log_game,log_match) {
       var show=[];
       angular.forEach(logs,function(msg) {
           if ( (log_player&&msg.type=="player_log") || (log_game&&msg.type=="game_log") || (log_match&&msg.type=="match_log")) {
               show.push(msg);
           }
       })
       return show;
   }
});

// CodeMirror
bsapp.directive("codemirror", function($timeout) {
  return {
    restrict: 'A',
    priority: 0,
    require: '^ngModel',
    link: function (scope, elems, attrs, model) {
      var elem = elems[0];

      if( window.CodeMirror === undefined ) throw new Error("The CodeMirror library is not available");
      if( !attrs.ngModel ) throw new Error("ng-model is required for linking code-mirror");
      if( elem.type !== "textarea" ) throw new Error("Only textarea is supported right now...");

      var editor = CodeMirror.fromTextArea(elem);

      var config = scope.$eval(attrs.codemirror) || {lineNumbers: true};
      for( var option in config )
        editor.setOption(option, config[option]);

      editor.setSize(null, elem.parentNode.clientHeight);

      //TODO Watch config scope.$watch(attr.codemirror, f(), true);
      //Fire digest on window resize
      window.addEventListener("resize", function() {
        $timeout(function() { //Prefered method to fire digest
          scope.$digest();
        });
      });
      //Listen for parent resize
      scope.$watch(
          function() { return elem.parentNode.clientHeight; },
          function() { editor.setSize(null, elem.parentNode.clientHeight); }
      );

      //Keeps the model in sync
      editor.on("change", function(editor, changeObj) { //TODO use changeObj to increase speed???
        var newValue = editor.getValue();
        editor.save();

        model.$setViewValue(newValue);
        if (!scope.$$phase) {
          scope.$apply();
        }
      });

      //Watches for model changes
      scope.$watch(attrs.ngModel, function(newValue, oldValue, scope) {
        if(newValue) {
          var position = editor.getCursor();
          var scroll = editor.getScrollInfo();
          editor.setValue(newValue);
          editor.setCursor(position);
          editor.scrollTo(scroll.left, scroll.top);
        }
      });
    }
  };
});

bsapp.factory('$battlescripts', ["$firebaseArray", "$firebaseObject","$firebaseAuth","$rootScope", function($firebaseArray,$firebaseObject,$firebaseAuth,$rootScope) {
	var api = {};

  //Initialize firebase
  var config = {
    apiKey: "AIzaSyDvWaytF9BXDJ0ra9hwqwPKnCM0LSWPAbM",
    authDomain: "battlescripts-161a3.firebaseapp.com",
    databaseURL: "https://battlescripts-161a3.firebaseio.com",
    projectId: "battlescripts-161a3",
    storageBucket: "battlescripts-161a3.appspot.com",
    messagingSenderId: "877337823986"
    /*
    apiKey: "AIzaSyAwQvAx4apZtW4fa3nLYeoy5wAEohQohj0",
    authDomain: "battlescripts-eb59b.firebaseapp.com",
    databaseURL: "https://battlescripts-eb59b.firebaseio.com",
    projectId: "battlescripts-eb59b",
    storageBucket: "battlescripts-eb59b.appspot.com",
    messagingSenderId: "1029158174849"
    */
  };
  firebase.initializeApp(config);
  var gameRef=firebase.database().ref().child("games");
  var playerRef=firebase.database().ref().child("players");

  // AUTH
  // ----
  api.user = firebase.auth().currentUser;
  firebase.auth().onAuthStateChanged(function (user) {
    api.user = user || null;
  });
  api.login = function() {
    return new Promise((resolve,reject)=>{
      if (api.user) { return resolve(api.user); }
      return $firebaseAuth().$signInWithPopup("google").then((userCredential)=>{
        api.user = userCredential.user;
        resolve(api.user);
      }).catch((err)=>{
        reject(err);
      });
    });
  };

  // GAME methods
  // ------------
  api.get_all_games = ()=>$firebaseArray(gameRef).$loaded().catch(()=>{});

  api.get_game = (id) => $firebaseObject(gameRef.child(id)).$loaded().catch(()=>{});

  api.search_games = function(params) {
    var param=Object.keys(params)[0];
    var val = params[param];
    var query = gameRef.orderByChild(param).equalTo(val);
    return $firebaseArray(query).$loaded();

  }
  api.save_game = function( game ) {
    if (game && game.$id) {
      return game.$save().then(ref=>$firebaseObject(ref).$loaded());
    }
    else {
      // Create
      return $firebaseArray(gameRef).$add(game).then(ref=>$firebaseObject(ref).$loaded());
    }
  };
  api.delete_game = function( game ) {
    if (game && game.$id) {
      return game.$remove();
    }
  };

  // PLAYER methods
  // --------------
  api.get_all_players = ()=>$firebaseArray(playerRef).$loaded().catch(()=>[]);

  api.get_my_players = (game_id)=>{
    // game_id is optional, if missing then get all players for all games

  };

  api.get_player = (id) => $firebaseObject(playerRef.child(id)).$loaded().catch(()=>{});

  api.search_players = function(params) {
    var param=Object.keys(params)[0];
    var val = params[param];
    var query = playerRef.orderByChild(param).equalTo(val);
    return $firebaseArray(query).$loaded();

  }
  api.save_player = function( player ) {
    if (player && player.$id) {
      // Update
      return player.$save().then(ref=>$firebaseObject(ref).$loaded());
    }
    else {
      // Create
      return $firebaseArray(playerRef).$add( player ).then(ref=>$firebaseObject(ref).$loaded());
    }
  };
  api.delete_player = function( player ) {
    if (player && player.$id) {
      return player.$remove();
    }
  };

  // UTIL methods
  // ------------

  // A quick shortcut to play a game
  api.play = function(Match, game_source, player_sources, options, error_handler) {
    var Game = eval(game_source);
    var game = new Game();
    var players = [];
    try {
      player_sources.forEach((code) => {
        players.push(new api.Player(code))
      });
    }
    catch(e) {
      error_handler(e);
      return;
    }
    var match = new Match(game, players, options);
    // Render
    match.subscribe("game.render", api.render);
    $rootScope.$on('error/player',function(data,msg) {
      error_handler(msg);
    });
    match.start();
  };

  // A wrapper to create a Player object from code and enable debugging, etc.
  api.Player = function(code,debug_functions) {
    var p = null;
    try {
      p = eval(`(${code})`);
    }
    catch(e) {
      throw "Could not compile player code: "+e.toString();
    }
    try {
      p = new p();
    }
    catch(e) {
      throw "Player code does not appear to be a constructor: "+e.toString();
    }
    if (typeof p.move!=="function") {
      throw "Player does not have a required move() function";
    }
    // Wrap the player code to provide functionality in the web context
    p = eval(`
      (()=>{
        var console={
          log:function(m){
            if (typeof m!=="string") { m=JSON.stringify(m); }
            $rootScope.$broadcast("log/player",m);
          }
        };
        return (${code});
      })();
    `);
    debug_functions = debug_functions || {};
    this.player = new p();
    this.move = function(data) {
      var player_move = null;
      // Debugger functions (if defined) can return promises (async) or values (sync)
      return Promise.resolve( debug_functions.before_move ? debug_functions.before_move(data) : null)
        .then((changed_data)=>{
          player_move = this.player.move(changed_data || data);
          return debug_functions.after_move ? debug_functions.after_move(player_move) : player_move;
        }).then((changed_player_move)=>{
          return (typeof changed_player_move!=="undefined")?changed_player_move:player_move;
        });
    };
    this.error = function(err) {
      $rootScope.$broadcast("error/player",err);
      if (typeof this.player.error==="function") {
        return this.player.error(err);
      }
    };
  };

  // TODO: Wrapper function for Game debugging?

  // Canvas
  // ------
  api.render = function(data) {
    $rootScope.$broadcast("canvas/render",data);
  };
  api.init_canvas = function(template) {
    $rootScope.$broadcast("canvas/init",template);
  };

  return api;
}]);

// A general-purpose Canvas Controller for painting games
bsapp.controller("CanvasController", ["$scope", "$battlescripts", "$queryparam", "$compile", "$rootScope", "$element", function($scope, $battlescripts, $queryparam, $compile, $rootScope, $element) {
  $scope.game={};
  $rootScope.$on("canvas/render",function(msg,data) {
    $scope.$apply(function() {
      $scope.game = data;
    });
  });
  $rootScope.$on("canvas/init",function(msg,template) {
    // Populate and compile the Game canvas
    $element.html(template);
    $compile($element)($scope);
  })
}]);

bsapp.factory('$queryparam', function() {
  return {
    'get': function(key) {
      return (new URLSearchParams(window.location.search)).get(key);
    }
  };
});
