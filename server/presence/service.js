js.time_limit = 0;

require(system.mods_dir + '/coa/client/lib/coa.js', 'COA');
require(system.mods_dir + '/coa/client/lib/presence.js', 'COA_Presence');
require(system.mods_dir + '/coa/client/lib/announce.js', 'COA_Announce');

const coa = new COA();
const presence = new COA_Presence(coa);
const announce = new COA_Announce(coa);

presence.subscribe(function (update) {
  switch (update.type) {
    case 'node_logon':
      announce.presence(update.data.system, update.data.user, 'logon');
      break;
    case 'node_logoff':
      announce.presence(udpate.data.system, update.data.user, 'logoff');
      break;
    default:
      break;
  }
});

while (!js.terminated) {
  coa.cycle();
  yield();
}
