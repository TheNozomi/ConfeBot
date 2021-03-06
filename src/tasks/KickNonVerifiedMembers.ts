import { AkairoClient } from 'discord-akairo';
import { Guild, Role, TextChannel } from 'discord.js';
import { env } from '../environment';

const KickNonVerifiedMembers = (client: AkairoClient): void => {
  client.logger.info('Running scheduled task: KickNonVerifiedMembers');
  const guild = client.guilds.resolve(env.GUILD_ID) as Guild,
    newUserRole = guild.roles.resolve(env.NEWUSER_ROLE) as Role,
    logsChannel = guild.channels.resolve(env.LOGS_CHANNEL) as TextChannel;

  newUserRole.members.each((member) => {
    if (member.roles.cache.has(env.USER_ROLE)) {
      /*
      * if member has already verified but still has the newUserRole, remove newUserRole from them.
      * this normally shouldn't happen, but... ¯\_(ツ)_/¯
      */
      return member.roles.remove(newUserRole).catch(client.logException);
    }
    if (!member.joinedTimestamp) return;
    const timestampDifference = new Date().getTime() - member.joinedTimestamp,
      differenceDays = timestampDifference / (1000 * 3600 * 24);
    if (differenceDays >= 2) {
      member.send(`¡Hola! Esto es una notificación para informarte que se te ha expulsado automáticamente de la **Confederación de Fandom Hispano** porque no has completado a tiempo el formulario. No te preocupes, puedes volver a unirte cuando desees mediante este enlace: <${env.GUILD_INVITE}>, o desde <https://confederacion-hispana.fandom.com/es/>. ¡Te esperamos!`)
        .catch(client.logException)
        .finally(() => {
          member.kick('Expulsión automática pasadas 48 horas sin llenar el formulario').then(() => {
            client.logger.info(`Kicked ${member.user.username}#${member.user.discriminator}`, { task: 'KickNonVerifiedMembers' });
            logsChannel.send(`Se expulsó a <@!${member.user.id}> (${member.user.username}#${member.user.discriminator}) al cumplirse 48 horas sin llenar el formulario.`).catch(client.logException);
          }).catch((err) => {
            logsChannel.send(`Error al expulsar a <@!${member.user.id}>: ${err.message} (${err.name})`).catch(client.logException);
            client.logException(err);
          });
        });
    }
  });
};

export default KickNonVerifiedMembers;
