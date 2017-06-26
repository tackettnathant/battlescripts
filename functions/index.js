const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);


exports.publish_player = functions.database.ref('/users/{uid}/players/{playerId}/published').onWrite(event => {
  if (!event.data || !event.data.val()){
    return admin.database().ref('/players').child(event.params.playerId).remove();
  } else {
    return admin.database().ref('/users/'+event.params.uid+'/players/'+event.params.playerId)
            .once("value")
            .then((snapshot)=>{
              var player={};
              player.source=snapshot.val().source;
              player.game_id=snapshot.val().game_id;
              player.name=snapshot.val().name;
              admin.database().ref('/players').child(event.params.playerId).set(player);
            })
  }

});

/*
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
*/
