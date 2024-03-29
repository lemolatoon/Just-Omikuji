import { Message, Client, GatewayIntentBits, Partials } from "discord.js";
import { createConnection } from "mysql2";
import dotenv from "dotenv";
import util from "util";

console.log("main.ts loaded...");

dotenv.config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const connection = createConnection({
    host: process.env.DB_HOSTNAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
})

connection.connect((err) => {
    if (err) {
        console.log("DB CONNECTION FAILED");
        console.log(err);
    } else {
        console.log("DB CONNECTED");
    }
})


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

// TODO: add level automatically
const predLevels = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;
// const predLevels = [...range(0, num_level)] as const;
type predLevel = typeof predLevels[number];

let high_light_map: Map<string, [predLevel, number, number]> = new Map();
let low_light_map: Map<string, [predLevel, number, number]> = new Map();

client.once("ready", () => {
    console.log("Ready!!");
    console.log(client.user?.tag);
});

client.on("messageCreate", async (message: Message) => {
    if (message.author.bot) return;
    if (message.content.startsWith("!ping")) {
        message.channel.send(`ping: ${client.ws.ping} ms`);
    }

    if (message.content == "!reconnect") {
      connection.connect((err) => {
          if (err) {
              console.log("DB CONNECTION FAILED");
              console.log(err);
          } else {
              console.log("DB CONNECTED");
          }
      })
    }

    if (message.content == "!reset") {
        high_light_map = new Map();
        low_light_map = new Map();
    }

    if (message.content.startsWith("!query")) {
        const splitted = message.content.split(" ");
        let query = "";
        for (let i = 1; i < splitted.length; i++) {
            query = query + " " + splitted[i];
        }
        connection.query(query, (err, results, fields) => {
            if (results === undefined) {
                message.channel.send("不正なqueryです。");
                console.log(err);
            } else {
                console.log("query: %s", query);
                console.log(results);
                message.channel.send(util.format(results));
            }
        });
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
        let iter = 1;
        if (message.content.split(" ").length == 2) {
            const num = Number(message.content.split(" ")[1]);
            if (!Number.isNaN(num) && num <= 2000) {
                iter = num;
            }
            console.log(num);
            console.log(iter);
        }
        for (let i = 0; i <= iter / 500; i++) {
            if (i == iter / 500) {
                if (iter % 500 == 0) {
                    break;
                }
                predict_process(iter % 500, message);
            } else {
                predict_process(Math.min(iter, 500), message);
            }
            // await setTimeout(() => { }, 100);
        }
        console.log(iter);
        console.log(iter % 500);
    }
});

function predict_process(iter: number, message: Message<boolean>) {
    if (iter >= 501 || iter <= 0) {
        iter = 1;
    }
    const levels: predLevel[] = [];
    for (let i = 0; i < iter; i++) {
        const level: predLevel = predict();
        levels.push(level);
    }

    let predicted_msg = "";
    for (let i = 0; i < iter; i++) {
        if (i != 0 && i != iter) {
            predicted_msg = predicted_msg + ", ";
        }
        predicted_msg = predicted_msg + toPred(levels[i]);
        const sender = message.author.username;
        if (sender === undefined) {
            return;
        }

        update_highest(sender, levels[i]);
        update_lowest(sender, levels[i]);
    }
    message.channel.send(predicted_msg);
    console.log("high:");
    console.log(high_light_map);
    console.log("low: ");
    console.log(low_light_map);
}

function update_highest(sender: string, level: predLevel) {
    const val_high = high_light_map.get(sender);
    let max: predLevel;
    let count_high;
    let try_count;
    if (val_high !== undefined) {
        max = Math.min(level, val_high[0]) as predLevel; // min of predLevel must be predLevel
        if (max == val_high[0] && max == level) {
            // same
            count_high = val_high[1] + 1;
        } else if (max == val_high[0] && max != level) {
            // came worse
            count_high = val_high[1];
        } else {
            // came better
            count_high = 1;
        }
        try_count = val_high[2] + 1;
    } else {
        max = level;
        count_high = 1;
        try_count = 1;
    }
    console.log(`set: ${[toPred(max), count_high, try_count].toString()}`);
    high_light_map.set(sender, [max, count_high, try_count]);
}

function update_lowest(sender: string, level: predLevel) {
    const val_low = low_light_map.get(sender);
    let min: predLevel;
    let count_low;
    let try_count;
    if (val_low !== undefined) {
        min = Math.max(level, val_low[0]) as predLevel; // max of predLevel must be predLevel
        if (min == val_low[0] && min == level) {
            // same
            count_low = val_low[1] + 1;
        } else if (min == val_low[0] && min != level) {
            // came better one
            count_low = val_low[1];
        } else {
            // came worse
            count_low = 1;
        }
        try_count = val_low[2] + 1;
    } else {
        // sender's first time omikuji
        min = level;
        count_low = 1;
        try_count = 1;
    }
    console.log(`set: ${[toPred(min), count_low, try_count].toString()}`);
    low_light_map.set(sender, [min, count_low, try_count]);
}

function get_status_message(): string {
    let highest: [string[], predLevel, number[], number[]] | undefined =
        undefined;
    let lowest: [string[], predLevel, number[], number[]] | undefined =
        undefined;
    for (const [user_name, [level, cnt, try_cnt]] of high_light_map) {
        if (highest == undefined) {
            // init
            highest = [[user_name], level, [cnt], [try_cnt]];
        } else if (highest[1] > level) {
            // update
            highest = [[user_name], level, [cnt], [try_cnt]];
            console.log(`${toPred(highest[1])}, ${toPred(level)}\n`);
            console.log(
                `${toPred(level)} is better than ${toPred(highest[1])}\n`
            );
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
            console.log(`${toPred(lowest[1])}, ${toPred(level)}\n`);
            console.log(
                `${toPred(level)} is worse than ${toPred(lowest[1])}\n`
            );
            // update
            lowest = [[user_name], level, [cnt], [try_cnt]];
        } else if (lowest[1] == level) {
            // same
            lowest[0].push(user_name);
            lowest[2].push(cnt);
            lowest[3].push(try_cnt);
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
    high_mess = high_mess + `${toPred(high[1])}の回数\n`;
    for (let i = 0; i < high[0].length; i++) {
        high_mess =
            high_mess +
            `${high[0][i]} : ${high[2][i]} / ${high[3][i]} (${(
                (high[2][i] / high[3][i]) *
                100
            ).toFixed(4)}%)\n`;
    }

    let low_mess = `現在の最も運が悪い人\n${low[0].toString()}\n`;
    low_mess = low_mess + `${toPred(low[1])}の回数\n`;
    for (let i = 0; i < low[0].length; i++) {
        low_mess =
            low_mess +
            `${low[0][i]} : ${low[2][i]} / ${low[3][i]} (${(
                (low[2][i] / low[3][i]) *
                100
            ).toFixed(4)}%)\n`;
    }

    return `${high_mess}\n${low_mess}`;
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

function toPred(level: predLevel): Predictation {
    switch (level) {
        case 0:
            return Predictation.DAIDAIKICHI;
        case 1:
            return Predictation.DAIKICHI;
        case 2:
            return Predictation.KICHI;
        case 3:
            return Predictation.CHUKICHI;
        case 4:
            return Predictation.SYOKICHI;
        case 5:
            return Predictation.SUEKICHI;
        case 6:
            return Predictation.KYOU;
        case 7:
            return Predictation.DAIKYOU;
        case 8:
            return Predictation.DAIDAIKYOU;
    }
}

client.login(process.env.TOKEN);
