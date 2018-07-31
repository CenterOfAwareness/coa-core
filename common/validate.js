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
  }

};
