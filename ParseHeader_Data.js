const ParseHeader_Data = (packet) => {
    // parse header + body
    const msgID = packet.readUInt16BE(0);
    const properties = packet.readUInt16BE(2);
    const deviceID = packet.slice(4,10).toString('hex');
    const sequence_Number = packet.readUInt16BE(10);
    const body = packet.slice(12);

    return {
        msg_ID: msgID,
        properties: properties,
        deviceID: deviceID, 
        sequence_Number: sequence_Number,
        body: body
    }
}
