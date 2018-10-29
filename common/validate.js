load('sbbsdefs.js');
load('nodedefs.js');

const coa_validate = {

  alias : function (v) {
    return typeof v == 'string' && v.length > 0 && v.length <= LEN_ALIAS;
  },

  alias_exists : function (v) {
    if (!this.alias(v)) return false;
    return (system.matchuser(v) > 0); // Could also check that user isn't deleted/disabled
  },

  node_number : function (v) {
    const _v = parseInt(v); // May be an object's key
    return typeof !isNaN(_v) && _v >= 0 && _v <= 255;
  },

  node_status : function (v) {
    return typeof v == 'number' && v >= NODE_WFC && v <= NODE_LAST_STATUS;
  },

  node_action : function (v) {
    return typeof v == 'number' && v >= NODE_MAIN && v <= NODE_LAST_ACTION;
  },

  node_status_custom : function (v) {
    return typeof v == 'string' && v.length <= 50
  },

  presence_node_update : function (v) {
    return (
      typeof v == 'object'
      && this.node_status(v.s)
      && this.node_action(v.a)
      && this.alias(v.u)
      && (typeof v.c == 'undefined' || this.node_status_custom(v.c))
      && Object.keys(v).every(function (e) {
        return ['s','a','u','c'].indexOf(e) > -1;
      })
    );
  },

  announce_message_text : function (v) {
    return (
      v.length > 0
      && v.length <= 160
      && strip_ctrl(v).length <= 80
    );
  },

  announce_global_message : function (v) {
    return (
      typeof v == 'object'
      && typeof v.from_system == 'string' && this.alias_exists(v.from_system)
      && typeof v.from_user == 'string' && this.alias(v.from_user)
      && this.announce_message_text(v.text)
      && Object.keys(v).every(function (e) {
        return ['from_system', 'from_user', 'text'].indexOf(e) > -1;
      })
    );
  },

  announce_user_message : function (v) {
    return (
      typeof v == 'object'
      && typeof v.from_system == 'string' && this.alias_exists(v.from_system)
      && typeof v.from_user == 'string' && this.alias(v.from_user)
      && typeof v.to_user == 'string' && this.alias(v.to_user)
      && this.announce_message_text(v.text)
      && Object.keys(v).every(function (e) {
        return ['from_system', 'from_user', 'to_user', 'text'].indexOf(e) > -1;
      })
    );
  },

  cnf_message_sub : function (v) {
    return (
      typeof v == 'object'
      && typeof v.code == 'string' // && length? 8? 16 w/prefix?
      && typeof v.name == 'string' // && length?
      && typeof v.descritpion == 'string' // && length?
      && typeof v.settings == 'number'
      && v.settings >= 0
      && v.settings <= 2147483647
      && typeof v.ars == 'object'
      && typeof v.ars.all == 'string'
      && typeof v.ars.read == 'string'
      && typeof v.ars.post == 'string'
      && typeof v.ars.operator == 'string'
      && typeof v.ars.moderated == 'string'
    );
  },

  cnf_message_group : function (v) {
    return (
      typeof v == 'object',
      && typeof v.name == 'string' // && length?
      && typeof v.description == 'string' // && length?
      && typeof v.ars == 'string'
      && Array.isArray(v.subs)
      && v.subs.every(this.cnf_message_sub)
    );
  },

  cnf_xtrn_program : function (v) {
    return (
      typeof v == 'object'
      && typeof v.code == 'string' // && length? 8? 16 w/prefix?
      && typeof v.name == 'string' // && length?
      && typeof v.command == 'string'
      && typeof v.clean_up_command == 'string'
      && typeof v.startup_dir == 'string'
      && typeof v.ars == 'string'
      && typeof v.execution_ars == 'string'
      && typeof v.settings == 'number'
      && v.settings >= 0
      && v.settings <= 16777215
      && typeof v.dropfile_type == 'number'
      && v.dropfile_type > -1
      && v.dropfile_type < 12
      && typeof v.event_type == 'number'
      && v.event_type >= 0
      && v.event_type <= 255 // Probably more like 8
    );
  },

  cnf_xtrn_section : function (v) {
    return (
      typeof v == 'object'
      && typeof v.name == 'string' // && length?
      && typeof v.code == 'string' // && length? 8? 16 w/prefix?
      && typeof v.ars == 'string'
      && Array.isArray(v.programs)
      && v.programs.every(this.cnf_xtrn_program)
    );
  }

};
