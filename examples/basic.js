'use strict';

var yanpm = require('../index.js');
var ya  = new yanpm();

ya
    // add plugins
    .add("lodash")
    // require plugins, all done with requires
    .install().then(function(){
        console.log('Done loading plugins');

        var _ = ya.get('lodash');
        console.log("lodash version:", _.VERSION);

        process.exit();
    });
