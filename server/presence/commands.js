load('nodedefs.js');
load('sbbsdefs.js');
require(argv[0] + '../../common/validate.js', 'coa_validate');

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

    if (loc[1].toUpperCase() != alias.toUpperCase()) {
      log(alias.toUpperCase());
      log(LOG_INFO, format(
        'Presence: %s tried to write to %s from %s',
        admin.authenticated[client.id].alias, loc[1], client.remote_ip_address
      ));
      return true; // Handled
    }

    if (
      // Update location must be [system_name].[node_number]
      loc.length == 3
      && coa_validate.node_number(loc[2])
      && coa_validate.presence_node_update(packet.data)
    ) {
      log(LOG_INFO, format(
        'Presence: %s sent an invalid update for %s from %s',
        alias, loc[1], client.remote_ip_address
      ));
      return true; // Handled
    }

  }

  return false; // Request can proceed

}
