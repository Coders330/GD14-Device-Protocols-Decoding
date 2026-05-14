const removeDelimeters = (packets) => {
  
  if (packets[0] == 0x7e) {
    packets = packets.slice(1);
  }
  if (packets[packets.length - 1] == 0x7e) {
    packets = packets.slice(0, -1);
  }
  
  return packets;
};

const ParseHeader_Data = (packet) => {
  // parse header + body
  const msgID = packet.readUInt16BE(0);
  const properties = packet.readUInt16BE(2);
  const deviceID = packet.slice(4, 10).toString("hex");
  const sequence_Number = packet.readUInt16BE(10);
  const body = packet.slice(12);

  return {
    msg_ID: msgID,
    body_length: properties,
    device_ID: deviceID,
    sequence_Number: sequence_Number,
    body: body,
  };
};


function bcdToDecimal(byte) {
  return (byte >> 4) * 10 + (byte & 0x0f);
}

const Parse_MainData = (data) => {
  const alarmFlag = data.readInt32BE(0);
  const status = data.readInt32BE(4);
  const latitude = data.readInt32BE(8) / 1000000;
  const longitude = data.readInt32BE(12) / 1000000;
  const elevation = data.readInt16BE(16);
  const speed = data.readInt16BE(18) / 10;
  const direction = data.readInt16BE(20);
  const year = bcdToDecimal(data.readUInt8(22));
  const month = bcdToDecimal(data.readUInt8(23));
  const day = bcdToDecimal(data.readUInt8(24));

  const hour = bcdToDecimal(data.readUInt8(25));
  const minute = bcdToDecimal(data.readUInt8(26));
  const second = bcdToDecimal(data.readUInt8(27));

const attachments = {};

// attachments start AFTER timestamp
let offset = 28;

while (offset < data.length) {
  const attachmentId = data.readUInt8(offset);
  offset += 1;

  const attachmentLength = data.readUInt8(offset);
  offset += 1;

  const value = data.slice(offset, offset + attachmentLength);

  offset += attachmentLength;

  switch (attachmentId) {
    // =========================
    // 0x01 -> Mileage
    // =========================
    case 0x01:
      attachments.mileage = value.readUInt32BE(0) / 10;

      break;

    // =========================
    // 0x02 -> Fuel
    // =========================
    case 0x02:
      attachments.fuel = value.readUInt16BE(0) / 10;

      break;

    // =========================
    // 0x03 -> Speed
    // =========================
    case 0x03:
      attachments.recordedSpeed = value.readUInt16BE(0) / 10;

      break;

    // =========================
    // 0x25 -> Extended Status
    // =========================
    case 0x25:
      attachments.extendedStatus = value.readUInt32BE(0);

      break;

    // =========================
    // 0x2A -> IO Status
    // =========================
    case 0x2a:
      attachments.ioStatus = value.readUInt16BE(0);

      break;

    // =========================
    // 0x2B -> Analog Quantity
    // =========================
    case 0x2b:
      attachments.analogQuantity = value.toString("hex");

      break;

    // =========================
    // 0x30 -> GSM Signal
    // =========================
    case 0x30:
      attachments.gsmSignal = value.readUInt8(0);

      break;

    // =========================
    // 0x31 -> Satellite Count
    // =========================
    case 0x31:
      attachments.satelliteCount = value.readUInt8(0);

      break;

    // =========================
    // UNKNOWN ATTACHMENT
    // =========================
    default:
      attachments[`unknown_0x${attachmentId.toString(16)}`] =
        value.toString("hex");
  }
}
  // const timestamp = parseTimestamp(data.slice(22, 28));
  return {
    alarmFlag,
    status,
    latitude,
    longitude,
    elevation,
    speed,
    direction,
    year,
    month,
    day,
    hour,
    minute,
    second,
    attachments
  
  };
};


