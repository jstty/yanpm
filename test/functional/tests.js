var _     = require('lodash');
var path  = require('path');
var yanpm = require('../../index.js');

var rootDir = __dirname;
//console.log("root dir:", rootDir, "\n");
var timeoutSec = 500;

var list = require('./tests-list.json');

// increase listener limit
process.setMaxListeners(0);

// iterate over all test groups
_.forEach(list, function(testList, item){
    // create group for each test
    describe(item, function() {
        this.timeout(timeoutSec * 1000);

        // iterate over all tests in group
        _.forEach(testList, function(appName, name) {

            describe(name, function() {

                // create sub-group for each test
                var server = null;
                var dt = path.join(rootDir, '.' + path.sep + item + path.sep + name +'.js');
                //console.log("example test dir:", dt, "\n");
                var tests = require(dt);

                // iterated over all sub-tests for a single group test
                tests.forEach(function(test, idx) {
                    it("Test "+(test.name), function(done) {
                        test.func(yanpm, done);
                    });
                });
            });

        });

    });
});
