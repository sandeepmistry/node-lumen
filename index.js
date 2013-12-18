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

    if (mode === 'normal') {
      if ((data[1] === 0xdf) &&
            (data[2] === 0xd9) &&
            ((data[4] == 0x9a) || (data[4] == 0x9b))) {
        mode = 'warmWhite';

        var WARM_WHITE_PERCENTAGE_MAPPER = {
          0x58: 100,
          0x5f: 90,
          0xa9: 70,
          0xb3: 50,
          0xba: 30,
          0x8b: 0
        };

        state.warmWhitePercentage = WARM_WHITE_PERCENTAGE_MAPPER[data[3]];

        if (state.warmWhitePercentage === undefined) {
          state.warmWhitePercentage = 'unknown';
        }
      } else if (data[4] >= 0xf0) {
        mode = 'color';

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

Lumen.prototype.disco1Mode = function(callback) {
  this._service1Data[0] = 0x01;
  this._service1Data[6] = 0x52;

  this.writeService1(this._service1Data, callback);
};

Lumen.prototype.disco2Mode = function(callback) {
  this._service1Data[0] = 0x01;
  this._service1Data[6] = 0x53;

  this.writeService1(this._service1Data, callback);
};

Lumen.prototype.normalMode = function(callback) {
  this._service1Data[0] = 0x01;
  this._service1Data[6] = 0x54;

  this.writeService1(this._service1Data, callback);
};

Lumen.prototype.warmWhite = function(percentage, callback) {
  if (percentage < 0) {
    percentage = 0;
  } else if (percentage > 100) {
    percentage = 100;
  }

  this._service1Data[0] = 0x01;
  this._service1Data[1] = 0xdf;
  this._service1Data[2] = 0xd9;

  this._service1Data[6] = 0x54;

  if (percentage >= 100) {
    this._service1Data[3] = 0x58;
    this._service1Data[4] = 0x9b;
  } else if (percentage >= 90) {
    this._service1Data[3] = 0x5f;
    this._service1Data[4] = 0x9b;
  } else if (percentage >= 70) {
    this._service1Data[3] = 0xa9;
    this._service1Data[4] = 0x9a;
  } else if (percentage >= 50) {
    this._service1Data[3] = 0xb3;
    this._service1Data[4] = 0x9a;
  } else if (percentage >= 30) {
    this._service1Data[3] = 0xba;
    this._service1Data[4] = 0x9a;
  } else {
    this._service1Data[3] = 0x8b;
    this._service1Data[4] = 0x9a;
  }

  this.writeService1(this._service1Data, callback);
};

Lumen.prototype.color = function(c, m, y, w, callback) {
  if (c < 0) {
    c = 0;
  } else if (c > 1) {
    c = 1;
  }

  if (m < 0) {
    m = 0;
  } else if (m > 1) {
    m = 1;
  }

  if (y < 0) {
    y = 0;
  } else if (y > 1) {
    y = 1;
  }

  if (w < 0) {
    w = 0;
  } else if (w > 1) {
    w = 1;
  }

  this._service1Data[0] = 0x01;
  this._service1Data[1] = Math.round(c * 105.0) + 120;
  this._service1Data[2] = Math.round(m * 105.0) + 120;
  this._service1Data[3] = Math.round(y * 105.0) + 120;
  this._service1Data[4] = Math.round((1.0 - w) * 15.0) + 240;

  this._service1Data[6] = 0x54;

  this.writeService1(this._service1Data, callback);
};

module.exports = Lumen;
