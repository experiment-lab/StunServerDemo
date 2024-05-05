const dgram = require('dgram');
const EventEmitter = require('events').EventEmitter;
const Message = require('./messagePacket/Message');
const Constant = require('./constants/constants');
const Utils = require('./utils/utils');

const MAGIC_COOKIE = 0x2112A442;

class StunServer extends EventEmitter {
    constructor() {
        super();
        this.socket = dgram.createSocket('udp4');
        this.magicCookie = 0x2112A442;
    }

    start(port) {
        this.socket.on('error', (err) => {
            console.log(`Server error:\n${err.stack}`);
            this.socket.close();
        });

        this.socket.on('message', (msg, rinfo) => {
            console.log(`Server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
            this.handleMessage(msg, rinfo);
        });

        this.socket.on('listening', () => {
            const address = this.socket.address();
            console.log(`Server listening ${address.address}:${address.port}`);
        });

        this.socket.bind(port);
    }

    handleMessage(msg, rinfo) {
        const magicCookie = msg.readUInt32BE(4);
        this.magicCookie = magicCookie;
        const message = new Message();
        try {
            console.log("[handling][Message]", message.getType());
            message.deserialize(msg);

            const msgType = msg.readUInt16BE(0);
            const msgLength = msg.readUInt16BE(2);
            const magicCookie = msg.readUInt32BE(4);
            const transactionId = msg.slice(8, 20);

            console.log("[Header]", msgType, msgLength, magicCookie, transactionId);
            
            if (message.getType() === Constant.MesgTypesString.breq) {
                console.log("[start]");
                const response = this.createResponse(message, rinfo);
                this.socket.send(response, rinfo.port, rinfo.address, (err) => {
                    if (err) {
                        console.log("[Error]", err);
                    } else {
                        console.log(`Response sent to ${rinfo.address}:${rinfo.port}`);
                    }
                });
                console.log("[handled][Message]");
            }
        } catch (error) {
            console.log(`Failed to handle message: ${error}`);
        }
    }

    createResponse(message, rinfo) {
        const response = new Message();
        console.log("[creating][Response]");
        response.setType(Constant.MesgTypesString.bres);
        response.setTransactionId(message.getTransactionId());

        response.addAttribute('mappedAddr', {
            family: 'ipv4',
            port: rinfo.port,
            addr: rinfo.address
        });

        // const numAddr = parseInt(rinfo.address.split('.').map(Number).join(''), 10);
        const numAddr = Utils.inetAton(rinfo.address);

        response.addAttribute('xorMappedAddr', {
            family: 'ipv4',
            port: rinfo.port ^ (this.magicCookie >> 16),
            addr: numAddr ^ this.magicCookie
        });
        // Add other attributes as needed

        // Add timestamp if existed in the request.
        const messageTime = message.getAttribute('timestamp');
        if(messageTime && messageTime.timestamp){
            response.addAttribute('timestamp', {
                'resDelay' : ((Date.now() - rcvdAt) & 0xffff),
                'timestamp': messageTime.timestamp
            });
        }

        // Add source address.
        response.addAttribute('sourceAddr', {
            'family': 'ipv4',
            'port': this.socket.address().port,
            'addr': this.socket.address().address
        });
        console.log("[created][Response]");

        return response.serialize();
    }

    stop() {
        this.socket.close();
    }
}

// Usage
const stunServer = new StunServer();
stunServer.start(3478); // STUN default port

// Handle graceful shutdown
process.on('SIGINT', () => {
    stunServer.stop();
    process.exit();
});
