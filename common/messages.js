const coa_lib_messages = {

  /**
   * Load relevant data about a sub board
   * @param {(object|string)} s A msg_area.sub element, or an internal code
   * @returns {object} { code, name, description, ars{...}, settings }
   */
  load_message_sub : function (s) {
    if (typeof s == 'string') s = msg_area.sub[s];
    return {
      code : s.code,
      name : s.name,
      description : s.description,
      ars : {
        all : s.ars,
        read : s.read_ars,
        post : s.post_ars,
        operator : s.operator_ars,
        moderated : s.moderated_ars
      },
      settings : s.settings
    }
  },

  /**
   * Load relevant data about a message group, with 'subs' property being an
   * array of results from load_message_sub (above).
   * @param {string} g The internal code of a message group
   * @returns {object} { name, description, ars, subs[...] }
   */
  load_message_group : function (g) {
    if (!msg_area.grp[g]) return {};
    return {
      name : msg_area.grp[g].name,
      description : msg_area.grp[g].description,
      ars : msg_area.grp[g].ars,
      subs : msg_area.grp[g].sub_list.map(this.load_message_sub(e));
  },

  /**
   * Load relevant data about a list of message groups.
   * @param {string[]} g An array of message group internal codes
   * @returns {object[]} An array of results from load_message_group (above).
   */
  load_message_groups : function (g) {
    const self = this;
    return g.reduce(function (a, c) {
      if (!msg_area.grp[c]) return a;
      a[c] = self.load_message_group(c);
      return a;
    }, {});
  },

  compare_message_sub : function (a, b) {
    return Object.keys(a).every(function (e) {
      if (e != 'ars') {
        return a[e] == b[e];
      } else {
        if (typeof b[e] == 'undefined') return false;
        return Object.keys(a[e]).every(function (ee) {
          return a[e][ee] == b[e][ee];
        });
      }
    });
  },

  compare_message_group : function (a, b) {
    const self = this;
    return Object.keys(a).every(function (e) {
      if (e != 'subs') {
        return a[e] == b[e];
      } else {
        if (typeof b[e] == 'undefined') return false;
        return self.compare_message_sub(a[e], b[e]);
      }
    });
  }

};
