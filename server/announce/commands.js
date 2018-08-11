load('sbbsdefs.js');
require(system.mods_dir + '/coa/common/validate.js', 'coa_validate');
require(system.mods_dir + '/coa/common/settings.js', 'coa_settings');

const RATE_LIMIT_WINDOW = 5;
const RATE_LIMIT_MS = 10000;
const throttle = {};

// Keep memory usage down by cleaning out aged rate-limiter records
// Not super efficient, but 'throttle' should generally be quite small
function vacu_suck() {
  const now = new Date().getTime();
  Object.keys(throttle).forEach(function (e) {
    Object.keys(throttle[e]).forEach(function (ee) {
      throttle[e][ee] = throttle[e][ee].filter(function (eee) {
        return (now - eee <= (RATE_LIMIT_MS * 2));
      });
      if (!throttle[e][ee].length) delete throttle[e][ee];
    });
    if (!Object.keys(throttle[e]).length) delete throttle[e];
  });
}

this.QUERY = function (client, packet) {

  vacu_suck();

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
    || loc.length != 3
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
      var ret = false;
      switch (loc[2]) {
        case 'text':
          if (!coa_validate.announce_global_message(packet.data)) {
            ret = true;
            log(LOG_INFO, format(
              'Announce: %s sent an invalid global text message from %s',
              alias, client.remote_ip_address
            ));
          }
          break;
        case 'presence':
          if (alias != coa_settings.server.superuser) {
            ret = true;
            log(LOG_INFO, format(
              'Announce: %s tried to write to global.presence from %s',
              alias, client.remote_ip_address
            ));
          }
          break;
        default:
          ret = true;
          log(LOG_INFO, format(
            'Announce: %s tried to write to %s from %s',
            alias, packet.location, client.remote_ip_address
          ));
          break;
      }
      if (ret) return true; // Handled
    // If target is systems.[system], [system] must exist, message must be valid
    } else if (loc[1] == 'systems') {
      if (!coa_validate.alias_exists(loc[2])) {
        log(LOG_INFO, format(
          'Announce: %s sent a message to invalid system %s from %s',
          alias, packet.location, client.remote_ip_address
        ));
        return true; // Handled
      } else if(!coa_validate.announce_user_message(packet.data)) {
        log(LOG_INFO, format(
          'Announce: %s sent an invalid user message to %s from %s',
          alias, packet.location, client.remote_ip_address
        ));
        return true; // Handled
      }
    } else { // Not coa_announce.global.x or coa_announce.systems.x
      log(LOG_INFO, format (
        'Announce: %s tried to write to %s from %s',
        alias, packet.location, client.remote_ip_address
      ));
      return true; // Handled
    }
    if (
      packet.data.from_system != alias
      && alias != coa_settings.server.superuser
    ) {
      log(LOG_INFO, format(
        'Announce: %s sent a message with from_system %s from %s',
        alias, packet.data.from_system, client.remote_ip_address
      ));
      return true; // Handled
    }
    // Rate limiting - probably a terrible approach
    // A user can send RATE_LIMIT_WINDOW messages in a span of RATE_LIMIT_MS.
    // Failed attempts count against this score; they need to back off for a
    // while before they can send a new message.
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
          alias, packet.data.from_user, client.remote_ip_address, acc
        ));
        return true;
      }
    }
  } else if (packet.oper == 'SUBSCRIBE') {
    // You can only subscribe to 'global' or your own [system_name]
    if (loc[1] != 'global' && loc[2] != alias) {
      log(LOG_INFO, format(
        'Announce: %s tried to subscribe to %s from %s',
        alias, packet.location, client.remote_ip_address
      ));
      return true;
    }
  }

  return false; // Request can proceed

}