const EscapeData = (packet) => {
  let unescaped = [];
  let i = 0;
  while (i < packet.length) {
    if (packet[i] == 0x7d) {
      if (packet[i + 1] == 0x02) {
        unescaped.push(0x7e);
        i += 2;
      } else if (packet[i + 1] == 0x01) {
        unescaped.push(0x7d);
        i += 2;
      }
      else{
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

const validateChecksum = (packet) => {
  const checksum = packet[packet.length - 1];
  const dataWithoutChecksum = packet.slice(0, -1);
  
  // console.log("Data without checksum: ", dataWithoutChecksum.toString("hex"));
  let calculatedChecksum = 0x00;
  
    for(let i=0;i<dataWithoutChecksum.length;i++){
     calculatedChecksum = calculatedChecksum ^ dataWithoutChecksum[i];
     console.log(`Byte ${i}: ${dataWithoutChecksum[i].toString(16)}`);
    }
    console.log("Calulated checksum: ", calculatedChecksum.toString(16));
  return {
    valid: calculatedChecksum.toString(16) === checksum.toString(16),
    data: dataWithoutChecksum,
  };
};


const Acknwledgment = (header_Data) => {
  const body = Buffer.alloc(5);
  const header = Buffer.alloc(12);
  const checksum = Buffer.alloc(1);

  body.writeUInt16BE(header_Data.sequence_Number, 0);
  body.writeUInt16BE(header_Data.msg_ID, 2);
  body.writeUInt8(0, 4);

  header.writeUInt16BE(0x8001, 0); // response message ID
  header.writeUInt16BE(0x0005, 2); // properties (body length)
  Buffer.from(header_Data.device_ID, "hex").copy(header, 4);
  header.writeUInt16BE(1, 10);

  let temp = Buffer.concat([header, body]);

  let checksumc = 0;

  for (let i = 0; i < temp.length; i++) {
    checksumc ^= temp[i];
  }
  checksum.writeUInt8(checksumc, 0);
  let send_ack_packet = Buffer.concat([header, body, checksum]);
  console.log("Acknowledgment Packet: ", send_ack_packet.toString("hex"));
  return Buffer.concat([
    Buffer.from([0x7e]),
    header,
    body,
    checksum,
    Buffer.from([0x7e]),
  ]);
};


const RegistrationResponse = (header_Data) => {
  /*
    ====================================
    AUTH CODE  
    ====================================
    */

  const authCode = "ABC123";

  const authBuffer = Buffer.from(authCode);

  /*
    ====================================
    BODY
    ====================================

    2 bytes -> original seq
    1 byte  -> result
    n bytes -> auth code

    ====================================
    */

  const body = Buffer.alloc(2 + 1 + authBuffer.length);

  /*
    ------------------------------------
    ORIGINAL REGISTRATION SEQUENCE
    ------------------------------------
    */

  body.writeUInt16BE(header_Data.sequence_Number, 0);

  /*
    ------------------------------------
    RESULT

    0 = SUCCESS
    ------------------------------------
    */

  body.writeUInt8(0, 2);

  /*
    ------------------------------------
    AUTH CODE
    ------------------------------------
    */

  authBuffer.copy(body, 3);

  /*
    ====================================
    HEADER
    ====================================
    */

  const header = Buffer.alloc(12);

  /*
    ------------------------------------
    MESSAGE ID = 0x8100
    ------------------------------------
    */

  header.writeUInt16BE(0x8100, 0);

  /*
    ------------------------------------
    BODY LENGTH
    ------------------------------------
    */

  header.writeUInt16BE(body.length, 2);

  /*
    ------------------------------------
    DEVICE ID
    ------------------------------------
    */

  Buffer.from(header_Data.device_ID, "hex").copy(header, 4);

  /*
    ------------------------------------
    SERVER SEQUENCE NUMBER
    ------------------------------------
    */

  header.writeUInt16BE(1, 10);

  /*
    ====================================
    HEADER + BODY
    ====================================
    */

  let packet = Buffer.concat([header, body]);

  /*
    ====================================
    CHECKSUM
    ====================================
    */

  let checksum = 0;

  for (let i = 0; i < packet.length; i++) {
    checksum ^= packet[i];
  }

  /*
    ====================================
    ADD CHECKSUM
    ====================================
    */

  packet = Buffer.concat([packet, Buffer.from([checksum])]);

  /*
    ====================================
    ADD DELIMITERS
    ====================================
    */

  packet = Buffer.concat([Buffer.from([0x7e]), packet, Buffer.from([0x7e])]);

  /*
    ====================================
    RETURN FINAL PACKET
    ====================================
    */

  return packet;
};

function createGeneralResponse(header) {
  const body = Buffer.alloc(5);

  // Reply sequence number
  body.writeUInt16BE(header.sequence_Number, 0);

  // Original message ID
  body.writeUInt16BE(header.msg_ID, 2);

  // Result
  body.writeUInt8(0x00, 4); // success

  // Message properties
  const bodyLength = body.length;

  const packet = Buffer.alloc(1 + 2 + 2 + 6 + 2 + body.length + 1 + 1);

  let offset = 0;

  // Start flag
  packet.writeUInt8(0x7e, offset++);

  // Message ID = 0x8001
  packet.writeUInt16BE(0x8001, offset);
  offset += 2;

  // Properties
  packet.writeUInt16BE(bodyLength, offset);
  offset += 2;

  // Device ID / terminal phone number
  Buffer.from(header.device_ID, "hex").copy(packet, offset);
  offset += 6;

  // Sequence number
  packet.writeUInt16BE(1, offset);
  offset += 2;

  // Body
  body.copy(packet, offset);
  offset += body.length;

  // XOR checksum
  let checksum = 0;

  for (let i = 1; i < offset; i++) {
    checksum ^= packet[i];
  }

  packet.writeUInt8(checksum, offset++);

  // End flag
  packet.writeUInt8(0x7e, offset++);

  return packet;
}


module.exports = {
  removeDelimeters,
  EscapeData,
  validateChecksum,
  ParseHeader_Data,
  Parse_MainData,
  Acknwledgment,
  RegistrationResponse,
  createGeneralResponse,
};

