load('sbbsdefs.js');
require('cnflib.js', 'CNF');
require(system.mods_dir + '/coa/common/validate.js', 'coa_validate');

function apply_messages(data) {
  if (typeof data != 'object') return;
  const msgs_cnf = CNF.read(system.ctrl_dir + 'msgs.cnf');
  if (!msgs_cnf) throw new Error('COA_CNF: Unable to open msgs.cnf');
  var change = false;
  var ptr_idx = msgs_cnf.sub.reduce(function (a, c) {
    if (c.ptridx > a) return c.ptridx;
  }, 0);
  Object.keys(data).forEach(function (e) {
    if (!coa_validate.cnf_message_group(data[e])) {
      log(LOG_ERR, 'COA_CNF: Invalid message group ' + JSON.stringify(data[e]));
      return;
    }
    var grp_idx = -1;
    msgs_cnf.grp.some(function (ee, ii) {
      if (ee.code.toLowerCase() != e.toLowerCase()) return false;
      grp_idx = ii;
      return true;
    });
    if (grp_idx < 0) {
      msgs_cnf.grp.push({
        description : data[e].description,
        name : data[e].name,
        ars : data[e].ars,
        code_prefix : ''
      });
      change = true;
      grp_idx = msgs_cnf.grp.length - 1;
    }
    const codes = [];
    data[e].subs.forEach(function (ee) {
      codes.push(ee.code.toLowerCase());
      var sub_idx = -1;
      const rec = {
        grp_number : grp_idx,
        description : ee.description,
        name : ee.name,
        qwk_name : ee.code,
        code_suffix : ee.code,
        data_dir : '',
        ars : ee.ars.all,
        read_ars : ee.ars.read,
        post_ars : ee.ars.post,
        operator_ars : ee.ars.operator,
        moderated_ars : ee.ars.moderated,
        settings : ee.settings,
        qwknet_tagline : '',
        fidonet_origin : '',
        post_sem : '',
        newsgroup : ee.code,
        faddr : {
          faddr1 : 0,
          faddr2 : 0,
          faddr3 : 0,
          faddr4 : 0
        },
        max_msgs : 10000,
        max_crcs : 10000,
        max_age : 0,
        ptridx : 0
      };
      msgs_cnf.sub.some(function (eee, iii) {
        if (eee.code.toLowerCase() != ee.code.toLowerCase()) return false;
        sub_idx = iii;
        return true;
      });
      if (sub_idx >= 0) { // Sub already exists locally
        const keys = [
          'description',
          'name',
          'ars',
          'read_ars',
          'post_ars',
          'operator_ars',
          'moderated_ars'
        ];
        const unchanged = keys.every(function (eee) {
          return rec[eee] == msgs_cnf.sub[sub_idx][eee];
        });
        if (!unchanged) {
          log(LOG_INFO, 'COA_CNF: Updating message sub ' + rec.code);
          keys.forEach(function (eee) {
            msgs_cnf.sub[sub_idx][eee] = rec[eee];
          });
          change = true;
        }
      } else { // Sub must be added to local database
        rec.ptridx = ptr_idx;
        ptr_idx++;
        log(LOG_INFO, 'COA_CNF: Adding message sub ' + rec.code);
        msgs_cnf.sub.push(rec);
        change = true;
      }
    });
    msgs_cnf.sub.forEach(function (ee, ii) {
      if (ee.grp_number != grp_idx) return;
      if (codes.indexOf(ee.code.toLowerCase()) > -1) return;
      log(LOG_INFO, 'COA_CNF: Removing message sub ' + ee.code);
      msgs_cnf.sub.splice(ii, 1);
      change = true;
    });
  });
  if (change) {
    log(LOG_DEBUG, 'COA_CNF: Backing up msgs.cnf');
    file_backup(system.ctrl_dir + 'msgs.cnf');
    log(LOG_DEBUG, 'COA_CNF: Writing changes to msgs.cnf');
    if (!CNF.write(system.ctrl_dir + 'msgs.cnf', undefined, msgs_cnf)) {
      throw new Error('COA_CNF: Failed to write msgs.cnf');
    }
  }
}

function apply_xtrn(data) {
  if (typeof data != 'object') return;
  const xtrn_cnf = CNF.read(system.ctrl_dir + 'xtrn.cnf');
  if (!xtrn_cnf) throw new Error('COA_CNF: Unable to open xtrn.cnf');
  var change = false;
  Object.keys(data).forEach(function (e) {
    if (!coa_validate.cnf_xtrn_section(data[e])) {
      log(LOG_ERR, 'COA_CNF: Invalid xtrn section ' + JSON.stringify(data[e]));
      return;
    }
    var sec_idx = -1;
    xtrn_cnf.xtrnsec.some(function (ee, ii) {
      if (ee.code.toLowerCase() != e.toLowerCase()) return false;
      sec_idx = ii;
      return true;
    });
    if (sec_idx < 0) {
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
        if (eee.code.toLowerCase() != ee.code.toLowerCase()) return false;
        prog_idx = iii;
        return true;
      });
      if (prog_idx >= 0) { // Program already exists locally
        const unchanged = Object.keys(rec).every(function (eee) {
          return rec[eee] == xtrn_cnf.xtrn[prog_idx][eee]
        });
        if (!unchanged) {
          log(LOG_INFO, 'COA_CNF: Updating external program ' + rec.code);
          xtrn_cnf.xtrn[prog_idx] = rec;
          change = true;
        }
      } else {
        log(LOG_INFO, 'COA_CNF: Adding external program ' + rec.code);
        xtrn_cnf.xtrn.push(rec);
        change = true;
      }
    });
    xtrn_cnf.xtrn.forEach(function (ee, ii) {
      if (ee.sec != sec_idx) return;
      if (codes.indexOf(ee.code.toLowerCase()) > -1) return;
      log(LOG_INFO, 'COA_CNF: Removing external program ' + ee.code);
      xtrn_cnf.xtrn.splice(ii, 1);
      change = true;
    });
  });
  if (change) {
    log(LOG_DEBUG, 'COA_CNF: Backing up xtrn.cnf');
    file_backup(system.ctrl_dir + 'xtrn.cnf');
    log(LOG_DEBUG, 'COA_CNF: Writing changes to xtrn.cnf');
    if (!CNF.write(system.ctrl_dir + 'xtrn.cnf', undefined, xtrn_cnf)) {
      throw new Error('COA_CNF: Failed to write xtrn.cnf');
    }
  }
}

/**
 * An interface to the COA CNF database which holds message group & external
 * program area configuration data.  This is only intended to be used by the
 * coa-core client.
 * @constructor
 * @param {COA} coa - An instance of the COA object (client/lib/coa.js)
 */
function COA_CNF(coa) {
  Object.defineProperty(this, 'coa', { value : coa });
}

/**
 * Synchronize local message base or xtrn area config with remote
 * @param {string} loc 'messages' or 'xtrn'
 * @returns {undefined}
 */
COA_CNF.prototype.sync = function (loc) {
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

/**
 * Subscribe for updates & automatic synchronization
 * This should really only be used within the coa-core client
 * @returns {undefined}
 */
COA_CNF.prototype.subscribe = function () {
  const self = this;
  this.coa.set_callback('coa_cnf', function (update) {
    const loc = update.location.split('.');
    if (loc[1] != 'update') return;
    if (['messages', 'xtrn'].indexOf(update.data) < 0) return;
    try {
      self.sync(update.data);
    } catch (err) {
      log(LOG_ERR, 'COA_CNF: Update error: ' + err);
    }
  });
  this.coa.subscribe('coa_cnf', 'update');
}
