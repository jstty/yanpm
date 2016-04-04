/*
 * Plugin Package Manager
 */
'use strict';

var path = require('path');
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
var NODE_MODULES_DIR = 'node_modules';

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
    if (atPos < 1) {
        return pack;
    } else {
        return pack.substr(0, atPos);
    }
}

function getPackageVersion(pack) {
    var atPos = pack.indexOf('@');
    if (atPos < 1) {
        return '';
    } else {
        return pack.substr(atPos+1);
    }
}

function requireRemoveCache(moduleName) {
    //console.log('moduleName:', moduleName);
    var mods = requireFindModuleCache(moduleName);

    // delete all cache
    mods.forEach(function(mod){

        // Remove cached paths to the module.
        Object.keys(mod.constructor._pathCache).forEach(function(cacheKey) {
            var moduleCacheKey = moduleName;
            if(moduleName.indexOf(NODE_MODULES_DIR) < 0) {
                moduleCacheKey = NODE_MODULES_DIR + path.sep + moduleName;
            }

            if (cacheKey.indexOf(moduleCacheKey) > 0) {
                delete mod.constructor._pathCache[cacheKey];
            }
        });

        delete require.cache[mod.id];
    });
}

function requireFindModuleCache(moduleName) {
    var mods = [];
    //console.info('findModule:', moduleName);

    // Resolve the module identified by the specified name
    var mod = require.resolve(moduleName);

    // Check if the module has been resolved and found within
    if(mod) {
        mod = require.cache[mod];
    }

    //console.info('findModule:', mod);
    if (mod !== undefined) {
        // Recursively go over the results
        (function run(mod) {
            // add, found module
            mods.push(mod);

            // add all children module's and all there children...
            mod.children.forEach(function (child) {
                run(child);
            });
        })(mod);
    }

    return mods;
}
// -------------------------------------------------------


function Manager(options) {
    this._logger = console;
    if(options) {
        this._logger = options.logger;
    }

    this.reset();
}


/**
 * Load Plugins added
 * @param callback
 * @returns {Manager}
 */
Manager.prototype._depricated_load = function (cb) {

    // call new method but using promise then to call callback
    this.load().then(cb);

    return this;
};

/**
 * Load Plugins added
 * @param callback (optional)
 * @returns {Promise}
 */
Manager.prototype.load = function (cb) {

    // if old method of loading
    if(cb && isFunction(cb)) {
        return this._depricated_load(cb);
    }

    if (!this._pluginConfigs || !this._pluginConfigs.length) {
        this._logger.warn("No plugins added");
        return Q.resolve(this);
    }

    // check list of added plugins
    if (!this._loadPlugins()) {
        for (var i = 0; i < this._pluginConfigs.length; i++) {
            this._NPM_Install(this._pluginConfigs[i]);
        }
    } else {
        this._pluginsReady = true;
    }

    //    // if not ready, wait...
    if (!this._pluginsReady) {
        // when init is done, then wait for all q'd promises
        return this._NPM_InitPromise.then(function () {
            //this._logger.log("done - Init Done");
            return Q.all(this._NPM_InstallPromises).then(function (info) {
                //this._logger.error("load info:", info);
                info.forEach(function (data) {
                    if (data.error) {
                        this._error = data.error;
                        //this._logger.error("load err:", this._error);
                    }
                }.bind(this));

                this._pluginsReady = true;
                return this;
            }.bind(this));
        }.bind(this));
    }
    else {
        return Q.resolve(this);
    }
};

