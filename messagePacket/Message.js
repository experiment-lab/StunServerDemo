'use strict';

const Utils = require('../utils/utils');
const Const = require('../constants/constants');

const HEADER_SIZE = 20;

class Message {
    constructor() {
        this._type = Const.MesgTypes.breq;
        this._tid = null;
        this._attrs = [];
    }

    static _checkAttrAddr(value) {
        const { family = 'ipv4', port, addr } = value;
        if (port === undefined) {
            throw new Error('Port is undefined');
        }
        if (addr === undefined) {
            throw new Error('Address is undefined');
        }
    }

    static _getMesgTypeByVal(val) {
        const type = Object.keys(Const.MesgTypes).find(key => Const.MesgTypes[key] === val);
        if (!type) {
            throw new Error(`Type undefined: ${val}`);
        }
        return type;
    }

    static _getAttrTypeByVal(val) {
        const type = Object.keys(Const.AttrTypes).find(key => Const.AttrTypes[key] === val);
        if (!type) {
            throw new Error(`Unknown attr value: ${val}`);
        }
        return type;
    }

    static _readAddr(ctx) {
        ctx.pos++; // skip first byte
        const familyCode = ctx.buf[ctx.pos++];
        const family = Object.keys(Const.Families).find(key => Const.Families[key] === familyCode);
        if (!family) {
            throw new Error(`Unsupported family: ${familyCode}`);
        }
        const port = ctx.buf.readUInt16BE(ctx.pos);
        ctx.pos += 2;
        const addr = ctx.buf.readUInt32BE(ctx.pos);
        ctx.pos += 4;
        return { 'family': family, 'port': port, 'addr': Utils.inetNtoa(addr) };
    }

    static _writeAddr(ctx, code, attrVal) {
        if (ctx.buf.length < ctx.pos + 12) {
            throw new Error('Insufficient buffer');
        }
        ctx.buf.writeUInt16BE(code, ctx.pos);
        ctx.pos += 2;
        ctx.buf.writeUInt16BE(0x0008, ctx.pos); // attribute value length
        ctx.pos += 2;
        ctx.buf[ctx.pos++] = 0x00; // first byte of family
        ctx.buf[ctx.pos++] = Const.Families[attrVal.family];
        ctx.buf.writeUInt16BE(attrVal.port, ctx.pos);
        ctx.pos += 2;
        const addr = Utils.inetAton(attrVal.addr);
        // console.log("addr", addr);
        ctx.buf.writeUInt32BE(addr, ctx.pos);
        ctx.pos += 4;
    }
    static _writeXorAddr(ctx, code, attrVal) {
        if (ctx.buf.length < ctx.pos + 12) {
            throw new Error('Insufficient buffer');
        }
        ctx.buf.writeUInt16BE(code, ctx.pos);
        ctx.pos += 2;
        ctx.buf.writeUInt16BE(0x0008, ctx.pos); // attribute value length
        ctx.pos += 2;
        ctx.buf[ctx.pos++] = 0x00; // first byte of family
        ctx.buf[ctx.pos++] = Const.Families[attrVal.family];
        ctx.buf.writeUInt16BE(attrVal.port, ctx.pos);
        ctx.pos += 2;
        ctx.buf.writeUInt32BE(attrVal.addr, ctx.pos);
        ctx.pos += 4;
    }

    static _readChangeReq(ctx) {
        ctx.pos += 3; // skip header
        const flags = ctx.buf[ctx.pos++];
        return {
            'changeIp': Boolean(flags & 0x4),
            'changePort': Boolean(flags & 0x2)
        };
    }

    static _writeChangeReq(ctx, attrVal) {
        if (ctx.buf.length < ctx.pos + 8) {
            throw new Error('Insufficient buffer');
        }
        ctx.buf.writeUInt16BE(Const.AttrTypes.changeReq, ctx.pos);
        ctx.pos += 2;
        ctx.buf.writeUInt16BE(0x0004, ctx.pos); // attribute value length
        ctx.pos += 2;
        ctx.buf.writeUInt32BE(((attrVal.changeIp) ? 0x4 : 0x0) | ((attrVal.changePort) ? 0x2 : 0x0), ctx.pos);
        ctx.pos += 4;
    }

    static _readTimestamp(ctx) {
        ctx.pos += 3; // skip header
        const respDelay = ctx.buf.readUInt16BE(ctx.pos);
        ctx.pos += 2;
        const timestamp = ctx.buf.readUInt16BE(ctx.pos);
        ctx.pos += 2;
        return { 'respDelay': respDelay, 'timestamp': timestamp };
    }

    static _writeTimestamp(ctx, attrVal) {
        if (ctx.buf.length < ctx.pos + 8) {
            throw new Error('Insufficient buffer');
        }
        ctx.buf.writeUInt16BE(Const.AttrTypes.timestamp, ctx.pos);
        ctx.pos += 2;
        ctx.buf.writeUInt16BE(0x0004, ctx.pos); // attribute value length
        ctx.pos += 2;
        ctx.buf.writeUInt16BE(attrVal.respDelay, ctx.pos);
        ctx.pos += 2;
        ctx.buf.writeUInt16BE(attrVal.timestamp, ctx.pos);
        ctx.pos += 2;
    }

    init() {
        this._type = Const.MesgTypes.breq;
        this._attrs = [];
    }

    setType(type) {
        const messageType = Const.MesgTypes[type];
        if (messageType === undefined) {
            throw new RangeError(`Unknown message type: ${type}`);
        }
        this._type = messageType;
    }

