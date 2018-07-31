load('sbbsdefs.js');
require(argv[0] + '../../common/validate.js', 'coa_validate');

const RATE_LIMIT_WINDOW = 5;
const RATE_LIMIT_MS = 10000;
const throttle = {};

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
    if (loc[1] == 'global') {
      if (!coa_validate.announce_global_message(packet.data)) {
        log(LOG_INFO, format(
          'Announce: %s sent an invalid global message from %s',
          admin.authenticated[client.id].alias, client.remote_ip_address
        ));
        return true; // Handled
      }
    // If target is [system], [system] must exist and message must be valid
    } else {
      if (!coa_validate.alias_exists(loc[1])) {
        log(LOG_INFO, format(
          'Announce: %s sent a message to invalid system %s from %s',
          admin.authenticated[client.id].alias, loc[1], client.remote_ip_address
        ));
        return true; // Handled
      } else if(!coa_validate.announce_user_message(packet.data)) {
        log(LOG_INFO, format(
          'Announce: %s sent an invalid user message to %s from %s',
          admin.authenticated[client.id].alias, loc[1], client.remote_ip_address
        ));
        return true; // Handled
      }
    }
    if (packet.data.from_system != admin.authenticated[client.id].alias) {
      log(LOG_INFO, format(
        'Announce: %s sent a message with from_system %s from %s',
        admin.authenticated[client.id].alias,
        packet.data.from_system,
        client.remote_ip_address
      ));
      return true; // Handled
    }
    // Rate limiting - probably a terrible approach
    // A user can send up to RATE_LIMIT_WINDOW messages in a row unchecked.
    // If their last ten messages were sent in a span of <= RATE_LIMIT_MS
    // milliseconds, they will be prevented from sending a new one.
    // Failed attempts count against this score, so you can't just keep
    // attempting to write new messages in a loop until your last successful
    // message ages sufficiently.
    if (!throttle[client.id]) throttle[client.id] = {};
    if (!throttle[client.id][packet.data.from_user]) {
      throttle[client.id][packet.data.from_user] = [];
    }
    throttle[client.id][packet.data.from_user].push(new Date().getTime());
    if (throttle[client.id][packet.data.from_user].length > RATE_LIMIT_WINDOW) {
      throttle[client.id][packet.data.from_user].shift();
      var acc = 0;
      for (var i = RATE_LIMIT_WINDOW - 1; i > 0; i--) {
        acc += (
          throttle[client.id][packet.data.from_user][i]
          - throttle[client.id][packet.data.from_user][i - 1]
        );
      }
      if (acc <= RATE_LIMIT_MS) {
        log(LOG_INFO, format (
          'Announce: %s user %s exceeded rate limit from %s (10 msgs in %s ms)',
          admin.authenticated[client.id].alias,
          packet.data.from_user,
          client.remote_ip_address,
          acc
        ));
        return true;
      }
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
