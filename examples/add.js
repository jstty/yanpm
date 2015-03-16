/*
 *
 */
'use strict';

var yanpm = require('../index.js');
var ya  = new yanpm();

var startTime = process.hrtime();

console.log("Loading...");
ya
    .add("lodash")
    .add("lodash@3.5.0")
    .add("_", "lodash@3.5.0")
    .add("util", "_", "lodash@3.5.0")
    .add({
        "name": "logger",
        "group": "util",
        "package": "stumpy@0.6.x"
        ,"type": "factory" // default "singleton"
    })
    .add(['moment', 'when'])
    .add({
        "name": "basic-auth",
        "group": "route",
        "packages": "basic-auth",
        "dependencies": {
            "http": "express"
        },
        "route": {
            "setup": function(app, method, routeStr, func, options){
                var auth = function (req, res, next) {
                    function unauthorized(res) {
                        res.set('WWW-Authenticate', 'Basic realm='+(options.message || 'Authorization Required') );
                        return res.send(401);
                    }

                    var user = basicAuth(req);
                    if (!user || !user.name || !user.pass) {
                        return unauthorized(res);
                    }

                    if ( user.name === options.user &&
                        user.pass === options.pass ) {
                        return next();
                    } else {
                        return unauthorized(res);
                    }
                };

                app[ method ](routeStr, auth, func);
            }
        }
    })
    .load()
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

        var logger = plugins.get('util', 'logger');
        logger.log('Stumpy logger');
    });
