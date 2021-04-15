// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: loopback-workspace
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const path = require('path');
const loopback = require('loopback');
const boot = require('loopback-boot');
const awsKeys = require('./aws-config.json');
const AWS = require('aws-sdk');
const sentry = require('raven');
const applicationConfig = require('./application-config');
const git = require('git-rev-sync');
const expressStaticGzip = require("express-static-gzip");
const bodyParser = require('body-parser');
// global.Promise = require('bluebird');

const app = module.exports = loopback();
app.AWS = AWS;
app.mAwsConfig = awsKeys;
app.sentry = sentry;
sentry.config(applicationConfig.SENTRY_KEY, {
	stacktrace: true,
	captureUnhandledRejections: true,
	debug: true,
	release: git.short(),
	sendTimeout: 5,
	dataCallback: function(data) {
		if (process.env.NODE_ENV === 'development') {
			console.log(data);
		}
		return data;
	  }
}).install();

app.use(bodyParser.json({limit: '50mb', extended: true}));
app.use('/', expressStaticGzip(path.join(__dirname, '../slate-app/build')));

app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    const baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      const explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});
