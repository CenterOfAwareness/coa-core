/**
 * An interface to the COA Announce database
 * @constructor
 * @param {COA} coa - An instance of the COA object (client/lib/coa.js)
 */
function COA_Announce(coa) {

}

COA_Announce.prototype._handle_update = function (update, callback) {

}

/**
 * Subscribe to 'global' or 'user' messages.<br>
 * 'global' messages are intended for all online users on all systems<br>
 * 'user' messages are intended for online users on the local system<br>
 * @param {string} location - 'global' or 'user'
 * @param {function} callback - Receives an object describing the message:<br>
 * { from_system, from_user, text } - Global message<br>
 * { from_system, from_user, to_user, text } - User message<br>
 * (All values are strings)
 * @returns {undefined}}
 */
COA_Announce.prototype.subscribe = function (location, callback) {

}

/**
 * Unsubscribe from 'global' or 'user' messages
 * @param {string} location - 'global' or 'user'
 * @returns {undefined}
 */
COA_Announce.prototype.unsubscribe = function (location) {

}

/**
 * Send a message to all online users on all systems
 * @param {string} from - The user who's sending the message
 * @param {string} text - The message text (CTRL-A codes allowed)
 * @returns {boolean} If send was successful
 */
COA_Announce.prototype.broadcast = function (from, text) {

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

}
