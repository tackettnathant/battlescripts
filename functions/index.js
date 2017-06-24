const functions = require('firebase-functions');

exports.on_create_player = functions.database.ref('/players/{id}').onWrite(event => {
  // Only edit data when it is first created.
  if (event.data.previous.exists()) {
    console.log("Previous value exists, exiting");
	return;
  }
  // Exit when the data is deleted.
  if (!event.data.exists()) {
    console.log("Deleting, exiting");
	return;
  }
  console.log("Writing a generated attribute");
  return event.data.ref.child('created_on').set( (new Date()).getTime() );
});
