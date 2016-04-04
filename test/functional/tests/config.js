var common  = require('../../util/common.js');
var expect  = common.expect;

module.exports = [
    // -------------------------------------
    {
        name: "private repo",
        func: function (ya, done) {
            //console.log('TEST dirname:', __dirname, ", cwd:", process.cwd());
            ya.add("https://github.com/lodash/lodash.git#3.9.0").load().then(function(){
                expect( ya.error() ).to.be.null;

                var _ = ya.get('lodash');
                expect(_).to.not.be.null;
                expect(_).to.be.a('function');
                expect(_.VERSION).to.be.a('string');
                expect(_.VERSION).to.equal('3.9.0');
                //console.log('VERSION:', _.VERSION);

                if(done) done();
            });
        }
    },
    // -------------------------------------
    {
        name: "args - * group, name and package the same",
        func: function (ya, done) {
            //console.log('TEST dirname:', __dirname, ", cwd:", process.cwd());
            ya.add("lodash").load().then(function(){
                    expect( ya.error() ).to.be.null;

                    var _ = ya.get('lodash');
                    expect(_).to.not.be.null;
                    expect(_).to.be.a('function');
                    expect(_.VERSION).to.be.a('string');
                    //console.log('VERSION:', _.VERSION);

                    if(done) done();
                });
        }
    },
    {
        name: "args - * group, custom name and version package",
        func: function (ya, done) {
            ya.add("_", "lodash@3.9.0").load().then(function () {
                expect( ya.error() ).to.be.null;

                var _ = ya.get('_');
                expect(_).to.not.be.null;
                expect(_).to.be.a('function');
                expect(_.VERSION).to.be.a('string');
                expect(_.VERSION).to.equal('3.9.0');
                //console.log('VERSION:', _.VERSION);

                if (done) done();
            });
        }
    },
    {
        name: "args - util group, custom name and version package",
        func: function (ya, done) {
            ya.add("util", "_", "lodash@3.8.0").load().then(function () {
                expect( ya.error() ).to.be.null;

                var _ = ya.get('util', '_');
                expect(_).to.not.be.null;
                expect(_).to.be.a('function');
                expect(_.VERSION).to.be.a('string');
                expect(_.VERSION).to.equal('3.8.0');
                //console.log('VERSION:', _.VERSION);

                if (done) done();
            });
        }
    },
    {
        name: "args - util group, array of packages/names",
        func: function (ya, done) {
            ya.add("util", ["lodash"]).load().then(function () {
                expect( ya.error() ).to.be.null;

                var _ = ya.get('util', 'lodash');
                expect(_).to.not.be.null;
                expect(_).to.be.a('function');
                expect(_.VERSION).to.be.a('string');
                //console.log('VERSION:', _.VERSION);
                if (done) done();
            });
        }
    },
    {
        name: "args - util group, custom name and version package",
        func: function (ya, done) {
            ya.add("util", {
                "_": {
                    "package": "lodash"
                }
            }).load().then(function () {
                expect( ya.error() ).to.be.null;

                var _ = ya.get('util', '_');
                expect(_).to.not.be.null;
                expect(_).to.be.a('function');
                expect(_.VERSION).to.be.a('string');
                //console.log('VERSION:', _.VERSION);

                if (done) done();
            });
        }
    },
    // -------------------------------------
    {
        name: "object - util group and package",
        func: function (ya, done) {
            ya.add({
                "util": "lodash"
            }).load().then(function () {
                expect( ya.error() ).to.be.null;

                var _ = ya.get('util', 'lodash');
                expect(_).to.not.be.null;
                expect(_).to.be.a('function');
                expect(_.VERSION).to.be.a('string');
                //console.log('VERSION:', _.VERSION);

                if (done) done();
            });
        }
    },
    {
        name: "object - util group and package array",
        func: function (ya, done) {
            ya.add({
                "util": ["lodash"]
            }).load().then(function () {
                expect( ya.error() ).to.be.null;

                var _ = ya.get('util', 'lodash');
                expect(_).to.not.be.null;
                expect(_).to.be.a('function');
                expect(_.VERSION).to.be.a('string');
                //console.log('VERSION:', _.VERSION);
                if (done) done();
            });
        }
    },
    // ------------------------------------------------------
    {
        name: "object - util group, package and args",
        func: function (ya, done) {
            ya.add({
                "util": {
                    "numeral": {
                        "package": "numeral",
                        "args": [1234]
                    }
                }
            }).load().then(function () {
                expect( ya.error() ).to.be.null;

                var numeral = ya.get('util', 'numeral');
                expect(numeral).to.not.be.null;
                expect(numeral).to.be.a('function');
                var num = numeral();
                expect(num).to.be.a('object');
                expect(num.format("0,0")).to.equal("1,234");
                //console.log('num:', num.format());
                if (done) done();
            });
        }
    },
    // --------------------------------------------------------------------------
    //{
    //    name: "object - util group, package and args",
    //    func: function (ya, done) {
    //        ya.add({
    //            "util": {
    //                "glob": {
    //                    "package": "glob",
    //                    "args": ["../**/advanced.js"]
    //                }
    //            }
    //        }).load().then(function () {
    //            expect( ya.error() ).to.be.null;
    //
    //            var glob = ya.get('util', 'glob');
    //            expect(glob).to.not.be.null;
    //            expect(glob).to.be.a('function');
    //            glob(function (err, files) {
    //                expect(err).to.be.null;
    //                //console.log('files:', files);
    //                expect(files).to.be.a('array');
    //                expect(files[0]).to.equal("../tests/advanced.js");
    //                if (done) done();
    //            });
    //        });
    //    }
    //},
    // --------------------------------------------------------------------------
    {
        name: "object - util group, package and args with factory",
        func: function (ya, done) {
            ya.add({
                "util": {
                    "numeral": {
                        "package": "numeral",
                        "factory": function(numeral){ return numeral(1234); }
                    }
                }
            }).load().then(function () {
                expect( ya.error() ).to.be.null;

                var num = ya.get('util', 'numeral');

                expect(num).to.be.a('object');
                expect(num.format("0,0")).to.equal("1,234");
                //console.log('num:', num.format());
                if (done) done();
            });
        }
    },
    // -------------------------------------
    {
        name: "array - string package name",
        func: function (ya, done) {
            ya.add(['numeral']).load().then(function () {
                expect( ya.error() ).to.be.null;

                var numeral = ya.get('numeral');
                expect(numeral).to.not.be.null;
                expect(numeral).to.be.a('function');

                var num = numeral(1234);
                expect(num).to.be.a('object');
                expect(num.format("0,0")).to.equal("1,234");
                //console.log('num:', num.format());
                if (done) done();
            });
        }
    },
    {
        name: "array - object",
        func: function (ya, done) {
            ya.add([
                {
                    "group":   "util",
                    "name":    "num",
                    "package": "numeral"
                }
            ]).load().then(function () {
                expect( ya.error() ).to.be.null;

                var numeral = ya.get('util', 'num');
                expect(numeral).to.not.be.null;
                expect(numeral).to.be.a('function');

                var num = numeral(1234);
                expect(num).to.be.a('object');
                expect(num.format("0,0")).to.equal("1,234");
                //console.log('num:', num.format());
                if (done) done();
            });
        }
    },
    // -------------------------------------
    {
        name: "factory object",
        func: function (ya, done) {
            ya.add([
                {
                    "name":    "num",
                    "package": "numeral",
                    "factory":  function(numeral){
                        return numeral(1234);
                    }
                }
            ]).load().then(function () {
                expect( ya.error() ).to.be.null;

                var num = ya.get('num');
                expect(num).to.be.a('object');
                expect(num.format("0,0")).to.equal("1,234");
                //console.log('num:', num.format());
                if (done) done();
            });
        }
    },
    // -------------------------------------
    {
        name: "factory object using args",
        func: function (ya, done) {
            ya.add([
                {
                    "name":    "num",
                    "package": "numeral",
                    "factory":  function(numeral){
                        return numeral(); // args baked in
                    },
                    "args": [1234]
                }
            ]).load().then(function () {
                expect( ya.error() ).to.be.null;

                var num = ya.get('num');
                expect(num).to.be.a('object');
                expect(num.format("0,0")).to.equal("1,234");
                //console.log('num:', num.format());
                if (done) done();
            });
        }
    },
    // --------------------------------------------------------------------------
    {
        name: "loading file",
        func: function (ya, done) {
            ya.add("./_lodash.json").load().then(function(){
                expect( ya.error() ).to.be.null;

                var _ = ya.get('util', 'lodash');
                expect(_).to.not.be.null;
                expect(_).to.be.a('function');
                expect(_.VERSION).to.be.a('string');
                //console.log('VERSION:', _.VERSION);

                if(done) done();
            });
        }
    },
    {
        name: "loading files",
        func: function (ya, done) {
            ya.add(["./_lodash.js"]).load().then(function(){
                expect( ya.error() ).to.be.null;

                var _ = ya.get('util', '_');
                expect(_).to.not.be.null;
                expect(_).to.be.a('function');
                expect(_.VERSION).to.be.a('string');
                //console.log('VERSION:', _.VERSION);

                if(done) done();
            });
        }
    }
];