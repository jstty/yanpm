'use strict';

var yanpm = require('../index.js');
var ya  = new yanpm();

ya
    .add([
        {
            "group":   "util",
            "package": "lodash@3.8" // first will be set to default
        },
        {
            "group":   "util",
            "package": "numeral"
        }
    ]).install().then(function () {
        console.log('Done loading plugins');

        var _ = ya.getDefault('util');
        console.log("lodash version:", _.VERSION);

        process.exit();
    });
