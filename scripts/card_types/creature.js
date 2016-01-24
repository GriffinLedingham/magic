var Components = require('../components.js');

module.exports =
{
	cast: Components.castToStack,
  tap: function(){},
  canCastCard: function(current_turn_data) {
    return true;
  },
  doesGetSick: function() {
    return true;
  }
}