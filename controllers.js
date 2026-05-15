// const createGeneralAck = (headerData) => {
//   // =====================================
//   // JT808 / JT1078
//   // Platform General Response
//   // Message ID = 0x8001
//   // =====================================

//   // -------------------------------------
//   // Original device message info
//   // -------------------------------------

//   const originalMsgID = headerData.msg_ID;

//   const originalSequence = headerData.sequence_Number;

//   const deviceID = headerData.device_ID;

//   // =====================================
//   // BODY
//   // =====================================
//   // 2 bytes -> original sequence
//   // 2 bytes -> original msg id
//   // 1 byte  -> result
//   //
//   // result:
//   // 0 = success
//   // =====================================

//   const body = Buffer.alloc(5);

//   body.writeUInt16BE(originalSequence, 0);

//   body.writeUInt16BE(originalMsgID, 2);

//   body.writeUInt8(0x00, 4);

//   // =====================================
//   // HEADER
//   // =====================================

//   const header = Buffer.alloc(12);

//   // Message ID -> 0x8001

//   header.writeUInt16BE(0x8001, 0);

//   // Body length

//   header.writeUInt16BE(body.length, 2);

//   // Device ID (6 bytes)

//   Buffer.from(deviceID, "hex").copy(header, 4);

//   // Platform sequence number
//   // (can be static for now)

//   header.writeUInt16BE(1, 10);

//   // =====================================
//   // MERGE HEADER + BODY
//   // =====================================

//   const packetWithoutChecksum = Buffer.concat([header, body]);

//   // =====================================
//   // CALCULATE XOR CHECKSUM
//   // =====================================

//   let checksum = 0;

//   for (let i = 0; i < packetWithoutChecksum.length; i++) {
//     checksum ^= packetWithoutChecksum[i];
//   }

//   // =====================================
//   // FINAL PACKET
//   // =====================================

//   const finalPacket = Buffer.concat([
//     Buffer.from([0x7e]),

//     packetWithoutChecksum,

//     Buffer.from([checksum]),

//     Buffer.from([0x7e]),
//   ]);

//   console.log("📤 ACK PACKET:", finalPacket.toString("hex"));

//   return finalPacket;
// };

// const removeDelimeters = (packets) => {
//   if (packets[0] == 0x7e) {
//     packets = packets.slice(1);
//   }
//   if (packets[packets.length - 1] == 0x7e) {
//     packets = packets.slice(0, -1);
//   }

//   return packets;
// };

// const EscapeData = (packet) => {
//   let unescaped = [];
//   let i = 0;
//   while (i < packet.length) {
//     if (packet[i] == 0x7d) {
//       if (packet[i + 1] == 0x02) {
//         unescaped.push(0x7e);
//         i += 2;
//       } else if (packet[i + 1] == 0x01) {
//         unescaped.push(0x7d);
//         i += 2;
//       } else {
//         unescaped.push(packet[i]);
//         i++;
//       }
//     } else {
//       unescaped.push(packet[i]);
//       i++;
//     }
//   }

//   return Buffer.from(unescaped);
// };

// const validateChecksum = (packet) => {
//   const checksum = packet[packet.length - 1];
//   const dataWithoutChecksum = packet.slice(0, -1);

//   // console.log("Data without checksum: ", dataWithoutChecksum.toString("hex"));
//   let calculatedChecksum = 0x00;

//   for (let i = 0; i < dataWithoutChecksum.length; i++) {
//     calculatedChecksum = calculatedChecksum ^ dataWithoutChecksum[i];
//     console.log(`Byte ${i}: ${dataWithoutChecksum[i].toString(16)}`);
//   }
//   console.log("Calulated checksum: ", calculatedChecksum.toString(16));
//   return {
//     valid: calculatedChecksum.toString(16) === checksum.toString(16),
//     data: dataWithoutChecksum,
//   };
// };

// const ParseHeader_Data = (packet) => {
//   const msgID = packet.readUInt16BE(0);

//   const properties = packet.readUInt16BE(2);

