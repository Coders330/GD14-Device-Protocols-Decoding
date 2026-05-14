const net = require("net");

const {
  removeDelimeters,
  validateChecksum,
  EscapeData,
  ParseHeader_Data,
  Parse_MainData,
  Acknwledgment,
  RegistrationResponse,
  createGeneralResponse
} = require("./controllers.js");

const server = net.createServer((socket) => {
  console.log("✅ Device connected");

  socket.on("data", (packets) => {
    console.log("STEP 1");

    // console.log(packets);

    console.log("STEP 2");
    try {
          console.log("FULL PACKET:", packets.toString("hex"));
          // remove 7E delimeters 
          let packet = removeDelimeters(packets);
          
          // unescape data
          packet = EscapeData(packet);
          
          // validate + remove checksum
          let { valid, data } = validateChecksum(packet);
          
          if (!valid) {
            console.log("❌ Invalid checksum");
            return;
          }
          packet = data;
          
          // parse header + body 
          let header_Data = ParseHeader_Data(packet);

          console.log("✅ Parsed Data:", header_Data);





          // swich case for different command types (only those which device -> server) 

          switch (header_Data.msg_ID) {
            case 0x0100:
              // handle registration + send auth code
              console.log("📌 Registration Message received");
              const regResponse = RegistrationResponse(header_Data);
              socket.write(regResponse);
              console.log("✅ Registration Response + Auth Code Sent");
              break;

            case 0x0102:
              // device says auth received or not, else to continue
              const authAck = createGeneralResponse(header_Data);
              socket.write(authAck);
              console.log(
                "🔐 Authentication Status received and response also sent",
              );
              break;

            case 0x0002:
              // heartbeat message
              console.log("❤️ Heartbeat received");
              // const hbResponse = createHeartbeatResponse(header_Data);
              const hbAck = createGeneralResponse(header_Data);
              socket.write(hbAck);
              // socket.write(hbResponse);
              console.log("✅ Heartbeat Response Sent");
              break;

            case 0x0200:
              // location data + request more info + acknowledgement
              console.log("📍 Location data received");
              console.log(
                "📍 Location Info:",
                Parse_MainData(header_Data.body),
              );

              const locationAck = Acknwledgment(header_Data);
              // const moreInfo = getMoreInfo();
              socket.write(locationAck);
              // socket.write(moreInfo);
              console.log("✅ Location ACK Sent");
              break;

            case 0x0704:
              console.log("📦 Batch GPS Upload received");

              const count = header_Data.body.readUInt16BE(0);

              const packetType = header_Data.body.readUInt8(2);

              console.log("📍 Location Count:", count);

              console.log("📡 Upload Type:", packetType);
              const ack = createGeneralResponse(header_Data);

              socket.write(ack);

              console.log("✅ 0704 ACK Sent");
              break;

            default:
              console.log("❓ Unknown message type");
          }
            


 

    } catch (error) {
      console.error("❌ Error processing data:", error.message);
    }
  });



  socket.on("end", () => {
    console.log("❌ Device disconnected");
  });



  socket.on("error", (err) => {
    console.log("⚠️ Error:", err.message);
  });
});



server.listen(808, () => {
  console.log("Server running on port 808");
});

