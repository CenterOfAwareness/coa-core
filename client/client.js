js.time_limit = 0;

load('nodedefs.js');
require('event-timer.js', 'Timer');
require(system.mods_dir + '/coa/client/lib/coa.js', 'COA');
require(system.mods_dir + '/coa/client/lib/presence.js', 'COA_Presence');
require(system.mods_dir + '/coa/client/lib/announce.js', 'COA_Announce');
require(system.mods_dir + '/coa/client/lib/systems.js', 'COA_Systems');

var event_reconnect = null;

const timer = new Timer();
const coa = new COA();
const presence = new COA_Presence(coa);
const announce = new COA_Announce(coa);
const systems = new COA_Systems(coa);

function user_online(node) {
  return (node.status == NODE_INUSE || node.status == NODE_QUIET);
}

function ping() {
  if (coa.connected) systems.ping);
}

function reconnect() {
  if (!coa.connect()) return;
  coa.ident(
    'admin',
    coa_settings.client.system_name,
    coa_settings.client.system_password
  );
  event_reconnect.abort = true;
}

announce.callback = function (update) {
  system.node_list.forEach(function (e, i) {
    if (!user_online(e)) return;
    system.put_node_message(i + 1, format(
      'From %s@%s:\r\n%s',
      update.data.from_user, update.data.from_system, update.data.text
    ));
  });
}
announce.subscribe('global');
announce.subscribe('user');

systems.ping();
timer.addEvent(coa_settings.client.ping_interval, true, ping);

while (!js.terminated) {
  if (coa.connected) {
    presence.write();
    coa.cycle();
  } else if (event_reconnect === null || event_reconnect.abort) {
    event_reconnect = timer.addEvent(
      coa_settings.client.reconnect_interval, true, reconnect
    );
  }
  timer.cycle();
  yield();
}
