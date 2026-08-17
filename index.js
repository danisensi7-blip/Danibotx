const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const PHONE_NUMBER = "573132795505";

async function iniciarDanibot() {
  const { state, saveCreds } =
    await useMultiFileAuthState("auth_info_baileys");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ["Danibot", "Chrome", "1.0.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  let codigoSolicitado = false;

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (
      !state.creds.registered &&
      !codigoSolicitado &&
      (connection === "connecting" || qr)
    ) {
      codigoSolicitado = true;

      try {
        const codigo = await sock.requestPairingCode(PHONE_NUMBER);

        console.log("");
        console.log("================================");
        console.log("🔗 CÓDIGO DE VINCULACIÓN");
        console.log("================================");
        console.log("📱 " + codigo);
        console.log("================================");
        console.log("En WhatsApp:");
        console.log("Dispositivos vinculados");
        console.log("→ Vincular un dispositivo");
        console.log("→ Vincular con número de teléfono");
        console.log("→ Introduce el código");
        console.log("================================");
        console.log("");
      } catch (error) {
        console.error("❌ Error generando código:", error);
        codigoSolicitado = false;
      }
    }

    if (connection === "open") {
      console.log("");
      console.log("================================");
      console.log("🤖 DANIBOT CONECTADO");
      console.log("================================");
      console.log("✅ WhatsApp conectado correctamente");
      console.log("🤖 Danibot está listo");
      console.log("================================");
      console.log("");
    }

    if (connection === "close") {
      const codigo =
        lastDisconnect?.error?.output?.statusCode;

      console.log("❌ Conexión cerrada");
      console.log("Código:", codigo);

      if (codigo === DisconnectReason.loggedOut) {
        console.log("⚠️ La sesión fue cerrada en WhatsApp.");
      } else {
        console.log("🔄 Reiniciando Danibot...");

        setTimeout(() => {
          iniciarDanibot();
        }, 3000);
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const mensaje = messages[0];

    if (!mensaje) return;
    if (!mensaje.message) return;
    if (mensaje.key.fromMe) return;

    const texto =
      mensaje.message.conversation ||
      mensaje.message.extendedTextMessage?.text ||
      "";

    const comando = texto.toLowerCase().trim();

    if (comando === ".menu") {
      await sock.sendMessage(mensaje.key.remoteJid, {
        text:
`╔══════════════════╗
║    🤖 DANIBOT    ║
╚══════════════════╝

👋 Hola, soy Danibot.

📋 COMANDOS

• .menu
• .ping
• .hola

🤖 Danibot está activo.`
      });
    }

    if (comando === ".ping") {
      await sock.sendMessage(mensaje.key.remoteJid, {
        text: "🏓 Pong! 🤖 Danibot está activo."
      });
    }

    if (comando === ".hola") {
      await sock.sendMessage(mensaje.key.remoteJid, {
        text: "👋 ¡Hola! Soy Danibot 🤖"
      });
    }
  });
}

console.log("");
console.log("================================");
console.log("🤖 INICIANDO DANIBOT...");
console.log("================================");
console.log("");

iniciarDanibot();
