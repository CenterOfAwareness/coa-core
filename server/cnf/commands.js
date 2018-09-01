require(system.mods_dir + '/coa/common/settings.js', 'coa_settings');
require(system.mods_dir + '/coa/common/messages.js', 'coa_lib_messages');

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
    || loc.length != 2
    || allowed_operations.indexOf(packet.oper) < 0
    // Only superuser may write (to coa_cnf.update)
    || (packet.oper == 'WRITE' && alias != coa_settings.server.superuser)
    // coa_cnf.update is the only subscribable location
    || (packet.oper == 'SUBSCRIBE' && loc[2] != 'update')
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
    const data = coa_settings.server.export_xtrn_groups.reduce(function (a, c) {
      if (!xtrn_area.sec[c]) return a;
      a[c] = {
        name : xtrn_area.sec[c].name,
        code : xtrn_area.sec[c].code,
        ars : xtrn_area.sec[c].ars,
        programs : xtrn_area.sec[c].prog_list.map(function (e) {
          return {
            code : e.code,
            name : e.name,
            command : e.cmd,
            clean_up_command : e.clean_cmd, // We'll probably never use this
            startup_dir : e.startup_dir,
            ars : e.ars,
            execution_ars : e.execution_ars,
            settings : e.settings,
            dropfile_type : e.type, // We'll probably never use this
            event_type : e.event
          }
        })
      };
      return a;
    }, {});

    client.sendJSON({
      scope : 'coa_cnf',
      location : packet.location,
      func : 'RESPONSE',
      oper : 'READ',
      data : data
    });

    return true; // Handled

  } else {

    log(LOG_INFO, format(
      'CNF: %s tried to read %s from %s',
      alias, packet.location, client.remote_ip_address
    ));
    return true; // Handled

  }

  return false; // Command may proceed

}
