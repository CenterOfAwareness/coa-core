load('sbbsdefs.js');
require('cnflib.js', 'CNF');
require(system.mods_dir + '/coa/common/validate.js', 'coa_validate');

function apply_messages(data) {
  // validate data
  // compare with existing local config
  // write anything from COA that is not consistent with local config
}

function apply_xtrn(data) {
  if (typeof data != 'object') return;
  const xtrn_cnf = CNF.read(system.ctrl_dir + 'xtrn.cnf');
  if (!xtrn_cnf) throw new Error('COA_CNF: Unable to open xtrn.cnf');
  var change = false;
  Object.keys(data).forEach(function (e) { // External Program section
    if (!coa_validate.xtrn_section(data[e])) {
      log(LOG_ERR, 'COA_CNF: Invalid xtrn section ' + JSON.stringify(data[e]));
      return;
    }
    var sec_idx = -1;
    xtrn_cnf.xtrnsec.some(function (ee, ii) {
      if (ee.code.toLowerCase() == e.toLowerCase()) {
        sec_idx = ii;
        return true;
      }
      return false;
    });
    if (!sec_idx < 0) {
      xtrn_cnf.xtrnsec.push({
        name : data[e].name,
        code : data[e].code,
        ars : data[e].ars
      });
      change = true;
      sec_idx = xtrn_cnf.xtrnsec.length - 1;
    }
    const codes = [];
    data[e].programs.forEach(function (ee) {
      codes.push(ee.code.toLowerCase());
      var prog_idx = -1;
      const rec = {
        sec : sec_idx,
        name : ee.name,
        code : ee.code,
        ars : ee.ars,
        execution_ars : ee.execution_ars,
        type : ee.dropfile_type,
        settings : ee.settings,
        event : ee.event_type,
        cost : 0,
        cmd : ee.command,
        clean_cmd : ee.clean_up_command,
        startup_dir : ee.startup_dir,
        textra : 0,
        max_time : 0
      };
      xtrn_cnf.xtrn.some(function (eee, iii) {
        if (eee.code.toLowerCase() == ee.code.toLowerCase()) {
          prog_idx = iii;
          return true;
        }
        return false;
      });
      if (prog_idx > 0) {
        const unchanged = Object.keys(rec).every(function (eee) {
          return rec[eee] == xtrn_cnf.xtrn[prog_idx][eee]
        });
        if (!unchanged) {
          log(LOG_DEBUG, 'COA_CNF: Updating external program ' + rec.code);
          xtrn_cnf.xtrn[prog_idx] = rec;
          change = true;
        }
      } else {
        xtrn_cnf.xtrn.push(rec);
        change = true;
      }
    });
    xtrn_cnf.xtrn.forEach(function (ee, ii) {
      if (ee.sec != sec_idx) return;
      if (codes.indexOf(ee.code.toLowerCase()) > -1) return;
      log(LOG_DEBUG, 'COA_CNF: Removing external program ' + ee.code);
      xtrn_cnf.xtrn.splice(ii, 1);
      change = true;
    });
  });
  if (change) {
    log(LOG_DEBUG, 'COA_CNF: Backing up xtrn.cnf');
    file_backup(system.ctrl_dir + 'xtrn.cnf');
    log(LOG_DEBUG, 'COA_CNF: Writing changes to xtrn.cnf');
    if (!CNF.write(system.ctrl_dir + 'xtrn.cnf', undefined, xtrn_cnf)) {
      throw new Error('COA_CNF: Failed to write xtrn.cnf.');
    }
  }
}

function COA_CNF(coa) {
  Object.defineProperty(this, 'coa', { value : coa });
}

COA_CNF.prototype.read = function (loc) {
  if (['messages', 'xtrn'].indexOf(loc) < 0) {
    throw new Error('COA_CNF: Invalid read location ' + loc);
  }
  const data = this.coa.read('coa_cnf', loc, 1);
  if (loc == 'messages') {
    apply_messages(data);
  } else if (loc == 'xtrn') {
    apply_xtrn(data);
  }
}

COA_CNF.prototype.subscribe = function () {
  const self = this;
  this.coa.set_callback('coa_cnf', function (update) {
    const loc = update.location.split('.');
    if (loc[1] != 'update') return;
    if (['messages', 'xtrn'].indexOf(update.data) < 0) return;
    try {
      self.read(update.data);
    } catch (err) {
      log(LOG_ERR, 'COA_CNF: Update error: ' + err);
    }
  });
  this.coa.subscribe('coa_cnf', 'update');
}