//   // actual body length
//   const bodyLength = properties & 0x03ff;

//   // subpackage flag
//   const isSubPackage = (properties >> 13) & 0x01;

//   // encryption type
//   const encryptionType = (properties >> 10) & 0x07;

//   const deviceID = packet.slice(4, 10).toString("hex");

//   const sequence_Number = packet.readUInt16BE(10);

//   const body = packet.slice(12);

//   return {
//     msg_ID: msgID,
//     properties,
//     body_length: bodyLength,
//     isSubPackage,
//     encryptionType,
//     device_ID: deviceID,
//     sequence_Number,
//     body,
//   };
// };

// const parse1078Body = (body) => {
//   const multimediaID = body.slice(0, 4).toString("hex");

//   const rtpFlags = body.readUInt8(4);

//   const payloadType = body.readUInt8(5);

//   const sequence = body.readUInt16BE(6);

//   const sim = body.slice(8, 14).toString("hex");

//   const channel = body.readUInt8(14);

//   const frameInfo = body.readUInt8(15);

//   const timestamp = body.readBigUInt64BE(16);

//   const payloadLength = body.readUInt16BE(24);

//   const payload = body.slice(26, 26 + payloadLength);

//   return {
//     multimediaID,
//     rtpFlags,
//     payloadType,
//     sequence,
//     sim,
//     channel,
//     frameInfo,
//     timestamp: timestamp.toString(),
//     payloadLength,
//     payload,
//   };
// };

// function getFragmentType(flag) {
//   switch (flag) {
//     case 0:
//       return "COMPLETE";

//     case 1:
//       return "FIRST";

//     case 2:
//       return "LAST";

//     case 3:
//       return "MIDDLE";

//     default:
//       return "UNKNOWN";
//   }
// }

// const fs = require("fs");

// // =========================================
// // FRAME BUFFER
// // =========================================

// const frameBuffer = new Map();

// // =========================================
// // WAIT FOR NEXT I FRAME
// // =========================================

// let waitingForIFrame = false;

// // =========================================
// // DETECT H264 FRAME TYPE
// // =========================================

// function detectFrameType(frame) {
//   for (let i = 0; i < frame.length - 4; i++) {
//     // FIND:
//     // 00 00 00 01

//     if (
//       frame[i] === 0x00 &&
//       frame[i + 1] === 0x00 &&
//       frame[i + 2] === 0x00 &&
//       frame[i + 3] === 0x01
//     ) {
//       const nalHeader = frame[i + 4];

//       const nalType = nalHeader & 0x1f;

//       // ===============================
//       // I FRAME
//       // ===============================

//       if (nalType === 5) {
//         return "I";
//       }

//       // ===============================
//       // P FRAME
//       // ===============================

//       if (nalType === 1) {
//         return "P";
//       }

//       // ===============================
//       // SPS
//       // ===============================

//       if (nalType === 7) {
//         return "SPS";
//       }

//       // ===============================
//       // PPS
//       // ===============================

//       if (nalType === 8) {
//         return "PPS";
//       }
//     }
//   }

//   return "UNKNOWN";
// }

// // =========================================
// // MAIN VIDEO HANDLER
// // =========================================

// function handleVideoPacket(data) {
//   // =====================================
//   // PARSE BODY
//   // =====================================

//   const videoData = parse1078Body(data);

//   // =====================================
//   // GET FRAGMENT TYPE
//   // =====================================

//   const fragmentType = getFragmentType(videoData.rtpFlags & 0x03);

//   // =====================================
//   // TIMESTAMP
//   // =====================================

//   const timestamp = videoData.timestamp.toString();

//   // =====================================
//   // CREATE FRAME BUFFER
//   // =====================================

//   if (!frameBuffer.has(timestamp)) {
//     frameBuffer.set(timestamp, []);
//   }

//   // =====================================
//   // STORE FRAGMENT
//   // =====================================

//   frameBuffer.get(timestamp).push({
//     sequence: videoData.packetSequence,

