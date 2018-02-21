/*
Main app file for modbus-client

(c) 2018 Christian Kuster, Wernetshausen
 */


const settings      = require('./settings');
const express       = require('express');
const path          = require('path');
const morgan        = require('morgan');
const compression   = require('compression');
const moment        = require('moment');
const app           = express();
const server        = require('http').Server(app);
const socket        = require('./lib/modbusSocket');
const modbusDevices = require('./lib/modbusDevices');
const logger        = require('./lib/logger').getLogger('lib:app');
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
morgan.token('prefix', function getId() {
  return 'http: ' + moment().format();
});
app.use(morgan(':prefix :method :status :remote-addr :url'));

app.use(compression());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', require('./routes/index'));
console.log(settings);

modbusDevices.init(settings, socket.init(server), err => {
  if (err) {
    logger.error(err);
  }
  server.listen(settings.port, 'localhost', () => {
    logger.info(`Server started on Port ${settings.port}`)
  });
});

