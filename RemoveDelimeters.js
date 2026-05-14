const removeDelimeters = (packets) => {
      if(packets[0] == 0x7e){
         packets = packets.slice(1);
      }
      if(packets[packets.length - 1] == 0x7e){
        packets = packets.slice(0,-1);
      }
      return packets;
}

export default removeDelimeters;

// remove 7E delimeters from the packet, return clean packet data