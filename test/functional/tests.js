var path  = require('path');
var common  = require('../util/common.js');
var expect  = common.expect;

require('shelljs/global');

var rootDir = __dirname;
//console.log("root dir:", rootDir, "\n");
var timeoutSec = 300;

var list = require('./tests-list.js');

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
            var fileName = testList[name];

            describe(name, function() {
                // create sub-group for each test
                var dir = path.join(rootDir, '.' + path.sep + item);
                var file = path.join(dir + path.sep + fileName +'.js');
                //console.log("example test dir:", dir, ", file:", file);
                var tests = require(file);
                process.chdir(dir);

                var ya = null;
                beforeEach(function(done){

                    //console.log("beforeEach:", name, ', cwd:', process.cwd());
                    rm('-rf', process.cwd()+'/node_modules');

                    setTimeout(function(){
                        if(!ya) {
                            var yanpm = require('../../index.js');
                            ya = new yanpm();
                        }

                        done();
                    }, 500);
                });

                afterEach(function(done){
                    //console.log("afterEach", name, ', cwd:', process.cwd());
                    rm('-rf', process.cwd()+'/node_modules');

                    setTimeout(function(){
                        ya.reset();

                        done();
                    }, 500);
                });

                // iterated over all sub-tests for a single group test
                tests.forEach(function(test) {
                    it("Test "+(test.name), function(done) {
                        console.log("running test:", test.name);
                        expect(ya).to.not.be.null;

                        test.func(ya, done);
                    });
                });
            });

        });

    });
});
