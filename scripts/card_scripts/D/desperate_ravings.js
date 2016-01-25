module.exports =
{
  cast: function(game, card_uuid){
    game.player_one.discardCastCard(card_uuid, game);
    game.player_one.drawCards(2);
    game.player_one.discardRandomCard(game);
  }
}