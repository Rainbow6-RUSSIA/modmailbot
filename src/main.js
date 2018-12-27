const moment = require('moment');
moment.locale('ru');

module.exports = {
  async start() {
    // console.log('Starting bot')
    require('./bot');
    console.log('Starting webserver');
    require('./modules/webserver');
  }
};
