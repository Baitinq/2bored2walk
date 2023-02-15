import 'dotenv/config';
import mineflayer from 'mineflayer';
import { ChannelType, Client, GatewayIntentBits } from "discord.js";
const mineflayerViewer = require('prismarine-viewer').mineflayer
const antihunger = require('mineflayer-antihunger').plugin
import { pathfinder, Movements, goals } from 'mineflayer-pathfinder';
import { plugin as autoeat } from 'mineflayer-auto-eat';

const hostname: string = "localhost"
const goal: goals.Goal = new goals.GoalNear(0, 60, -2000000, 44)
const updateTimeMinutes: number = 30
const minHealth: number = 0
const swingArmTimeSeconds: number = 3

const discordClient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const discordChannelId: string = process.env.DISCORD_CHANNEL as string
const discordToken: string = process.env.DISCORD_TOKEN as string

//TODO antiafk mineflayer plugin NEED autoeeat
//maybe not need to merge, check if end. to diconnect from proxy make a command or somethin
//todo maybe fix fall damage antihunger

function sendMessageToChannel(message: string) {
  const channel = discordClient?.channels.cache.get(discordChannelId)
  if (channel?.type !== ChannelType.GuildText) return

  console.log(message)
  channel?.send(message)
}

function quit(reason: any) {
  sendMessageToChannel(`${bot.username} disconnected from ${hostname}, reason: ${reason}\n\tCoords: ${bot.entity?.position}\n\tDim: ${bot.game.dimension}\n\tHP: ${bot.health}`)
  bot.quit()
}

discordClient.login(discordToken);

discordClient.once("ready", () => {
  console.log(`discord: Logged in as ${discordClient?.user?.tag}!`);
});

const bot = mineflayer.createBot({
  host: hostname,
  port: 25565,
  username: process.env.MINECRAFT_EMAIL as string,
  version: "1.12.2",
  auth: 'microsoft'
})

bot.loadPlugin(pathfinder)
bot.loadPlugin(autoeat)
bot.loadPlugin(antihunger)

bot.once('spawn', () => {
  mineflayerViewer(bot, { firstPerson: true, port: 3000 });
  const defaultMove = new Movements(bot);
  defaultMove.allowParkour = false;
  defaultMove.maxDropDown = 3;

  (bot as any).autoEat.options.priority = 'saturation';
  (bot as any).autoEat.options.startAt = 16;

  (bot as any).pathfinder.setMovements(defaultMove);
  (bot as any).pathfinder.setGoal(goal);

  setTimeout(() => {
    sendMessageToChannel(`Joined ${hostname} with ${bot.username}\n\tCoords: ${bot.entity?.position}\n\tDim: ${bot.game.dimension}\n\tHP: ${bot.health}`)
  }, 2000);
})

bot.on('entityMoved', (entity: any) => {
  if (entity.player === null || entity.username === undefined) return
  if (entity.username === bot.username) return
  if (eval(process.env.MINECRAFT_ALTS as string).includes(entity.username)) return

  quit(`player (${entity.username}) moved nearby`)
})

bot.on('health', () => {
  if (bot.health < minHealth)
    quit(`low hp: ${bot.health}`)
})

setInterval(() => {
  if (bot._client.state !== "play") return

  sendMessageToChannel(`Currently on ${hostname} with ${bot.username}\n\tCoords: ${bot.entity?.position}\n\tDim: ${bot.game.dimension}\n\tHP: ${bot.health}`)
}, updateTimeMinutes * 60 * 1000);

setInterval(() => {
  if (bot._client.state !== "play") return
  bot.swingArm(undefined)
  //bot.chat("Saturation: " + bot.foodSaturation + " Food: " + bot.food)
}, swingArmTimeSeconds * 1000);

bot.on('death', () => {
  setTimeout(() => {
    quit("died")
  }, 3000);
})

bot.on('kicked', (message: any) => {
  sendMessageToChannel(`Got kicked (message: ${message}) from on ${hostname} with ${bot.username}\n\tCoords: ${bot.entity?.position}\n\tDim: ${bot.game.dimension}\n\tHP: ${bot.health}`)
})

bot.on('error', (message: any) => {
  sendMessageToChannel(`Got an error (error: ${message}) from on ${hostname} with ${bot.username}\n\tCoords: ${bot.entity?.position}\n\tDim: ${bot.game.dimension}\n\tHP: ${bot.health}`)
})