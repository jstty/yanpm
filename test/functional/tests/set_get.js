var common  = require('../../util/common.js');
var expect  = common.expect;

module.exports = [
    // -------------------------------------
    {
        name: "get with arguments",
        func: function (ya, done) {
            ya.add([
                {
                    "group":   "util",
                    "name":    "num",
                    "package": "numeral"
                }
            ]).install().then(function () {
                expect( ya.errors() ).to.be.null;

                var numeral = ya.get('util', 'num', [1234]);
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
    // -------------------------------------
    {
        name: "getDefault",
        func: function (ya, done) {
            ya.add([
                {
                    "group":   "util",
                    "package": "lodash@3.8"
                },
                {
                    "group":   "util",
                    "package": "numeral"
                }
            ]).install().then(function () {
                expect( ya.errors() ).to.be.null;

                // first item should be default
                var _ = ya.getDefault('util');
                expect(_).to.not.be.null;
                expect(_).to.be.a('function');

                expect(_.VERSION).to.be.a('string');
                console.log('VERSION:', _.VERSION);

                if (done) done();
            });
        }
    },
    {
        name: "default property set to true on plugin definition",
        func: function (ya, done) {
            ya.add([
                {
                    "group":   "util",
                    "package": "lodash"
                },
                {
                    "group":   "util",
                    "package": "numeral",
                    "default": true
                }
            ]).install().then(function () {
                expect( ya.errors() ).to.be.null;

                // second item should be set to default
                var numeral = ya.getDefault('util');
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
        name: "setDefault",
        func: function (ya, done) {
            ya.add([
                {
                    "group":   "util",
                    "package": "lodash"
                },
                {
                    "group":   "util",
                    "package": "numeral"
                }
            ]).install().then(function () {
                expect( ya.errors() ).to.be.null;

                // set default to second item
                ya.setDefault('util', 'numeral');
                var numeral = ya.getDefault('util');
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
        name: "getAll",
        func: function (ya, done) {
            ya.add([
                {
                    "group":   "util",
                    "package": "lodash"
                },
                {
                    "group":   "util",
                    "package": "numeral@1.5.3"
                }
            ]).install().then(function () {
                expect( ya.errors() ).to.be.null;

                var plugins = ya.getAll('util');
                var numeral = plugins.numeral;

                expect(numeral).to.not.be.null;
                expect(numeral).to.be.a('function');

                var num = numeral(1234);
                expect(num).to.be.a('object');
                expect(num.format("0,0")).to.equal("1,234");
                //console.log('num:', num.format());

                if (done) done();
            });
        }
    }
];