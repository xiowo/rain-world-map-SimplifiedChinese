let originalConsoleLog = console.log;
console.log = function () { }; // 暂时屏蔽日志

let now1 = new Date();

queueMicrotask(async () => {
    // 恢复日志
    console.log = originalConsoleLog;
    const Log = console.log;

    const grt = new Date("2023/08/22");
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
        `©2025 By R-W-M-SC `
    ];

    const ascll2 = [`NCC2-036`, `业力等级识别成功，允许访问.`, `您的业力: `, `⨂`];

    setTimeout(() => Log(
        `\n%c${ascll[0]} %c ${ascll[1]} %c ${ascll[2]} %c${ascll[3]}%c ${ascll[4]}%c ${ascll[5]}\n\n`,
        "color:#39c5bb", "", "color:#39c5bb", "color:#39c5bb", "", "color:#39c5bb"
    ));

    setTimeout(() => Log(
        `%c ${ascll2[0]} %c ${ascll2[1]} %c \n${ascll2[2]} %c\n${ascll2[3]}\n`,
        "color:white; background-color:#4fd953", "", "", 'background:url("/embed.jpg") no-repeat;font-size:450%'
    ));

    setTimeout(() => Log("%c WELCOME %c 您好，管理员.", "color:white; background-color:#4f90d9", ""));

    setTimeout(() => console.warn("%c ⚡ Powered by R-W-M %c 你正在访问雨世界地图", "color:white; background-color:#f0ad4e", ""));

    setTimeout(() => Log("%c W23-12 %c 你已打开控制台.", "color:white; background-color:#4f90d9", ""));

    setTimeout(() => console.warn("%c SS_AI-782 %c 你现在正处于五块卵石的监控中.", "color:white; background-color:#d9534f", ""));
});
