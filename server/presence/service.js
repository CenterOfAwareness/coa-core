js.time_limit = 0;

require(system.mods_dir + '/coa//client/lib/coa.js', 'COA');
require(system.mods_dir + '/coa/client/lib/presence.js', 'COA_Presence');
// require telegram / announce / broadcast module here

const coa = new COA(host, port, username, password); // Load these parameters from somewhere
const presence = new COA_Presence(coa);
// instantiate broadcast announcement thingie here

presence.subscribe(function (update) {
  switch (update.type) {
    case 'node_logon':
      // broadcast a message here
      break;
    case 'node_logoff':
      // broadcast a message here
      break;
    default:
      break;
  }
});

while (!js.terminated) {
  coa.cycle();
  yield();
}
