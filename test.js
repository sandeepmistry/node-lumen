var async = require('async');

var Lumen = require('./index');

Lumen.discover(function(lumen) {
  console.log('found lumen ' + lumen.toString());

  async.series([
    function(callback) {
      lumen.on('disconnect', function() {
        console.log('disconnected!');
        process.exit(0);
      });

      console.log('connect');
      lumen.connect(callback);
    },
    function(callback) {
      console.log('discoverServicesAndCharacteristics');
      lumen.discoverServicesAndCharacteristics(callback);
    },
    function(callback) {
      console.log('disconnect');
      lumen.disconnect(callback);
    }
  ]);
});
