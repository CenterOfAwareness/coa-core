load('sbbsdefs.js');
load('nodedefs.js');

const coa_validate = {

  alias : function (v) {
    return typeof v == 'string' && v.length > 0 && v.length <= LEN_ALIAS;
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
  }

};
