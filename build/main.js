"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const client = new discord_js_1.Client({
    intents: ["GUILDS", "GUILD_MESSAGES"],
});
const rates = [0.00004, 0.05 * 3, 0.1 * 3, 0.075 * 3, 0.075 * 3, 0.05 * 3, 0.05, 0.005 * 3, 0.00004];
const sum = rates.reduce((acc, x) => acc + x, 0);
const sum_rates = get_sum_list(rates);
const strs = ["大大吉", "大吉", "中吉", "小吉", "吉", "末吉", "凶", "大凶", "大大凶"];
client.once("ready", () => {
    var _a;
    console.log("Ready!!");
    console.log((_a = client.user) === null || _a === void 0 ? void 0 : _a.tag);
    console.log(rates);
    console.log(sum_rates);
});
client.on("messageCreate", (message) => __awaiter(void 0, void 0, void 0, function* () {
    if (message.author.bot)
        return;
    // message.channel.send("message created");
    if (message.content.startsWith("!ping")) {
        message.channel.send(`ping: ${client.ws.ping} ms`);
    }
    if (message.content == "!おみくじ" || message.content == "！おみくじ" || message.content == "!omikuji" || message.content == "!神签") {
        const r = Math.random() * sum;
        console.log(r);
        let i = 0;
        if (r < rates[i++]) {
            message.channel.send("大大吉");
        }
    }
}));
function get_sum_list(list) {
    let sum_list = [];
    for (const num of list) {
        const len = sum_list.length;
        if (len == 0) {
            list.push(num);
        }
        else {
            list.push(num + list[len - 1]);
        }
    }
    return sum_list;
}
client.login(process.env.TOKEN);
