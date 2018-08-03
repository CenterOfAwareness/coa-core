require(system.mods_dir + '/coa/common/validate.js', 'coa_validate');

/**
 * An interface to the COA Systems database
 * @constructor
 * @param {COA} coa - An instance of the COA object (client/lib/coa.js)
 */
function COA_Systems(coa) {
  Object.defineProperty(this, 'coa', { value : coa });
}

/**
 * Get the full list of systems, or details of one system
 * @param {string} [system=undefined] - The name of the system (optional)
 * @returns {object} The requested data as an Object or Array of Objects
 * with the following properties:<br>
 * { name, long_name, address, joined, last_ping }<br>
 * All values are strings except for last_ping, which is a time_t number
 */
COA_Systems.prototype.get = function (system) {
  var path = 'coa_systems';
  if (typeof system != 'undefined') {
    if (!coa_validate.alias(system)) {
      throw new Error('COA_Systems: Invalid system name ' + system);
    }
    path += '.' + system;
  }
  return this.coa.read('coa_systems', path, 1);
}

// client/client.js use only
COA_Systems.prototype.ping = function () {
  this.coa.write(
    'coa_systems', 'coa_systems.' + this.coa.system_name + '.ping', null, 2
  );
};
