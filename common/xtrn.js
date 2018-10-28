const coa_lib_xtrn = {

  /**
   * Load relevant data about an external program
   * @param {(object|string)} p An xtrn_area.prog element, or an internal code
   * @returns {object} { code, name, command, clean_up_command, startup_dir, ars, execution_ars, settings, dropfile_type, event_type }
   */
  load_xtrn_program : function (p) {
    if (typeof p == 'string') p = xtrn_area.prog(p);
    return {
      code : p.code,
      name : p.name,
      command : p.cmd,
      clean_up_command : p.clean_cmd, // We'll probably never use this
      startup_dir : p.startup_dir,
      ars : p.ars,
      execution_ars : p.execution_ars,
      settings : p.settings,
      dropfile_type : p.type, // We'll probably never use this
      event_type : p.event
    }
  },

  /**
   * Load relevant data about an external programs section, with 'programs'
   * being an array of results from load_xtrn_program (above).
   * @param {string} s The internal code of an external programs section
   * @returns {object} { name, code, ars, programs[] }
   */
  load_xtrn_section : function (s) {
    if (!xtrn_area.sec[s]) return {};
    return {
      name : xtrn_area.sec[s].name,
      code : xtrn_area.sec[s].code,
      ars : xtrn_area.sec[s].ars,
      programs : xtrn_area.sec[s].prog_list.map(this.load_xtrn_program)
    };
  },

  /**
   * Load relevant data about a list of external program sections
   * @param {string[]} s An array of external program section internal codes
   * @returns {object[]} An array of results from load_xtrn_section (above)
   */
  load_xtrn_sections : function (s) {
    const self = this;
    return s.reduce(function (a, c) {
      if (!xtrn_area.sec[c]) return a;
      a[c] = self.load_xtrn_section(c);
      return a;
    }, {});
  }


};
