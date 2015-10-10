var util = require('util');

var NobleDevice = require('noble-device');

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


var Lumen = function(peripheral) {
  NobleDevice.call(this, peripheral);

  var manufacturerData = peripheral.advertisement.manufacturerData;

  if (manufacturerData && manufacturerData.length === 8) {
    this.id = peripheral.advertisement.manufacturerData.toString('hex').match(/.{1,2}/g).reverse().join(':');
    this.address = this.id.substring(0, 17);
  }

  this._keepAliveTimer = null;
  this.on('disconnect', this._onDisconnect.bind(this));
};

Lumen.SCAN_UUIDS = [SERVICE_UUID];

NobleDevice.Util.inherits(Lumen, NobleDevice);
NobleDevice.Util.mixin(Lumen, NobleDevice.BatteryService);
NobleDevice.Util.mixin(Lumen, NobleDevice.DeviceInformationService);

Lumen.prototype._onDisconnect = function() {
  if (this._keepAliveTimer) {
    clearTimeout(this._keepAliveTimer);
  }
};

Lumen.prototype.toString = function() {
  return JSON.stringify({
    uuid: this.uuid,
    id: this.id,
    address: this.address
  });
};

Lumen.prototype.connectAndSetUp = function(callback) {
   NobleDevice.prototype.connectAndSetup.call(this, function(error) {
    if (error) {
      return callback(error);
    }

    // send auth codes
    this._service1Data = new Buffer('08610766a7680f5a183e5e7a3e3cbeaa8a214b6b', 'hex');

    this._writeService1(this._service1Data, function(error) {
      if (error) {
        return callback(error);
      }

      this._readService2(function(error, data) {
        if (error) {
          return callback(error);
        }

        this._service1Data = new Buffer('07dfd99bfddd545a183e5e7a3e3cbeaa8a214b6b', 'hex');

        this._writeService1(this._service1Data, function(error) {
          if (error) {
            return callback(error);
          }

          this._readService2(function(error, data) {
            if (error) {
              return callback(error);
            }

            this.keepAlive();

            callback();
          }.bind(this));
        }.bind(this));
      }.bind(this));
    }.bind(this));
   }.bind(this));
};


Lumen.prototype._readService1 = function(callback) {
  this.readDataCharacteristic(SERVICE_UUID, SERVICE_1_UUID, callback);
};

Lumen.prototype._writeService1 = function(data, callback) {
  this.writeDataCharacteristic(SERVICE_UUID, SERVICE_1_UUID, data, function() {
    callback();
  });
};

Lumen.prototype._readService2 = function(callback) {
  this.readDataCharacteristic(SERVICE_UUID, SERVICE_2_UUID, callback);
};

Lumen.prototype.keepAlive = function() {
  this._keepAliveTimer = setTimeout(function() {
    this.readBatteryLevel(function(error, batteryLevel) {
      this.keepAlive();
    }.bind(this));
  }.bind(this), 5000);
};

Lumen.prototype.readState = function(callback) {
  this._readService1(function(error, data) {
    if (error) {
      return callback(error);
    }

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

    callback(null, state);
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

  this._writeService1(this._encryptCommand(cmd), callback);
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
