js.time_limit = 0;

load('nodedefs.js');
require('event-timer.js', 'Timer');
require(system.mods_dir + '/coa/client/lib/coa.js', 'COA');
require(system.mods_dir + '/coa/client/lib/presence.js', 'COA_Presence');
require(system.mods_dir + '/coa/client/lib/announce.js', 'COA_Announce');
require(system.mods_dir + '/coa/client/lib/systems.js', 'COA_Systems');
require(system.mods_dir + '/coa/client/lib/cnf.js', 'COA_CNF');

var event_reconnect = null;

const timer = new Timer();
const coa = new COA();
const presence = new COA_Presence(coa);
const announce = new COA_Announce(coa);
const systems = new COA_Systems(coa);
const cnf = new COA_CNF(coa);

function user_online(node) {
  return (node.status&NODE_INUSE || node.status&NODE_QUIET);
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

function message_all_nodes(msg, sys, u) {
  var usr = new User(0);
  system.node_list.forEach(function (e, i) {
    if (!user_online(e)) return;
    if (sys == coa.system_name) {
      usr.number = e.useron;
      if (usr.alias == u) return;
    }
    system.put_node_message(i + 1, msg);
  });
  usr = undefined;
}

function message_online_user(user, msg) {
  var usr = new User(e.useron);
  system.node_list.forEach(function (e, i) { // If on multiple nodes, msg each
    if (!user_online(e)) return;
    usr.number = e.useron;
    if (usr.alias.toLowerCase() == user.toLowerCase()) {
      system.put_node_message(i + 1, msg);
    }
  });
  usr = undefined;
}

announce.callback = function (update) {
  switch (update.type) {
    case 'global_message':
      message_all_nodes(format(
        '\1n\1mGlobal message from \1h\1m%s\1n\1m@\1h\1m%s\1n\1m:\r\n%s\rn',
        update.data.from_user, update.data.from_system, update.data.text
      ), update.data.from_system, update.data.from_user);
      break;
    case 'presence_message':
      if (update.data.from_system == coa.system_name) return;
      var action = null;
      if (update.data.action == 'logon') {
        action = 'logged on';
      } else if (update.data.action == 'logoff') {
        action = 'logged off';
      }
      if (action) {
        message_all_nodes(format(
          '\1h\1m%s\1n\1m: \1h\1w%s \1n\1m%s\r\n',
          update.data.from_system, update.data.from_user, action
        ), update.data.from_system, update.data.from_user);
      }
      break;
    case 'user_message':
      message_online_user(update.data.to_user, format(
        '\1n\1mPrivate message from \1h\1m%s\1n\1m@\1h\1m%s\1n\1m:\r\n%s\r\n',
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