//     fragmentType: fragmentType,

//     payload: videoData.payload,
//   });

//   console.log(`📦 Stored Fragments: ${frameBuffer.get(timestamp).length}`);

//   // =====================================
//   // WAIT UNTIL LAST FRAGMENT
//   // =====================================

//   if (fragmentType === "LAST") {
//     console.log("✅ LAST FRAGMENT RECEIVED");

//     // =================================
//     // GET ALL FRAGMENTS
//     // =================================

//     const fragments = frameBuffer.get(timestamp);

//     // =================================
//     // SORT FRAGMENTS
//     // =================================

//     fragments.sort((a, b) => {
//       return a.sequence - b.sequence;
//     });

//     console.log("🧩 Fragments Reordered");

//     // =================================
//     // CHECK PACKET LOSS
//     // =================================

//     let frameValid = true;

//     for (let i = 1; i < fragments.length; i++) {
//       const previous = fragments[i - 1].sequence;

//       const current = fragments[i].sequence;

//       // EXPECT:
//       // previous + 1

//       if (current !== previous + 1) {
//         console.log("❌ PACKET LOSS DETECTED");

//         console.log(`Missing packet between ${previous} and ${current}`);

//         frameValid = false;

//         break;
//       }
//     }

//     // =================================
//     // INVALID FRAME
//     // =================================

//     if (!frameValid) {
//       console.log("🗑 Dropping Incomplete Frame");

//       // WAIT NEXT I FRAME

//       waitingForIFrame = true;

//       // CLEAR BUFFER

//       frameBuffer.delete(timestamp);

//       return;
//     }

//     // =================================
//     // EXTRACT PAYLOADS
//     // =================================

//     const payloads = fragments.map((fragment) => {
//       return fragment.payload;
//     });

//     // =================================
//     // REBUILD FRAME
//     // =================================

//     const fullFrame = Buffer.concat(payloads);

//     console.log("🎞 Full Frame Size:", fullFrame.length);

//     // =================================
//     // DETECT FRAME TYPE
//     // =================================

//     const frameType = detectFrameType(fullFrame);

//     console.log("🎬 Frame Type:", frameType);

//     // =================================
//     // IF WAITING FOR I FRAME
//     // =================================

//     if (waitingForIFrame) {
//       // IGNORE ALL NON-I FRAMES

//       if (frameType !== "I") {
//         console.log("⏳ Waiting for next I-frame...");

//         frameBuffer.delete(timestamp);

//         return;
//       }

//       // GOT NEW I FRAME

//       console.log("✅ New I-Frame Received");

//       waitingForIFrame = false;
//     }

//     // =================================
//     // SAVE FRAME
//     // =================================

//     fs.appendFileSync("video.h264", fullFrame);

//     console.log("✅ Frame written to video.h264");

//     // =================================
//     // CLEAR FRAME BUFFER
//     // =================================

//     frameBuffer.delete(timestamp);
//   }
// }


// const send9101LiveStreamRequest = (socket, deviceID) => {
//   // =====================================
//   // JT1078 REAL-TIME VIDEO REQUEST
//   // Message ID: 0x9101
//   // Platform -> Device
//   // =====================================

//   // =====================================
//   // BODY
//   // =====================================

//   const body = Buffer.alloc(18);

//   let offset = 0;

//   // -------------------------------------
//   // 1. Server IP Address
//   // 4 bytes
//   // Example:
//   // 192.168.1.100
//   // -------------------------------------

//   body[offset++] = 192;
//   body[offset++] = 168;
//   body[offset++] = 1;
//   body[offset++] = 100;

//   // -------------------------------------
//   // 2. TCP Port
//   // 2 bytes
//   // video server port
//   // -------------------------------------

//   body.writeUInt16BE(1078, offset);

//   offset += 2;

//   // -------------------------------------
//   // 3. Logical Channel Number
//   // usually:
//   // 1 = front camera
//   // -------------------------------------

//   body.writeUInt8(1, offset);

//   offset += 1;

