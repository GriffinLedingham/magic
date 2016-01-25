module.exports =
{
  manaCost: '{U}',

  cast: function(game, card_uuid){
    game.player_one.discardCastCard(card_uuid, game);
    game.player_one.drawCard();
  },
  getCardChoices: function() {
    return {
      'cost':[
        {option: 0, text: 'Pay U.'},
        {option: 1, text: 'Pay 2 life.'}
      ]
    };
  },
  optionUsesMana: function(option) {
    if(option === 0) return true;
    else return false;
  },
  payAltCost: function(option, game) {
    var result = false;
    if(option === 1)
    {
      game.player_one.subtractHealth(2);
      result = true;
    }
    return result;
  }
}