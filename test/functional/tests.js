var path  = require('path');

require('shelljs/global');

var rootDir = __dirname;
//console.log("root dir:", rootDir, "\n");
var timeoutSec = 200;

var list = require('./tests-list.json');

// increase listener limit
process.setMaxListeners(0);

// iterate over all test groups
var listKeys = Object.keys(list);
listKeys.forEach(function(item){
    var testList = list[item];

    // create group for each test
    describe(item, function() {
        this.timeout(timeoutSec * 1000);

        // iterate over all tests in group
        var names = Object.keys(testList);
        names.forEach(function(name) {

            describe(name, function() {
                // create sub-group for each test
                var dir = path.join(rootDir, '.' + path.sep + item);
                var file = path.join(dir + path.sep + name +'.js');
                //console.log("example test dir:", dir, ", file:", file);
                var tests = require(file);
                process.chdir(dir);

                var yanpm = null;
                beforeEach(function(done){
                    // ensure cache is clear
                    delete require.cache['../../index.js'];

                    //console.log("beforeEach:", name, ', cwd:', process.cwd());
                    setTimeout(function(){
                        yanpm = require('../../index.js');

                        rm('-rf', './node_modules');
                        done();
                    }, timeoutSec);
                });

                afterEach(function(done){
                    //console.log("afterEach", name, ', cwd:', process.cwd());
                    setTimeout(function(){
                        rm('-rf', './node_modules');
                        done();
                    }, timeoutSec);
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
