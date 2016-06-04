var common  = require('../../util/common.js');
var expect  = common.expect;

// --------------------------------------------------------------------------
// Test Errors
// TODO: improve these test, need to check errors are being handled correctly
// --------------------------------------------------------------------------
module.exports = [
    {
        name: "invalid file error",
        func: function (ya, done) {
            ya.add(["./_lodash-not-found.js"]).install().then(function(){
                expect( ya.errors() ).not.to.be.null;
                if(done) done();
            }, function(err){
                console.error('Error:', err);
                expect( err ).not.to.be.null;

                if(done) done();
            });
        }
    },
    {
        name: "set/get errors",
        func: function (ya, done) {
            ya.add("./_lodash.json").install().then(function(){
                expect( ya.errors() ).to.be.null;

                ya.setDefault();
                ya.setDefault('util');
                ya.setDefault('util', 'stumpy');
                ya.getDefault();
                ya.getAll();

                ya.get('lodash', ['args']);
                ya.get('util', 'lodash', 'not-args');

                ya.get('junk', 'no-plugin');

                if(done) done();
            }, function(err){
                //console.error('Error:', err);
                expect( err ).not.to.be.null;

                if(done) done();
            });
        }
    },
    {
        name: "add null errors",
        func: function (ya, done) {
            ya.add([
                {
                    group: null
                },
                {
                    name: null
                },
                {
                    package: null
                }
            ]).install().then(function(){
                if(done) done();
            }, function(err){
                //console.error('Error:', err);
                expect( err ).not.to.be.null;

                if(done) done();
            });
        }
    }
];