/*
 * Plugin Package Yanpm
 */
'use strict';

var path  = require('path');
var url   = require('url');
var spawn = require('child_process').spawn;
var Q     = require('q');

module.exports = Yanpm;

/*
 Usage:
 plugins
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

function getPackageNameFromUrl(packageUrl) {
    if (typeof packageUrl !== 'string') {
        return null;
    }

    var u = url.parse(packageUrl);
    if (u.protocol === null || u.host === null || u.pathname === null) {
        return null;
    }

    var pathname = u.pathname;

    // "/lodash/lodash.git" --> "lodash.git"
    pathname = pathname.split('/').slice(-1).join('/');

    // "lodash.git" --> "lodash"
    if (pathname.slice(-4) === '.git') {
        pathname = pathname.slice(0, -4);
    }

    return pathname;
}

function getPackageVersion(pack) {
    var atPos = pack.indexOf('@');
    if (atPos < 1) {
        return '';
    } else {
        return pack.substr(atPos+1);
    }
}

function requireRemoveCache(moduleDir) {
    //console.log('moduleName:', moduleName);
    var mods = requireFindModuleCache(moduleDir);

    // delete all cache
    mods.forEach(function(mod){

        // Remove cached paths to the module.
        Object.keys(mod.constructor._pathCache).forEach(function(cacheKey) {
            var parsedCacheKey = null;
            try {
                parsedCacheKey = JSON.parse(cacheKey);
            } catch(e) {
            }

            if (parsedCacheKey && parsedCacheKey.request === moduleDir) {
                delete mod.constructor._pathCache[cacheKey];
            }
        });

        delete require.cache[mod.id];
    });
}

function requireFindModuleCache(moduleDir) {
    var mods = [];
    //console.info('findModule:', moduleDir);

    // Resolve the module identified by the specified name
    var mod = require.resolve(moduleDir);

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


function Yanpm(options) {
    this._logger = console;
    this._errors = [];
    this._rootDir = process.cwd();

    if(options) {
        this._logger = options.logger || this._logger;
        this._rootDir = options.cwd   || this._rootDir;
    }

    this.reset();
}


/**
 * Install Plugins added
 * @param callback (optional)
 * @returns {Promise}
 */
Yanpm.prototype.install = function (config) {

    if(config) {
        this.add(config);
    }

    if (!this._pluginConfigs || !this._pluginConfigs.length) {
        this._logger.warn("No plugins added");
        return Q.resolve();
    }

    return this._installPlugins()
        .then(function () {
            for (var i = 0; i < this._pluginConfigs.length; i++) {
                this._requirePlugin(this._pluginConfigs[i]);
            }

            if(this._errors && this._errors.length) {
                return Q.reject(this._errors);
            }

            return this._plugins;
        }.bind(this));
};

/**
 * Add Plugin
 * @param group
 * @param name
 * @param npmPackage
 * @param args
 * @returns {Yanpm}
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
 .add('./file.json')
 .add('./file.js')
 */
