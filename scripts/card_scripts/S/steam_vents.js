module.exports =
{
  castOption: function(game, card_uuid, option){
    if(option === 1)
    {
      game.player_one.subtractHealth(2);
    }
    else
    {
      game.player_one.forceTapCard(card_uuid, game);
    }
    game.player_one.didPlayLand(game);
  },
  tap: function(game){

  },
  tapOption: function(game, option){
    var color = 'blue';
    var num = 1;
    if(option === 0)
    {
      color = 'red';
    }
    game.player_one.addMana(color, num);
  },
  getCardChoices: function() {
    return {
      'cast':[
        {option: 0, text: 'Tapped'},
        {option: 1, text: 'Untapped'}
      ],
      'tap':[
        {option: 0, text: 'Add R mana.'},
        {option: 1, text: 'Add U mana.'}
      ]
    };
  }
}