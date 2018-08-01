const path = system.ctrl_dir + '/coa.ini';
const f = new File(path);
if (!f.exists) throw new Error('COA settings file not found: ' + path);
if (!f.open('r')) throw new Error('Could not open ' + path);
const coa_settings = f.iniGetObject();
f.close();
