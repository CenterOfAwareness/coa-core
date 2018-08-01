require(system.mods_dir + '/coa/common/validate.js', 'coa_validate');

/**
 * An interface to the COA Announce database
 * @constructor
 * @param {COA} coa - An instance of the COA object (client/lib/coa.js)
 * @property {function} callback - A function that handles updates<br>
 * The callback will receive one parameter, an object such as:<br>
 * {type : 'global_message', data : {from_system, from_user, text}}
 * {type : 'user_message', data : {from_system, from_user, to_user, text}}<br>
 * (All values of 'data' are strings.)<br>
 * If you subscribe to any announcement types, you must set this property in
 * order to react to any announcements that come in.
 */
function COA_Announce(coa) {
  var callback = function () {};
  Object.defineProperty(this, 'coa', { value : coa });
  Object.defineProperty(this, 'callback', {
    get : function () { return callback; },
    set : function (cb) {
      if (typeof cb == 'function') {
        coa.set_callback('coa_announce', callback);
      } else if (typeof cb != 'undefined') {
        throw new Error('COA_Announce: invalid callback');
      }
      callback = cb;
    }
  });
}

COA_Announce.prototype._handle_update = function (update) {
  if (!this.callback) return;
  const loc = update.location.split('.');
  if (loc[1] == 'global') {
    this.callback({ type : 'global_message', data : update.data });
  } else if (loc[1] == this.coa.system_name) {
    this.callback({ type : 'user_message', data : update.data });
  }
}

/**
 * Subscribe to 'global' or 'user' messages.<br>
 * 'global' messages are intended for all online users on all systems<br>
 * 'user' messages are intended for online users on the local system<br>
 * @param {string} location - 'global' or 'user'
 * @returns {undefined}}
 */
COA_Announce.prototype.subscribe = function (location) {
  if (['global', 'user'].indexOf(location) < 0) {
    throw new Error('COA_Announce: invalid subscription location ' + location);
  }
  if (location == 'user') location = this.coa.system_name;
  this.coa.subscribe('coa_announce', 'coa_announce.' + location);
}

/**
 * Unsubscribe from 'global' or 'user' messages
 * @param {string} location - 'global' or 'user'
 * @returns {undefined}
 */
COA_Announce.prototype.unsubscribe = function (location) {
  if (['global', 'user'].indexOf(location) < 0) {
    throw new Error('COA_Announce: invalid subscription location ' + location);
  }
  if (location == 'user') location = this.coa.system_name;
  this.coa.unsubscribe('coa_announce', 'coa_announce.' + location);
}

/**
 * Send a message to all online users on all systems
 * @param {string} from - The user who's sending the message
 * @param {string} text - The message text (CTRL-A codes allowed)
 * @returns {boolean} If send was successful
 */
COA_Announce.prototype.broadcast = function (from, text) {
  if (!coa_validate.announce_message_text(text)) {
    throw new Error('COA_Announce: invalid message text ' + text);
  }
  if (!coa_validate.alias_exists(from)) {
    throw new Error('COA_Announce: invalid "from" user ' + from);
  }
  return this.coa.write(
    'coa_announce', 'coa_announce.global', {
      from_system : this.coa.system_name,
      from_user : from,
      text : text
    }, 2
  );
}

/**
 * Send a message to a user on a system
 * @param {string} from - The user who's sending the message
 * @param {string} to - The alias of the intended recipient
 * @param {string} to_system - The system that the recipient is on
 * @param {string} text - The message text (CTRL-A codes allowed)
 * @returns {boolean} If send was successful
 */
COA_Announce.prototype.user_message = function (from, to, to_system, text) {
  if (!coa_validate.announce_message_text(text)) {
    throw new Error('COA_Announce: invalid message text ' + text);
  }
  if (!coa_validate.alias_exists(from)) {
    throw new Error('COA_Announce: invalid "from" user ' + from);
  }
  if (!coa_validate.alias(to)) {
    throw new Error('COA_Announce: invalid "to" user ' + to);
  }
  if (!coa_validate.alias(to_system)) {
    throw new Error('COA_Announce: invalid "to" system' + to_system);
  }
  return this.coa.write(
    'coa_announce', 'coa_announce.' + to_system, {
      from_system : this.coa.system_name,
      from_user : from,
      to_user : to,
      text : text
    }, 2
  );
}
