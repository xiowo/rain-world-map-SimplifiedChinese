// 消除控制台打印
var HoldLog = console.log;
console.log = function () { };

let now1 = new Date();

queueMicrotask(async () => {
    // 定义一个函数来获取版本号
    async function getVersion() {
        try {
            const response = await fetch('/version.json');
            const data = await response.json();
            return data.cacheVersion; // 假设 JSON 文件中的字段是 cacheVersion
        } catch (error) {
            console.error("Failed to fetch version:", error);
            return "未知版本";
        }
    }

    // 获取版本号
    const version = await getVersion();

    const Log = function () {
        HoldLog.apply(console, arguments);
    }; //在恢复前输出日志

    const grt = new Date("2023/08/22"); //创建时间
    now1.setTime(now1.getTime() + 250);
    const days = (now1 - grt) / 1000 / 60 / 60 / 24;
    const dnum = Math.floor(days);
    const ascll = [
        `欢迎访问雨世界地图!`,
        `「众生不度，轮回不止」`,
        `
    
  ███████╗   ██╗     ██╗  ██╗     ██╗
  ██╔═══██╗  ██║     ██║  ████╗ ████║
  ██████╔═╝  ██║ ██╗ ██║  ██╔═██╔╝██║
  ██╔═══██╗  ██║ ██║ ██║  ██║ ╚═╝ ██║
  ██║   ██║    ██╔═██╔═╝  ██║     ██║
  ╚═╝   ╚═╝    ╚═╝ ╚═╝    ╚═╝     ╚═╝

        `,
        "已上线",
        dnum,
        "天",
        `©2024 By R-W-M-SC | 地图版本: ${version}` // 插入版本号
    ];
    const ascll2 = [`NCC2-036`, `业力等级识别成功，允许访问.`, `您的业力: `, `⨂`];

    setTimeout(
        Log.bind(
            console,
            `\n%c${ascll[0]} %c ${ascll[1]} %c ${ascll[2]} %c${ascll[3]}%c ${ascll[4]}%c ${ascll[5]}\n\n%c ${ascll[6]}\n`,
            "color:#39c5bb",
            "",
            "color:#39c5bb",
            "color:#39c5bb",
            "",
            "color:#39c5bb",
            ""
        )
    );
    setTimeout(
        Log.bind(
            console,
            `%c ${ascll2[0]} %c ${ascll2[1]} %c \n${ascll2[2]} %c\n${ascll2[3]}\n`,
            "color:white; background-color:#4fd953",
            "",
            "",
            'background:url("/embed.jpg") no-repeat;font-size:450%'
        )
    );

    setTimeout(Log.bind(console, "%c WELCOME %c 您好，管理员.", "color:white; background-color:#4f90d9", ""));

    setTimeout(
        console.warn.bind(
            console,
            "%c ⚡ Powered by R-W-M %c 你正在访问雨世界地图",
            "color:white; background-color:#f0ad4e",
            ""
        )
    );

    setTimeout(Log.bind(console, "%c W23-12 %c 你已打开控制台.", "color:white; background-color:#4f90d9", ""));

    setTimeout(
        console.warn.bind(console, "%c SS_AI-782 %c 你现在正处于五块卵石的监控中.", "color:white; background-color:#d9534f", "")
    );
});