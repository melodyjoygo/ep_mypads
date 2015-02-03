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
  var assert = require('assert');
  var ld = require('lodash');
  var request = require('request');
  var api = require('../../../api.js');

  /**
  * For standalone backend testing : mocking a fresh Express app and
  * initializate API routes.
  */
  var express = require('express');
  var app = express();
  app.use(express.bodyParser());
  api.init(app);
  app.listen(8042);

  // End of mocking
  app.close();

}).call(this);
