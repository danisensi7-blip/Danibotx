const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  Browsers
} = require("@whiskeysockets/baileys");

const PHONE_NUMBER = "573132795505";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let reiniciando = false;

async function iniciarDanibot() {
  try {
    const { state, saveCreds } =
      await useMultiFileAuthState("auth_info_baileys");

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: Browsers.macOS("Chrome"),
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      markOnlineOnConnect: false
    });

    sock.ev.on("creds.update", saveCreds);

    /*
     * PEDIR CÓDIGO DE VINCULACIÓN
     *
     * Esperamos unos segundos para evitar el error:
     * 428 Precondition Required / Connection Closed
     */
    if (!state.creds.registered) {
      console.log("");
      console.log("======================================");
      console.log("🤖 DANIBOT");
      console.log("======================================");
      console.log("⏳ Preparando conexión con WhatsApp...");
      console.log("");

      await delay(6000);

      try {
        console.log("📱 Solicitando código de vinculación...");

        const codigo = await sock.requestPairingCode(PHONE_NUMBER);

        console.log("");
        console.log("======================================");
        console.log("🔗 CÓDIGO DE VINCULACIÓN");
        console.log("======================================");
        console.log("📱 " + codigo);
        console.log("======================================");
        console.log("");
        console.log("En tu WhatsApp:");
        console.log("1. Ajustes");
        console.log("2. Dispositivos vinculados");
        console.log("3. Vincular un dispositivo");
        console.log("4. Vincular con número de teléfono");
        console.log("5. Introduce el código");
        console.log("======================================");
        console.log("");
      } catch (error) {
        console.error("");
        console.error("❌ NO SE PUDO GENERAR EL CÓDIGO");
        console.error(error);
        console.error("");

        await delay(5000);

        if (!reiniciando) {
          reiniciando = true;
          console.log("🔄 Reintentando...");
          iniciarDanibot();
        }

        return;
      }
    }

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === "open") {
        console.log("");
        console.log("======================================");
        console.log("✅ DANIBOT CONECTADO");
        console.log("======================================");
        console.log("🤖 WhatsApp conectado correctamente");
        console.log("📱 Número: " + PHONE_NUMBER);
        console.log("🚀 Danibot está listo");
        console.log("======================================");
        console.log("");
      }

      if (connection === "close") {
        const codigo =
          lastDisconnect?.error?.output?.statusCode;

        console.log("");
        console.log("❌ Conexión cerrada");
        console.log("Código:", codigo);

        if (codigo === DisconnectReason.loggedOut) {
          console.log("⚠️ La sesión fue cerrada.");
          console.log("⚠️ Hay que volver a vincular WhatsApp.");
          return;
        }

        if (!reiniciando) {
          reiniciando = true;

          console.log("🔄 Reiniciando Danibot en 5 segundos...");

          await delay(5000);

          reiniciando = false;
          iniciarDanibot();
        }
      }
    });

    sock.ev.on("messages.upsert", async ({ messages }) => {
      for (const mensaje of messages) {
        if (!mensaje) continue;
        if (!mensaje.message) continue;
        if (mensaje.key.fromMe) continue;

        const texto =
          mensaje.message.conversation ||
          mensaje.message.extendedTextMessage?.text ||
          "";

        const comando = texto.toLowerCase().trim();

        if (comando === ".menu") {
          await sock.sendMessage(mensaje.key.remoteJid, {
            text:
`╔══════════════════════════╗
║       🤖 DANIBOT         ║
╚══════════════════════════╝

👋 Hola, soy Danibot.

📋 COMANDOS:

• .menu
• .ping
• .hola

🚀 Danibot está activo.`
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
      }
    });

  } catch (error) {
    console.error("");
    console.error("❌ ERROR GENERAL:");
    console.error(error);
    console.error("");
  }
}

console.log("");
console.log("🤖 Iniciando Danibot...");
console.log("📱 Número configurado: " + PHONE_NUMBER);
console.log("");

iniciarDanibot();
