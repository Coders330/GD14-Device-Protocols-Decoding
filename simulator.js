const net = require("net");

const client = new net.Socket();

const HOST = "bore.pub"; // your tunnel
const PORT = 39966; // your current port

client.connect(PORT, HOST, () => {
  console.log("🚀 Connected to server");

  // Example JT808-like packet (dummy hex)
  const packets = Buffer.from(
    "7E01000046200260432300A400474552494f4E3A4C435630385F56312E302C54494D453A327D0236303530392E3232353435307CCB7E",
    "hex",
  );

  client.write(packets);
});

client.on("data", (data) => {
  console.log("📩 Response:", data.toString("hex"));
});

client.on("close", () => {
  console.log("❌ Connection closed");
});

client.on("error", (err) => {
  console.log("⚠️ Error:", err.message);
});

