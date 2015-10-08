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

var SERVICE_KEYADD = new Uint8Array([0, 244, 229, 214, 163, 178, 163, 178, 193, 244, 229, 214, 163, 178, 193, 244, 229, 214, 163, 178]);
var SERVICE_KEYXOR = new Uint8Array([0, 43, 60, 77, 94, 111, 247, 232, 217, 202, 187, 172, 157, 142, 127, 94, 111, 247, 232, 217]);

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

    state.on = (data[0] !== 0x00);

    var MODE_MAPPER = {
      0x50: 'cool',
      0x51: 'warm',
      0x52: 'disco1',
      0x53: 'disco2',
      0x54: 'normal'
    };

    var mode = MODE_MAPPER[data[6]] || 'unknown';

    var decrypted = decryptCommand(data);
    console.log(">>", data);
    console.log(">>>", decrypted);

    if (mode === 'normal') {
      if ((data[1] === 0xdf) &&
            (data[2] === 0xd9) &&
            ((data[3] == 0x9a) || (data[3] == 0x9b))) {
        mode = 'warmWhite';

        var WARM_WHITE_PERCENTAGE_MAPPER = {
          0x58: 100,
          0xa3: 90,
          0xb5: 70,
          0x87: 50,
          0x99: 30,
          0xf2: 0
        };

        state.warmWhitePercentage = WARM_WHITE_PERCENTAGE_MAPPER[data[4]];

        if (state.warmWhitePercentage === undefined) {
          state.warmWhitePercentage = 'unknown';
        }
      }

      if (data[4] >= 0xf0 &&
          (state.warmWhitePercentage === undefined || state.warmWhitePercentage === 'unknown')) {
        mode = 'color';
        state.warmWhitePercentage = undefined;

        state.colorC = (data[1] - 120.0) / 105.0;
        state.colorM = (data[2] - 120.0) / 105.0;
        state.colorY = (data[3] - 120.0) / 105.0;
        state.colorW = (0xff - data[4]) / (1.0 * 0x0f);
      }
    }
    state.mode = mode;

    callback(state);
  }.bind(this));
};

Lumen.prototype.turnOff = function(callback) {
  writeCommand(this, [0x0, ], callback)
};

Lumen.prototype.turnOn = function(callback) {
  writeCommand(this, [0x01, 0x00, 0x00, 0x00, 0x0, 0x0, 0x48], callback)
};

Lumen.prototype.coolMode = function(callback) {
  writeCommand(this, [0x01, 0x00, 0x00, 0x00, 0x0, 0x0, 0x04], callback)
};

Lumen.prototype.warmMode = function(callback) {
  writeCommand(this, [0x01, 0x00, 0x00, 0x00, 0x0, 0x0, 0x03], callback)
};

Lumen.prototype.disco1Mode = function(callback) {
  writeCommand(this, [0x01, 0x00, 0x00, 0x00, 0x0, 0x0, 0x02], callback)
};

Lumen.prototype.disco2Mode = function(callback) {
  writeCommand(this, [0x01, 0x00, 0x00, 0x00, 0x0, 0x0, 0x01], callback)
};

Lumen.prototype.normalMode = function(callback) {
  writeCommand(this, [0x01, ], callback)
};

Lumen.prototype.warmWhite = function(percentage, callback) {
  zeroto99 = Math.max(0, Math.min(percentage, 99))
  writeCommand(this, [0x01, 0x00, 0x00, 0x00, zeroto99], callback)
};

/* Parameters:  c,m,y,k in range 0.0-1.0 */
Lumen.prototype.color = function(c, m, y, k, callback) {
  // standard c m y k -> rgb conversion
  var r = 1. - (c-k);
  var g = 1. - (m-k);
  var b = 1. - (y-k);

  this.rgbColor([r*100, g*100, b*100], callback);
};

/* Parameters:  color:[r,b,g] in range 0-99 */
Lumen.prototype.rgbColor = function (color, callback) {
  var cmd = [0x01, 0x99, 0x99, 0x99];

  for (var i = 0; i < 3; i++) {
    // ensure rgb is in range 0-99
    cmd[i+1] = Math.min(Math.max(0, parseInt(color[i])), 99);
  }

  writeCommand(this, cmd, callback);
}

/*----------------- Utility functions -----------------*/

function add(array, key) {
  var i = 0;
  var j = array.length - 1;
  while(j >= 0)
  {
    var k = i + ((0xff & array[j]) + (0xff & key[j]));
    if(k >= 256)
    {
      i = k >> 8;
      k -= 256;
    } else {
      i = 0;
    }
    array[j] = k;
    j--;
  }
}

function subtract(array, key) {
  var abyte1 = new Uint8Array(array);
  var abyte2 = new Uint8Array(key);
  var byte0 = abyte1[0];
  var byte1 = abyte2[0];
  var c = 0;
  if(byte0 < byte1)
    c = 0xff + 1;
  for(var i = 0; i < abyte1.length - 1; i++)
  {
    var j = 0xff & abyte1[i + 1];
    var k = 0xff & abyte2[i + 1];
    var c1 = 0;
    if(j < k)
    {
      abyte1[i] = (-1 + abyte1[i]);
      c1 = 0xff + 1;
    }
    array[i] = ((c + (0xff & abyte1[i])) - (0xff & abyte2[i]));
    c = c1;
  }

  array[i] = ((c + (0xff & abyte1[i])) - (0xff & abyte2[i]));
}

function xor(array, key) {
  for (var i = 0; i < array.length; i++) {
    array[i] = array[i] ^ key[i];
  }
}

function encryptCommand(buffer) {
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
}

function decryptCommand (data) {
  var data = new Buffer(data);
  var buf = new Buffer(20);

  for (var i=0; i<data.length; i++)
    buf[i] = data[i];

  // Decrypt data
  xor(buf, SERVICE_KEYXOR);
  subtract(buf, SERVICE_KEYADD);

  // Set 'on' bit
  buf[0] = 0x01 & data[0];

  return buf;
}

function writeCommand(_this, cmd, callback) {
  var buf = new Buffer(cmd);
  var encrypted = encryptCommand(buf);
  // TODO remove debug
  console.log(encrypted)
  _this.writeService1(encrypted, callback);
}

module.exports = Lumen;
