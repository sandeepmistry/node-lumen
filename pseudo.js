var util = require('util');

var bleno = require('bleno');

var BlenoPrimaryService = bleno.PrimaryService;
var BlenoCharacteristic = bleno.Characteristic;
var BlenoDescriptor = bleno.Descriptor;

console.log('pseudo');

bleno.on('stateChange', function(state) {
  console.log('on -> stateChange: ' + state);

  if (state === 'poweredOn') {
    bleno.startAdvertising('iSmartLight Bough', ['fff0']);
  } else {
    bleno.stopAdvertising();
  }
});

bleno.on('advertisingStart', function(error) {
  console.log('on -> advertisingStart ' + error);

  if (!error) {
    bleno.setServices([
      new BlenoPrimaryService({
        uuid: '180a',
        characteristics: [
          new BlenoCharacteristic({
            uuid: '2a23',
            properties: ['read'],
            value: new Buffer('0000000000000000', 'hex')
          }),
          new BlenoCharacteristic({
            uuid: '2a24',
            properties: ['read'],
            value: new Buffer('BG510')
          }),
          new BlenoCharacteristic({
            uuid: '2a25',
            properties: ['read'],
            value: new Buffer('00000001')
          }),
          new BlenoCharacteristic({
            uuid: '2a26',
            properties: ['read'],
            value: new Buffer('13042601')
          }),
          new BlenoCharacteristic({
            uuid: '2a27',
            properties: ['read'],
            value: new Buffer('A133210A')
          }),
          new BlenoCharacteristic({
            uuid: '2a28',
            properties: ['read'],
            value: new Buffer('Ver:0132')
          }),
          new BlenoCharacteristic({
            uuid: '2a29',
            properties: ['read'],
            value: new Buffer('Bough Tech')
          }),
          new BlenoCharacteristic({
            uuid: '2a2a',
            properties: ['read']
          }),
          new BlenoCharacteristic({
            uuid: '2a50',
            properties: ['read']
          })
        ]
      }),
      new BlenoPrimaryService({
        uuid: 'fff0',
        characteristics: [
          new BlenoCharacteristic({
            uuid: 'fff1',
            properties: ['read', 'write'],
            onReadRequest: function(offset, callback) {
              console.log('fff1 onReadRequest');

              callback(BlenoCharacteristic.RESULT_UNLIKELY_ERROR, null);
            },
            onWriteRequest: function(data, offset, withoutResponse, callback) {
              console.log('fff1 onWriteRequest: ' + data.toString('hex'));

              callback(BlenoCharacteristic.RESULT_SUCCESS);
            }
          }),
          new BlenoCharacteristic({
            uuid: 'fff2',
            properties: ['read'],
            onReadRequest: function(offset, callback) {
              console.log('fff2 onReadRequest');

              callback(BlenoCharacteristic.RESULT_SUCCESS, new Buffer('08ded99bfddd545a183e5e7a3e3cbeaa8a214b6b', 'hex'));
            }
          }),
          new BlenoCharacteristic({
            uuid: 'fff3',
            properties: ['write'],
            onWriteRequest: function(data, offset, withoutResponse, callback) {
              console.log('fff3 onWriteRequest: ' + data.toString('hex'));

              callback(BlenoCharacteristic.RESULT_SUCCESS);
            }
          }),
          new BlenoCharacteristic({
            uuid: 'fff4',
            properties: ['notify'],
            onSubscribe: function(maxValueSize, updateValueCallback) {
              console.log('fff4 onSubscribe');
            },
            onUnsubscribe: function(maxValueSize, updateValueCallback) {
              console.log('fff4 onUnsubscribe');
            }
          }),
          new BlenoCharacteristic({
            uuid: 'fff5',
            properties: ['read'],
            onReadRequest: function(offset, callback) {
              console.log('fff5 onReadRequest');

              callback(BlenoCharacteristic.RESULT_UNLIKELY_ERROR, null);
            }
          })
        ]
      }),
      new BlenoPrimaryService({
        uuid: '180f',
        characteristics: [
          new BlenoCharacteristic({
            uuid: '2a19',
            properties: ['read', 'notify'],
            value: new Buffer([100])
          })
        ]
      })
    ]);
  }
});

bleno.on('advertisingStop', function() {
  console.log('on -> advertisingStop');
});

bleno.on('servicesSet', function() {
  console.log('on -> servicesSet');
});
