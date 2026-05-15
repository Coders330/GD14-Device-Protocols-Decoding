const net = require("net");

const client = new net.Socket();

const HOST = "bore.pub";
const PORT = 64746;

// =========================================
// CONNECT
// =========================================

client.connect(PORT, HOST, () => {
  console.log("🚀 Connected to JT1078 Server");

  // =====================================
  // VALID JT1078 0x1003 VIDEO PACKET
  // =====================================

  const packet = Buffer.from(
    // 7E START

    "7e" +
      // ===================================
      // JT808 HEADER
      // ===================================

      // MSG ID = 0x1003

      "1003" +
      // BODY LENGTH = 0x0034 (52 bytes)

      "0034" +
      // DEVICE ID

      "123456789012" +
      // SEQUENCE

      "0001" +
      // ===================================
      // JT1078 BODY
      // ===================================

      // MULTIMEDIA ID

      "30316364" +
      // RTP FLAGS

      "01" +
      // PAYLOAD TYPE
      // 63 = H264

      "63" +
      // PACKET SEQUENCE

      "0001" +
      // SIM NUMBER

      "503079604270" +
      // CHANNEL

      "01" +
      // FRAME INFO
      // 01 = FIRST FRAGMENT

      "01" +
      // TIMESTAMP

      "00000196f1b6fd11" +
      // LAST I FRAME INTERVAL

      "0028" +
      // LAST FRAME INTERVAL

      "0028" +
      // PAYLOAD LENGTH
      // 16 bytes

      "0010" +
      // ===================================
      // H264 PAYLOAD
      // ===================================

      // START CODE + I FRAME

      "0000000165" +
      // RANDOM VIDEO DATA

      "112233445566778899aabb" +
      // ===================================
      // XOR CHECKSUM
      // ===================================

      "ca" +
      // END

      "7e",

    "hex",
  );

  console.log("📤 Sending 0x1003 Packet");

  console.log(packet.toString("hex"));

  client.write(packet);
});

// =========================================
// SERVER RESPONSE
// =========================================

client.on("data", (data) => {
  console.log("📩 Response:");

  console.log(data.toString("hex"));
});

// =========================================
// CLOSE
// =========================================

client.on("close", () => {
  console.log("❌ Connection closed");
});

// =========================================
// ERROR
// =========================================

client.on("error", (err) => {
  console.log("⚠️ Error:", err.message);
});

