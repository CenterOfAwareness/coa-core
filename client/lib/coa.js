require('json-client.js', 'JSONClient');
require(system.mods_dir + '/coa/common/settings.js', 'coa_settings');

const SUBSCRIBABLES = ['WRITE', 'PUSH', 'POP', 'SHIFT', 'UNSHIFT', 'DELETE'];

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

  host = host || coa_settings.client.server_address;
  port = port || coa_settings.client.server_port;
  username = username || coa_settings.client.system_name;
  password = password || coa_settings.client.system_password;

  JSONClient.call(this, host, port);

  const callbacks = {};
  Object.defineProperty(this, 'callbacks', { value : callbacks });
  Object.defineProperty(this, 'system_name', { value : username });

  this.ident('admin', username, password);

}
COA.prototype = Object.create(JSONClient.prototype);
COA.prototype.constructor = COA;

COA.prototype.callback = function (u) {
  if (SUBSCRIBABLES.indexOf(u.oper) < 0 || !this.callbacks[u.scope]) return;
  this.callbacks[u.scope](u);
}

COA.prototype.set_callback = function (db, callback) {
  if (this.callbacks[db]) throw new Error('Callback already set for ' + db);
  this.callbacks[db] = callback;
}

COA.prototype.unset_callback = function (db) {
  if (!this.callbacks[db]) throw new Error('No callback set for ' + db);
  delete this.callbacks[db];
}
