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
