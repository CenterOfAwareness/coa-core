require('json-client.js', 'JSONClient');
require(system.mods_dir + '/coa/common/settings.js', 'coa_settings');

/**
 * An interface to the COA JSON-DB server
 * @constructor COA
 * @param {string} [host=undefined] - The COA JSON-DB server address
 * @param {number} [port=undefined] - The COA JSON-DB server port
 * @param {string} [username=undefined] - Your system's COA username
 * @param {string} [password=undefined] - Your system's COA password
 * All parameters are optional; defaults are loaded from ctrl/coa.ini
 */
function COA(host, port, username, password) {

  host = host || coa_settings.server_address;
  port = port || coa_settings.server_port;
  username = username || coa_settings.system_name;
  password = password || coa_settings.system_password;

  const callbacks = {};

  const json_client = new JSONClient(host, port);

  json_client.callback = function (u) {
    if (
      // We only care about these types of operations
      ['WRITE','PUSH','POP','SHIFT','UNSHIFT','DELETE'].indexOf(u.oper) > -1
      && typeof callbacks[u.scope] == 'function'
    ) {
      callback[u.scope](u);
    }
  }

  json_client.ident('admin', username, password);

  /** @property {JSONClient}
   * @name COA#client
   */
  Object.defineProperty(this, 'client', { value : json_client });
  Object.defineProperty(this, 'callbacks', { value : callbacks });
  Object.defineProperty(this, 'system_name', { value : username });

  this.cycle = function () {
    json_client.cycle();
  }

}

/**
 * Subscribe to updates
 * @param {string} db - The JSON-DB module to subscribe to (eg. 'presence')
 * @param {function} callback - A function that accepts a JSON-DB update object as its sole parameter
 * @returns {undefined}
 */
COA.prototype.subscribe = function (db, callback) {
  if (typeof this.callbacks[db] == 'function') {
    throw new Error('Already subscribed to ' + db);
  }
  this.callbacks[db] = callback;
  this.client.subscribe(db, db);
}

/**
 * Unsubscribe from updates
 * @param {string} [db=undefined] - The JSON-DB module to unsubscribe from (eg. 'presence') (undefined means all)
 * @returns {undefined}
 */
COA.prototype.unsubscribe = function (db) {
  const self = this;
  // If no database was specified, unsubscribe from all
  if (!db) {
    Object.keys(this.callbacks).forEach(function (e) {
      self.client.unsubscribe(e, e);
      delete this.callbacks[e];
    });
  // If a database was specified and we have a callback for it, unsubscribe
  } else if (this.callbacks[db]) {
    this.client.unsubscribe(db, db);
    delete this.callbacks[db];
  }
}
