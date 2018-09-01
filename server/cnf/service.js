js.time_limit = 0;

require('event-timer.js', 'Timer');
require(system.mods_dir + '/coa/common/settings.js', 'coa_settings');
require(system.mods_dir + '/coa/common/messages.js', 'coa_lib_messages');
require(system.mods_dir + '/coa/client/lib/coa.js', 'COA');

const state = { msg : {}, xtrn : {} };
const timer = new Timer();
const coa = new COA();

coa_settings.export_message_groups.forEach(function (e) {
  state.msg[e] = coa_lib_messages.load_message_groups(
    coa_settings.server.export_message_groups
  );
});

while (!js.terminated) {
  timer.cycle();
  yield();
}