/**
 * Add Plugin
 * @param group
 * @param name
 * @param npmPackage
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
     "factory": function (stumpy) { return new stumpy(); }
 }])
 .add("util", { "logger2": {
     "package": "stumpy",
     "factory": function (stumpy) { return new stumpy(); }
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
        "factory": function (stumpy) { return new stumpy(); }
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
             "factory": function (stumpy) { return new stumpy(); }
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
Manager.prototype.add = function (group, name, npmPackage, args) {

    var list = group;
    var groupName = null;

    // check if file
    if (isString(group) && !isString(name) && !isString(npmPackage) && !args ) {
        try {
            var dir = path.join(process.cwd(), group);
            var data = require(dir);

            return this.add(data);
        } catch(err) {
            // error only if not exist
            if(err.code !== 'ENOENT' && err.code !== 'MODULE_NOT_FOUND') {
                this._logger.error('err:', err);
                // do nothing
                return this;
            }
        }
    }

    if (isString(group)) {
        groupName = group;
    }
    if (isString(group) && !isString(name)) {
        list = name;
    }

    var pack = null;
    // list is array but not name
    if (isArray(list)) {
        list.forEach(function (args) {
            var useNormalize = true;

            if (isString(args)) {
                if (groupName) {
                    // this is the name and package, so if groupName added, it will Normalize the plugin input correctly
                    args = [args, args];
                } else {
                    args = [args];
                    useNormalize = false;
                }
            }
            else if (!isArray(args)) {
                args = [args];
            }

            // if groupName, always put group first
            if (groupName) {
                args.unshift(groupName);
            }

            //
            if(useNormalize) {
                pack = this._normalizeAdd.apply(this, args);
                this._add(pack);
            } else {
                this.add.apply(this, args);
            }
        }.bind(this));
    }
    // list is object and group
    else if ((list === group) && isObject(list)) {
        // call add with group first for all keys in list
        // this allows for { "group": ... } group property value to be passed in to name
        for (var i in list) {
            if (isString(list[i])) {
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
    // list is not group and object
    else if ((list !== group) && isObject(list)) {
        for (var iname in list) {
            var packIn = {
                "group":    groupName,
                "name":     iname,
                "package":  list[iname].package,
                "args":     list[iname].args,
                "factory":  list[iname].factory
            };

            pack = this._normalizeAdd(packIn);
            this._add(pack);
        }
    }
    else {
        pack = this._normalizeAdd(group, name, npmPackage, args);
        this._add(pack);
    }

    return this;
};

Manager.prototype._add = function (pluginConfig) {
    if (pluginConfig) {
        // create groups if needed
        if (!this._plugins[pluginConfig.group]) {
            this._plugins[pluginConfig.group] = {};
        }

        // add first plugin to default group
        if ( pluginConfig.default ||
            !this._plugins[pluginConfig.group].hasOwnProperty('_default')) {
            this._plugins[pluginConfig.group]._default = pluginConfig.name;
            //this._logger.log('requirePlugin setting default:', pluginConfig.name);
        }

        //this._logger.log('add pack:', pack);
        this._pluginConfigs.push(pluginConfig);
    }
};

Manager.prototype.error = function () {
    return this._error;
};

Manager.prototype.reset = function () {
    requireRemoveCache('npm');
    this._NPM_InitPromise = null;
    this._NPM_InstallPromises = [];

    // clear all required modules
    if(this._pluginConfigs && this._pluginConfigs.length) {
        for (var i = 0; i < this._pluginConfigs.length; i++) {
            // don't remove modules with errors, they where never loaded
            if(!this._pluginConfigs[i].error) {
                var packDir = path.join(process.cwd(), this._pluginConfigs[i].dir);
                requireRemoveCache(packDir);
            }
        }
    }

    this._pluginsReady = false;
    this._pluginConfigs = [];
    this._plugins = {};
    this._error = null;
};

/**
 * Sets group default
 * @param group
 * @param args
 */
