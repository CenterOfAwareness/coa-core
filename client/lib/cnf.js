load('sbbsdefs.js');
require('cnflib.js', CNF);
require(system.mods_dir + '/coa/common/validate.js', 'coa_validate');

function apply_messages(data) {
  // validate data
  // compare with existing local config
  // write anything from COA that is not consistent with local config
}

function apply_xtrn(data) {
  // validate data
  // compare with existing local config
  // write anything from COA that is not consistent with local config
}

function COA_CNF(coa) {
  Object.defineProperty(this, 'coa', { value : coa });
}

COA_CNF.prototype.read = function (loc) {
  if (['messages', 'xtrn'].indexOf(loc) < 0) {
    throw new Error('COA_CNF: Invalid read location ' + loc);
  }
  try {
    const data = this.coa.read('coa_cnf', loc, 1);
    if (loc == 'messages') {
      apply_messages(data);
    } else if (loc == 'xtrn') {
      apply_xtrn(data);
    }
  } catch (err) {
    log(LOG_ERR, 'COA_CNF: ' + err);
  }
}

COA_CNF.prototype.subscribe = function () {
  const self = this;
  this.coa.set_callback('coa_cnf', function (update) {
    const loc = update.location.split('.');
    if (loc[1] != 'update') return;
    if (['messages', 'xtrn'].indexOf(update.data) < 0) return;
    self.read(update.data);
  });
  this.coa.subscribe('coa_cnf', 'update');
}
