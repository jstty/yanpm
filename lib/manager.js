/*
 * Plugin Package Manager
 */
'use strict';

var npm = require('npm');
var Q   = require('q');

module.exports = Manager;

/*
 Usage:
 plugins
     .load()
     .add()
     .done(cb)
 */


// -------------------------------------------------------
// Util Function
function isFunction(func) {
    return (func && {}.toString.call(func) === '[object Function]');
}

function isObject(obj) {
    return (Object.prototype.toString.call(obj) === '[object Object]');
}

function isArray(obj) {
    return Array.isArray(obj);
}

function isString(str) {
    return (typeof str === 'string');
}


function getPackageName(pack) {
    var atPos = pack.indexOf('@');
    if(atPos < 1) {
        return pack;
    } else {
        return pack.substr(0, atPos);
    }
}
// -------------------------------------------------------


function Manager() {
    this._NPM_InitPromise = null;
    this._NPM_InstallPromises = [];

    this._pluginsReady = false;
    this._pluginConfigs = [];
    this._plugins = {};
}

Manager.prototype.load = function(file) {
    // check list of added plugins

    if(isArray(file) || isObject(file)) {
        this.add(file);
    }
    else if(isString(file)) {
        // TODO: add load config from file
    }

    if(!this._loadPlugins()) {
        for(var i = 0; i < this._pluginConfigs.length; i++) {
            this._NPM_Install(this._pluginConfigs[i]);
        }

        this._NPM_InitPromise
            .then(function() {
                Q.all(this._NPM_InstallPromises)
                    .then(function(){
                        this._pluginsReady = true;
                    }.bind(this));
            }.bind(this));
    } else {
        this._pluginsReady = true;
    }

    return this;
};

/*
 .add("lodash") // get latest
    converted to -> add("*", "lodash", "lodash")
 .add("lodash@3.5.0") // get specific version
    converted to -> add("*", "lodash", "lodash@3.5.0")

 .add("_", "lodash@3.5.0")
    converted to -> add("*", "_", "lodash@3.5.0")

 .add("util", "_", "lodash@3.5.0")
    converted to -> add("util", "_", "lodash@3.5.0")

 .add(["lodash", "moment"])
    converted to -> add("*", "lodash", "lodash")
    converted to -> add("*", "moment", "moment")
*/
Manager.prototype.add = function(group, name, npmPackage, type) {

    if(isArray(group)) {
        for(var i = 0; i < group.length; i++){
            var args = group[i];
            if(!isArray(args)) {
                args = [args];
            }

            this._add.apply(this, args);
        }
    } else {
        this._add(group, name, npmPackage, type);
    }

    return this;
};


Manager.prototype.done = function(cb) {
    if( !cb ||
        !isFunction(cb)) {
        console.error("Done Callback needs to be a function");
    }

    if(!this._pluginsReady) {
        if(!this._NPM_InitPromise) {
            console.error("Load Function must be called before Done");
            return;
        }

        // when init is done, then wait for all q'd promises
        this._NPM_InitPromise.then(function(){
            //console.log("done - Init Done");
            Q.all(this._NPM_InstallPromises)
                .then(function(){
                    cb(this);
                }.bind(this));
        }.bind(this));
    } else {
        cb(this);
    }

    return this;
};

Manager.prototype.get = function(group, name, args) {
    //console.log('get - group:', group, ', name:', name, ', args:', args);

    if(!name) {
        name  = group;
        group = "*";
        args = [];
    }

    if(isArray(name)) {
        args = name;
        name = group;
    }

    if( this._plugins &&
        this._plugins.hasOwnProperty(group) &&
        this._plugins[group].hasOwnProperty(name) &&
        this._plugins[group][name].hasOwnProperty('module') &&
        this._plugins[group][name].hasOwnProperty('config')
    ) {
        //console.log('get - group:', group, ', name:', name, ', args:', args, ', type:', this._plugins[group][name].config.type);
        if(this._plugins[group][name].config.type === "factory") {
            var fModule = this._plugins[group][name].module;
            var fNewModule = function() {
                fModule.apply(this, args);
            };
            fNewModule.prototype = fModule.prototype;
            return new fNewModule();
        }
        else {
            return this._plugins[group][name].module;
        }

    } else {
        return null;
    }
};


// -------------------------------------------------------
// Private Functions
Manager.prototype._add = function(group, name, npmPackage, type) {
    var pack = {
        "name":  name,
        "group": group,
        "package": npmPackage,
        "type": type
    };

    if(isObject(group)) {
        pack  = group;
        name  = group.name;
        npmPackage = group.package;
        group = group.group;
    }

    if(!name && group) {
        pack.name    = getPackageName(group);
        pack.package = group;
        pack.group   = "*";
    }

    if(!npmPackage && name && group) {
        pack.package = name;
        pack.name    = group;
        pack.group   = "*";
    }

    if(!pack.group) {
        pack.group = "*";
    }
    if(!pack.type) {
        pack.type = "singleton";
    }

    //console.log('add pack:', pack);
    this._pluginConfigs.push(pack);

    return this;
};

Manager.prototype._loadPlugins = function() {
    var error = false;

    for(var i = 0; i < this._pluginConfigs.length; i++) {
        error = error || this._requirePlugin(this._pluginConfigs[i]);
    }

    return !error;
};

Manager.prototype._requirePlugin = function(pluginConfig) {
    var error = false;

    var plugin = null;
    try {
        var pluginPack = pluginConfig.package;
        pluginPack = getPackageName(pluginPack);
        plugin = require(pluginPack);

        if(!this._plugins[pluginConfig.group]) {
            this._plugins[pluginConfig.group] = {};
        }

        this._plugins[pluginConfig.group][pluginConfig.name] = {
            module: plugin,
            config: pluginConfig
        };
    }
    catch (err) {
        // will need to get plugin from npm
        error = true;
    }

    return error;
};



// -------------------------------------------------------
// NPM function
Manager.prototype._NPM_Init = function() {
    var deferred = Q.defer();

    npm.load({}, function (err) {
        if (err) {
            console.error("load error:", err);
            deferred.reject(new Error(err));
            return;
        }

        deferred.resolve();
    }.bind(this));

    this._NPM_InitPromise     = deferred.promise;
    this._NPM_InstallPromises = [];
};

Manager.prototype._NPM_Install = function(pluginConfig) {
    if(!this._NPM_InitPromise) {
        this._NPM_Init();
    }

    this._NPM_InitPromise
        .then(function() {
            //console.log("load - Init Done");
            var deferred = Q.defer();

            var packages = [];
            packages.push(pluginConfig.package);

            npm.commands.install(packages, function (err, data) {
                if (err) {
                    console.error("install error:", err);
                    deferred.reject(new Error(err));
                    return;
                }

                this._requirePlugin(pluginConfig);

                deferred.resolve();
            }.bind(this));

            this._NPM_InstallPromises.push(deferred.promise);
        }.bind(this));

    return this;
};

// -------------------------------------------------------
