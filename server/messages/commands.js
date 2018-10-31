load('sbbsdefs.js');
require(system.mods_dir + '/coa/common/settings.js', 'coa_settings');
require(system.mods_dir + '/coa/common/messages.js', 'coa_lib_messages');

//  Client connects
//  Client subscribes to coa_messages.sync[system]
//  For each managed message group
//    For each sub
//      Client writes to coa_messages.sync[system]:
//        { [group]: { [sub]: [msgid] } } msgid is last non-local message ID
//      Server sends stream of deleted message IDs
//      Server sends stream of new messages since [msgid]
//      Server sends completion message
//      Client sends sends stream of deleted non-local message IDs since [msgid]
//        Server records these somehow
//        We may delegate network message deletion rights to some boards
//        or we may delete messages if a majority of sysops delete them locally
//      Client sends stream of all (non-deleted) local messages since [msgid]
//      Client deletes coa_messages.sync[system]

this.QUERY = function (client, packet) {

  return false; // Command may proceed

}