//   // -------------------------------------
//   // 4. Data Type
//   // 0 = audio+video
//   // 1 = video
//   // 2 = dual stream
//   // -------------------------------------

//   body.writeUInt8(1, offset);

//   offset += 1;

//   // -------------------------------------
//   // 5. Stream Type
//   // 0 = main stream
//   // 1 = sub stream
//   // -------------------------------------

//   body.writeUInt8(0, offset);

//   offset += 1;

//   // -------------------------------------
//   // 6. Storage Type
//   // 0 = real-time
//   // 1 = playback
//   // -------------------------------------

//   body.writeUInt8(0, offset);

//   offset += 1;

//   // -------------------------------------
//   // Remaining reserved bytes
//   // -------------------------------------

//   body.fill(0x00, offset);

//   // =====================================
//   // HEADER
//   // =====================================

//   const header = Buffer.alloc(12);

//   // Message ID -> 0x9101

//   header.writeUInt16BE(0x9101, 0);

//   // Body Length

//   header.writeUInt16BE(body.length, 2);

//   // Device ID

//   Buffer.from(deviceID, "hex").copy(header, 4);

//   // Platform Sequence Number

//   header.writeUInt16BE(1, 10);

//   // =====================================
//   // MERGE
//   // =====================================

//   const packetWithoutChecksum = Buffer.concat([header, body]);

//   // =====================================
//   // XOR CHECKSUM
//   // =====================================

//   let checksum = 0;

//   for (let i = 0; i < packetWithoutChecksum.length; i++) {
//     checksum ^= packetWithoutChecksum[i];
//   }

//   // =====================================
//   // FINAL PACKET
//   // =====================================

//   const finalPacket = Buffer.concat([
//     Buffer.from([0x7e]),

//     packetWithoutChecksum,

//     Buffer.from([checksum]),

//     Buffer.from([0x7e]),
//   ]);

//   console.log("📤 9101 STREAM REQUEST:", finalPacket.toString("hex"));

//   // =====================================
//   // SEND TO DEVICE
//   // =====================================

//   socket.write(finalPacket);

//   console.log("✅ Live Video Request Sent");
// };


// const RegistrationResponse = (headerData) => {
//   // =====================================
//   // AUTH TOKEN
//   // =====================================

//   const authCode = "123456";

//   const authBuffer = Buffer.from(authCode);

//   // =====================================
//   // BODY
//   // =====================================
//   //
//   // original sequence -> 2 bytes
//   // result            -> 1 byte
//   // auth code         -> variable
//   //
//   // result:
//   // 0 = success
//   // =====================================

//   const body = Buffer.alloc(3 + authBuffer.length);

//   // original sequence

//   body.writeUInt16BE(headerData.sequence_Number, 0);

//   // registration success

//   body.writeUInt8(0x00, 2);

//   // auth token

//   authBuffer.copy(body, 3);

//   // =====================================
//   // HEADER
//   // =====================================

//   const header = Buffer.alloc(12);

//   // message ID -> 0x8100

//   header.writeUInt16BE(0x8100, 0);

//   // body length

//   header.writeUInt16BE(body.length, 2);

//   // device ID

//   Buffer.from(headerData.device_ID, "hex").copy(header, 4);

//   // platform sequence

//   header.writeUInt16BE(1, 10);

//   // =====================================
//   // MERGE
//   // =====================================

//   const packetWithoutChecksum = Buffer.concat([header, body]);

//   // =====================================
//   // XOR CHECKSUM
//   // =====================================

//   let checksum = 0;

//   for (let i = 0; i < packetWithoutChecksum.length; i++) {
//     checksum ^= packetWithoutChecksum[i];
//   }

//   // =====================================
//   // FINAL PACKET
//   // =====================================

//   const finalPacket = Buffer.concat([
//     Buffer.from([0x7e]),

//     packetWithoutChecksum,

//     Buffer.from([checksum]),

//     Buffer.from([0x7e]),
//   ]);

//   console.log("📤 Registration Response:", finalPacket.toString("hex"));