Manager.prototype.setDefault = function (group, name) {
    if (!isString(group)) {
        this._logger.error("Invalid 'group' type expecting string, received:", group);
        return;
    }
    if (!isString(name)) {
        this._logger.error("Invalid 'name' type expecting string, received:", name);
        return;
    }
    if ( !this._plugins.hasOwnProperty(group) ||
         !this._plugins[group] ||
         !this._plugins[group].hasOwnProperty(name)) {
        this._logger.error('name:', name, " can not be found in group:", group);
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
Manager.prototype.getDefault = function (group, args) {
    if (!isString(group)) {
        this._logger.error("Invalid 'group' type expecting string, received:", group);
        return;
    }

    if( !this._plugins.hasOwnProperty(group) ||
        !this._plugins[group] ||
        !this._plugins[group].hasOwnProperty("_default")) {
        return;
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
Manager.prototype.getAll = function (group) {
    if (!isString(group)) {
        this._logger.error("Invalid 'group' type expecting string, received:", group);
        return null;
    }

    var list = {};
    for (var name in this._plugins[group]) {
        if (name !== "_default") {
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
Manager.prototype.get = function (group, name, args) {
    if (!name) {
        name = group;
        group = "*";
        args = [];
    }

    if (isArray(name)) {
        args = name;
        name = group;
        group = "*";
    }

    if (!args) {
        args = [];
    }

    if (!isArray(args)) {
        this._logger.warn("Expect arguments to be array, received:", args);
        args = [args];
    }
    //this._logger.log('get - group:', group, ', name:', name, ', args:', args);

    if (this._plugins &&
        this._plugins.hasOwnProperty(group) &&
        this._plugins[group].hasOwnProperty(name) &&
        this._plugins[group][name].hasOwnProperty('module') &&
        this._plugins[group][name].hasOwnProperty('config')
    ) {
        // args not passed in but config has default args
        if (!args.length &&
            this._plugins[group][name].args &&
            this._plugins[group][name].args.length
        ) {
            args = this._plugins[group][name].args;
        }

        var fModule = this._plugins[group][name].module;
        var fNewModule = fModule;

        // only wrap module if has args passed in
        if(args.length) {
            fNewModule = function() {
                var nArgs = args.concat(Array.prototype.splice.call(arguments, 0));
                return fModule.apply( fModule, nArgs );
            };

            // copy all proerties to new wrapped module
            for(var i in fModule) {
                fNewModule[i] = fModule[i];
            }
        }

        var factory = this._plugins[group][name].factory;
        if(factory && isFunction(factory)) {
            return factory(fNewModule);
        } else {
            return fNewModule;
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
 converted to -> { group: "*", name: "lodash", package: "lodash", args: [] }

 ._normalizeAdd("lodash@3.5.0") // get specific version
 converted to -> { group: "*", name: "lodash", package: "lodash@3.5.0", args: [] }

 ._normalizeAdd("_", "lodash@3.5.0")
 converted to -> { group: "*", name: "_", package: "lodash@3.5.0", args: [] }

 ._normalizeAdd("util", "_", "lodash@3.5.0")
 converted to -> { group: "util", name: "_", package: "lodash@3.5.0", args: [] }

 ._normalizeAdd({
        "group": "util",
        "name": "logger1",
        "package": "stumpy@0.6.x",
        "factory": function (stumpy) { return new stumpy(); }
    })
 converted to -> { group: "util", name: "logger1", package: "stumpy@0.6.x", args: [] }

 ._normalizeAdd({
         "group": "util",
         "name": "logger1",
         "package": "stumpy@0.6.x",
         "factory": function (stumpy) { return new stumpy(); }
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
Manager.prototype._normalizeAdd = function (group, name, npmPackage, args) {
    var pack = {
        "group": group,
        "name":  name,
        "package": npmPackage,
        "dir": "",
        "version": "",
        "factory": null,
        "args": args || [],
        "default": false,
        "error": null
    };

    if (isObject(group)) {
        pack = {
            "group":   group.group   || "*",
            "name":    group.name    || group.package || pack.name    || pack.package,
            "package": group.package || group.name    || pack.package || pack.name,
            "factory": group.factory || pack.factory,
            "args":    group.args    || pack.args,
            "default": group.default || pack.default
        };
        // remove any string after @ in the name
        if(pack.name && isString(pack.name) && pack.name.indexOf('@') > 0) {
            pack.name = pack.name.substr(0, pack.name.indexOf('@'));
        }
        //this._logger.log("plugin:", JSON.stringify(pack, null, 2), ', group:', JSON.stringify(group, null, 2));

        if(!pack.package || !pack.package.length) {
            this._logger.error("Missing 'package' from plugin:", pack);
            return null;
        }

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

    if (!pack.group) {
        pack.group = "*";
    }

    // default packageDir to node_modules/<package name>
    pack.dir = NODE_MODULES_DIR + path.sep + pack.name;


    if (!pack.package) {
        this._logger.error("Missing 'package' from plugin:", pack);
        return null;
    }
    if (!pack.name) {
        this._logger.error("Missing 'name' from plugin:", pack);
        return null;
    }
    if (!isArray(pack.args)) {
        this._logger.error("Default Arguments expect to be array, received:", pack.args);
        return null;
    }

    return pack;
};

/**
 * Load Plugins
 * @returns {boolean}
 * @private
 */
Manager.prototype._loadPlugins = function () {
    var error = false;

    for (var i = 0; i < this._pluginConfigs.length; i++) {
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
// TODO: make promise
Manager.prototype._requirePlugin = function (pluginConfig) {
    var error = false;

    var plugin = null;
    try {
        //this._logger.log('requirePlugin pluginConfig:', pluginConfig);

        var packDir = path.join(process.cwd(), pluginConfig.dir);
        //this._logger.log('requirePlugin dir:', packDir);
        plugin = require(packDir);

        this._plugins[pluginConfig.group][pluginConfig.name] = {
            module: plugin,
            config: pluginConfig,
            factory: pluginConfig.factory || null,
            args: pluginConfig.args || []
        };
    }
    catch (err) {
        // will need to get plugin from npm
        //this._logger.error('Error during require plugin:', err);
        error = err;
    }

    return error;
};


// -------------------------------------------------------
// NPM function
/**
 * Initialize NPM
 * @private
 */
Manager.prototype._NPM_Init = function () {
    var deferred = Q.defer();

    this._npm = require('npm');

    this._npm.load({
        //loglevel: 'silent'
    }, function (err) {
        if (err) {
            this._logger.error("load error:", err);
            deferred.reject(new Error(err));
            return;
        }

        this._npm.prefix = process.cwd();
        //this._logger.log('NPM prefix:', this._npm.prefix, ", root:", this._npm.root);

        deferred.resolve();
    }.bind(this));

    this._NPM_InitPromise = deferred.promise;
    this._NPM_InstallPromises = [];
};

/**
 * Run NPM Install on plugins
 * @param pluginConfig
 * @returns {Manager}
 * @private
 */
Manager.prototype._NPM_Install = function (pluginConfig) {
    if (!this._NPM_InitPromise) {
        this._NPM_Init();
    }

    this._NPM_InitPromise
        .then(function () {
            //this._logger.log("load - Init Done");
            var deferred = Q.defer();

            var packages = [];
            packages.push(pluginConfig.package);

            this._npm.commands.install(packages, function (err, data) {
                if (err) {
                    this._logger.error("install error:", err);
                    pluginConfig.error = err;
                    deferred.resolve({error: err});
                    return;
                }

                if( (pluginConfig.name.indexOf('https://') === 0) ||
                    (pluginConfig.name.indexOf('.git') === pluginConfig.name.length + 4)
                ) {
                    pluginConfig.name = getPackageName(data[0][0]);
                }

                pluginConfig.version = getPackageVersion(data[0][0]);
                pluginConfig.dir = data[0][1];
                //this._logger.log("load Done:", data);

                var err = this._requirePlugin(pluginConfig);
                if( !err ) {
                    deferred.resolve({plugin: pluginConfig});
                } else {
                    //this._logger.error('Error during require plugin:', err);
                    deferred.resolve({error: err});
                }
            }.bind(this));

            this._NPM_InstallPromises.push(deferred.promise);
        }.bind(this));

    return this;
};

// -------------------------------------------------------
