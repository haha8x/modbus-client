/*
Modbus devices, a collection and controller of all devices
 */


const logger = require('./logger').getLogger('lib:modbusDevices');

const ModbusDevice = require('./modbusDevice');

let devices  = [];
let socket   = undefined;
let settings = undefined;

function init(_settings, _socket, callback) {
  socket   = _socket;
  settings = _settings;
  settings.config.devices.forEach(d => {
    let md = new ModbusDevice(d);
    md.on('changed', info => {
      logger.info(`Changed: ${info.address} ${info.prevValue} -> ${info.value}`);
      socket.emit(info);
    });
    devices.push(md);
  });
  callback();
}

function getAllData() {
  let retVal = {
    devices: []
  };

  devices.forEach(dev => {
    retVal.devices.push(dev.getData());
  });

  return retVal;
}

module.exports = {
  init      : init,
  getAllData: getAllData
};