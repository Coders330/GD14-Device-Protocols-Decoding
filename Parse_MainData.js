const Parse_MainData = (data) => {
    const alarmFlag = data.readINT32BE(0);
    const status = data.readINT32BE(4);
    const latitude = data.readINT32BE(8) / 1000000;
    const longitude = data.readINT32BE(12) / 1000000;
    const elevation = data.readINT16BE(16);
    const speed = data.readINT16BE(18) / 10;
    const direction = data.readINT16BE(20);
    const timestamp = parseTimestamp(data.slice(22, 28));
    return {
        alarmFlag,
        status,
        latitude,
        longitude,
        elevation,
        speed,
        direction,
        timestamp
    };

}