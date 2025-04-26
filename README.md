# 🌐 StunServerDemo – Simplified Java STUN Server

**StunServerDemo** is a lightweight implementation of a STUN (Session Traversal Utilities for NAT) server written in Nodejs and javaScript. It helps clients determine their **public IP address and port** as seen from the outside network, making it useful in **NAT traversal** scenarios such as WebRTC and peer-to-peer (P2P) applications.

---

## 🔧 Features

- 📡 **STUN Protocol Support**: Implements the basic **Binding Request** mechanism as described in [RFC 5389](https://tools.ietf.org/html/rfc5389).
- 🧪 **Educational & Debug-Friendly**: Console-based logs for each request/response pair help understand STUN message flow.
- ⚙️ **Minimal Setup**: No third-party libraries—just plain Npm packages and sockets.
- 🧰 **Ideal for Testing**: Suitable for debugging connectivity issues, WebRTC testing, or building a deeper understanding of NAT behavior.

---

## 🛠️ Technologies Used

- **UDP Server**: Uses `DatagramSocket` and `DatagramPacket` for low-level UDP communication.
- **WebRTC Concepts**: STUN is integral to peer connection setup in WebRTC.
- **STUN Protocol Parsing**: Parses incoming STUN requests and returns appropriate responses.
- **JavaScript / Node.js**: Companion client-side examples or integration support.

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/experiment-lab/StunServerDemo.git
cd StunServerDemo
