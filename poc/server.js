var express = require('express');
var app = express();
app.use(express.static('./'));
var server = app.listen(80, function() {
  console.log('BattleScripts local server is now running!');
});
