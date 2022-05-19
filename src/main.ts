import { Message, Client } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({
    intents: ["GUILDS", "GUILD_MESSAGES"],
});

const Predictation = {
    DAIDAIKICHI: "大大吉",
    DAIKICHI: "大吉",
    CHUKICHI: "中吉",
    SYOKICHI: "小吉",
    KICHI: "吉",
    SUEKICHI: "末吉",
    KYOU: "凶",
    DAIKYOU: "大凶",
    DAIDAIKYOU: "大大凶",
} as const;

export type Predictation = typeof Predictation[keyof typeof Predictation];

const rates: number[] = [
    0.00004,
    0.05 * 3,
    0.1 * 3,
    0.075 * 3,
    0.075 * 3,
    0.05 * 3,
    0.05,
    0.005 * 3,
    0.00004,
];
const sum: number = rates.reduce((acc, x) => acc + x, 0);
const sum_rates: number[] = get_sum_list(rates);

const strs: Predictation[] = [
    "大大吉",
    "大吉",
    "中吉",
    "小吉",
    "吉",
    "末吉",
    "凶",
    "大凶",
    "大大凶",
];

const high_light_map: Map<string, [Predictation, number]> = new Map();
const low_light_map: Map<string, [Predictation, number]> = new Map();

client.once("ready", () => {
    console.log("Ready!!");
    console.log(client.user?.tag);
});

client.on("messageCreate", async (message: Message) => {
    if (message.author.bot) return;
    // message.channel.send("message created");
    if (message.content.startsWith("!ping")) {
        message.channel.send(`ping: ${client.ws.ping} ms`);
    }

    if (message.content == "!status" || message.content == "！ステータス") {
        let highest: [string[], Predictation, number[]] | undefined = undefined;
        let lowest: [string[], Predictation, number[]] | undefined = undefined;
        for (const [user_name, [pred, cnt]] of high_light_map) {
            if (highest == undefined) {
                // init
                highest = [[user_name], pred, [cnt]];
            } else if (pred2num(highest[1]) > pred2num(pred)) {
                // update
                highest = [[user_name], pred, [cnt]];
            } else if (highest[1] == pred) {
                // same
                highest[0].push(user_name);
                highest[2].push(cnt);
            }
        }

        for (const [user_name, [pred, cnt]] of low_light_map) {
            if (lowest == undefined) {
                // init
                lowest = [[user_name], pred, [cnt]];
            } else if (pred2num(lowest[1]) < pred2num(pred)) {
                // update
                lowest = [[user_name], pred, [cnt]];
            } else if (lowest[1] == pred) {
                // same
                lowest[0].push(user_name);
                lowest[2].push(cnt);
            }
        }
        const high = highest as [string[], Predictation, number[]];
        const low = lowest as [string[], Predictation, number[]];

        let high_mess = `現在の最も運がいい人\n${high[0].toString()}\n`;
        high_mess = high_mess + `${high[1]}の回数\n`;
        for (let i = 0; i < high[0].length; i++) {
            high_mess = high_mess + `${high[0][i]} : ${high[2][i]}\n`;
        }

        let low_mess = `現在の最も運が悪い人\n${high[0].toString()}\n`;
        low_mess = low_mess + `${low[1]}の回数\n`;
        for (let i = 0; i < low[0].length; i++) {
            low_mess = low_mess + `${low[0][i]} : ${low[2][i]}\n`;
        }

        message.channel.send(`${high_mess}\n\n${low_mess}`);
    }

    if (
        message.content == "!おみくじ" ||
        message.content == "！おみくじ" ||
        message.content == "!omikuji" ||
        message.content == "!神签"
    ) {
        console.log(high_light_map);
        console.log(low_light_map);

        const r = Math.random() * sum;
        for (let i = 0; i < strs.length; i++) {
            if (r < sum_rates[i]) {
                message.channel.send(strs[i]);

                const sender = message.author.username;
                if (sender === undefined) {
                    break;
                }
                const val = high_light_map.get(sender);
                let max;
                let count_high;
                if (val !== undefined) {
                    max = strs[Math.min(i, pred2num(val[0]))];
                    if (max == val[0]) {
                        count_high = val[1] + 1;
                    } else {
                        count_high = 1;
                    }
                } else {
                    max = strs[i];
                    count_high = 1;
                }
                high_light_map.set(sender, [max, count_high]);

                let min;
                let count_low;
                if (val !== undefined) {
                    min = strs[Math.max(i, pred2num(val[0]))];
                    if (min == val[0]) {
                        count_low = val[1] + 1;
                    } else {
                        count_low = 1;
                    }
                } else {
                    min = strs[i];
                    count_low = 1;
                }
                low_light_map.set(sender, [min, count_low]);

                break;
            }
        }
    }
});

function get_sum_list(list: number[]): number[] {
    const sum_list: number[] = [];
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

function pred2num(pred: Predictation): number {
    switch (pred) {
        case Predictation.DAIDAIKICHI:
            return 0;
        case Predictation.DAIKICHI:
            return 1;
        case Predictation.CHUKICHI:
            return 2;
        case Predictation.SYOKICHI:
            return 3;
        case Predictation.KICHI:
            return 4;
        case Predictation.SUEKICHI:
            return 5;
        case Predictation.KYOU:
            return 6;
        case Predictation.DAIKYOU:
            return 7;
        case Predictation.DAIDAIKYOU:
            return 8;
    }
}

client.login(process.env.TOKEN);
