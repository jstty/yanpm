# yanpm - Yet Another Node Plugin/Package Manager
[![Build Status](https://secure.travis-ci.org/jstty/yanpm.png?branch=master)](http://travis-ci.org/jstty/yanpm)
[![bitHound Score](https://www.bithound.io/github/jstty/yanpm/badges/score.svg?branch=master)](https://www.bithound.io/github/jstty/yanpm)
[![Coverage Status](https://coveralls.io/repos/jstty/yanpm/badge.svg?service=github&branch=master)](https://coveralls.io/github/jstty/yanpm?branch=master)
![License](https://img.shields.io/npm/l/yanpm.svg?branch=master)

[![Dependency Status](https://david-dm.org/jstty/yanpm.png?theme=shields.io&branch=master)](https://david-dm.org/jstty/yanpm)
[![devDependency Status](https://david-dm.org/jstty/yanpm/dev-status.png?theme=shields.io&branch=master)](https://david-dm.org/jstty/yanpm#info=devDependencies)
[![NPM](https://nodei.co/npm/yanpm.png)](https://nodei.co/npm/yanpm/)
==========================

## Description
Gives your node app/server the "Ya!" that it needs!

## Better Description
Config based Plugin manager to load dependencies at run time.
This allows for frameworks (e.g. yanpm) to have default core plugins that swapped out later but without added bloat.

# TODO
    [ ] Better Readme
    [/] Hide/Handle NPM console message

# Basic usage
```javascript
plugin
    .add('lodash')
    .load()
    .done(function(){
        console.log('Done loading plugins');

        var _ = plugin.get('lodash');
        console.log("lodash version:", _.VERSION);
    });
```

# More complex usage:
```javascript
plugin
    .add("logger",   "stumpy@0.6.x")
    .add("template", "ejs",        "yanpm-ejs")
    .add("template", "handlebars", "yanpm-handlebars");

plugin
    .add([{
         "name": "logger",
         "group": "util",
         "package": "stumpy@0.6.x",
         "factory": function (Stumpy) { return new Stumpy(); }
     }]);
```

# Other Supported Formats:
```javascript
plugin
     .add("lodash") // get latest
    
     .add("lodash@3.5.0") // get specific version
    
     .add("_", "lodash@3.5.0")
    
     .add("util", "_", "lodash@3.5.0")
    
     .add("util", ["lodash", "moment"])
     .add("util", [{
         "name": "logger1",
         "package": "stumpy@0.6.x",
         "factory": function (Stumpy) { return new Stumpy(); }
     }])
     .add("util", { "logger2": {
         "package": "stumpy",
         "factory": function (Stumpy) { return new Stumpy(); },
         "arguments": [
             "Logger2",
             {
                 showTrace: true,
                 showLogId: true,
                 showLogType: true
             }
         ]
     })
    
     .add(["lodash", "moment"])
     .add([
         {
            "group": "util",
            "name": "logger1",
            "package": "stumpy@0.6.x",
            "factory": function (Stumpy) { return new Stumpy(); }
         }
     ])
    
     .add({
        "util": "lodash"
     })
     .add({
        "util": [ "lodash" ]
     })
    
     .add({
         "util": {
             "logger2": {
                 "package": "stumpy",
                 "factory": function (Stumpy) { return new Stumpy(); },
                 "arguments": [
                     "Logger2",
                     {
                         showTrace: true,
                         showLogId: true,
                         showLogType: true
                     }
                 ]
             }
         }
     });
```

# Even more examples:
```javascript
plugin
    .add([
    {
        "name": "logger",
        "group": "util",
        "package": "stumpy@0.6.x",
        "factory": function (Stumpy) { return new Stumpy(); }
    },
    'lodash.json', // load file data
    './stumpy.js'  // load file data
    ]);
```

<!--
plugin
    .add([
    {
        "name": "basic-auth",
        "group": "route",
        "packages": "basic-auth",
        "dependencies": {
            "http": "express"
        },
        "route": {
            "setup": function(app, method, routeStr, func, options){
                var auth = function (req, res, next) {
                    function unauthorized(res) {
                        res.set('WWW-Authenticate', 'Basic realm='+(options.message || 'Authorization Required') );
                        return res.send(401);
                    }

                    var user = basicAuth(req);
                    if (!user || !user.name || !user.pass) {
                        return unauthorized(res);
                    }

                    if ( user.name === options.user &&
                         user.pass === options.pass ) {
                        return next();
                    } else {
                        return unauthorized(res);
                    }
                };

                app[ method ](routeStr, auth, func);
            }
        }
    },
    {
        "name": "ejs",
        "group": "template",
        "packages": "ejs",
        "template": {
            "isValidData": function(templateData) {
                if( templateData &&
                    (typeof templateData === 'string') &&
                    (templateData.indexOf('<%') != -1)
                ) {
                    return true;
                } else {
                    return false
                }
            },
            "isValidFileExtension": function(fileExt) {
                return fileExt === 'ejs';
            },
            "compile": function(templateData) {
                return ejs.compile(templateData);
            }
        }
    },
    {
        "name": "handlebars",
        "group": "template",
        "packages": "handlebars",
        "template": {
            "isValidData": function(templateData) {
                if( templateData &&
                    _.isString(templateData) &&
                    templateData.indexOf('{{') != -1) {
                    return true;
                } else {
                    return false
                }
            },
            "isValidFileExtension": function(fileExt) {
                return _.contains(['handlebars', 'hbs'], fileExt);
            },
            "compile": function(templateData) {
                return handlebars.compile(templateData);
            }
        }
    }
    ]);
-->