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

Presence.prototype._handle_update = function (update, callback) {
  cosnt self = this;
  const loc = update.location.split('.');
  // coa_presence - This will probably never come in as an update
  if (loc.length == 1) {
    Object.keys(update.data).forEach(function (e) {
      self.state[e] = update.data[e];
    });
    callback({ type : 'full_update', data : update.data });
  // coa_presence[system] - Probably a new system being added to the DB
  } else if (loc.length == 2) {
    this.state[loc[1]] = update.data;
    const cb_data = {};
    cb_data[loc[1]] = update.data
    callback({ type : 'system_update', data : cb_data });
  // coa presece[system][node] - Should contain all node attributes
  } else if (loc.length == 3) {
    // If we have no data about this system
    if (!this.state[loc[1]) {
      this.state[loc[1]] = {};
      this.state[loc[1]][loc[2]] = update.data;
      const cb_data = {};
      cb_data[loc[1]] = {};
      cb_data[loc[1]][loc[2]] = update.data;
      callback({ type : 'system_update', data : cb_data });
    // If we have no data about this node
    } else if (!this.state[loc[1]][loc[2]]) {
      this.state[loc[1]][loc[2]] = update.data;
      const cb_data = {};
      cb_data[loc[1]] = {};
      cb_data[loc[1]][loc[2]] = update.data;
      callback({ type : 'node_update', data : cb_data });
    } else {
      const cb_data = [{ type : 'node_update', data : {} }];
      cb_data[0].data[loc[1]] = {};
      cb_data[0].data[loc[1]][loc[2]] = update.data;
      if (data.s == 3 && self.state[loc[1]][loc[2]].s != 3) {
        cb_data.push({ type : 'node_logon', data : {
          system : loc[1],
          node : loc[2],
          user : data.u
        }});
      }
      this.state[loc[1]][loc[2]] = update.data;
      cb_data.forEach(callback);
    }
  // coa_presence[system][node][s,a,u,c] - Single attribute being updated
  } else if (
    loc.length == 4 && self.state[loc[1]][loc[2]][loc[3]] != update.data
  ) {
    const cb_data = [{ type : 'node_update', data : {} }];
    cb_data[0].data[loc[1]] = {};
    cb_data[0].data[loc[1]][loc[2]] = {};
    cb_data[0].data[loc[1]][loc[2]][loc[3]] = update.data;
    if (loc[3] == 's' && update.data == 3) {
      cb_data.push({ type : 'node_logon', data : {
        system : loc[1],
        node : loc[2],
        user : this.state[loc[1]][loc[2]].u
      }});
    }
    this.state[loc[1]][loc[2]][loc[3]] = update.data;
    cb_data.forEach(callback);
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
  return this.coa.client.read('coa_presence', path, 1);
}

/**
 * Write presence data for a given node, or the entire system
 * @param {number} [node=undefined] - The node to send an update about (optional)
 * @returns {undefined}
 */
Presence.prototype.write = function (node) {
  const self = this;
  var obj;
  var path = 'coa_presence.' + this.coa.system_name;
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
 * Subscribe to updates from all systems
 * @param {function} callback - Receives an object containing everything that
 * changed in this update.<br>
 * @returns {number} Subscription ID, for use with presence.unsubscribe
 */
Presence.prototype.subscribe = function (callback) {
  const self = this;
  const state = this.read();
  if (!state) throw new Error('Presence: failed to initialize data');
  Object.keys(state).forEach(function (e) { self.state[e] = state[e]; });
  return this.coa.subscribe('coa_presence', function (update) {
    self._handle_update(update, callback);
  });
}

/**
 * Unsubscribe from updates<br>
 * If no [id] given, unsubscribes from all updates<br>
 * @param {number} [id=undefined] - ID of the subscription to remove (from presence.subscribe)
 * @returns {undefined}
 */
Presence.prototype.unsubscribe = function (id) {
  return this.coa.unsubscribe('coa_presence', id);
}