    getType() {
        return this.constructor._getMesgTypeByVal(this._type);
    }

    setTransactionId(tid) {
        this._tid = tid;
    }

    getTransactionId() {
        return this._tid;
    }

    addAttribute(attrType, attrVal) {
        const code = Const.AttrTypes[attrType];
        if (code === undefined) {
            throw new RangeError(`Unknown attribute type: ${attrType}`);
        }
        this.constructor._checkAttrAddr(attrVal);
        for (let i = 0; i < this._attrs.length; ++i) {
            if (this._attrs[i].type === attrType) {
                this._attrs[i].value = attrVal;
                return;
            }
        }
        this._attrs.push({ type: attrType, value: attrVal });
    }

    getAttributes() {
        return this._attrs;
    }

    getAttribute(attrType) {
        const attr = this._attrs.find(attr => attr.type === attrType);
        return attr ? attr.value : null;
    }

    getLength() {
        let len = HEADER_SIZE; // header size (fixed)
        this._attrs.forEach(attr => {
            const code = Const.AttrTypes[attr.type];
            if (code === undefined) {
                throw new RangeError(`Unknown attribute type: ${attr.type}`);
            }
            switch (code) {
                case 0x0001: // mappedAddr
                case 0x0002: // respAddr
                case 0x0004: // sourceAddr
                case 0x0005: // changedAddr
                case 0x0020: // xorMappedAddr
                    len += 12;
                    break;
                case 0x0003: // changeReq
                case 0x0032: // timestamp
                    len += 8;
                    break;
                default:
                    throw new Error(`Unsupported attribute: ${attr.type}`);
            }
        });
        return len;
    }

    serialize() {
        const buffer = Buffer.alloc(this.getLength());
        let pos = 0;
        buffer.writeUInt16BE(this._type, pos);
        pos += 2;
        buffer.writeUInt16BE(buffer.length - HEADER_SIZE, pos);
        pos += 2;
        if (!this._tid || this._tid.length !== 16) {
            throw new Error('Incorrect transaction ID');
        }
        Buffer.from(this._tid).copy(buffer, pos);
        pos += 16;
        // console.log("[Attri]", this._attrs[0]);
        this._attrs.forEach(attr => {
            console.log("[Attri]", attr);
            const code = Const.AttrTypes[attr.type];
            if (code < 0 || code === undefined) {
                throw new RangeError(`Unknown attribute type: ${attr.type}`);
            }

            const ctx = { buf: buffer, pos: pos };
            // Append attribute value _writeXorAddr
            switch (code) {
                case 0x0020: // xorMappedAddr
                    this.constructor._writeXorAddr(ctx, code, attr.value);
                    break;
                case 0x0001: // mappedAddr
                case 0x0002: // respAddr
                case 0x0004: // sourceAddr
                case 0x0005: // changedAddr
                    this.constructor._writeAddr(ctx, code, attr.value);
                    break;
                case 0x0003: // changeReq
                    this.constructor._writeChangeReq(ctx, attr.value);
                    break;
                case 0x0032: // timestamp
                    this.constructor._writeTimestamp(ctx, attr.value);
                    break;
                case 0x0006: // username
                case 0x0007: // password
                case 0x0008: // msgIntegrity
                case 0x0009: // errorCode
                case 0x000a: // unknownAttr
                case 0x000b: // reflectedFrom
                default:
                    throw new Error("Unsupported attribute");
            }

            pos = ctx.pos;
        });
        return buffer;
    }

    deserialize(buffer) {
        let pos = 0;
        this._type = buffer.readUInt16BE(pos);
        pos += 2;
        const len = buffer.readUInt16BE(pos);
        pos += 2;
        this._tid = buffer.slice(pos, pos + 16);
        pos += 16;
        if (buffer.length - HEADER_SIZE !== len) {
            throw new Error('Malformed data');
        }
        // Read attributes
        while (pos < buffer.length) {
            const code = buffer.readUInt16BE(pos);
            pos += 2;
            const attrLen = buffer.readUInt16BE(pos);
            pos += 2;

            if (buffer.length - pos < attrLen) {
                throw new Error(`Malformed data: code=${code} rem=${buffer.length - pos} len=${attrLen}`);
            }
            let ctx = { buf: buffer, pos: pos };
            let attrVal;
            switch (code) {
                case 0x0001: // mappedAddAr
                case 0x0002: // respAddr
                case 0x0004: // sourceAddr
                case 0x0005: // changedAddr
                    if (attrLen != 8) throw new Error("Malformed data");
                    attrVal = this.constructor._readAddr(ctx);
                    break;
                case 0x0003: // changeReq
                    if (attrLen != 4) throw new Error("Malformed data");
                    attrVal = this.constructor._readChangeReq(ctx);
                    break;
                case 0x0032: // xorMappedAddr
                    if (attrLen != 8) throw new Error("Malformed data");
                    attrVal = this.constructor._readTimestamp(ctx);
                    break;
                case 0x0006: // username
                case 0x0007: // password
                case 0x0008: // msgIntegrity
                case 0x0009: // errorCode
                case 0x000a: // unknownAttr
                case 0x000b: // reflectedFrom
                default:
                    ctx.pos += attrLen;
                    continue;
            }

            this._attrs.push({ type: Message._getAttrTypeByVal(code), value: attrVal });
        }
    }
}

module.exports = Message;