//   return finalPacket;
// };

// const createGeneralResponse = (headerData) => {
//   // =====================================
//   // ORIGINAL MESSAGE INFO
//   // =====================================

//   const originalMsgID = headerData.msg_ID;

//   const originalSequence = headerData.sequence_Number;

//   // =====================================
//   // BODY
//   // =====================================
//   //
//   // original sequence -> 2 bytes
//   // original msg id   -> 2 bytes
//   // result            -> 1 byte
//   //
//   // result:
//   // 0 = success
//   // =====================================

//   const body = Buffer.alloc(5);

//   // original sequence

//   body.writeUInt16BE(originalSequence, 0);

//   // original msg id

//   body.writeUInt16BE(originalMsgID, 2);

//   // success

//   body.writeUInt8(0x00, 4);

//   // =====================================
//   // HEADER
//   // =====================================

//   const header = Buffer.alloc(12);

//   // message ID -> 0x8001

//   header.writeUInt16BE(0x8001, 0);

//   // body length

//   header.writeUInt16BE(body.length, 2);

//   // device ID

//   Buffer.from(headerData.device_ID, "hex").copy(header, 4);

//   // platform sequence

//   header.writeUInt16BE(1, 10);

//   // =====================================
//   // MERGE
//   // =====================================

//   const packetWithoutChecksum = Buffer.concat([header, body]);

//   // =====================================
//   // XOR CHECKSUM
//   // =====================================

//   let checksum = 0;

//   for (let i = 0; i < packetWithoutChecksum.length; i++) {
//     checksum ^= packetWithoutChecksum[i];
//   }

//   // =====================================
//   // FINAL PACKET
//   // =====================================

//   const finalPacket = Buffer.concat([
//     Buffer.from([0x7e]),

//     packetWithoutChecksum,

//     Buffer.from([checksum]),

//     Buffer.from([0x7e]),
//   ]);

//   console.log("📤 General ACK:", finalPacket.toString("hex"));

//   return finalPacket;
// };


// module.exports = {
//   removeDelimeters,
//   EscapeData,
//   validateChecksum,
//   ParseHeader_Data,
//   handleVideoPacket,
//   createGeneralAck,
//   createGeneralResponse,
//   send9101LiveStreamRequest,
//   RegistrationResponse
// };



const fs = require("fs");

// =========================================
// FRAME BUFFER
// =========================================

const frameBuffer = new Map();

// =========================================
// WAIT FOR NEXT I FRAME
// =========================================

let waitingForIFrame = false;

// =========================================
// CLEAN OLD INCOMPLETE FRAMES
// =========================================

setInterval(() => {

  const now = Date.now();

  for (const [timestamp, data] of frameBuffer.entries()) {

    if (now - data.createdAt > 5000) {

      console.log(
        "🗑 Removing expired frame:",
        timestamp
      );

      frameBuffer.delete(timestamp);
    }
  }

}, 5000);

// =========================================
// REMOVE 0x7E DELIMITERS
// =========================================

const removeDelimeters = (packet) => {

  if (packet[0] === 0x7e) {

    packet = packet.slice(1);
  }

  if (packet[packet.length - 1] === 0x7e) {

    packet = packet.slice(0, -1);
  }

  return packet;
};


// =========================================
// UNESCAPE DEVICE DATA
// =========================================

const EscapeData = (packet) => {

  const unescaped = [];

  let i = 0;

  while (i < packet.length) {

    if (packet[i] === 0x7d) {

      if (packet[i + 1] === 0x02) {

        unescaped.push(0x7e);

        i += 2;

      } else if (packet[i + 1] === 0x01) {

        unescaped.push(0x7d);

        i += 2;

      } else {

        unescaped.push(packet[i]);

        i++;
      }

    } else {

      unescaped.push(packet[i]);

      i++;
    }
  }

  return Buffer.from(unescaped);
};

// =========================================
// ESCAPE DATA BEFORE SENDING
// =========================================

