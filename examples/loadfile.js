'use strict';

var yanpm = require('../index.js');
var ya  = new yanpm();

ya
    .add("./_lodash.json")
    .add(["./_stumpy.js"])
    // require plugins, all done with requires
    .load(function(){
        console.log('Done loading plugins');

        var _ = ya.get('util', 'lodash');
        console.log("lodash version:", _.VERSION);

        var logger = ya.get('util', 'stumpy');
        logger.log("This is a test");

        process.exit();
    });
