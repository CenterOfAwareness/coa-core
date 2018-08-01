js.time_limit = 0;

load('nodedefs.js');
require(system.mods_dir + '/coa/client/lib/coa.js', 'COA');
require(system.mods_dir + '/coa/client/lib/presence.js', 'COA_Presence');
require(system.mods_dir + '/coa/client/lib/announce.js', 'COA_Announce');

const coa = new COA();
const presence = new COA_Presence(coa);
const announce = new COA_Announce(coa);

function user_online(node) {
  return (node.status == NODE_INUSE || node.status == NODE_QUIET);
}

announce.subscribe('global', function (update) {
  system.node_list.forEach(function (e, i) {
    if (!user_online(system.node_list[e])) return;
    system.put_node_message(format(
      'From %s@%s:\r\n%s', update.from_user, update.from_system, update.text
    ));
  });
});

while (!js.terminated) {
  presence.write();
  coa.cycle();
  yield();
}
