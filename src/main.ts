import { assert } from "console";
import { Message, Client } from "discord.js";
import dotenv from "dotenv";

dotenv.config();


const client = new Client({
    intents: ["GUILDS", "GUILD_MESSAGES"],
});

const rates: number[] = [0.00004, 0.05 * 3, 0.1 * 3, 0.075 * 3, 0.075 * 3, 0.05 * 3, 0.05, 0.005 * 3, 0.00004];
const sum: number = rates.reduce((acc, x) => acc + x, 0);
const sum_rates: number[] = get_sum_list(rates);

const strs = ["大大吉", "大吉", "中吉", "小吉", "吉", "末吉", "凶", "大凶", "大大凶"]

client.once("ready", () => {
    console.log("Ready!!");
    console.log(client.user?.tag);
    console.log(rates);
    console.log(sum_rates);
    console.log(strs);
});

client.on("messageCreate", async (message: Message) => {
    if (message.author.bot) return;
    // message.channel.send("message created");
    if (message.content.startsWith("!ping")) {
        message.channel.send(`ping: ${client.ws.ping} ms`);
    }
    if (message.content == "!おみくじ" || message.content == "！おみくじ" || message.content == "!omikuji" || message.content == "!神签") {
        const r = Math.random() * sum;
        console.log(r);
        for (let i = 0; i < strs.length; i++) {
            if (r < sum_rates[i]) {
                message.channel.send(strs[i]);
                break;
            }
        }
    }
});

function get_sum_list(list: number[]): number[] {
    let sum_list: number[] = [];
    for (const num of list) {
        const len = sum_list.length;
        if (len == 0) {
            sum_list.push(num);
        } else {
            sum_list.push(num + sum_list[len - 1]);
        }

    }

    return sum_list;
}

client.login(process.env.TOKEN);
