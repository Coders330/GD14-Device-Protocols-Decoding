// const net = require("net");

// const {
//   // handleVideoConnection,
//   // handleVideoData,
//   // handleVideoDisconnect,
//   removeDelimeters,
//   EscapeData,
//   validateChecksum,
//   ParseHeader_Data,
//   handleVideoPacket,
//   createGeneralAck,
//   send9101LiveStreamRequest,
//   RegistrationResponse,
//   createGeneralResponse,
//   extractPackets
// } = require("./controllers/js");

// const VIDEO_PORT = 1078;

// const videoServer = net.createServer((socket) => {
//   console.log("==================================");
//   console.log("📹 JT1078 Video Device Connected");
//   console.log("IP:", socket.remoteAddress);
//   console.log("PORT:", socket.remotePort);
//   console.log("==================================");

//   // device connected
//   // handleVideoConnection(socket);

//   // receiving video packets
//   socket.on("data", (data) => {

//     console.log("📦 RAW VIDEO PACKET RECEIVED");
//     console.log("HEX:", data.toString("hex"));
//     console.log("SIZE:", data.length, "bytes");

//     try {
//       let packet = removeDelimeters(data);

//       // unescape data
//       packet = EscapeData(packet);

//       // validate + remove checksum
//       let { valid, data } = validateChecksum(packet);

//       if (!valid) {
//         console.log("❌ Invalid checksum");
//         return;
//       }
//       packet = data;

//       let header_Data = ParseHeader_Data(packet);

//       console.log("✅ Parsed Data:", header_Data);

//       switch (header_Data.msg_ID) {
//         case 0x0100:
//           // handle registration + send auth code
//           console.log("📌 Registration Message received");
//           const regResponse = RegistrationResponse(header_Data);
//           socket.write(regResponse);
//           console.log("✅ Registration Response + Auth Code Sent");
//           break;

//         case 0x0102:
//           const ack1 = createGeneralResponse(header_Data);

//           socket.write(ack1);

//           send9101LiveStreamRequest(socket, header_Data.device_ID);

//           break;

//         case 0x1003:
//           const ack = createGeneralAck(header_Data);

//           // STEP 2
//           // send ACK to device

//           socket.write(ack);

//           console.log("✅ 9101 ACK Sent");
//           handleVideoPacket(header_Data.body);
//           console.log("📹 Video Body packet handled");

//           break;
//       }

//     } catch (error) {
//       console.error("❌ Error processing data:", error.message);
//     }

//     // handleVideoData(socket, data);
//   });

//   // device disconnected
//   socket.on("close", () => {
//     console.log("==================================");
//     console.log("❌ Video Device Disconnected");
//     console.log("==================================");

//     // handleVideoDisconnect(socket);
//   });

//   // socket error
//   socket.on("error", (err) => {
//     console.log("==================================");
//     console.log("❌ Video Socket Error");
//     console.log(err.message);
//     console.log("==================================");
//   });
// });

// // server start
// videoServer.listen(VIDEO_PORT, () => {
//   console.log("==================================");
//   console.log(`🚀 JT1078 Video Server Running`);
//   console.log(`📡 Listening on Port ${VIDEO_PORT}`);
//   console.log("==================================");
// });

const net = require("net");

const {
  removeDelimeters,

  EscapeData,

  validateChecksum,

  ParseHeader_Data,

  handleVideoPacket,

  createGeneralAck,

  send9101LiveStreamRequest,

  RegistrationResponse,

  createGeneralResponse,

  extractPackets,
} = require("./controllers.js");

const VIDEO_PORT = 1078;

const videoServer = net.createServer((socket) => {
  console.log("==================================");

  console.log("📹 JT1078 Device Connected");

  console.log("IP:", socket.remoteAddress);

  console.log("PORT:", socket.remotePort);

  console.log("==================================");

  // =====================================
  // TCP STREAM BUFFER
  // =====================================

  let tcpBuffer = Buffer.alloc(0);

  // =====================================
  // DATA RECEIVED
  // =====================================

  socket.on("data", (data) => {
    try {
      // APPEND TCP DATA

      tcpBuffer = Buffer.concat([tcpBuffer, data]);

      // EXTRACT FULL 0x7E PACKETS

      const result = extractPackets(tcpBuffer);

      const packets = result.packets;

      tcpBuffer = result.remaining;

      // PROCESS EACH PACKET

      for (const rawPacket of packets) {
        console.log("📦 RAW PACKET:", rawPacket.toString("hex"));

        // REMOVE 0x7E

        let packet = removeDelimeters(rawPacket);

        // UNESCAPE

        packet = EscapeData(packet);

        // CHECKSUM

        let {
          valid,

          data,
        } = validateChecksum(packet);

        if (!valid) {
          console.log("❌ Invalid Checksum");

          continue;
        }

        packet = data;

        // PARSE HEADER

        const header_Data = ParseHeader_Data(packet);

        console.log("✅ Parsed Header:", header_Data);

        // =================================
        // MESSAGE HANDLING
        // =================================

        switch (header_Data.msg_ID) {
          // =============================
          // REGISTRATION
          // =============================

          case 0x0100:
            console.log("📌 Registration Received");

            const regResponse = RegistrationResponse(header_Data);

            socket.write(regResponse);

            console.log("✅ Registration Response Sent");

            break;

          // =============================
          // AUTHENTICATION
          // =============================

          case 0x0102:
            console.log("🔐 Authentication Received");

            const authAck = createGeneralResponse(header_Data);

            socket.write(authAck);

            console.log("✅ Auth ACK Sent");

            // START LIVE STREAM

            send9101LiveStreamRequest(
              socket,

              header_Data.device_ID,
            );

            break;

          // =============================
          // VIDEO DATA
          // =============================

          case 0x1003:
            const ack = createGeneralAck(header_Data);

            socket.write(ack);

            console.log("✅ Video ACK Sent");

            handleVideoPacket(header_Data.body);

            break;

          default:
            console.log(
              "⚠ Unknown Msg ID:",

              "0x" + header_Data.msg_ID.toString(16),
            );
        }
      }
    } catch (error) {
      console.error("❌ Processing Error:", error.message);
    }
  });

  // =====================================
  // SOCKET CLOSED
  // =====================================

  socket.on("close", () => {
    console.log("==================================");

    console.log("❌ Device Disconnected");

    console.log("==================================");
  });

  // =====================================
  // SOCKET ERROR
  // =====================================

  socket.on("error", (err) => {
    console.log("==================================");

    console.log("❌ Socket Error");

    console.log(err.message);

    console.log("==================================");
  });
});

// =========================================
// START SERVER
// =========================================

videoServer.listen(VIDEO_PORT, () => {
  console.log("==================================");

  console.log("🚀 JT1078 Video Server Running");

  console.log(`📡 Listening on Port ${VIDEO_PORT}`);

  console.log("==================================");
});


