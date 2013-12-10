var events = require('events');
var util = require('util');

var noble = require('noble');

var SERVICE_UUID                            = 'fff0';

var DEVICE_NAME_UUID                        = '2a00';

var SYSTEM_ID_UUID                          = '2a23';
var MODEL_NUMBER_UUID                       = '2a24';
var SERIAL_NUMBER_UUID                      = '2a25';
var FIRMWARE_REVISION_UUID                  = '2a26';
var HARDWARE_REVISION_UUID                  = '2a27';
var SOFTWARE_REVISION_UUID                  = '2a28';
var MANUFACTURER_NAME_UUID                  = '2a29';
var REGULATORY_CERTIFICATE_DATA_LIST_UUID   = '2a2a';
var PNP_ID_UUID                             = '2a50';

var BATTERY_LEVEL_UUID                      = '2a19';

var SERVICE_1_UUID                          = 'fff1';
var SERVICE_2_UUID                          = 'fff2';
var SERVICE_3_UUID                          = 'fff3';
var SERVICE_4_UUID                          = 'fff4';
var SERVICE_5_UUID                          = 'fff5';

function Lumen(peripheral) {
  this._peripheral = peripheral;
  this._services = {};
  this._characteristics = {};

  this.uuid = peripheral.uuid;
  this.id = peripheral.advertisement.manufacturerData.toString('hex').match(/.{1,2}/g).reverse().join(':');
  this.address = this.id.substring(0, 17);

  this._peripheral.on('disconnect', this.onDisconnect.bind(this));
  this._peripheral.on('connect', this.onConnect.bind(this));
}

util.inherits(Lumen, events.EventEmitter);

Lumen.discover = function(callback) {
  var startScanningOnPowerOn = function() {
    if (noble.state === 'poweredOn') {
      var onDiscover = function(peripheral) {
        if (!peripheral.advertisement.manufacturerData) {
          return;
        }

        noble.removeListener('discover', onDiscover);

        noble.stopScanning();

        var lumen = new Lumen(peripheral);

        callback(lumen);
      };

      noble.on('discover', onDiscover);

      noble.startScanning([SERVICE_UUID]);
    } else {
      noble.once('stateChange', startScanningOnPowerOn);
    }
  };

  startScanningOnPowerOn();
};

Lumen.prototype.onDisconnect = function() {
  this.emit('disconnect');
};

Lumen.prototype.onConnect = function() {
  this.emit('connect');
};

Lumen.prototype.toString = function() {
  return JSON.stringify({
    uuid: this.uuid,
    id: this.id,
    address: this.address
  });
};

Lumen.prototype.connect = function(callback) {
  this._peripheral.connect(function() {
    callback();
  });
};

Lumen.prototype.disconnect = function(callback) {
  this._peripheral.disconnect(callback);
};

Lumen.prototype.discoverServicesAndCharacteristics = function(callback) {
  this._peripheral.discoverAllServicesAndCharacteristics(function(error, services, characteristics) {
    if (error === null) {
      for (var i in services) {
        var service = services[i];
        this._services[service.uuid] = service;
      }

      for (var j in characteristics) {
        var characteristic = characteristics[j];

        this._characteristics[characteristic.uuid] = characteristic;
      }
    }

    this.syncValues(function() {
      callback();
    });
  }.bind(this));
};

Lumen.prototype.readDataCharacteristic = function(uuid, callback) {
  this._characteristics[uuid].read(function(error, data) {
    callback(data);
  });
};

Lumen.prototype.writeDataCharacteristic = function(uuid, data, callback) {
  this._characteristics[uuid].write(data, false, function(error) {
    callback();
  });
};

Lumen.prototype.readStringCharacteristic = function(uuid, callback) {
  this.readDataCharacteristic(uuid, function(data) {
    callback(data.toString());
  });
};

Lumen.prototype.readDeviceName = function(callback) {
  this.readStringCharacteristic(DEVICE_NAME_UUID, callback);
};

Lumen.prototype.readSystemId = function(callback) {
  this.readDataCharacteristic(SYSTEM_ID_UUID, function(data) {
    var systemId = data.toString('hex').match(/.{1,2}/g).reverse().join(':');

    callback(systemId);
  });
};

Lumen.prototype.readModelNumber = function(callback) {
  this.readStringCharacteristic(MODEL_NUMBER_UUID, callback);
};

Lumen.prototype.readSerialNumber = function(callback) {
  this.readStringCharacteristic(SERIAL_NUMBER_UUID, callback);
};

Lumen.prototype.readFirmwareRevision = function(callback) {
  this.readStringCharacteristic(FIRMWARE_REVISION_UUID, callback);
};

Lumen.prototype.readHardwareRevision = function(callback) {
  this.readStringCharacteristic(HARDWARE_REVISION_UUID, callback);
};

Lumen.prototype.readSoftwareRevision = function(callback) {
  this.readStringCharacteristic(SOFTWARE_REVISION_UUID, callback);
};

Lumen.prototype.readManufacturerName = function(callback) {
  this.readStringCharacteristic(MANUFACTURER_NAME_UUID, callback);
};

Lumen.prototype.readBatteryLevel = function(callback) {
  this.readDataCharacteristic(BATTERY_LEVEL_UUID, function(data) {
    callback(data.readUInt8(0));
  });
};

Lumen.prototype.readService1 = function(callback) {
  this.readDataCharacteristic(SERVICE_1_UUID, callback);
};

Lumen.prototype.writeService1 = function(data, callback) {
  this.writeDataCharacteristic(SERVICE_1_UUID, data, function() {
    callback();
  });
};

Lumen.prototype.readService2 = function(callback) {
  this.readDataCharacteristic(SERVICE_2_UUID, callback);
};

Lumen.prototype.syncValues = function(callback) {
  this._service1Data = new Buffer('07dfd99bfddd545a183e5e7a3e3cbeaa8a214b6b', 'hex');

  this.writeService1(this._service1Data, function() {
    this.readService2(function(data) {
      this._service2Data = data;
      callback();
    }.bind(this));
  }.bind(this));
};

Lumen.prototype.turnOff = function(callback) {
  this._service1Data[0] = 0x00;
  this._service1Data[4] = 0xfd;

  this.writeService1(this._service1Data, callback);
};

Lumen.prototype.turnOn = function(callback) {
  this._service1Data[0] = 0x01;
  this._service1Data[4] = 0xb8;

  this.writeService1(this._service1Data, callback);
};

Lumen.prototype.coolMode = function(callback) {
  this._service1Data[0] = 0x01;
  this._service1Data[6] = 0x50;

  this.writeService1(this._service1Data, callback);
};

Lumen.prototype.warmMode = function(callback) {
  this._service1Data[0] = 0x01;
  this._service1Data[6] = 0x51;

  this.writeService1(this._service1Data, callback);
};

Lumen.prototype.disco2Mode = function(callback) {
  this._service1Data[0] = 0x01;
  this._service1Data[6] = 0x53;

  this.writeService1(this._service1Data, callback);
};

Lumen.prototype.disco1Mode = function(callback) {
  this._service1Data[0] = 0x01;
  this._service1Data[6] = 0x52;

  this.writeService1(this._service1Data, callback);
};

Lumen.prototype.normalMode = function(callback) {
  this._service1Data[0] = 0x01;
  this._service1Data[6] = 0x54;

  this.writeService1(this._service1Data, callback);
};
module.exports = Lumen;
