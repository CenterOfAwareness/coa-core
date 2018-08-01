load('nodedefs.js');
load('sbbsdefs.js');
require(system.mods_dir + '/coa/common/validate.js', 'coa_validate');

this.QUERY = function (client, packet) {

  if (!admin.authenticated[client.id]) {
    log(LOG_DEBUG, format(
      'Presence: packet from unauthenticated client %s',
      client.remote_ip_address
    ));
    client.close();
    return true; // Handled
  }

  const allowed_operations = ['WRITE', 'READ', 'SUBSCRIBE', 'UNSUBSCRIBE'];
  const loc = packet.location.split('.');
  const alias = admin.authenticated[client.id].alias;

  if (loc[0] != 'coa_presence' || allowed_operations.indexOf(packet.oper) < 0) {
    log(LOG_INFO, format(
      'Presence: %s tried %s on %s from %s',
      alias, packet.oper, packet.location, client.remote_ip_address
    ));
    return true; // Handled
  }

  if (packet.oper == 'WRITE') {
    // A system can only write to its own scope (coa_presence[system])
    if (loc.length < 2 || loc[1].toUpperCase() != alias.toUpperCase()) {
      log(LOG_INFO, format(
        'Presence: %s tried to write to %s from %s',
        admin.authenticated[client.id].alias, loc[1], client.remote_ip_address
      ));
      return true; // Handled
    }
    // If location is coa_presence[system][node]
    if (
      loc.length == 3
      // [node] must be valid
      && !coa_validate.node_number(loc[2])
      // must be a valid node update
      && !coa_validate.presence_node_update(packet.data)
    ) {
      log(LOG_INFO, format(
        'Presence: %s sent an invalid update for %s from %s',
        alias, loc[1], client.remote_ip_address
      ));
      return true; // Handled
    }
    // If location is coa_presence[system][node][s,a,u,c]
    if (loc.length == 4 && (
      ['s', 'a', 'u', 'c'].indexOf(loc[3]) < 0
      || (loc[3] == 's' && !coa_validate.node_status(packet.data))
      || (loc[3] == 'a' && !coa_validate.node_action(packet.data))
      || (loc[3] == 'u' && !coa_validate.alias(packet.data))
      || (loc[3] == 'c' && !coa_validate.node_status_custom(packet.data))
    )) {
      log(LOG_INFO, format(
        'Presence: %s sent a invalid update %s for %s from %s',
        alias, packet.data, packet.location, client.remote_ip_address
      ));
      return true; // Handled
    }
  // If location is coa_presence[system] or deeper
  } else if (packet.oper == 'SUBSCRIBE' && loc.length > 1) {
    var ret = false;
    // Can't go any deeper than coa_presence[system][node][attribute]
    if (loc.length > 4) {
      ret = true;
    // [system] must be valid and must already exist
    } else if (!coa_validate.alias_exists(loc[1])) {
      ret = true;
    // If specified, [node] must be valid
    } else if (loc.length >= 3 && !coa_validate.node_number(loc[2])) {
      ret = true;
    }
    if (ret) {
      log(LOG_INFO, format(
        'Presence: %s sent an invalid subscription for %s from %s',
        alias, packet.location, client.remote_ip_address
      ));
    }
    return ret;
  }

  return false; // Request can proceed

}
