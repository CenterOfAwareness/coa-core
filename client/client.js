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
  if (coa.connected) systems.ping;
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

function message_all_nodes(msg) {
  system.node_list.forEach(function (e, i) {
    if (user_online(e)) system.put_node_message(i + 1, msg);
  });
}

function message_online_user(user, msg) {
  system.node_list.forEach(function (e, i) { // If on multiple nodes, msg each
    if (!user_online(e)) return;
    const usr = new User(e.useron);
    if (usr.alias.toLowerCase() == user.toLowerCase()) {
      system.put_node_message(i + 1, msg);
    }
    usr = undefined;
  });
}

announce.callback = function (update) {
  switch (update.data.type) {
    case 'global_message':
      message_all_nodes(format(
        '\1n\1mGlobal message from \1h\1m%s\1n\1m@\1h\1m%s\1n\1m:\r\n%s',
        update.data.from_user, update.data.from_system, update.data.text
      ));
      break;
    case 'presence_message':
      var action = null;
      if (update.data.action == 'logon') {
        action = 'logged on';
      } else if (update.data.action == 'logoff') {
        action = 'logged_off';
      }
      if (action) {
        message_all_nodes(format(
          '\1h\1m%s\1n\1m: \1h\1w%s \1n\1m%s',
          update.data.from_system, update.data.from_user, action
        ));
      }
      break;
    case 'user_message':
      message_online_user(update.data.to_user, format(
        '\1n\1mPrivate message from \1h\1m%s\1n\1m@\1h\1m%s\1n\1m:\r\n%s',
        update.data.from_user, update.data.from_system, update.data.text
      ));
      break;
    default:
      break;
  }
}
announce.subscribe('global');
announce.subscribe('presence');
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
