# node-lumen

[![Analytics](https://ga-beacon.appspot.com/UA-56089547-1/sandeepmistry/node-lumen?pixel)](https://github.com/igrigorik/ga-beacon)

Node.js lib for the [Tabu Lumen](http://tabuproducts.com/shop/lumen-bulb/)

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

### Connect

```javascript
lumen.connect(callback);
```

### Disconnect

```javascript
lumen.disconnect(callback);
```

### Discover Services and Characteristics

Run after connect.

```javascript
lumen.discoverServicesAndCharacteristics(callback);
```

### Setup

Run after discover services and characteristics.

```javascript
lumen.setup(callback);
```

### Device Info

```javascript
lumen.readDeviceName(callback(deviceName));

lumen.readSystemId(callback(systemId));

lumen.readSerialNumber(callback(serialNumber));

lumen.readModelNumber(callback(modelNumber));

lumen.readFirmwareRevision(callback(firmwareRevision));

lumen.readHardwareRevision(callback(hardwareRevision));

lumen.readSoftwareRevision(callback(softwareRevision));

lumen.readManufacturerName(callback(manufacturerName));
```


### Battery Level

```javascript
// batteryLevel range is 0 - 100
lumen.readBatteryLevel(callback(batteryLevel));
```

### Turn off/on

```javascript
lumen.turnOff(callback);

lumen.turnOn(callback);
```

### Set modes

```javascript
lumen.coolMode(callback); // cycles cool colors

lumen.warmMode(callback); // cycles warm colors

lumen.disco2Mode(callback); // cycles RGB quickly

lumen.disco1Mode(callback); // cycles RGB slowly
```

### White

```javascript
// 0 - 100
var percentage = 100;

lumen.white(percentage, callback);
###

### Color

```javascript
// 0 - 99
var r = 99;
var g = 0;
var b = 0;

lumen.color(r, g, b, callback);
```

### State

```javascript
lumen.readState(callback(state));
```

State structure:

```javascript
{
    on: true | false,

    mode: 'unknown' | 'cool' | 'warm' | 'disco1' | 'disco2' | 'white' | 'color',

    // if mode is 'white'
    percentage: 'unknown' | 0 - 100,

    // if mode is 'color'
    r: 0 - 99,
    g: 0 - 99,
    b: 0 - 99
}
```

## Events

### Disconnect

```javascript
lumen.on('disconnect', callback);
```
