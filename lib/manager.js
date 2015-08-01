/*
 * Plugin Package Manager
 */
'use strict';

var path = require('path');
var npm  = require('npm');
var Q    = require('q');

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

/**
 * Load Plugins added
 * @param file (optional)
 * @returns {Manager}
 */
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

/**
 * Add Plugin
 * @param group
 * @param name
 * @param npmPackage
 * @param type
 * @param args
 * @returns {Manager}
 *
 * Examples:
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
 })
 */
Manager.prototype.add = function(group, name, npmPackage, type, args) {

    var list = group;
    var groupName = null;

    if(isString(group)) {
        groupName = group;
    }
    if(isString(group) && !isString(name)) {
        list = name;
    }

    var pack = null;
    if(isArray(list)) {
        list.forEach(function(args){
            if(!isArray(args)) {
                args = [args];
            }

            // if groupName, always put group first
            if(groupName) {
                args.shift(groupName);
            }

            var pack = this._normalizeAdd.apply(this, args);
            this._add(pack);
        }.bind(this));
    }
    else if((list === group) && isObject(list)) {
        // call add with group first for all keys in list
        // this allows for { "group": ... } group property value to be passed in to name
        for(var i in list) {
            if( isString(list[i]) ) {
                // handle the case where item is a string
                // the app API assumes second is string and third does not exist
                // then in group "*" which this is not the case, so package and name are the same
                this.add(i, list[i], list[i]);
            }
            else {
                this.add(i, list[i]);
            }
        }
    }
    else if((list !== group) && isObject(list)) {
        for(var iname in list) {
            var packIn = {
                "group":    groupName,
                "name":     iname,
                "package":  list[iname].package,
                "type":     list[iname].type,
                "args":     list[iname].args
            };

            pack = this._normalizeAdd(packIn);
            this._add(pack);
        }
    }
    else {
        pack = this._normalizeAdd(group, name, npmPackage, type, args);
        this._add(pack);
    }

    return this;
};

Manager.prototype._add = function(pack) {
    if(pack) {
        //console.log('add pack:', pack);
        this._pluginConfigs.push(pack);
    }
};

/**
 * Call callback when npm modules all loaded
 * @param cb
 * @returns {Manager}
 */
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

/**
 * Sets group default
 * @param group
 * @param args
 */
Manager.prototype.setDefault = function(group, name) {
    if(!isString(group)) {
        console.error("Invalid 'group' type expecting string, received:", group);
        return;
    }
    if(!isString(name)) {
        console.error("Invalid 'name' type expecting string, received:", name);
        return;
    }
    if(!this._plugins[group].hasOwnProperty(name)) {
        console.error('name:', name, " can not be found in group:", group);
        return;
    }

    // find default name, in group list
    this._plugins[group]._default = name;
};

/**
 * Gets group default
 * @param group
 * @param args
 */
Manager.prototype.getDefault = function(group, args) {
    if(!isString(group)) {
        console.error("Invalid 'group' type expecting string, received:", group);
        return null;
    }

    // find default name, in group list
    var name = this._plugins[group]._default;
    return this.get(group, name, args);
};

/**
 *
 * @param group
 * @returns {null}
 */
Manager.prototype.getAll = function(group) {
    if(!isString(group)) {
        console.error("Invalid 'group' type expecting string, received:", group);
        return null;
    }

    var list = {};
    for(var name in this._plugins[group]) {
        if(name !== "_default") {
            list[name] = this.get(group, name);
        }
    }
    return list;
};


/**
 * Gets plugin, if factory generates a new item each time
 * @param group
 * @param name
 * @param args
 * @returns {Manager}
 *
 * @example
 * .get('lodash')
 *
 * .get('util', '_')
 *
 * .get('moment', ['2013-01-01T00:00:00.000'])
 *
 */
Manager.prototype.get = function(group, name, args) {
    if(!name) {
        name  = group;
        group = "*";
        args = [];
    }

    if(isArray(name)) {
        args = name;
        name = group;
        group = "*";
    }

    if(!args) {
        args = [];
    }

    if(!isArray(args)) {
        console.warn("Expect arguments to be array, received:", args);
        args = [args];
    }
    //console.log('get - group:', group, ', name:', name, ', args:', args);

    if( this._plugins &&
        this._plugins.hasOwnProperty(group) &&
        this._plugins[group].hasOwnProperty(name) &&
        this._plugins[group][name].hasOwnProperty('module') &&
        this._plugins[group][name].hasOwnProperty('config')
    ) {
        // args not passed in but config has default args
        if( !args.length &&
            this._plugins[group][name].config.args &&
            this._plugins[group][name].config.args.length
        ) {
            args = this._plugins[group][name].config.args;
        }

        //console.log('get - group:', group, ', name:', name, ', args:', args, ', type:', this._plugins[group][name].config.type);
        if(this._plugins[group][name].config.type === "factory") {
            var fModule = this._plugins[group][name].module;

            //return new (Function.prototype.bind.apply(fModule, this._plugins[group][name].config.args));

            var fNewModule = function() {
                fModule.apply(this, args);
            };
            fNewModule.prototype = fModule.prototype;
            return new fNewModule();
        }
        else if(this._plugins[group][name].config.type === "singleton") {
            return this._plugins[group][name].module;
        }
        else {
            // TODO: this should not happen
            return this._plugins[group][name].module;
        }

    } else {
        return null;
    }
};