const escapeSendData = (packet) => {

  const escaped = [];

  for (let i = 0; i < packet.length; i++) {

    if (packet[i] === 0x7e) {

      escaped.push(0x7d, 0x02);

    } else if (packet[i] === 0x7d) {

      escaped.push(0x7d, 0x01);

    } else {

      escaped.push(packet[i]);
    }
  }

  return Buffer.from(escaped);
};

// =========================================
// XOR CHECKSUM VALIDATION
// =========================================

const validateChecksum = (packet) => {

  const checksum =
    packet[packet.length - 1];

  const dataWithoutChecksum =
    packet.slice(0, -1);

  let calculatedChecksum = 0x00;

  for (
    let i = 0;
    i < dataWithoutChecksum.length;
    i++
  ) {

    calculatedChecksum ^=
      dataWithoutChecksum[i];
  }

  return {

    valid:
      calculatedChecksum === checksum,

    data:
      dataWithoutChecksum,
  };
};

// =========================================
// PARSE JT808/JT1078 HEADER
// =========================================

const ParseHeader_Data = (packet) => {

  const msgID =
    packet.readUInt16BE(0);

  const properties =
    packet.readUInt16BE(2);

  const bodyLength =
    properties & 0x03ff;

  const isSubPackage =
    (properties >> 13) & 0x01;

  const encryptionType =
    (properties >> 10) & 0x07;

  const deviceID =
    packet.slice(4, 10).toString("hex");

  const sequence_Number =
    packet.readUInt16BE(10);

  const body =
    packet.slice(12);

  return {

    msg_ID:
      msgID,

    properties,

    body_length:
      bodyLength,

    isSubPackage,

    encryptionType,

    device_ID:
      deviceID,

    sequence_Number,

    body,
  };
};

// =========================================
// PARSE JT1078 BODY
// =========================================

const parse1078Body = (body) => {

  const multimediaID =
    body.slice(0, 4).toString("hex");

  const rtpFlags =
    body.readUInt8(4);

  const payloadType =
    body.readUInt8(5);

  const sequence =
    body.readUInt16BE(6);

  const sim =
    body.slice(8, 14).toString("hex");

  const channel =
    body.readUInt8(14);

  const frameInfo =
    body.readUInt8(15);

  const timestamp =
    body.readBigUInt64BE(16);

  const lastIFrameInterval =
    body.readUInt16BE(24);

  const lastFrameInterval =
    body.readUInt16BE(26);

  const payloadLength =
    body.readUInt16BE(28);

  const payload =
    body.slice(
      30,
      30 + payloadLength
    );

  return {

    multimediaID,

    rtpFlags,

    payloadType,

    sequence,

    sim,

    channel,

    frameInfo,

    timestamp:
      timestamp.toString(),

    lastIFrameInterval,

    lastFrameInterval,

    payloadLength,

    payload,
  };
};

// =========================================
// FRAGMENT TYPE
// =========================================

function getFragmentType(flag) {

  switch (flag) {

    case 0:
      return "COMPLETE";

    case 1:
      return "FIRST";

    case 2:
      return "LAST";

    case 3:
      return "MIDDLE";

    default:
      return "UNKNOWN";
  }
}

// =========================================
// DETECT H264 FRAME TYPE
// =========================================

function detectFrameType(frame) {

  for (
    let i = 0;
    i < frame.length - 5;
    i++
  ) {

    // 00 00 00 01

    if (

      frame[i] === 0x00 &&
      frame[i + 1] === 0x00 &&
      frame[i + 2] === 0x00 &&
      frame[i + 3] === 0x01

    ) {

      const nalHeader =
        frame[i + 4];

      const nalType =
        nalHeader & 0x1f;

      if (nalType === 5) return "I";

      if (nalType === 1) return "P";

      if (nalType === 7) return "SPS";

      if (nalType === 8) return "PPS";
    }
  }

  return "UNKNOWN";
}

// =========================================
// HANDLE VIDEO PACKET
// =========================================

