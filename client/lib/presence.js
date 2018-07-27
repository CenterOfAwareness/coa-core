load('sbbsdefs.js');
load('nodedefs.js');
require('../../common/validate.js', 'coa_validate');

function get_path(system, node) {
  var path = 'presence';
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
  if (ret[s] == NODE_INUSE || ret[s] == NODE_QUIET) {
    var usr = new User(system.node_list[node].useron);
    ret[u] = usr.alias;
    usr = undefined;
  }
}

Presence.prototype._handle_update = function (data, system, node) {
  if (system) { // This update pertains to just one system
    if (typeof this.state[system] != 'object') this.state[system] = {};
    if (typeof node == 'number') { // This update pertains to a particular node
      this.state[system][node] = data;
    } else { // This update contains all presence data for [system]
      this.state[system] = data;
    }
  } else { // This update contains all presence data
    this.state = data;
  }
}

/**
 * Read presence data for all systems, one system, or one node on one system
 * @param {string} [system=undefined] A particular system (optional)
 * @param {number} [node=undefined] A node of [system] (optional)
 * @returns {(object|null)} The requested presence data, or null if unavailable
 */
Presence.prototype.read = function (system, node) {
  const path = get_path(system, node);
  const data = this.coa.client.read('presence', path, 1);
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
  var path = 'presence.' + this.coa.system_name;
  if (typeof node == 'number') { // We're sending an update about one node
    path += '.' + node;
    const obj = this._get_local_presence(node);
    this.state[this.coa.system_name][node] = obj;
    this.coa.write('presence', path, this._get_local_presence(node), 2);
  } else { // We're pushing data for all nodes
    const obj = {};
    system.node_list.forEach(function (e, i) {
      const _obj = self._get_local_presence(i);
      self.state[self.coa.system_name][i] = _obj;
      obj[i] = _obj;
    });
    this.coa.write('presence', path, obj, 2);
  }
}

/**
 * Subscribe to updates from all systems, one system, or one node of one system<br>
 * If no [system] is given, subscribes all updates (top-level subscription)<br>
 * If given [system] but no [node], subscribes to all updates from [system] (system-level subscription)<br>
 * If given [system] and [node], subscribes to all updates for [node] on [system] (node-level subscription)
 * @param {function} callback - A function to handle these updates
 * @param {string} [system=undefined] - A particular system (optional)
 * @param {number} [node=undefined] - A node of [system] (optional)
 * @returns {number} Subscription ID, for use with presence.unsubscribe
 */
Presence.prototype.subscribe = function (callback, system, node) {
  const path = get_path(system, node);
  return this.coa.subscribe('presence', path, callback);
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
  return this.coa.unsubscribe('presence', path, id);
}
