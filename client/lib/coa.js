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

  JSONClient.call(this, host, port);

  const callbacks = {};
  Object.defineProperty(this, 'callbacks', { value : callbacks });
  Object.defineProperty(this, 'system_name', { value : username });

  this.ident('admin', username, password);

}
COA.prototype = Object.create(JSONClient.prototype);
COA.prototype.constructor = COA;

COA.prototype.callback = function (u) {
  if (
    // We only care about these types of operations
    ['WRITE','PUSH','POP','SHIFT','UNSHIFT','DELETE'].indexOf(u.oper) > -1
    && typeof this.callbacks[u.scope] == 'function'
  ) {
    this.callbacks[u.scope](u);
  }
}

COA.prototype.set_callback = function (db, callback) {
  if (typeof this.callbacks[db] == 'function') {
    throw new Error('Callback already registered for ' + db);
  }
  this.callbacks[db] = callback;
}

COA.prototype.unset_callback = function (db) {
  if (!this.callbacks[db]) {
    throw new Error('No callback set for ' + db);
  }
  delete this.callbacks[db];
}