Yanpm.prototype.add = function (group, name, npmPackage, args) {

    var list = group;
    var groupName = null;

    // check if file
    if (isString(group) && !isString(name) && !isString(npmPackage) && !args ) {
        try {
            var dir = path.join(this._rootDir, group);
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

Yanpm.prototype._add = function (pluginConfig) {
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

/**
 *
 * @returns {*}
 */
Yanpm.prototype.errors = function () {
    if(this._errors && this._errors.length) {
        return this._errors;
    }

    return null;
};

/**
 *
 */
Yanpm.prototype.reset = function () {
    // clear all required modules
    if(this._pluginConfigs && this._pluginConfigs.length) {
        for (var i = 0; i < this._pluginConfigs.length; i++) {
            // don't remove modules with errors, they where never loaded
            if( !this._pluginConfigs[i].error &&
                this._pluginConfigs[i].dir &&
                this._pluginConfigs[i].dir.length) {
                requireRemoveCache( this._pluginConfigs[i].dir );
            }
        }
    }

    this._pluginConfigs = [];
    this._plugins = {};
    this._errors = [];
};

/**
 * Sets group default
 * @param group
 * @param args
 */
Yanpm.prototype.setDefault = function (group, name) {
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
Yanpm.prototype.getDefault = function (group, args) {
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
Yanpm.prototype.getAll = function (group) {
    if (!isString(group)) {
        this._logger.error("Invalid 'group' type expecting string, received:", group);
        return this._plugins;
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
 * @returns {Yanpm}
 *
 * @example
 * .get('lodash')
 *
 * .get('util', '_')
 *
 * .get('moment', ['2013-01-01T00:00:00.000'])
 *
 */
Yanpm.prototype.get = function (group, name, args) {
    if(!group && !name) {
        return this._plugins;
    }

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
Yanpm.prototype._normalizeAdd = function (group, name, npmPackage, args) {
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
        pack.name    = null; //getPackageName(group);
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
    pack.dir = '';


    if (!pack.package) {
        this._logger.error("Missing 'package' from plugin:", pack);
        return null;
    }
    //if (!pack.name) {
    //    this._logger.error("Missing 'name' from plugin:", pack);
    //    return null;
    //}
    if (!isArray(pack.args)) {
        this._logger.error("Default Arguments expect to be array, received:", pack.args);
        return null;
    }

    pack.packageName = pack.package.split('@')[0];

    return pack;
};

/**
 * Run require on Plugin
 * @param pluginConfig
 * @returns {boolean}
 * @private
 */
// TODO: make promise
Yanpm.prototype._requirePlugin = function (pluginConfig) {
    var plugin = null;
    try {
        // this._logger.log('requirePlugin pluginConfig:', pluginConfig);
        // this._logger.log('requirePlugin dir:', pluginConfig.dir);

        plugin = require(pluginConfig.dir);

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
        this._errors.push({
            plugin: pluginConfig,
            error: err
        });
    }
};


// -------------------------------------------------------
// NPM function
///**
// * Initialize NPM
// * @private
// */
//Yanpm.prototype._NPM_Init = function () {
//    var deferred = Q.defer();
//
//    //this._npm = require('npm');
//
//    this._npm.load({
//        //loglevel: 'silent'
//    }, function (err) {
//        if (err) {
//            this._logger.error("load error:", err);
//            deferred.reject(new Error(err));
//            return;
//        }
//
//        this._npm.prefix = process.cwd();
//        //this._logger.log('NPM prefix:', this._npm.prefix, ", root:", this._npm.root);
//
//        deferred.resolve();
//    }.bind(this));
//
//    this._NPM_InitPromise = deferred.promise;
//    this._NPM_InstallPromises = [];
//};

/**
 * Run NPM Install on plugins
 * @param pluginConfig
 * @returns {Yanpm}
 * @private
 */
Yanpm.prototype._installPlugins = function () {
    var defered = Q.defer();
    var packages = ['install'];

    for(var i = 0; i < this._pluginConfigs.length; i++) {
        packages.push( this._pluginConfigs[i].package );
    }
    packages.push('--json');
    //this._logger.log("Install Plugins:", packages);


    // save current
    var oDir = process.cwd();
    // cd to root dir
    process.chdir(this._rootDir);
    //this._logger.log("Install Plugins dir:", this._rootDir, ', cwd:', process.cwd());

    var npm = spawn('npm', packages);
    var npmStdout = '', npmStderr = '';

    npm.stdout.on('data', function (data) {
        npmStdout +=  data;
    }.bind(this));

    npm.stderr.on('data', function (data) {
        npmStderr += data;
    }.bind(this));

    npm.on('exit', function (code) {
        // change back original dir
        process.chdir(oDir);

        if ( npmStderr && npmStderr.length &&
            (npmStderr.indexOf('ERR!') >= 0) ) {
            this._logger.error("install error:", npmStderr);
            defered.reject(npmStderr);
            return;
        }

        var installed = {};
        try {
            installed = JSON.parse(npmStdout);
        } catch(tErr) {
        }

        // this._logger.log('npm exit:', installed);
        if(!isArray(installed) && isObject(installed) ){
            if(installed.dependencies) {
                // convert object to array
                var temp = [];
                for(var key in installed.dependencies) {
                    // add name that is missing once pulled from object
                    installed.dependencies[key].name = key;
                    temp.push(installed.dependencies[key]);
                }
                installed = temp;
            }
            
            // newer npm uses updated/added data structure
            if(installed.updated || installed.added) {
                var temp = [];
                temp = temp.concat(installed.updated);
                temp = temp.concat(installed.added);
                installed = temp;
            }
        }

        // TODO: get config json
        // TODO: attach config to particular plugin
        for(var i = 0; i < this._pluginConfigs.length; i++) {
            for(var j = 0; j < installed.length; j++) {
                if( (this._pluginConfigs[i].package === installed[j].from) ||
                    (this._pluginConfigs[i].packageName === installed[j].name) ||
                    (getPackageNameFromUrl(this._pluginConfigs[i].package) === installed[j].name)
                ) {
                    this._pluginConfigs[i].packageName = installed[j].name;

                    if(!this._pluginConfigs[i].name) {
                        this._pluginConfigs[i].name = installed[j].name;
                    }

                    this._pluginConfigs[i].version = installed[j].version;

                    // default packageDir to node_modules/<package name>
                    //pack.dir = NODE_MODULES_DIR + path.sep + pack.name;
                    this._pluginConfigs[i].dir = path.normalize(path.join(this._rootDir, NODE_MODULES_DIR, this._pluginConfigs[i].packageName) );

                    break;
                }
            }
        }

        defered.resolve();
    }.bind(this));

    return defered.promise;
};


// -------------------------------------------------------