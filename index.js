const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const qrcode = require("qrcode-terminal");

async function iniciarDanibot() {
  const { state, saveCreds } =
    await useMultiFileAuthState("auth_info_baileys");

  const sock = makeWASocket({
    auth: state
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {

    if (qr) {
      console.log("\n📱 ESCANEA ESTE QR CON WHATSAPP:\n");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      console.log("\n✅ DANIBOT CONECTADO A WHATSAPP\n");
      console.log("🤖 Danibot está listo.");
    }

    if (connection === "close") {
      const codigo =
        lastDisconnect?.error?.output?.statusCode;

      console.log("❌ Conexión cerrada.");

      if (codigo !== DisconnectReason.loggedOut) {
        console.log("🔄 Reconectando...");
        iniciarDanibot();
      } else {
        console.log("⚠️ Sesión cerrada. Hay que vincular WhatsApp otra vez.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const mensaje = messages[0];

    if (!mensaje?.message) return;
    if (mensaje.key.fromMe) return;

    const texto =
      mensaje.message.conversation ||
      mensaje.message.extendedTextMessage?.text ||
      "";

    const comando = texto.toLowerCase().trim();

    if (comando === ".menu") {
      await sock.sendMessage(mensaje.key.remoteJid, {
        text:
`╭━━━ 🤖 DANIBOT ━━━╮

👋 Hola, soy Danibot.

📋 COMANDOS

• .menu
• .ping
• .hola

╰━━━━━━━━━━━━━━━━╯`
      });
    }

    if (comando === ".ping") {
      await sock.sendMessage(mensaje.key.remoteJid, {
        text: "🏓 Pong!\n🤖 Danibot está activo."
      });
    }

    if (comando === ".hola") {
      await sock.sendMessage(mensaje.key.remoteJid, {
        text: "👋 ¡Hola! Soy Danibot 🤖"
      });
    }
  });
}

iniciarDanibot();
