'use strict';

var yanpm = require('../index.js');
var shell = require('shelljs');
var ya  = new yanpm();
var list = [
   "lodash@3.9.0",
   "lodash",
   "lodash@3.8.0",
   "lodash"
];
var count = 0;

shell.rm('-rf', __dirname + '/node_modules');
test();

function test() {
    //console.log('Loading:', list[count]);
    var startTime = process.hrtime();

    ya.add(list[count])
    // require plugins, all done with requires
    .install().then(function(){
        var diff = process.hrtime(startTime);
        var diffSeconds = (diff[0] * 1e9 + diff[1])/(1e9);
        console.log('Time Diff: %d sec', diffSeconds);

        var _ = ya.get('lodash');
        console.log("lodash version:", _.VERSION);

        shell.rm('-rf', __dirname + '/node_modules');

        ya.reset();
        count++;
        if(count === list.length) {
            process.exit();
            return;
        }

        setTimeout(test, 0);
    });
}
