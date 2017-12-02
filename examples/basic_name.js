'use strict';

var yanpm = require('../index.js');
var ya  = new yanpm();

ya
    // add plugins
    .add("_", "lodash@3.9.0")
    // require plugins, all done with requires
    .install().then(function(){
        console.log('Done loading plugins');

        var _ = ya.get('_');
        console.log("lodash version:", _.VERSION);

        ya.reset();

        process.exit();
    });
