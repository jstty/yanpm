/*
 *
 */
'use strict';

var yanpm = require('../../index.js');
var ya  = new yanpm();

var startTime = process.hrtime();

console.log("Loading...");

ya
    .add("lodash")
    .add("_", "lodash@3.10.0")        // in this case, it will use the first added module version
    .add("util", "_", "lodash@3.8.0") // in this case, it will use the first added module version

    .add({
        "util": "lodash"
    })
    .add({
        "util": {
            "logger2": {
                "package": "stumpy",
                "factory": function (Stumpy) { return new Stumpy(); },
                "args": [
                    "Logger2",
                    {
                        showTrace: true
                    }
                ]
            }
        }
    })

    .add(['moment', 'numeral'])
    .add([{
        "group":   "util",
        "name":    "logger1",
        "package": "stumpy@0.6.x",
        "factory": function (Stumpy) { return new Stumpy(); }
    }])
    .add([{
        "group":   "logger",
        "package": "stumpy",
        "factory": function (Stumpy) { return new Stumpy(); },
        "default": true
    }])
    //.add([{
    //    "group": "route",
    //    "name":  "basicAuth",
    //    "packages": "basic-auth",
    //    // dependencies, load first and are added
    //    "dependencies": { "http": "express" }, // or [ "express" ] if in group "*"
    //    "route": {
    //        "setup": function(app, method, routeStr, func, options){
    //            var auth = function (req, res, next) {
    //                function unauthorized(res) {
    //                    res.set('WWW-Authenticate', 'Basic realm='+(options.message || 'Authorization Required') );
    //                    return res.send(401);
    //                }
    //
    //                var user = basicAuth(req);
    //                if (!user || !user.name || !user.pass) {
    //                    return unauthorized(res);
    //                }
    //
    //                if ( user.name === options.user &&
    //                    user.pass === options.pass ) {
    //                    return next();
    //                } else {
    //                    return unauthorized(res);
    //                }
    //            };
    //
    //            app[ method ](routeStr, auth, func);
    //        }
    //    }
    //}])
    // require plugins
    .load()
    // all done with requires
    .done(function(plugins){
        console.log('Done loading plugins');

        var diff = process.hrtime(startTime);
        var diffSeconds = (diff[0] * 1e9 + diff[1])/(1e9);
        console.log('Time Diff:', diffSeconds);

        var _1 = plugins.get('lodash');
        console.log("lodash 1 version:", _1.VERSION);

        var _2 = plugins.get('_');
        console.log("lodash 2 version:", _2.VERSION);

        var _3 = plugins.get('util', '_');
        console.log("lodash 3 version:", _3.VERSION);

        var _4 = plugins.get('util', 'lodash');
        console.log("lodash 4 version:", _4.VERSION);

        var logger1 = plugins.get('util', 'logger1');
        logger1.log('Stumpy logger 1');

        var logger2 = plugins.get('util', 'logger2');
        logger2.log('Stumpy logger 2');

        var logger3 = plugins.getDefault('logger');
        logger3.log('Stumpy logger 3');

        // pass args to factory
        var logger1New = plugins.get('util', 'logger1', ["logger1New", { showLogId: true, showLogType: true} ]);
        logger1New.log('Stumpy logger 1 new');


        var loggers = plugins.getAll('util');
        loggers.logger1.log('Stumpy logger 1 new new');


        plugins.setDefault('util', 'logger2');
        var logger2New = plugins.getDefault('util');
        logger2New.log('Stumpy logger 2 new');


        var moment = plugins.get('moment');
        logger1New.log('moment time:', moment().format("dddd, MMMM Do YYYY, h:mm:ss a"));

        var numeral = plugins.get('numeral');
        logger1New.log('numeral time diff:', numeral(diffSeconds).format('0,0.00'));

        process.exit();
    });
