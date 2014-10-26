node-lumen
==========

[![Analytics](https://ga-beacon.appspot.com/UA-56089547-1/sandeepmistry/node-lumen?pixel)](https://github.com/igrigorik/ga-beacon)

node.js lib for the [Tabu Lumen](http://tabuproducts.com/shop/lumen-bulb/)

Install
-------

npm install lumen

Usage
-----

    var Lumen = require('lumen');

__Discover__

    Lumen.discover(callback(lumen));

__Connect__

    lumen.connect(callback);

__Disconnect__

    lumen.disconnect(callback);

__Discover Services and Characteristics__

Run after connect.

    lumen.discoverServicesAndCharacteristics(callback);

__Setup__

Run after discover services and characteristics.

    lumen.setup(callback);

__Device Info__

    lumen.readDeviceName(callback(deviceName));

    lumen.readSystemId(callback(systemId));

    lumen.readSerialNumber(callback(serialNumber));

    lumen.readModelNumber(callback(modelNumber));

    lumen.readFirmwareRevision(callback(firmwareRevision));
    
    lumen.readHardwareRevision(callback(hardwareRevision));

    lumen.readSoftwareRevision(callback(softwareRevision));

    lumen.readManufacturerName(callback(manufacturerName));

__Battery Level__

    // batteryLevel range is 0 - 100
    lumen.readBatteryLevel(callback(batteryLevel));

__Turn off/on__

    lumen.turnOff(callback);

    lumen.turnOn(callback);

__Set modes__

    lumen.coolMode(callback); // cycles cool colors

    lumen.warmMode(callback); // cycles warm colors

    lumen.disco2Mode(callback); // cycles RGB quickly

    lumen.disco1Mode(callback); // cycles RGB slowly

    lumen.normalMode(callback);

__Warm White__
    
    // Closest percentage to is used:
    //   0, 30, 50, 70, 90, 100

    var percentage = 100;

    lumen.warmWhite(percentage, callback);

__Color__

    var cyan    = 1.0; // 0.0 -> 100.0
    var magenta = 0.0; // 0.0 -> 100.0
    var yellow  = 1.0; // 0.0 -> 100.0
    var white   = 0.0; // 0.0 -> 100.0

    lumen.color(cyan, magenta, yellow, white, callback);

__State__

    lumen.readState(callback(state));

State structure:
    
    {
        on: true | false,

        mode: 'unknown' | 'normal' | 'cool' | 'warm' | 'disco1' | 'disco2' | 'warmWhite' | 'color',

        // if mode is 'warmWhite'
        warmWhitePercentage: 'unknown' | 100 | 90 | 70 | 50 | 30 | 0,

        // if mode is 'color'
        colorC: 0.0 - 1.0,
        colorM: 0.0 - 1.0,
        colorY: 0.0 - 1.0,
        colorW: 0.0 - 1.0
    }


Events 
------

__Connect__

    lumen.on('connect', callback);

__Disconnect__

    lumen.on('disconnect', callback);
