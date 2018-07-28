require('json-client.js', 'JSONClient');

/**
 * An interface to the COA JSON-DB server
 * @constructor COA
 * @param {string} host - The COA JSON-DB server address
 * @param {number} port - The COA JSON-DB server port
 * @param {string} username - Your system's COA username
 * @param {string} password - Your system's COA password
 */
function COA(host, port, username, password) {

  const callbacks = {};

  const json_client = new JSONClient(host, port);

  json_client.callback = function (u) {
    if (typeof callbacks[u.scope] != 'object') return;
    if (typeof callbacks[u.scope][u.location] != 'object') return;
    callbacks[u.scope][u.location].forEach(function (e) { e(u); });
  }

  json_client.ident('admin', username, password);

  /** @property {JSONClient}
   * @name COA#client
   */
  Object.defineProperty(this, 'client', { value : json_client });
  Object.defineProperty(this, 'callbacks', { value : callbacks });
  Object.defineProperty(this, 'system_name', { value : username });

}

/**
 * Subscribe to updates
 * @param {string} db - The JSON-DB module to subscribe to (eg. 'presence')
 * @param {string} path - The path to subscribe to (eg. 'presence.ecbbs.0')
 * @param {function} callback - A function that accepts a JSON-DB update object as its sole parameter
 * @returns {number} The callback ID, for use with coa.unsubscribe
 */
COA.prototype.subscribe = function (db, path, callback) {
  if (typeof this.callbacks[db] == 'undefined') this.callbacks[db] = {};
  if (typeof this.callbacks[db][path] == 'undefined') {
    this.callbacks[db][path] = [];
    this.client.subscribe(db, path);
  }
  this.callbacks[db][path].push(callback);
  return (this.callbacks[db][path].length - 1);
}

/**
 * Unsubscribe from updates
 * @param {string} [db=undefined] - The JSON-DB module to unsubscribe from (eg. 'presence') (undefined means all)
 * @param {string} [path=undefined] - The path to unsubscribe from (eg. 'presence.ecbbs.0') (undefined means all)
 * @param {number} [id=undefined] - The callback to remove (undefined means all)
 * @returns {undefined}
 */
COA.prototype.unsubscribe = function (db, path, id) {

  const self = this;

  function unsubscribe_all(db, path) {
    if (self.callbacks[db] && self.callbacks[db][path]) {
      self.client.unsubscribe(db, path);
      delete self.callbacks[db][path];
    }
  }

  if (!db) {
    Object.keys(this.callbacks).forEach(function (e) {
      Object.keys(this.callbacks[e]).forEach(function (ee) {
        unsubscribe_all(e, ee);
      });
    });
    this.callbacks = {};
  } else if (!path && this.callbacks[db]) {
    Object.keys(this.callbacks[db]).forEach(function (e) {
      unsubscribe_all(db, e);
    });
    delete this.callbacks[db];
  } else if (typeof id != 'number') {
    unsubscribe_all(db, path);
  } else if (
    this.callbacks[db]
    && this.callbacks[db][path]
    && this.callbacks[db][path].length > id
  ) {
    this.callbacks[db][path].splice(id, 1, null);
    if (this.callbacks[db][path].every(function (e) { return e == null; })) {
      delete this.callbacks[db][path];
      this.client.unsubscribe(db, path);
    }
  }

}
