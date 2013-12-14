node-lumen
==========

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

    lumen.discoverServicesAndCharacteristics(callback);

__Device Info__

    lumen.readDeviceName(callback(deviceName));

    lumen.readSystemId(callback(systemId));

    lumen.readSerialNumber(callback(serialNumber));

    lumen.readModelNumber(callback(modelNumber));

    lumen.readFirmwareRevision(callback(firmwareRevision));
    
    lumen.readHardwareRevision(callback(hardwareRevision));

    lumen.readSoftwareRevision(callback(softwareRevision));

    lumen.readManufacturerName(callback(manufacturerName));

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

Events 
------

__Connect__

    lumen.on('connect', callback);

__Disconnect__

    lumen.on('disconnect', callback);
