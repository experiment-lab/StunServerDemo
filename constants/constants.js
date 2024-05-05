// Constants for STUN server

// Transport address dependency types
const Type = Object.freeze({
    I: "I", // Independent
    PD: "PD", // Port dependent
    AD: "AD", // Address dependent
    APD: "APD", // Address and port dependent
    UNDEF: "UNDEF" // Undefined
});

// Discovery modes
const Mode = Object.freeze({
    FULL: 0, // Performs full NAT type discovery
    NB_ONLY: 1 // NAT binding discovery only
});

// Result codes
const Result = Object.freeze({
    OK: 0, // Successful
    HOST_NOT_FOUND: -1, // Domain does not exist (DNS name resolution failed)
    UDP_BLOCKED: -2, // No reply from server (server may be down)
    NB_INCOMPLETE: -3 // Partial UDP blockage (NB type discovery was incomplete)
});

// Message types as per STUN protocol
const MesgTypes = Object.freeze({
    breq: 0x0001, // Binding Request
    bres: 0x0101, // Binding Response
    berr: 0x0111, // Binding Error Response (Not supported)
    sreq: 0x0002, // Shared Secret Request (Not supported)
    sres: 0x0102, // Shared Secret Response (Not supported)
    serr: 0x0112  // Shared Secret Error Response (Not supported)
});

// Message types as per STUN protocol
const MesgTypesString = Object.freeze({
    breq: 'breq', // Binding Request
    bres: 'bres', // Binding Response

});

// Attribute types as per STUN protocol
const AttrTypes = Object.freeze({
    mappedAddr: 0x0001, // Mapped Address
    respAddr: 0x0002, // Response Address (Not supported)
    changeReq: 0x0003, // Change Request (Not supported)
    sourceAddr: 0x0004, // Source Address
    changedAddr: 0x0005, // Changed Address (Not supported)
    username: 0x0006, // Username (Not supported)
    password: 0x0007, // Password (Not supported)
    msgIntegrity: 0x0008, // Message Integrity (Not supported)
    errorCode: 0x0009, // Error Code (Not supported)
    unknownAttr: 0x000a, // Unknown Attribute (Not supported)
    reflectedFrom: 0x000b, // Reflected From (Not supported)
    xorMappedAddr: 0x0020, // XOR Mapped Address
    timestamp: 0x0032  // Timestamp (Proprietary)
});

// IP families
const Families = Object.freeze({
    ipv4: 0x01 // IPv4
});

module.exports = {
    Type,
    Mode,
    Result,
    MesgTypes,
    AttrTypes,
    Families,
    MesgTypesString
};