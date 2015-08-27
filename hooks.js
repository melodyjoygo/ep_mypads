/**
*  # Hooks Module
*
*  ## License
*
*  Licensed to the Apache Software Foundation (ASF) under one
*  or more contributor license agreements.  See the NOTICE file
*  distributed with this work for additional information
*  regarding copyright ownership.  The ASF licenses this file
*  to you under the Apache License, Version 2.0 (the
*  "License"); you may not use this file except in compliance
*  with the License.  You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing,
*  software distributed under the License is distributed on an
*  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
*  KIND, either express or implied.  See the License for the
*  specific language governing permissions and limitations
*  under the License.
*
*  ## Description
*
*  This module contains server-side hooks used by etherpad.
*
*  ## Hooks
*/

module.exports = (function () {
  'use strict';

  // Dependencies
  var configuration = require('./configuration.js');
  var padAndAuthor = require('./perm.js').padAndAuthor;

  var hooks = {};

  /**
  * `init` hook is runned once after plugin installation. At the moment, it
  * only populates database.
  */

  hooks.init = function (name, args, callback) {
    configuration.init(function (err) {
      if (err) { console.log(err); }
      callback();
    });
  };

  /**
  * `expressConfigure` hook profits from the args.app express instance to
  * initialize API before YAJSML and then storage and mail.
  */

  hooks.expressConfigure = function (name, args, callback) {
    var storage = require('./storage.js');
    var api = require('./api.js');
    var mail = require('./mail.js');
    api.init(args.app, function () {
      storage.init(function (err) {
        if (err) { return callback(err); }
        mail.init();
        callback(null);
      });
    });
  };

  /**
  * `clientVars` hook will use user login per default for pad `authorName` and
  * profile selected `userColor`. Authenticated user can overwrite default
  * values.
  */

  hooks.clientVars = function (name, context, callback) {
    var opts = padAndAuthor[context.pad.id];
    return callback(opts);
  };

  /**
  * WIP function to use at uninstall of MyPads : erase all MyPads data
  */

  hooks.removeAllData = function () {
    var storage = require('./storage.js');
    storage.db.findKeys(storage.DBPREFIX.GLOBAL + '*', null,
      function (err, keys) {
        console.log('Keys to be removed : ' + keys.join(', '));
        if (err) { throw err; }
        storage.fn.delKeys(keys, function (err) {
          if (err) { throw err; }
          console.log('data successfully removed');
        });
      }
    );
  };

  return hooks;

}).call(this);
