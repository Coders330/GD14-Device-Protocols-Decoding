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
    

    return Buffer.concat([Buffer.from([0x7e]), header, body, checksum, Buffer.from([0x7e])]);

}