load('sbbsdefs.js');
require(system.mods_dir + '/coa/common/validate.js', 'coa_validate');
require(system.mods_dir + '/coa/common/settings.js', 'coa_settings');

this.QUERY = function (client, packet) {

  if (!admin.authenticated[client.id]) {
    log(LOG_DEBUG, format(
      'Systems: packet from unauthenticated client %s',
      client.remote_ip_address
    ));
    client.close();
    return true; // Handled
  }

  const loc = packet.location.split('.');
  const alias = admin.authenticated[client.id].alias;

  if (
    loc[0] != 'coa_systems'
    // You can read coa_systems or coa_systems[system]
    || (loc.length > 2 && packet.oper == 'READ')
    // You can write to coa_systems[system].ping but not elsewhere
    || (loc.length != 3 && packet.oper == 'WRITE')
  ) {
    log(LOG_INFO, format(
      'Announce: %s tried %s on %s from %s',
      alias, packet.oper, packet.location, client.remote_ip_address
    ));
    return true; // Handled
  }

  if (packet.oper == 'READ') {

    // If they're reading coa_systems
    if (loc.length == 1) {

      const data = [];
      var usr = new User(0);
      for (var n = 1; n < system.lastuser; n++) {
        usr.number = n;
        if (usr.settings&USER_DELETED) continue;
        if (!(usr.security.flags1&UFLAG_C)) continue;
        data.push({
          name : usr.alias,
          long_name : usr.name,
          address : usr.address,
          joined : usr.birthdate,
          last_ping : usr.logontime
        });
      }
      usr = undefined;

      client.sendJSON({
        scope : 'coa_systems',
        location : packet.location,
        func : 'RESPONSE',
        oper : 'READ',
        data : data
      });

      return true;

    } else { // loc.length must be 2 if we got here

      var un = system.matchuser(loc[1]);
      if (un < 1) return false;
      var usr = new User(un);
      if (usr.settings&USER_DELETED || !(usr.security.flags1&UFLAG_C)) {
        return true;
      }
      client.sendJSON({
        scope : 'coa_systems',
        location : packet.location,
        func : 'RESPONSE',
        oper : 'READ',
        data : {
          name : usr.alias,
          long_name : usr.name,
          address : usr.address,
          joined : usr.birthdate,
          last_ping : usr.logontime
        }
      });

      return true;

    }

  } else if (packet.oper == 'WRITE' ) {

    if (loc[1] != alias || loc[2] != 'ping') {
      log(LOG_INFO, format(
        'Announce: %s tried %s on %s from %s',
        alias, packet.oper, packet.location, client.remote_ip_address
      ));
      return true; // Handled
    }

    var un = system.matchuser(loc[1]);
    if (un < 1) return false; // This should be impossible, but meh.
    var usr = new User(un);
    if (usr.settings&USER_DELETED || !(usr.security.flags1&UFLAG_C)) {
      return true;
    }
    usr.logontime = time();
    usr = undefined;
    return true;

  }

  return true;

}
