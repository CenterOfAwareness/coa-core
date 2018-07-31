load('sbbsdefs.js');
require(argv[0] + '../../common/validate.js', 'coa_validate');

this.QUERY = function (client, packet) {

  if (!admin.authenticated[client.id]) {
    log(LOG_DEBUG, format(
      'Announce: packet from unauthenticated client %s',
      client.remote_ip_address
    ));
    client.close();
    return true; // Handled
  }

  const allowed_operations = ['WRITE', 'SUBSCRIBE', 'UNSUBSCRIBE'];
  const loc = packet.location.split('.');
  const alias = admin.authenticated[client.id].alias;

  if (
    loc[0] != 'coa_announce'
    || allowed_operations.indexOf(packet.oper) < 0
    || loc.length != 2
  ) {
    log(LOG_INFO, format(
      'Announce: %s tried %s on %s from %s',
      alias, packet.oper, packet.location, client.remote_ip_address
    ));
    return true; // Handled
  }

  if (packet.oper == 'WRITE') {
    // If target is 'global', must be a valid global message
    if (
      loc[1] == 'global' && !coa_validate.announce_global_message(packet.data)
    ) {
      log(LOG_INFO, format(
        'Announce: %s sent an invalid global message from %s',
        admin.authenticated[client.id].alias, client.remote_ip_address
      ));
      return true; // Handled
    // If target is [system], [system] must exist and message must be valid
    } else if (
      !coa_validate.alias_exists(loc[1])
      || !coa_validate.announce_user_message(packet.data)
    ) {
      log(LOG_INFO, format(
        'Announce: %s sent an invalid user message to %s from %s',
        admin.authenticated[client.id].alias, loc[1], client.remote_ip_address
      ));
      return true; // Handled
    }
  } else if (packet.oper == 'SUBSCRIBE') {
    // You can only subscribe to 'global' or your own [system_name]
    if (loc[1] != 'global' && loc[1] != admin.authenticated[client.id].alias) {
      log(LOG_INFO, format(
        'Announce: %s tried to subscribe to %s from %s',
        admin.authenticated[client.id].alias, loc[1], client.remote_ip_address
      ));
      return true;
    }
  }

  return false; // Request can proceed

}
