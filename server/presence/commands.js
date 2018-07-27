load('nodedefs.js');
load('sbbsdefs.js');

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

  if (allowed_operations.indexOf(packet.oper) < 0) {
    log(LOG_INFO, format(
      'Presence: %s tried %s on %s from %s',
      alias, packet.oper, packet.location, client.remote_ip_address
    ));
    return true; // Handled
  }

  if (packet.oper == 'WRITE') {

    if (loc[0].toUpperCase() != alias.toUpperCase()) {
      log(LOG_INFO, format(
        'Presence: %s tried to write to %s from %s',
        admin.authenticated[client.id].alias, loc[0], client.remote_ip_address
      ));
      return true; // Handled
    }

    if (
      // Update location must be [system_name].[node_number]
      loc.length == 2
      && !isNaN(parseInt(loc[1])) && loc[1] >= 0 && loc[1] <= 255
      // Must be an object and not a primitive for the following checks to work
      && typeof packet.data == 'object'
      // Must include a valid NodeStatus index (nodedefs.js)
      && typeof packet.data.s == 'number'
      && packet.data.s >= NODE_WFC
      && packet.data.s <= NODE_LAST_STATUS
      // Must include a valid NodeAction index (nodedefs.js)
      && typeof packet.data.a == 'number'
      && packet.data.a >= NODE_MAIN
      && packet.data.a <= NODE_LAST_ACTION
      // Must include a valid user alias or empty string
      && typeof packet.data.u == 'string'
      && packet.data.u.length <= LEN_ALIAS
      // May include a custom status string up to 50 characters long
      && (
        typeof packet.data.u == 'undefined'
        || (typeof packet.data.u == 'string' && packet.data.u.length <= 50)
      )
      // Update cannot contain extraneous properties
      && Object.keys(data).every(function (e) {
        return ['s', 'a', 'u', 'c'].indexOf(e) >= 0;
      })
    ) {
      log(LOG_INFO, format(
        'Presence: %s sent an invalid update for %s from %s',
        alias, loc[0], client.remote_ip_address
      ));
      return true; // Handled
    }

  }

  return false; // Request can proceed

}
