load('sbbsdefs.js');
require(system.mods_dir + '/coa/common/settings.js', 'coa_settings');
require(system.mods_dir + '/coa/common/messages.js', 'coa_lib_messages');

//  Client connects
//  Client subscribes to coa_messages.sync[system]
//  For each managed message group
//    For each sub
//      Client writes to coa_messages.sync[system]:
//        { group, sub, msg_id } msgid is last non-local message ID
//      Server sends stream of deleted message IDs
//      Server sends stream of new messages since [msgid]
//      Server sends completion message
//      Client sends sends stream of deleted non-local message IDs since [msgid]
//        Server records these somehow
//        We may delegate network message deletion rights to some boards
//        or we may delete messages if a majority of sysops delete them locally
//      Client sends stream of all (non-deleted) local messages since [msgid]
//      Client deletes coa_messages.sync[system]
//  Client unsubscribes from coa_messages.sync[system]

this.QUERY = function (client, packet) {

  if (!admin.authenticated[client.id]) {
    log(LOG_DEBUG, format(
      'Messages: packet from unauthenticated client %s',
      client.remote_ip_address
    ));
    client.close();
    return true; // Handled
  }

  const allowed_operations = ['WRITE', 'SUBSCRIBE', 'UNSUBSCRIBE'];
  const loc = packet.location.split('.');
  const alias = admin.authenticated[client.id].alias;

  if (loc[0] != 'coa_messages' || allowed_operations.indexOf(packet.oper) < 0) {
    log(LOG_INFO, format(
      'Messages: %s tried %s on %s from %s',
      alias, packet.oper, packet.location, client.remote_ip_address
    ));
    return true;
  }

  if (packet.oper == 'WRITE') {

    if (loc.length != 3) {
      log(LOG_INFO, format(
        'Messages: %s tried %s on %s from %s',
        alias, packet.oper, packet.location, client.remote_ip_address
      ));
      return true;
    }

    if (loc[1] == 'sync') {
      if (loc[2] != alias && alias != coa_settings.server.superuser) {
        log(LOG_INFO, format(
          'Messages: %s tried to write to %s from %s',
          alias, packet.location, client.remote_ip_address
        ));
        return true;
      }
      if (
        typeof packet.data != 'object'
        || typeof packet.data.group != 'string'
        || typeof packet.data.sub != 'string'
        || typeof packet.data.msg_id != 'string'
        || coa_settings.message_groups.indexOf(packet.data.group) < 0
        || !msg_area.sub[packet.data.sub]
        || msg_area.sub[packet.data.sub].grp_name != packet.data.grp
      ) {
        log(LOG_INFO, format(
          'Messages: %s sent invalid sync request %s from %s',
          alias, JSON.stringify(packet.data), client.remote_ip_address
        ));
        return true;
      }
      // create a JSONClient to write to this location
      // send stream of deleted message IDs starting with msg_id + 1
      // send stream of new messages since packet.data.msg_id
      // send completion message
      // destroy JSONClient
      return true;
    }

    if (coa_settings.message_groups.indexOf(loc[1]) < 0) {
      log(LOG_INFO, format(
        'Messages: %s tried to write to sub %s of invalid group %s from %s',
        alias, loc[2], loc[1], client.remote_ip_address
      ));
      return true;
    }

    if (!msg_area.sub[loc[2]] || msg_area.sub[loc[2]].grp_name != loc[1]) {
      log(LOG_INFO, format(
        'Messages: %s tried to write to invalid sub %s of group %s from %s',
        alias, loc[2], loc[1], client.remote_ip_address
      ));
      return true;
    }

    if (false) { // Passes a validation
      log(LOG_INFO, format(
        'Messages: %s tried to write an invalid message from %s; %s %s',
        alias, client.remote_ip_address, packet.location, JSON.stringify(packet.data)
      ));
      return true;
    }

    // Write the message to the local message base
    return false; // Allow the message to be written to coa_messages[group][sub] so subscribers will pick it up

  } else if (packet.oper == 'SUBSCRIBE') {

    // Allow subscription to coa_messages.sync[alias]
    // or coa_messages[group]

  }

  return false; // Command may proceed

}
