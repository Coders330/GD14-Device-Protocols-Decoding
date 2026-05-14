package main

import (
	"fmt"
	"net"
)

func main() {
	conn, err := net.Dial("tcp", "127.0.0.1:808")
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer conn.Close()

	fmt.Println("✅ Connected to server")

	// Sample JT808 packet
	packet := []byte{
		0x7e, 0x01, 0x00, 0x00, 0x2f,
		0x01, 0x34, 0x56, 0x78, 0x90, 0x12,
		0x00, 0x01,
		0x7e,
	}

	conn.Write(packet)
	fmt.Println("📦 Packet sent")
}

