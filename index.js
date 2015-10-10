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

var SERVICE_KEYADD = [0, 244, 229, 214, 163, 178, 163, 178, 193, 244, 229, 214, 163, 178, 193, 244, 229, 214, 163, 178];
var SERVICE_KEYXOR = [0, 43, 60, 77, 94, 111, 247, 232, 217, 202, 187, 172, 157, 142, 127, 94, 111, 247, 232, 217];

function Lumen(peripheral) {
  this._peripheral = peripheral;
  this._services = {};
  this._characteristics = {};

  this.uuid = peripheral.uuid;

  var manufacturerData = peripheral.advertisement.manufacturerData;

  if (manufacturerData && manufacturerData.length === 8) {
    this.id = peripheral.advertisement.manufacturerData.toString('hex').match(/.{1,2}/g).reverse().join(':');
    this.address = this.id.substring(0, 17);
  }

  this._keepAliveTimer = null;

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
  if (this._keepAliveTimer) {
    clearTimeout(this._keepAliveTimer);
  }

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

    callback();
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

Lumen.prototype.setup = function(callback) {
  // send auth codes
  this._service1Data = new Buffer('08610766a7680f5a183e5e7a3e3cbeaa8a214b6b', 'hex');

  this.writeService1(this._service1Data, function() {
    this.readService2(function(data) {
      this._service2Data = data;

      this._service1Data = new Buffer('07dfd99bfddd545a183e5e7a3e3cbeaa8a214b6b', 'hex');

      this.writeService1(this._service1Data, function() {
        this.readService2(function(data) {
          this._service2Data = data;

          this.keepAlive();

          callback();
        }.bind(this));
      }.bind(this));
    }.bind(this));
  }.bind(this));
};

Lumen.prototype.keepAlive = function() {
  this._keepAliveTimer = setTimeout(function() {
    this.readBatteryLevel(function(batteryLevel) {
      this.keepAlive();
    }.bind(this));
  }.bind(this), 5000);
};

Lumen.prototype.readState = function(callback) {
  this.readService1(function(data) {
    var state = {};

    data = this._decryptResponse(data);

    state.on = (data[0] == 0x01);

    var MODE_MAPPER = {
      0x00: 'normal',
      0x01: 'disco2',           // flashing colors
      0x02: 'disco1',           // very flashing colors
      0x03: 'warm',             // red-orange colors cycle
      0x04: 'cool',             // blue-purple colors cycle
    };

    var mode = MODE_MAPPER[data[6]] || 'unknown';

    if (mode === 'normal') {
      if (data[4] > 0x00) {
        mode = 'white';
        state.percentage = data[4];
      } else if (data[1] === 0 && data[2] === 0 && data[3] === 0) {
        mode = 'unknown';
      } else {
        mode = 'color';
        state.r = data[1];
        state.g = data[2];
        state.b = data[3];
      }
    }
    state.mode = mode;

    callback(state);
  }.bind(this));
};

Lumen.prototype.turnOff = function(callback) {
  this._writeCommand([0x00], callback);
};

Lumen.prototype.turnOn = function(callback) {
  this._writeCommand([0x01], callback);
};

Lumen.prototype.coolMode = function(callback) {
  this._writeCommand([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04], callback);
};

Lumen.prototype.warmMode = function(callback) {
  this._writeCommand([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03], callback);
};

Lumen.prototype.disco1Mode = function(callback) {
  this._writeCommand([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02], callback);
};

Lumen.prototype.disco2Mode = function(callback) {
  this._writeCommand([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01], callback);
};

Lumen.prototype.white = function(percentage, callback) {
  this._writeCommand([0x01, 0x00, 0x00, 0x00, this._0to99(percentage)], callback);
};

Lumen.prototype.color = function (r, g, b, callback) {
  this._writeCommand([0x01, this._0to99(r), this._0to99(g), this._0to99(b)], callback);
};

Lumen.prototype._0to99 = function(value) {
  if (value < 0) {
    value = 0;
  } else if (value > 99) {
    value = 99;
  }

  return value;
};

Lumen.prototype._writeCommand = function(cmd, callback) {
  cmd = new Buffer(cmd);

  this.writeService1(this._encryptCommand(cmd), callback);
};

Lumen.prototype._encryptCommand = function(buffer) {
  var data = new Buffer(20);

  // Set buffer data
  for (var i = 0; i < data.length; i++) {
    if (i < buffer.length) {
      data[i] = buffer[i];
    } else {
      data[i] = 0;
    }
  }

  // Encrypt data
  add(data, SERVICE_KEYADD);
  xor(data, SERVICE_KEYXOR);

  // Set 'on' bit
  data[0] = 0x01 & buffer[0];

  return data;
};

Lumen.prototype._decryptResponse = function(response) {
  var data = new Buffer(20);

  response.copy(data);

  // Decrypt data
  xor(data, SERVICE_KEYXOR);
  subtract(data, SERVICE_KEYADD);

  // Set 'on' bit
  data[0] = 0x01 & response[0];

  return data;
};


/*----------------- Utility functions -----------------*/

function add(array, key) {
  var i = 0;

  for(var j = array.length - 1; j >= 0; j--) {
    var k = i + array[j] + key[j];

    if (k >= 256) {
      i = k >> 8;

      k -= 256;
    } else {
      i = 0;
    }

    array[j] = k;
  }
}

function subtract(array, key) {
  var a1 = new Buffer(array);
  var a2 = new Buffer(key);

  var c = (a1[0] < a2[0]) ? 256 : 0;

  for(var i = 0; i < a1.length - 1; i++) {
    var c1 = 0;

    if (a1[i + 1] < a2[i + 1]) {
      a1[i] = (-1 + a1[i]);
      c1 = 256;
    }

    array[i] = c + a1[i] - a2[i];
    c = c1;
  }

  array[i] = c + a1[i] - a2[i];
}

function xor(array, key) {
  for (var i = 0; i < array.length; i++) {
    array[i] = array[i] ^ key[i];
  }
}

module.exports = Lumen;
