var express = require('express');
var app = express();
app.use(express.static('./public_html/'));
var server = app.listen(80, function() {
  console.log('BattleScripts local server is now running on port 80!');
});
