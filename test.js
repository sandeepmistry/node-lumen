var async = require('async');

var Lumen = require('./index');

Lumen.discover(function(lumen) {
  console.log('found lumen ' + lumen.toString());

  lumen.on('connect', function() {
    console.log('connected!');
  });

  lumen.on('disconnect', function() {
    console.log('disconnected!');
    process.exit(0);
  });

  async.series([
    function(callback) {
      console.log('connect');
      lumen.connect(callback);
    },
    function(callback) {
      console.log('discoverServicesAndCharacteristics');
      lumen.discoverServicesAndCharacteristics(callback);
    },
    function(callback) {
      console.log('readDeviceName');
      lumen.readDeviceName(function(deviceName) {
        console.log('\tdevice name = ' + deviceName);
        callback();
      });
    },
    function(callback) {
      console.log('readSystemId');
      lumen.readSystemId(function(systemId) {
        console.log('\tsystem id = ' + systemId);
        callback();
      });
    },
    function(callback) {
      console.log('readModelNumber');
      lumen.readModelNumber(function(modelNumber) {
        console.log('\tmodel number = ' + modelNumber);
        callback();
      });
    },
    function(callback) {
      console.log('readSerialNumber');
      lumen.readSerialNumber(function(serialNumber) {
        console.log('\tserial number = ' + serialNumber);
        callback();
      });
    },
    function(callback) {
      console.log('readFirmwareRevision');
      lumen.readFirmwareRevision(function(firmwareRevision) {
        console.log('\tfirmware revision = ' + firmwareRevision);
        callback();
      });
    },
    function(callback) {
      console.log('readHardwareRevision');
      lumen.readHardwareRevision(function(hardwareRevision) {
        console.log('\thardware revision = ' + hardwareRevision);
        callback();
      });
    },
    function(callback) {
      console.log('readSoftwareRevision');
      lumen.readSoftwareRevision(function(softwareRevision) {
        console.log('\tsoftware revision = ' + softwareRevision);
        callback();
      });
    },
    function(callback) {
      console.log('readManufacturerName');
      lumen.readManufacturerName(function(manufacturerName) {
        console.log('\tmanufacturer name = ' + manufacturerName);
        callback();
      });
    },
    function(callback) {
      console.log('readBatteryLevel');
      lumen.readBatteryLevel(function(batteryLevel) {
        console.log('\tbattery level = ' + batteryLevel);

        callback();
      });
    },
    function(callback) {
      console.log('turnOff');
      lumen.turnOff(callback);
    },
    function(callback) {
      setTimeout(callback, 1000);
    },
    function(callback) {
      console.log('turnOn');
      lumen.turnOn(callback);
    },
    function(callback) {
      setTimeout(callback, 1000);
    },
    function(callback) {
      console.log('coolMode');
      lumen.coolMode(callback);
    },
    function(callback) {
      setTimeout(callback, 1000);
    },
    function(callback) {
      console.log('warmMode');
      lumen.warmMode(callback);
    },
    function(callback) {
      setTimeout(callback, 1000);
    },
    function(callback) {
      console.log('disco2Mode');
      lumen.disco2Mode(callback);
    },
    function(callback) {
      setTimeout(callback, 1000);
    },
    function(callback) {
      console.log('disco1Mode');
      lumen.disco1Mode(callback);
    },
    function(callback) {
      setTimeout(callback, 1000);
    },
    function(callback) {
      console.log('normalMode');
      lumen.normalMode(callback);
    },
    function(callback) {
      setTimeout(callback, 100);
    },
    function(callback) {
      console.log('normalMode');
      lumen.normalMode(callback);
    },
    function(callback) {
      console.log('disconnect');
      lumen.disconnect(callback);
    }
  ]);
});
