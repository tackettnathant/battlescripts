const functions = require('firebase-functions');

exports.on_player = functions.database.ref('/players/{id}').onWrite(event => {
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
