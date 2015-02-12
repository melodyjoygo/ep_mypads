/**
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
*/

(function () {
  'use strict';
  var ld = require('lodash');
  var specCommon = require('../common.js');
  var user = require('../../../model/user.js');
  var group = require('../../../model/group.js');

  var gparams;
  var guser;

  var initOneGroup = function (done) {
    specCommon.reInitDatabase(function () {
      user.set({ login: 'parker', password: 'lovesKubiak'}, function (err, u) {
        guser = u;
        gparams = {
          name: 'college',
          admin: guser._id,
          admins: [ 'mikey', 'jerry' ],
          users: [ 'grace', 'frank', 'shelly' ],
          pads: [ 'watchSync' ],
          visibility: 'private',
          password: 'aGoodOne',
          readonly: true
        };
        group.add(gparams, function (err, res) {
          if (!err) { gparams = res; }
          done();
        });
      });
    });
  };

  describe('group', function () {
    beforeAll(specCommon.reInitDatabase);
    afterAll(specCommon.reInitDatabase);

    describe('add', function () {
      var adm;
      beforeAll(function (done) {
        specCommon.reInitDatabase(function () {
          user.set({
            login: 'parker',
            password: 'lovesKubiak',
            firstname: 'Parker',
            lastname: 'Lewis'
          }, function (err, u ) {
            if (err) { console.log(err); }
            adm = u;
            done();
            }
          );
        });
      });
      afterAll(specCommon.reInitDatabase);

      it('should throws errors if params.name or params.admin, callback or ' +
        'edit aren`t correct', function () {
          expect(group.add).toThrow();
          expect(ld.partial(group.add, [])).toThrow();
          var params = { name: 123, noadmin: true };
          expect(ld.partial(group.add, params, ld.noop)).toThrow();
          params = { name: 'ok', admin: false };
          expect(ld.partial(group.add, params, ld.noop)).toThrow();
          params.name = [];
          expect(ld.partial(group.add, params, ld.noop)).toThrow();
          params.name = 'ok';
          params.admin = 'ok';
          expect(ld.partial(group.add, params, false)).toThrow();
        }
      );

      it('should return an error if admin user is not found', function (done) {
        group.add({ name: 'g', admin: 'inexistent' }, function (err, g) {
          expect(ld.isError(err)).toBeTruthy();
          expect(err).toMatch('admin user does not exist');
          expect(g).toBeUndefined();
          done();
        });
      });

      it('should assign defaults if other params are not properly typed nor' +
        'defined', function (done) {
          var params = { name: 'group', admin: adm._id };
          group.add(params, function (err, g) {
            expect(err).toBeNull();
            expect(g.name).toBe('group');
            expect(ld.isArray(g.admins)).toBeTruthy();
            expect(ld.isArray(g.users) && ld.isEmpty(g.users)).toBeTruthy();
            expect(ld.isArray(g.pads) && ld.isEmpty(g.pads)).toBeTruthy();
            expect(ld.first(g.admins)).toBe(adm._id);
            expect(g.visibility).toBe('restricted');
            expect(ld.isString(g.password) && ld.isEmpty(g.password))
              .toBeTruthy();
            expect(ld.readonly).toBeFalsy();

            params = {
              name: 'college',
              admin: adm._id,
              admins: [123],
              users: {},
              pads: false,
              visibility: 'inexistentOption',
              password: [],
              readonly: 'needABoolean'
            };
            group.add(params, function (err, g) {
              expect(err).toBeNull();
              expect(ld.isString(g._id)).toBeTruthy();
              expect(g._id).not.toBe('will not be given');
              expect(g.name).toBe('college');
              expect(ld.isArray(g.admins)).toBeTruthy();
              expect(ld.first(g.admins)).toBe(adm._id);
              expect(ld.size(g.admins)).toBe(1);
              expect(ld.isArray(g.users) && ld.isEmpty(g.users)).toBeTruthy();
              expect(ld.isArray(g.pads) && ld.isEmpty(g.pads)).toBeTruthy();
              expect(g.visibility).toBe('restricted');
              expect(ld.isEmpty(g.password)).toBeTruthy();
              expect(g.readonly).toBeFalsy();
              done();
            });
          });
        }
      );

      it('should otherwise accept well defined parameters', function (done) {
        var params = {
          name: 'college2',
          admin: adm._id,
          admins: [ 'mikey', 'jerry' ],
          users: [ 'grace', 'frank', 'shelly' ],
          pads: [ 'watchSync' ],
          visibility: 'private',
          password: 'aGoodOne',
          readonly: true
        };
        group.add(params, function (err, g) {
          expect(err).toBeNull();
          expect(ld.isString(g._id)).toBeTruthy();
          expect(g.name).toBe('college2');
          expect(ld.isArray(g.admins)).toBeTruthy();
          expect(ld.first(g.admins)).toBe(adm._id);
          expect(ld.includes(g.admins, 'mikey')).toBeTruthy();
          expect(ld.includes(g.admins, 'jerry')).toBeTruthy();
          expect(ld.isEmpty(ld.xor(g.users, params.users))).toBeTruthy();
          expect(ld.includes(g.pads, 'watchSync')).toBeTruthy();
          expect(g.visibility).toBe('private');
          expect(g.password).toBeDefined();
          expect(ld.isEmpty(g.password)).toBeFalsy();
          expect(g.readonly).toBeTruthy();
          done();
        });
      });
    });

    describe('set', function () {
      var adm;
      beforeAll(function (done) {
        specCommon.reInitDatabase(function () {
          user.set({
            login: 'parker',
            password: 'lovesKubiak',
            firstname: 'Parker',
            lastname: 'Lewis'
          }, function (err, u) {
            if (err) { console.log(err); }
            adm = u;
            done();
            }
          );
        });
      });
      afterAll(specCommon.reInitDatabase);

      it('should throws errors if params._id|name|admin, callback or edit ' +
        'aren`t correct', function () {
          expect(group.set).toThrow();
          expect(ld.partial(group.set, [])).toThrow();
          var params = { name: 123, noadmin: true };
          expect(ld.partial(group.set, params, ld.noop)).toThrow();
          params = { name: 'ok', admin: false };
          expect(ld.partial(group.set, params, ld.noop)).toThrow();
          params.name = 'ok';
          params.admin = 'ok';
          expect(ld.partial(group.set, params, false)).toThrow();
          params._id = 123;
          expect(ld.partial(group.set, params, ld.noop)).toThrow();
        }
      );

      it('should return an error if admin user is not found', function (done) {
        group.set({ _id: 'k', name: 'g', admin: 'inexist' }, function (err, g) {
          expect(ld.isError(err)).toBeTruthy();
          expect(err).toMatch('admin user does not exist');
          expect(g).toBeUndefined();
          done();
        });
      });

      it('should return an error if group _id is not found', function (done) {
        group.set({ _id: 'i', name: 'g', admin: adm._id }, function (err, g) {
          expect(ld.isError(err)).toBeTruthy();
          expect(err).toMatch('group does not exist');
          expect(g).toBeUndefined();
          done();
        });
      });

      it('should otherwise accept well defined parameters', function (done) {
        var params = {
          name: 'college2',
          admin: adm._id,
          admins: [ 'mikey', 'jerry' ],
          users: [ 'grace', 'frank', 'shelly' ],
          pads: [ 'watchSync' ],
          visibility: 'private',
          password: 'aGoodOne',
          readonly: true
        };
        group.add(params, function (err, g) {
          expect(err).toBeNull();
          expect(ld.isString(g._id)).toBeTruthy();
          expect(g.name).toBe('college2');
          expect(ld.isArray(g.admins)).toBeTruthy();
          expect(ld.first(g.admins)).toBe(adm._id);
          expect(ld.includes(g.admins, 'mikey')).toBeTruthy();
          expect(ld.includes(g.admins, 'jerry')).toBeTruthy();
          expect(ld.isEmpty(ld.xor(g.users, params.users))).toBeTruthy();
          expect(ld.includes(g.pads, 'watchSync')).toBeTruthy();
          expect(g.visibility).toBe('private');
          expect(g.password).toBeDefined();
          expect(ld.isEmpty(g.password)).toBeFalsy();
          expect(g.readonly).toBeTruthy();
          group.get(g._id, function (err, g) {
            expect(err).toBeNull();
            expect(ld.isString(g._id)).toBeTruthy();
            expect(g.name).toBe('college2');
            expect(ld.isArray(g.admins)).toBeTruthy();
            expect(ld.first(g.admins)).toBe(adm._id);
            expect(ld.includes(g.admins, 'mikey')).toBeTruthy();
            expect(ld.includes(g.admins, 'jerry')).toBeTruthy();
            expect(ld.isEmpty(ld.xor(g.users, params.users))).toBeTruthy();
            expect(ld.includes(g.pads, 'watchSync')).toBeTruthy();
            expect(g.visibility).toBe('private');
            expect(g.password).toBeDefined();
            expect(ld.isEmpty(g.password)).toBeFalsy();
            expect(g.readonly).toBeTruthy();
            done();
          });
        });
      });
    });

    describe('group get and del', function () {

      beforeAll(initOneGroup);
      afterAll(specCommon.reInitDatabase);

      it('should throw errors if arguments are not provided as expected',
        function () {
          expect(group.get).toThrow();
          expect(ld.partial(group.get, 123)).toThrow();
          expect(ld.partial(group.get, 'key')).toThrow();
          expect(ld.partial(group.get, 'key', 'notAFunc')).toThrow();
        }
      );

      it('should return an Error if the key is not found', function (done) {
        group.get('inexistent', function (err, g) {
          expect(ld.isError(err)).toBeTruthy();
          expect(g).toBeUndefined();
          done();
        });
      });

      it('should return the group otherwise', function (done) {
        group.get(gparams._id, function (err, g) {
          expect(err).toBeNull();
          expect(ld.isString(g._id)).toBeTruthy();
          expect(g.name).toBe('college');
          expect(ld.isArray(g.admins)).toBeTruthy();
          expect(ld.first(g.admins)).toBe(guser._id);
          expect(ld.includes(g.admins, 'mikey')).toBeTruthy();
          expect(ld.includes(g.admins, 'jerry')).toBeTruthy();
          expect(ld.isEmpty(ld.xor(g.users, gparams.users))).toBeTruthy();
          expect(ld.includes(g.pads, 'watchSync')).toBeTruthy();
          expect(g.visibility).toBe('private');
          expect(g.password).toBeDefined();
          expect(ld.isEmpty(g.password)).toBeFalsy();
          expect(g.readonly).toBeTruthy();
          done();
        });
      });

    });

  });

}).call(this);