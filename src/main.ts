import { conf } from '../config.js';
import { Scenes, Telegraf } from 'telegraf';
import db, { Ad, User } from './helpers/database.js';
import { pause } from './helpers/utils.js';
import logger from './helpers/logger.js';
import { Logger } from 'log4js';

const bot = new Telegraf<Scenes.SceneContext>(conf.botToken);

(async (): Promise<void> => {
  const _logger: Logger = logger.get('Main');
  await pause(1000);

  let users = await db.getUsers();
  let usersIds = users ? Object.keys(users) : [];

  bot.on('text', async (ctx) => {
    const { from } = ctx.update.message;
    _logger.info('Мне написал пользователь ' + from.id);
    await db.setUserListner(from as User);
    ctx.reply('Я добавил тебя в рассылку');
    _logger.info(`Добавил пользователь ${from.id} ${from.username} в рассылку`);
    users = await db.getUsers();
    usersIds = users ? Object.keys(users) : [];
    _logger.info('Обновил список юзеров для рассылки');
  });

  function notifyUser(data: Ad): void {
    _logger.info('Произошло обновление списка объявлений');
    const text = `Появился новый товар ${data.title} "\n"  c ценой ${data.price} "\n"
Ссылка на объявление https://www.olx.pl${data.url}`;

    for (const id of usersIds) {
      bot.telegram.sendMessage(id, text);

      _logger.info('Выслал оповещение пользователю' + id);
    }
  }

  db.updateAds(notifyUser);

  bot.launch();
})();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
