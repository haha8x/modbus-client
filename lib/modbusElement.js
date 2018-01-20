/*
 Defining a single modbus element which is read out periodically

 */
const _            = require('lodash');
const EventEmitter = require('events').EventEmitter;
const util         = require('util');

function ModbusElement(client, element) {
  EventEmitter.call(this);
  this.client      = client;
  this.description = _.get(element, 'description', '');
  this.type        = _.get(element, 'type', 'coil');
  this.address     = _.get(element, 'address', 552);
  this.channel     = _.get(element, 'channel', 1);
  this.readonly    = _.get(element, 'readonly', true);
  this.interval    = _.get(element, 'interval', _.get(client, 'inverval', 5000));
  this.value       = undefined; // This is the value of the element
  this.prevValue   = undefined; // Helps detecting changes
  let self         = this;

  switch (this.type) {
    case 'coil':
      setInterval(function () {
        self.client.readCoils(self.address, 1, function (err, data) {
          self.value = _.get(data, 'data[0]', undefined);
          // In case of a changed value: emit new data
          if (self.value !== self.prevValue) {
            self.emit('changed', self.getObject());
            self.prevValue = self.value;
          }
          // console.log(self.description, self.value);
        });
      }, self.interval);
  }
}

util.inherits(ModbusElement, EventEmitter);

/**
 * Set the value of an element
 * @param value
 * @param callback
 * @returns {*}
 */
ModbusElement.prototype.setValue = function (value, callback) {
  let self = this;

  if (self.readonly) {
    return callback(new Error('Read only value'));
  }
  switch (self.type) {
    case 'coil':
      self.client.writeCoil(self.address, value)
        .then(function (d) {
          callback();
        })
        .catch(function (e) {
          callback(e);
        });
      break;
  }
};

/**
 * Returns the current value of the element
 * @returns {*}
 */
ModbusElement.prototype.getValue = function () {
  return this.value;
};

/**
 * Returns this element as object
 */
ModbusElement.prototype.getObject = function () {
  let self = this;
  return {
    description: self.description,
    type       : self.type,
    address    : self.address,
    channel    : self.channel,
    readOnly   : self.readonly,
    value      : self.value,
    prevValue  : self.prevValue
  };
};

module.exports = ModbusElement;