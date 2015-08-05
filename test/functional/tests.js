var _     = require('lodash');
var path  = require('path');
var yanpm = require('../../index.js');

require('shelljs/global');

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
                var dir = path.join(rootDir, '.' + path.sep + item);
                var file = path.join(dir + path.sep + name +'.js');
                //console.log("example test dir:", dir, ", file:", file);
                var tests = require(file);
                process.chdir(dir);

                beforeEach(function(){
                    //console.log("beforeEach:", name);
                    rm('-rf', './node_modules');
                });

                afterEach(function(){
                    //console.log("afterEach", name);
                    rm('-rf', './node_modules');
                });

                // iterated over all sub-tests for a single group test
                tests.forEach(function(test) {
                    it("Test "+(test.name), function(done) {
                        test.func(yanpm, done);
                    });
                });
            });

        });

    });
});
