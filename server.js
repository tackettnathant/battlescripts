var express = require('express');
var simpleFsRest = require('simple-fs-rest');

var app = express();

app.use(express.static('./public_html/'));
app.use('/games', express.static('./games/'));
app.use('/lib', express.static('./lib/'));
app.use('/api',simpleFsRest('rest-data/'));

var server = app.listen(80, function() {
  console.log('BattleScripts local server is now running!');
});
