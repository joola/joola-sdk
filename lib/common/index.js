/*jshint -W083 */

/**
 *  @title joola.io
 *  @overview the open-source data analytics framework
 *  @copyright Joola Smart Solutions, Ltd. <info@joo.la>
 *  @license GPL-3.0+ <http://spdx.org/licenses/GPL-3.0+>
 *
 *  Licensed under GNU General Public License 3.0 or later.
 *  Some rights reserved. See LICENSE, AUTHORS.
 **/


var
  util = require('util'),
  ce = require('cloneextend');//,
//JSONStream = require('JSONStream');

var common = util;
common._id = 'common';

module.exports = exports = common;
common.extend = common._extend;

require('./modifiers');

common.mixin = function (origin, add, overwrite) {
  // Don't do anything if add isn't an object
  if (!add || typeof add !== 'object') return origin;

  var keys = Object.keys(add);
  var i = 0;//keys.length;
  while (i < keys.length) {
    if (origin.hasOwnProperty(keys[i])) {
      if (overwrite)
        origin[keys[i]] = add[keys[i]];
      //else
      //common.extend(origin[keys[i]], add[keys[i]]);

    }
    else
      origin[keys[i]] = add[keys[i]];
    i++;
  }
  return origin;
};

//hook functions for timings
common.hookEvents = function (obj) {
  if (!obj)
    return;
  var name, fn, obj_id;

  if (obj._id)
    obj_id = obj._id;

  for (name in obj) {
    fn = obj[name];
    if (name.substring(0, 1) == '_')
      continue;

    if (typeof fn === 'function' && name !== 'hookEvents') {
      obj[name] = function (name, fn) {
        var args = arguments;
        return function () {
          var self = this;
          var timeID = 'Function ' + (obj_id ? obj_id + '.' : '') + name;

          if (joolaio.options.debug.functions.enabled && console.time)
            console.time(timeID);
          var result = fn.apply(self, arguments);
          if (joolaio.options.debug.functions.enabled && console.time) {
            console.timeEnd(timeID);
          }
          return result;
        };
      }(name, fn);
    }
    else if (typeof fn === 'object')
      this.hookEvents(fn);
  }
};

common.uuid = function () {
  var uuid = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 9; i++)
    uuid += possible.charAt(Math.floor(Math.random() * possible.length));

  return uuid;
};

common.stringify = function (obj, callback) {
  return callback(null, JSON.stringify(obj));
};

common.parse = function (string, callback) {
  return callback(null, JSON.parse(string));
};

common.hash = function (string) {
  return require('crypto').createHash('md5').update(string).digest("hex");
};

common.toType = (function toType(global) {
  return function (obj) {
    if (obj === global) {
      return "global";
    }
    return ({}).toString.call(obj).match(/\s([a-z|A-Z]+)/)[1].toLowerCase();
  };
})(this);

common.sanitize = function (obj) {
  if (obj instanceof Object) {
    for (var k in obj) {
      if (obj.hasOwnProperty(k)) {
        //recursive call to scan property
        if (k.substring(0, 1) === '_' && k !== '_')
          delete obj[k];
        else
          common.sanitize(obj[k]);
      }
    }
  }
};

common.typeof = function (obj) {
  if (typeof(obj) == "object") {
    if (obj === null) return "null";
    if (obj.constructor == ([]).constructor) return "array";
    if (obj.constructor == (new Date()).constructor) return "date";
    if (obj.constructor == (new RegExp()).constructor) return "regex";
    return "object";
  }
  return typeof(obj);
};