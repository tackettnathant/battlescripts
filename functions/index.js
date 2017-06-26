const functions = require('firebase-functions');
//const auth = require('firebase-auth');

exports.on_player = functions.database.ref('/players/{id}').onWrite(event => {
  console.log(JSON.stringify(event));
  console.log(event.auth.variable.uid);

  if (event.data.previous.exists()) {
    // UPDATE
    console.log("Previous value exists, exiting");
	return;
  }
  else if (!event.data.exists()) {
    // DELETE
    console.log("Deleting, exiting");
	return;
  }
  else {
    // CREATE
    console.log("Writing a generated attribute");
    return event.data.ref.child('created_on').set( (new Date()).getTime() );
  }
});
exports.on_player_created_by = functions.database.ref('/players/{id}').onWrite(event => {
  var uid;
  if (event.auth && event.auth.variable.uid){
    uid=event.auth.variable.uid;
  } else {
    uid="admin";
  }

  if (event.data.previous.exists()) {
    // UPDATE
    console.log("Previous value exists, exiting");
	return;
  }
  else if (!event.data.exists()) {
    // DELETE
    console.log("Deleting, exiting");
	return;
  }
  else {
    // CREATE
    console.log("Writing a generated attribute");
    return event.data.ref.child('created_by').set(uid);
  }
});
