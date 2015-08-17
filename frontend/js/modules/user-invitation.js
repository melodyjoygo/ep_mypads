/**
*  # User invitation and admin sharing module
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
*  This module handles group user invitation and group user admin sharing.
*/

module.exports = (function () {
  'use strict';
  // Global dependencies
  var m = require('mithril');
  var ld = require('lodash');
  // Local dependencies
  var conf = require('../configuration.js');
  var auth = require('../auth.js');
  var model = require('../model/group.js');
  var layout = require('./layout.js');
  var notif = require('../widgets/notification.js');
  var tag = require('../widgets/tag.js');
  var form = require('../helpers/form.js');

  var invite = {};

  /**
  * `submit` function calls the public API to update the group with new users
  * or admins. It displays errors if needed or success.
  *
  * It takes the instantiated `c` controller and an optional `successFn`
  * function called with `resp`onse and filters user invitation by known users
  * only.
  */

  invite.invite = function (c, successFn) {
    var data = {
      invite: c.isInvite,
      gid: c.group._id,
      logins: c.tag.current
    };
    m.request({
      method: 'POST',
      url: conf.URLS.GROUP + '/invite',
      data: data
    }).then(function (resp) {
      model.fetch(function () {
        var lpfx = c.isInvite ? 'INVITE_USER' : 'ADMIN_SHARE';
        notif.success({ body: conf.LANG.GROUP[lpfx].SUCCESS });
        if (successFn) { successFn(resp); }
      });
    }, function (err) {
      notif.error({ body: ld.result(conf.LANG, err.error) });
    });
  };

  /**
  * ## Controller
  *
  * Used to check authentication, init data for tag like widget with users and
  * admins and gather data if not already fetched.
  */

  invite.controller = function () {

    if (!auth.isAuthenticated()) { return m.route('/login'); }

    var c = {};
    c.isInvite = (m.route.param('action') === 'invite');

    var init = function () {
      var group = m.route.param('group');
      c.group = model.groups()[group];
      var users = ld.merge(model.admins(), model.users());
      users = ld.reduce(users, function (memo, val) {
        memo.byId[val._id] = val;
        memo.byLogin[val.login] = val;
        return memo;
      }, { byId: {}, byLogin: {} });
      c.users = users.byLogin;
      var current = ld(users.byId)
        .pick(c.isInvite ? c.group.users : c.group.admins)
        .values()
        .pluck('login')
        .value();
      c.tag = new tag.controller({
        name: 'user-invite',
        label: conf.LANG.GROUP.INVITE_USER.USERS_SELECTION,
        current: current,
        placeholder: conf.LANG.GROUP.INVITE_USER.PLACEHOLDER,
        tags: ld.pull(ld.keys(c.users), auth.userInfo().login)
      });
    };
    if (ld.isEmpty(model.groups())) { model.fetch(init); } else { init(); }

    /**
    * ### userlistAdd
    *
    * `userlistAdd` function adds all members of the userlist to current
    * invited users.
    */

    c.userlistAdd = function (ulid) {
      var ul = auth.userInfo().userlists[ulid];
      c.tag.current = ld.union(c.tag.current, ld.pluck(ul.users, 'login'));
    };

    /**
    * ### submit
    *
    * `submit` function calls the public API to update the group with new users
    * or admins. It displays errors if needed or success.
    *
    * It filters user invitation by known users only.
    */

    c.submit = function (e) {
      e.preventDefault();
      var successFn = function (resp) {
        m.route('/mypads/group/' + resp.value._id + '/view');
      };
      invite.invite(c, successFn);
    };

    return c;
  };

  /**
  * ## Views
  */

  var view = {};

  view.userlistField = function (c) {
    return m('div.block-group', [
      m('label.block', { for: 'userlists' }, conf.LANG.MENU.USERLIST),
      ('i', {
        class: 'block tooltip icon-info-circled',
        'data-msg': conf.LANG.USERLIST.INFO.USER_INVITE
      }),
      m('select', {
        class: 'block',
        name: 'userlists',
        onchange: m.withAttr('value', c.userlistAdd)
      }, (ld.map(ld.pairs(auth.userInfo().userlists), function (ul) {
        return m('option', { value: ul[0] }, ul[1].name);
      })).concat(m('option', {
        selected: true,
        disabled: true,
        hidden: true,
        value: ''
      })))
    ]);
  };

  view.userField = function (c) {
    var tagInput = tag.views.input(c);
    tagInput.attrs.config = form.focusOnInit;
    return m('div.block-group.tag', [
      m('label.block', { for: c.name }, c.label),
      tagInput,
      m('i', {
        class: 'block tooltip icon-info-circled tag',
        'data-msg': conf.LANG.GROUP.INVITE_USER.INPUT_HELP }),
      m('button.block.ok', {
        type: 'button',
        onclick: function () {
          c.add(document.getElementById(c.name + '-input'));
        },
      }, conf.LANG.USER.OK),
      tag.views.datalist(c)
    ]);
  };

  view.form = function (c) {
    var GROUP = conf.LANG.GROUP;
    return m('form.block', {
      id: 'group-form',
      onsubmit: c.submit
    }, [
      m('fieldset.block-group', [
        m('legend', (GROUP.INVITE_USERLIST)),
        m('div', view.userlistField(c))
      ]),
      m('fieldset.block-group', [
        m('legend', (c.isInvite ? GROUP.INVITE_USER.IU : GROUP.ADMIN_SHARE.AS)),
        m('div', view.userField(c.tag))
      ]),
      m('fieldset.block-group', [
        m('legend', conf.LANG.GROUP.INVITE_USER.USERS_SELECTED),
        m('div', tag.views.tagslist(c.tag))
      ]),
      m('input.block.send', {
        form: 'group-form',
        type: 'submit',
        value: conf.LANG.ACTIONS.SAVE
      })
    ]);
  };

  view.main = function (c) {
    return m('section', { class: 'block-group user group-form' }, [
      m('h2.block', conf.LANG.GROUP.GROUP + ' ' + c.group.name),
      view.form(c)
    ]);
  };

  view.aside = function (c) {
    var GROUP = conf.LANG.GROUP;
    return m('section.user-aside', [
      m('h2', conf.LANG.ACTIONS.HELP),
      m('article', [
        m('h3', (c.isInvite ? GROUP.INVITE_USER.IU : GROUP.ADMIN_SHARE.AS)),
        m('section', m.trust(conf.LANG.GROUP.INVITE_USER.HELP))
      ])
    ]);
  };

  invite.view = function (c) {
    return layout.view(view.main(c), view.aside(c)); 
  };

  return invite;
}).call(this);
