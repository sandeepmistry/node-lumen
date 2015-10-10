var async = require('async');

var Lumen = require('./index');

Lumen.discover(function(lumen) {
  console.log('found lumen ' + lumen.toString());

  lumen.on('disconnect', function() {
    console.log('disconnected!');
    process.exit(0);
  });

  function readState(callback) {
    console.log('readState');

    lumen.readState(function(error, state) {
      console.log('\t' + JSON.stringify(state));

      callback();
    });
  }

  function delayReadState(callback) {
    console.log('delay');
    setTimeout(function() {
      readState(callback);
    }, 1000);
  }

  async.series([
    function(callback) {
      console.log('connectAndSetUp');
      lumen.connectAndSetUp(callback);
    },
    function(callback) {
      console.log('readDeviceName');
      lumen.readDeviceName(function(error, deviceName) {
        console.log('\tdevice name = ' + deviceName);
        callback();
      });
    },
    function(callback) {
      console.log('readSystemId');
      lumen.readSystemId(function(error, systemId) {
        console.log('\tsystem id = ' + systemId);
        callback();
      });
    },
    function(callback) {
      console.log('readModelNumber');
      lumen.readModelNumber(function(error, modelNumber) {
        console.log('\tmodel number = ' + modelNumber);
        callback();
      });
    },
    function(callback) {
      console.log('readSerialNumber');
      lumen.readSerialNumber(function(error, serialNumber) {
        console.log('\tserial number = ' + serialNumber);
        callback();
      });
    },
    function(callback) {
      console.log('readFirmwareRevision');
      lumen.readFirmwareRevision(function(error, firmwareRevision) {
        console.log('\tfirmware revision = ' + firmwareRevision);
        callback();
      });
    },
    function(callback) {
      console.log('readHardwareRevision');
      lumen.readHardwareRevision(function(error, hardwareRevision) {
        console.log('\thardware revision = ' + hardwareRevision);
        callback();
      });
    },
    function(callback) {
      console.log('readSoftwareRevision');
      lumen.readSoftwareRevision(function(error, softwareRevision) {
        console.log('\tsoftware revision = ' + softwareRevision);
        callback();
      });
    },
    function(callback) {
      console.log('readManufacturerName');
      lumen.readManufacturerName(function(error, manufacturerName) {
        console.log('\tmanufacturer name = ' + manufacturerName);
        callback();
      });
    },
    readState,
    function(callback) {
      console.log('turnOff');
      lumen.turnOff(callback);
    },
    delayReadState,
    function(callback) {
      console.log('turnOn');
      lumen.turnOn(callback);
    },
    delayReadState,
    function(callback) {
      console.log('coolMode');
      lumen.coolMode(callback);
    },
    delayReadState,
    function(callback) {
      console.log('warmMode');
      lumen.warmMode(callback);
    },
    delayReadState,
    function(callback) {
      console.log('disco2Mode');
      lumen.disco2Mode(callback);
    },
    delayReadState,
    function(callback) {
      console.log('disco1Mode');
      lumen.disco1Mode(callback);
    },
    delayReadState,
    function(callback) {
      console.log('white 100%');
      lumen.white(100, callback);
    },
    delayReadState,
    function(callback) {
      console.log('white 90%');
      lumen.white(90, callback);
    },
    delayReadState,
    function(callback) {
      console.log('white 70%');
      lumen.white(70, callback);
    },
    delayReadState,
    function(callback) {
      console.log('white 50%');
      lumen.white(50, callback);
    },
    delayReadState,
    function(callback) {
      console.log('white 30%');
      lumen.white(30, callback);
    },
    delayReadState,
    function(callback) {
      console.log('white 0%');
      lumen.white(0, callback);
    },
    delayReadState,
    function(callback) {
      console.log('color red');
      lumen.color(99, 0, 0, callback);
    },
    delayReadState,
    function(callback) {
      console.log('color green');
      lumen.color(0, 99, 0, callback);
    },
    delayReadState,
    function(callback) {
      console.log('color blue');
      lumen.color(0, 0, 99, callback);
    },
    delayReadState,
    function(callback) {
      console.log('color white');
      lumen.color(99, 99, 99, callback);
    },
    delayReadState,
    function(callback) {
      console.log('disconnect');
      lumen.disconnect(callback);
    }
  ]);
});
