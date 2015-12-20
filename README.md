# node-lumen

[![Analytics](https://ga-beacon.appspot.com/UA-56089547-1/sandeepmistry/node-lumen?pixel)](https://github.com/igrigorik/ga-beacon)

Node.js lib for the [Tabu Lumen](http://tabuproducts.com/product/lumen-bulb/) (Bluetooth only).

## Install

```sh
npm install lumen
```

## Usage

```javascript
var Lumen = require('lumen');
```

### Discover

```javascript
Lumen.discover(callback(lumen));
```

### Connect and setup

```javascript
lumen.connectAndSetUp(callback(error));
```

### Disconnect

```javascript
lumen.disconnect(callback);
```

### Device Info

```javascript
lumen.readDeviceName(callback(error, deviceName));

lumen.readSystemId(callback(error, systemId));

lumen.readSerialNumber(callback(error, serialNumber));

lumen.readModelNumber(callback(error, modelNumber));

lumen.readFirmwareRevision(callback(error, firmwareRevision));

lumen.readHardwareRevision(callback(error, hardwareRevision));

lumen.readSoftwareRevision(callback(error, softwareRevision));

lumen.readManufacturerName(callback(error, manufacturerName));
```

### Turn off

```javascript
lumen.turnOff(callback(error));
```

### Set modes

```javascript
lumen.coolMode(callback(error)); // cycles cool colors

lumen.warmMode(callback(error)); // cycles warm colors

lumen.disco2Mode(callback(error)); // cycles RGB quickly

lumen.disco1Mode(callback(error)); // cycles RGB slowly
```

### White

```javascript
// 0 - 100
var percentage = 100;

lumen.white(percentage, callback(error));
```

### Color

```javascript
// 0 - 99
var r = 99;
var g = 0;
var b = 0;

lumen.color(r, g, b, callback(error));
```

## Events

### Disconnect

```javascript
lumen.on('disconnect', callback);
```
