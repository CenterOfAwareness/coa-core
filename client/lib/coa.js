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
    if (
      ['WRITE','PUSH','POP','SHIFT','UNSHIFT','DELETE'].indexOf(u.oper) >= 0
      && typeof callbacks[u.scope] != 'undefined'
    ) {
      callbacks[u.scope].forEach(function (e) { e(u); });
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
 * @returns {number} The callback ID, for use with coa.unsubscribe
 */
COA.prototype.subscribe = function (db, callback) {
  if (typeof this.callbacks[db] == 'undefined') {
    this.callbacks[db] = [];
    this.client.subscribe(db, db);
  }
  this.callbacks[db].push(callback);
  return (this.callbacks[db].length - 1);
}

/**
 * Unsubscribe from updates
 * @param {string} [db=undefined] - The JSON-DB module to unsubscribe from (eg. 'presence') (undefined means all)
 * @param {number} [id=undefined] - The callback to remove (undefined means all)
 * @returns {undefined}
 */
COA.prototype.unsubscribe = function (db, id) {

  const self = this;

  function unsubscribe_all(db) {
    if (self.callbacks[db]) {
      self.client.unsubscribe(db, db);
      delete self.callbacks[db];
    }
  }

  // If no database was specified, unsubscribe from all
  if (!db) {
    Object.keys(this.callbacks).forEach(function (e) {
      self.client.unsubscribe(e, e);
      delete this.callbacks[e];
    });
  // If a database was specified and we have callbacks for it
  // and if no callback ID was specified, unsubscribe from that database
  } else if (this.callbacks[db] && typeof id == 'undefined') {
    this.client.unsubscribe(db, db);
    delete this.callbacks[db];
  // If a database was specified and we have callbacks for it
  // and a callback ID was specified, remove that callback from the list
  } else if (
    this.callbacks[db]
    && typeof id == 'number' && id >= 0 && id < this.callbacks[db].length
  ) {
    this.callbacks[db].splice(id, 1, null);
    // If this was the only remaining callback for this subscription
    // unsubscribe from the database
    if (this.callbacks[db].every(function (e) { return e == null; })) {
      delete this.callbacks[db];
      this.client.unsubscribe(db, db);
    }
  }

}