// -------------------------------------------------------
// Private Functions

/**
 * Normalizes Add properties
 * @param group
 * @param name
 * @param npmPackage
 * @param type
 * @param args
 * @returns {*}
 * @private
 *
 * Examples:
 ._normalizeAdd("lodash") // get latest
    converted to -> { group: "*", name: "lodash", package: "lodash", type: "singleton", args: [] }

 ._normalizeAdd("lodash@3.5.0") // get specific version
    converted to -> { group: "*", name: "lodash", package: "lodash@3.5.0", type: "singleton", args: [] }

 ._normalizeAdd("_", "lodash@3.5.0")
    converted to -> { group: "*", name: "_", package: "lodash@3.5.0", type: "singleton", args: [] }

 ._normalizeAdd("util", "_", "lodash@3.5.0")
    converted to -> { group: "util", name: "_", package: "lodash@3.5.0", type: "singleton", args: [] }

 ._normalizeAdd({
        "group": "util",
        "name": "logger1",
        "package": "stumpy@0.6.x",
        "type": "factory"
    })
    converted to -> { group: "util", name: "logger1", package: "stumpy@0.6.x", type: "factory", args: [] }

 ._normalizeAdd({
         "group": "util",
         "name": "logger1",
         "package": "stumpy@0.6.x",
         "type": "factory",
         "args": [
             "Logger2",
             {
                 showTrace: true,
                 showLogId: true,
                 showLogType: true
             }
         ]
    })
    no convertion
 */
Manager.prototype._normalizeAdd = function(group, name, npmPackage, type, args) {
    var pack = {
        "group": group,
        "name":  name,
        "package": npmPackage,
        "type": type || "singleton",
        "args": args || []
    };

    if(isObject(group)) {
        pack = {
            "group":   group.group   || "*",
            "name":    group.name    || group.package,
            "package": group.package || group.name,
            "type":    group.type    || pack.type,
            "args":    group.args    || pack.args
        };

        group = pack.group;
        name  = pack.name;
        npmPackage = pack.package;
    }

    if(!name && group) {
        pack.name    = getPackageName(group);
        pack.package = group;
        pack.group   = "*";
    }

    if(!npmPackage && group && name) {
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

    if(!pack.package) {
        console.error("Missing 'package' from plugin:", pack);
        return null;
    }
    if(!pack.name) {
        console.error("Missing 'name' from plugin:", pack);
        return null;
    }
    if(!isArray(pack.args)) {
        console.error("Default Arguments expect to be array, received:", pack.args);
        return null;
    }

    return pack;
};

/**
 * Load Plugins
 * @returns {boolean}
 * @private
 */
Manager.prototype._loadPlugins = function() {
    var error = false;

    for(var i = 0; i < this._pluginConfigs.length; i++) {
        error = error || this._requirePlugin(this._pluginConfigs[i]);
    }

    return !error;
};

/**
 * Run require on Plugins
 * @param pluginConfig
 * @returns {boolean}
 * @private
 */
Manager.prototype._requirePlugin = function(pluginConfig) {
    var error = false;

    var plugin = null;
    try {
        var pluginPack = pluginConfig.package;
        pluginPack = getPackageName(pluginPack);
        //console.log('requirePlugin pluginConfig:', pluginConfig);

        var packDir = path.join(process.cwd(), 'node_modules' + path.sep + pluginPack);
        //console.log('requirePlugin dir:', packDir);
        plugin = require(packDir);

        if(!this._plugins[pluginConfig.group]) {
            this._plugins[pluginConfig.group] = {};
        }

        if( pluginConfig.default ||
            !this._plugins[pluginConfig.group].hasOwnProperty('_default')) {
            this._plugins[pluginConfig.group]._default = pluginConfig.name;
        }

        this._plugins[pluginConfig.group][pluginConfig.name] = {
            module: plugin,
            config: pluginConfig
        };
    }
    catch (err) {
        // will need to get plugin from npm
        console.error('Error during require plugin:', err);
        error = true;
    }

    return error;
};



// -------------------------------------------------------
// NPM function
/**
 * Initialize NPM
 * @private
 */
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

/**
 * Run NPM Install on plugins
 * @param pluginConfig
 * @returns {Manager}
 * @private
 */
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
