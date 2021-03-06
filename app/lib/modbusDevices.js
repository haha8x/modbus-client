/*
Modbus devices, a collection and controller of all devices
 */


const logger       = require('./logger').getLogger('lib:modbusDevices');
const ModbusDevice = require('./modbusDevice');
const _            = require('lodash');
let devices        = [];
let socket         = undefined;
let settings       = undefined;

/**
 * Initializes the devices module
 * @param _settings
 * @param _socket
 * @param callback
 */
function init(_settings, _socket, callback) {
  socket   = _socket;
  settings = _settings;

  settings.config.devices.forEach(d => {
    let md = new ModbusDevice(socket, d);

    md.on('changed', info => {
      logger.info(`Changed ${md.id}: ${info.address} ${info.prevValue} -> ${info.value}`);
      socket.emit(info);
    });

    md.on('connected', (dev) => {
      logger.info(`Device ${dev.id} connected`);
    });

    md.on('disconnected', () => {
      logger.info('Device disconnected');
      // Try to connect after a delay
      _.delay(() => {
        md.connect(err => {
          logger.info('Reconnecting', err);
        });
      }, 2000);
    });
    md.connect(err => {
      if (err) {
        logger.error('Connection error', err);
      }
    });

    // Check every second if there is a socket
    setInterval(() => {
      md.enableCollection(socket.getNumberOfSockets() > 0);
    }, 1000);

    devices.push(md);
  });
  callback();
}

/**
 * Returns all devices with their elements
 * @returns {{devices: Array}}
 */
function getAllData() {
  let retVal = {
    devices: []
  };

  devices.forEach(dev => {
    retVal.devices.push(dev.getData());
  });

  return retVal;
}

/**
 * Edits a device: sets a new value for an element
 * @param deviceId
 * @param elementId
 * @param obj
 * @param callback
 */
function edit(deviceId, elementId, obj, callback) {
  console.log(deviceId, elementId, obj);
  let device = _.find(devices, {id: deviceId});
  if (!device) {
    return callback(new Error('Device not found'));
  }
  device.setData({id: elementId, value:obj.newValue}, callback);
}

module.exports = {
  init      : init,
  getAllData: getAllData,
  edit      : edit
};