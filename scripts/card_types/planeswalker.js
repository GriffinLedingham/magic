var Components = require('../components.js');

module.exports =
{
	cast: Components.castToStack,
  canCastCard: function(current_turn_data) {
    return true;
  }
}