const EscapeData = (packet) => {
  let unescaped = [];
  let i = 0;
  while(i < packet.length){
     if(packet[i] == 0x7d){
        if(packet[i+1] == 0x02){
           unescaped.push(0x7e);
           i+=2;
        }
        else if(packet[i+1] == 0x01){
           unescaped.push(0x7d);
           i+=2;
        }
     }
      else{
        unescaped.push(packet[i]);
        i++;
      }
  }
  
  return Buffer.from(unescaped);
}