function handleVideoPacket(data) {

  const videoData =
    parse1078Body(data);

  const fragmentType =
    getFragmentType(
      videoData.frameInfo & 0x03
    );

  const timestamp =
    videoData.timestamp.toString();



  // CREATE BUFFER

  if (!frameBuffer.has(timestamp)) {

    frameBuffer.set(timestamp, {

      createdAt: Date.now(),

      fragments: [],
    });
  }



  // STORE FRAGMENT

  frameBuffer
    .get(timestamp)
    .fragments
    .push({

      sequence:
        videoData.sequence,

      fragmentType,

      payload:
        videoData.payload,
    });



  console.log(

    `📦 Stored Fragments: ${
      frameBuffer.get(timestamp)
        .fragments.length
    }`

  );



  // FRAME READY

  if (

    fragmentType === "LAST" ||
    fragmentType === "COMPLETE"

  ) {

    const fragments =
      frameBuffer.get(timestamp)
      .fragments;



    // SORT

    fragments.sort((a, b) => {

      return a.sequence - b.sequence;

    });



    // CHECK PACKET LOSS

    let frameValid = true;

    for (
      let i = 1;
      i < fragments.length;
      i++
    ) {

      const previous =
        fragments[i - 1].sequence;

      const current =
        fragments[i].sequence;

      if (
        current !== previous + 1
      ) {

        console.log(
          "❌ PACKET LOSS DETECTED"
        );

        frameValid = false;

        break;
      }
    }



    // DROP FRAME

    if (!frameValid) {

      waitingForIFrame = true;

      frameBuffer.delete(timestamp);

      return;
    }



    // REBUILD FRAME

    const payloads =
      fragments.map((fragment) => {

        return fragment.payload;

      });

    const fullFrame =
      Buffer.concat(payloads);



    // DETECT FRAME TYPE

    const frameType =
      detectFrameType(fullFrame);

    console.log(
      "🎬 Frame Type:",
      frameType
    );



    // WAIT NEXT I FRAME

    if (waitingForIFrame) {

      if (frameType !== "I") {

        console.log(
          "⏳ Waiting for I-frame..."
        );

        frameBuffer.delete(timestamp);

        return;
      }

      waitingForIFrame = false;
    }



    // SAVE VIDEO

    fs.appendFileSync(
      "video.h264",
      fullFrame
    );



    console.log(
      "✅ Frame saved"
    );



    // CLEAR BUFFER

    frameBuffer.delete(timestamp);
  }
}

// =========================================
// GENERAL ACK
// =========================================

const createGeneralAck = (headerData) => {

  const body = Buffer.alloc(5);

  body.writeUInt16BE(
    headerData.sequence_Number,
    0
  );

  body.writeUInt16BE(
    headerData.msg_ID,
    2
  );

  body.writeUInt8(0x00, 4);



  const header = Buffer.alloc(12);

  header.writeUInt16BE(0x8001, 0);

  header.writeUInt16BE(
    body.length,
    2
  );

  Buffer.from(
    headerData.device_ID,
    "hex"
  ).copy(header, 4);

  header.writeUInt16BE(1, 10);



  const packetWithoutChecksum =
    Buffer.concat([
      header,
      body,
    ]);



  let checksum = 0;

  for (
    let i = 0;
    i < packetWithoutChecksum.length;
    i++
  ) {

    checksum ^=
      packetWithoutChecksum[i];
  }



  const escapedData =
    escapeSendData(

      Buffer.concat([
        packetWithoutChecksum,
        Buffer.from([checksum]),
      ])
    );



  return Buffer.concat([

    Buffer.from([0x7e]),

    escapedData,

    Buffer.from([0x7e]),
  ]);
};

// =========================================
// REGISTRATION RESPONSE
// =========================================

