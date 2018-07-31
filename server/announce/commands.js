load('sbbsdefs.js');
require(argv[0] + '../../common/validate.js', 'coa_validate');

this.QUERY = function (client, packet) {

  if (!admin.authenticated[client.id]) {
    log(LOG_DEBUG, format(
      'Presence: packet from unauthenticated client %s',
      client.remote_ip_address
    ));
    client.close();
    return true; // Handled
  }

  const allowed_operations = ['WRITE', 'SUBSCRIBE', 'UNSUBSCRIBE'];
  const loc = packet.location.split('.');
  const alias = admin.authenticated[client.id].alias;

  return false; // Request can proceed

}
