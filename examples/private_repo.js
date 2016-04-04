'use strict';

var yanpm = require('../index.js');
var ya  = new yanpm();

ya
    // add plugins
    //.add("ssh+git@github.com:lodash/lodash.git")
    .add("https://github.com/lodash/lodash.git#3.9.0")
    // require plugins, all done with requires
    .load().then(function(){
        console.log('Done loading plugins');

        //var _ = require('lodash');
        var _ = ya.get('lodash');
        console.log("lodash version:", _.VERSION);

        process.exit();
    });
