require(system.mods_dir + '/coa/common/settings.js', 'coa_settings');

this.QUERY = function (client, packet) {

  if (!admin.authenticated[client.id]) {
    log(LOG_DEBUG, format(
      'CNF: packet from unauthenticated client %s',
      client.remote_ip_address
    ));
    client.close();
    return true; // Handled
  }

  const allowed_operations = ['READ'];
  const loc = packet.location.split('.');
  const alias = admin.authenticated[client.id].alias;

  if (loc[0] != 'coa_cnf' || packet.oper != 'READ' || loc.length > 2) {
    log(LOG_INFO, format(
      'CNF: %s tried %s on %s from %s',
      alias, packet.oper, packet.location, client.remote_ip_address
    ));
    return true; // Handled
  }

  // Send a list of all exportable message groups & their subs
  if (loc[1] == 'messages') {

    if (!coa_settings.server.export_message_groups) return true;
    const data = coa_settings.server.export_message_groups.reduce(
      function (a, c) {
        if (!msg_area.grp[c]) return a;
        a[c] = {
          name : msg_area.grp[c].name,
          description : msg_area.grp[c].description,
          ars : msg_area.grp[c].ars,
          subs : msg_area.grp[c].sub_list.map(
            function (e) {
              return {
                code : e.code,
                name : e.name,
                description : e.description,
                ars : {
                  all : e.ars,
                  read : e.read_ars,
                  post : e.post_ars,
                  operator : e.operator_ars,
                  moderated : e.moderated_ars,
                },
                settings : e.settings
              }
            }
          )
        };
        return a;
      }, {}
    );

    client.sendJSON({
      scope : 'coa_cnf',
      location : packet.location,
      func : 'RESPONSE',
      oper : 'READ',
      data : data
    });

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

  } else {

    log(LOG_INFO, format(
      'CNF: %s tried to read %s from %s',
      alias, packet.location, client.remote_ip_address
    ));

  }

  return true; // Handled

}
