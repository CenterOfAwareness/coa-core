const coa_lib_messages = {

  load_message_group : function (g) {
    if (!msg_area.grp[g]) return {};
    return {
      name : msg_area.grp[g].name,
      description : msg_area.grp[g].description,
      ars : msg_area.grp[g].ars,
      subs : msg_area.grp[g].sub_list.map(
        function (e) {
          return {
            code : e.code,
            name : e.name,
            description : e.description,
            ars : {
              all : e.ars,
              read : e.read_ars,
              post : e.post_ars,
              operator : e.operator_ars,
              moderated : e.moderated_ars,
            },
            settings : e.settings
          }
        }
      )
    };
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
    return Object.keys(a).every(function (e) {
      if (e != 'subs') {
        return a[e] == b[e];
      } else {
        if (typeof b[e] == 'undefined') return false;
        return compare_message_sub(a[e], b[e]);
      }
    });
  }

};
