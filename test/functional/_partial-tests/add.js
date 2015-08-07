var common  = require('../../util/common.js');
var expect  = common.expect;

module.exports = [
    {
        name: "args - * group, name and package the same",
        func: function (yanpm, done) {
            expect(yanpm).to.not.be.null;
            var ya = new yanpm();

            //console.log('TEST dirname:', __dirname, ", cwd:", process.cwd());

            ya.add("lodash").load().done(function(){

                    var _ = ya.get('lodash');
                    expect(_).to.not.be.null;
                    expect(_).to.be.a('function');
                    expect(_.VERSION).to.be.a('string');
                    //console.log('VERSION:', _.VERSION);

                    ya.reset();
                    if(done) done();
                });
        }
    },
    {
        name: "args - * group, custom name and version package",
        func: function (yanpm, done) {
            expect(yanpm).to.not.be.null;
            var ya = new yanpm();
            ya.add("_", "lodash@3.9.0").load().done(function () {
                var _ = ya.get('_');
                expect(_).to.not.be.null;
                expect(_).to.be.a('function');
                expect(_.VERSION).to.be.a('string');
                //console.log('VERSION:', _.VERSION);

                ya.reset();
                if (done) done();
            });
        }
    },
    {
        name: "args - util group, custom name and version package",
        func: function (yanpm, done) {
            expect(yanpm).to.not.be.null;
            var ya = new yanpm();
            ya.add("util", "_", "lodash@3.8.x").load().done(function () {
                var _ = ya.get('util', '_');
                expect(_).to.not.be.null;
                expect(_).to.be.a('function');
                expect(_.VERSION).to.be.a('string');
                //console.log('VERSION:', _.VERSION);

                ya.reset();
                if (done) done();
            });
        }
    },
    // TODO: fix this case
    //{
    //    name: "args - util group, custom name and version package",
    //    func: function (yanpm, done) {
    //        expect(yanpm).to.not.be.null;
    //        var ya = new yanpm();
    //        ya.add("util", ["lodash"]).load().done(function () {
    //            var _ = ya.get('util', 'lodash');
    //            expect(_).to.not.be.null;
    //            expect(_).to.be.a('function');
    //            expect(_.VERSION).to.be.a('string');
    //            //console.log('VERSION:', _.VERSION);
    //            if (done) done();
    //        });
    //    }
    //},
    {
        name: "args - util group, custom name and version package",
        func: function (yanpm, done) {
            expect(yanpm).to.not.be.null;
            var ya = new yanpm();
            ya.add("util", {
                "_": {
                    "package": "lodash"
                }
            }).load().done(function () {
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
        func: function (yanpm, done) {
            expect(yanpm).to.not.be.null;
            var ya = new yanpm();
            ya.add({
                "util": "lodash"
            }).load().done(function () {
                var _ = ya.get('util', 'lodash');
                expect(_).to.not.be.null;
                expect(_).to.be.a('function');
                expect(_.VERSION).to.be.a('string');
                //console.log('VERSION:', _.VERSION);
                if (done) done();
            });
        }
    },
    // TODO: fix this case
    //{
    //    name: "object - util group and package array",
    //    func: function (yanpm, done) {
    //        expect(yanpm).to.not.be.null;
    //        var ya = new yanpm();
    //        ya.add({
    //            "util": ["lodash"]
    //        }).load().done(function () {
    //            var _ = ya.get('util', 'lodash');
    //            expect(_).to.not.be.null;
    //            expect(_).to.be.a('function');
    //            expect(_.VERSION).to.be.a('string');
    //            //console.log('VERSION:', _.VERSION);
    //            if (done) done();
    //        });
    //    }
    //},
    // ------------------------------------------------------
    //{
    //    name: "object - util group, package and args",
    //    func: function (yanpm, done) {
    //        expect(yanpm).to.not.be.null;
    //        var ya = new yanpm();
    //        ya.add({
    //            "util": {
    //                "moment": {
    //                    "package": "moment",
    //                    "args": ["20111031", "YYYYMMDD"]
    //                }
    //            }
    //        }).load().done(function () {
    //            var moment = ya.get('util', 'moment');
    //            expect(moment).to.not.be.null;
    //            expect(moment).to.be.a('function');
    //            var time = moment();
    //            expect(time).to.be.a('object');
    //            expect(time.format()).to.equal("2011-10-31T00:00:00-07:00");
    //            //console.log('time:', time.format());
    //            if (done) done();
    //        });
    //    }
    //},
    //{
    //    name: "object - util group, package and args",
    //    func: function (yanpm, done) {
    //        expect(yanpm).to.not.be.null;
    //        var ya = new yanpm();
    //        ya.add({
    //            "util": {
    //                "moment": {
    //                    "package": "moment",
    //                    "args": ["20111031"]
    //                }
    //            }
    //        }).load().done(function () {
    //            var moment = ya.get('util', 'moment');
    //            expect(moment).to.not.be.null;
    //            expect(moment).to.be.a('function');
    //            var time = moment("YYYYMMDD");
    //            expect(time).to.be.a('object');
    //            expect(time.format()).to.equal("2011-10-31T00:00:00-07:00");
    //            //console.log('time:', time.format());
    //            if (done) done();
    //        });
    //    }
    //},
    //// -------------------------------------
    //{
    //    name: "object - util group, package and args with factory",
    //    func: function (yanpm, done) {
    //        expect(yanpm).to.not.be.null;
    //        var ya = new yanpm();
    //        ya.add({
    //            "util": {
    //                "moment": {
    //                    "package": "moment",
    //                    "factory": function(moment){ return moment("20111031", "YYYYMMDD"); }
    //                }
    //            }
    //        }).load().done(function () {
    //            var time = ya.get('util', 'moment');
    //
    //            expect(time).to.be.a('object');
    //            expect(time.format()).to.equal("2011-10-31T00:00:00-07:00");
    //            //console.log('time:', time.format());
    //            if (done) done();
    //        });
    //    }
    //},
    //// -------------------------------------
    //{
    //    name: "array - string package name",
    //    func: function (yanpm, done) {
    //        expect(yanpm).to.not.be.null;
    //        var ya = new yanpm();
    //        ya.add(['moment']).load().done(function () {
    //            var moment = ya.get('moment');
    //            expect(moment).to.not.be.null;
    //            expect(moment).to.be.a('function');
    //
    //            var time = moment("20111031", "YYYYMMDD");
    //            expect(time).to.be.a('object');
    //            expect(time.format()).to.equal("2011-10-31T00:00:00-07:00");
    //            //console.log('time:', time.format());
    //            if (done) done();
    //        });
    //    }
    //},
    //{
    //    name: "array - object",
    //    func: function (yanpm, done) {
    //        expect(yanpm).to.not.be.null;
    //        var ya = new yanpm();
    //        ya.add([
    //            {
    //                "group":   "util",
    //                "name":    "time",
    //                "package": "moment"
    //            }
    //        ]).load().done(function () {
    //            var moment = ya.get('util', 'time');
    //            expect(moment).to.not.be.null;
    //            expect(moment).to.be.a('function');
    //
    //            var time = moment("20111031", "YYYYMMDD");
    //            expect(time).to.be.a('object');
    //            expect(time.format()).to.equal("2011-10-31T00:00:00-07:00");
    //            //console.log('time:', time.format());
    //            if (done) done();
    //        });
    //    }
    //},
    //// -------------------------------------
    //{
    //    name: "factory object",
    //    func: function (yanpm, done) {
    //        expect(yanpm).to.not.be.null;
    //        var ya = new yanpm();
    //        ya.add([
    //            {
    //                "name":    "time",
    //                "package": "moment",
    //                "factory":  function(moment){
    //                    return moment("20111031", "YYYYMMDD");
    //                }
    //            }
    //        ]).load().done(function () {
    //            var time = ya.get('time');
    //            expect(time).to.be.a('object');
    //            expect(time.format()).to.equal("2011-10-31T00:00:00-07:00");
    //            //console.log('time:', time.format());
    //            if (done) done();
    //        });
    //    }
    //},
    //// -------------------------------------
    //{
    //    name: "factory object using args",
    //    func: function (yanpm, done) {
    //        expect(yanpm).to.not.be.null;
    //        var ya = new yanpm();
    //        ya.add([
    //            {
    //                "name":    "time",
    //                "package": "moment",
    //                "factory":  function(moment){
    //                    return moment(); // args baked in
    //                },
    //                "args": ["20111031", "YYYYMMDD"]
    //            }
    //        ]).load().done(function () {
    //            var time = ya.get('time');
    //            expect(time).to.be.a('object');
    //            expect(time.format()).to.equal("2011-10-31T00:00:00-07:00");
    //            //console.log('time:', time.format());
    //            if (done) done();
    //        });
    //    }
    //},
    //// -------------------------------------
    //{
    //    name: "get with arguments",
    //    func: function (yanpm, done) {
    //        expect(yanpm).to.not.be.null;
    //        var ya = new yanpm();
    //        ya.add([
    //            {
    //                "group":   "util",
    //                "name":    "time",
    //                "package": "moment"
    //            }
    //        ]).load().done(function () {
    //            var moment = ya.get('util', 'time', ["20111031", "YYYYMMDD"]);
    //            expect(moment).to.not.be.null;
    //            expect(moment).to.be.a('function');
    //
    //            var time = moment();
    //            expect(time).to.be.a('object');
    //            expect(time.format()).to.equal("2011-10-31T00:00:00-07:00");
    //            //console.log('time:', time.format());
    //            if (done) done();
    //        });
    //    }
    //},
    //// -------------------------------------
    //{
    //    name: "getDefault",
    //    func: function (yanpm, done) {
    //        expect(yanpm).to.not.be.null;
    //        var ya = new yanpm();
    //        ya.add([
    //            {
    //                "group":   "util",
    //                "package": "lodash"
    //            },
    //            {
    //                "group":   "util",
    //                "package": "moment"
    //            }
    //        ]).load().done(function () {
    //            // first item should be default
    //            var _ = ya.getDefault('util');
    //            expect(_).to.not.be.null;
    //            expect(_).to.be.a('function');
    //            expect(_.VERSION).to.be.a('string');
    //            //console.log('VERSION:', _.VERSION);
    //            if (done) done();
    //        });
    //    }
    //},
    //{
    //    name: "default property set to true on plugin definition",
    //    func: function (yanpm, done) {
    //        expect(yanpm).to.not.be.null;
    //        var ya = new yanpm();
    //        ya.add([
    //            {
    //                "group":   "util",
    //                "package": "lodash"
    //            },
    //            {
    //                "group":   "util",
    //                "package": "moment",
    //                "default": true
    //            }
    //        ]).load().done(function () {
    //            // second item should be set to default
    //            var moment = ya.getDefault('util');
    //            expect(moment).to.not.be.null;
    //            expect(moment).to.be.a('function');
    //
    //            var time = moment("20111031", "YYYYMMDD");
    //            expect(time).to.be.a('object');
    //            expect(time.format()).to.equal("2011-10-31T00:00:00-07:00");
    //            //console.log('time:', time.format());
    //            if (done) done();
    //        });
    //    }
    //},
    //{
    //    name: "setDefault",
    //    func: function (yanpm, done) {
    //        expect(yanpm).to.not.be.null;
    //        var ya = new yanpm();
    //        ya.add([
    //            {
    //                "group":   "util",
    //                "package": "lodash"
    //            },
    //            {
    //                "group":   "util",
    //                "package": "moment"
    //            }
    //        ]).load().done(function () {
    //            // set default to second item
    //            ya.setDefault('util', 'moment');
    //            var moment = ya.getDefault('util');
    //            expect(moment).to.not.be.null;
    //            expect(moment).to.be.a('function');
    //
    //            var time = moment("20111031", "YYYYMMDD");
    //            expect(time).to.be.a('object');
    //            expect(time.format()).to.equal("2011-10-31T00:00:00-07:00");
    //            //console.log('time:', time.format());
    //            if (done) done();
    //        });
    //    }
    //},
    // -------------------------------------
    {
        name: "getAll",
        func: function (yanpm, done) {
            expect(yanpm).to.not.be.null;
            var ya = new yanpm();
            ya.add([
                {
                    "group":   "util",
                    "package": "lodash"
                },
                {
                    "group":   "util",
                    "name": "moment",
                    "package": "moment@2.9.0"
                }
            ]).load().done(function () {
                var plugins = ya.getAll('util');
                var moment = plugins.moment;

                expect(moment).to.not.be.null;
                expect(moment).to.be.a('function');

                var time = moment("20111031", "YYYYMMDD");
                expect(time).to.be.a('object');
                expect(time.format()).to.equal("2011-10-31T00:00:00-07:00");
                //console.log('time:', time.format());

                ya.reset();
                if (done) done();
            });
        }
    }

];