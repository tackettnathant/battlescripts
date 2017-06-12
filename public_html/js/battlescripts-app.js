var bsapp = angular.module('battlescripts', ['restangular']);

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

// Web Services
bsapp.config(function(RestangularProvider) {
  RestangularProvider.setBaseUrl('/api');
	RestangularProvider.setDefaultHeaders({'Content-Type': 'application/json'});
});

bsapp.factory('$battlescripts', function(Restangular) {
	var api = {};

	// GAME methods
  // ------------
  var games = Restangular.all('games');
  var players = Restangular.all('players');

  api.get_all_games = ()=>games.getList().catch(()=>[]);
  api.get_game = (id) => games.get(id).catch(()=>{});
  api.search_games = (params) => games.getList(params).catch(()=>[]);
  api.save_game = function( game ) {
    if (game && game.id) {
      // Update
      return game.save();
    }
    else {
      // Create
      return games.post( game );
    }
  };
  api.delete_game = function( game ) {
    if (game && game.id) {
      return game.remove();
    }
  };

  // PLAYER methods
  // --------------
  api.get_all_players = ()=>players.getList().catch(()=>[]);
  api.get_player = (id) => players.get(id).catch(()=>{});
  api.search_players = (params) => players.getList(params).catch(()=>[]);
  api.save_player = function( player ) {
    if (player && player.id) {
      // Update
      return player.save();
    }
    else {
      // Create
      return players.post( player );
    }
  };
  api.delete_player = function( player ) {
    if (player && player.id) {
      return player.remove();
    }
  };
  return api;
});

bsapp.factory('$queryparam', function() {
  return {
    'get': function(key) {
      return (new URLSearchParams(window.location.search)).get(key);
    }
  };
});
