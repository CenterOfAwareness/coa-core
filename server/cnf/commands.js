require(system.mods_dir + '/coa/common/settings.js', 'coa_settings');
require(system.mods_dir + '/coa/common/messages.js', 'coa_lib_messages');
require(system.mods_dir + '/coa/common/xtrn.js', 'coa_lib_xtrn');

this.QUERY = function (client, packet) {

  if (!admin.authenticated[client.id]) {
    log(LOG_DEBUG, format(
      'CNF: packet from unauthenticated client %s',
      client.remote_ip_address
    ));
    client.close();
    return true; // Handled
  }

  const allowed_operations = ['READ', 'WRITE', 'SUBSCRIBE'];
  const loc = packet.location.split('.');
  const alias = admin.authenticated[client.id].alias;

  if (
    // Must be coa_cnf[something]
    loc[0] != 'coa_cnf'
    // Must be coa_cnf[something] and nothing more
    || loc.length != 2
    // Must be a permitted operation
    || allowed_operations.indexOf(packet.oper) < 0
    // Only superuser may write (to coa_cnf.update)
    || (packet.oper == 'WRITE' && (alias != coa_settings.server.superuser || loc[1] != 'update'))
    // coa_cnf.update is the only subscribable location
    || (packet.oper == 'SUBSCRIBE' && loc[1] != 'update')
  ) {
    log(LOG_INFO, format(
      'CNF: %s tried %s on %s from %s',
      alias, packet.oper, packet.location, client.remote_ip_address
    ));
    return true; // Handled
  }

  // Send a list of all exportable message groups & their subs
  if (loc[1] == 'messages') {

    if (!coa_settings.server.export_message_groups) return true;
    const data = coa_lib_messages.load_message_groups(
      coa_settings.server.export_message_groups
    );

    client.sendJSON({
      scope : 'coa_cnf',
      location : packet.location,
      func : 'RESPONSE',
      oper : 'READ',
      data : data
    });

    return true; // Handled

  // Send a list of all exportable xtrn sections & their program lists
  } else if (loc[1] == 'xtrn') {

    if (!coa_settings.server.export_xtrn_groups) return true;
    const data = coa_lib_xtrn.load_xtrn_sections(
      coa_settings.server.export_xtrn_sections
    );

    client.sendJSON({
      scope : 'coa_cnf',
      location : packet.location,
      func : 'RESPONSE',
      oper : 'READ',
      data : data
    });

    return true; // Handled

  }

  return false; // Command may proceed

}