const RegistrationResponse = (
  headerData
) => {

  const authCode = "123456";

  const authBuffer =
    Buffer.from(authCode);



  const body =
    Buffer.alloc(
      3 + authBuffer.length
    );



  body.writeUInt16BE(
    headerData.sequence_Number,
    0
  );

  body.writeUInt8(0x00, 2);

  authBuffer.copy(body, 3);



  const header = Buffer.alloc(12);

  header.writeUInt16BE(0x8100, 0);

  header.writeUInt16BE(
    body.length,
    2
  );

  Buffer.from(
    headerData.device_ID,
    "hex"
  ).copy(header, 4);

  header.writeUInt16BE(1, 10);



  const packetWithoutChecksum =
    Buffer.concat([
      header,
      body,
    ]);



  let checksum = 0;

  for (
    let i = 0;
    i < packetWithoutChecksum.length;
    i++
  ) {

    checksum ^=
      packetWithoutChecksum[i];
  }



  const escapedData =
    escapeSendData(

      Buffer.concat([
        packetWithoutChecksum,
        Buffer.from([checksum]),
      ])
    );



  return Buffer.concat([

    Buffer.from([0x7e]),

    escapedData,

    Buffer.from([0x7e]),
  ]);
};

// =========================================
// SEND 9101 VIDEO REQUEST
// =========================================

const send9101LiveStreamRequest = (
  socket,
  deviceID
) => {

  const body =
    Buffer.alloc(18);

  let offset = 0;



  // CHANGE IP

  body[offset++] = 192;
  body[offset++] = 168;
  body[offset++] = 1;
  body[offset++] = 100;



  // PORT

  body.writeUInt16BE(
    1078,
    offset
  );

  offset += 2;



  // CHANNEL

  body.writeUInt8(1, offset);

  offset += 1;



  // DATA TYPE

  body.writeUInt8(1, offset);

  offset += 1;



  // STREAM TYPE

  body.writeUInt8(0, offset);

  offset += 1;



  // STORAGE TYPE

  body.writeUInt8(0, offset);

  offset += 1;



  body.fill(0x00, offset);



  const header =
    Buffer.alloc(12);

  header.writeUInt16BE(
    0x9101,
    0
  );

  header.writeUInt16BE(
    body.length,
    2
  );

  Buffer.from(
    deviceID,
    "hex"
  ).copy(header, 4);

  header.writeUInt16BE(1, 10);



  const packetWithoutChecksum =
    Buffer.concat([
      header,
      body,
    ]);



  let checksum = 0;

  for (
    let i = 0;
    i < packetWithoutChecksum.length;
    i++
  ) {

    checksum ^=
      packetWithoutChecksum[i];
  }



  const escapedData =
    escapeSendData(

      Buffer.concat([
        packetWithoutChecksum,
        Buffer.from([checksum]),
      ])
    );



  const finalPacket =
    Buffer.concat([

      Buffer.from([0x7e]),

      escapedData,

      Buffer.from([0x7e]),
    ]);



  socket.write(finalPacket);

  console.log(
    "📤 9101 REQUEST SENT"
  );
};

// =========================================
// VERIFY AUTH
// =========================================

const verifyAuthentication = (
  body
) => {

  const auth =
    body.toString();

  return auth === "123456";
};

// =========================================
// EXTRACT 0x7E PACKETS
// =========================================

function extractPackets(buffer) {

  const packets = [];

  let start = -1;

  for (
    let i = 0;
    i < buffer.length;
    i++
  ) {

    if (buffer[i] === 0x7e) {

      if (start === -1) {

        start = i;

      } else {

        packets.push(
          buffer.slice(start, i + 1)
        );

        start = i;
      }
    }
  }



  let remaining;

  if (start !== -1) {

    remaining =
      buffer.slice(start);

  } else {

    remaining = buffer;
  }



  return {

    packets,

    remaining,
  };
}

module.exports = {
  removeDelimeters,

  EscapeData,

  escapeSendData,

  validateChecksum,

  ParseHeader_Data,

  parse1078Body,

  getFragmentType,

  detectFrameType,

  handleVideoPacket,

  createGeneralAck,

  RegistrationResponse,

  send9101LiveStreamRequest,

  verifyAuthentication,

  extractPackets,
};


