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

const num_level = 9;

export type Predictation = typeof Predictation[keyof typeof Predictation];

function* range(start: number, end: number) {
    for (let i = start; i < end; i++) {
        yield i;
    }
}

// TODO: add level automatically
const predLevels = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;
// const predLevels = [...range(0, num_level)] as const;
type predLevel = typeof predLevels[number];


const strs: Predictation[] = [
    "大大吉",
    "大吉",
    "吉",
    "中吉",
    "小吉",
    "末吉",
    "凶",
    "大凶",
    "大大凶",
];

let high_light_map: Map<string, [predLevel, number, number]> = new Map();
let low_light_map: Map<string, [predLevel, number, number]> = new Map();

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

    if (message.content == "!reset") {
        high_light_map = new Map();
        low_light_map = new Map();
    }

    if (message.content == "!status" || message.content == "！ステータス") {
        message.channel.send(get_status_message());
    }

    if (
        message.content.startsWith("!おみくじ") ||
        message.content.startsWith("！おみくじ") ||
        message.content.startsWith("!omikuji") ||
        message.content.startsWith("!神签")
    ) {
        let level: predLevel = predict();
        let pred = toPred(level);

        message.channel.send(pred);

        const sender = message.author.username;
        if (sender === undefined) {
            return;
        }

        update_highest(sender, level);
        update_lowest(sender, level);
        console.log("high:");
        console.log(high_light_map);
        console.log("low: ");
        console.log(low_light_map);

    }
});

function update_highest(sender: string, level: predLevel) {
    const val_high = high_light_map.get(sender);
    let max: predLevel;
    let count_high;
    let try_count;
    if (val_high !== undefined) {
        max = Math.min(level, val_high[0]) as predLevel; // min of predLevel must be predLevel
        if (max == val_high[0] && max == level) { // same
            count_high = val_high[1] + 1;
        } else if (max == val_high[0] && max != level) { // came worse
            count_high = val_high[1];
        } else { // came better
            count_high = 1;
        }
        try_count = val_high[2] + 1;
    } else {
        max = level;
        count_high = 1;
        try_count = 1;
    }
    console.log(`set: ${[toPred(max), count_high, try_count].toString()}`)
    high_light_map.set(sender, [max, count_high, try_count]);
}

function update_lowest(sender: string, level: predLevel) {
    const val_low = low_light_map.get(sender);
    let min: predLevel;
    let count_low;
    let try_count;
    if (val_low !== undefined) {
        min = Math.max(level, val_low[0]) as predLevel; // max of predLevel must be predLevel
        if (min == val_low[0] && min == level) { // same
            count_low = val_low[1] + 1;
        } else if (min == val_low[0] && min != level) { // came better one
            count_low = val_low[1];
        } else { // came worse
            count_low = 1;
        }
        try_count = val_low[2] + 1;
    } else { // sender's first time omikuji
        min = level;
        count_low = 1;
        try_count = 1;
    }
    console.log(`set: ${[toPred(min), count_low, try_count].toString()}`)
    low_light_map.set(sender, [min, count_low, try_count]);
}

function get_status_message(): string {
    let highest: [string[], predLevel, number[], number[]] | undefined = undefined;
    let lowest: [string[], predLevel, number[], number[]] | undefined = undefined;
    for (const [user_name, [level, cnt, try_cnt]] of high_light_map) {
        if (highest == undefined) {
            // init
            highest = [[user_name], level, [cnt], [try_cnt]];
        } else if (highest[1] > level) {
            // update
            highest = [[user_name], level, [cnt], [try_cnt]];
            console.log(`${toPred(highest[1])}, ${toPred(level)}\n`)
            console.log(`${toPred(level)} is better than ${toPred(highest[1])}\n`);
        } else if (highest[1] == level) {
            // same
            highest[0].push(user_name);
            highest[2].push(cnt);
            highest[3].push(try_cnt);
        }
    }

    for (const [user_name, [level, cnt, try_cnt]] of low_light_map) {
        if (lowest == undefined) {
            // init
            lowest = [[user_name], level, [cnt], [try_cnt]];
        } else if (lowest[1] < level) {
            console.log(`${toPred(lowest[1])}, ${toPred(level)}\n`)
            console.log(`${toPred(level)} is worse than ${toPred(lowest[1])}\n`);
            // update
            lowest = [[user_name], level, [cnt], [try_cnt]];
        } else if (lowest[1] == level) {
            // same
            lowest[0].push(user_name);
            lowest[2].push(cnt);
            lowest[3].push(try_cnt)
        }
    }
    const high = highest as [string[], predLevel, number[], number[]];
    const low = lowest as [string[], predLevel, number[], number[]];
    console.log(`high:${high}\n`);
    console.log(`low:${low}\n`);
    if (high === undefined || low === undefined) {
        return "Error occured at function get_status_message";
    }

    let high_mess = `現在の最も運がいい人\n${high[0].toString()}\n`;
    high_mess = high_mess + `${high[1]}の回数\n`;
    for (let i = 0; i < high[0].length; i++) {
        high_mess = high_mess + `${high[0][i]} : ${high[2][i]} / ${high[3][i]} (${Math.round(high[2][i] / high[3][i] * 100)}%)\n`;
    }

    let low_mess = `現在の最も運が悪い人\n${low[0].toString()}\n`;
    low_mess = low_mess + `${low[1]}の回数\n`;
    for (let i = 0; i < low[0].length; i++) {
        low_mess = low_mess + `${low[0][i]} : ${low[2][i]} / ${low[3][i]} (${Math.round(low[2][i] / low[3][i] * 100)}%)\n`;
    }

    return `${high_mess}\n${low_mess}`


}

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

function predict(): predLevel {
    const r = Math.random() * sum;
    for (const lev of predLevels) {
        if (r < sum_rates[lev]) {
            return lev;
        }
    }
    return predLevels[num_level - 1];
}


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
        case Predictation.KICHI:
            return 2;
        case Predictation.CHUKICHI:
            return 3;
        case Predictation.SYOKICHI:
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

function toPred(level: predLevel): Predictation {
    switch (level) {
        case 0:
            return Predictation.DAIDAIKICHI
        case 1:
            return Predictation.DAIKICHI
        case 2:
            return Predictation.KICHI
        case 3:
            return Predictation.CHUKICHI
        case 4:
            return Predictation.SYOKICHI
        case 5:
            return Predictation.SUEKICHI
        case 6:
            return Predictation.KYOU
        case 7:
            return Predictation.DAIKYOU
        case 8:
            return Predictation.DAIDAIKYOU
    }

}

client.login(process.env.TOKEN);
