const appJson = require('./app.json');

module.exports = {
  ...appJson.expo,
  extra: {
    ...appJson.expo.extra,
    fast2smsKey: process.env.FAST2SMS_API_KEY || '',
  },
};
