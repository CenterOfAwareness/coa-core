// Read the settings file
const path = system.ctrl_dir + '/coa.ini';
const f = new File(path);
if (!f.exists) throw new Error('COA settings file not found: ' + path);
if (!f.open('r')) throw new Error('Could not open ' + path);
// Convert array of sections into Object with section names as keys
const coa_settings = f.iniGetAllObjects().reduce(function (a, c) {
  a[c.name] = c;
  delete a[c.name].name;
  return a;
}, {});
f.close();
// Convert list values to Arrays
if (coa_settings.server) {
  if (coa_settings.server.export_message_groups) {
    coa_settings.server.export_message_groups
    = coa_settings.server.export_message_groups.split(',');
  }
  if (coa_settings.server.export_xtrn_sections) {
    coa_settings.server.export_xtrn_sections
    = coa_settings.server.export_xtrn_sections.split(',');
  }
}
