load('sbbsdefs.js');
load('nodedefs.js');
require('../mods/coa/common/validate.js', 'coa_validate');

function get_path(system, node) {
  var path = 'coa_presence';
  if (coa_validate.alias(system)) {
    path += '.' + system;
    if (coa_validate.node_number(node)) {
      path += '.' + node;
    } else if (typeof node != 'undefined') {
      throw new Error('Presence: invalid [node] parameter ' + node + '.');
    }
  } else if (typeof system != 'undefined') {
    throw new Error('Presence: invalid [system] parameter ' + system + '.');
  }
  return path;
}

/**
 * An interface to the COA Presence database
 * @constructor
 * @param {COA} coa - An instance of the COA object (client/lib/coa.js)
 */
function Presence(coa) {

  const state = {};
  const node_status = system.node_list.map(function (e) { return ''; });

  Object.defineProperty(this, 'coa', { value : coa });
  Object.defineProperty(this, 'state', { value : state, enumerable : true });
  Object.defineProperty(this, 'node_status', {
    value : node_status, enumerable : true
  });

}

Presence.prototype._get_local_presence = function (node) {
  const ret = {
    s : system.node_list[node].status,
    a : system.node_list[node].action,
    u : '',
    c : this.node_status[node]
  };
  if (ret.s == NODE_INUSE || ret.s == NODE_QUIET) {
    var usr = new User(system.node_list[node].useron);
    ret.u = usr.alias;
    usr = undefined;
  }
  return ret;
}

Presence.prototype._handle_update = function (data, system, node) {
  const self = this;
  var diff = {}; // Will contain any changes from the previous state
  if (system) { // This update pertains to just one system
    if (typeof node == 'number') { // This update pertains to a particular node
      if (typeof this.state[system] != 'object') { // We have no data about this system
        this.state[system] = {};
        diff = data;
      } else if (typeof this.state[system][node] != 'object') { // We have no data about this node
        diff = data;
      } else { // We have data about this node but some of it may have changed
        Object.keys(data).forEach(function (e) {
          if (data[e] != self.state[system][node][e]) diff[e] = data[e];
        });
      }
      this.state[system][node] = data;
    } else { // This update contains all presence data for [system]
      if (typeof this.state[system] != 'object') { // We have no data about this system
        diff = data;
      } else {
        Object.keys(data).forEach(function (e) { // Each node
          if (typeof self.state[system][e] != 'object') { // We have no data about this node
            diff[e] = data[e];
          } else { // We have data about this node but some of it may have changed
            Object.keys(data[e]).forEach(function (ee) { // Each property of this node
              if (self.state[system][e][ee] != data[e][ee]) {
                if (typeof diff[e][ee] == 'undefined') diff[e][ee] = {};
                diff[e][ee] = data[e][ee];
              }
            });
          }
        });
      }
      this.state[system] = data;
    }
  } else { // This update contains all presence data
    Object.keys(data).forEach(function (e) { // Each system
      if (typeof self.state[e] == 'undefined') { // We currently have no data about this system
        diff[e] = data[e];
      } else {
        Object.keys(data[e]).forEach(function (ee) { // Each node
          if (typeof self.state[e][ee] == 'undefined') { // We currently have no data about this node
            if (typeof diff[e] == 'undefined') diff[e] = {};
            diff[e][ee] = data[e][ee];
          } else {
            Object.keys(data[e][ee]).forEach(function (eee) { // Each property of this node
              if (self.state[e][ee][eee] != data[e][ee][eee]) {
                if (typeof diff[e][ee] == 'undefined') diff[e][ee] = {};
                diff[e][ee][eee] = data[e][ee][eee];
              }
            });
          }
        });
      }
    });
    this.state = data;
  }
  return diff;
}

/**
 * Read presence data for all systems, one system, or one node on one system
 * @param {string} [system=undefined] A particular system (optional)
 * @param {number} [node=undefined] A node of [system] (optional)
 * @returns {(object|null)} The requested presence data, or null if unavailable
 */
Presence.prototype.read = function (system, node) {
  const path = get_path(system, node);
  const data = this.coa.client.read('coa_presence', path, 1);
  if (!data) return null;
  this._handle_update(data, system, node);
  return this.state;
}

/**
 * Write presence data for a given node, or the entire system
 * @param {number} [node=undefined] - The node to send an update about (optional)
 * @returns {undefined}
 */
Presence.prototype.write = function (node) {
  const self = this;
  var obj;
  var path = 'presence.' + this.coa.system_name;
  if (typeof this.state[this.coa.system_name] != 'object') {
    this.state[this.coa.system_name] = {};
  }
  if (typeof node == 'number') { // We're sending an update about one node
    path += '.' + node;
    obj = this._get_local_presence(node);
    this.state[this.coa.system_name][node] = obj;
    this.coa.write('coa_presence', path, this._get_local_presence(node), 2);
  } else { // We're pushing data for all nodes
    obj = {};
    system.node_list.forEach(function (e, i) {
      const _obj = self._get_local_presence(i);
      self.state[self.coa.system_name][i] = _obj;
      obj[i] = _obj;
    });
    this.coa.client.write('coa_presence', path, obj, 2);
  }
}

/**
 * Subscribe to updates from all systems, one system, or a node of a system<br>
 * If no [system] is given, subscribes all updates (top-level subscription)<br>
 * If given [system] but no [node], subscribes to all updates from [system]
 * (system-level subscription)<br>
 * If given [system] and [node], subscribes to all updates for [node] on
 * [system] (node-level subscription)
 * @param {function} callback - Receives an object containing everything that
 * changed in this update.<br>
 * If we previously had no presence data for this scope, the object will contain
 * all presence data for this scope.
 * @param {string} [system=undefined] - A particular system (optional)
 * @param {number} [node=undefined] - A node of [system] (optional)
 * @returns {number} Subscription ID, for use with presence.unsubscribe
 */
Presence.prototype.subscribe = function (callback, system, node) {
  const self = this;
  const path = get_path(system, node);
  return this.coa.subscribe('coa_presence', path, function (update) {
    const diff = self._handle_update(update.data, system, node);
    callback(diff);
  });
}

/**
 * Unsubscribe from updates<br>
 * If no [id] given, unsubscribes from all updates<br>
 * Subscription IDs are not globally unique. They are scoped to the top, system, or node-level<br>
 * If given [id] but no [system], [id] must refer to a top-level subscription<br>
 * If given [id] and [system], but no [node], [id] must refer to a system-level subscription<br>
 * If given [id], [system], and [node], [id] must refer to a node-level subscription
 * @param {number} [id=undefined] - ID of the subscription to remove (from presence.subscribe)
 * @param {string} [system=undefined] - system this subscribtion is associated with
 * @param {number} [node=undefined] - node of [system] this subscription is associated with
 * @returns {undefined}
 * @example
 * const id = presence.subscribe(some_callback, 'ecbbs', 0);
 * presence.unsubscribe(id, 'ecbbs', 0);
 */
Presence.prototype.unsubscribe = function (id, system, node) {
  const path = get_path(system, node);
  return this.coa.unsubscribe('coa_presence', path, id);
}
