# yanpm - Yet Another Node Plugin/Package Manager
==========================
![License](https://img.shields.io/npm/l/yanpm.svg)

[![Dependency Status](https://david-dm.org/jstty/yanpm.png?theme=shields.io)](https://david-dm.org/jstty/yanpm) 
[![NPM](https://nodei.co/npm/yanpm.png)](https://nodei.co/npm/yanpm/)
==========================

## Description
Gives your node app/server the "Ya!" that it needs!

## Better Description
Config based Plugin manager to load dependencies at run time.
This allows for frameworks (e.g. Hyper.io) to have default core plugins that swapped out later but without added bloat.

# TODO
    [ ] Better Readme
    [ ] Hide/Handle NPM console message

# Basic usage
```javascript
plugin
    .add(['lodash', 'moment'])
    .run()
    .done(function(plugins){
        console.log('Done loading plugins');

        var _ = plugins.get('lodash');
        console.log("lodash version:", _.VERSION);
    });
```

# More complex usage:
```javascript
plugin
    .add("logger",   "stumpy@0.6.x")
    .add("template", "ejs",        "hyper.io-ejs")
    .add("template", "handlebars", "hyper.io-handlebars");

plugin
    .add([{
         "name": "logger",
         "group": "util",
         "package": "stumpy@0.6.x"
         ,"type": "factory" // default "singleton"
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
         "type": "factory" // default "singleton"
     }])
     .add("util", { "logger2": {
         "package": "stumpy",
         "type": "factory", // default "singleton"
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
            "type": "factory" // default "singleton"
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
                 "type": "factory", // default "singleton"
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
        "type": "factory"
    },
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
```
