// ScratchExtension for Tuio Support
// @author: caesarion
// https://github.com/caesarion/Scratch4TuioExtension/tree/gh-pages

// ----------------------------------------------------------------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------------------------------------------------------------
// ----------- start libraries' code
if(typeof window.extensionWasLoaded == 'undefined') {
    /*
     * osc.js: An Open Sound Control library for JavaScript that works in both the browser and Node.js
     *
     * Copyright 2014, Colin Clark
     * Licensed under the MIT and GPL 3 licenses.
     */

    /* global require, module, Buffer */

    var osc = osc || {};

    (function () {

        "use strict";

        // Private instance of the buffer-dataview object.
        // Only used if we're in Node.js.
        var BufferDataView;

        osc.SECS_70YRS = 2208988800;
        osc.TWO_32 = 4294967296;

        osc.defaults = {
            metadata: false,
            unpackSingleArgs: true
        };

        // A flag to tell us if we're in a Node.js-compatible environment with Buffers,
        // which we will assume are faster.
        // Unsupported, non-API property.
        osc.isBufferEnv = typeof Buffer !== "undefined";

        // Unsupported, non-API function.
        osc.isArray = function (obj) {
            return obj && Object.prototype.toString.call(obj) === "[object Array]";
        };

        // Unsupported, non-API function
        osc.isTypedArrayView = function (obj) {
            return obj.buffer && obj.buffer instanceof ArrayBuffer;
        };

        // Unsupported, non-API function
        osc.isBuffer = function (obj) {
            return osc.isBufferEnv && obj instanceof Buffer;
        };


        /**
         * Wraps the specified object in a DataView.
         *
         * @param {Array-like} obj the object to wrap in a DataView instance
         * @return {DataView} the DataView object
         */
            // Unsupported, non-API function.
        osc.dataView = function (obj) {
            if (obj instanceof DataView) {
                return obj;
            }

            // Node.js-specific.
            if (typeof BufferDataView !== "undefined" && obj instanceof BufferDataView) {
                return obj;
            }

            // Node.js-specific.
            if (osc.isBufferEnv && obj instanceof Buffer) {
                return new BufferDataView(obj);
            }

            if (obj.buffer) {
                return new DataView(obj.buffer);
            }

            if (obj instanceof ArrayBuffer) {
                return new DataView(obj);
            }

            return new DataView(new Uint8Array(obj));
        };

        /**
         * Takes an ArrayBuffer, TypedArray, DataView, Node.js Buffer, or array-like object
         * and returns a Uint8Array view of it.
         *
         * Throws an error if the object isn't suitably array-like.
         *
         * @param {Array-like or Array-wrapping} obj an array-like or array-wrapping object
         * @returns {Uint8Array} a typed array of octets
         */
            // Unsupported, non-API function.
        osc.byteArray = function (obj) {
            if (obj instanceof Uint8Array) {
                return obj;
            }

            var buf = obj.buffer ? obj.buffer : obj;

            if (typeof obj.length === "undefined" || typeof obj === "string") {
                throw new Error("Can't wrap a non-array-like object as Uint8Array. Object was: " +
                    JSON.stringify(obj, null, 2));
            }

            return new Uint8Array(buf);
        };

        // Unsupported, non-API function.
        osc.makeByteArray = function (len) {
            return osc.isBufferEnv ? new Buffer(len) : new Uint8Array(len);
        };

        // Unsupported, non-API function
        osc.copyByteArray = function (source, target, offset) {
            if (osc.isTypedArrayView(source) && osc.isTypedArrayView(target)) {
                target.set(source, offset);
            } else if (osc.isBuffer(source) && osc.isBuffer(target)) {
                source.copy(target, offset);
            } else {
                var start = offset === undefined ? 0 : offset,
                    len = Math.min(target.length - offset, source.length);

                for (var i = 0, j = start; i < len; i++, j++) {
                    target[j] = source[i];
                }
            }

            return target;
        };

        /**
         * Reads an OSC-formatted string.
         *
         * @param {DataView} dv a DataView containing the raw bytes of the OSC string
         * @param {Object} offsetState an offsetState object used to store the current offset index
         * @return {String} the JavaScript String that was read
         */
        osc.readString = function (dv, offsetState) {
            var charCodes = [],
                idx = offsetState.idx;

            for (; idx < dv.byteLength; idx++) {
                var charCode = dv.getUint8(idx);
                if (charCode !== 0) {
                    charCodes.push(charCode);
                } else {
                    idx++;
                    break;
                }
            }

            // Round to the nearest 4-byte block.
            idx = (idx + 3) & ~0x03;
            offsetState.idx = idx;

            return String.fromCharCode.apply(null, charCodes);
        };

        /**
         * Writes a JavaScript string as an OSC-formatted string.
         *
         * @param {String} str the string to write
         * @return {Uint8Array} a buffer containing the OSC-formatted string
         */
        osc.writeString = function (str) {
            var terminated = str + "\u0000",
                len = terminated.length,
                paddedLen = (len + 3) & ~0x03,
                arr = new Uint8Array(paddedLen);

            for (var i = 0; i < terminated.length; i++) {
                var charCode = terminated.charCodeAt(i);
                arr[i] = charCode;
            }

            return arr;
        };

        // Unsupported, non-API function.
        osc.readPrimitive = function (dv, readerName, numBytes, offsetState) {
            var val = dv[readerName](offsetState.idx, false);
            offsetState.idx += numBytes;

            return val;
        };

        // Unsupported, non-API function.
        osc.writePrimitive = function (val, dv, writerName, numBytes, offset) {
            offset = offset === undefined ? 0 : offset;

            var arr;
            if (!dv) {
                arr = new Uint8Array(numBytes);
                dv = new DataView(arr.buffer);
            } else {
                arr = new Uint8Array(dv.buffer);
            }

            dv[writerName](offset, val, false);

            return arr;
        };

        /**
         * Reads an OSC int32 ("i") value.
         *
         * @param {DataView} dv a DataView containing the raw bytes
         * @param {Object} offsetState an offsetState object used to store the current offset index into dv
         * @return {Number} the number that was read
         */
        osc.readInt32 = function (dv, offsetState) {
            return osc.readPrimitive(dv, "getInt32", 4, offsetState);
        };

        /**
         * Writes an OSC int32 ("i") value.
         *
         * @param {Number} val the number to write
         * @param {DataView} [dv] a DataView instance to write the number into
         * @param {Number} [offset] an offset into dv
         */
        osc.writeInt32 = function (val, dv, offset) {
            return osc.writePrimitive(val, dv, "setInt32", 4, offset);
        };

        /**
         * Reads an OSC float32 ("f") value.
         *
         * @param {DataView} dv a DataView containing the raw bytes
         * @param {Object} offsetState an offsetState object used to store the current offset index into dv
         * @return {Number} the number that was read
         */
        osc.readFloat32 = function (dv, offsetState) {
            return osc.readPrimitive(dv, "getFloat32", 4, offsetState);
        };

        /**
         * Writes an OSC float32 ("f") value.
         *
         * @param {Number} val the number to write
         * @param {DataView} [dv] a DataView instance to write the number into
         * @param {Number} [offset] an offset into dv
         */
        osc.writeFloat32 = function (val, dv, offset) {
            return osc.writePrimitive(val, dv, "setFloat32", 4, offset);
        };

        /**
         * Reads an OSC float64 ("d") value.
         *
         * @param {DataView} dv a DataView containing the raw bytes
         * @param {Object} offsetState an offsetState object used to store the current offset index into dv
         * @return {Number} the number that was read
         */
        osc.readFloat64 = function (dv, offsetState) {
            return osc.readPrimitive(dv, "getFloat64", 8, offsetState);
        };

        /**
         * Writes an OSC float64 ("d") value.
         *
         * @param {Number} val the number to write
         * @param {DataView} [dv] a DataView instance to write the number into
         * @param {Number} [offset] an offset into dv
         */
        osc.writeFloat64 = function (val, dv, offset) {
            return osc.writePrimitive(val, dv, "setFloat64", 8, offset);
        };

        /**
         * Reads an OSC 32-bit ASCII character ("c") value.
         *
         * @param {DataView} dv a DataView containing the raw bytes
         * @param {Object} offsetState an offsetState object used to store the current offset index into dv
         * @return {String} a string containing the read character
         */
        osc.readChar32 = function (dv, offsetState) {
            var charCode = osc.readPrimitive(dv, "getUint32", 4, offsetState);
            return String.fromCharCode(charCode);
        };

        /**
         * Writes an OSC 32-bit ASCII character ("c") value.
         *
         * @param {String} str the string from which the first character will be written
         * @param {DataView} [dv] a DataView instance to write the character into
         * @param {Number} [offset] an offset into dv
         * @return {String} a string containing the read character
         */
        osc.writeChar32 = function (str, dv, offset) {
            var charCode = str.charCodeAt(0);
            if (charCode === undefined || charCode < -1) {
                return undefined;
            }

            return osc.writePrimitive(charCode, dv, "setUint32", 4, offset);
        };

        /**
         * Reads an OSC blob ("b") (i.e. a Uint8Array).
         *
         * @param {DataView} dv a DataView instance to read from
         * @param {Object} offsetState an offsetState object used to store the current offset index into dv
         * @return {Uint8Array} the data that was read
         */
        osc.readBlob = function (dv, offsetState) {
            var len = osc.readInt32(dv, offsetState),
                paddedLen = (len + 3) & ~0x03,
                blob = new Uint8Array(dv.buffer, offsetState.idx, len);

            offsetState.idx += paddedLen;

            return blob;
        };

        /**
         * Writes a raw collection of bytes to a new ArrayBuffer.
         *
         * @param {Array-like} data a collection of octets
         * @return {ArrayBuffer} a buffer containing the OSC-formatted blob
         */
        osc.writeBlob = function (data) {
            data = osc.byteArray(data);

            var len = data.byteLength,
                paddedLen = (len + 3) & ~0x03,
                offset = 4, // Extra 4 bytes is for the size.
                blobLen = paddedLen + offset,
                arr = new Uint8Array(blobLen),
                dv = new DataView(arr.buffer);

            // Write the size.
            osc.writeInt32(len, dv);

            // Since we're writing to a real ArrayBuffer,
            // we don't need to pad the remaining bytes.
            arr.set(data, offset);

            return arr;
        };

        /**
         * Reads an OSC 4-byte MIDI message.
         *
         * @param {DataView} dv the DataView instance to read from
         * @param {Object} offsetState an offsetState object used to store the current offset index into dv
         * @return {Uint8Array} an array containing (in order) the port ID, status, data1 and data1 bytes
         */
        osc.readMIDIBytes = function (dv, offsetState) {
            var midi = new Uint8Array(dv.buffer, offsetState.idx, 4);
            offsetState.idx += 4;

            return midi;
        };

        /**
         * Writes an OSC 4-byte MIDI message.
         *
         * @param {Array-like} bytes a 4-element array consisting of the port ID, status, data1 and data1 bytes
         * @return {Uint8Array} the written message
         */
        osc.writeMIDIBytes = function (bytes) {
            bytes = osc.byteArray(bytes);

            var arr = new Uint8Array(4);
            arr.set(bytes);

            return arr;
        };

        /**
         * Reads an OSC RGBA colour value.
         *
         * @param {DataView} dv the DataView instance to read from
         * @param {Object} offsetState an offsetState object used to store the current offset index into dv
         * @return {Object} a colour object containing r, g, b, and a properties
         */
        osc.readColor = function (dv, offsetState) {
            var bytes = new Uint8Array(dv.buffer, offsetState.idx, 4),
                alpha = bytes[3] / 255;

            offsetState.idx += 4;

            return {
                r: bytes[0],
                g: bytes[1],
                b: bytes[2],
                a: alpha
            };
        };

        /**
         * Writes an OSC RGBA colour value.
         *
         * @param {Object} color a colour object containing r, g, b, and a properties
         * @return {Uint8Array} a byte array containing the written color
         */
        osc.writeColor = function (color) {
            var alpha = Math.round(color.a * 255),
                arr = new Uint8Array([color.r, color.g, color.b, alpha]);

            return arr;
        };

        /**
         * Reads an OSC true ("T") value by directly returning the JavaScript Boolean "true".
         */
        osc.readTrue = function () {
            return true;
        };

        /**
         * Reads an OSC false ("F") value by directly returning the JavaScript Boolean "false".
         */
        osc.readFalse = function () {
            return false;
        };

        /**
         * Reads an OSC nil ("N") value by directly returning the JavaScript "null" value.
         */
        osc.readNull = function () {
            return null;
        };

        /**
         * Reads an OSC impulse/bang/infinitum ("I") value by directly returning 1.0.
         */
        osc.readImpulse = function () {
            return 1.0;
        };

        /**
         * Reads an OSC time tag ("t").
         *
         * @param {DataView} dv the DataView instance to read from
         * @param {Object} offsetState an offset state object containing the current index into dv
         * @param {Object} a time tag object containing both the raw NTP as well as the converted native (i.e. JS/UNIX) time
         */
        osc.readTimeTag = function (dv, offsetState) {
            var secs1900 = osc.readPrimitive(dv, "getUint32", 4, offsetState),
                frac = osc.readPrimitive(dv, "getUint32", 4, offsetState),
                native = (secs1900 === 0 && frac === 1) ? Date.now() : osc.ntpToJSTime(secs1900, frac);

            return {
                raw: [secs1900, frac],
                native: native
            };
        };

        /**
         * Writes an OSC time tag ("t").
         *
         * Takes, as its argument, a time tag object containing either a "raw" or "native property."
         * The raw timestamp must conform to the NTP standard representation, consisting of two unsigned int32
         * values. The first represents the number of seconds since January 1, 1900; the second, fractions of a second.
         * "Native" JavaScript timestamps are specified as a Number representing milliseconds since January 1, 1970.
         *
         * @param {Object} timeTag time tag object containing either a native JS timestamp (in ms) or a NTP timestamp pair
         * @return {Uint8Array} raw bytes for the written time tag
         */
        osc.writeTimeTag = function (timeTag) {
            var raw = timeTag.raw ? timeTag.raw : osc.jsToNTPTime(timeTag.native),
                arr = new Uint8Array(8), // Two Unit32s.
                dv = new DataView(arr.buffer);

            osc.writeInt32(raw[0], dv, 0);
            osc.writeInt32(raw[1], dv, 4);

            return arr;
        };

        /**
         * Produces a time tag containing a raw NTP timestamp
         * relative to now by the specified number of seconds.
         *
         * @param {Number} secs the number of seconds relative to now (i.e. + for the future, - for the past)
         * @return {Object} the time tag
         */
        osc.timeTag = function (secs) {
            secs = secs || 0;

            var nowSecs = Date.now() / 1000,
                nowWhole = Math.floor(nowSecs),
                nowFracs = nowSecs - nowWhole,
                secsWhole = Math.floor(secs),
                secsFracs = secs - secsWhole,
                fracs = nowFracs + secsFracs;

            if (fracs > 1) {
                var fracsWhole = Math.floor(fracs),
                    fracsFracs = fracs - fracsWhole;

                secsWhole += fracsWhole;
                fracs = fracsFracs;
            }

            var ntpSecs = nowWhole + secsWhole + osc.SECS_70YRS,
                ntpFracs = Math.round(osc.TWO_32 * fracs);

            return {
                raw: [ntpSecs, ntpFracs]
            };
        };

        /**
         * Converts OSC's standard time tag representation (which is the NTP format)
         * into the JavaScript/UNIX format in milliseconds.
         *
         * @param {Number} secs1900 the number of seconds since 1900
         * @param {Number} frac the number of fractions of a second (between 0 and 2^32)
         * @return {Number} a JavaScript-compatible timestamp in milliseconds
         */
        osc.ntpToJSTime = function (secs1900, frac) {
            var secs1970 = secs1900 - osc.SECS_70YRS,
                decimals = frac / osc.TWO_32,
                msTime = (secs1970 + decimals) * 1000;

            return msTime;
        };

        osc.jsToNTPTime = function (jsTime) {
            var secs = jsTime / 1000,
                secsWhole = Math.floor(secs),
                secsFrac = secs - secsWhole,
                ntpSecs = secsWhole + osc.SECS_70YRS,
                ntpFracs = Math.round(osc.TWO_32 * secsFrac);

            return [ntpSecs, ntpFracs];
        };

        /**
         * Reads the argument portion of an OSC message.
         *
         * @param {DataView} dv a DataView instance to read from
         * @param {Object} offsetState the offsetState object that stores the current offset into dv
         * @param {Oobject} [options] read options
         * @return {Array} an array of the OSC arguments that were read
         */
        osc.readArguments = function (dv, options, offsetState) {
            var typeTagString = osc.readString(dv, offsetState);
            if (typeTagString.indexOf(",") !== 0) {
                // Despite what the OSC 1.0 spec says,
                // it just doesn't make sense to handle messages without type tags.
                // scsynth appears to read such messages as if they have a single
                // Uint8 argument. sclang throws an error if the type tag is omitted.
                throw new Error("A malformed type tag string was found while reading " +
                    "the arguments of an OSC message. String was: " +
                    typeTagString, " at offset: " + offsetState.idx);
            }

            var argTypes = typeTagString.substring(1).split(""),
                args = [];

            osc.readArgumentsIntoArray(args, argTypes, typeTagString, dv, options, offsetState);

            return args;
        };

        // Unsupported, non-API function.
        osc.readArgument = function (argType, typeTagString, dv, options, offsetState) {
            var typeSpec = osc.argumentTypes[argType];
            if (!typeSpec) {
                throw new Error("'" + argType + "' is not a valid OSC type tag. Type tag string was: " + typeTagString);
            }

            var argReader = typeSpec.reader,
                arg = osc[argReader](dv, offsetState);

            if (options.metadata) {
                arg = {
                    type: argType,
                    value: arg
                };
            }

            return arg;
        };

        // Unsupported, non-API function.
        osc.readArgumentsIntoArray = function (arr, argTypes, typeTagString, dv, options, offsetState) {
            var i = 0;

            while (i < argTypes.length) {
                var argType = argTypes[i],
                    arg;

                if (argType === "[") {
                    var fromArrayOpen = argTypes.slice(i + 1),
                        endArrayIdx = fromArrayOpen.indexOf("]");

                    if (endArrayIdx < 0) {
                        throw new Error("Invalid argument type tag: an open array type tag ('[') was found "+
                            "without a matching close array tag ('[]'). Type tag was: " + typeTagString);
                    }

                    var typesInArray = fromArrayOpen.slice(0, endArrayIdx);
                    arg = osc.readArgumentsIntoArray([], typesInArray, typeTagString, dv, options, offsetState);
                    i += endArrayIdx + 2;
                } else {
                    arg = osc.readArgument(argType, typeTagString, dv, options, offsetState);
                    i++;
                }

                arr.push(arg);
            }

            return arr;
        };

        /**
         * Writes the specified arguments.
         *
         * @param {Array} args an array of arguments
         * @param {Object} options options for writing
         * @return {Uint8Array} a buffer containing the OSC-formatted argument type tag and values
         */
        osc.writeArguments = function (args, options) {
            var argCollection = osc.collectArguments(args, options);
            return osc.joinParts(argCollection);
        };

        // Unsupported, non-API function.
        osc.joinParts = function (dataCollection) {
            var buf = osc.makeByteArray(dataCollection.byteLength),
                parts = dataCollection.parts,
                offset = 0;

            for (var i = 0; i < parts.length; i++) {
                var part = parts[i];
                osc.copyByteArray(part, buf, offset);
                offset += part.length;
            }

            return buf;
        };

        // Unsupported, non-API function.
        osc.addDataPart = function (dataPart, dataCollection) {
            dataCollection.parts.push(dataPart);
            dataCollection.byteLength += dataPart.length;
        };

        // Unsupported, non-API function.
        osc.collectArguments = function (args, options, dataCollection) {
            if (!osc.isArray(args)) {
                args = [args];
            }

            dataCollection = dataCollection || {
                    byteLength: 0,
                    parts: []
                };

            if (!options.metadata) {
                args = osc.annotateArguments(args);
            }

            var typeTagString = ",",
                currPartIdx = dataCollection.parts.length;

            for (var i = 0; i < args.length; i++) {
                var arg = args[i],
                    type = arg.type,
                    writer = osc.argumentTypes[type].writer;

                typeTagString += arg.type;
                if (writer) {
                    var data = osc[writer](arg.value);
                    osc.addDataPart(data, dataCollection);
                }
            }

            var typeData = osc.writeString(typeTagString);
            dataCollection.byteLength += typeData.byteLength;
            dataCollection.parts.splice(currPartIdx, 0, typeData);

            return dataCollection;
        };

        /**
         * Reads an OSC message.
         *
         * @param {Array-like} data an array of bytes to read from
         * @param {Object} [options] read optoins
         * @param {Object} [offsetState] an offsetState object that stores the current offset into dv
         * @return {Object} the OSC message, formatted as a JavaScript object containing "address" and "args" properties
         */
        osc.readMessage = function (data, options, offsetState) {
            options = options || osc.defaults;

            var dv = osc.dataView(data);
            offsetState = offsetState || {
                    idx: 0
                };

            var address = osc.readString(dv, offsetState);
            return osc.readMessageContents(address, dv, options, offsetState);
        };

        // Unsupported, non-API function.
        osc.readMessageContents = function (address, dv, options, offsetState) {
            if (address.indexOf("/") !== 0) {
                throw new Error("A malformed OSC address was found while reading " +
                    "an OSC message. String was: " + address);
            }

            var args = osc.readArguments(dv, options, offsetState);

            return {
                address: address,
                args: args.length === 1 && options.unpackSingleArgs ? args[0] : args
            };
        };

        // Unsupported, non-API function.
        osc.collectMessageParts = function (msg, options, dataCollection) {
            dataCollection = dataCollection || {
                    byteLength: 0,
                    parts: []
                };

            osc.addDataPart(osc.writeString(msg.address), dataCollection);
            return osc.collectArguments(msg.args, options, dataCollection);
        };

        /**
         * Writes an OSC message.
         *
         * @param {Object} msg a message object containing "address" and "args" properties
         * @param {Object} [options] write options
         * @return {Uint8Array} an array of bytes containing the OSC message
         */
        osc.writeMessage = function (msg, options) {
            options = options || osc.defaults;
            var msgCollection = osc.collectMessageParts(msg, options);
            return osc.joinParts(msgCollection);
        };

        /**
         * Reads an OSC bundle.
         *
         * @param {DataView} dv the DataView instance to read from
         * @param {Object} [options] read optoins
         * @param {Object} [offsetState] an offsetState object that stores the current offset into dv
         * @return {Object} the bundle or message object that was read
         */
        osc.readBundle = function (dv, options, offsetState) {
            return osc.readPacket(dv, options, offsetState);
        };

        // Unsupported, non-API function.
        osc.collectBundlePackets = function (bundle, options, dataCollection) {
            dataCollection = dataCollection || {
                    byteLength: 0,
                    parts: []
                };

            osc.addDataPart(osc.writeString("#bundle"), dataCollection);
            osc.addDataPart(osc.writeTimeTag(bundle.timeTag), dataCollection);

            for (var i = 0; i < bundle.packets.length; i++) {
                var packet = bundle.packets[i],
                    collector = packet.address ? osc.collectMessageParts : osc.collectBundlePackets,
                    packetCollection = collector(packet, options);

                dataCollection.byteLength += packetCollection.byteLength;
                osc.addDataPart(osc.writeInt32(packetCollection.byteLength), dataCollection);
                dataCollection.parts = dataCollection.parts.concat(packetCollection.parts);
            }

            return dataCollection;
        };

        /**
         * Writes an OSC bundle.
         *
         * @param {Object} a bundle object containing "timeTag" and "packets" properties
         * @param {object} [options] write options
         * @return {Uint8Array} an array of bytes containing the message
         */
        osc.writeBundle = function (bundle, options) {
            if (!bundle.timeTag || !bundle.packets) {
                return;
            }

            options = options || osc.defaults;
            var bundleCollection = osc.collectBundlePackets(bundle, options);

            return osc.joinParts(bundleCollection);
        };

        // Unsupported, non-API function.
        osc.readBundleContents = function (dv, options, offsetState, len) {
            var timeTag = osc.readTimeTag(dv, offsetState),
                packets = [];

            while (offsetState.idx < len) {
                var packetSize = osc.readInt32(dv, offsetState),
                    packetLen = offsetState.idx + packetSize,
                    packet = osc.readPacket(dv, options, offsetState, packetLen);

                packets.push(packet);
            }

            return {
                timeTag: timeTag,
                packets: packets
            };
        };

        /**
         * Reads an OSC packet, which may consist of either a bundle or a message.
         *
         * @param {Array-like} data an array of bytes to read from
         * @param {Object} [options] read options
         * @return {Object} a bundle or message object
         */
        osc.readPacket = function (data, options, offsetState, len) {
            var dv = osc.dataView(data);

            len = len === undefined ? dv.byteLength : len;
            offsetState = offsetState || {
                    idx: 0
                };

            var header = osc.readString(dv, offsetState),
                firstChar = header[0];

            if (firstChar === "#") {
                return osc.readBundleContents(dv, options, offsetState, len);
            } else if (firstChar === "/") {
                return osc.readMessageContents(header, dv, options, offsetState);
            }
            throw new Error("A malformed OSC packet was found while reading. " +
                "header was: " + header);

        };

        /**
         * Writes an OSC packet, which may consist of either of a bundle or a message.
         *
         * @param {Object} a bundle or message object
         * @param {Object} [options] write options
         * @return {Uint8Array} an array of bytes containing the message
         */
        osc.writePacket = function (packet, options) {
            var writer = packet.address ? osc.writeMessage : osc.writeBundle;
            return writer(packet, options);
        };

        // Unsupported, non-API.
        osc.argumentTypes = {
            i: {
                reader: "readInt32",
                writer: "writeInt32"
            },
            f: {
                reader: "readFloat32",
                writer: "writeFloat32"
            },
            s: {
                reader: "readString",
                writer: "writeString"
            },
            S: {
                reader: "readString",
                writer: "writeString"
            },
            b: {
                reader: "readBlob",
                writer: "writeBlob"
            },
            t: {
                reader: "readTimeTag",
                writer: "writeTimeTag"
            },
            T: {
                reader: "readTrue"
            },
            F: {
                reader: "readFalse"
            },
            N: {
                reader: "readNull"
            },
            I: {
                reader: "readImpulse"
            },
            d: {
                reader: "readFloat64",
                writer: "writeFloat64"
            },
            c: {
                reader: "readChar32",
                writer: "writeChar32"
            },
            r: {
                reader: "readColor",
                writer: "writeColor"
            },
            m: {
                reader: "readMIDIBytes",
                writer: "writeMIDIBytes"
            },
            // [] are special cased within read/writeArguments()
        };

        // Unsupported, non-API function.
        osc.inferTypeForArgument = function (arg) {
            var type = typeof arg;

            // TODO: This is freaking hideous.
            switch (type) {
                case "boolean":
                    return arg ? "T" : "F";
                case "string":
                    return "s";
                case "number":
                    return "f";
                case "undefined":
                    return "N";
                case "object":
                    if (arg === null) {
                        return "N";
                    } else if (arg instanceof Uint8Array ||
                        arg instanceof ArrayBuffer ||
                        (osc.isBufferEnv && arg instanceof Buffer)) {
                        return "b";
                    }
                    break;
            }

            throw new Error("Can't infer OSC argument type for value: " + JSON.stringify(arg, null, 2));
        };

        // Unsupported, non-API function.
        osc.annotateArguments = function (args) {
            if (!osc.isArray(args)) {
                args = [args];
            }

            var annotated = [];
            for (var i = 0; i < args.length; i++) {
                var arg = args[i],
                    msgArg;

                if (typeof (arg) === "object" && arg.type && arg.value !== undefined) {
                    // We've got an explicitly typed argument.
                    msgArg = arg;
                } else {
                    var oscType = osc.inferTypeForArgument(arg);
                    msgArg = {
                        type: oscType,
                        value: arg
                    };
                }

                annotated.push(msgArg);
            }

            return annotated;
        };


        // If we're in a require-compatible environment, export ourselves.
        if (typeof module !== "undefined" && module.exports) {

            // Check if we're in Node.js; if so, require the buffer-dataview library.
            if (osc.isBufferEnv) {
                BufferDataView = require("buffer-dataview");
            }

            module.exports = osc;
        }

    }());

// 2014 Shane M. Clements
/*!
 * Lo-Dash v0.1.0 <https://github.com/bestiejs/lodash>
 * Copyright 2012 John-David Dalton <http://allyoucanleet.com/>
 * Based on Underscore.js 1.3.3, copyright 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
 * <http://documentcloud.github.com/underscore>
 * Available under MIT license <http://mths.be/mit>
 */


;(function(window, undefined) {
    'use strict';

    /** Used to escape characters in templates */
    var escapes = {
        '\\': '\\',
        "'": "'",
        '\n': 'n',
        '\r': 'r',
        '\t': 't',
        '\u2028': 'u2028',
        '\u2029': 'u2029'
    };

    /** Detect free variable `exports` */
    var freeExports = typeof exports == 'object' && exports &&
        (typeof global == 'object' && global && global == global.global && (window = global), exports);

    /** Used to generate unique IDs */
    var idCounter = 0;

    /** Used to restore the original `_` reference in `noConflict` */
    var oldDash = window._;

    /** Used to match tokens in template text */
    var reToken = /__token__(\d+)/g;

    /**
     * Used to match unescaped characters in template text
     * (older Safari can't parse unicode escape sequences in a RegExp literals)
     */
    var reUnescaped = RegExp('\\\\|[\'\\n\\r\\t\u2028\u2029]', 'g');

    /** Used to replace template delimiters */
    var token = '__token__';

    /** Used store tokenized template text code snippets */
    var tokenized = [];

    /** Object#toString result shortcuts */
    var arrayClass = '[object Array]',
        boolClass = '[object Boolean]',
        dateClass = '[object Date]',
        funcClass = '[object Function]',
        numberClass = '[object Number]',
        regexpClass = '[object RegExp]',
        stringClass = '[object String]';

    /** Native prototype shortcuts */
    var ArrayProto = Array.prototype,
        ObjProto = Object.prototype;

    /** Native method shortcuts */
    var concat = ArrayProto.concat,
        hasOwnProperty = ObjProto.hasOwnProperty,
        join = ArrayProto.join,
        push = ArrayProto.push,
        slice = ArrayProto.slice,
        toString = ObjProto.toString;

    /* Native method shortcuts for methods with the same name as other `lodash` methods */
    var nativeIsArray = Array.isArray,
        nativeIsFinite = window.isFinite,
        nativeKeys = Object.keys;

    /** Timer shortcuts */
    var clearTimeout = window.clearTimeout,
        setTimeout = window.setTimeout;

    /** Compilation options for `_.every` */
    var everyFactoryOptions = {
        'init': 'true',
        'inLoop': 'if (!callback(collection[index], index, collection)) return !result'
    };

    /** Compilation options for `_.extend` */
    var extendFactoryOptions = {
        'args': 'object',
        'init': 'object',
        'top':
        'for (var source, j = 1, length = arguments.length; j < length; j++) {\n' +
        'source = arguments[j]',
        'loopExp': 'index in source',
        'useHas': false,
        'inLoop': 'object[index] = source[index]',
        'bottom': '}'
    };

    /** Compilation options for `_.filter` */
    var filterFactoryOptions = {
        'init': '[]',
        'inLoop': 'callback(collection[index], index, collection) && result.push(collection[index])'
    };

    /** Compilation options for `_.forEach` */
    var forEachFactoryOptions = {
        'args': 'collection, callback, thisArg',
        'init': 'collection',
        'top':
        'if (!callback) {\n' +
        'callback = identity\n' +
        '}\n' +
        'else if (thisArg) {\n' +
        'callback = bind(callback, thisArg)\n' +
        '}',
        'inLoop': 'callback(collection[index], index, collection)'
    };

    /** Compilation options for `_.map` */
    var mapFactoryOptions = {
        'init': '',
        'exit': 'if (!collection) return []',
        'beforeLoop': {
            'array': 'result = Array(length)',
            'object': 'result = []'
        },
        'inLoop': {
            'array': 'result[index] = callback(collection[index], index, collection)',
            'object': 'result.push(callback(collection[index], index, collection))'
        }
    };

    /** Compilation options for `_.max` */
    var maxFactoryOptions = {
        'top':
        'var current, computed = -Infinity, result = computed;\n' +
        'if (!callback) {\n' +
        'if (isArray(collection) && collection[0] === +collection[0])' +
        'return Math.max.apply(Math, collection);\n' +
        'if (isEmpty(collection))' +
        'return result\n' +
        '} else if (thisArg) callback = bind(callback, thisArg)',
        'inLoop':
        'current = callback' +
        '? callback(collection[index], index, collection)' +
        ': collection[index];\n' +
        'if (current >= computed)' +
        'computed = current, result = collection[index]'
    };

    /*--------------------------------------------------------------------------*/

    /**
     * The `lodash` function.
     *
     * @name _
     * @constructor
     * @param {Mixed} value The value to wrap in a `Lodash` instance.
     * @returns {Object} Returns a `Lodash` instance.
     */
    function lodash(value) {
        // allow invoking `lodash` without the `new` operator
        return new Lodash(value);
    }

    /**
     * Creates a `Lodash` instance that wraps a value to allow chaining.
     *
     * @private
     * @constructor
     * @param {Mixed} value The value to wrap.
     */
    function Lodash(value) {
        this._wrapped = value;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Checks if a `value` is an array.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} value The value to check.
     * @returns {Boolean} Returns `true` if the `value` is an array, else `false`.
     * @example
     *
     * (function() { return _.isArray(arguments); })();
     * // => false
     *
     * _.isArray([1, 2, 3]);
     * // => true
     */
    var isArray = nativeIsArray || function(value) {
            return toString.call(value) == arrayClass;
        };

    /**
     * Checks if a `value` is empty. Arrays or strings with a length of `0` and
     * objects with no enumerable own properties are considered "empty".
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} value The value to check.
     * @returns {Boolean} Returns `true` if the `value` is empty, else `false`.
     * @example
     *
     * _.isEmpty([1, 2, 3]);
     * // => false
     *
     * _.isEmpty({});
     * // => true
     */
    var isEmpty = iterationFactory({
        'args': 'value',
        'iterate': 'objects',
        'init': 'true',
        'top':
        'var className = toString.call(value);\n' +
        'if (className == arrayClass || className == stringClass) return !value.length',
        'inLoop': 'return false'
    });

    /*--------------------------------------------------------------------------*/

    /**
     * Used by `template()` to replace tokens with their corresponding code snippets.
     *
     * @private
     * @param {String} match The matched token.
     * @param {String} index The `tokenized` index of the code snippet.
     * @returns {String} Returns the code snippet.
     */
    function detokenize(match, index) {
        return tokenized[index];
    }

    /**
     * Used by `template()` to escape characters for inclusion in compiled
     * string literals.
     *
     * @private
     * @param {String} match The matched character to escape.
     * @returns {String} Returns the escaped character.
     */
    function escapeChar(match) {
        return '\\' + escapes[match];
    }

    /**
     * Compiles iteration functions.
     *
     * @private
     * @param {Object} [options1, options2, ..] The compile options objects.
     * @returns {Function} Returns the compiled function.
     */
    function iterationFactory() {
        var prop,
            index = -1,
            array = {},
            object = {},
            options = {},
            props = ['beforeLoop', 'loopExp', 'inLoop'];

        // use simple loops to merge options because `extend` isn't defined yet
        while (++index < arguments.length) {
            for (prop in arguments[index]) {
                options[prop] = arguments[index][prop];
            }
        }

        // assign the `array` and `object` branch options
        while ((prop = props.pop())) {
            if (typeof options[prop] == 'object') {
                array[prop] = options[prop].array;
                object[prop] = options[prop].object;
            } else {
                array[prop] = object[prop] = options[prop] || '';
            }
        }

        var args = options.args,
            firstArg = /^[^,]+/.exec(args)[0],
            init = options.init,
            iterate = options.iterate,
            arrayBranch = !(firstArg == 'object' || iterate == 'objects'),
            objectBranch = !(firstArg == 'array' || iterate == 'arrays'),
            useHas = options.useHas !== false;

        // all strings used to compile methods are minified during the build process
        return Function('arrayClass, bind, concat, funcClass, hasOwnProperty, identity,' +
            'indexOf, Infinity, isArray, isEmpty, Math, slice, stringClass,' +
            'toString, undefined',
            // compile the function in strict mode
            '"use strict";' +
                // compile the arguments the function accepts
            'return function(' + args + ') {\n' +
                // assign the `result` variable an initial value
            ('var index, result' + (init ? '=' + init : '')) + ';\n' +
                // add code to exit early or do so if the first argument is falsey
            (options.exit || 'if (!' + firstArg + ') return result') + ';\n' +
                // add code after the exit snippet but before the iteration branches
            (options.top || '') + ';\n' +
                // the following branch is for iterating arrays and array-like objects
            (arrayBranch
                    // initialize `length` and `index` variables
                    ? 'var length = ' + firstArg + '.length;\n' +
                'index = -1;\n' +
                    // check if the `collection` is array-like when there is an object iteration branch
                ((objectBranch ? 'if (length === +length) {\n'  : '') +
                    // add code before the while-loop
                (array.beforeLoop || '') + ';\n' +
                    // add a custom loop expression
                'while (' + (array.loopExp || '++index < length') + ') {\n' +
                    // add code inside the while-loop
                array.inLoop +
                '\n}' +
                    // end the array-like if-statement
                (objectBranch ? '\n}\n' : ''))
                    : ''
            ) +
                // the following branch is for iterating an object's own/inherited properties
            (objectBranch
                    // begin the else-statement when there is an array-like iteration branch
                    ? ((arrayBranch ? 'else {\n' : '') +
                    // add code before the for-in loop
                (object.beforeLoop || '') + ';\n' +
                    // add a custom loop expression
                'for (' + (object.loopExp || 'index in ' + firstArg) + ') {\n' +
                    // compile in `hasOwnProperty` checks when `options.useHas` is not `false`
                (useHas ? 'if (hasOwnProperty.call(' + /\S+$/.exec(object.loopExp || firstArg)[0] + ',index)) {\n' : '') +
                    // add code inside the for-in loop
                object.inLoop +
                (useHas ? '\n}' : '') +
                '\n}' +
                    // end the object iteration else-statement
                (arrayBranch ? '\n}\n' : ''))
                    : ''
            ) +
                // add code to the bottom of the iteration method
            (options.bottom || '') + ';\n' +
                // finally, return the `result`
            'return result' +
            '\n}'
        )(arrayClass, bind, concat, funcClass, hasOwnProperty, identity,
            indexOf, Infinity, isArray, isEmpty, Math, slice, stringClass, toString);
    }

    /**
     * Used by `template()` to replace "escape" template delimiters with tokens.
     *
     * @private
     * @param {String} match The matched template delimiter.
     * @param {String} value The delimiter value.
     * @returns {String} Returns a token.
     */
    function tokenizeEscape(match, value) {
        var index = tokenized.length;
        tokenized[index] = "'+\n((__t = (" + value + ")) == null ? '' : __e(__t)) +\n'";
        return token + index;
    }

    /**
     * Used by `template()` to replace "interpolate" template delimiters with tokens.
     *
     * @private
     * @param {String} match The matched template delimiter.
     * @param {String} value The delimiter value.
     * @returns {String} Returns a token.
     */
    function tokenizeInterpolate(match, value) {
        var index = tokenized.length;
        tokenized[index] = "'+\n((__t = (" + value + ")) == null ? '' : __t) +\n'";
        return token + index;
    }

    /**
     * Used by `template()` to replace "evaluate" template delimiters with tokens.
     *
     * @private
     * @param {String} match The matched template delimiter.
     * @param {String} value The delimiter value.
     * @returns {String} Returns a token.
     */
    function tokenizeEvaluate(match, value) {
        var index = tokenized.length;
        tokenized[index] = "';\n" + value + ";\n__p += '";
        return token + index;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Checks if a given `target` value is present in a `collection` using strict
     * equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @alias include
     * @category Collections
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Mixed} target The value to check for.
     * @returns {Boolean} Returns `true` if `target` value is found, else `false`.
     * @example
     *
     * _.contains([1, 2, 3], 3);
     * // => true
     */
    var contains = iterationFactory({
        'args': 'collection, target',
        'init': 'false',
        'inLoop': 'if (collection[index] === target) return true'
    });

    /**
     * Checks if the `callback` returns a truthy value for **all** elements of a
     * `collection`. The `callback` is invoked with 3 arguments; for arrays they
     * are (value, index, array) and for objects they are (value, key, object).
     *
     * @static
     * @memberOf _
     * @alias all
     * @category Collections
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} callback The function called per iteration.
     * @param {Mixed} [thisArg] The `this` binding for the callback.
     * @returns {Boolean} Returns `true` if all values pass the callback check, else `false`.
     * @example
     *
     * _.every([true, 1, null, 'yes'], Boolean);
     * => false
     */
    var every = iterationFactory(forEachFactoryOptions, everyFactoryOptions);

    /**
     * Examines each value in a `collection`, returning an array of all values the
     * `callback` returns truthy for. The `callback` is invoked with 3 arguments;
     * for arrays they are (value, index, array) and for objects they are
     * (value, key, object).
     *
     * @static
     * @memberOf _
     * @alias select
     * @category Collections
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} callback The function called per iteration.
     * @param {Mixed} [thisArg] The `this` binding for the callback.
     * @returns {Array} Returns a new array of values that passed callback check.
     * @example
     *
     * var evens = _.filter([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
     * // => [2, 4, 6]
     */
    var filter = iterationFactory(forEachFactoryOptions, filterFactoryOptions);

    /**
     * Examines each value in a `collection`, returning the first one the `callback`
     * returns truthy for. The function returns as soon as it finds an acceptable
     * value, and does not iterate over the entire `collection`. The `callback` is
     * invoked with 3 arguments; for arrays they are (value, index, array) and for
     * objects they are (value, key, object).
     *
     * @static
     * @memberOf _
     * @alias detect
     * @category Collections
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} callback The function called per iteration.
     * @param {Mixed} [thisArg] The `this` binding for the callback.
     * @returns {Mixed} Returns the value that passed the callback check, else `undefined`.
     * @example
     *
     * var even = _.find([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
     * // => 2
     */
    var find = iterationFactory(forEachFactoryOptions, {
        'inLoop': 'if (callback(collection[index], index, collection)) return collection[index]'
    });

    /**
     * Iterates over a `collection`, executing the `callback` for each value in the
     * `collection`. The `callback` is bound to the `thisArg` value, if one is passed.
     * The `callback` is invoked with 3 arguments; for arrays they are
     * (value, index, array) and for objects they are (value, key, object).
     *
     * @static
     * @memberOf _
     * @alias each
     * @category Collections
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} callback The function called per iteration.
     * @param {Mixed} [thisArg] The `this` binding for the callback.
     * @returns {Array|Object} Returns the `collection`.
     * @example
     *
     * _.forEach([1, 2, 3], function(num) { alert(num); });
     * // => alerts each number in turn...
     *
     * _.forEach({ 'one': 1, 'two': 2, 'three': 3}, function(num) { alert(num); });
     * // => alerts each number in turn...
     */
    var forEach = iterationFactory(forEachFactoryOptions);

    /**
     * Splits a `collection` into sets, grouped by the result of running each value
     * through `callback`. The `callback` is invoked with 3 arguments; for arrays
     * they are (value, index, array) and for objects they are (value, key, object).
     * The `callback` argument may also be the name of a property to group by.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function|String} callback The function called per iteration or
     *  property name to group by.
     * @param {Mixed} [thisArg] The `this` binding for the callback.
     * @returns {Object} Returns an object of grouped values.
     * @example
     *
     * _.groupBy([1.3, 2.1, 2.4], function(num) { return Math.floor(num); });
     * // => { '1': [1.3], '2': [2.1, 2.4] }
     *
     * _.groupBy(['one', 'two', 'three'], 'length');
     * // => { '3': ['one', 'two'], '5': ['three'] }
     */
    var groupBy = iterationFactory(forEachFactoryOptions, {
        'init': '{}',
        'top':
        'var prop, isFunc = toString.call(callback) == funcClass;\n' +
        'if (isFunc && thisArg) callback = bind(callback, thisArg)',
        'inLoop':
        'prop = isFunc' +
        '? callback(collection[index], index, collection)' +
        ': collection[index][callback];\n' +
        '(result[prop] || (result[prop] = [])).push(collection[index])'
    });

    /**
     * Produces a new array of values by mapping each value in the `collection`
     * through a transformation `callback`. The `callback` is bound to the `thisArg`
     * value, if one is passed. The `callback` is invoked with 3 arguments; for
     * arrays they are (value, index, array) and for objects they are (value, key, object).
     *
     * @static
     * @memberOf _
     * @alias collect
     * @category Collections
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} callback The function called per iteration.
     * @param {Mixed} [thisArg] The `this` binding for the callback.
     * @returns {Array} Returns a new array of values returned by the callback.
     * @example
     *
     * _.map([1, 2, 3], function(num) { return num * 3; });
     * // => [3, 6, 9]
     *
     * _.map({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { return num * 3; });
     * // => [3, 6, 9]
     */
    var map = iterationFactory(forEachFactoryOptions, mapFactoryOptions);

    /**
     * Retrieves the maximum value of a `collection`. If `callback` is passed,
     * it will be executed for each value in the `collection` to generate the
     * criterion by which the value is ranked. The `callback` is invoked with 3
     * arguments; for arrays they are (value, index, array) and for objects they
     * are (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [callback] The function called per iteration.
     * @param {Mixed} [thisArg] The `this` binding for the callback.
     * @returns {Mixed} Returns the maximum value.
     * @example
     *
     * var stooges = [
     *   { 'name': 'moe', 'age': 40 },
     *   { 'name': 'larry', 'age': 50 },
     *   { 'name': 'curly', 'age': 60 }
     * ];
     *
     * _.max(stooges, function(stooge) { return stooge.age; });
     * // => { 'name': 'curly', 'age': 60 };
     */
    var max = iterationFactory(forEachFactoryOptions, maxFactoryOptions);

    /**
     * Retrieves the minimum value of a `collection`. If `callback` is passed,
     * it will be executed for each value in the `collection` to generate the
     * criterion by which the value is ranked. The `callback` is invoked with 3
     * arguments; for arrays they are (value, index, array) and for objects they
     * are (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [callback] The function called per iteration.
     * @param {Mixed} [thisArg] The `this` binding for the callback.
     * @returns {Mixed} Returns the minimum value.
     * @example
     *
     * _.min([10, 5, 100, 2, 1000]);
     * // => 2
     */
    var min = iterationFactory(forEachFactoryOptions, maxFactoryOptions, {
        'top': maxFactoryOptions.top.replace('-', '').replace('max', 'min'),
        'inLoop': maxFactoryOptions.inLoop.replace('>=', '<')
    });

    /**
     * Retrieves the value of a specified property from all values in a `collection`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object} collection The collection to iterate over.
     * @param {String} property The property to pluck.
     * @returns {Array} Returns a new array of property values.
     * @example
     *
     * var stooges = [
     *   { 'name': 'moe', 'age': 40 },
     *   { 'name': 'larry', 'age': 50 },
     *   { 'name': 'curly', 'age': 60 }
     * ];
     *
     * _.pluck(stooges, 'name');
     * // => ['moe', 'larry', 'curly']
     */
    var pluck = iterationFactory(mapFactoryOptions, {
        'args': 'collection, property',
        'inLoop': {
            'array': 'result[index] = collection[index][property]',
            'object': 'result.push(collection[index][property])'
        }
    });

    /**
     * Boils down a `collection` to a single value. The initial state of the
     * reduction is `accumulator` and each successive step of it should be returned
     * by the `callback`. The `callback` is bound to the `thisArg` value, if one is
     * passed. The `callback` is invoked with 4 arguments; for arrays they are
     * (accumulator, value, index, array) and for objects they are
     * (accumulator, value, key, object).
     *
     * @static
     * @memberOf _
     * @alias foldl, inject
     * @category Collections
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} callback The function called per iteration.
     * @param {Mixed} [accumulator] Initial value of the accumulator.
     * @param {Mixed} [thisArg] The `this` binding for the callback.
     * @returns {Mixed} Returns the accumulated value.
     * @example
     *
     * var sum = _.reduce([1, 2, 3], function(memo, num) { return memo + num; });
     * // => 6
     */
    var reduce = iterationFactory({
        'args': 'collection, callback, accumulator, thisArg',
        'init': 'accumulator',
        'top':
        'var noaccum = arguments.length < 3;\n' +
        'if (thisArg) callback = bind(callback, thisArg)',
        'beforeLoop': {
            'array': 'if (noaccum) result = collection[++index]'
        },
        'inLoop': {
            'array':
                'result = callback(result, collection[index], index, collection)',
            'object':
            'result = noaccum\n' +
            '? (noaccum = false, collection[index])\n' +
            ': callback(result, collection[index], index, collection)'
        }
    });

    /**
     * The right-associative version of `_.reduce`. The `callback` is bound to the
     * `thisArg` value, if one is passed. The `callback` is invoked with 4 arguments;
     * for arrays they are (accumulator, value, index, array) and for objects they
     * are (accumulator, value, key, object).
     *
     * @static
     * @memberOf _
     * @alias foldr
     * @category Collections
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} callback The function called per iteration.
     * @param {Mixed} [accumulator] Initial value of the accumulator.
     * @param {Mixed} [thisArg] The `this` binding for the callback.
     * @returns {Mixed} Returns the accumulated value.
     * @example
     *
     * var list = [[0, 1], [2, 3], [4, 5]];
     * var flat = _.reduceRight(list, function(a, b) { return a.concat(b); }, []);
     * // => [4, 5, 2, 3, 0, 1]
     */
    function reduceRight(collection, callback, accumulator, thisArg) {
        if (!collection) {
            return accumulator;
        }

        var length = collection.length,
            noaccum = arguments.length < 3;

        if(thisArg) {
            callback = bind(callback, thisArg);
        }
        if (length === +length) {
            if (length && noaccum) {
                accumulator = collection[--length];
            }
            while (length--) {
                accumulator = callback(accumulator, collection[length], length, collection);
            }
            return accumulator;
        }

        var prop,
            props = keys(collection);

        length = props.length;
        if (length && noaccum) {
            accumulator = collection[props[--length]];
        }
        while (length--) {
            prop = props[length];
            accumulator = callback(accumulator, collection[prop], prop, collection);
        }
        return accumulator;
    }

    /**
     * The opposite of `_.filter`, this method returns the values of a `collection`
     * that `callback` does **not** return truthy for. The `callback` is invoked
     * with 3 arguments; for arrays they are (value, index, array) and for objects
     * they are (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} callback The function called per iteration.
     * @param {Mixed} [thisArg] The `this` binding for the callback.
     * @returns {Array} Returns a new array of values that did **not** pass the callback check.
     * @example
     *
     * var odds = _.reject([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
     * // => [1, 3, 5]
     */
    var reject = iterationFactory(forEachFactoryOptions, filterFactoryOptions, {
        'inLoop': '!' + filterFactoryOptions.inLoop
    });

    /**
     * Gets the number of values in the `collection`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object} collection The collection inspect.
     * @returns {Number} Returns the number of values in the collection.
     * @example
     *
     * _.size({ 'one': 1, 'two': 2, 'three': 3 });
     * // => 3
     */
    function size(collection) {
        var className = toString.call(collection);
        return className == arrayClass || className == stringClass
            ? collection.length
            : keys(collection).length;
    }

    /**
     * Produces a new sorted array, ranked in ascending order by the results of
     * running each value of a `collection` through `callback`. The `callback` is
     * invoked with 3 arguments; for arrays they are (value, index, array) and for
     * objects they are (value, key, object). The `callback` argument may also be
     * the name of a property to sort by (e.g. 'length').
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function|String} callback The function called per iteration or
     *  property name to sort by.
     * @param {Mixed} [thisArg] The `this` binding for the callback.
     * @returns {Array} Returns a new array of sorted values.
     * @example
     *
     * _.sortBy([1, 2, 3, 4, 5, 6], function(num) { return Math.sin(num); });
     * // => [5, 4, 6, 3, 1, 2]
     */
    function sortBy(collection, callback, thisArg) {
        if (toString.call(callback) != funcClass) {
            var prop = callback;
            callback = function(collection) { return collection[prop]; };
        } else if (thisArg) {
            callback = bind(callback, thisArg);
        }
        return pluck(map(collection, function(value, index) {
            return {
                'criteria': callback(value, index, collection),
                'value': value
            };
        }).sort(function(left, right) {
            var a = left.criteria,
                b = right.criteria;

            if (a === undefined) {
                return 1;
            }
            if (b === undefined) {
                return -1;
            }
            return a < b ? -1 : a > b ? 1 : 0;
        }), 'value');
    }

    /**
     * Checks if the `callback` returns a truthy value for **any** element of a
     * `collection`. The function returns as soon as it finds passing value, and
     * does not iterate over the entire `collection`. The `callback` is invoked
     * with 3 arguments; for arrays they are (value, index, array) and for objects
     * they are (value, key, object).
     *
     * @static
     * @memberOf _
     * @alias any
     * @category Collections
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} callback The function called per iteration.
     * @param {Mixed} [thisArg] The `this` binding for the callback.
     * @returns {Boolean} Returns `true` if any value passes the callback check, else `false`.
     * @example
     *
     * _.some([null, 0, 'yes', false]);
     * // => true
     */
    var some = iterationFactory(forEachFactoryOptions, everyFactoryOptions, {
        'init': 'false',
        'inLoop': everyFactoryOptions.inLoop.replace('!', '')
    });

    /**
     * Converts the `collection`, into an array. Useful for converting the
     * `arguments` object.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object} collection The collection to convert.
     * @returns {Array} Returns the new converted array.
     * @example
     *
     * (function() { return _.toArray(arguments).slice(1); })(1, 2, 3, 4);
     * // => [2, 3, 4]
     */
    function toArray(collection) {
        if (!collection) {
            return [];
        }
        if (toString.call(collection.toArray) == funcClass) {
            return collection.toArray();
        }
        var length = collection.length;
        if (length === +length) {
            return slice.call(collection);
        }
        return values(collection);
    }

    /**
     * Produces an array of enumerable own property values of the `collection`.
     *
     * @static
     * @memberOf _
     * @alias methods
     * @category Collections
     * @param {Array|Object} collection The collection to inspect.
     * @returns {Array} Returns a new array of property values.
     * @example
     *
     * _.values({ 'one': 1, 'two': 2, 'three': 3 });
     * // => [1, 2, 3]
     */
    var values = iterationFactory(mapFactoryOptions, {
        'args': 'collection',
        'inLoop': {
            'array': 'result[index] = collection[index]',
            'object': 'result.push(collection[index])'
        }
    });

    /*--------------------------------------------------------------------------*/

    /**
     * Produces a new array with all falsey values of `array` removed. The values
     * `false`, `null`, `0`, `""`, `undefined` and `NaN` are all falsey.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to compact.
     * @returns {Array} Returns a new filtered array.
     * @example
     *
     * _.compact([0, 1, false, 2, '', 3]);
     * // => [1, 2, 3]
     */
    var compact = function(array) {
        var index = -1,
            length = array.length,
            result = [];

        while (++index < length) {
            if (array[index]) {
                result.push(array[index]);
            }
        }
        return result;
    }

    /**
     * Produces a new array of `array` values not present in the other arrays
     * using strict equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to process.
     * @param {Mixed} [array1, array2, ...] Arrays to check.
     * @returns {Array} Returns a new array of `array` values not present in the
     *  other arrays.
     * @example
     *
     * _.difference([1, 2, 3, 4, 5], [5, 2, 10]);
     * // => [1, 3, 4]
     */
    function difference(array) {
        var index = -1,
            length = array.length,
            result = [],
            flattened = concat.apply(result, slice.call(arguments, 1));

        while (++index < length) {
            if (indexOf(flattened, array[index]) < 0) {
                result.push(array[index]);
            }
        }
        return result;
    }

    /**
     * Gets the first value of the `array`. Pass `n` to return the first `n` values
     * of the `array`.
     *
     * @static
     * @memberOf _
     * @alias head, take
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Number} [n] The number of elements to return.
     * @param {Object} [guard] Internally used to allow this method to work with
     *  others like `_.map` without using their callback `index` argument for `n`.
     * @returns {Mixed} Returns the first value or an array of the first `n` values
     *  of the `array`.
     * @example
     *
     * _.first([5, 4, 3, 2, 1]);
     * // => 5
     */
    function first(array, n, guard) {
        return (n == undefined || guard) ? array[0] : slice.call(array, 0, n);
    }

    /**
     * Flattens a nested array (the nesting can be to any depth). If `shallow` is
     * truthy, `array` will only be flattened a single level.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to compact.
     * @param {Boolean} shallow A flag to indicate only flattening a single level.
     * @returns {Array} Returns a new flattened array.
     * @example
     *
     * _.flatten([1, [2], [3, [[4]]]]);
     * // => [1, 2, 3, 4];
     *
     * _.flatten([1, [2], [3, [[4]]]], true);
     * // => [1, 2, 3, [[4]]];
     */
    function flatten(array, shallow) {
        if (shallow) {
            return concat.apply(ArrayProto, array);
        }
        var value,
            index = -1,
            length = array.length,
            result = [];

        while (++index < length) {
            value = array[index];
            if (isArray(value)) {
                push.apply(result, flatten(value));
            } else {
                result.push(value);
            }
        }
        return result;
    }

    /**
     * Gets the index at which the first occurrence of `value` is found using
     * strict equality for comparisons, i.e. `===`. If the `array` is already
     * sorted, passing `true` for `isSorted` will run a faster binary search.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {Mixed} value The value to search for.
     * @param {Boolean} [isSorted=false] A flag to indicate that the `array` is already sorted.
     * @returns {Number} Returns the index of the matched value or `-1`.
     * @example
     *
     * _.indexOf([1, 2, 3], 2);
     * // => 1
     */
    function indexOf(array, value, isSorted) {
        var index, length;
        if (!array) {
            return -1;
        }
        if (isSorted) {
            index = sortedIndex(array, value);
            return array[index] === value ? index : -1;
        }
        for (index = 0, length = array.length; index < length; index++) {
            if (array[index] === value) {
                return index;
            }
        }
        return -1;
    }

    /**
     * Gets all but the last value of the `array`. Pass `n` to exclude the last `n`
     * values from the result.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Number} [n] The number of elements to return.
     * @param {Object} [guard] Internally used to allow this method to work with
     *  others like `_.map` without using their callback `index` argument for `n`.
     * @returns {Array} Returns all but the last value or `n` values of the `array`.
     * @example
     *
     * _.initial([5, 4, 3, 2, 1]);
     * // => [5, 4, 3, 2]
     */
    function initial(array, n, guard) {
        return slice.call(array, 0, -((n == undefined || guard) ? 1 : n));
    }

    /**
     * Computes the intersection of all the passed-in arrays.
     *
     * @static
     * @memberOf _
     * @alias intersect
     * @category Arrays
     * @param {Mixed} [array1, array2, ...] Arrays to process.
     * @returns {Array} Returns a new array of unique values, in order, that are
     *  present in **all** of the arrays.
     * @example
     *
     * _.intersection([1, 2, 3], [101, 2, 1, 10], [2, 1]);
     * // => [1, 2]
     */
    function intersection(array) {
        var value,
            index = -1,
            length = array.length,
            others = slice.call(arguments, 1),
            result = [];

        while (++index < length) {
            value = array[index];
            if (indexOf(result, value) < 0 &&
                every(others, function(other) { return indexOf(other, value) > -1; })) {
                result.push(value);
            }
        }
        return result;
    }

    /**
     * Calls the method named by `methodName` for each value of the `collection`.
     * Additional arguments will be passed to each invoked method.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to iterate over.
     * @param {String} methodName The name of the method to invoke.
     * @param {Mixed} [arg1, arg2, ...] Arguments to invoke the method with.
     * @returns {Array} Returns a new array of values returned from each invoked method.
     * @example
     *
     * _.invoke([[5, 1, 7], [3, 2, 1]], 'sort');
     * // => [[1, 5, 7], [1, 2, 3]]
     */
    function invoke(array, methodName) {
        var args = slice.call(arguments, 2),
            index = -1,
            length = array.length,
            isFunc = toString.call(methodName) == funcClass,
            result = [];

        while (++index < length) {
            result[index] = (isFunc ? methodName : array[index][methodName]).apply(array[index], args);
        }
        return result;
    }

    /**
     * Gets the last value of the `array`. Pass `n` to return the lasy `n` values
     * of the `array`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Number} [n] The number of elements to return.
     * @param {Object} [guard] Internally used to allow this method to work with
     *  others like `_.map` without using their callback `index` argument for `n`.
     * @returns {Array} Returns all but the last value or `n` values of the `array`.
     * @example
     *
     * _.last([5, 4, 3, 2, 1]);
     * // => 1
     */
    function last(array, n, guard) {
        var length = array.length;
        return (n == undefined || guard) ? array[length - 1] : slice.call(array, -n || length);
    }

    /**
     * Gets the index at which the last occurrence of `value` is found using
     * strict equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {Mixed} value The value to search for.
     * @returns {Number} Returns the index of the matched value or `-1`.
     * @example
     *
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2);
     * // => 4
     */
    function lastIndexOf(array, value) {
        if (!array) {
            return -1;
        }
        var index = array.length;
        while (index--) {
            if (array[index] === value) {
                return index;
            }
        }
        return -1;
    }

    /**
     * Creates an array of numbers (positive and/or negative) progressing from
     * `start` up to but not including `stop`. This method is a port of Python's
     * `range()` function. See http://docs.python.org/library/functions.html#range.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Number} [start=0] The start of the range.
     * @param {Number} end The end of the range.
     * @param {Number} [step=1] The value to increment or descrement by.
     * @returns {Array} Returns a new range array.
     * @example
     *
     * _.range(10);
     * // => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
     *
     * _.range(1, 11);
     * // => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
     *
     * _.range(0, 30, 5);
     * // => [0, 5, 10, 15, 20, 25]
     *
     * _.range(0, -10, -1);
     * // => [0, -1, -2, -3, -4, -5, -6, -7, -8, -9]
     *
     * _.range(0);
     * // => []
     */
    function range(start, end, step) {
        step || (step = 1);
        if (arguments.length < 2) {
            end = start || 0;
            start = 0;
        }

        var index = -1,
            length = Math.max(Math.ceil((end - start) / step), 0),
            result = Array(length);

        while (++index < length) {
            result[index] = start;
            start += step;
        }
        return result;
    }

    /**
     * The opposite of `_.initial`, this method gets all but the first value of
     * the `array`. Pass `n` to exclude the first `n` values from the result.
     *
     * @static
     * @memberOf _
     * @alias tail
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Number} [n] The number of elements to return.
     * @param {Object} [guard] Internally used to allow this method to work with
     *  others like `_.map` without using their callback `index` argument for `n`.
     * @returns {Array} Returns all but the first value or `n` values of the `array`.
     * @example
     *
     * _.rest([5, 4, 3, 2, 1]);
     * // => [4, 3, 2, 1]
     */
    function rest(array, n, guard) {
        return slice.call(array, (n == undefined || guard) ? 1 : n);
    }

    /**
     * Produces a new array of shuffled `array` values, using a version of the
     * Fisher-Yates shuffle. See http://en.wikipedia.org/wiki/Fisher-Yates_shuffle.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to shuffle.
     * @returns {Array} Returns a new shuffled array.
     * @example
     *
     * _.shuffle([1, 2, 3, 4, 5, 6]);
     * // => [4, 1, 6, 3, 5, 2]
     */
    function shuffle(array) {
        var rand,
            index = -1,
            length = array.length,
            result = Array(length);

        while (++index < length) {
            rand = Math.floor(Math.random() * (index + 1));
            result[index] = result[rand];
            result[rand] = array[index];
        }
        return result;
    }

    /**
     * Uses a binary search to determine the smallest  index at which the `value`
     * should be inserted into the `collection` in order to maintain the sort order
     * of the `collection`. If `callback` is passed, it will be executed for each
     * value in the `collection` to compute their sort ranking. The `callback` is
     * invoked with 1 argument; (value).
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to iterate over.
     * @param {Mixed} value The value to evaluate.
     * @param {Function} [callback] The function called per iteration.
     * @returns {Number} Returns the index at which the value should be inserted
     *  into the collection.
     * @example
     *
     * _.sortedIndex([10, 20, 30, 40, 50], 35);
     * // => 3
     */
    function sortedIndex(array, value, callback) {
        var mid,
            low = 0,
            high = array.length;

        if (callback) {
            value = callback(value);
        }
        while (low < high) {
            mid = (low + high) >> 1;
            if ((callback ? callback(array[mid]) : array[mid]) < value) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }
        return low;
    }

    /**
     * Computes the union of the passed-in arrays.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Mixed} [array1, array2, ...] Arrays to process.
     * @returns {Array} Returns a new array of unique values, in order, that are
     *  present in one or more of the arrays.
     * @example
     *
     * _.union([1, 2, 3], [101, 2, 1, 10], [2, 1]);
     * // => [1, 2, 3, 101, 10]
     */
    function union() {
        var index = -1,
            result = [],
            flattened = concat.apply(result, arguments),
            length = flattened.length;

        while (++index < length) {
            if (indexOf(result, flattened[index]) < 0) {
                result.push(flattened[index]);
            }
        }
        return result;
    }

    /**
     * Produces a duplicate-value-free version of the `array` using strict equality
     * for comparisons, i.e. `===`. If the `array` is already sorted, passing `true`
     * for `isSorted` will run a faster algorithm. If `callback` is passed,
     * each value of `array` is passed through a transformation `callback` before
     * uniqueness is computed. The `callback` is invoked with 3 arguments;
     * (value, index, array).
     *
     * @static
     * @memberOf _
     * @alias unique
     * @category Arrays
     * @param {Array} array The array to process.
     * @param {Boolean} [isSorted=false] A flag to indicate that the `array` is already sorted.
     * @param {Function} [callback] A
     * @returns {Array} Returns a duplicate-value-free array.
     * @example
     *
     * _.uniq([1, 2, 1, 3, 1, 4]);
     * // => [1, 2, 3, 4]
     */
    function uniq(array, isSorted, callback) {
        var computed,
            index = -1,
            length = array.length,
            result = [],
            seen = [];

        if (length < 3) {
            isSorted = true;
        }
        while (++index < length) {
            computed = callback ? callback(array[index]) : array[index];
            if (isSorted
                    ? !index || seen[seen.length - 1] !== computed
                    : indexOf(seen, computed) < 0
            ) {
                seen.push(computed);
                result.push(array[index]);
            }
        }
        return result;
    }

    /**
     * Produces a new array with all occurrences of the values removed using strict
     * equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to filter.
     * @param {Mixed} [value1, value2, ...] Values to remove.
     * @returns {Array} Returns a new filtered array.
     * @example
     *
     * _.without([1, 2, 1, 0, 3, 1, 4], 0, 1);
     * // => [2, 3, 4]
     */
    function without(array) {
        var excluded = slice.call(arguments, 1),
            index = -1,
            length = array.length,
            result = [];

        while (++index < length) {
            if (indexOf(excluded, array[index]) < 0) {
                result.push(array[index]);
            }
        }
        return result;
    }

    /**
     * Merges together the values of each of the arrays with the value at the
     * corresponding position. Useful for separate data sources that are coordinated
     * through matching array indexes. For a matrix of nested arrays, `_.zip.apply(...)`
     * can transpose the matrix in a similar fashion.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Mixed} [array1, array2, ...] Arrays to process.
     * @returns {Array} Returns a new array of merged arrays.
     * @example
     *
     * _.zip(['moe', 'larry', 'curly'], [30, 40, 50], [true, false, false]);
     * // => [['moe', 30, true], ['larry', 40, false], ['curly', 50, false]]
     */
    function zip() {
        var index = -1,
            length = max(pluck(arguments, 'length')),
            result = Array(length);

        while (++index < length) {
            result[index] = pluck(arguments, index);
        }
        return result;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a new function that is restricted to executing only after it is
     * called a given number of `times`.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Number} times The number of times the function must be called before
     * it is executed.
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var renderNotes = _.after(notes.length, render);
     * _.forEach(notes, function(note) {
   *   note.asyncSave({ 'success': renderNotes });
   * });
     * // renderNotes is run once, after all notes have saved.
     */
    function after(times, func) {
        if (times < 1) {
            return func();
        }
        return function() {
            if (--times < 1) {
                return func.apply(this, arguments);
            }
        };
    }

    /**
     * Creates a new function that, when called, invokes `func` with the `this`
     * binding of `thisArg` and prepends additional arguments to those passed to
     * the bound function. Lazy defined methods may be bound by passing the object
     * they are bound to as `func` and the method name as `thisArg`.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function|Object} func The function to bind or the object the method belongs to.
     * @param @param {Mixed} [thisArg] The `this` binding of `func` or the method name.
     * @param {Mixed} [arg1, arg2, ...] Arguments to prepend to those passed to the bound function.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * // basic bind
     * var func = function(greeting) { return greeting + ': ' + this.name; };
     * func = _.bind(func, { 'name': 'moe' }, 'hi');
     * func();
     * // => 'hi: moe'
     *
     * // lazy bind
     * var object = {
   *   'name': 'moe',
   *   'greet': function(greeting) {
   *     return greeting + ': ' + this.name;
   *   }
   * };
     *
     * var func = _.bind(object, 'greet', 'hi');
     * func();
     * // => 'hi: moe'
     *
     * object.greet = function(greeting) {
   *   return greeting + ' ' + this.name + '!';
   * };
     *
     * func();
     * // => 'hi moe!'
     */
    function bind(func, thisArg) {
        var args = slice.call(arguments, 2),
            argsLength = args.length,
            isFunc = toString.call(func) == funcClass;

        // juggle arguments
        if (!isFunc) {
            var methodName = thisArg;
            thisArg = func;
        }
        return function() {
            push.apply(args, arguments);
            var result = (isFunc ? func : thisArg[methodName]).apply(thisArg, args);
            args.length = argsLength;
            return result;
        };
    }

    /**
     * Binds methods on the `object` to the object, overwriting the non-bound method.
     * If no method names are provided, all the function properties of the `object`
     * will be bound.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Object} object The object to bind and assign the bound methods to.
     * @param {Mixed} [methodName1, methodName2, ...] Method names on the object to bind.
     * @returns {Object} Returns the `object`.
     * @example
     *
     * var buttonView = {
   *  'label': 'lodash',
   *  'onClick': function() { alert('clicked: ' + this.label); },
   *  'onHover': function() { console.log('hovering: ' + this.label); }
   * };
     *
     * _.bindAll(buttonView);
     * jQuery('#lodash_button').on('click', buttonView.onClick);
     * // => When the button is clicked, `this.label` will have the correct value
     */
    function bindAll(object) {
        var funcs = arguments,
            index = 1;

        if (funcs.length == 1) {
            index = 0;
            funcs = functions(object);
        }
        for (var length = funcs.length; index < length; index++) {
            object[funcs[index]] = bind(object[funcs[index]], object);
        }
        return object;
    }

    /**
     * Creates a new function that is the composition of the passed functions,
     * where each function consumes the return value of the function that follows.
     * In math terms, composing thefunctions `f()`, `g()`, and `h()` produces `f(g(h()))`.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Mixed} [func1, func2, ...] Functions to compose.
     * @returns {Function} Returns the new composed function.
     * @example
     *
     * var greet = function(name) { return 'hi: ' + name; };
     * var exclaim = function(statement) { return statement + '!'; };
     * var welcome = _.compose(exclaim, greet);
     * welcome('moe');
     * // => 'hi: moe!'
     */
    function compose() {
        var funcs = arguments;
        return function() {
            var args = arguments,
                length = funcs.length;

            while (length--) {
                args = [funcs[length].apply(this, args)];
            }
            return args[0];
        };
    }

    /**
     * Creates a new function that will delay the execution of `func` until after
     * `wait` milliseconds have elapsed since the last time it was invoked. Pass
     * `true` for `immediate` to cause debounce to invoke `func` on the leading,
     * instead of the trailing, edge of the `wait` timeout.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to debounce.
     * @param {Number} wait The number of milliseconds to delay.
     * @param {Boolean} immediate A flag to indicate execution is on the leading
     *  edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * var lazyLayout = _.debounce(calculateLayout, 300);
     * jQuery(window).on('resize', lazyLayout);
     */
    function debounce(func, wait, immediate) {
        var args,
            result,
            thisArg,
            timeoutId;

        function delayed() {
            timeoutId = undefined;
            if (!immediate) {
                func.apply(thisArg, args);
            }
        }

        return function() {
            var isImmediate = immediate && !timeoutId;
            args = arguments;
            thisArg = this;

            clearTimeout(timeoutId);
            timeoutId = setTimeout(delayed, wait);

            if (isImmediate) {
                result = func.apply(thisArg, args);
            }
            return result;
        };
    }

    /**
     * Executes the `func` function after `wait` milliseconds. Additional arguments
     * are passed to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to delay.
     * @param {Number} wait The number of milliseconds to delay execution.
     * @param {Mixed} [arg1, arg2, ...] Arguments to invoke the function with.
     * @returns {Number} Returns the `setTimeout` timeout id.
     * @example
     *
     * var log = _.bind(console.log, console);
     * _.delay(log, 1000, 'logged later');
     * // => 'logged later' (Appears after one second.)
     */
    function delay(func, wait) {
        var args = slice.call(arguments, 2);
        return setTimeout(function() { return func.apply(undefined, args); }, wait);
    }

    /**
     * Defers executing the `func` function until the current call stack has cleared.
     * Additional arguments are passed to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to defer.
     * @param {Mixed} [arg1, arg2, ...] Arguments to invoke the function with.
     * @returns {Number} Returns the `setTimeout` timeout id.
     * @example
     *
     * _.defer(function() { alert('deferred'); });
     * // Returns from the function before the alert runs.
     */
    function defer(func) {
        var args = slice.call(arguments, 1);
        return setTimeout(function() { return func.apply(undefined, args); }, 1);
    }

    /**
     * Creates a new function that memoizes the result of `func`. If `resolver` is
     * passed, it will be used to determine the cache key for storing the result
     * based on the arguments passed to the memoized function. By default, the first
     * argument passed to the memoized function is used as the cache key.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to have its output memoized.
     * @param {Function} [resolver] A function used to resolve the cache key.
     * @returns {Function} Returns the new memoizing function.
     * @example
     *
     * var fibonacci = _.memoize(function(n) {
   *   return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);
   * });
     */
    function memoize(func, resolver) {
        var cache = {};
        return function() {
            var prop = resolver ? resolver.apply(this, arguments) : arguments[0];
            return hasOwnProperty.call(cache, prop)
                ? cache[prop]
                : (cache[prop] = func.apply(this, arguments));
        };
    }

    /**
     * Creates a new function that is restricted to one execution. Repeat calls to
     * the function will return the value of the first call.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var initialize = _.once(createApplication);
     * initialize();
     * initialize();
     * // Application is only created once.
     */
    function once(func) {
        var result,
            ran = false;

        return function() {
            if (ran) {
                return result;
            }
            ran = true;
            result = func.apply(this, arguments);
            return result;
        };
    }

    /**
     * Creates a new function that, when executed, will only call the `func`
     * function at most once per every `wait` milliseconds. If the throttled function
     * is invoked more than once, `func` will also be called on the trailing edge
     * of the `wait` timeout.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to throttle.
     * @param {Number} wait The number of milliseconds to throttle executions to.
     * @returns {Function} Returns the new throttled function.
     * @example
     *
     * var throttled = _.throttle(updatePosition, 100);
     * jQuery(window).on('scroll', throttled);
     */
    function throttle(func, wait) {
        var args,
            result,
            thisArg,
            timeoutId,
            lastCalled = 0;

        function trailingCall() {
            lastCalled = new Date;
            timeoutId = undefined;
            func.apply(thisArg, args);
        }

        return function() {
            var now = new Date,
                remain = wait - (now - lastCalled);

            args = arguments;
            thisArg = this;

            if (remain <= 0) {
                lastCalled = now;
                result = func.apply(thisArg, args);
            }
            else if (!timeoutId) {
                timeoutId = setTimeout(trailingCall, remain);
            }
            return result;
        };
    }

    /**
     * Create a new function that passes the `func` function to the `wrapper`
     * function as its first argument. Additional arguments are appended to those
     * passed to the `wrapper` function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to wrap.
     * @param {Function} wrapper The wrapper function.
     * @param {Mixed} [arg1, arg2, ...] Arguments to append to those passed to the wrapper.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var hello = function(name) { return 'hello: ' + name; };
     * hello = _.wrap(hello, function(func) {
   *   return 'before, ' + func('moe') + ', after';
   * });
     * hello();
     * // => 'before, hello: moe, after'
     */
    function wrap(func, wrapper) {
        return function() {
            var args = [func];
            push.apply(args, arguments);
            return wrapper.apply(this, args);
        };
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Create a shallow clone of the `value`. Any nested objects or arrays will be
     * assigned by reference and not cloned.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} value The value to clone.
     * @returns {Mixed} Returns the cloned `value`.
     * @example
     *
     * _.clone({ 'name': 'moe' });
     * // => { 'name': 'moe' };
     */
    function clone(value) {
        if (value !== Object(value)) {
            return value;
        }
        return isArray(value) ? value.slice() : extend({}, value);
    }

    /**
     * Assigns missing properties in `object` with default values from the defaults
     * objects. As soon as a property is set, additional defaults of the same
     * property will be ignored.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to populate.
     * @param {Object} [defaults1, defaults2, ..] The defaults objects to apply to `object`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var iceCream = { 'flavor': 'chocolate' };
     * _.defaults(iceCream, { 'flavor': 'vanilla', 'sprinkles': 'lots' });
     * // => { 'flavor': 'chocolate', 'sprinkles': 'lots' }
     */
    var defaults = iterationFactory(extendFactoryOptions, {
        'inLoop': 'if (object[index] == undefined)' + extendFactoryOptions.inLoop
    });

    /**
     * Copies enumerable properties from the source objects to the `destination` object.
     * Subsequent sources will overwrite propery assignments of previous sources.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The destination object.
     * @param {Object} [source1, source2, ..] The source objects.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * _.extend({ 'name': 'moe' }, { 'age': 40 });
     * // => { 'name': 'moe', 'age': 40 }
     */
    var extend = iterationFactory(extendFactoryOptions);

    /**
     * Produces a sorted array of the properties, own and inherited, of `object`
     * that have function values.
     *
     * @static
     * @memberOf _
     * @alias methods
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns a new array of property names that have function values.
     * @example
     *
     * _.functions(_);
     * // => ['all', 'any', 'bind', 'bindAll', 'clone', 'compact', 'compose', ...]
     */
    var functions = iterationFactory({
        'args': 'object',
        'init': '[]',
        'useHas': false,
        'inLoop': 'if (toString.call(object[index]) == funcClass) result.push(index)',
        'bottom': 'result.sort()'
    });

    /**
     * Checks if the specified object `property` exists and is a direct property,
     * instead of an inherited property.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to check.
     * @param {String} property The property to check for.
     * @returns {Boolean} Returns `true` if key is a direct property, else `false`.
     * @example
     *
     * _.has({ 'a': 1, 'b': 2, 'c': 3 }, 'b');
     * // => true
     */
    function has(object, property) {
        return hasOwnProperty.call(object, property);
    }

    /**
     * Checks if a `value` is an `arguments` object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} value The value to check.
     * @returns {Boolean} Returns `true` if the `value` is an `arguments` object, else `false`.
     * @example
     *
     * (function() { return _.isArguments(arguments); })(1, 2, 3);
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
    var isArguments = function isArguments(value) {
        return toString.call(value) == '[object Arguments]';
    };
    // fallback for browser like IE<9 which detect `arguments` as `[object Object]`
    if (!isArguments(arguments)) {
        isArguments = function(value) {
            return !!(value && hasOwnProperty.call(value, 'callee'));
        };
    }

    /**
     * Checks if a `value` is a boolean (`true` or `false`) value.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} value The value to check.
     * @returns {Boolean} Returns `true` if the `value` is a boolean value, else `false`.
     * @example
     *
     * _.isBoolean(null);
     * // => false
     */
    function isBoolean(value) {
        return value === true || value === false || toString.call(value) == boolClass;
    }

    /**
     * Checks if a `value` is a date.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} value The value to check.
     * @returns {Boolean} Returns `true` if the `value` is a date, else `false`.
     * @example
     *
     * _.isDate(new Date);
     * // => true
     */
    function isDate(value) {
        return toString.call(value) == dateClass;
    }

    /**
     * Checks if a `value` is a DOM element.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} value The value to check.
     * @returns {Boolean} Returns `true` if the `value` is a DOM element, else `false`.
     * @example
     *
     * _.isElement(document.body);
     * // => true
     */
    function isElement(value) {
        return !!(value && value.nodeType == 1);
    }

    /**
     * Performs a deep comparison between two values to determine if they are
     * equivalent to each other.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} a The value to compare.
     * @param {Mixed} b The other value to compare.
     * @param {Array} [stack] Internally used to keep track of "seen" objects to
     *  avoid circular references.
     * @returns {Boolean} Returns `true` if the values are equvalent, else `false`.
     * @example
     *
     * var moe = { 'name': 'moe', 'luckyNumbers': [13, 27, 34] };
     * var clone = { 'name': 'moe', 'luckyNumbers': [13, 27, 34] };
     *
     * moe == clone;
     * // => false
     *
     * _.isEqual(moe, clone);
     * // => true
     */
    function isEqual(a, b, stack) {
        stack || (stack = []);

        // exit early for identical values
        if (a === b) {
            // treat `+0` vs. `-0` as not equal
            return a !== 0 || (1 / a == 1 / b);
        }
        // a strict comparison is necessary because `null == undefined`
        if (a == undefined || b == undefined) {
            return a === b;
        }
        // unwrap any wrapped objects
        if (a._chain) {
            a = a._wrapped;
        }
        if (b._chain) {
            b = b._wrapped;
        }
        // invoke a custom `isEqual` method if one is provided
        if (a.isEqual && toString.call(a.isEqual) == funcClass) {
            return a.isEqual(b);
        }
        if (b.isEqual && toString.call(b.isEqual) == funcClass) {
            return b.isEqual(a);
        }
        // compare [[Class]] names
        var className = toString.call(a);
        if (className != toString.call(b)) {
            return false;
        }
        switch (className) {
            // strings, numbers, dates, and booleans are compared by value
            case stringClass:
                // primitives and their corresponding object instances are equivalent;
                // thus, `'5'` is quivalent to `new String('5')`
                return a == String(b);

            case numberClass:
                // treat `NaN` vs. `NaN` as equal
                return a != +a
                    ? b != +b
                    // but treat `+0` vs. `-0` as not equal
                    : (a == 0 ? (1 / a == 1 / b) : a == +b);

            case boolClass:
            case dateClass:
                // coerce dates and booleans to numeric values, dates to milliseconds and booleans to 1 or 0;
                // treat invalid dates coerced to `NaN` as not equal
                return +a == +b;

            // regexps are compared by their source and flags
            case regexpClass:
                return a.source == b.source &&
                    a.global == b.global &&
                    a.multiline == b.multiline &&
                    a.ignoreCase == b.ignoreCase;
        }
        if (typeof a != 'object' || typeof b != 'object') {
            return false;
        }
        // Assume equality for cyclic structures. The algorithm for detecting cyclic
        // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
        var length = stack.length;
        while (length--) {
            // Linear search. Performance is inversely proportional to the number of
            // unique nested structures.
            if (stack[length] == a) {
                return true;
            }
        }

        var result = true,
            size = 0;

        // add the first collection to the stack of traversed objects
        stack.push(a);

        // recursively compare objects and arrays
        if (className == arrayClass) {
            // compare array lengths to determine if a deep comparison is necessary
            size = a.length;
            result = size == b.length;

            if (result) {
                // deep compare the contents, ignoring non-numeric properties
                while (size--) {
                    // ensure commutative equality for sparse arrays
                    if (!(result = size in a == size in b && isEqual(a[size], b[size], stack))) {
                        break;
                    }
                }
            }
        } else {
            // objects with different constructors are not equivalent
            if ('constructor' in a != 'constructor' in b || a.constructor != b.constructor) {
                return false;
            }
            // deep compare objects
            for (var prop in a) {
                if (hasOwnProperty.call(a, prop)) {
                    // count the expected number of properties
                    size++;
                    // deep compare each member
                    if (!(result = hasOwnProperty.call(b, prop) && isEqual(a[prop], b[prop], stack))) {
                        break;
                    }
                }
            }
            // ensure that both objects contain the same number of properties
            if (result) {
                for (prop in b) {
                    if (hasOwnProperty.call(b, prop) && !(size--)) {
                        break;
                    }
                }
                result = !size;
            }
        }
        // remove the first collection from the stack of traversed objects
        stack.pop();
        return result;
    }

    /**
     * Checks if a `value` is a finite number.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} value The value to check.
     * @returns {Boolean} Returns `true` if the `value` is a finite number, else `false`.
     * @example
     *
     * _.isFinite(-101);
     * // => true
     *
     * _.isFinite('10');
     * // => false
     *
     * _.isFinite(Infinity);
     * // => false
     */
    function isFinite(value) {
        return nativeIsFinite(value) && toString.call(value) == numberClass;
    }

    /**
     * Checks if a `value` is a function.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} value The value to check.
     * @returns {Boolean} Returns `true` if the `value` is a function, else `false`.
     * @example
     *
     * _.isFunction(''.concat);
     * // => true
     */
    function isFunction(value) {
        return toString.call(value) == funcClass;
    }

    /**
     * Checks if a `value` is an object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} value The value to check.
     * @returns {Boolean} Returns `true` if the `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject(1);
     * // => false
     */
    function isObject(value) {
        return value === Object(value);
    }

    /**
     * Checks if a `value` is `NaN`.
     * Note: this is not the same as native `isNaN`, which will return true for
     * `undefined` and other values. See http://es5.github.com/#x15.1.2.4.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} value The value to check.
     * @returns {Boolean} Returns `true` if the `value` is `NaN`, else `false`.
     * @example
     *
     * _.isNaN(NaN);
     * // => true
     *
     * _.isNaN(new Number(NaN));
     * // => true
     *
     * isNaN(undefined);
     * // => true
     *
     * _.isNaN(undefined);
     * // => false
     */
    function isNaN(value) {
        // `NaN` as a primitive is the only value that is not equal to itself
        // (perform the [[Class]] check first to avoid errors with some host objects in IE)
        return toString.call(value) == numberClass && value != +value
    }

    /**
     * Checks if a `value` is `null`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} value The value to check.
     * @returns {Boolean} Returns `true` if the `value` is `null`, else `false`.
     * @example
     *
     * _.isNull(null);
     * // => true
     *
     * _.isNull(undefined);
     * // => false
     */
    function isNull(value) {
        return value === null;
    }

    /**
     * Checks if a `value` is a number.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} value The value to check.
     * @returns {Boolean} Returns `true` if the `value` is a number, else `false`.
     * @example
     *
     * _.isNumber(8.4 * 5;
     * // => true
     */
    function isNumber(value) {
        return toString.call(value) == numberClass;
    }

    /**
     * Checks if a `value` is a regular expression.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} value The value to check.
     * @returns {Boolean} Returns `true` if the `value` is a regular expression, else `false`.
     * @example
     *
     * _.isRegExp(/moe/);
     * // => true
     */
    function isRegExp(value) {
        return toString.call(value) == regexpClass;
    }

    /**
     * Checks if a `value` is a string.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} value The value to check.
     * @returns {Boolean} Returns `true` if the `value` is a string, else `false`.
     * @example
     *
     * _.isString('moe');
     * // => true
     */
    function isString(value) {
        return toString.call(value) == stringClass;
    }

    /**
     * Checks if a `value` is `undefined`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} value The value to check.
     * @returns {Boolean} Returns `true` if the `value` is `undefined`, else `false`.
     * @example
     *
     * _.isUndefined(void 0);
     * // => true
     */
    function isUndefined(value) {
        return value === undefined;
    }

    /**
     * Produces an array of the `object`'s enumerable own property names.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns a new array of property names.
     * @example
     *
     * _.keys({ 'one': 1, 'two': 2, 'three': 3 });
     * // => ['one', 'two', 'three']
     */
    var keys = nativeKeys || iterationFactory({
            'args': 'object',
            'exit': 'if (object !== Object(object)) throw TypeError()',
            'init': '[]',
            'inLoop': 'result.push(index)'
        });

    /**
     * Creates an object composed of the specified properties. Property names may
     * be specified as individual arguments or as arrays of property names.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to pluck.
     * @param {Object} [prop1, prop2, ..] The properties to pick.
     * @returns {Object} Returns an object composed of the picked properties.
     * @example
     *
     * _.pick({ 'name': 'moe', 'age': 40, 'userid': 'moe1' }, 'name', 'age');
     * // => { 'name': 'moe', 'age': 40 }
     */
    function pick(object) {
        var prop,
            index = 0,
            props = concat.apply(ArrayProto, arguments),
            length = props.length,
            result = {};

        // start `index` at `1` to skip `object`
        while (++index < length) {
            prop = props[index];
            if (prop in object) {
                result[prop] = object[prop];
            }
        }
        return result;
    }

    /**
     * Invokes `interceptor` with the `value` as the first argument, and then returns
     * `value`. The primary purpose of this method is to "tap into" a method chain,
     * in order to performoperations on intermediate results within the chain.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} value The value to pass to `callback`.
     * @param {Function} interceptor The function to invoke.
     * @returns {Mixed} Returns `value`.
     * @example
     *
     * _.chain([1,2,3,200])
     *  .filter(function(num) { return num % 2 == 0; })
     *  .tap(alert)
     *  .map(function(num) { return num * num })
     *  .value();
     * // => // [2, 200] (alerted)
     * // => [4, 40000]
     */
    function tap(value, interceptor) {
        interceptor(value);
        return value;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Escapes a string for insertion into HTML, replacing `&`, `<`, `"`, `'`,
     * and `/` characters.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {String} string The string to escape.
     * @returns {String} Returns the escaped string.
     * @example
     *
     * _.escape('Curly, Larry & Moe');
     * // => "Curly, Larry &amp; Moe"
     */
    function escape(string) {
        return (string + '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g,'&#x2F;');
    }

    /**
     * This function simply returns the first argument passed to it.
     * Note: It is used throughout Lo-Dash as a default callback.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Mixed} value Any value.
     * @returns {Mixed} Returns `value`.
     * @example
     *
     * var moe = { 'name': 'moe' };
     * moe === _.identity(moe);
     * // => true
     */
    function identity(value) {
        return value;
    }

    /**
     * Adds functions properties of `object` to the `lodash` function and chainable
     * wrapper.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Object} object The object of function properties to add to `lodash`.
     * @example
     *
     * _.mixin({
   *   'capitalize': function(string) {
   *     return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
   *   }
   * });
     *
     * _.capitalize('curly');
     * // => 'Curly'
     *
     * _('larry').capitalize();
     * // => 'Larry'
     */
    function mixin(object) {
        forEach(functions(object), function(methodName) {
            var func = lodash[methodName] = object[methodName];

            lodash.prototype[methodName] = function() {
                var args = [this._wrapped];
                push.apply(args, arguments);

                var result = func.apply(lodash, args);
                return this._chain ? new Lodash(result).chain() : result;
            };
        });
    }

    /**
     * Reverts the '_' variable to its previous value and returns a reference to
     * the `lodash` function.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @returns {Function} Returns the `lodash` function.
     * @example
     *
     * var lodash = _.noConflict();
     */
    function noConflict() {
        window._ = oldDash;
        return this;
    }

    /**
     * Resolves the value of `property` on `object`. If the property is a function
     * it will be invoked and its result returned, else the property value is returned.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Object} object The object to inspect.
     * @param {String} property The property to get the result of.
     * @returns {Mixed} Returns the resolved.
     * @example
     *
     * var object = {
   *   'cheese': 'crumpets',
   *   'stuff': function() {
   *     return 'nonsense';
   *   }
   * };
     *
     * _.result(object, 'cheese');
     * // => 'crumpets'
     *
     * _.result(object, 'stuff');
     * // => 'nonsense'
     */
    function result(object, property) {
        if (!object) {
            return null;
        }
        var value = object[property];
        return toString.call(value) == funcClass ? object[property]() : value;
    }

    /**
     * A JavaScript micro-templating method, similar to John Resig's implementation.
     * Lo-Dash templating handles arbitrary delimiters, preserves whitespace, and
     * correctly escapes quotes within interpolated code.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {String} text The template text.
     * @param {Obect} data The data object used to populate the text.
     * @param {Object} options The options object.
     * @returns {Function|String} Returns a compiled function when no `data` object
     *  is given, else it returns the interpolated text.
     * @example
     *
     * // using compiled template
     * var compiled = _.template('hello: <%= name %>');
     * compiled({ 'name': 'moe' });
     * // => 'hello: moe'
     *
     * var list = '% _.forEach(people, function(name) { %> <li><%= name %></li> <% }); %>';
     * _.template(list, { 'people': ['moe', 'curly', 'larry'] });
     * // => '<li>moe</li><li>curly</li><li>larry</li>'
     *
     * var template = _.template('<b><%- value %></b>');
     * template({ 'value': '<script>' });
     * // => '<b>&lt;script&gt;</b>'
     *
     * // using `print`
     * var compiled = _.template('<% print("Hello " + epithet); %>');
     * compiled({ 'epithet': 'stooge' });
     * // => 'Hello stooge.'
     *
     * // using custom template settings
     * _.templateSettings = {
   *   'interpolate': /\{\{(.+?)\}\}/g
   * };
     *
     * var template = _.template('Hello {{ name }}!');
     * template({ 'name': 'Mustache' });
     * // => 'Hello Mustache!'
     *
     *
     * // using the `variable` option
     * _.template('<%= data.hasWith %>', { 'hasWith': 'no' }, { 'variable': 'data' });
     * // => 'no'
     *
     * // using the `source` property
     * <script>
     *   JST.project = <%= _.template(jstText).source %>;
     * </script>
     */
    function template(text, data, options) {
        options = defaults(options || {}, lodash.templateSettings);

        var result,
            reEscapeDelimiter = options.escape,
            reEvaluateDelimiter = options.evaluate,
            reInterpolateDelimiter = options.interpolate,
            variable = options.variable;

        // tokenize delimiters to avoid escaping them
        if (reEscapeDelimiter) {
            text = text.replace(reEscapeDelimiter, tokenizeEscape);
        }
        if (reInterpolateDelimiter) {
            text = text.replace(reInterpolateDelimiter, tokenizeInterpolate);
        }
        if (reEvaluateDelimiter) {
            text = text.replace(reEvaluateDelimiter, tokenizeEvaluate);
        }

        // escape characters that cannot be included in string literals and
        // detokenize delimiter code snippets
        text = "__p='" + text.replace(reUnescaped, escapeChar).replace(reToken, detokenize) + "';\n";

        // clear stored code snippets
        tokenized.length = 0;

        // if `options.variable` is not specified, add `data` to the top of the scope chain
        if (!variable) {
            text = 'with (object || {}) {\n' + text + '\n}\n';
        }

        text = 'function(' + (variable || 'object') + ') {\n' +
            'var __p, __t;\n' +
            'function print() { __p += __j.call(arguments, "") }\n' +
            text +
            'return __p\n}';

        result = Function('_, __e, __j', 'return ' + text)(lodash, escape, join);

        if (data) {
            return result(data);
        }
        // provide the compiled function's source via its `toString()` method, in
        // supported environments, or the `source` property as a convenience for
        // build time precompilation
        result.source = text;
        return result;
    }

    /**
     * Executes the `callback` function `n` times. The `callback` is invoked with
     * 1 argument; (index).
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Number} n The number of times to execute the callback.
     * @param {Function} callback The function called per iteration.
     * @param {Mixed} [thisArg] The `this` binding for the callback.
     * @example
     *
     * _.times(3, function() { genie.grantWish(); });
     */
    function times(n, callback, thisArg) {
        if (thisArg) {
            callback = bind(callback, thisArg);
        }
        for (var index = 0; index < n; index++) {
            callback(index);
        }
    }

    /**
     * Generates a unique id. If `prefix` is passed, the id will be appended to it.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {String} [prefix] The value to prefix the id with.
     * @returns {Number|String} Returns a numeric id if no prefix is passed, else
     *  a string id may be returned.
     * @example
     *
     * _.uniqueId('contact_');
     * // => 'contact_104'
     */
    function uniqueId(prefix) {
        var id = idCounter++;
        return prefix ? prefix + id : id;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Wraps the value in a `lodash` chainable object.
     *
     * @static
     * @memberOf _
     * @category Chaining
     * @param {Mixed} value The value to wrap.
     * @returns {Object} Returns the `lodash` chainable object.
     * @example
     *
     * var stooges = [
     *   { 'name': 'moe', 'age': 40 },
     *   { 'name': 'larry', 'age': 50 },
     *   { 'name': 'curly', 'age': 60 }
     * ];
     *
     * var youngest = _.chain(stooges)
     *     .sortBy(function(stooge) { return stooge.age; })
     *     .map(function(stooge) { return stooge.name + ' is ' + stooge.age; })
     *     .first()
     *     .value();
     * // => 'moe is 40'
     */
    function chain(value) {
        return new Lodash(value).chain();
    }

    /**
     * Extracts the value from a wrapped chainable object.
     *
     * @name chain
     * @memberOf _
     * @category Chaining
     * @returns {Mixed} Returns the wrapped object.
     * @example
     *
     * _([1, 2, 3]).value();
     * // => [1, 2, 3]
     */
    function wrapperChain() {
        this._chain = true;
        return this;
    }

    /**
     * Extracts the value from a wrapped chainable object.
     *
     * @name value
     * @memberOf _
     * @category Chaining
     * @returns {Mixed} Returns the wrapped object.
     * @example
     *
     * _([1, 2, 3]).value();
     * // => [1, 2, 3]
     */
    function wrapperValue() {
        return this._wrapped;
    }

    /*--------------------------------------------------------------------------*/

    extend(lodash, {

        /**
         * The semantic version number.
         *
         * @static
         * @memberOf _
         * @type String
         */
        'VERSION': '0.1.0',

        /**
         * By default, Lo-Dash uses ERB-style template delimiters, change the
         * following template settings to use alternative delimiters.
         *
         * @static
         * @memberOf _
         * @type Object
         */
        'templateSettings': {

            /**
             * Used to detect `data` property values to be HTML-escaped.
             *
             * @static
             * @memberOf _.templateSettings
             * @type RegExp
             */
            'escape': /<%-([\s\S]+?)%>/g,

            /**
             * Used to detect code to be evaluated.
             *
             * @static
             * @memberOf _.templateSettings
             * @type RegExp
             */
            'evaluate': /<%([\s\S]+?)%>/g,

            /**
             * Used to detect `data` property values to inject.
             *
             * @static
             * @memberOf _.templateSettings
             * @type RegExp
             */
            'interpolate': /<%=([\s\S]+?)%>/g
        },

        // assign static methods
        'after': after,
        'bind': bind,
        'bindAll': bindAll,
        'chain': chain,
        'clone': clone,
        'compact': compact,
        'compose': compose,
        'contains': contains,
        'debounce': debounce,
        'defaults': defaults,
        'defer': defer,
        'delay': delay,
        'difference': difference,
        'escape': escape,
        'every': every,
        'extend': extend,
        'filter': filter,
        'find': find,
        'first': first,
        'flatten': flatten,
        'forEach': forEach,
        'functions': functions,
        'groupBy': groupBy,
        'has': has,
        'identity': identity,
        'indexOf': indexOf,
        'initial': initial,
        'intersection': intersection,
        'invoke': invoke,
        'isArguments': isArguments,
        'isArray': isArray,
        'isBoolean': isBoolean,
        'isDate': isDate,
        'isElement': isElement,
        'isEmpty': isEmpty,
        'isEqual': isEqual,
        'isFinite': isFinite,
        'isFunction': isFunction,
        'isNaN': isNaN,
        'isNull': isNull,
        'isNumber': isNumber,
        'isObject': isObject,
        'isRegExp': isRegExp,
        'isString': isString,
        'isUndefined': isUndefined,
        'keys': keys,
        'last': last,
        'lastIndexOf': lastIndexOf,
        'map': map,
        'max': max,
        'memoize': memoize,
        'min': min,
        'mixin': mixin,
        'noConflict': noConflict,
        'once': once,
        'pick': pick,
        'pluck': pluck,
        'range': range,
        'reduce': reduce,
        'reduceRight': reduceRight,
        'reject': reject,
        'rest': rest,
        'result': result,
        'shuffle': shuffle,
        'size': size,
        'some': some,
        'sortBy': sortBy,
        'sortedIndex': sortedIndex,
        'tap': tap,
        'template': template,
        'throttle': throttle,
        'times': times,
        'toArray': toArray,
        'union': union,
        'uniq': uniq,
        'uniqueId': uniqueId,
        'values': values,
        'without': without,
        'wrap': wrap,
        'zip': zip,

        // assign aliases
        'all': every,
        'any': some,
        'collect': map,
        'detect': find,
        'each': forEach,
        'foldl': reduce,
        'foldr': reduceRight,
        'head': first,
        'include': contains,
        'inject': reduce,
        'intersect': intersection,
        'methods': functions,
        'select': filter,
        'tail': rest,
        'take': first,
        'unique': uniq
    });

    /*--------------------------------------------------------------------------*/

    // assign private `Lodash` constructor's prototype
    Lodash.prototype = lodash.prototype;

    // add all of the static functions to `Lodash.prototype`
    mixin(lodash);

    // add all mutator Array functions to the wrapper.
    forEach(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(methodName) {
        var func = ArrayProto[methodName];

        lodash.prototype[methodName] = function() {
            var value = this._wrapped;
            func.apply(value, arguments);

            // IE compatibility mode and IE < 9 have buggy Array `shift()` and `splice()`
            // functions that fail to remove the last element, `object[0]`, of
            // array-like-objects even though the `length` property is set to `0`.
            // The `shift()` method is buggy in IE 8 compatibility mode, while `splice()`
            // is buggy regardless of mode in IE < 9 and buggy in compatibility mode in IE 9.
            if (value.length === 0) {
                delete value[0];
            }
            return this._chain ? new Lodash(value).chain() : value;
        };
    });

    // add all accessor Array functions to the wrapper.
    forEach(['concat', 'join', 'slice'], function(methodName) {
        var func = ArrayProto[methodName];
        Lodash.prototype[methodName] = function() {
            var result = func.apply(this._wrapped, arguments);
            return this._chain ? new Lodash(result).chain() : result;
        };
    });

    // add `chain` and `value` after calling to `mixin()` to avoid getting wrapped
    extend(Lodash.prototype, {
        'chain': wrapperChain,
        'value': wrapperValue
    });

    /*--------------------------------------------------------------------------*/

    // expose Lo-Dash
    if (freeExports) {
        // in Node.js or RingoJS v0.8.0+
        if (typeof module == 'object' && module && module.exports == freeExports) {
            (module.exports = lodash)._ = lodash;
        }
        // in Narwhal or RingoJS v0.7.0-
        else {
            freeExports._ = lodash;
        }
    }
    // in a browser or Rhino
    else {
        // Expose Lo-Dash to the global object even when an AMD loader is present in
        // case Lo-Dash was injected by a third-party script and not intended to be
        // loaded as a module. The global assignment can be reverted in the Lo-Dash
        // module via its `noConflict()` method.
        window._ = lodash;

        // some AMD build optimizers, like r.js, check for specific condition patterns like the following:
        if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
            // define as an anonymous module so, through path mapping, it can be
            // referenced as the "underscore" module
            define(function() {
                return lodash;
            });
        }
    }
}(this));

!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.io=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){

    module.exports = _dereq_('./lib/');

},{"./lib/":2}],2:[function(_dereq_,module,exports){

    /**
     * Module dependencies.
     */

    var url = _dereq_('./url');
    var parser = _dereq_('socket.io-parser');
    var Manager = _dereq_('./manager');
    var debug = _dereq_('debug')('socket.io-client');

    /**
     * Module exports.
     */

    module.exports = exports = lookup;

    /**
     * Managers cache.
     */

    var cache = exports.managers = {};

    /**
     * Looks up an existing `Manager` for multiplexing.
     * If the user summons:
     *
     *   `io('http://localhost/a');`
     *   `io('http://localhost/b');`
     *
     * We reuse the existing instance based on same scheme/port/host,
     * and we initialize sockets for each namespace.
     *
     * @api public
     */

    function lookup(uri, opts) {
        if (typeof uri == 'object') {
            opts = uri;
            uri = undefined;
        }

        opts = opts || {};

        var parsed = url(uri);
        var source = parsed.source;
        var id = parsed.id;
        var io;

        if (opts.forceNew || opts['force new connection'] || false === opts.multiplex) {
            debug('ignoring socket cache for %s', source);
            io = Manager(source, opts);
        } else {
            if (!cache[id]) {
                debug('new io instance for %s', source);
                cache[id] = Manager(source, opts);
            }
            io = cache[id];
        }

        return io.socket(parsed.path);
    }

    /**
     * Protocol version.
     *
     * @api public
     */

    exports.protocol = parser.protocol;

    /**
     * `connect`.
     *
     * @param {String} uri
     * @api public
     */

    exports.connect = lookup;

    /**
     * Expose constructors for standalone build.
     *
     * @api public
     */

    exports.Manager = _dereq_('./manager');
    exports.Socket = _dereq_('./socket');

},{"./manager":3,"./socket":5,"./url":6,"debug":10,"socket.io-parser":46}],3:[function(_dereq_,module,exports){

    /**
     * Module dependencies.
     */

    var url = _dereq_('./url');
    var eio = _dereq_('engine.io-client');
    var Socket = _dereq_('./socket');
    var Emitter = _dereq_('component-emitter');
    var parser = _dereq_('socket.io-parser');
    var on = _dereq_('./on');
    var bind = _dereq_('component-bind');
    var object = _dereq_('object-component');
    var debug = _dereq_('debug')('socket.io-client:manager');
    var indexOf = _dereq_('indexof');
    var Backoff = _dereq_('backo2');

    /**
     * Module exports
     */

    module.exports = Manager;

    /**
     * `Manager` constructor.
     *
     * @param {String} engine instance or engine uri/opts
     * @param {Object} options
     * @api public
     */

    function Manager(uri, opts){
        if (!(this instanceof Manager)) return new Manager(uri, opts);
        if (uri && ('object' == typeof uri)) {
            opts = uri;
            uri = undefined;
        }
        opts = opts || {};

        opts.path = opts.path || '/socket.io';
        this.nsps = {};
        this.subs = [];
        this.opts = opts;
        this.reconnection(opts.reconnection !== false);
        this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
        this.reconnectionDelay(opts.reconnectionDelay || 1000);
        this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);
        this.randomizationFactor(opts.randomizationFactor || 0.5);
        this.backoff = new Backoff({
            min: this.reconnectionDelay(),
            max: this.reconnectionDelayMax(),
            jitter: this.randomizationFactor()
        });
        this.timeout(null == opts.timeout ? 20000 : opts.timeout);
        this.readyState = 'closed';
        this.uri = uri;
        this.connected = [];
        this.encoding = false;
        this.packetBuffer = [];
        this.encoder = new parser.Encoder();
        this.decoder = new parser.Decoder();
        this.autoConnect = opts.autoConnect !== false;
        if (this.autoConnect) this.open();
    }

    /**
     * Propagate given event to sockets and emit on `this`
     *
     * @api private
     */

    Manager.prototype.emitAll = function() {
        this.emit.apply(this, arguments);
        for (var nsp in this.nsps) {
            this.nsps[nsp].emit.apply(this.nsps[nsp], arguments);
        }
    };

    /**
     * Update `socket.id` of all sockets
     *
     * @api private
     */

    Manager.prototype.updateSocketIds = function(){
        for (var nsp in this.nsps) {
            this.nsps[nsp].id = this.engine.id;
        }
    };

    /**
     * Mix in `Emitter`.
     */

    Emitter(Manager.prototype);

    /**
     * Sets the `reconnection` config.
     *
     * @param {Boolean} true/false if it should automatically reconnect
     * @return {Manager} self or value
     * @api public
     */

    Manager.prototype.reconnection = function(v){
        if (!arguments.length) return this._reconnection;
        this._reconnection = !!v;
        return this;
    };

    /**
     * Sets the reconnection attempts config.
     *
     * @param {Number} max reconnection attempts before giving up
     * @return {Manager} self or value
     * @api public
     */

    Manager.prototype.reconnectionAttempts = function(v){
        if (!arguments.length) return this._reconnectionAttempts;
        this._reconnectionAttempts = v;
        return this;
    };

    /**
     * Sets the delay between reconnections.
     *
     * @param {Number} delay
     * @return {Manager} self or value
     * @api public
     */

    Manager.prototype.reconnectionDelay = function(v){
        if (!arguments.length) return this._reconnectionDelay;
        this._reconnectionDelay = v;
        this.backoff && this.backoff.setMin(v);
        return this;
    };

    Manager.prototype.randomizationFactor = function(v){
        if (!arguments.length) return this._randomizationFactor;
        this._randomizationFactor = v;
        this.backoff && this.backoff.setJitter(v);
        return this;
    };

    /**
     * Sets the maximum delay between reconnections.
     *
     * @param {Number} delay
     * @return {Manager} self or value
     * @api public
     */

    Manager.prototype.reconnectionDelayMax = function(v){
        if (!arguments.length) return this._reconnectionDelayMax;
        this._reconnectionDelayMax = v;
        this.backoff && this.backoff.setMax(v);
        return this;
    };

    /**
     * Sets the connection timeout. `false` to disable
     *
     * @return {Manager} self or value
     * @api public
     */

    Manager.prototype.timeout = function(v){
        if (!arguments.length) return this._timeout;
        this._timeout = v;
        return this;
    };

    /**
     * Starts trying to reconnect if reconnection is enabled and we have not
     * started reconnecting yet
     *
     * @api private
     */

    Manager.prototype.maybeReconnectOnOpen = function() {
        // Only try to reconnect if it's the first time we're connecting
        if (!this.reconnecting && this._reconnection && this.backoff.attempts === 0) {
            // keeps reconnection from firing twice for the same reconnection loop
            this.reconnect();
        }
    };


    /**
     * Sets the current transport `socket`.
     *
     * @param {Function} optional, callback
     * @return {Manager} self
     * @api public
     */

    Manager.prototype.open =
        Manager.prototype.connect = function(fn){
            debug('readyState %s', this.readyState);
            if (~this.readyState.indexOf('open')) return this;

            debug('opening %s', this.uri);
            this.engine = eio(this.uri, this.opts);
            var socket = this.engine;
            var self = this;
            this.readyState = 'opening';
            this.skipReconnect = false;

            // emit `open`
            var openSub = on(socket, 'open', function() {
                self.onopen();
                fn && fn();
            });

            // emit `connect_error`
            var errorSub = on(socket, 'error', function(data){
                debug('connect_error');
                self.cleanup();
                self.readyState = 'closed';
                self.emitAll('connect_error', data);
                if (fn) {
                    var err = new Error('Connection error');
                    err.data = data;
                    fn(err);
                } else {
                    // Only do this if there is no fn to handle the error
                    self.maybeReconnectOnOpen();
                }
            });

            // emit `connect_timeout`
            if (false !== this._timeout) {
                var timeout = this._timeout;
                debug('connect attempt will timeout after %d', timeout);

                // set timer
                var timer = setTimeout(function(){
                    debug('connect attempt timed out after %d', timeout);
                    openSub.destroy();
                    socket.close();
                    socket.emit('error', 'timeout');
                    self.emitAll('connect_timeout', timeout);
                }, timeout);

                this.subs.push({
                    destroy: function(){
                        clearTimeout(timer);
                    }
                });
            }

            this.subs.push(openSub);
            this.subs.push(errorSub);

            return this;
        };

    /**
     * Called upon transport open.
     *
     * @api private
     */

    Manager.prototype.onopen = function(){
        debug('open');

        // clear old subs
        this.cleanup();

        // mark as open
        this.readyState = 'open';
        this.emit('open');

        // add new subs
        var socket = this.engine;
        this.subs.push(on(socket, 'data', bind(this, 'ondata')));
        this.subs.push(on(this.decoder, 'decoded', bind(this, 'ondecoded')));
        this.subs.push(on(socket, 'error', bind(this, 'onerror')));
        this.subs.push(on(socket, 'close', bind(this, 'onclose')));
    };

    /**
     * Called with data.
     *
     * @api private
     */

    Manager.prototype.ondata = function(data){
        this.decoder.add(data);
    };

    /**
     * Called when parser fully decodes a packet.
     *
     * @api private
     */

    Manager.prototype.ondecoded = function(packet) {
        this.emit('packet', packet);
    };

    /**
     * Called upon socket error.
     *
     * @api private
     */

    Manager.prototype.onerror = function(err){
        debug('error', err);
        this.emitAll('error', err);
    };

    /**
     * Creates a new socket for the given `nsp`.
     *
     * @return {Socket}
     * @api public
     */

    Manager.prototype.socket = function(nsp){
        var socket = this.nsps[nsp];
        if (!socket) {
            socket = new Socket(this, nsp);
            this.nsps[nsp] = socket;
            var self = this;
            socket.on('connect', function(){
                socket.id = self.engine.id;
                if (!~indexOf(self.connected, socket)) {
                    self.connected.push(socket);
                }
            });
        }
        return socket;
    };

    /**
     * Called upon a socket close.
     *
     * @param {Socket} socket
     */

    Manager.prototype.destroy = function(socket){
        var index = indexOf(this.connected, socket);
        if (~index) this.connected.splice(index, 1);
        if (this.connected.length) return;

        this.close();
    };

    /**
     * Writes a packet.
     *
     * @param {Object} packet
     * @api private
     */

    Manager.prototype.packet = function(packet){
        debug('writing packet %j', packet);
        var self = this;

        if (!self.encoding) {
            // encode, then write to engine with result
            self.encoding = true;
            this.encoder.encode(packet, function(encodedPackets) {
                for (var i = 0; i < encodedPackets.length; i++) {
                    self.engine.write(encodedPackets[i]);
                }
                self.encoding = false;
                self.processPacketQueue();
            });
        } else { // add packet to the queue
            self.packetBuffer.push(packet);
        }
    };

    /**
     * If packet buffer is non-empty, begins encoding the
     * next packet in line.
     *
     * @api private
     */

    Manager.prototype.processPacketQueue = function() {
        if (this.packetBuffer.length > 0 && !this.encoding) {
            var pack = this.packetBuffer.shift();
            this.packet(pack);
        }
    };

    /**
     * Clean up transport subscriptions and packet buffer.
     *
     * @api private
     */

    Manager.prototype.cleanup = function(){
        var sub;
        while (sub = this.subs.shift()) sub.destroy();

        this.packetBuffer = [];
        this.encoding = false;

        this.decoder.destroy();
    };

    /**
     * Close the current socket.
     *
     * @api private
     */

    Manager.prototype.close =
        Manager.prototype.disconnect = function(){
            this.skipReconnect = true;
            this.backoff.reset();
            this.readyState = 'closed';
            this.engine && this.engine.close();
        };

    /**
     * Called upon engine close.
     *
     * @api private
     */

    Manager.prototype.onclose = function(reason){
        debug('close');
        this.cleanup();
        this.backoff.reset();
        this.readyState = 'closed';
        this.emit('close', reason);
        if (this._reconnection && !this.skipReconnect) {
            this.reconnect();
        }
    };

    /**
     * Attempt a reconnection.
     *
     * @api private
     */

    Manager.prototype.reconnect = function(){
        if (this.reconnecting || this.skipReconnect) return this;

        var self = this;

        if (this.backoff.attempts >= this._reconnectionAttempts) {
            debug('reconnect failed');
            this.backoff.reset();
            this.emitAll('reconnect_failed');
            this.reconnecting = false;
        } else {
            var delay = this.backoff.duration();
            debug('will wait %dms before reconnect attempt', delay);

            this.reconnecting = true;
            var timer = setTimeout(function(){
                if (self.skipReconnect) return;

                debug('attempting reconnect');
                self.emitAll('reconnect_attempt', self.backoff.attempts);
                self.emitAll('reconnecting', self.backoff.attempts);

                // check again for the case socket closed in above events
                if (self.skipReconnect) return;

                self.open(function(err){
                    if (err) {
                        debug('reconnect attempt error');
                        self.reconnecting = false;
                        self.reconnect();
                        self.emitAll('reconnect_error', err.data);
                    } else {
                        debug('reconnect success');
                        self.onreconnect();
                    }
                });
            }, delay);

            this.subs.push({
                destroy: function(){
                    clearTimeout(timer);
                }
            });
        }
    };

    /**
     * Called upon successful reconnect.
     *
     * @api private
     */

    Manager.prototype.onreconnect = function(){
        var attempt = this.backoff.attempts;
        this.reconnecting = false;
        this.backoff.reset();
        this.updateSocketIds();
        this.emitAll('reconnect', attempt);
    };

},{"./on":4,"./socket":5,"./url":6,"backo2":7,"component-bind":8,"component-emitter":9,"debug":10,"engine.io-client":11,"indexof":42,"object-component":43,"socket.io-parser":46}],4:[function(_dereq_,module,exports){

    /**
     * Module exports.
     */

    module.exports = on;

    /**
     * Helper for subscriptions.
     *
     * @param {Object|EventEmitter} obj with `Emitter` mixin or `EventEmitter`
     * @param {String} event name
     * @param {Function} callback
     * @api public
     */

    function on(obj, ev, fn) {
        obj.on(ev, fn);
        return {
            destroy: function(){
                obj.removeListener(ev, fn);
            }
        };
    }

},{}],5:[function(_dereq_,module,exports){

    /**
     * Module dependencies.
     */

    var parser = _dereq_('socket.io-parser');
    var Emitter = _dereq_('component-emitter');
    var toArray = _dereq_('to-array');
    var on = _dereq_('./on');
    var bind = _dereq_('component-bind');
    var debug = _dereq_('debug')('socket.io-client:socket');
    var hasBin = _dereq_('has-binary');

    /**
     * Module exports.
     */

    module.exports = exports = Socket;

    /**
     * Internal events (blacklisted).
     * These events can't be emitted by the user.
     *
     * @api private
     */

    var events = {
        connect: 1,
        connect_error: 1,
        connect_timeout: 1,
        disconnect: 1,
        error: 1,
        reconnect: 1,
        reconnect_attempt: 1,
        reconnect_failed: 1,
        reconnect_error: 1,
        reconnecting: 1
    };

    /**
     * Shortcut to `Emitter#emit`.
     */

    var emit = Emitter.prototype.emit;

    /**
     * `Socket` constructor.
     *
     * @api public
     */

    function Socket(io, nsp){
        this.io = io;
        this.nsp = nsp;
        this.json = this; // compat
        this.ids = 0;
        this.acks = {};
        if (this.io.autoConnect) this.open();
        this.receiveBuffer = [];
        this.sendBuffer = [];
        this.connected = false;
        this.disconnected = true;
    }

    /**
     * Mix in `Emitter`.
     */

    Emitter(Socket.prototype);

    /**
     * Subscribe to open, close and packet events
     *
     * @api private
     */

    Socket.prototype.subEvents = function() {
        if (this.subs) return;

        var io = this.io;
        this.subs = [
            on(io, 'open', bind(this, 'onopen')),
            on(io, 'packet', bind(this, 'onpacket')),
            on(io, 'close', bind(this, 'onclose'))
        ];
    };

    /**
     * "Opens" the socket.
     *
     * @api public
     */

    Socket.prototype.open =
        Socket.prototype.connect = function(){
            if (this.connected) return this;

            this.subEvents();
            this.io.open(); // ensure open
            if ('open' == this.io.readyState) this.onopen();
            return this;
        };

    /**
     * Sends a `message` event.
     *
     * @return {Socket} self
     * @api public
     */

    Socket.prototype.send = function(){
        var args = toArray(arguments);
        args.unshift('message');
        this.emit.apply(this, args);
        return this;
    };

    /**
     * Override `emit`.
     * If the event is in `events`, it's emitted normally.
     *
     * @param {String} event name
     * @return {Socket} self
     * @api public
     */

    Socket.prototype.emit = function(ev){
        if (events.hasOwnProperty(ev)) {
            emit.apply(this, arguments);
            return this;
        }

        var args = toArray(arguments);
        var parserType = parser.EVENT; // default
        if (hasBin(args)) { parserType = parser.BINARY_EVENT; } // binary
        var packet = { type: parserType, data: args };

        // event ack callback
        if ('function' == typeof args[args.length - 1]) {
            debug('emitting packet with ack id %d', this.ids);
            this.acks[this.ids] = args.pop();
            packet.id = this.ids++;
        }

        if (this.connected) {
            this.packet(packet);
        } else {
            this.sendBuffer.push(packet);
        }

        return this;
    };

    /**
     * Sends a packet.
     *
     * @param {Object} packet
     * @api private
     */

    Socket.prototype.packet = function(packet){
        packet.nsp = this.nsp;
        this.io.packet(packet);
    };

    /**
     * Called upon engine `open`.
     *
     * @api private
     */

    Socket.prototype.onopen = function(){
        debug('transport is open - connecting');

        // write connect packet if necessary
        if ('/' != this.nsp) {
            this.packet({ type: parser.CONNECT });
        }
    };

    /**
     * Called upon engine `close`.
     *
     * @param {String} reason
     * @api private
     */

    Socket.prototype.onclose = function(reason){
        debug('close (%s)', reason);
        this.connected = false;
        this.disconnected = true;
        delete this.id;
        this.emit('disconnect', reason);
    };

    /**
     * Called with socket packet.
     *
     * @param {Object} packet
     * @api private
     */

    Socket.prototype.onpacket = function(packet){
        if (packet.nsp != this.nsp) return;

        switch (packet.type) {
            case parser.CONNECT:
                this.onconnect();
                break;

            case parser.EVENT:
                this.onevent(packet);
                break;

            case parser.BINARY_EVENT:
                this.onevent(packet);
                break;

            case parser.ACK:
                this.onack(packet);
                break;

            case parser.BINARY_ACK:
                this.onack(packet);
                break;

            case parser.DISCONNECT:
                this.ondisconnect();
                break;

            case parser.ERROR:
                this.emit('error', packet.data);
                break;
        }
    };

    /**
     * Called upon a server event.
     *
     * @param {Object} packet
     * @api private
     */

    Socket.prototype.onevent = function(packet){
        var args = packet.data || [];
        debug('emitting event %j', args);

        if (null != packet.id) {
            debug('attaching ack callback to event');
            args.push(this.ack(packet.id));
        }

        if (this.connected) {
            emit.apply(this, args);
        } else {
            this.receiveBuffer.push(args);
        }
    };

    /**
     * Produces an ack callback to emit with an event.
     *
     * @api private
     */

    Socket.prototype.ack = function(id){
        var self = this;
        var sent = false;
        return function(){
            // prevent double callbacks
            if (sent) return;
            sent = true;
            var args = toArray(arguments);
            debug('sending ack %j', args);

            var type = hasBin(args) ? parser.BINARY_ACK : parser.ACK;
            self.packet({
                type: type,
                id: id,
                data: args
            });
        };
    };

    /**
     * Called upon a server acknowlegement.
     *
     * @param {Object} packet
     * @api private
     */

    Socket.prototype.onack = function(packet){
        debug('calling ack %s with %j', packet.id, packet.data);
        var fn = this.acks[packet.id];
        fn.apply(this, packet.data);
        delete this.acks[packet.id];
    };

    /**
     * Called upon server connect.
     *
     * @api private
     */

    Socket.prototype.onconnect = function(){
        this.connected = true;
        this.disconnected = false;
        this.emit('connect');
        this.emitBuffered();
    };

    /**
     * Emit buffered events (received and emitted).
     *
     * @api private
     */

    Socket.prototype.emitBuffered = function(){
        var i;
        for (i = 0; i < this.receiveBuffer.length; i++) {
            emit.apply(this, this.receiveBuffer[i]);
        }
        this.receiveBuffer = [];

        for (i = 0; i < this.sendBuffer.length; i++) {
            this.packet(this.sendBuffer[i]);
        }
        this.sendBuffer = [];
    };

    /**
     * Called upon server disconnect.
     *
     * @api private
     */

    Socket.prototype.ondisconnect = function(){
        debug('server disconnect (%s)', this.nsp);
        this.destroy();
        this.onclose('io server disconnect');
    };

    /**
     * Called upon forced client/server side disconnections,
     * this method ensures the manager stops tracking us and
     * that reconnections don't get triggered for this.
     *
     * @api private.
     */

    Socket.prototype.destroy = function(){
        if (this.subs) {
            // clean subscriptions to avoid reconnections
            for (var i = 0; i < this.subs.length; i++) {
                this.subs[i].destroy();
            }
            this.subs = null;
        }

        this.io.destroy(this);
    };

    /**
     * Disconnects the socket manually.
     *
     * @return {Socket} self
     * @api public
     */

    Socket.prototype.close =
        Socket.prototype.disconnect = function(){
            if (this.connected) {
                debug('performing disconnect (%s)', this.nsp);
                this.packet({ type: parser.DISCONNECT });
            }

            // remove socket from pool
            this.destroy();

            if (this.connected) {
                // fire events
                this.onclose('io client disconnect');
            }
            return this;
        };

},{"./on":4,"component-bind":8,"component-emitter":9,"debug":10,"has-binary":38,"socket.io-parser":46,"to-array":50}],6:[function(_dereq_,module,exports){
    (function (global){

        /**
         * Module dependencies.
         */

        var parseuri = _dereq_('parseuri');
        var debug = _dereq_('debug')('socket.io-client:url');

        /**
         * Module exports.
         */

        module.exports = url;

        /**
         * URL parser.
         *
         * @param {String} url
         * @param {Object} An object meant to mimic window.location.
         *                 Defaults to window.location.
         * @api public
         */

        function url(uri, loc){
            var obj = uri;

            // default to window.location
            var loc = loc || global.location;
            if (null == uri) uri = loc.protocol + '//' + loc.host;

            // relative path support
            if ('string' == typeof uri) {
                if ('/' == uri.charAt(0)) {
                    if ('/' == uri.charAt(1)) {
                        uri = loc.protocol + uri;
                    } else {
                        uri = loc.hostname + uri;
                    }
                }

                if (!/^(https?|wss?):\/\//.test(uri)) {
                    debug('protocol-less url %s', uri);
                    if ('undefined' != typeof loc) {
                        uri = loc.protocol + '//' + uri;
                    } else {
                        uri = 'https://' + uri;
                    }
                }

                // parse
                debug('parse %s', uri);
                obj = parseuri(uri);
            }

            // make sure we treat `localhost:80` and `localhost` equally
            if (!obj.port) {
                if (/^(http|ws)$/.test(obj.protocol)) {
                    obj.port = '80';
                }
                else if (/^(http|ws)s$/.test(obj.protocol)) {
                    obj.port = '443';
                }
            }

            obj.path = obj.path || '/';

            // define unique id
            obj.id = obj.protocol + '://' + obj.host + ':' + obj.port;
            // define href
            obj.href = obj.protocol + '://' + obj.host + (loc && loc.port == obj.port ? '' : (':' + obj.port));

            return obj;
        }

    }).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"debug":10,"parseuri":44}],7:[function(_dereq_,module,exports){

    /**
     * Expose `Backoff`.
     */

    module.exports = Backoff;

    /**
     * Initialize backoff timer with `opts`.
     *
     * - `min` initial timeout in milliseconds [100]
     * - `max` max timeout [10000]
     * - `jitter` [0]
     * - `factor` [2]
     *
     * @param {Object} opts
     * @api public
     */

    function Backoff(opts) {
        opts = opts || {};
        this.ms = opts.min || 100;
        this.max = opts.max || 10000;
        this.factor = opts.factor || 2;
        this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
        this.attempts = 0;
    }

    /**
     * Return the backoff duration.
     *
     * @return {Number}
     * @api public
     */

    Backoff.prototype.duration = function(){
        var ms = this.ms * Math.pow(this.factor, this.attempts++);
        if (this.jitter) {
            var rand =  Math.random();
            var deviation = Math.floor(rand * this.jitter * ms);
            ms = (Math.floor(rand * 10) & 1) == 0  ? ms - deviation : ms + deviation;
        }
        return Math.min(ms, this.max) | 0;
    };

    /**
     * Reset the number of attempts.
     *
     * @api public
     */

    Backoff.prototype.reset = function(){
        this.attempts = 0;
    };

    /**
     * Set the minimum duration
     *
     * @api public
     */

    Backoff.prototype.setMin = function(min){
        this.ms = min;
    };

    /**
     * Set the maximum duration
     *
     * @api public
     */

    Backoff.prototype.setMax = function(max){
        this.max = max;
    };

    /**
     * Set the jitter
     *
     * @api public
     */

    Backoff.prototype.setJitter = function(jitter){
        this.jitter = jitter;
    };


},{}],8:[function(_dereq_,module,exports){
    /**
     * Slice reference.
     */

    var slice = [].slice;

    /**
     * Bind `obj` to `fn`.
     *
     * @param {Object} obj
     * @param {Function|String} fn or string
     * @return {Function}
     * @api public
     */

    module.exports = function(obj, fn){
        if ('string' == typeof fn) fn = obj[fn];
        if ('function' != typeof fn) throw new Error('bind() requires a function');
        var args = slice.call(arguments, 2);
        return function(){
            return fn.apply(obj, args.concat(slice.call(arguments)));
        }
    };

},{}],9:[function(_dereq_,module,exports){

    /**
     * Expose `Emitter`.
     */

    module.exports = Emitter;

    /**
     * Initialize a new `Emitter`.
     *
     * @api public
     */

    function Emitter(obj) {
        if (obj) return mixin(obj);
    };

    /**
     * Mixin the emitter properties.
     *
     * @param {Object} obj
     * @return {Object}
     * @api private
     */

    function mixin(obj) {
        for (var key in Emitter.prototype) {
            obj[key] = Emitter.prototype[key];
        }
        return obj;
    }

    /**
     * Listen on the given `event` with `fn`.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.on =
        Emitter.prototype.addEventListener = function(event, fn){
            this._callbacks = this._callbacks || {};
            (this._callbacks[event] = this._callbacks[event] || [])
                .push(fn);
            return this;
        };

    /**
     * Adds an `event` listener that will be invoked a single
     * time then automatically removed.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.once = function(event, fn){
        var self = this;
        this._callbacks = this._callbacks || {};

        function on() {
            self.off(event, on);
            fn.apply(this, arguments);
        }

        on.fn = fn;
        this.on(event, on);
        return this;
    };

    /**
     * Remove the given callback for `event` or all
     * registered callbacks.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.off =
        Emitter.prototype.removeListener =
            Emitter.prototype.removeAllListeners =
                Emitter.prototype.removeEventListener = function(event, fn){
                    this._callbacks = this._callbacks || {};

                    // all
                    if (0 == arguments.length) {
                        this._callbacks = {};
                        return this;
                    }

                    // specific event
                    var callbacks = this._callbacks[event];
                    if (!callbacks) return this;

                    // remove all handlers
                    if (1 == arguments.length) {
                        delete this._callbacks[event];
                        return this;
                    }

                    // remove specific handler
                    var cb;
                    for (var i = 0; i < callbacks.length; i++) {
                        cb = callbacks[i];
                        if (cb === fn || cb.fn === fn) {
                            callbacks.splice(i, 1);
                            break;
                        }
                    }
                    return this;
                };

    /**
     * Emit `event` with the given args.
     *
     * @param {String} event
     * @param {Mixed} ...
     * @return {Emitter}
     */

    Emitter.prototype.emit = function(event){
        this._callbacks = this._callbacks || {};
        var args = [].slice.call(arguments, 1)
            , callbacks = this._callbacks[event];

        if (callbacks) {
            callbacks = callbacks.slice(0);
            for (var i = 0, len = callbacks.length; i < len; ++i) {
                callbacks[i].apply(this, args);
            }
        }

        return this;
    };

    /**
     * Return array of callbacks for `event`.
     *
     * @param {String} event
     * @return {Array}
     * @api public
     */

    Emitter.prototype.listeners = function(event){
        this._callbacks = this._callbacks || {};
        return this._callbacks[event] || [];
    };

    /**
     * Check if this emitter has `event` handlers.
     *
     * @param {String} event
     * @return {Boolean}
     * @api public
     */

    Emitter.prototype.hasListeners = function(event){
        return !! this.listeners(event).length;
    };

},{}],10:[function(_dereq_,module,exports){

    /**
     * Expose `debug()` as the module.
     */

    module.exports = debug;

    /**
     * Create a debugger with the given `name`.
     *
     * @param {String} name
     * @return {Type}
     * @api public
     */

    function debug(name) {
        if (!debug.enabled(name)) return function(){};

        return function(fmt){
            fmt = coerce(fmt);

            var curr = new Date;
            var ms = curr - (debug[name] || curr);
            debug[name] = curr;

            fmt = name
                + ' '
                + fmt
                + ' +' + debug.humanize(ms);

            // This hackery is required for IE8
            // where `console.log` doesn't have 'apply'
            window.console
            && console.log
            && Function.prototype.apply.call(console.log, console, arguments);
        }
    }

    /**
     * The currently active debug mode names.
     */

    debug.names = [];
    debug.skips = [];

    /**
     * Enables a debug mode by name. This can include modes
     * separated by a colon and wildcards.
     *
     * @param {String} name
     * @api public
     */

    debug.enable = function(name) {
        try {
            localStorage.debug = name;
        } catch(e){}

        var split = (name || '').split(/[\s,]+/)
            , len = split.length;

        for (var i = 0; i < len; i++) {
            name = split[i].replace('*', '.*?');
            if (name[0] === '-') {
                debug.skips.push(new RegExp('^' + name.substr(1) + '$'));
            }
            else {
                debug.names.push(new RegExp('^' + name + '$'));
            }
        }
    };

    /**
     * Disable debug output.
     *
     * @api public
     */

    debug.disable = function(){
        debug.enable('');
    };

    /**
     * Humanize the given `ms`.
     *
     * @param {Number} m
     * @return {String}
     * @api private
     */

    debug.humanize = function(ms) {
        var sec = 1000
            , min = 60 * 1000
            , hour = 60 * min;

        if (ms >= hour) return (ms / hour).toFixed(1) + 'h';
        if (ms >= min) return (ms / min).toFixed(1) + 'm';
        if (ms >= sec) return (ms / sec | 0) + 's';
        return ms + 'ms';
    };

    /**
     * Returns true if the given mode name is enabled, false otherwise.
     *
     * @param {String} name
     * @return {Boolean}
     * @api public
     */

    debug.enabled = function(name) {
        for (var i = 0, len = debug.skips.length; i < len; i++) {
            if (debug.skips[i].test(name)) {
                return false;
            }
        }
        for (var i = 0, len = debug.names.length; i < len; i++) {
            if (debug.names[i].test(name)) {
                return true;
            }
        }
        return false;
    };

    /**
     * Coerce `val`.
     */

    function coerce(val) {
        if (val instanceof Error) return val.stack || val.message;
        return val;
    }

// persist

    try {
        if (window.localStorage) debug.enable(localStorage.debug);
    } catch(e){}

},{}],11:[function(_dereq_,module,exports){

    module.exports =  _dereq_('./lib/');

},{"./lib/":12}],12:[function(_dereq_,module,exports){

    module.exports = _dereq_('./socket');

    /**
     * Exports parser
     *
     * @api public
     *
     */
    module.exports.parser = _dereq_('engine.io-parser');

},{"./socket":13,"engine.io-parser":25}],13:[function(_dereq_,module,exports){
    (function (global){
        /**
         * Module dependencies.
         */

        var transports = _dereq_('./transports');
        var Emitter = _dereq_('component-emitter');
        var debug = _dereq_('debug')('engine.io-client:socket');
        var index = _dereq_('indexof');
        var parser = _dereq_('engine.io-parser');
        var parseuri = _dereq_('parseuri');
        var parsejson = _dereq_('parsejson');
        var parseqs = _dereq_('parseqs');

        /**
         * Module exports.
         */

        module.exports = Socket;

        /**
         * Noop function.
         *
         * @api private
         */

        function noop(){}

        /**
         * Socket constructor.
         *
         * @param {String|Object} uri or options
         * @param {Object} options
         * @api public
         */

        function Socket(uri, opts){
            if (!(this instanceof Socket)) return new Socket(uri, opts);

            opts = opts || {};

            if (uri && 'object' == typeof uri) {
                opts = uri;
                uri = null;
            }

            if (uri) {
                uri = parseuri(uri);
                opts.host = uri.host;
                opts.secure = uri.protocol == 'https' || uri.protocol == 'wss';
                opts.port = uri.port;
                if (uri.query) opts.query = uri.query;
            }

            this.secure = null != opts.secure ? opts.secure :
                (global.location && 'https:' == location.protocol);

            if (opts.host) {
                var pieces = opts.host.split(':');
                opts.hostname = pieces.shift();
                if (pieces.length) {
                    opts.port = pieces.pop();
                } else if (!opts.port) {
                    // if no port is specified manually, use the protocol default
                    opts.port = this.secure ? '443' : '80';
                }
            }

            this.agent = opts.agent || false;
            this.hostname = opts.hostname ||
                (global.location ? location.hostname : 'localhost');
            this.port = opts.port || (global.location && location.port ?
                    location.port :
                    (this.secure ? 443 : 80));
            this.query = opts.query || {};
            if ('string' == typeof this.query) this.query = parseqs.decode(this.query);
            this.upgrade = false !== opts.upgrade;
            this.path = (opts.path || '/engine.io').replace(/\/$/, '') + '/';
            this.forceJSONP = !!opts.forceJSONP;
            this.jsonp = false !== opts.jsonp;
            this.forceBase64 = !!opts.forceBase64;
            this.enablesXDR = !!opts.enablesXDR;
            this.timestampParam = opts.timestampParam || 't';
            this.timestampRequests = opts.timestampRequests;
            this.transports = opts.transports || ['polling', 'websocket'];
            this.readyState = '';
            this.writeBuffer = [];
            this.callbackBuffer = [];
            this.policyPort = opts.policyPort || 843;
            this.rememberUpgrade = opts.rememberUpgrade || false;
            this.binaryType = null;
            this.onlyBinaryUpgrades = opts.onlyBinaryUpgrades;

            // SSL options for Node.js client
            this.pfx = opts.pfx || null;
            this.key = opts.key || null;
            this.passphrase = opts.passphrase || null;
            this.cert = opts.cert || null;
            this.ca = opts.ca || null;
            this.ciphers = opts.ciphers || null;
            this.rejectUnauthorized = opts.rejectUnauthorized || null;

            this.open();
        }

        Socket.priorWebsocketSuccess = false;

        /**
         * Mix in `Emitter`.
         */

        Emitter(Socket.prototype);

        /**
         * Protocol version.
         *
         * @api public
         */

        Socket.protocol = parser.protocol; // this is an int

        /**
         * Expose deps for legacy compatibility
         * and standalone browser access.
         */

        Socket.Socket = Socket;
        Socket.Transport = _dereq_('./transport');
        Socket.transports = _dereq_('./transports');
        Socket.parser = _dereq_('engine.io-parser');

        /**
         * Creates transport of the given type.
         *
         * @param {String} transport name
         * @return {Transport}
         * @api private
         */

        Socket.prototype.createTransport = function (name) {
            debug('creating transport "%s"', name);
            var query = clone(this.query);

            // append engine.io protocol identifier
            query.EIO = parser.protocol;

            // transport name
            query.transport = name;

            // session id if we already have one
            if (this.id) query.sid = this.id;

            var transport = new transports[name]({
                agent: this.agent,
                hostname: this.hostname,
                port: this.port,
                secure: this.secure,
                path: this.path,
                query: query,
                forceJSONP: this.forceJSONP,
                jsonp: this.jsonp,
                forceBase64: this.forceBase64,
                enablesXDR: this.enablesXDR,
                timestampRequests: this.timestampRequests,
                timestampParam: this.timestampParam,
                policyPort: this.policyPort,
                socket: this,
                pfx: this.pfx,
                key: this.key,
                passphrase: this.passphrase,
                cert: this.cert,
                ca: this.ca,
                ciphers: this.ciphers,
                rejectUnauthorized: this.rejectUnauthorized
            });

            return transport;
        };

        function clone (obj) {
            var o = {};
            for (var i in obj) {
                if (obj.hasOwnProperty(i)) {
                    o[i] = obj[i];
                }
            }
            return o;
        }

        /**
         * Initializes transport to use and starts probe.
         *
         * @api private
         */
        Socket.prototype.open = function () {
            var transport;
            if (this.rememberUpgrade && Socket.priorWebsocketSuccess && this.transports.indexOf('websocket') != -1) {
                transport = 'websocket';
            } else if (0 == this.transports.length) {
                // Emit error on next tick so it can be listened to
                var self = this;
                setTimeout(function() {
                    self.emit('error', 'No transports available');
                }, 0);
                return;
            } else {
                transport = this.transports[0];
            }
            this.readyState = 'opening';

            // Retry with the next transport if the transport is disabled (jsonp: false)
            var transport;
            try {
                transport = this.createTransport(transport);
            } catch (e) {
                this.transports.shift();
                this.open();
                return;
            }

            transport.open();
            this.setTransport(transport);
        };

        /**
         * Sets the current transport. Disables the existing one (if any).
         *
         * @api private
         */

        Socket.prototype.setTransport = function(transport){
            debug('setting transport %s', transport.name);
            var self = this;

            if (this.transport) {
                debug('clearing existing transport %s', this.transport.name);
                this.transport.removeAllListeners();
            }

            // set up transport
            this.transport = transport;

            // set up transport listeners
            transport
                .on('drain', function(){
                    self.onDrain();
                })
                .on('packet', function(packet){
                    self.onPacket(packet);
                })
                .on('error', function(e){
                    self.onError(e);
                })
                .on('close', function(){
                    self.onClose('transport close');
                });
        };

        /**
         * Probes a transport.
         *
         * @param {String} transport name
         * @api private
         */

        Socket.prototype.probe = function (name) {
            debug('probing transport "%s"', name);
            var transport = this.createTransport(name, { probe: 1 })
                , failed = false
                , self = this;

            Socket.priorWebsocketSuccess = false;

            function onTransportOpen(){
                if (self.onlyBinaryUpgrades) {
                    var upgradeLosesBinary = !this.supportsBinary && self.transport.supportsBinary;
                    failed = failed || upgradeLosesBinary;
                }
                if (failed) return;

                debug('probe transport "%s" opened', name);
                transport.send([{ type: 'ping', data: 'probe' }]);
                transport.once('packet', function (msg) {
                    if (failed) return;
                    if ('pong' == msg.type && 'probe' == msg.data) {
                        debug('probe transport "%s" pong', name);
                        self.upgrading = true;
                        self.emit('upgrading', transport);
                        if (!transport) return;
                        Socket.priorWebsocketSuccess = 'websocket' == transport.name;

                        debug('pausing current transport "%s"', self.transport.name);
                        self.transport.pause(function () {
                            if (failed) return;
                            if ('closed' == self.readyState) return;
                            debug('changing transport and sending upgrade packet');

                            cleanup();

                            self.setTransport(transport);
                            transport.send([{ type: 'upgrade' }]);
                            self.emit('upgrade', transport);
                            transport = null;
                            self.upgrading = false;
                            self.flush();
                        });
                    } else {
                        debug('probe transport "%s" failed', name);
                        var err = new Error('probe error');
                        err.transport = transport.name;
                        self.emit('upgradeError', err);
                    }
                });
            }

            function freezeTransport() {
                if (failed) return;

                // Any callback called by transport should be ignored since now
                failed = true;

                cleanup();

                transport.close();
                transport = null;
            }

            //Handle any error that happens while probing
            function onerror(err) {
                var error = new Error('probe error: ' + err);
                error.transport = transport.name;

                freezeTransport();

                debug('probe transport "%s" failed because of error: %s', name, err);

                self.emit('upgradeError', error);
            }

            function onTransportClose(){
                onerror("transport closed");
            }

            //When the socket is closed while we're probing
            function onclose(){
                onerror("socket closed");
            }

            //When the socket is upgraded while we're probing
            function onupgrade(to){
                if (transport && to.name != transport.name) {
                    debug('"%s" works - aborting "%s"', to.name, transport.name);
                    freezeTransport();
                }
            }

            //Remove all listeners on the transport and on self
            function cleanup(){
                transport.removeListener('open', onTransportOpen);
                transport.removeListener('error', onerror);
                transport.removeListener('close', onTransportClose);
                self.removeListener('close', onclose);
                self.removeListener('upgrading', onupgrade);
            }

            transport.once('open', onTransportOpen);
            transport.once('error', onerror);
            transport.once('close', onTransportClose);

            this.once('close', onclose);
            this.once('upgrading', onupgrade);

            transport.open();

        };

        /**
         * Called when connection is deemed open.
         *
         * @api public
         */

        Socket.prototype.onOpen = function () {
            debug('socket open');
            this.readyState = 'open';
            Socket.priorWebsocketSuccess = 'websocket' == this.transport.name;
            this.emit('open');
            this.flush();

            // we check for `readyState` in case an `open`
            // listener already closed the socket
            if ('open' == this.readyState && this.upgrade && this.transport.pause) {
                debug('starting upgrade probes');
                for (var i = 0, l = this.upgrades.length; i < l; i++) {
                    this.probe(this.upgrades[i]);
                }
            }
        };

        /**
         * Handles a packet.
         *
         * @api private
         */

        Socket.prototype.onPacket = function (packet) {
            if ('opening' == this.readyState || 'open' == this.readyState) {
                debug('socket receive: type "%s", data "%s"', packet.type, packet.data);

                this.emit('packet', packet);

                // Socket is live - any packet counts
                this.emit('heartbeat');

                switch (packet.type) {
                    case 'open':
                        this.onHandshake(parsejson(packet.data));
                        break;

                    case 'pong':
                        this.setPing();
                        break;

                    case 'error':
                        var err = new Error('server error');
                        err.code = packet.data;
                        this.emit('error', err);
                        break;

                    case 'message':
                        this.emit('data', packet.data);
                        this.emit('message', packet.data);
                        break;
                }
            } else {
                debug('packet received with socket readyState "%s"', this.readyState);
            }
        };

        /**
         * Called upon handshake completion.
         *
         * @param {Object} handshake obj
         * @api private
         */

        Socket.prototype.onHandshake = function (data) {
            this.emit('handshake', data);
            this.id = data.sid;
            this.transport.query.sid = data.sid;
            this.upgrades = this.filterUpgrades(data.upgrades);
            this.pingInterval = data.pingInterval;
            this.pingTimeout = data.pingTimeout;
            this.onOpen();
            // In case open handler closes socket
            if  ('closed' == this.readyState) return;
            this.setPing();

            // Prolong liveness of socket on heartbeat
            this.removeListener('heartbeat', this.onHeartbeat);
            this.on('heartbeat', this.onHeartbeat);
        };

        /**
         * Resets ping timeout.
         *
         * @api private
         */

        Socket.prototype.onHeartbeat = function (timeout) {
            clearTimeout(this.pingTimeoutTimer);
            var self = this;
            self.pingTimeoutTimer = setTimeout(function () {
                if ('closed' == self.readyState) return;
                self.onClose('ping timeout');
            }, timeout || (self.pingInterval + self.pingTimeout));
        };

        /**
         * Pings server every `this.pingInterval` and expects response
         * within `this.pingTimeout` or closes connection.
         *
         * @api private
         */

        Socket.prototype.setPing = function () {
            var self = this;
            clearTimeout(self.pingIntervalTimer);
            self.pingIntervalTimer = setTimeout(function () {
                debug('writing ping packet - expecting pong within %sms', self.pingTimeout);
                self.ping();
                self.onHeartbeat(self.pingTimeout);
            }, self.pingInterval);
        };

        /**
         * Sends a ping packet.
         *
         * @api public
         */

        Socket.prototype.ping = function () {
            this.sendPacket('ping');
        };

        /**
         * Called on `drain` event
         *
         * @api private
         */

        Socket.prototype.onDrain = function() {
            for (var i = 0; i < this.prevBufferLen; i++) {
                if (this.callbackBuffer[i]) {
                    this.callbackBuffer[i]();
                }
            }

            this.writeBuffer.splice(0, this.prevBufferLen);
            this.callbackBuffer.splice(0, this.prevBufferLen);

            // setting prevBufferLen = 0 is very important
            // for example, when upgrading, upgrade packet is sent over,
            // and a nonzero prevBufferLen could cause problems on `drain`
            this.prevBufferLen = 0;

            if (this.writeBuffer.length == 0) {
                this.emit('drain');
            } else {
                this.flush();
            }
        };

        /**
         * Flush write buffers.
         *
         * @api private
         */

        Socket.prototype.flush = function () {
            if ('closed' != this.readyState && this.transport.writable &&
                !this.upgrading && this.writeBuffer.length) {
                debug('flushing %d packets in socket', this.writeBuffer.length);
                this.transport.send(this.writeBuffer);
                // keep track of current length of writeBuffer
                // splice writeBuffer and callbackBuffer on `drain`
                this.prevBufferLen = this.writeBuffer.length;
                this.emit('flush');
            }
        };

        /**
         * Sends a message.
         *
         * @param {String} message.
         * @param {Function} callback function.
         * @return {Socket} for chaining.
         * @api public
         */

        Socket.prototype.write =
            Socket.prototype.send = function (msg, fn) {
                this.sendPacket('message', msg, fn);
                return this;
            };

        /**
         * Sends a packet.
         *
         * @param {String} packet type.
         * @param {String} data.
         * @param {Function} callback function.
         * @api private
         */

        Socket.prototype.sendPacket = function (type, data, fn) {
            if ('closing' == this.readyState || 'closed' == this.readyState) {
                return;
            }

            var packet = { type: type, data: data };
            this.emit('packetCreate', packet);
            this.writeBuffer.push(packet);
            this.callbackBuffer.push(fn);
            this.flush();
        };

        /**
         * Closes the connection.
         *
         * @api private
         */

        Socket.prototype.close = function () {
            if ('opening' == this.readyState || 'open' == this.readyState) {
                this.readyState = 'closing';

                var self = this;

                function close() {
                    self.onClose('forced close');
                    debug('socket closing - telling transport to close');
                    self.transport.close();
                }

                function cleanupAndClose() {
                    self.removeListener('upgrade', cleanupAndClose);
                    self.removeListener('upgradeError', cleanupAndClose);
                    close();
                }

                function waitForUpgrade() {
                    // wait for upgrade to finish since we can't send packets while pausing a transport
                    self.once('upgrade', cleanupAndClose);
                    self.once('upgradeError', cleanupAndClose);
                }

                if (this.writeBuffer.length) {
                    this.once('drain', function() {
                        if (this.upgrading) {
                            waitForUpgrade();
                        } else {
                            close();
                        }
                    });
                } else if (this.upgrading) {
                    waitForUpgrade();
                } else {
                    close();
                }
            }

            return this;
        };

        /**
         * Called upon transport error
         *
         * @api private
         */

        Socket.prototype.onError = function (err) {
            debug('socket error %j', err);
            Socket.priorWebsocketSuccess = false;
            this.emit('error', err);
            this.onClose('transport error', err);
        };

        /**
         * Called upon transport close.
         *
         * @api private
         */

        Socket.prototype.onClose = function (reason, desc) {
            if ('opening' == this.readyState || 'open' == this.readyState || 'closing' == this.readyState) {
                debug('socket close with reason: "%s"', reason);
                var self = this;

                // clear timers
                clearTimeout(this.pingIntervalTimer);
                clearTimeout(this.pingTimeoutTimer);

                // clean buffers in next tick, so developers can still
                // grab the buffers on `close` event
                setTimeout(function() {
                    self.writeBuffer = [];
                    self.callbackBuffer = [];
                    self.prevBufferLen = 0;
                }, 0);

                // stop event from firing again for transport
                this.transport.removeAllListeners('close');

                // ensure transport won't stay open
                this.transport.close();

                // ignore further transport communication
                this.transport.removeAllListeners();

                // set ready state
                this.readyState = 'closed';

                // clear session id
                this.id = null;

                // emit close event
                this.emit('close', reason, desc);
            }
        };

        /**
         * Filters upgrades, returning only those matching client transports.
         *
         * @param {Array} server upgrades
         * @api private
         *
         */

        Socket.prototype.filterUpgrades = function (upgrades) {
            var filteredUpgrades = [];
            for (var i = 0, j = upgrades.length; i<j; i++) {
                if (~index(this.transports, upgrades[i])) filteredUpgrades.push(upgrades[i]);
            }
            return filteredUpgrades;
        };

    }).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./transport":14,"./transports":15,"component-emitter":9,"debug":22,"engine.io-parser":25,"indexof":42,"parsejson":34,"parseqs":35,"parseuri":36}],14:[function(_dereq_,module,exports){
    /**
     * Module dependencies.
     */

    var parser = _dereq_('engine.io-parser');
    var Emitter = _dereq_('component-emitter');

    /**
     * Module exports.
     */

    module.exports = Transport;

    /**
     * Transport abstract constructor.
     *
     * @param {Object} options.
     * @api private
     */

    function Transport (opts) {
        this.path = opts.path;
        this.hostname = opts.hostname;
        this.port = opts.port;
        this.secure = opts.secure;
        this.query = opts.query;
        this.timestampParam = opts.timestampParam;
        this.timestampRequests = opts.timestampRequests;
        this.readyState = '';
        this.agent = opts.agent || false;
        this.socket = opts.socket;
        this.enablesXDR = opts.enablesXDR;

        // SSL options for Node.js client
        this.pfx = opts.pfx;
        this.key = opts.key;
        this.passphrase = opts.passphrase;
        this.cert = opts.cert;
        this.ca = opts.ca;
        this.ciphers = opts.ciphers;
        this.rejectUnauthorized = opts.rejectUnauthorized;
    }

    /**
     * Mix in `Emitter`.
     */

    Emitter(Transport.prototype);

    /**
     * A counter used to prevent collisions in the timestamps used
     * for cache busting.
     */

    Transport.timestamps = 0;

    /**
     * Emits an error.
     *
     * @param {String} str
     * @return {Transport} for chaining
     * @api public
     */

    Transport.prototype.onError = function (msg, desc) {
        var err = new Error(msg);
        err.type = 'TransportError';
        err.description = desc;
        this.emit('error', err);
        return this;
    };

    /**
     * Opens the transport.
     *
     * @api public
     */

    Transport.prototype.open = function () {
        if ('closed' == this.readyState || '' == this.readyState) {
            this.readyState = 'opening';
            this.doOpen();
        }

        return this;
    };

    /**
     * Closes the transport.
     *
     * @api private
     */

    Transport.prototype.close = function () {
        if ('opening' == this.readyState || 'open' == this.readyState) {
            this.doClose();
            this.onClose();
        }

        return this;
    };

    /**
     * Sends multiple packets.
     *
     * @param {Array} packets
     * @api private
     */

    Transport.prototype.send = function(packets){
        if ('open' == this.readyState) {
            this.write(packets);
        } else {
            throw new Error('Transport not open');
        }
    };

    /**
     * Called upon open
     *
     * @api private
     */

    Transport.prototype.onOpen = function () {
        this.readyState = 'open';
        this.writable = true;
        this.emit('open');
    };

    /**
     * Called with data.
     *
     * @param {String} data
     * @api private
     */

    Transport.prototype.onData = function(data){
        var packet = parser.decodePacket(data, this.socket.binaryType);
        this.onPacket(packet);
    };

    /**
     * Called with a decoded packet.
     */

    Transport.prototype.onPacket = function (packet) {
        this.emit('packet', packet);
    };

    /**
     * Called upon close.
     *
     * @api private
     */

    Transport.prototype.onClose = function () {
        this.readyState = 'closed';
        this.emit('close');
    };

},{"component-emitter":9,"engine.io-parser":25}],15:[function(_dereq_,module,exports){
    (function (global){
        /**
         * Module dependencies
         */

        var XMLHttpRequest = _dereq_('xmlhttprequest');
        var XHR = _dereq_('./polling-xhr');
        var JSONP = _dereq_('./polling-jsonp');
        var websocket = _dereq_('./websocket');

        /**
         * Export transports.
         */

        exports.polling = polling;
        exports.websocket = websocket;

        /**
         * Polling transport polymorphic constructor.
         * Decides on xhr vs jsonp based on feature detection.
         *
         * @api private
         */

        function polling(opts){
            var xhr;
            var xd = false;
            var xs = false;
            var jsonp = false !== opts.jsonp;

            if (global.location) {
                var isSSL = 'https:' == location.protocol;
                var port = location.port;

                // some user agents have empty `location.port`
                if (!port) {
                    port = isSSL ? 443 : 80;
                }

                xd = opts.hostname != location.hostname || port != opts.port;
                xs = opts.secure != isSSL;
            }

            opts.xdomain = xd;
            opts.xscheme = xs;
            xhr = new XMLHttpRequest(opts);

            if ('open' in xhr && !opts.forceJSONP) {
                return new XHR(opts);
            } else {
                if (!jsonp) throw new Error('JSONP disabled');
                return new JSONP(opts);
            }
        }

    }).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./polling-jsonp":16,"./polling-xhr":17,"./websocket":19,"xmlhttprequest":20}],16:[function(_dereq_,module,exports){
    (function (global){

        /**
         * Module requirements.
         */

        var Polling = _dereq_('./polling');
        var inherit = _dereq_('component-inherit');

        /**
         * Module exports.
         */

        module.exports = JSONPPolling;

        /**
         * Cached regular expressions.
         */

        var rNewline = /\n/g;
        var rEscapedNewline = /\\n/g;

        /**
         * Global JSONP callbacks.
         */

        var callbacks;

        /**
         * Callbacks count.
         */

        var index = 0;

        /**
         * Noop.
         */

        function empty () { }

        /**
         * JSONP Polling constructor.
         *
         * @param {Object} opts.
         * @api public
         */

        function JSONPPolling (opts) {
            Polling.call(this, opts);

            this.query = this.query || {};

            // define global callbacks array if not present
            // we do this here (lazily) to avoid unneeded global pollution
            if (!callbacks) {
                // we need to consider multiple engines in the same page
                if (!global.___eio) global.___eio = [];
                callbacks = global.___eio;
            }

            // callback identifier
            this.index = callbacks.length;

            // add callback to jsonp global
            var self = this;
            callbacks.push(function (msg) {
                self.onData(msg);
            });

            // append to query string
            this.query.j = this.index;

            // prevent spurious errors from being emitted when the window is unloaded
            if (global.document && global.addEventListener) {
                global.addEventListener('beforeunload', function () {
                    if (self.script) self.script.onerror = empty;
                }, false);
            }
        }

        /**
         * Inherits from Polling.
         */

        inherit(JSONPPolling, Polling);

        /*
         * JSONP only supports binary as base64 encoded strings
         */

        JSONPPolling.prototype.supportsBinary = false;

        /**
         * Closes the socket.
         *
         * @api private
         */

        JSONPPolling.prototype.doClose = function () {
            if (this.script) {
                this.script.parentNode.removeChild(this.script);
                this.script = null;
            }

            if (this.form) {
                this.form.parentNode.removeChild(this.form);
                this.form = null;
                this.iframe = null;
            }

            Polling.prototype.doClose.call(this);
        };

        /**
         * Starts a poll cycle.
         *
         * @api private
         */

        JSONPPolling.prototype.doPoll = function () {
            var self = this;
            var script = document.createElement('script');

            if (this.script) {
                this.script.parentNode.removeChild(this.script);
                this.script = null;
            }

            script.async = true;
            script.src = this.uri();
            script.onerror = function(e){
                self.onError('jsonp poll error',e);
            };

            var insertAt = document.getElementsByTagName('script')[0];
            insertAt.parentNode.insertBefore(script, insertAt);
            this.script = script;

            var isUAgecko = 'undefined' != typeof navigator && /gecko/i.test(navigator.userAgent);

            if (isUAgecko) {
                setTimeout(function () {
                    var iframe = document.createElement('iframe');
                    document.body.appendChild(iframe);
                    document.body.removeChild(iframe);
                }, 100);
            }
        };

        /**
         * Writes with a hidden iframe.
         *
         * @param {String} data to send
         * @param {Function} called upon flush.
         * @api private
         */

        JSONPPolling.prototype.doWrite = function (data, fn) {
            var self = this;

            if (!this.form) {
                var form = document.createElement('form');
                var area = document.createElement('textarea');
                var id = this.iframeId = 'eio_iframe_' + this.index;
                var iframe;

                form.className = 'socketio';
                form.style.position = 'absolute';
                form.style.top = '-1000px';
                form.style.left = '-1000px';
                form.target = id;
                form.method = 'POST';
                form.setAttribute('accept-charset', 'utf-8');
                area.name = 'd';
                form.appendChild(area);
                document.body.appendChild(form);

                this.form = form;
                this.area = area;
            }

            this.form.action = this.uri();

            function complete () {
                initIframe();
                fn();
            }

            function initIframe () {
                if (self.iframe) {
                    try {
                        self.form.removeChild(self.iframe);
                    } catch (e) {
                        self.onError('jsonp polling iframe removal error', e);
                    }
                }

                try {
                    // ie6 dynamic iframes with target="" support (thanks Chris Lambacher)
                    var html = '<iframe src="javascript:0" name="'+ self.iframeId +'">';
                    iframe = document.createElement(html);
                } catch (e) {
                    iframe = document.createElement('iframe');
                    iframe.name = self.iframeId;
                    iframe.src = 'javascript:0';
                }

                iframe.id = self.iframeId;

                self.form.appendChild(iframe);
                self.iframe = iframe;
            }

            initIframe();

            // escape \n to prevent it from being converted into \r\n by some UAs
            // double escaping is required for escaped new lines because unescaping of new lines can be done safely on server-side
            data = data.replace(rEscapedNewline, '\\\n');
            this.area.value = data.replace(rNewline, '\\n');

            try {
                this.form.submit();
            } catch(e) {}

            if (this.iframe.attachEvent) {
                this.iframe.onreadystatechange = function(){
                    if (self.iframe.readyState == 'complete') {
                        complete();
                    }
                };
            } else {
                this.iframe.onload = complete;
            }
        };

    }).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./polling":18,"component-inherit":21}],17:[function(_dereq_,module,exports){
    (function (global){
        /**
         * Module requirements.
         */

        var XMLHttpRequest = _dereq_('xmlhttprequest');
        var Polling = _dereq_('./polling');
        var Emitter = _dereq_('component-emitter');
        var inherit = _dereq_('component-inherit');
        var debug = _dereq_('debug')('engine.io-client:polling-xhr');

        /**
         * Module exports.
         */

        module.exports = XHR;
        module.exports.Request = Request;

        /**
         * Empty function
         */

        function empty(){}

        /**
         * XHR Polling constructor.
         *
         * @param {Object} opts
         * @api public
         */

        function XHR(opts){
            Polling.call(this, opts);

            if (global.location) {
                var isSSL = 'https:' == location.protocol;
                var port = location.port;

                // some user agents have empty `location.port`
                if (!port) {
                    port = isSSL ? 443 : 80;
                }

                this.xd = opts.hostname != global.location.hostname ||
                    port != opts.port;
                this.xs = opts.secure != isSSL;
            }
        }

        /**
         * Inherits from Polling.
         */

        inherit(XHR, Polling);

        /**
         * XHR supports binary
         */

        XHR.prototype.supportsBinary = true;

        /**
         * Creates a request.
         *
         * @param {String} method
         * @api private
         */

        XHR.prototype.request = function(opts){
            opts = opts || {};
            opts.uri = this.uri();
            opts.xd = this.xd;
            opts.xs = this.xs;
            opts.agent = this.agent || false;
            opts.supportsBinary = this.supportsBinary;
            opts.enablesXDR = this.enablesXDR;

            // SSL options for Node.js client
            opts.pfx = this.pfx;
            opts.key = this.key;
            opts.passphrase = this.passphrase;
            opts.cert = this.cert;
            opts.ca = this.ca;
            opts.ciphers = this.ciphers;
            opts.rejectUnauthorized = this.rejectUnauthorized;

            return new Request(opts);
        };

        /**
         * Sends data.
         *
         * @param {String} data to send.
         * @param {Function} called upon flush.
         * @api private
         */

        XHR.prototype.doWrite = function(data, fn){
            var isBinary = typeof data !== 'string' && data !== undefined;
            var req = this.request({ method: 'POST', data: data, isBinary: isBinary });
            var self = this;
            req.on('success', fn);
            req.on('error', function(err){
                self.onError('xhr post error', err);
            });
            this.sendXhr = req;
        };

        /**
         * Starts a poll cycle.
         *
         * @api private
         */

        XHR.prototype.doPoll = function(){
            debug('xhr poll');
            var req = this.request();
            var self = this;
            req.on('data', function(data){
                self.onData(data);
            });
            req.on('error', function(err){
                self.onError('xhr poll error', err);
            });
            this.pollXhr = req;
        };

        /**
         * Request constructor
         *
         * @param {Object} options
         * @api public
         */

        function Request(opts){
            this.method = opts.method || 'GET';
            this.uri = opts.uri;
            this.xd = !!opts.xd;
            this.xs = !!opts.xs;
            this.async = false !== opts.async;
            this.data = undefined != opts.data ? opts.data : null;
            this.agent = opts.agent;
            this.isBinary = opts.isBinary;
            this.supportsBinary = opts.supportsBinary;
            this.enablesXDR = opts.enablesXDR;

            // SSL options for Node.js client
            this.pfx = opts.pfx;
            this.key = opts.key;
            this.passphrase = opts.passphrase;
            this.cert = opts.cert;
            this.ca = opts.ca;
            this.ciphers = opts.ciphers;
            this.rejectUnauthorized = opts.rejectUnauthorized;

            this.create();
        }

        /**
         * Mix in `Emitter`.
         */

        Emitter(Request.prototype);

        /**
         * Creates the XHR object and sends the request.
         *
         * @api private
         */

        Request.prototype.create = function(){
            var opts = { agent: this.agent, xdomain: this.xd, xscheme: this.xs, enablesXDR: this.enablesXDR };

            // SSL options for Node.js client
            opts.pfx = this.pfx;
            opts.key = this.key;
            opts.passphrase = this.passphrase;
            opts.cert = this.cert;
            opts.ca = this.ca;
            opts.ciphers = this.ciphers;
            opts.rejectUnauthorized = this.rejectUnauthorized;

            var xhr = this.xhr = new XMLHttpRequest(opts);
            var self = this;

            try {
                debug('xhr open %s: %s', this.method, this.uri);
                xhr.open(this.method, this.uri, this.async);
                if (this.supportsBinary) {
                    // This has to be done after open because Firefox is stupid
                    // http://stackoverflow.com/questions/13216903/get-binary-data-with-xmlhttprequest-in-a-firefox-extension
                    xhr.responseType = 'arraybuffer';
                }

                if ('POST' == this.method) {
                    try {
                        if (this.isBinary) {
                            xhr.setRequestHeader('Content-type', 'application/octet-stream');
                        } else {
                            xhr.setRequestHeader('Content-type', 'text/plain;charset=UTF-8');
                        }
                    } catch (e) {}
                }

                // ie6 check
                if ('withCredentials' in xhr) {
                    xhr.withCredentials = true;
                }

                if (this.hasXDR()) {
                    xhr.onload = function(){
                        self.onLoad();
                    };
                    xhr.onerror = function(){
                        self.onError(xhr.responseText);
                    };
                } else {
                    xhr.onreadystatechange = function(){
                        if (4 != xhr.readyState) return;
                        if (200 == xhr.status || 1223 == xhr.status) {
                            self.onLoad();
                        } else {
                            // make sure the `error` event handler that's user-set
                            // does not throw in the same tick and gets caught here
                            setTimeout(function(){
                                self.onError(xhr.status);
                            }, 0);
                        }
                    };
                }

                debug('xhr data %s', this.data);
                xhr.send(this.data);
            } catch (e) {
                // Need to defer since .create() is called directly fhrom the constructor
                // and thus the 'error' event can only be only bound *after* this exception
                // occurs.  Therefore, also, we cannot throw here at all.
                setTimeout(function() {
                    self.onError(e);
                }, 0);
                return;
            }

            if (global.document) {
                this.index = Request.requestsCount++;
                Request.requests[this.index] = this;
            }
        };

        /**
         * Called upon successful response.
         *
         * @api private
         */

        Request.prototype.onSuccess = function(){
            this.emit('success');
            this.cleanup();
        };

        /**
         * Called if we have data.
         *
         * @api private
         */

        Request.prototype.onData = function(data){
            this.emit('data', data);
            this.onSuccess();
        };

        /**
         * Called upon error.
         *
         * @api private
         */

        Request.prototype.onError = function(err){
            this.emit('error', err);
            this.cleanup(true);
        };

        /**
         * Cleans up house.
         *
         * @api private
         */

        Request.prototype.cleanup = function(fromError){
            if ('undefined' == typeof this.xhr || null === this.xhr) {
                return;
            }
            // xmlhttprequest
            if (this.hasXDR()) {
                this.xhr.onload = this.xhr.onerror = empty;
            } else {
                this.xhr.onreadystatechange = empty;
            }

            if (fromError) {
                try {
                    this.xhr.abort();
                } catch(e) {}
            }

            if (global.document) {
                delete Request.requests[this.index];
            }

            this.xhr = null;
        };

        /**
         * Called upon load.
         *
         * @api private
         */

        Request.prototype.onLoad = function(){
            var data;
            try {
                var contentType;
                try {
                    contentType = this.xhr.getResponseHeader('Content-Type').split(';')[0];
                } catch (e) {}
                if (contentType === 'application/octet-stream') {
                    data = this.xhr.response;
                } else {
                    if (!this.supportsBinary) {
                        data = this.xhr.responseText;
                    } else {
                        data = 'ok';
                    }
                }
            } catch (e) {
                this.onError(e);
            }
            if (null != data) {
                this.onData(data);
            }
        };

        /**
         * Check if it has XDomainRequest.
         *
         * @api private
         */

        Request.prototype.hasXDR = function(){
            return 'undefined' !== typeof global.XDomainRequest && !this.xs && this.enablesXDR;
        };

        /**
         * Aborts the request.
         *
         * @api public
         */

        Request.prototype.abort = function(){
            this.cleanup();
        };

        /**
         * Aborts pending requests when unloading the window. This is needed to prevent
         * memory leaks (e.g. when using IE) and to ensure that no spurious error is
         * emitted.
         */

        if (global.document) {
            Request.requestsCount = 0;
            Request.requests = {};
            if (global.attachEvent) {
                global.attachEvent('onunload', unloadHandler);
            } else if (global.addEventListener) {
                global.addEventListener('beforeunload', unloadHandler, false);
            }
        }

        function unloadHandler() {
            for (var i in Request.requests) {
                if (Request.requests.hasOwnProperty(i)) {
                    Request.requests[i].abort();
                }
            }
        }

    }).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./polling":18,"component-emitter":9,"component-inherit":21,"debug":22,"xmlhttprequest":20}],18:[function(_dereq_,module,exports){
    /**
     * Module dependencies.
     */

    var Transport = _dereq_('../transport');
    var parseqs = _dereq_('parseqs');
    var parser = _dereq_('engine.io-parser');
    var inherit = _dereq_('component-inherit');
    var debug = _dereq_('debug')('engine.io-client:polling');

    /**
     * Module exports.
     */

    module.exports = Polling;

    /**
     * Is XHR2 supported?
     */

    var hasXHR2 = (function() {
        var XMLHttpRequest = _dereq_('xmlhttprequest');
        var xhr = new XMLHttpRequest({ xdomain: false });
        return null != xhr.responseType;
    })();

    /**
     * Polling interface.
     *
     * @param {Object} opts
     * @api private
     */

    function Polling(opts){
        var forceBase64 = (opts && opts.forceBase64);
        if (!hasXHR2 || forceBase64) {
            this.supportsBinary = false;
        }
        Transport.call(this, opts);
    }

    /**
     * Inherits from Transport.
     */

    inherit(Polling, Transport);

    /**
     * Transport name.
     */

    Polling.prototype.name = 'polling';

    /**
     * Opens the socket (triggers polling). We write a PING message to determine
     * when the transport is open.
     *
     * @api private
     */

    Polling.prototype.doOpen = function(){
        this.poll();
    };

    /**
     * Pauses polling.
     *
     * @param {Function} callback upon buffers are flushed and transport is paused
     * @api private
     */

    Polling.prototype.pause = function(onPause){
        var pending = 0;
        var self = this;

        this.readyState = 'pausing';

        function pause(){
            debug('paused');
            self.readyState = 'paused';
            onPause();
        }

        if (this.polling || !this.writable) {
            var total = 0;

            if (this.polling) {
                debug('we are currently polling - waiting to pause');
                total++;
                this.once('pollComplete', function(){
                    debug('pre-pause polling complete');
                    --total || pause();
                });
            }

            if (!this.writable) {
                debug('we are currently writing - waiting to pause');
                total++;
                this.once('drain', function(){
                    debug('pre-pause writing complete');
                    --total || pause();
                });
            }
        } else {
            pause();
        }
    };

    /**
     * Starts polling cycle.
     *
     * @api public
     */

    Polling.prototype.poll = function(){
        debug('polling');
        this.polling = true;
        this.doPoll();
        this.emit('poll');
    };

    /**
     * Overloads onData to detect payloads.
     *
     * @api private
     */

    Polling.prototype.onData = function(data){
        var self = this;
        debug('polling got data %s', data);
        var callback = function(packet, index, total) {
            // if its the first message we consider the transport open
            if ('opening' == self.readyState) {
                self.onOpen();
            }

            // if its a close packet, we close the ongoing requests
            if ('close' == packet.type) {
                self.onClose();
                return false;
            }

            // otherwise bypass onData and handle the message
            self.onPacket(packet);
        };

        // decode payload
        parser.decodePayload(data, this.socket.binaryType, callback);

        // if an event did not trigger closing
        if ('closed' != this.readyState) {
            // if we got data we're not polling
            this.polling = false;
            this.emit('pollComplete');

            if ('open' == this.readyState) {
                this.poll();
            } else {
                debug('ignoring poll - transport state "%s"', this.readyState);
            }
        }
    };

    /**
     * For polling, send a close packet.
     *
     * @api private
     */

    Polling.prototype.doClose = function(){
        var self = this;

        function close(){
            debug('writing close packet');
            self.write([{ type: 'close' }]);
        }

        if ('open' == this.readyState) {
            debug('transport open - closing');
            close();
        } else {
            // in case we're trying to close while
            // handshaking is in progress (GH-164)
            debug('transport not open - deferring close');
            this.once('open', close);
        }
    };

    /**
     * Writes a packets payload.
     *
     * @param {Array} data packets
     * @param {Function} drain callback
     * @api private
     */

    Polling.prototype.write = function(packets){
        var self = this;
        this.writable = false;
        var callbackfn = function() {
            self.writable = true;
            self.emit('drain');
        };

        var self = this;
        parser.encodePayload(packets, this.supportsBinary, function(data) {
            self.doWrite(data, callbackfn);
        });
    };

    /**
     * Generates uri for connection.
     *
     * @api private
     */

    Polling.prototype.uri = function(){
        var query = this.query || {};
        var schema = this.secure ? 'https' : 'http';
        var port = '';

        // cache busting is forced
        if (false !== this.timestampRequests) {
            query[this.timestampParam] = +new Date + '-' + Transport.timestamps++;
        }

        if (!this.supportsBinary && !query.sid) {
            query.b64 = 1;
        }

        query = parseqs.encode(query);

        // avoid port if default for schema
        if (this.port && (('https' == schema && this.port != 443) ||
            ('http' == schema && this.port != 80))) {
            port = ':' + this.port;
        }

        // prepend ? to query
        if (query.length) {
            query = '?' + query;
        }

        return schema + '://' + this.hostname + port + this.path + query;
    };

},{"../transport":14,"component-inherit":21,"debug":22,"engine.io-parser":25,"parseqs":35,"xmlhttprequest":20}],19:[function(_dereq_,module,exports){
    /**
     * Module dependencies.
     */

    var Transport = _dereq_('../transport');
    var parser = _dereq_('engine.io-parser');
    var parseqs = _dereq_('parseqs');
    var inherit = _dereq_('component-inherit');
    var debug = _dereq_('debug')('engine.io-client:websocket');

    /**
     * `ws` exposes a WebSocket-compatible interface in
     * Node, or the `WebSocket` or `MozWebSocket` globals
     * in the browser.
     */

    var WebSocket = _dereq_('ws');

    /**
     * Module exports.
     */

    module.exports = WS;

    /**
     * WebSocket transport constructor.
     *
     * @api {Object} connection options
     * @api public
     */

    function WS(opts){
        var forceBase64 = (opts && opts.forceBase64);
        if (forceBase64) {
            this.supportsBinary = false;
        }
        Transport.call(this, opts);
    }

    /**
     * Inherits from Transport.
     */

    inherit(WS, Transport);

    /**
     * Transport name.
     *
     * @api public
     */

    WS.prototype.name = 'websocket';

    /*
     * WebSockets support binary
     */

    WS.prototype.supportsBinary = true;

    /**
     * Opens socket.
     *
     * @api private
     */

    WS.prototype.doOpen = function(){
        if (!this.check()) {
            // let probe timeout
            return;
        }

        var self = this;
        var uri = this.uri();
        var protocols = void(0);
        var opts = { agent: this.agent };

        // SSL options for Node.js client
        opts.pfx = this.pfx;
        opts.key = this.key;
        opts.passphrase = this.passphrase;
        opts.cert = this.cert;
        opts.ca = this.ca;
        opts.ciphers = this.ciphers;
        opts.rejectUnauthorized = this.rejectUnauthorized;

        this.ws = new WebSocket(uri, protocols, opts);

        if (this.ws.binaryType === undefined) {
            this.supportsBinary = false;
        }

        this.ws.binaryType = 'arraybuffer';
        this.addEventListeners();
    };

    /**
     * Adds event listeners to the socket
     *
     * @api private
     */

    WS.prototype.addEventListeners = function(){
        var self = this;

        this.ws.onopen = function(){
            self.onOpen();
        };
        this.ws.onclose = function(){
            self.onClose();
        };
        this.ws.onmessage = function(ev){
            self.onData(ev.data);
        };
        this.ws.onerror = function(e){
            self.onError('websocket error', e);
        };
    };

    /**
     * Override `onData` to use a timer on iOS.
     * See: https://gist.github.com/mloughran/2052006
     *
     * @api private
     */

    if ('undefined' != typeof navigator
        && /iPad|iPhone|iPod/i.test(navigator.userAgent)) {
        WS.prototype.onData = function(data){
            var self = this;
            setTimeout(function(){
                Transport.prototype.onData.call(self, data);
            }, 0);
        };
    }

    /**
     * Writes data to socket.
     *
     * @param {Array} array of packets.
     * @api private
     */

    WS.prototype.write = function(packets){
        var self = this;
        this.writable = false;
        // encodePacket efficient as it uses WS framing
        // no need for encodePayload
        for (var i = 0, l = packets.length; i < l; i++) {
            parser.encodePacket(packets[i], this.supportsBinary, function(data) {
                //Sometimes the websocket has already been closed but the browser didn't
                //have a chance of informing us about it yet, in that case send will
                //throw an error
                try {
                    self.ws.send(data);
                } catch (e){
                    debug('websocket closed before onclose event');
                }
            });
        }

        function ondrain() {
            self.writable = true;
            self.emit('drain');
        }
        // fake drain
        // defer to next tick to allow Socket to clear writeBuffer
        setTimeout(ondrain, 0);
    };

    /**
     * Called upon close
     *
     * @api private
     */

    WS.prototype.onClose = function(){
        Transport.prototype.onClose.call(this);
    };

    /**
     * Closes socket.
     *
     * @api private
     */

    WS.prototype.doClose = function(){
        if (typeof this.ws !== 'undefined') {
            this.ws.close();
        }
    };

    /**
     * Generates uri for connection.
     *
     * @api private
     */

    WS.prototype.uri = function(){
        var query = this.query || {};
        var schema = this.secure ? 'wss' : 'ws';
        var port = '';

        // avoid port if default for schema
        if (this.port && (('wss' == schema && this.port != 443)
            || ('ws' == schema && this.port != 80))) {
            port = ':' + this.port;
        }

        // append timestamp to URI
        if (this.timestampRequests) {
            query[this.timestampParam] = +new Date;
        }

        // communicate binary support capabilities
        if (!this.supportsBinary) {
            query.b64 = 1;
        }

        query = parseqs.encode(query);

        // prepend ? to query
        if (query.length) {
            query = '?' + query;
        }

        return schema + '://' + this.hostname + port + this.path + query;
    };

    /**
     * Feature detection for WebSocket.
     *
     * @return {Boolean} whether this transport is available.
     * @api public
     */

    WS.prototype.check = function(){
        return !!WebSocket && !('__initialize' in WebSocket && this.name === WS.prototype.name);
    };

},{"../transport":14,"component-inherit":21,"debug":22,"engine.io-parser":25,"parseqs":35,"ws":37}],20:[function(_dereq_,module,exports){
// browser shim for xmlhttprequest module
    var hasCORS = _dereq_('has-cors');

    module.exports = function(opts) {
        var xdomain = opts.xdomain;

        // scheme must be same when usign XDomainRequest
        // http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx
        var xscheme = opts.xscheme;

        // XDomainRequest has a flow of not sending cookie, therefore it should be disabled as a default.
        // https://github.com/Automattic/engine.io-client/pull/217
        var enablesXDR = opts.enablesXDR;

        // XMLHttpRequest can be disabled on IE
        try {
            if ('undefined' != typeof XMLHttpRequest && (!xdomain || hasCORS)) {
                return new XMLHttpRequest();
            }
        } catch (e) { }

        // Use XDomainRequest for IE8 if enablesXDR is true
        // because loading bar keeps flashing when using jsonp-polling
        // https://github.com/yujiosaka/socke.io-ie8-loading-example
        try {
            if ('undefined' != typeof XDomainRequest && !xscheme && enablesXDR) {
                return new XDomainRequest();
            }
        } catch (e) { }

        if (!xdomain) {
            try {
                return new ActiveXObject('Microsoft.XMLHTTP');
            } catch(e) { }
        }
    }

},{"has-cors":40}],21:[function(_dereq_,module,exports){

    module.exports = function(a, b){
        var fn = function(){};
        fn.prototype = b.prototype;
        a.prototype = new fn;
        a.prototype.constructor = a;
    };
},{}],22:[function(_dereq_,module,exports){

    /**
     * This is the web browser implementation of `debug()`.
     *
     * Expose `debug()` as the module.
     */

    exports = module.exports = _dereq_('./debug');
    exports.log = log;
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;

    /**
     * Colors.
     */

    exports.colors = [
        'lightseagreen',
        'forestgreen',
        'goldenrod',
        'dodgerblue',
        'darkorchid',
        'crimson'
    ];

    /**
     * Currently only WebKit-based Web Inspectors, Firefox >= v31,
     * and the Firebug extension (any Firefox version) are known
     * to support "%c" CSS customizations.
     *
     * TODO: add a `localStorage` variable to explicitly enable/disable colors
     */

    function useColors() {
        // is webkit? http://stackoverflow.com/a/16459606/376773
        return ('WebkitAppearance' in document.documentElement.style) ||
                // is firebug? http://stackoverflow.com/a/398120/376773
            (window.console && (console.firebug || (console.exception && console.table))) ||
                // is firefox >= v31?
                // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
            (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
    }

    /**
     * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
     */

    exports.formatters.j = function(v) {
        return JSON.stringify(v);
    };


    /**
     * Colorize log arguments if enabled.
     *
     * @api public
     */

    function formatArgs() {
        var args = arguments;
        var useColors = this.useColors;

        args[0] = (useColors ? '%c' : '')
            + this.namespace
            + (useColors ? ' %c' : ' ')
            + args[0]
            + (useColors ? '%c ' : ' ')
            + '+' + exports.humanize(this.diff);

        if (!useColors) return args;

        var c = 'color: ' + this.color;
        args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));

        // the final "%c" is somewhat tricky, because there could be other
        // arguments passed either before or after the %c, so we need to
        // figure out the correct index to insert the CSS into
        var index = 0;
        var lastC = 0;
        args[0].replace(/%[a-z%]/g, function(match) {
            if ('%' === match) return;
            index++;
            if ('%c' === match) {
                // we only are interested in the *last* %c
                // (the user may have provided their own)
                lastC = index;
            }
        });

        args.splice(lastC, 0, c);
        return args;
    }

    /**
     * Invokes `console.log()` when available.
     * No-op when `console.log` is not a "function".
     *
     * @api public
     */

    function log() {
        // This hackery is required for IE8,
        // where the `console.log` function doesn't have 'apply'
        return 'object' == typeof console
            && 'function' == typeof console.log
            && Function.prototype.apply.call(console.log, console, arguments);
    }

    /**
     * Save `namespaces`.
     *
     * @param {String} namespaces
     * @api private
     */

    function save(namespaces) {
        try {
            if (null == namespaces) {
                localStorage.removeItem('debug');
            } else {
                localStorage.debug = namespaces;
            }
        } catch(e) {}
    }

    /**
     * Load `namespaces`.
     *
     * @return {String} returns the previously persisted debug modes
     * @api private
     */

    function load() {
        var r;
        try {
            r = localStorage.debug;
        } catch(e) {}
        return r;
    }

    /**
     * Enable namespaces listed in `localStorage.debug` initially.
     */

    exports.enable(load());

},{"./debug":23}],23:[function(_dereq_,module,exports){

    /**
     * This is the common logic for both the Node.js and web browser
     * implementations of `debug()`.
     *
     * Expose `debug()` as the module.
     */

    exports = module.exports = debug;
    exports.coerce = coerce;
    exports.disable = disable;
    exports.enable = enable;
    exports.enabled = enabled;
    exports.humanize = _dereq_('ms');

    /**
     * The currently active debug mode names, and names to skip.
     */

    exports.names = [];
    exports.skips = [];

    /**
     * Map of special "%n" handling functions, for the debug "format" argument.
     *
     * Valid key names are a single, lowercased letter, i.e. "n".
     */

    exports.formatters = {};

    /**
     * Previously assigned color.
     */

    var prevColor = 0;

    /**
     * Previous log timestamp.
     */

    var prevTime;

    /**
     * Select a color.
     *
     * @return {Number}
     * @api private
     */

    function selectColor() {
        return exports.colors[prevColor++ % exports.colors.length];
    }

    /**
     * Create a debugger with the given `namespace`.
     *
     * @param {String} namespace
     * @return {Function}
     * @api public
     */

    function debug(namespace) {

        // define the `disabled` version
        function disabled() {
        }
        disabled.enabled = false;

        // define the `enabled` version
        function enabled() {

            var self = enabled;

            // set `diff` timestamp
            var curr = +new Date();
            var ms = curr - (prevTime || curr);
            self.diff = ms;
            self.prev = prevTime;
            self.curr = curr;
            prevTime = curr;

            // add the `color` if not set
            if (null == self.useColors) self.useColors = exports.useColors();
            if (null == self.color && self.useColors) self.color = selectColor();

            var args = Array.prototype.slice.call(arguments);

            args[0] = exports.coerce(args[0]);

            if ('string' !== typeof args[0]) {
                // anything else let's inspect with %o
                args = ['%o'].concat(args);
            }

            // apply any `formatters` transformations
            var index = 0;
            args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
                // if we encounter an escaped % then don't increase the array index
                if (match === '%') return match;
                index++;
                var formatter = exports.formatters[format];
                if ('function' === typeof formatter) {
                    var val = args[index];
                    match = formatter.call(self, val);

                    // now we need to remove `args[index]` since it's inlined in the `format`
                    args.splice(index, 1);
                    index--;
                }
                return match;
            });

            if ('function' === typeof exports.formatArgs) {
                args = exports.formatArgs.apply(self, args);
            }
            var logFn = enabled.log || exports.log || console.log.bind(console);
            logFn.apply(self, args);
        }
        enabled.enabled = true;

        var fn = exports.enabled(namespace) ? enabled : disabled;

        fn.namespace = namespace;

        return fn;
    }

    /**
     * Enables a debug mode by namespaces. This can include modes
     * separated by a colon and wildcards.
     *
     * @param {String} namespaces
     * @api public
     */

    function enable(namespaces) {
        exports.save(namespaces);

        var split = (namespaces || '').split(/[\s,]+/);
        var len = split.length;

        for (var i = 0; i < len; i++) {
            if (!split[i]) continue; // ignore empty strings
            namespaces = split[i].replace(/\*/g, '.*?');
            if (namespaces[0] === '-') {
                exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
            } else {
                exports.names.push(new RegExp('^' + namespaces + '$'));
            }
        }
    }

    /**
     * Disable debug output.
     *
     * @api public
     */

    function disable() {
        exports.enable('');
    }

    /**
     * Returns true if the given mode name is enabled, false otherwise.
     *
     * @param {String} name
     * @return {Boolean}
     * @api public
     */

    function enabled(name) {
        var i, len;
        for (i = 0, len = exports.skips.length; i < len; i++) {
            if (exports.skips[i].test(name)) {
                return false;
            }
        }
        for (i = 0, len = exports.names.length; i < len; i++) {
            if (exports.names[i].test(name)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Coerce `val`.
     *
     * @param {Mixed} val
     * @return {Mixed}
     * @api private
     */

    function coerce(val) {
        if (val instanceof Error) return val.stack || val.message;
        return val;
    }

},{"ms":24}],24:[function(_dereq_,module,exports){
    /**
     * Helpers.
     */

    var s = 1000;
    var m = s * 60;
    var h = m * 60;
    var d = h * 24;
    var y = d * 365.25;

    /**
     * Parse or format the given `val`.
     *
     * Options:
     *
     *  - `long` verbose formatting [false]
     *
     * @param {String|Number} val
     * @param {Object} options
     * @return {String|Number}
     * @api public
     */

    module.exports = function(val, options){
        options = options || {};
        if ('string' == typeof val) return parse(val);
        return options.long
            ? long(val)
            : short(val);
    };

    /**
     * Parse the given `str` and return milliseconds.
     *
     * @param {String} str
     * @return {Number}
     * @api private
     */

    function parse(str) {
        var match = /^((?:\d+)?\.?\d+) *(ms|seconds?|s|minutes?|m|hours?|h|days?|d|years?|y)?$/i.exec(str);
        if (!match) return;
        var n = parseFloat(match[1]);
        var type = (match[2] || 'ms').toLowerCase();
        switch (type) {
            case 'years':
            case 'year':
            case 'y':
                return n * y;
            case 'days':
            case 'day':
            case 'd':
                return n * d;
            case 'hours':
            case 'hour':
            case 'h':
                return n * h;
            case 'minutes':
            case 'minute':
            case 'm':
                return n * m;
            case 'seconds':
            case 'second':
            case 's':
                return n * s;
            case 'ms':
                return n;
        }
    }

    /**
     * Short format for `ms`.
     *
     * @param {Number} ms
     * @return {String}
     * @api private
     */

    function short(ms) {
        if (ms >= d) return Math.round(ms / d) + 'd';
        if (ms >= h) return Math.round(ms / h) + 'h';
        if (ms >= m) return Math.round(ms / m) + 'm';
        if (ms >= s) return Math.round(ms / s) + 's';
        return ms + 'ms';
    }

    /**
     * Long format for `ms`.
     *
     * @param {Number} ms
     * @return {String}
     * @api private
     */

    function long(ms) {
        return plural(ms, d, 'day')
            || plural(ms, h, 'hour')
            || plural(ms, m, 'minute')
            || plural(ms, s, 'second')
            || ms + ' ms';
    }

    /**
     * Pluralization helper.
     */

    function plural(ms, n, name) {
        if (ms < n) return;
        if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
        return Math.ceil(ms / n) + ' ' + name + 's';
    }

},{}],25:[function(_dereq_,module,exports){
    (function (global){
        /**
         * Module dependencies.
         */

        var keys = _dereq_('./keys');
        var hasBinary = _dereq_('has-binary');
        var sliceBuffer = _dereq_('arraybuffer.slice');
        var base64encoder = _dereq_('base64-arraybuffer');
        var after = _dereq_('after');
        var utf8 = _dereq_('utf8');

        /**
         * Check if we are running an android browser. That requires us to use
         * ArrayBuffer with polling transports...
         *
         * http://ghinda.net/jpeg-blob-ajax-android/
         */

        var isAndroid = navigator.userAgent.match(/Android/i);

        /**
         * Check if we are running in PhantomJS.
         * Uploading a Blob with PhantomJS does not work correctly, as reported here:
         * https://github.com/ariya/phantomjs/issues/11395
         * @type boolean
         */
        var isPhantomJS = /PhantomJS/i.test(navigator.userAgent);

        /**
         * When true, avoids using Blobs to encode payloads.
         * @type boolean
         */
        var dontSendBlobs = isAndroid || isPhantomJS;

        /**
         * Current protocol version.
         */

        exports.protocol = 3;

        /**
         * Packet types.
         */

        var packets = exports.packets = {
            open:     0    // non-ws
            , close:    1    // non-ws
            , ping:     2
            , pong:     3
            , message:  4
            , upgrade:  5
            , noop:     6
        };

        var packetslist = keys(packets);

        /**
         * Premade error packet.
         */

        var err = { type: 'error', data: 'parser error' };

        /**
         * Create a blob api even for blob builder when vendor prefixes exist
         */

        var Blob = _dereq_('blob');

        /**
         * Encodes a packet.
         *
         *     <packet type id> [ <data> ]
         *
         * Example:
         *
         *     5hello world
         *     3
         *     4
         *
         * Binary is encoded in an identical principle
         *
         * @api private
         */

        exports.encodePacket = function (packet, supportsBinary, utf8encode, callback) {
            if ('function' == typeof supportsBinary) {
                callback = supportsBinary;
                supportsBinary = false;
            }

            if ('function' == typeof utf8encode) {
                callback = utf8encode;
                utf8encode = null;
            }

            var data = (packet.data === undefined)
                ? undefined
                : packet.data.buffer || packet.data;

            if (global.ArrayBuffer && data instanceof ArrayBuffer) {
                return encodeArrayBuffer(packet, supportsBinary, callback);
            } else if (Blob && data instanceof global.Blob) {
                return encodeBlob(packet, supportsBinary, callback);
            }

            // might be an object with { base64: true, data: dataAsBase64String }
            if (data && data.base64) {
                return encodeBase64Object(packet, callback);
            }

            // Sending data as a utf-8 string
            var encoded = packets[packet.type];

            // data fragment is optional
            if (undefined !== packet.data) {
                encoded += utf8encode ? utf8.encode(String(packet.data)) : String(packet.data);
            }

            return callback('' + encoded);

        };

        function encodeBase64Object(packet, callback) {
            // packet data is an object { base64: true, data: dataAsBase64String }
            var message = 'b' + exports.packets[packet.type] + packet.data.data;
            return callback(message);
        }

        /**
         * Encode packet helpers for binary types
         */

        function encodeArrayBuffer(packet, supportsBinary, callback) {
            if (!supportsBinary) {
                return exports.encodeBase64Packet(packet, callback);
            }

            var data = packet.data;
            var contentArray = new Uint8Array(data);
            var resultBuffer = new Uint8Array(1 + data.byteLength);

            resultBuffer[0] = packets[packet.type];
            for (var i = 0; i < contentArray.length; i++) {
                resultBuffer[i+1] = contentArray[i];
            }

            return callback(resultBuffer.buffer);
        }

        function encodeBlobAsArrayBuffer(packet, supportsBinary, callback) {
            if (!supportsBinary) {
                return exports.encodeBase64Packet(packet, callback);
            }

            var fr = new FileReader();
            fr.onload = function() {
                packet.data = fr.result;
                exports.encodePacket(packet, supportsBinary, true, callback);
            };
            return fr.readAsArrayBuffer(packet.data);
        }

        function encodeBlob(packet, supportsBinary, callback) {
            if (!supportsBinary) {
                return exports.encodeBase64Packet(packet, callback);
            }

            if (dontSendBlobs) {
                return encodeBlobAsArrayBuffer(packet, supportsBinary, callback);
            }

            var length = new Uint8Array(1);
            length[0] = packets[packet.type];
            var blob = new Blob([length.buffer, packet.data]);

            return callback(blob);
        }

        /**
         * Encodes a packet with binary data in a base64 string
         *
         * @param {Object} packet, has `type` and `data`
         * @return {String} base64 encoded message
         */

        exports.encodeBase64Packet = function(packet, callback) {
            var message = 'b' + exports.packets[packet.type];
            if (Blob && packet.data instanceof Blob) {
                var fr = new FileReader();
                fr.onload = function() {
                    var b64 = fr.result.split(',')[1];
                    callback(message + b64);
                };
                return fr.readAsDataURL(packet.data);
            }

            var b64data;
            try {
                b64data = String.fromCharCode.apply(null, new Uint8Array(packet.data));
            } catch (e) {
                // iPhone Safari doesn't let you apply with typed arrays
                var typed = new Uint8Array(packet.data);
                var basic = new Array(typed.length);
                for (var i = 0; i < typed.length; i++) {
                    basic[i] = typed[i];
                }
                b64data = String.fromCharCode.apply(null, basic);
            }
            message += global.btoa(b64data);
            return callback(message);
        };

        /**
         * Decodes a packet. Changes format to Blob if requested.
         *
         * @return {Object} with `type` and `data` (if any)
         * @api private
         */

        exports.decodePacket = function (data, binaryType, utf8decode) {
            // String data
            if (typeof data == 'string' || data === undefined) {
                if (data.charAt(0) == 'b') {
                    return exports.decodeBase64Packet(data.substr(1), binaryType);
                }

                if (utf8decode) {
                    try {
                        data = utf8.decode(data);
                    } catch (e) {
                        return err;
                    }
                }
                var type = data.charAt(0);

                if (Number(type) != type || !packetslist[type]) {
                    return err;
                }

                if (data.length > 1) {
                    return { type: packetslist[type], data: data.substring(1) };
                } else {
                    return { type: packetslist[type] };
                }
            }

            var asArray = new Uint8Array(data);
            var type = asArray[0];
            var rest = sliceBuffer(data, 1);
            if (Blob && binaryType === 'blob') {
                rest = new Blob([rest]);
            }
            return { type: packetslist[type], data: rest };
        };

        /**
         * Decodes a packet encoded in a base64 string
         *
         * @param {String} base64 encoded message
         * @return {Object} with `type` and `data` (if any)
         */

        exports.decodeBase64Packet = function(msg, binaryType) {
            var type = packetslist[msg.charAt(0)];
            if (!global.ArrayBuffer) {
                return { type: type, data: { base64: true, data: msg.substr(1) } };
            }

            var data = base64encoder.decode(msg.substr(1));

            if (binaryType === 'blob' && Blob) {
                data = new Blob([data]);
            }

            return { type: type, data: data };
        };

        /**
         * Encodes multiple messages (payload).
         *
         *     <length>:data
         *
         * Example:
         *
         *     11:hello world2:hi
         *
         * If any contents are binary, they will be encoded as base64 strings. Base64
         * encoded strings are marked with a b before the length specifier
         *
         * @param {Array} packets
         * @api private
         */

        exports.encodePayload = function (packets, supportsBinary, callback) {
            if (typeof supportsBinary == 'function') {
                callback = supportsBinary;
                supportsBinary = null;
            }

            var isBinary = hasBinary(packets);

            if (supportsBinary && isBinary) {
                if (Blob && !dontSendBlobs) {
                    return exports.encodePayloadAsBlob(packets, callback);
                }

                return exports.encodePayloadAsArrayBuffer(packets, callback);
            }

            if (!packets.length) {
                return callback('0:');
            }

            function setLengthHeader(message) {
                return message.length + ':' + message;
            }

            function encodeOne(packet, doneCallback) {
                exports.encodePacket(packet, !isBinary ? false : supportsBinary, true, function(message) {
                    doneCallback(null, setLengthHeader(message));
                });
            }

            map(packets, encodeOne, function(err, results) {
                return callback(results.join(''));
            });
        };

        /**
         * Async array map using after
         */

        function map(ary, each, done) {
            var result = new Array(ary.length);
            var next = after(ary.length, done);

            var eachWithIndex = function(i, el, cb) {
                each(el, function(error, msg) {
                    result[i] = msg;
                    cb(error, result);
                });
            };

            for (var i = 0; i < ary.length; i++) {
                eachWithIndex(i, ary[i], next);
            }
        }

        /*
         * Decodes data when a payload is maybe expected. Possible binary contents are
         * decoded from their base64 representation
         *
         * @param {String} data, callback method
         * @api public
         */

        exports.decodePayload = function (data, binaryType, callback) {
            if (typeof data != 'string') {
                return exports.decodePayloadAsBinary(data, binaryType, callback);
            }

            if (typeof binaryType === 'function') {
                callback = binaryType;
                binaryType = null;
            }

            var packet;
            if (data == '') {
                // parser error - ignoring payload
                return callback(err, 0, 1);
            }

            var length = ''
                , n, msg;

            for (var i = 0, l = data.length; i < l; i++) {
                var chr = data.charAt(i);

                if (':' != chr) {
                    length += chr;
                } else {
                    if ('' == length || (length != (n = Number(length)))) {
                        // parser error - ignoring payload
                        return callback(err, 0, 1);
                    }

                    msg = data.substr(i + 1, n);

                    if (length != msg.length) {
                        // parser error - ignoring payload
                        return callback(err, 0, 1);
                    }

                    if (msg.length) {
                        packet = exports.decodePacket(msg, binaryType, true);

                        if (err.type == packet.type && err.data == packet.data) {
                            // parser error in individual packet - ignoring payload
                            return callback(err, 0, 1);
                        }

                        var ret = callback(packet, i + n, l);
                        if (false === ret) return;
                    }

                    // advance cursor
                    i += n;
                    length = '';
                }
            }

            if (length != '') {
                // parser error - ignoring payload
                return callback(err, 0, 1);
            }

        };

        /**
         * Encodes multiple messages (payload) as binary.
         *
         * <1 = binary, 0 = string><number from 0-9><number from 0-9>[...]<number
         * 255><data>
         *
         * Example:
         * 1 3 255 1 2 3, if the binary contents are interpreted as 8 bit integers
         *
         * @param {Array} packets
         * @return {ArrayBuffer} encoded payload
         * @api private
         */

        exports.encodePayloadAsArrayBuffer = function(packets, callback) {
            if (!packets.length) {
                return callback(new ArrayBuffer(0));
            }

            function encodeOne(packet, doneCallback) {
                exports.encodePacket(packet, true, true, function(data) {
                    return doneCallback(null, data);
                });
            }

            map(packets, encodeOne, function(err, encodedPackets) {
                var totalLength = encodedPackets.reduce(function(acc, p) {
                    var len;
                    if (typeof p === 'string'){
                        len = p.length;
                    } else {
                        len = p.byteLength;
                    }
                    return acc + len.toString().length + len + 2; // string/binary identifier + separator = 2
                }, 0);

                var resultArray = new Uint8Array(totalLength);

                var bufferIndex = 0;
                encodedPackets.forEach(function(p) {
                    var isString = typeof p === 'string';
                    var ab = p;
                    if (isString) {
                        var view = new Uint8Array(p.length);
                        for (var i = 0; i < p.length; i++) {
                            view[i] = p.charCodeAt(i);
                        }
                        ab = view.buffer;
                    }

                    if (isString) { // not true binary
                        resultArray[bufferIndex++] = 0;
                    } else { // true binary
                        resultArray[bufferIndex++] = 1;
                    }

                    var lenStr = ab.byteLength.toString();
                    for (var i = 0; i < lenStr.length; i++) {
                        resultArray[bufferIndex++] = parseInt(lenStr[i]);
                    }
                    resultArray[bufferIndex++] = 255;

                    var view = new Uint8Array(ab);
                    for (var i = 0; i < view.length; i++) {
                        resultArray[bufferIndex++] = view[i];
                    }
                });

                return callback(resultArray.buffer);
            });
        };

        /**
         * Encode as Blob
         */

        exports.encodePayloadAsBlob = function(packets, callback) {
            function encodeOne(packet, doneCallback) {
                exports.encodePacket(packet, true, true, function(encoded) {
                    var binaryIdentifier = new Uint8Array(1);
                    binaryIdentifier[0] = 1;
                    if (typeof encoded === 'string') {
                        var view = new Uint8Array(encoded.length);
                        for (var i = 0; i < encoded.length; i++) {
                            view[i] = encoded.charCodeAt(i);
                        }
                        encoded = view.buffer;
                        binaryIdentifier[0] = 0;
                    }

                    var len = (encoded instanceof ArrayBuffer)
                        ? encoded.byteLength
                        : encoded.size;

                    var lenStr = len.toString();
                    var lengthAry = new Uint8Array(lenStr.length + 1);
                    for (var i = 0; i < lenStr.length; i++) {
                        lengthAry[i] = parseInt(lenStr[i]);
                    }
                    lengthAry[lenStr.length] = 255;

                    if (Blob) {
                        var blob = new Blob([binaryIdentifier.buffer, lengthAry.buffer, encoded]);
                        doneCallback(null, blob);
                    }
                });
            }

            map(packets, encodeOne, function(err, results) {
                return callback(new Blob(results));
            });
        };

        /*
         * Decodes data when a payload is maybe expected. Strings are decoded by
         * interpreting each byte as a key code for entries marked to start with 0. See
         * description of encodePayloadAsBinary
         *
         * @param {ArrayBuffer} data, callback method
         * @api public
         */

        exports.decodePayloadAsBinary = function (data, binaryType, callback) {
            if (typeof binaryType === 'function') {
                callback = binaryType;
                binaryType = null;
            }

            var bufferTail = data;
            var buffers = [];

            var numberTooLong = false;
            while (bufferTail.byteLength > 0) {
                var tailArray = new Uint8Array(bufferTail);
                var isString = tailArray[0] === 0;
                var msgLength = '';

                for (var i = 1; ; i++) {
                    if (tailArray[i] == 255) break;

                    if (msgLength.length > 310) {
                        numberTooLong = true;
                        break;
                    }

                    msgLength += tailArray[i];
                }

                if(numberTooLong) return callback(err, 0, 1);

                bufferTail = sliceBuffer(bufferTail, 2 + msgLength.length);
                msgLength = parseInt(msgLength);

                var msg = sliceBuffer(bufferTail, 0, msgLength);
                if (isString) {
                    try {
                        msg = String.fromCharCode.apply(null, new Uint8Array(msg));
                    } catch (e) {
                        // iPhone Safari doesn't let you apply to typed arrays
                        var typed = new Uint8Array(msg);
                        msg = '';
                        for (var i = 0; i < typed.length; i++) {
                            msg += String.fromCharCode(typed[i]);
                        }
                    }
                }

                buffers.push(msg);
                bufferTail = sliceBuffer(bufferTail, msgLength);
            }

            var total = buffers.length;
            buffers.forEach(function(buffer, i) {
                callback(exports.decodePacket(buffer, binaryType, true), i, total);
            });
        };

    }).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./keys":26,"after":27,"arraybuffer.slice":28,"base64-arraybuffer":29,"blob":30,"has-binary":31,"utf8":33}],26:[function(_dereq_,module,exports){

    /**
     * Gets the keys for an object.
     *
     * @return {Array} keys
     * @api private
     */

    module.exports = Object.keys || function keys (obj){
            var arr = [];
            var has = Object.prototype.hasOwnProperty;

            for (var i in obj) {
                if (has.call(obj, i)) {
                    arr.push(i);
                }
            }
            return arr;
        };

},{}],27:[function(_dereq_,module,exports){
    module.exports = after

    function after(count, callback, err_cb) {
        var bail = false
        err_cb = err_cb || noop
        proxy.count = count

        return (count === 0) ? callback() : proxy

        function proxy(err, result) {
            if (proxy.count <= 0) {
                throw new Error('after called too many times')
            }
            --proxy.count

            // after first error, rest are passed to err_cb
            if (err) {
                bail = true
                callback(err)
                // future error callbacks will go to error handler
                callback = err_cb
            } else if (proxy.count === 0 && !bail) {
                callback(null, result)
            }
        }
    }

    function noop() {}

},{}],28:[function(_dereq_,module,exports){
    /**
     * An abstraction for slicing an arraybuffer even when
     * ArrayBuffer.prototype.slice is not supported
     *
     * @api public
     */

    module.exports = function(arraybuffer, start, end) {
        var bytes = arraybuffer.byteLength;
        start = start || 0;
        end = end || bytes;

        if (arraybuffer.slice) { return arraybuffer.slice(start, end); }

        if (start < 0) { start += bytes; }
        if (end < 0) { end += bytes; }
        if (end > bytes) { end = bytes; }

        if (start >= bytes || start >= end || bytes === 0) {
            return new ArrayBuffer(0);
        }

        var abv = new Uint8Array(arraybuffer);
        var result = new Uint8Array(end - start);
        for (var i = start, ii = 0; i < end; i++, ii++) {
            result[ii] = abv[i];
        }
        return result.buffer;
    };

},{}],29:[function(_dereq_,module,exports){
    /*
     * base64-arraybuffer
     * https://github.com/niklasvh/base64-arraybuffer
     *
     * Copyright (c) 2012 Niklas von Hertzen
     * Licensed under the MIT license.
     */
    (function(chars){
        "use strict";

        exports.encode = function(arraybuffer) {
            var bytes = new Uint8Array(arraybuffer),
                i, len = bytes.length, base64 = "";

            for (i = 0; i < len; i+=3) {
                base64 += chars[bytes[i] >> 2];
                base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
                base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
                base64 += chars[bytes[i + 2] & 63];
            }

            if ((len % 3) === 2) {
                base64 = base64.substring(0, base64.length - 1) + "=";
            } else if (len % 3 === 1) {
                base64 = base64.substring(0, base64.length - 2) + "==";
            }

            return base64;
        };

        exports.decode =  function(base64) {
            var bufferLength = base64.length * 0.75,
                len = base64.length, i, p = 0,
                encoded1, encoded2, encoded3, encoded4;

            if (base64[base64.length - 1] === "=") {
                bufferLength--;
                if (base64[base64.length - 2] === "=") {
                    bufferLength--;
                }
            }

            var arraybuffer = new ArrayBuffer(bufferLength),
                bytes = new Uint8Array(arraybuffer);

            for (i = 0; i < len; i+=4) {
                encoded1 = chars.indexOf(base64[i]);
                encoded2 = chars.indexOf(base64[i+1]);
                encoded3 = chars.indexOf(base64[i+2]);
                encoded4 = chars.indexOf(base64[i+3]);

                bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
                bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
                bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
            }

            return arraybuffer;
        };
    })("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/");

},{}],30:[function(_dereq_,module,exports){
    (function (global){
        /**
         * Create a blob builder even when vendor prefixes exist
         */

        var BlobBuilder = global.BlobBuilder
            || global.WebKitBlobBuilder
            || global.MSBlobBuilder
            || global.MozBlobBuilder;

        /**
         * Check if Blob constructor is supported
         */

        var blobSupported = (function() {
            try {
                var b = new Blob(['hi']);
                return b.size == 2;
            } catch(e) {
                return false;
            }
        })();

        /**
         * Check if BlobBuilder is supported
         */

        var blobBuilderSupported = BlobBuilder
            && BlobBuilder.prototype.append
            && BlobBuilder.prototype.getBlob;

        function BlobBuilderConstructor(ary, options) {
            options = options || {};

            var bb = new BlobBuilder();
            for (var i = 0; i < ary.length; i++) {
                bb.append(ary[i]);
            }
            return (options.type) ? bb.getBlob(options.type) : bb.getBlob();
        };

        module.exports = (function() {
            if (blobSupported) {
                return global.Blob;
            } else if (blobBuilderSupported) {
                return BlobBuilderConstructor;
            } else {
                return undefined;
            }
        })();

    }).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],31:[function(_dereq_,module,exports){
    (function (global){

        /*
         * Module requirements.
         */

        var isArray = _dereq_('isarray');

        /**
         * Module exports.
         */

        module.exports = hasBinary;

        /**
         * Checks for binary data.
         *
         * Right now only Buffer and ArrayBuffer are supported..
         *
         * @param {Object} anything
         * @api public
         */

        function hasBinary(data) {

            function _hasBinary(obj) {
                if (!obj) return false;

                if ( (global.Buffer && global.Buffer.isBuffer(obj)) ||
                    (global.ArrayBuffer && obj instanceof ArrayBuffer) ||
                    (global.Blob && obj instanceof Blob) ||
                    (global.File && obj instanceof File)
                ) {
                    return true;
                }

                if (isArray(obj)) {
                    for (var i = 0; i < obj.length; i++) {
                        if (_hasBinary(obj[i])) {
                            return true;
                        }
                    }
                } else if (obj && 'object' == typeof obj) {
                    if (obj.toJSON) {
                        obj = obj.toJSON();
                    }

                    for (var key in obj) {
                        if (obj.hasOwnProperty(key) && _hasBinary(obj[key])) {
                            return true;
                        }
                    }
                }

                return false;
            }

            return _hasBinary(data);
        }

    }).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"isarray":32}],32:[function(_dereq_,module,exports){
    module.exports = Array.isArray || function (arr) {
            return Object.prototype.toString.call(arr) == '[object Array]';
        };

},{}],33:[function(_dereq_,module,exports){
    (function (global){
        /*! http://mths.be/utf8js v2.0.0 by @mathias */
        ;(function(root) {

            // Detect free variables `exports`
            var freeExports = typeof exports == 'object' && exports;

            // Detect free variable `module`
            var freeModule = typeof module == 'object' && module &&
                module.exports == freeExports && module;

            // Detect free variable `global`, from Node.js or Browserified code,
            // and use it as `root`
            var freeGlobal = typeof global == 'object' && global;
            if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
                root = freeGlobal;
            }

            /*--------------------------------------------------------------------------*/

            var stringFromCharCode = String.fromCharCode;

            // Taken from http://mths.be/punycode
            function ucs2decode(string) {
                var output = [];
                var counter = 0;
                var length = string.length;
                var value;
                var extra;
                while (counter < length) {
                    value = string.charCodeAt(counter++);
                    if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
                        // high surrogate, and there is a next character
                        extra = string.charCodeAt(counter++);
                        if ((extra & 0xFC00) == 0xDC00) { // low surrogate
                            output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
                        } else {
                            // unmatched surrogate; only append this code unit, in case the next
                            // code unit is the high surrogate of a surrogate pair
                            output.push(value);
                            counter--;
                        }
                    } else {
                        output.push(value);
                    }
                }
                return output;
            }

            // Taken from http://mths.be/punycode
            function ucs2encode(array) {
                var length = array.length;
                var index = -1;
                var value;
                var output = '';
                while (++index < length) {
                    value = array[index];
                    if (value > 0xFFFF) {
                        value -= 0x10000;
                        output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
                        value = 0xDC00 | value & 0x3FF;
                    }
                    output += stringFromCharCode(value);
                }
                return output;
            }

            /*--------------------------------------------------------------------------*/

            function createByte(codePoint, shift) {
                return stringFromCharCode(((codePoint >> shift) & 0x3F) | 0x80);
            }

            function encodeCodePoint(codePoint) {
                if ((codePoint & 0xFFFFFF80) == 0) { // 1-byte sequence
                    return stringFromCharCode(codePoint);
                }
                var symbol = '';
                if ((codePoint & 0xFFFFF800) == 0) { // 2-byte sequence
                    symbol = stringFromCharCode(((codePoint >> 6) & 0x1F) | 0xC0);
                }
                else if ((codePoint & 0xFFFF0000) == 0) { // 3-byte sequence
                    symbol = stringFromCharCode(((codePoint >> 12) & 0x0F) | 0xE0);
                    symbol += createByte(codePoint, 6);
                }
                else if ((codePoint & 0xFFE00000) == 0) { // 4-byte sequence
                    symbol = stringFromCharCode(((codePoint >> 18) & 0x07) | 0xF0);
                    symbol += createByte(codePoint, 12);
                    symbol += createByte(codePoint, 6);
                }
                symbol += stringFromCharCode((codePoint & 0x3F) | 0x80);
                return symbol;
            }

            function utf8encode(string) {
                var codePoints = ucs2decode(string);

                // console.log(JSON.stringify(codePoints.map(function(x) {
                // 	return 'U+' + x.toString(16).toUpperCase();
                // })));

                var length = codePoints.length;
                var index = -1;
                var codePoint;
                var byteString = '';
                while (++index < length) {
                    codePoint = codePoints[index];
                    byteString += encodeCodePoint(codePoint);
                }
                return byteString;
            }

            /*--------------------------------------------------------------------------*/

            function readContinuationByte() {
                if (byteIndex >= byteCount) {
                    throw Error('Invalid byte index');
                }

                var continuationByte = byteArray[byteIndex] & 0xFF;
                byteIndex++;

                if ((continuationByte & 0xC0) == 0x80) {
                    return continuationByte & 0x3F;
                }

                // If we end up here, itӳ not a continuation byte
                throw Error('Invalid continuation byte');
            }

            function decodeSymbol() {
                var byte1;
                var byte2;
                var byte3;
                var byte4;
                var codePoint;

                if (byteIndex > byteCount) {
                    throw Error('Invalid byte index');
                }

                if (byteIndex == byteCount) {
                    return false;
                }

                // Read first byte
                byte1 = byteArray[byteIndex] & 0xFF;
                byteIndex++;

                // 1-byte sequence (no continuation bytes)
                if ((byte1 & 0x80) == 0) {
                    return byte1;
                }

                // 2-byte sequence
                if ((byte1 & 0xE0) == 0xC0) {
                    var byte2 = readContinuationByte();
                    codePoint = ((byte1 & 0x1F) << 6) | byte2;
                    if (codePoint >= 0x80) {
                        return codePoint;
                    } else {
                        throw Error('Invalid continuation byte');
                    }
                }

                // 3-byte sequence (may include unpaired surrogates)
                if ((byte1 & 0xF0) == 0xE0) {
                    byte2 = readContinuationByte();
                    byte3 = readContinuationByte();
                    codePoint = ((byte1 & 0x0F) << 12) | (byte2 << 6) | byte3;
                    if (codePoint >= 0x0800) {
                        return codePoint;
                    } else {
                        throw Error('Invalid continuation byte');
                    }
                }

                // 4-byte sequence
                if ((byte1 & 0xF8) == 0xF0) {
                    byte2 = readContinuationByte();
                    byte3 = readContinuationByte();
                    byte4 = readContinuationByte();
                    codePoint = ((byte1 & 0x0F) << 0x12) | (byte2 << 0x0C) |
                        (byte3 << 0x06) | byte4;
                    if (codePoint >= 0x010000 && codePoint <= 0x10FFFF) {
                        return codePoint;
                    }
                }

                throw Error('Invalid UTF-8 detected');
            }

            var byteArray;
            var byteCount;
            var byteIndex;
            function utf8decode(byteString) {
                byteArray = ucs2decode(byteString);
                byteCount = byteArray.length;
                byteIndex = 0;
                var codePoints = [];
                var tmp;
                while ((tmp = decodeSymbol()) !== false) {
                    codePoints.push(tmp);
                }
                return ucs2encode(codePoints);
            }

            /*--------------------------------------------------------------------------*/

            var utf8 = {
                'version': '2.0.0',
                'encode': utf8encode,
                'decode': utf8decode
            };

            // Some AMD build optimizers, like r.js, check for specific condition patterns
            // like the following:
            if (
                typeof define == 'function' &&
                typeof define.amd == 'object' &&
                define.amd
            ) {
                define(function() {
                    return utf8;
                });
            }	else if (freeExports && !freeExports.nodeType) {
                if (freeModule) { // in Node.js or RingoJS v0.8.0+
                    freeModule.exports = utf8;
                } else { // in Narwhal or RingoJS v0.7.0-
                    var object = {};
                    var hasOwnProperty = object.hasOwnProperty;
                    for (var key in utf8) {
                        hasOwnProperty.call(utf8, key) && (freeExports[key] = utf8[key]);
                    }
                }
            } else { // in Rhino or a web browser
                root.utf8 = utf8;
            }

        }(this));

    }).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],34:[function(_dereq_,module,exports){
    (function (global){
        /**
         * JSON parse.
         *
         * @see Based on jQuery#parseJSON (MIT) and JSON2
         * @api private
         */

        var rvalidchars = /^[\],:{}\s]*$/;
        var rvalidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
        var rvalidtokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
        var rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g;
        var rtrimLeft = /^\s+/;
        var rtrimRight = /\s+$/;

        module.exports = function parsejson(data) {
            if ('string' != typeof data || !data) {
                return null;
            }

            data = data.replace(rtrimLeft, '').replace(rtrimRight, '');

            // Attempt to parse using the native JSON parser first
            if (global.JSON && JSON.parse) {
                return JSON.parse(data);
            }

            if (rvalidchars.test(data.replace(rvalidescape, '@')
                    .replace(rvalidtokens, ']')
                    .replace(rvalidbraces, ''))) {
                return (new Function('return ' + data))();
            }
        };
    }).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],35:[function(_dereq_,module,exports){
    /**
     * Compiles a querystring
     * Returns string representation of the object
     *
     * @param {Object}
     * @api private
     */

    exports.encode = function (obj) {
        var str = '';

        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                if (str.length) str += '&';
                str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
            }
        }

        return str;
    };

    /**
     * Parses a simple querystring into an object
     *
     * @param {String} qs
     * @api private
     */

    exports.decode = function(qs){
        var qry = {};
        var pairs = qs.split('&');
        for (var i = 0, l = pairs.length; i < l; i++) {
            var pair = pairs[i].split('=');
            qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
        }
        return qry;
    };

},{}],36:[function(_dereq_,module,exports){
    /**
     * Parses an URI
     *
     * @author Steven Levithan <stevenlevithan.com> (MIT license)
     * @api private
     */

    var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

    var parts = [
        'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'
    ];

    module.exports = function parseuri(str) {
        var src = str,
            b = str.indexOf('['),
            e = str.indexOf(']');

        if (b != -1 && e != -1) {
            str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
        }

        var m = re.exec(str || ''),
            uri = {},
            i = 14;

        while (i--) {
            uri[parts[i]] = m[i] || '';
        }

        if (b != -1 && e != -1) {
            uri.source = src;
            uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
            uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
            uri.ipv6uri = true;
        }

        return uri;
    };

},{}],37:[function(_dereq_,module,exports){

    /**
     * Module dependencies.
     */

    var global = (function() { return this; })();

    /**
     * WebSocket constructor.
     */

    var WebSocket = global.WebSocket || global.MozWebSocket;

    /**
     * Module exports.
     */

    module.exports = WebSocket ? ws : null;

    /**
     * WebSocket constructor.
     *
     * The third `opts` options object gets ignored in web browsers, since it's
     * non-standard, and throws a TypeError if passed to the constructor.
     * See: https://github.com/einaros/ws/issues/227
     *
     * @param {String} uri
     * @param {Array} protocols (optional)
     * @param {Object) opts (optional)
     * @api public
     */

    function ws(uri, protocols, opts) {
        var instance;
        if (protocols) {
            instance = new WebSocket(uri, protocols);
        } else {
            instance = new WebSocket(uri);
        }
        return instance;
    }

    if (WebSocket) ws.prototype = WebSocket.prototype;

},{}],38:[function(_dereq_,module,exports){
    (function (global){

        /*
         * Module requirements.
         */

        var isArray = _dereq_('isarray');

        /**
         * Module exports.
         */

        module.exports = hasBinary;

        /**
         * Checks for binary data.
         *
         * Right now only Buffer and ArrayBuffer are supported..
         *
         * @param {Object} anything
         * @api public
         */

        function hasBinary(data) {

            function _hasBinary(obj) {
                if (!obj) return false;

                if ( (global.Buffer && global.Buffer.isBuffer(obj)) ||
                    (global.ArrayBuffer && obj instanceof ArrayBuffer) ||
                    (global.Blob && obj instanceof Blob) ||
                    (global.File && obj instanceof File)
                ) {
                    return true;
                }

                if (isArray(obj)) {
                    for (var i = 0; i < obj.length; i++) {
                        if (_hasBinary(obj[i])) {
                            return true;
                        }
                    }
                } else if (obj && 'object' == typeof obj) {
                    if (obj.toJSON) {
                        obj = obj.toJSON();
                    }

                    for (var key in obj) {
                        if (Object.prototype.hasOwnProperty.call(obj, key) && _hasBinary(obj[key])) {
                            return true;
                        }
                    }
                }

                return false;
            }

            return _hasBinary(data);
        }

    }).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"isarray":39}],39:[function(_dereq_,module,exports){
    module.exports=_dereq_(32)
},{}],40:[function(_dereq_,module,exports){

    /**
     * Module dependencies.
     */

    var global = _dereq_('global');

    /**
     * Module exports.
     *
     * Logic borrowed from Modernizr:
     *
     *   - https://github.com/Modernizr/Modernizr/blob/master/feature-detects/cors.js
     */

    try {
        module.exports = 'XMLHttpRequest' in global &&
            'withCredentials' in new global.XMLHttpRequest();
    } catch (err) {
        // if XMLHttp support is disabled in IE then it will throw
        // when trying to create
        module.exports = false;
    }

},{"global":41}],41:[function(_dereq_,module,exports){

    /**
     * Returns `this`. Execute this without a "context" (i.e. without it being
     * attached to an object of the left-hand side), and `this` points to the
     * "global" scope of the current JS execution.
     */

    module.exports = (function () { return this; })();

},{}],42:[function(_dereq_,module,exports){

    var indexOf = [].indexOf;

    module.exports = function(arr, obj){
        if (indexOf) return arr.indexOf(obj);
        for (var i = 0; i < arr.length; ++i) {
            if (arr[i] === obj) return i;
        }
        return -1;
    };
},{}],43:[function(_dereq_,module,exports){

    /**
     * HOP ref.
     */

    var has = Object.prototype.hasOwnProperty;

    /**
     * Return own keys in `obj`.
     *
     * @param {Object} obj
     * @return {Array}
     * @api public
     */

    exports.keys = Object.keys || function(obj){
            var keys = [];
            for (var key in obj) {
                if (has.call(obj, key)) {
                    keys.push(key);
                }
            }
            return keys;
        };

    /**
     * Return own values in `obj`.
     *
     * @param {Object} obj
     * @return {Array}
     * @api public
     */

    exports.values = function(obj){
        var vals = [];
        for (var key in obj) {
            if (has.call(obj, key)) {
                vals.push(obj[key]);
            }
        }
        return vals;
    };

    /**
     * Merge `b` into `a`.
     *
     * @param {Object} a
     * @param {Object} b
     * @return {Object} a
     * @api public
     */

    exports.merge = function(a, b){
        for (var key in b) {
            if (has.call(b, key)) {
                a[key] = b[key];
            }
        }
        return a;
    };

    /**
     * Return length of `obj`.
     *
     * @param {Object} obj
     * @return {Number}
     * @api public
     */

    exports.length = function(obj){
        return exports.keys(obj).length;
    };

    /**
     * Check if `obj` is empty.
     *
     * @param {Object} obj
     * @return {Boolean}
     * @api public
     */

    exports.isEmpty = function(obj){
        return 0 == exports.length(obj);
    };
},{}],44:[function(_dereq_,module,exports){
    /**
     * Parses an URI
     *
     * @author Steven Levithan <stevenlevithan.com> (MIT license)
     * @api private
     */

    var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

    var parts = [
        'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host'
        , 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'
    ];

    module.exports = function parseuri(str) {
        var m = re.exec(str || '')
            , uri = {}
            , i = 14;

        while (i--) {
            uri[parts[i]] = m[i] || '';
        }

        return uri;
    };

},{}],45:[function(_dereq_,module,exports){
    (function (global){
        /*global Blob,File*/

        /**
         * Module requirements
         */

        var isArray = _dereq_('isarray');
        var isBuf = _dereq_('./is-buffer');

        /**
         * Replaces every Buffer | ArrayBuffer in packet with a numbered placeholder.
         * Anything with blobs or files should be fed through removeBlobs before coming
         * here.
         *
         * @param {Object} packet - socket.io event packet
         * @return {Object} with deconstructed packet and list of buffers
         * @api public
         */

        exports.deconstructPacket = function(packet){
            var buffers = [];
            var packetData = packet.data;

            function _deconstructPacket(data) {
                if (!data) return data;

                if (isBuf(data)) {
                    var placeholder = { _placeholder: true, num: buffers.length };
                    buffers.push(data);
                    return placeholder;
                } else if (isArray(data)) {
                    var newData = new Array(data.length);
                    for (var i = 0; i < data.length; i++) {
                        newData[i] = _deconstructPacket(data[i]);
                    }
                    return newData;
                } else if ('object' == typeof data && !(data instanceof Date)) {
                    var newData = {};
                    for (var key in data) {
                        newData[key] = _deconstructPacket(data[key]);
                    }
                    return newData;
                }
                return data;
            }

            var pack = packet;
            pack.data = _deconstructPacket(packetData);
            pack.attachments = buffers.length; // number of binary 'attachments'
            return {packet: pack, buffers: buffers};
        };

        /**
         * Reconstructs a binary packet from its placeholder packet and buffers
         *
         * @param {Object} packet - event packet with placeholders
         * @param {Array} buffers - binary buffers to put in placeholder positions
         * @return {Object} reconstructed packet
         * @api public
         */

        exports.reconstructPacket = function(packet, buffers) {
            var curPlaceHolder = 0;

            function _reconstructPacket(data) {
                if (data && data._placeholder) {
                    var buf = buffers[data.num]; // appropriate buffer (should be natural order anyway)
                    return buf;
                } else if (isArray(data)) {
                    for (var i = 0; i < data.length; i++) {
                        data[i] = _reconstructPacket(data[i]);
                    }
                    return data;
                } else if (data && 'object' == typeof data) {
                    for (var key in data) {
                        data[key] = _reconstructPacket(data[key]);
                    }
                    return data;
                }
                return data;
            }

            packet.data = _reconstructPacket(packet.data);
            packet.attachments = undefined; // no longer useful
            return packet;
        };

        /**
         * Asynchronously removes Blobs or Files from data via
         * FileReader's readAsArrayBuffer method. Used before encoding
         * data as msgpack. Calls callback with the blobless data.
         *
         * @param {Object} data
         * @param {Function} callback
         * @api private
         */

        exports.removeBlobs = function(data, callback) {
            function _removeBlobs(obj, curKey, containingObject) {
                if (!obj) return obj;

                // convert any blob
                if ((global.Blob && obj instanceof Blob) ||
                    (global.File && obj instanceof File)) {
                    pendingBlobs++;

                    // async filereader
                    var fileReader = new FileReader();
                    fileReader.onload = function() { // this.result == arraybuffer
                        if (containingObject) {
                            containingObject[curKey] = this.result;
                        }
                        else {
                            bloblessData = this.result;
                        }

                        // if nothing pending its callback time
                        if(! --pendingBlobs) {
                            callback(bloblessData);
                        }
                    };

                    fileReader.readAsArrayBuffer(obj); // blob -> arraybuffer
                } else if (isArray(obj)) { // handle array
                    for (var i = 0; i < obj.length; i++) {
                        _removeBlobs(obj[i], i, obj);
                    }
                } else if (obj && 'object' == typeof obj && !isBuf(obj)) { // and object
                    for (var key in obj) {
                        _removeBlobs(obj[key], key, obj);
                    }
                }
            }

            var pendingBlobs = 0;
            var bloblessData = data;
            _removeBlobs(bloblessData);
            if (!pendingBlobs) {
                callback(bloblessData);
            }
        };

    }).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./is-buffer":47,"isarray":48}],46:[function(_dereq_,module,exports){

    /**
     * Module dependencies.
     */

    var debug = _dereq_('debug')('socket.io-parser');
    var json = _dereq_('json3');
    var isArray = _dereq_('isarray');
    var Emitter = _dereq_('component-emitter');
    var binary = _dereq_('./binary');
    var isBuf = _dereq_('./is-buffer');

    /**
     * Protocol version.
     *
     * @api public
     */

    exports.protocol = 4;

    /**
     * Packet types.
     *
     * @api public
     */

    exports.types = [
        'CONNECT',
        'DISCONNECT',
        'EVENT',
        'BINARY_EVENT',
        'ACK',
        'BINARY_ACK',
        'ERROR'
    ];

    /**
     * Packet type `connect`.
     *
     * @api public
     */

    exports.CONNECT = 0;

    /**
     * Packet type `disconnect`.
     *
     * @api public
     */

    exports.DISCONNECT = 1;

    /**
     * Packet type `event`.
     *
     * @api public
     */

    exports.EVENT = 2;

    /**
     * Packet type `ack`.
     *
     * @api public
     */

    exports.ACK = 3;

    /**
     * Packet type `error`.
     *
     * @api public
     */

    exports.ERROR = 4;

    /**
     * Packet type 'binary event'
     *
     * @api public
     */

    exports.BINARY_EVENT = 5;

    /**
     * Packet type `binary ack`. For acks with binary arguments.
     *
     * @api public
     */

    exports.BINARY_ACK = 6;

    /**
     * Encoder constructor.
     *
     * @api public
     */

    exports.Encoder = Encoder;

    /**
     * Decoder constructor.
     *
     * @api public
     */

    exports.Decoder = Decoder;

    /**
     * A socket.io Encoder instance
     *
     * @api public
     */

    function Encoder() {}

    /**
     * Encode a packet as a single string if non-binary, or as a
     * buffer sequence, depending on packet type.
     *
     * @param {Object} obj - packet object
     * @param {Function} callback - function to handle encodings (likely engine.write)
     * @return Calls callback with Array of encodings
     * @api public
     */

    Encoder.prototype.encode = function(obj, callback){
        debug('encoding packet %j', obj);

        if (exports.BINARY_EVENT == obj.type || exports.BINARY_ACK == obj.type) {
            encodeAsBinary(obj, callback);
        }
        else {
            var encoding = encodeAsString(obj);
            callback([encoding]);
        }
    };

    /**
     * Encode packet as string.
     *
     * @param {Object} packet
     * @return {String} encoded
     * @api private
     */

    function encodeAsString(obj) {
        var str = '';
        var nsp = false;

        // first is type
        str += obj.type;

        // attachments if we have them
        if (exports.BINARY_EVENT == obj.type || exports.BINARY_ACK == obj.type) {
            str += obj.attachments;
            str += '-';
        }

        // if we have a namespace other than `/`
        // we append it followed by a comma `,`
        if (obj.nsp && '/' != obj.nsp) {
            nsp = true;
            str += obj.nsp;
        }

        // immediately followed by the id
        if (null != obj.id) {
            if (nsp) {
                str += ',';
                nsp = false;
            }
            str += obj.id;
        }

        // json data
        if (null != obj.data) {
            if (nsp) str += ',';
            str += json.stringify(obj.data);
        }

        debug('encoded %j as %s', obj, str);
        return str;
    }

    /**
     * Encode packet as 'buffer sequence' by removing blobs, and
     * deconstructing packet into object with placeholders and
     * a list of buffers.
     *
     * @param {Object} packet
     * @return {Buffer} encoded
     * @api private
     */

    function encodeAsBinary(obj, callback) {

        function writeEncoding(bloblessData) {
            var deconstruction = binary.deconstructPacket(bloblessData);
            var pack = encodeAsString(deconstruction.packet);
            var buffers = deconstruction.buffers;

            buffers.unshift(pack); // add packet info to beginning of data list
            callback(buffers); // write all the buffers
        }

        binary.removeBlobs(obj, writeEncoding);
    }

    /**
     * A socket.io Decoder instance
     *
     * @return {Object} decoder
     * @api public
     */

    function Decoder() {
        this.reconstructor = null;
    }

    /**
     * Mix in `Emitter` with Decoder.
     */

    Emitter(Decoder.prototype);

    /**
     * Decodes an ecoded packet string into packet JSON.
     *
     * @param {String} obj - encoded packet
     * @return {Object} packet
     * @api public
     */

    Decoder.prototype.add = function(obj) {
        var packet;
        if ('string' == typeof obj) {
            packet = decodeString(obj);
            if (exports.BINARY_EVENT == packet.type || exports.BINARY_ACK == packet.type) { // binary packet's json
                this.reconstructor = new BinaryReconstructor(packet);

                // no attachments, labeled binary but no binary data to follow
                if (this.reconstructor.reconPack.attachments === 0) {
                    this.emit('decoded', packet);
                }
            } else { // non-binary full packet
                this.emit('decoded', packet);
            }
        }
        else if (isBuf(obj) || obj.base64) { // raw binary data
            if (!this.reconstructor) {
                throw new Error('got binary data when not reconstructing a packet');
            } else {
                packet = this.reconstructor.takeBinaryData(obj);
                if (packet) { // received final buffer
                    this.reconstructor = null;
                    this.emit('decoded', packet);
                }
            }
        }
        else {
            throw new Error('Unknown type: ' + obj);
        }
    };

    /**
     * Decode a packet String (JSON data)
     *
     * @param {String} str
     * @return {Object} packet
     * @api private
     */

    function decodeString(str) {
        var p = {};
        var i = 0;

        // look up type
        p.type = Number(str.charAt(0));
        if (null == exports.types[p.type]) return error();

        // look up attachments if type binary
        if (exports.BINARY_EVENT == p.type || exports.BINARY_ACK == p.type) {
            var buf = '';
            while (str.charAt(++i) != '-') {
                buf += str.charAt(i);
                if (i + 1 == str.length) break;
            }
            if (buf != Number(buf) || str.charAt(i) != '-') {
                throw new Error('Illegal attachments');
            }
            p.attachments = Number(buf);
        }

        // look up namespace (if any)
        if ('/' == str.charAt(i + 1)) {
            p.nsp = '';
            while (++i) {
                var c = str.charAt(i);
                if (',' == c) break;
                p.nsp += c;
                if (i + 1 == str.length) break;
            }
        } else {
            p.nsp = '/';
        }

        // look up id
        var next = str.charAt(i + 1);
        if ('' !== next && Number(next) == next) {
            p.id = '';
            while (++i) {
                var c = str.charAt(i);
                if (null == c || Number(c) != c) {
                    --i;
                    break;
                }
                p.id += str.charAt(i);
                if (i + 1 == str.length) break;
            }
            p.id = Number(p.id);
        }

        // look up json data
        if (str.charAt(++i)) {
            try {
                p.data = json.parse(str.substr(i));
            } catch(e){
                return error();
            }
        }

        debug('decoded %s as %j', str, p);
        return p;
    }

    /**
     * Deallocates a parser's resources
     *
     * @api public
     */

    Decoder.prototype.destroy = function() {
        if (this.reconstructor) {
            this.reconstructor.finishedReconstruction();
        }
    };

    /**
     * A manager of a binary event's 'buffer sequence'. Should
     * be constructed whenever a packet of type BINARY_EVENT is
     * decoded.
     *
     * @param {Object} packet
     * @return {BinaryReconstructor} initialized reconstructor
     * @api private
     */

    function BinaryReconstructor(packet) {
        this.reconPack = packet;
        this.buffers = [];
    }

    /**
     * Method to be called when binary data received from connection
     * after a BINARY_EVENT packet.
     *
     * @param {Buffer | ArrayBuffer} binData - the raw binary data received
     * @return {null | Object} returns null if more binary data is expected or
     *   a reconstructed packet object if all buffers have been received.
     * @api private
     */

    BinaryReconstructor.prototype.takeBinaryData = function(binData) {
        this.buffers.push(binData);
        if (this.buffers.length == this.reconPack.attachments) { // done with buffer list
            var packet = binary.reconstructPacket(this.reconPack, this.buffers);
            this.finishedReconstruction();
            return packet;
        }
        return null;
    };

    /**
     * Cleans up binary packet reconstruction variables.
     *
     * @api private
     */

    BinaryReconstructor.prototype.finishedReconstruction = function() {
        this.reconPack = null;
        this.buffers = [];
    };

    function error(data){
        return {
            type: exports.ERROR,
            data: 'parser error'
        };
    }

},{"./binary":45,"./is-buffer":47,"component-emitter":9,"debug":10,"isarray":48,"json3":49}],47:[function(_dereq_,module,exports){
    (function (global){

        module.exports = isBuf;

        /**
         * Returns true if obj is a buffer or an arraybuffer.
         *
         * @api private
         */

        function isBuf(obj) {
            return (global.Buffer && global.Buffer.isBuffer(obj)) ||
                (global.ArrayBuffer && obj instanceof ArrayBuffer);
        }

    }).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],48:[function(_dereq_,module,exports){
    module.exports=_dereq_(32)
},{}],49:[function(_dereq_,module,exports){
    /*! JSON v3.2.6 | http://bestiejs.github.io/json3 | Copyright 2012-2013, Kit Cambridge | http://kit.mit-license.org */
    ;(function (window) {
        // Convenience aliases.
        var getClass = {}.toString, isProperty, forEach, undef;

        // Detect the `define` function exposed by asynchronous module loaders. The
        // strict `define` check is necessary for compatibility with `r.js`.
        var isLoader = typeof define === "function" && define.amd;

        // Detect native implementations.
        var nativeJSON = typeof JSON == "object" && JSON;

        // Set up the JSON 3 namespace, preferring the CommonJS `exports` object if
        // available.
        var JSON3 = typeof exports == "object" && exports && !exports.nodeType && exports;

        if (JSON3 && nativeJSON) {
            // Explicitly delegate to the native `stringify` and `parse`
            // implementations in CommonJS environments.
            JSON3.stringify = nativeJSON.stringify;
            JSON3.parse = nativeJSON.parse;
        } else {
            // Export for web browsers, JavaScript engines, and asynchronous module
            // loaders, using the global `JSON` object if available.
            JSON3 = window.JSON = nativeJSON || {};
        }

        // Test the `Date#getUTC*` methods. Based on work by @Yaffle.
        var isExtended = new Date(-3509827334573292);
        try {
            // The `getUTCFullYear`, `Month`, and `Date` methods return nonsensical
            // results for certain dates in Opera >= 10.53.
            isExtended = isExtended.getUTCFullYear() == -109252 && isExtended.getUTCMonth() === 0 && isExtended.getUTCDate() === 1 &&
                    // Safari < 2.0.2 stores the internal millisecond time value correctly,
                    // but clips the values returned by the date methods to the range of
                    // signed 32-bit integers ([-2 ** 31, 2 ** 31 - 1]).
                isExtended.getUTCHours() == 10 && isExtended.getUTCMinutes() == 37 && isExtended.getUTCSeconds() == 6 && isExtended.getUTCMilliseconds() == 708;
        } catch (exception) {}

        // Internal: Determines whether the native `JSON.stringify` and `parse`
        // implementations are spec-compliant. Based on work by Ken Snyder.
        function has(name) {
            if (has[name] !== undef) {
                // Return cached feature test result.
                return has[name];
            }

            var isSupported;
            if (name == "bug-string-char-index") {
                // IE <= 7 doesn't support accessing string characters using square
                // bracket notation. IE 8 only supports this for primitives.
                isSupported = "a"[0] != "a";
            } else if (name == "json") {
                // Indicates whether both `JSON.stringify` and `JSON.parse` are
                // supported.
                isSupported = has("json-stringify") && has("json-parse");
            } else {
                var value, serialized = '{"a":[1,true,false,null,"\\u0000\\b\\n\\f\\r\\t"]}';
                // Test `JSON.stringify`.
                if (name == "json-stringify") {
                    var stringify = JSON3.stringify, stringifySupported = typeof stringify == "function" && isExtended;
                    if (stringifySupported) {
                        // A test function object with a custom `toJSON` method.
                        (value = function () {
                            return 1;
                        }).toJSON = value;
                        try {
                            stringifySupported =
                                // Firefox 3.1b1 and b2 serialize string, number, and boolean
                                // primitives as object literals.
                                stringify(0) === "0" &&
                                    // FF 3.1b1, b2, and JSON 2 serialize wrapped primitives as object
                                    // literals.
                                stringify(new Number()) === "0" &&
                                stringify(new String()) == '""' &&
                                    // FF 3.1b1, 2 throw an error if the value is `null`, `undefined`, or
                                    // does not define a canonical JSON representation (this applies to
                                    // objects with `toJSON` properties as well, *unless* they are nested
                                    // within an object or array).
                                stringify(getClass) === undef &&
                                    // IE 8 serializes `undefined` as `"undefined"`. Safari <= 5.1.7 and
                                    // FF 3.1b3 pass this test.
                                stringify(undef) === undef &&
                                    // Safari <= 5.1.7 and FF 3.1b3 throw `Error`s and `TypeError`s,
                                    // respectively, if the value is omitted entirely.
                                stringify() === undef &&
                                    // FF 3.1b1, 2 throw an error if the given value is not a number,
                                    // string, array, object, Boolean, or `null` literal. This applies to
                                    // objects with custom `toJSON` methods as well, unless they are nested
                                    // inside object or array literals. YUI 3.0.0b1 ignores custom `toJSON`
                                    // methods entirely.
                                stringify(value) === "1" &&
                                stringify([value]) == "[1]" &&
                                    // Prototype <= 1.6.1 serializes `[undefined]` as `"[]"` instead of
                                    // `"[null]"`.
                                stringify([undef]) == "[null]" &&
                                    // YUI 3.0.0b1 fails to serialize `null` literals.
                                stringify(null) == "null" &&
                                    // FF 3.1b1, 2 halts serialization if an array contains a function:
                                    // `[1, true, getClass, 1]` serializes as "[1,true,],". FF 3.1b3
                                    // elides non-JSON values from objects and arrays, unless they
                                    // define custom `toJSON` methods.
                                stringify([undef, getClass, null]) == "[null,null,null]" &&
                                    // Simple serialization test. FF 3.1b1 uses Unicode escape sequences
                                    // where character escape codes are expected (e.g., `\b` => `\u0008`).
                                stringify({ "a": [value, true, false, null, "\x00\b\n\f\r\t"] }) == serialized &&
                                    // FF 3.1b1 and b2 ignore the `filter` and `width` arguments.
                                stringify(null, value) === "1" &&
                                stringify([1, 2], null, 1) == "[\n 1,\n 2\n]" &&
                                    // JSON 2, Prototype <= 1.7, and older WebKit builds incorrectly
                                    // serialize extended years.
                                stringify(new Date(-8.64e15)) == '"-271821-04-20T00:00:00.000Z"' &&
                                    // The milliseconds are optional in ES 5, but required in 5.1.
                                stringify(new Date(8.64e15)) == '"+275760-09-13T00:00:00.000Z"' &&
                                    // Firefox <= 11.0 incorrectly serializes years prior to 0 as negative
                                    // four-digit years instead of six-digit years. Credits: @Yaffle.
                                stringify(new Date(-621987552e5)) == '"-000001-01-01T00:00:00.000Z"' &&
                                    // Safari <= 5.1.5 and Opera >= 10.53 incorrectly serialize millisecond
                                    // values less than 1000. Credits: @Yaffle.
                                stringify(new Date(-1)) == '"1969-12-31T23:59:59.999Z"';
                        } catch (exception) {
                            stringifySupported = false;
                        }
                    }
                    isSupported = stringifySupported;
                }
                // Test `JSON.parse`.
                if (name == "json-parse") {
                    var parse = JSON3.parse;
                    if (typeof parse == "function") {
                        try {
                            // FF 3.1b1, b2 will throw an exception if a bare literal is provided.
                            // Conforming implementations should also coerce the initial argument to
                            // a string prior to parsing.
                            if (parse("0") === 0 && !parse(false)) {
                                // Simple parsing test.
                                value = parse(serialized);
                                var parseSupported = value["a"].length == 5 && value["a"][0] === 1;
                                if (parseSupported) {
                                    try {
                                        // Safari <= 5.1.2 and FF 3.1b1 allow unescaped tabs in strings.
                                        parseSupported = !parse('"\t"');
                                    } catch (exception) {}
                                    if (parseSupported) {
                                        try {
                                            // FF 4.0 and 4.0.1 allow leading `+` signs and leading
                                            // decimal points. FF 4.0, 4.0.1, and IE 9-10 also allow
                                            // certain octal literals.
                                            parseSupported = parse("01") !== 1;
                                        } catch (exception) {}
                                    }
                                    if (parseSupported) {
                                        try {
                                            // FF 4.0, 4.0.1, and Rhino 1.7R3-R4 allow trailing decimal
                                            // points. These environments, along with FF 3.1b1 and 2,
                                            // also allow trailing commas in JSON objects and arrays.
                                            parseSupported = parse("1.") !== 1;
                                        } catch (exception) {}
                                    }
                                }
                            }
                        } catch (exception) {
                            parseSupported = false;
                        }
                    }
                    isSupported = parseSupported;
                }
            }
            return has[name] = !!isSupported;
        }

        if (!has("json")) {
            // Common `[[Class]]` name aliases.
            var functionClass = "[object Function]";
            var dateClass = "[object Date]";
            var numberClass = "[object Number]";
            var stringClass = "[object String]";
            var arrayClass = "[object Array]";
            var booleanClass = "[object Boolean]";

            // Detect incomplete support for accessing string characters by index.
            var charIndexBuggy = has("bug-string-char-index");

            // Define additional utility methods if the `Date` methods are buggy.
            if (!isExtended) {
                var floor = Math.floor;
                // A mapping between the months of the year and the number of days between
                // January 1st and the first of the respective month.
                var Months = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
                // Internal: Calculates the number of days between the Unix epoch and the
                // first day of the given month.
                var getDay = function (year, month) {
                    return Months[month] + 365 * (year - 1970) + floor((year - 1969 + (month = +(month > 1))) / 4) - floor((year - 1901 + month) / 100) + floor((year - 1601 + month) / 400);
                };
            }

            // Internal: Determines if a property is a direct property of the given
            // object. Delegates to the native `Object#hasOwnProperty` method.
            if (!(isProperty = {}.hasOwnProperty)) {
                isProperty = function (property) {
                    var members = {}, constructor;
                    if ((members.__proto__ = null, members.__proto__ = {
                            // The *proto* property cannot be set multiple times in recent
                            // versions of Firefox and SeaMonkey.
                            "toString": 1
                        }, members).toString != getClass) {
                        // Safari <= 2.0.3 doesn't implement `Object#hasOwnProperty`, but
                        // supports the mutable *proto* property.
                        isProperty = function (property) {
                            // Capture and break the object's prototype chain (see section 8.6.2
                            // of the ES 5.1 spec). The parenthesized expression prevents an
                            // unsafe transformation by the Closure Compiler.
                            var original = this.__proto__, result = property in (this.__proto__ = null, this);
                            // Restore the original prototype chain.
                            this.__proto__ = original;
                            return result;
                        };
                    } else {
                        // Capture a reference to the top-level `Object` constructor.
                        constructor = members.constructor;
                        // Use the `constructor` property to simulate `Object#hasOwnProperty` in
                        // other environments.
                        isProperty = function (property) {
                            var parent = (this.constructor || constructor).prototype;
                            return property in this && !(property in parent && this[property] === parent[property]);
                        };
                    }
                    members = null;
                    return isProperty.call(this, property);
                };
            }

            // Internal: A set of primitive types used by `isHostType`.
            var PrimitiveTypes = {
                'boolean': 1,
                'number': 1,
                'string': 1,
                'undefined': 1
            };

            // Internal: Determines if the given object `property` value is a
            // non-primitive.
            var isHostType = function (object, property) {
                var type = typeof object[property];
                return type == 'object' ? !!object[property] : !PrimitiveTypes[type];
            };

            // Internal: Normalizes the `for...in` iteration algorithm across
            // environments. Each enumerated key is yielded to a `callback` function.
            forEach = function (object, callback) {
                var size = 0, Properties, members, property;

                // Tests for bugs in the current environment's `for...in` algorithm. The
                // `valueOf` property inherits the non-enumerable flag from
                // `Object.prototype` in older versions of IE, Netscape, and Mozilla.
                (Properties = function () {
                    this.valueOf = 0;
                }).prototype.valueOf = 0;

                // Iterate over a new instance of the `Properties` class.
                members = new Properties();
                for (property in members) {
                    // Ignore all properties inherited from `Object.prototype`.
                    if (isProperty.call(members, property)) {
                        size++;
                    }
                }
                Properties = members = null;

                // Normalize the iteration algorithm.
                if (!size) {
                    // A list of non-enumerable properties inherited from `Object.prototype`.
                    members = ["valueOf", "toString", "toLocaleString", "propertyIsEnumerable", "isPrototypeOf", "hasOwnProperty", "constructor"];
                    // IE <= 8, Mozilla 1.0, and Netscape 6.2 ignore shadowed non-enumerable
                    // properties.
                    forEach = function (object, callback) {
                        var isFunction = getClass.call(object) == functionClass, property, length;
                        var hasProperty = !isFunction && typeof object.constructor != 'function' && isHostType(object, 'hasOwnProperty') ? object.hasOwnProperty : isProperty;
                        for (property in object) {
                            // Gecko <= 1.0 enumerates the `prototype` property of functions under
                            // certain conditions; IE does not.
                            if (!(isFunction && property == "prototype") && hasProperty.call(object, property)) {
                                callback(property);
                            }
                        }
                        // Manually invoke the callback for each non-enumerable property.
                        for (length = members.length; property = members[--length]; hasProperty.call(object, property) && callback(property));
                    };
                } else if (size == 2) {
                    // Safari <= 2.0.4 enumerates shadowed properties twice.
                    forEach = function (object, callback) {
                        // Create a set of iterated properties.
                        var members = {}, isFunction = getClass.call(object) == functionClass, property;
                        for (property in object) {
                            // Store each property name to prevent double enumeration. The
                            // `prototype` property of functions is not enumerated due to cross-
                            // environment inconsistencies.
                            if (!(isFunction && property == "prototype") && !isProperty.call(members, property) && (members[property] = 1) && isProperty.call(object, property)) {
                                callback(property);
                            }
                        }
                    };
                } else {
                    // No bugs detected; use the standard `for...in` algorithm.
                    forEach = function (object, callback) {
                        var isFunction = getClass.call(object) == functionClass, property, isConstructor;
                        for (property in object) {
                            if (!(isFunction && property == "prototype") && isProperty.call(object, property) && !(isConstructor = property === "constructor")) {
                                callback(property);
                            }
                        }
                        // Manually invoke the callback for the `constructor` property due to
                        // cross-environment inconsistencies.
                        if (isConstructor || isProperty.call(object, (property = "constructor"))) {
                            callback(property);
                        }
                    };
                }
                return forEach(object, callback);
            };

            // Public: Serializes a JavaScript `value` as a JSON string. The optional
            // `filter` argument may specify either a function that alters how object and
            // array members are serialized, or an array of strings and numbers that
            // indicates which properties should be serialized. The optional `width`
            // argument may be either a string or number that specifies the indentation
            // level of the output.
            if (!has("json-stringify")) {
                // Internal: A map of control characters and their escaped equivalents.
                var Escapes = {
                    92: "\\\\",
                    34: '\\"',
                    8: "\\b",
                    12: "\\f",
                    10: "\\n",
                    13: "\\r",
                    9: "\\t"
                };

                // Internal: Converts `value` into a zero-padded string such that its
                // length is at least equal to `width`. The `width` must be <= 6.
                var leadingZeroes = "000000";
                var toPaddedString = function (width, value) {
                    // The `|| 0` expression is necessary to work around a bug in
                    // Opera <= 7.54u2 where `0 == -0`, but `String(-0) !== "0"`.
                    return (leadingZeroes + (value || 0)).slice(-width);
                };

                // Internal: Double-quotes a string `value`, replacing all ASCII control
                // characters (characters with code unit values between 0 and 31) with
                // their escaped equivalents. This is an implementation of the
                // `Quote(value)` operation defined in ES 5.1 section 15.12.3.
                var unicodePrefix = "\\u00";
                var quote = function (value) {
                    var result = '"', index = 0, length = value.length, isLarge = length > 10 && charIndexBuggy, symbols;
                    if (isLarge) {
                        symbols = value.split("");
                    }
                    for (; index < length; index++) {
                        var charCode = value.charCodeAt(index);
                        // If the character is a control character, append its Unicode or
                        // shorthand escape sequence; otherwise, append the character as-is.
                        switch (charCode) {
                            case 8: case 9: case 10: case 12: case 13: case 34: case 92:
                            result += Escapes[charCode];
                            break;
                            default:
                                if (charCode < 32) {
                                    result += unicodePrefix + toPaddedString(2, charCode.toString(16));
                                    break;
                                }
                                result += isLarge ? symbols[index] : charIndexBuggy ? value.charAt(index) : value[index];
                        }
                    }
                    return result + '"';
                };

                // Internal: Recursively serializes an object. Implements the
                // `Str(key, holder)`, `JO(value)`, and `JA(value)` operations.
                var serialize = function (property, object, callback, properties, whitespace, indentation, stack) {
                    var value, className, year, month, date, time, hours, minutes, seconds, milliseconds, results, element, index, length, prefix, result;
                    try {
                        // Necessary for host object support.
                        value = object[property];
                    } catch (exception) {}
                    if (typeof value == "object" && value) {
                        className = getClass.call(value);
                        if (className == dateClass && !isProperty.call(value, "toJSON")) {
                            if (value > -1 / 0 && value < 1 / 0) {
                                // Dates are serialized according to the `Date#toJSON` method
                                // specified in ES 5.1 section 15.9.5.44. See section 15.9.1.15
                                // for the ISO 8601 date time string format.
                                if (getDay) {
                                    // Manually compute the year, month, date, hours, minutes,
                                    // seconds, and milliseconds if the `getUTC*` methods are
                                    // buggy. Adapted from @Yaffle's `date-shim` project.
                                    date = floor(value / 864e5);
                                    for (year = floor(date / 365.2425) + 1970 - 1; getDay(year + 1, 0) <= date; year++);
                                    for (month = floor((date - getDay(year, 0)) / 30.42); getDay(year, month + 1) <= date; month++);
                                    date = 1 + date - getDay(year, month);
                                    // The `time` value specifies the time within the day (see ES
                                    // 5.1 section 15.9.1.2). The formula `(A % B + B) % B` is used
                                    // to compute `A modulo B`, as the `%` operator does not
                                    // correspond to the `modulo` operation for negative numbers.
                                    time = (value % 864e5 + 864e5) % 864e5;
                                    // The hours, minutes, seconds, and milliseconds are obtained by
                                    // decomposing the time within the day. See section 15.9.1.10.
                                    hours = floor(time / 36e5) % 24;
                                    minutes = floor(time / 6e4) % 60;
                                    seconds = floor(time / 1e3) % 60;
                                    milliseconds = time % 1e3;
                                } else {
                                    year = value.getUTCFullYear();
                                    month = value.getUTCMonth();
                                    date = value.getUTCDate();
                                    hours = value.getUTCHours();
                                    minutes = value.getUTCMinutes();
                                    seconds = value.getUTCSeconds();
                                    milliseconds = value.getUTCMilliseconds();
                                }
                                // Serialize extended years correctly.
                                value = (year <= 0 || year >= 1e4 ? (year < 0 ? "-" : "+") + toPaddedString(6, year < 0 ? -year : year) : toPaddedString(4, year)) +
                                    "-" + toPaddedString(2, month + 1) + "-" + toPaddedString(2, date) +
                                        // Months, dates, hours, minutes, and seconds should have two
                                        // digits; milliseconds should have three.
                                    "T" + toPaddedString(2, hours) + ":" + toPaddedString(2, minutes) + ":" + toPaddedString(2, seconds) +
                                        // Milliseconds are optional in ES 5.0, but required in 5.1.
                                    "." + toPaddedString(3, milliseconds) + "Z";
                            } else {
                                value = null;
                            }
                        } else if (typeof value.toJSON == "function" && ((className != numberClass && className != stringClass && className != arrayClass) || isProperty.call(value, "toJSON"))) {
                            // Prototype <= 1.6.1 adds non-standard `toJSON` methods to the
                            // `Number`, `String`, `Date`, and `Array` prototypes. JSON 3
                            // ignores all `toJSON` methods on these objects unless they are
                            // defined directly on an instance.
                            value = value.toJSON(property);
                        }
                    }
                    if (callback) {
                        // If a replacement function was provided, call it to obtain the value
                        // for serialization.
                        value = callback.call(object, property, value);
                    }
                    if (value === null) {
                        return "null";
                    }
                    className = getClass.call(value);
                    if (className == booleanClass) {
                        // Booleans are represented literally.
                        return "" + value;
                    } else if (className == numberClass) {
                        // JSON numbers must be finite. `Infinity` and `NaN` are serialized as
                        // `"null"`.
                        return value > -1 / 0 && value < 1 / 0 ? "" + value : "null";
                    } else if (className == stringClass) {
                        // Strings are double-quoted and escaped.
                        return quote("" + value);
                    }
                    // Recursively serialize objects and arrays.
                    if (typeof value == "object") {
                        // Check for cyclic structures. This is a linear search; performance
                        // is inversely proportional to the number of unique nested objects.
                        for (length = stack.length; length--;) {
                            if (stack[length] === value) {
                                // Cyclic structures cannot be serialized by `JSON.stringify`.
                                throw TypeError();
                            }
                        }
                        // Add the object to the stack of traversed objects.
                        stack.push(value);
                        results = [];
                        // Save the current indentation level and indent one additional level.
                        prefix = indentation;
                        indentation += whitespace;
                        if (className == arrayClass) {
                            // Recursively serialize array elements.
                            for (index = 0, length = value.length; index < length; index++) {
                                element = serialize(index, value, callback, properties, whitespace, indentation, stack);
                                results.push(element === undef ? "null" : element);
                            }
                            result = results.length ? (whitespace ? "[\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "]" : ("[" + results.join(",") + "]")) : "[]";
                        } else {
                            // Recursively serialize object members. Members are selected from
                            // either a user-specified list of property names, or the object
                            // itself.
                            forEach(properties || value, function (property) {
                                var element = serialize(property, value, callback, properties, whitespace, indentation, stack);
                                if (element !== undef) {
                                    // According to ES 5.1 section 15.12.3: "If `gap` {whitespace}
                                    // is not the empty string, let `member` {quote(property) + ":"}
                                    // be the concatenation of `member` and the `space` character."
                                    // The "`space` character" refers to the literal space
                                    // character, not the `space` {width} argument provided to
                                    // `JSON.stringify`.
                                    results.push(quote(property) + ":" + (whitespace ? " " : "") + element);
                                }
                            });
                            result = results.length ? (whitespace ? "{\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "}" : ("{" + results.join(",") + "}")) : "{}";
                        }
                        // Remove the object from the traversed object stack.
                        stack.pop();
                        return result;
                    }
                };

                // Public: `JSON.stringify`. See ES 5.1 section 15.12.3.
                JSON3.stringify = function (source, filter, width) {
                    var whitespace, callback, properties, className;
                    if (typeof filter == "function" || typeof filter == "object" && filter) {
                        if ((className = getClass.call(filter)) == functionClass) {
                            callback = filter;
                        } else if (className == arrayClass) {
                            // Convert the property names array into a makeshift set.
                            properties = {};
                            for (var index = 0, length = filter.length, value; index < length; value = filter[index++], ((className = getClass.call(value)), className == stringClass || className == numberClass) && (properties[value] = 1));
                        }
                    }
                    if (width) {
                        if ((className = getClass.call(width)) == numberClass) {
                            // Convert the `width` to an integer and create a string containing
                            // `width` number of space characters.
                            if ((width -= width % 1) > 0) {
                                for (whitespace = "", width > 10 && (width = 10); whitespace.length < width; whitespace += " ");
                            }
                        } else if (className == stringClass) {
                            whitespace = width.length <= 10 ? width : width.slice(0, 10);
                        }
                    }
                    // Opera <= 7.54u2 discards the values associated with empty string keys
                    // (`""`) only if they are used directly within an object member list
                    // (e.g., `!("" in { "": 1})`).
                    return serialize("", (value = {}, value[""] = source, value), callback, properties, whitespace, "", []);
                };
            }

            // Public: Parses a JSON source string.
            if (!has("json-parse")) {
                var fromCharCode = String.fromCharCode;

                // Internal: A map of escaped control characters and their unescaped
                // equivalents.
                var Unescapes = {
                    92: "\\",
                    34: '"',
                    47: "/",
                    98: "\b",
                    116: "\t",
                    110: "\n",
                    102: "\f",
                    114: "\r"
                };

                // Internal: Stores the parser state.
                var Index, Source;

                // Internal: Resets the parser state and throws a `SyntaxError`.
                var abort = function() {
                    Index = Source = null;
                    throw SyntaxError();
                };

                // Internal: Returns the next token, or `"$"` if the parser has reached
                // the end of the source string. A token may be a string, number, `null`
                // literal, or Boolean literal.
                var lex = function () {
                    var source = Source, length = source.length, value, begin, position, isSigned, charCode;
                    while (Index < length) {
                        charCode = source.charCodeAt(Index);
                        switch (charCode) {
                            case 9: case 10: case 13: case 32:
                            // Skip whitespace tokens, including tabs, carriage returns, line
                            // feeds, and space characters.
                            Index++;
                            break;
                            case 123: case 125: case 91: case 93: case 58: case 44:
                            // Parse a punctuator token (`{`, `}`, `[`, `]`, `:`, or `,`) at
                            // the current position.
                            value = charIndexBuggy ? source.charAt(Index) : source[Index];
                            Index++;
                            return value;
                            case 34:
                                // `"` delimits a JSON string; advance to the next character and
                                // begin parsing the string. String tokens are prefixed with the
                                // sentinel `@` character to distinguish them from punctuators and
                                // end-of-string tokens.
                                for (value = "@", Index++; Index < length;) {
                                    charCode = source.charCodeAt(Index);
                                    if (charCode < 32) {
                                        // Unescaped ASCII control characters (those with a code unit
                                        // less than the space character) are not permitted.
                                        abort();
                                    } else if (charCode == 92) {
                                        // A reverse solidus (`\`) marks the beginning of an escaped
                                        // control character (including `"`, `\`, and `/`) or Unicode
                                        // escape sequence.
                                        charCode = source.charCodeAt(++Index);
                                        switch (charCode) {
                                            case 92: case 34: case 47: case 98: case 116: case 110: case 102: case 114:
                                            // Revive escaped control characters.
                                            value += Unescapes[charCode];
                                            Index++;
                                            break;
                                            case 117:
                                                // `\u` marks the beginning of a Unicode escape sequence.
                                                // Advance to the first character and validate the
                                                // four-digit code point.
                                                begin = ++Index;
                                                for (position = Index + 4; Index < position; Index++) {
                                                    charCode = source.charCodeAt(Index);
                                                    // A valid sequence comprises four hexdigits (case-
                                                    // insensitive) that form a single hexadecimal value.
                                                    if (!(charCode >= 48 && charCode <= 57 || charCode >= 97 && charCode <= 102 || charCode >= 65 && charCode <= 70)) {
                                                        // Invalid Unicode escape sequence.
                                                        abort();
                                                    }
                                                }
                                                // Revive the escaped character.
                                                value += fromCharCode("0x" + source.slice(begin, Index));
                                                break;
                                            default:
                                                // Invalid escape sequence.
                                                abort();
                                        }
                                    } else {
                                        if (charCode == 34) {
                                            // An unescaped double-quote character marks the end of the
                                            // string.
                                            break;
                                        }
                                        charCode = source.charCodeAt(Index);
                                        begin = Index;
                                        // Optimize for the common case where a string is valid.
                                        while (charCode >= 32 && charCode != 92 && charCode != 34) {
                                            charCode = source.charCodeAt(++Index);
                                        }
                                        // Append the string as-is.
                                        value += source.slice(begin, Index);
                                    }
                                }
                                if (source.charCodeAt(Index) == 34) {
                                    // Advance to the next character and return the revived string.
                                    Index++;
                                    return value;
                                }
                                // Unterminated string.
                                abort();
                            default:
                                // Parse numbers and literals.
                                begin = Index;
                                // Advance past the negative sign, if one is specified.
                                if (charCode == 45) {
                                    isSigned = true;
                                    charCode = source.charCodeAt(++Index);
                                }
                                // Parse an integer or floating-point value.
                                if (charCode >= 48 && charCode <= 57) {
                                    // Leading zeroes are interpreted as octal literals.
                                    if (charCode == 48 && ((charCode = source.charCodeAt(Index + 1)), charCode >= 48 && charCode <= 57)) {
                                        // Illegal octal literal.
                                        abort();
                                    }
                                    isSigned = false;
                                    // Parse the integer component.
                                    for (; Index < length && ((charCode = source.charCodeAt(Index)), charCode >= 48 && charCode <= 57); Index++);
                                    // Floats cannot contain a leading decimal point; however, this
                                    // case is already accounted for by the parser.
                                    if (source.charCodeAt(Index) == 46) {
                                        position = ++Index;
                                        // Parse the decimal component.
                                        for (; position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57); position++);
                                        if (position == Index) {
                                            // Illegal trailing decimal.
                                            abort();
                                        }
                                        Index = position;
                                    }
                                    // Parse exponents. The `e` denoting the exponent is
                                    // case-insensitive.
                                    charCode = source.charCodeAt(Index);
                                    if (charCode == 101 || charCode == 69) {
                                        charCode = source.charCodeAt(++Index);
                                        // Skip past the sign following the exponent, if one is
                                        // specified.
                                        if (charCode == 43 || charCode == 45) {
                                            Index++;
                                        }
                                        // Parse the exponential component.
                                        for (position = Index; position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57); position++);
                                        if (position == Index) {
                                            // Illegal empty exponent.
                                            abort();
                                        }
                                        Index = position;
                                    }
                                    // Coerce the parsed value to a JavaScript number.
                                    return +source.slice(begin, Index);
                                }
                                // A negative sign may only precede numbers.
                                if (isSigned) {
                                    abort();
                                }
                                // `true`, `false`, and `null` literals.
                                if (source.slice(Index, Index + 4) == "true") {
                                    Index += 4;
                                    return true;
                                } else if (source.slice(Index, Index + 5) == "false") {
                                    Index += 5;
                                    return false;
                                } else if (source.slice(Index, Index + 4) == "null") {
                                    Index += 4;
                                    return null;
                                }
                                // Unrecognized token.
                                abort();
                        }
                    }
                    // Return the sentinel `$` character if the parser has reached the end
                    // of the source string.
                    return "$";
                };

                // Internal: Parses a JSON `value` token.
                var get = function (value) {
                    var results, hasMembers;
                    if (value == "$") {
                        // Unexpected end of input.
                        abort();
                    }
                    if (typeof value == "string") {
                        if ((charIndexBuggy ? value.charAt(0) : value[0]) == "@") {
                            // Remove the sentinel `@` character.
                            return value.slice(1);
                        }
                        // Parse object and array literals.
                        if (value == "[") {
                            // Parses a JSON array, returning a new JavaScript array.
                            results = [];
                            for (;; hasMembers || (hasMembers = true)) {
                                value = lex();
                                // A closing square bracket marks the end of the array literal.
                                if (value == "]") {
                                    break;
                                }
                                // If the array literal contains elements, the current token
                                // should be a comma separating the previous element from the
                                // next.
                                if (hasMembers) {
                                    if (value == ",") {
                                        value = lex();
                                        if (value == "]") {
                                            // Unexpected trailing `,` in array literal.
                                            abort();
                                        }
                                    } else {
                                        // A `,` must separate each array element.
                                        abort();
                                    }
                                }
                                // Elisions and leading commas are not permitted.
                                if (value == ",") {
                                    abort();
                                }
                                results.push(get(value));
                            }
                            return results;
                        } else if (value == "{") {
                            // Parses a JSON object, returning a new JavaScript object.
                            results = {};
                            for (;; hasMembers || (hasMembers = true)) {
                                value = lex();
                                // A closing curly brace marks the end of the object literal.
                                if (value == "}") {
                                    break;
                                }
                                // If the object literal contains members, the current token
                                // should be a comma separator.
                                if (hasMembers) {
                                    if (value == ",") {
                                        value = lex();
                                        if (value == "}") {
                                            // Unexpected trailing `,` in object literal.
                                            abort();
                                        }
                                    } else {
                                        // A `,` must separate each object member.
                                        abort();
                                    }
                                }
                                // Leading commas are not permitted, object property names must be
                                // double-quoted strings, and a `:` must separate each property
                                // name and value.
                                if (value == "," || typeof value != "string" || (charIndexBuggy ? value.charAt(0) : value[0]) != "@" || lex() != ":") {
                                    abort();
                                }
                                results[value.slice(1)] = get(lex());
                            }
                            return results;
                        }
                        // Unexpected token encountered.
                        abort();
                    }
                    return value;
                };

                // Internal: Updates a traversed object member.
                var update = function(source, property, callback) {
                    var element = walk(source, property, callback);
                    if (element === undef) {
                        delete source[property];
                    } else {
                        source[property] = element;
                    }
                };

                // Internal: Recursively traverses a parsed JSON object, invoking the
                // `callback` function for each value. This is an implementation of the
                // `Walk(holder, name)` operation defined in ES 5.1 section 15.12.2.
                var walk = function (source, property, callback) {
                    var value = source[property], length;
                    if (typeof value == "object" && value) {
                        // `forEach` can't be used to traverse an array in Opera <= 8.54
                        // because its `Object#hasOwnProperty` implementation returns `false`
                        // for array indices (e.g., `![1, 2, 3].hasOwnProperty("0")`).
                        if (getClass.call(value) == arrayClass) {
                            for (length = value.length; length--;) {
                                update(value, length, callback);
                            }
                        } else {
                            forEach(value, function (property) {
                                update(value, property, callback);
                            });
                        }
                    }
                    return callback.call(source, property, value);
                };

                // Public: `JSON.parse`. See ES 5.1 section 15.12.2.
                JSON3.parse = function (source, callback) {
                    var result, value;
                    Index = 0;
                    Source = "" + source;
                    result = get(lex());
                    // If a JSON string contains multiple tokens, it is invalid.
                    if (lex() != "$") {
                        abort();
                    }
                    // Reset the parser state.
                    Index = Source = null;
                    return callback && getClass.call(callback) == functionClass ? walk((value = {}, value[""] = result, value), "", callback) : result;
                };
            }
        }

        // Export for asynchronous module loaders.
        if (isLoader) {
            define(function () {
                return JSON3;
            });
        }
    }(this));

},{}],50:[function(_dereq_,module,exports){
    module.exports = toArray

    function toArray(list, index) {
        var array = []

        index = index || 0

        for (var i = index || 0; i < list.length; i++) {
            array[i - index] = list[i]
        }

        return array
    }

},{}]},{},[1])
(1)
});

/*! Tuio.js - v0.0.1 - 2012-10-14
 * http://fe9lix.github.com/Tuio.js/
 * Copyright (c) 2012 Felix Raab; Licensed GPL */

(function(root) {
    // Initial Setup, events mixin and extend/inherits taken from Backbone.js
    // See Backbone.js source for original version and comments.

    var previousTuio = root.Tuio;

    var slice = Array.prototype.slice;
    var splice = Array.prototype.splice;

    var Tuio;
    if (typeof exports !== "undefined") {
        Tuio = exports;
    } else {
        Tuio = root.Tuio = {};
    }

    Tuio.VERSION = "0.0.1";

    var _ = root._;

    if (!_ && (typeof require !== "undefined")) {
        _ = require("lodash");
    }

    Tuio.noConflict = function() {
        root.Tuio = previousTuio;
        return this;
    };

    var eventSplitter = /\s+/;

    var Events = Tuio.Events = {
        on: function(events, callback, context) {
            var calls, event, node, tail, list;
            if (!callback) {
                return this;
            }
            events = events.split(eventSplitter);
            calls = this._callbacks || (this._callbacks = {});

            while (event = events.shift()) {
                list = calls[event];
                node = list ? list.tail : {};
                node.next = tail = {};
                node.context = context;
                node.callback = callback;
                calls[event] = {tail: tail, next: list ? list.next : node};
            }

            return this;
        },

        off: function(events, callback, context) {
            var event, calls, node, tail, cb, ctx;

            if (!(calls = this._callbacks)) {
                return;
            }
            if (!(events || callback || context)) {
                delete this._callbacks;
                return this;
            }

            events = events ? events.split(eventSplitter) : _.keys(calls);
            while (event = events.shift()) {
                node = calls[event];
                delete calls[event];
                if (!node || !(callback || context)) {
                    continue;
                }
                tail = node.tail;
                while ((node = node.next) !== tail) {
                    cb = node.callback;
                    ctx = node.context;
                    if ((callback && cb !== callback) || (context && ctx !== context)) {
                        this.on(event, cb, ctx);
                    }
                }
            }

            return this;
        },

        trigger: function(events) {
            var event, node, calls, tail, args, all, rest;
            if (!(calls = this._callbacks)) {
                return this;
            }
            all = calls.all;
            events = events.split(eventSplitter);
            rest = slice.call(arguments, 1);

            while (event = events.shift()) {
                if (node = calls[event]) {
                    tail = node.tail;
                    while ((node = node.next) !== tail) {
                        node.callback.apply(node.context || this, rest);
                    }
                }
                if (node = all) {
                    tail = node.tail;
                    args = [event].concat(rest);
                    while ((node = node.next) !== tail) {
                        node.callback.apply(node.context || this, args);
                    }
                }
            }

            return this;
        }
    };

    var Model = Tuio.Model = function() {
        this.initialize.apply(this, arguments);
    };

    _.extend(Model.prototype, Events);

    var extend = function (protoProps, classProps) {
        var child = inherits(this, protoProps, classProps);
        child.extend = this.extend;
        return child;
    };

    Tuio.Model.extend = extend;

    var Ctor = function() {

    };

    var inherits = function(parent, protoProps, staticProps) {
        var child;

        if (protoProps && protoProps.hasOwnProperty("constructor")) {
            child = protoProps.constructor;
        } else {
            child = function() {
                parent.apply(this, arguments);
            };
        }

        _.extend(child, parent);

        Ctor.prototype = parent.prototype;
        child.prototype = new Ctor();

        if (protoProps) {
            _.extend(child.prototype, protoProps);
        }

        if (staticProps) {
            _.extend(child, staticProps);
        }

        child.prototype.constructor = child;

        child.__super__ = parent.prototype;

        return child;
    };
}(this));
Tuio.Time = Tuio.Model.extend({
    seconds: 0,
    microSeconds: 0,

    initialize: function(sec, usec) {
        this.seconds = sec || 0;
        this.microSeconds = usec || 0;
    },

    add: function(us) {
        return new Tuio.Time(
            this.seconds + Math.floor(us / 1000000),
            this.microSeconds + us % 1000000
        );
    },

    addTime: function(ttime) {
        var sec = this.seconds + ttime.getSeconds(),
            usec = this.microSeconds + ttime.getMicroseconds();
        sec += Math.floor(usec / 1000000);
        usec = usec % 1000000;

        return new Tuio.Time(sec, usec);
    },

    subtract: function(us) {
        var sec = this.seconds - Math.floor(us / 1000000),
            usec = this.microSeconds - us % 1000000;

        if (usec < 0) {
            usec += 1000000;
            sec = sec - 1;
        }

        return new Tuio.Time(sec, usec);
    },

    subtractTime: function(ttime) {
        var sec = this.seconds - ttime.getSeconds(),
            usec = this.microSeconds - ttime.getMicroseconds();

        if (usec < 0) {
            usec += 1000000;
            sec = sec - 1;
        }

        return new Tuio.Time(sec, usec);
    },

    equals: function(ttime) {
        return (
            (this.seconds === ttime.getSeconds()) &&
            (this.microSeconds === ttime.getMicroseconds())
        );
    },

    reset: function() {
        this.seconds = 0;
        this.microSeconds = 0;
    },

    getSeconds: function() {
        return this.seconds;
    },

    getMicroseconds: function() {
        return this.microSeconds;
    },

    getTotalMilliseconds: function() {
        return this.seconds * 1000 + Math.floor(this.microSeconds / 1000);
    }
}, {
    startSeconds: 0,
    startMicroSeconds: 0,

    fromMilliseconds: function(msec) {
        return new Tuio.Time(
            Math.floor(msec / 1000),
            1000 * (msec % 1000)
        );
    },

    fromTime: function(ttime) {
        return new Tuio.Time(
            ttime.getSeconds(),
            ttime.getMicroseconds()
        );
    },

    initSession: function() {
        var startTime = Tuio.Time.getSystemTime();
        Tuio.Time.startSeconds = startTime.getSeconds();
        Tuio.Time.startMicroSeconds = startTime.getMicroseconds();
    },

    getSessionTime: function() {
        return Tuio.Time.getSystemTime().subtractTime(Tuio.Time.getStartTime());
    },

    getStartTime: function() {
        return new Tuio.Time(
            Tuio.Time.startSeconds,
            Tuio.Time.startMicroSeconds
        );
    },

    getSystemTime: function() {
        var usec = new Date().getTime() * 1000;

        return new Tuio.Time(
            Math.floor(usec / 1000000),
            usec % 1000000
        );
    }
});
Tuio.Point = Tuio.Model.extend({
    xPos: null,
    yPos: null,
    currentTime: null,
    startTime: null,

    initialize: function(params) {
        this.xPos = params.xp || 0;
        this.yPos = params.yp || 0;
        this.currentTime = Tuio.Time.fromTime(params.ttime || Tuio.Time.getSessionTime());
        this.startTime = Tuio.Time.fromTime(this.currentTime);
    },

    update: function(params) {
        this.xPos = params.xp;
        this.yPos = params.yp;
        if (params.hasOwnProperty("ttime")) {
            this.currentTime = Tuio.Time.fromTime(params.ttime);
        }
    },

    updateToPoint: function(tpoint) {
        this.xPos = tpoint.getX();
        this.yPos = tpoint.getY();
    },

    getX: function() {
        return this.xPos;
    },

    getY: function() {
        return this.yPos;
    },

    getDistance: function(xp, yp) {
        var dx = this.xPos - xp,
            dy = this.yPos - yp;
        return Math.sqrt(dx * dx + dy * dy);
    },

    getDistanceToPoint: function(tpoint) {
        return this.getDistance(tpoint.getX(), tpoint.getY());
    },

    getAngle: function(xp, yp) {
        var side = this.xPos - xp,
            height = this.yPos - yp,
            distance = this.getDistance(xp, yp),
            angle = Math.asin(side / distance) + Math.PI / 2;

        if (height < 0) {
            angle = 2 * Math.PI - angle;
        }

        return angle;
    },

    getAngleToPoint: function(tpoint) {
        return this.getAngle(tpoint.getX(), tpoint.getY());
    },

    getAngleDegrees: function(xp, yp) {
        return (this.getAngle(xp, yp) / Math.PI) * 180;
    },

    getAngleDegreesToPoint: function(tpoint) {
        return (this.getAngleToPoint(tpoint) / Math.PI) * 180;
    },

    getScreenX: function(width) {
        return Math.round(this.xPos * width);
    },

    getScreenY: function(height) {
        return Math.round(this.yPos * height);
    },

    getTuioTime: function() {
        return Tuio.Time.fromTime(this.currentTime);
    },

    getStartTime: function() {
        return Tuio.Time.fromTime(this.startTime);
    }
}, {
    fromPoint: function(tpoint) {
        return new Tuio.Point({
            xp: tpoint.getX(),
            yp: tpoint.getY()
        });
    }
});
Tuio.Container = Tuio.Point.extend({
    sessionId: null,
    xSpeed: null,
    ySpeed: null,
    motionSpeed: null,
    motionAccel: null,
    path: null,
    state: null,

    initialize: function(params) {
        Tuio.Point.prototype.initialize.call(this, params);

        this.sessionId = params.si;
        this.xSpeed = 0;
        this.ySpeed = 0;
        this.motionSpeed = 0;
        this.motionAccel = 0;
        this.path = [new Tuio.Point({
            ttime: this.currentTime,
            xp: this.xPos,
            yp: this.yPos
        })];
        this.state = Tuio.Container.TUIO_ADDED;
    },

    update: function(params) {
        var lastPoint = this.path[this.path.length - 1];
        Tuio.Point.prototype.update.call(this, params);

        if (
            params.hasOwnProperty("xs") &&
            params.hasOwnProperty("ys") &&
            params.hasOwnProperty("ma")) {

            this.xSpeed = params.xs;
            this.ySpeed = params.ys;
            this.motionSpeed = Math.sqrt(this.xSpeed * this.xSpeed + this.ySpeed * this.ySpeed);
            this.motionAccel = params.ma;
        } else {
            var diffTime = this.currentTime.subtractTime(lastPoint.getTuioTime()),
                dt = diffTime.getTotalMilliseconds() / 1000,
                dx = this.xPos - lastPoint.getX(),
                dy = this.yPos - lastPoint.getY(),
                dist = Math.sqrt(dx * dx + dy * dy),
                lastMotionSpeed = this.motionSpeed;

            this.xSpeed = dx / dt;
            this.ySpeed = dy / dt;
            this.motionSpeed = dist / dt;
            this.motionAccel = (this.motionSpeed - lastMotionSpeed) / dt;
        }

        this.updatePathAndState();
    },

    updateContainer: function(tcon) {
        Tuio.Point.prototype.updateToPoint.call(this, tcon);

        this.xSpeed = tcon.getXSpeed();
        this.ySpeed = tcon.getYSpeed();
        this.motionSpeed = tcon.getMotionSpeed();
        this.motionAccel = tcon.getMotionAccel();

        this.updatePathAndState();
    },

    updatePathAndState: function() {
        this.path.push(new Tuio.Point({
            ttime: this.currentTime,
            xp: this.xPos,
            yp: this.yPos
        }));

        if (this.motionAccel > 0) {
            this.state = Tuio.Container.TUIO_ACCELERATING;
        } else if (this.motionAccel < 0) {
            this.state = Tuio.Container.TUIO_DECELERATING;
        } else {
            this.state = Tuio.Container.TUIO_STOPPED;
        }
    },

    stop: function(ttime) {
        this.update({
            ttime: ttime,
            xp: this.xPos,
            yp: this.yPos
        });
    },

    remove: function(ttime) {
        this.currentTime = Tuio.Time.fromTime(ttime);
        this.state = Tuio.Container.TUIO_REMOVED;
    },

    getSessionId: function() {
        return this.sessionId;
    },

    getXSpeed: function() {
        return this.xSpeed;
    },

    getYSpeed: function() {
        return this.ySpeed;
    },

    getPosition: function() {
        return new Tuio.Point(this.xPos, this.yPos);
    },

    getPath: function() {
        return this.path;
    },

    getMotionSpeed: function() {
        return this.motionSpeed;
    },

    getMotionAccel: function() {
        return this.motionAccel;
    },

    getTuioState: function() {
        return this.state;
    },

    isMoving: function() {
        return (
            (this.state === Tuio.Container.TUIO_ACCELERATING) ||
            (this.state === Tuio.Container.TUIO_DECELERATING)
        );
    }
}, {
    TUIO_ADDED: 0,
    TUIO_ACCELERATING: 1,
    TUIO_DECELERATING: 2,
    TUIO_STOPPED: 3,
    TUIO_REMOVED: 4,

    fromContainer: function(tcon) {
        return new Tuio.Container({
            xp: tcon.getX(),
            yp: tcon.getY(),
            si: tcon.getSessionID()
        });
    }
});
Tuio.Cursor = Tuio.Container.extend({
    cursorId: null,

    initialize: function(params) {
        Tuio.Container.prototype.initialize.call(this, params);

        this.cursorId = params.ci;
    },

    getCursorId: function() {
        return this.cursorId;
    }
}, {
    fromCursor: function(tcur) {
        return new Tuio.Cursor({
            si: tcur.getSessionId(),
            ci: tcur.getCursorId(),
            xp: tcur.getX(),
            yp: tcur.getY()
        });
    }
});
Tuio.Object = Tuio.Container.extend({
    symbolId: null,
    angle: null,
    rotationSpeed: null,
    rotationAccel: null,

    initialize: function(params) {
        Tuio.Container.prototype.initialize.call(this, params);

        this.symbolId = params.sym;
        this.angle = params.a;
        this.rotationSpeed = 0;
        this.rotationAccel = 0;
    },

    update: function(params) {
        var lastPoint = this.path[this.path.length - 1];
        Tuio.Container.prototype.update.call(this, params);

        if (
            params.hasOwnProperty("rs") &&
            params.hasOwnProperty("ra")) {

            this.angle = params.a;
            this.rotationSpeed = params.rs;
            this.rotationAccel = params.ra;
        } else {
            var diffTime = this.currentTime.subtractTime(lastPoint.getTuioTime()),
                dt = diffTime.getTotalMilliseconds() / 1000,
                lastAngle = this.angle,
                lastRotationSpeed = this.rotationSpeed;
            this.angle = params.a;

            var da = (this.angle - lastAngle) / (2 * Math.PI);
            if (da > 0.75) {
                da -= 1;
            } else if (da < -0.75) {
                da += 1;
            }

            this.rotationSpeed = da / dt;
            this.rotationAccel = (this.rotationSpeed - lastRotationSpeed) / dt;
        }

        this.updateObjectState();
    },

    updateObject: function(tobj) {
        Tuio.Container.prototype.updateContainer.call(this, tobj);

        this.angle = tobj.getAngle();
        this.rotationSpeed = tobj.getRotationSpeed();
        this.rotationAccel = tobj.getRotationAccel();

        this.updateObjectState();
    },

    updateObjectState: function() {
    	// actual line:
    	// if ((this.rotationAccel !== 0)&& (this.state !== Tuio.Object.TUIO_STOPPED) ) {
        if ((this.rotationAccel !== 0) ) {
            this.state = Tuio.Object.TUIO_ROTATING;
        }
    },

    stop: function(ttime) {
        this.update({
            ttime: ttime,
            xp: this.xPos,
            yp: this.yPos,
            a: this.angle
        });
    },

    getSymbolId: function() {
        return this.symbolId;
    },

    getAngle: function() {
        return this.angle;
    },

    getAngleDegrees: function() {
        return this.angle / Math.PI * 180;
    },

    getRotationSpeed: function() {
        return this.rotationSpeed;
    },

    getRotationAccel: function() {
        return this.rotationAccel;
    },

    isMoving: function() {
        return (
            (this.state === Tuio.Object.TUIO_ACCELERATING) ||
            (this.state === Tuio.Object.TUIO_DECELERATING) ||
            (this.state === Tuio.Object.TUIO_ROTATING)
        );
    }
}, {
    TUIO_ROTATING: 5,

    fromObject: function(tobj) {
        return new Tuio.Object({
            xp: tobj.getX(),
            yp: tobj.getY(),
            si: tobj.getSessionID(),
            sym: tobj.getSymbolId(),
            a: tobj.getAngle()
        });
    }
});
Tuio.Client = Tuio.Model.extend({
    host: null,
    socket: null,
    connected: null,
    objectList: null,
    aliveObjectList: null,
    newObjectList: null,
    cursorList: null,
    aliveCursorList: null,
    newCursorList: null,
    frameObjects: null,
    frameCursors: null,
    freeCursorList: null,
    maxCursorId: null,
    currentFrame: null,
    currentTime: null,

    initialize: function(params) {
        this.host = params.host;
        this.connected = false;
        this.objectList = {};
        this.aliveObjectList = [];
        this.newObjectList = [];
        this.cursorList = {};
        this.aliveCursorList = [];
        this.newCursorList = [];
        this.frameObjects = [];
        this.frameCursors = [];
        this.freeCursorList = [];
        this.maxCursorId = -1;
        this.currentFrame = 0;
        this.currentTime = null;

        _.bindAll(this, "onConnect", "acceptBundle", "onDisconnect");
    },

    connect: function() {
        Tuio.Time.initSession();
        this.currentTime = new Tuio.Time();
        this.currentTime.reset();

        this.socket = io.connect(this.host);
        this.socket.on("connect", this.onConnect);
        this.socket.on("disconnect", this.onDisconnect);
    },

    disconnect: function(){
        this.socket.disconnect();
    },
    onConnect: function() {
        this.socket.on("osc", this.acceptBundle);
        console.log("connection established");
        this.connected = true;
        this.trigger("connect");
    },


    onDisconnect: function() {
        this.connected = false;
        console.log("connection lost");
        this.trigger("disconnect");
    },

    isConnected: function() {
        return this.connected;
    },

    getTuioObjects: function() {
        return _.clone(this.objectList);
    },

    getTuioCursors: function() {
        return _.clone(this.cursorList);
    },

    getTuioObject: function(sid) {
        return this.objectList[sid];
    },

    getTuioCursor: function(sid) {
        return this.cursorList[sid];
    },

    acceptBundle: function(oscBundle) {
        var bundle = osc.readPacket(oscBundle.data,{},oscBundle.offset, oscBundle.length);

        var packets = bundle.packets;

        for(var i = 0, max = packets.length;i<max;i++) {
            var packet = packets[i];
            switch(packet.address) {
                case "/tuio/2Dobj":
                case "/tuio/2Dcur":
                    this.acceptMessage(packet);
                    break;
                case "/tuio/2Dblb":
                    console.log("Blog received");
                    break;
            }
        }
      /*  var msg = null;

        var msg2 = oscBundle.split(",");
        msg = msg2.slice(2, msg2.length-1);
        switch (msg[0]) {
            case "/tuio/2Dobj":
            case "/tuio/2Dcur":
                this.acceptMessage(msg);
                break;
        }
        msg = msg2[2]
        /*  for (var i = 0, max = oscBundle.length; i < max; i++) {
         msg = oscBundle[i];
         switch (msg[0]) {
         case "/tuio/2Dobj":
         case "/tuio/2Dcur":
         this.acceptMessage(msg);
         break;
         }
         }*/
    },

    acceptMessage: function(oscMessage) {
        var address = oscMessage.address,
            command = oscMessage.args[0],
            args = oscMessage.args.slice(1, oscMessage.length);

        switch (address) {
            case "/tuio/2Dobj":
                this.handleObjectMessage(command, args);
                break;
            case "/tuio/2Dcur":
                this.handleCursorMessage(command, args);
                break;
        }
    },

    handleObjectMessage: function(command, args) {
        switch (command) {
            case "set":
                this.objectSet(args);
                break;
            case "alive":
                this.objectAlive(args);
                break;
            case "fseq":
                this.objectFseq(args);
                break;
        }
    },

    handleCursorMessage: function(command, args) {
        switch (command) {
            case "set":
                this.cursorSet(args);
                break;
            case "alive":
                this.cursorAlive(args);
                break;
            case "fseq":
                this.cursorFseq(args);
                break;
        }
    },

    objectSet: function(args) {
        var sid = args[0],
            cid = args[1],
            xPos = args[2],
            yPos = args[3],
            angle = args[4],
            xSpeed = args[5],
            ySpeed = args[6],
            rSpeed = args[7],
            mAccel = args[8],
            rAccel = args[9];

        if (!_.has(this.objectList, sid)) {
            var addObject = new Tuio.Object({
                si: sid,
                sym: cid,
                xp: xPos,
                yp: yPos,
                a: angle
            });
            this.frameObjects.push(addObject);
        } else {
            var tobj = this.objectList[sid];
            if (!tobj) {
                return;
            }
            if (
                (tobj.xPos !== xPos) ||
                (tobj.yPos !== yPos) ||
                (tobj.angle !== angle) ||
                (tobj.xSpeed !== xSpeed) ||
                (tobj.ySpeed !== ySpeed) ||
                (tobj.rotationSpeed !== rSpeed) ||
                (tobj.motionAccel !== mAccel) ||
                (tobj.rotationAccel !== rAccel)) {

                var updateObject = new Tuio.Object({
                    si: sid,
                    sym: cid,
                    xp: xPos,
                    yp: yPos,
                    a: angle
                });
                updateObject.update({
                    xp: xPos,
                    yp: yPos,
                    a: angle,
                    xs: xSpeed,
                    ys: ySpeed,
                    rs: rSpeed,
                    ma: mAccel,
                    ra: rAccel
                });
                this.frameObjects.push(updateObject);
            }
        }
    },

    objectAlive: function(args) {
        var removeObject = null;
        this.newObjectList = args;
        this.aliveObjectList = _.difference(this.aliveObjectList, this.newObjectList);

        for (var i = 0, max = this.aliveObjectList.length; i < max; i++) {
            removeObject = this.objectList[this.aliveObjectList[i]];
            if (removeObject) {
                removeObject.remove(this.currentTime);
                this.frameObjects.push(removeObject);
            }
        }
    },

    objectFseq: function(args) {
        var fseq = args[0],
            lateFrame = false,
            tobj = null;

        if (fseq > 0) {
            if (fseq > this.currentFrame) {
                this.currentTime = Tuio.Time.getSessionTime();
            }
            if ((fseq >= this.currentFrame) || ((this.currentFrame - fseq) > 100)) {
                this.currentFrame = fseq;
            } else {
                lateFrame = true;
            }
        } else if (Tuio.Time.getSessionTime().subtractTime(this.currentTime).getTotalMilliseconds() > 100) {
            this.currentTime = Tuio.Time.getSessionTime();
        }

        if (!lateFrame) {
            for (var i = 0, max = this.frameObjects.length; i < max; i++) {
                tobj = this.frameObjects[i];
                switch (tobj.getTuioState()) {
                    case Tuio.Object.TUIO_REMOVED:
                        this.objectRemoved(tobj);
                        break;
                    case Tuio.Object.TUIO_ADDED:
                        this.objectAdded(tobj);
                        break;
                    default:
                        this.objectDefault(tobj);
                        break;
                }
            }

            this.trigger("refresh", Tuio.Time.fromTime(this.currentTime));

            var buffer = this.aliveObjectList;
            this.aliveObjectList = this.newObjectList;
            this.newObjectList = buffer;
        }

        this.frameObjects = [];
    },

    objectRemoved: function(tobj) {
        var removeObject = tobj;
        removeObject.remove(this.currentTime);
        this.trigger("removeTuioObject", removeObject);
        delete this.objectList[removeObject.getSessionId()];
    },

    objectAdded: function(tobj) {
        var addObject = new Tuio.Object({
            ttime: this.currentTime,
            si: tobj.getSessionId(),
            sym: tobj.getSymbolId(),
            xp: tobj.getX(),
            yp: tobj.getY(),
            a: tobj.getAngle()
        });
        this.objectList[addObject.getSessionId()] = addObject;
        this.trigger("addTuioObject", addObject);
    },

    objectDefault: function(tobj) {
        var updateObject = this.objectList[tobj.getSessionId()];
        if (
            (tobj.getX() !== updateObject.getX() && tobj.getXSpeed() === 0) ||
            (tobj.getY() !== updateObject.getY() && tobj.getYSpeed() === 0)) {

            updateObject.update({
                ttime: this.currentTime,
                xp: tobj.getX(),
                yp: tobj.getY(),
                a: tobj.getAngle()
            });
        } else {
            updateObject.update({
                ttime: this.currentTime,
                xp: tobj.getX(),
                yp: tobj.getY(),
                a: tobj.getAngle(),
                xs: tobj.getXSpeed(),
                ys: tobj.getYSpeed(),
                rs: tobj.getRotationSpeed(),
                ma: tobj.getMotionAccel(),
                ra: tobj.getRotationAccel()
            });
        }

        this.trigger("updateTuioObject", updateObject);
    },

    cursorSet: function(args) {
        var sid = args[0],
            xPos = args[1],
            yPos = args[2],
            xSpeed = args[3],
            ySpeed = args[4],
            mAccel = args[5];

        if (!_.has(this.cursorList, sid)) {
            var addCursor = new Tuio.Cursor({
                si: sid,
                ci: -1,
                xp: xPos,
                yp: yPos
            });
            this.frameCursors.push(addCursor);
        } else {
            var tcur = this.cursorList[sid];
            if (!tcur) {
                return;
            }
            if (
                (tcur.xPos !== xPos) ||
                (tcur.yPos !== yPos) ||
                (tcur.xSpeed !== xSpeed) ||
                (tcur.ySpeed !== ySpeed) ||
                (tcur.motionAccel !== mAccel)) {

                var updateCursor = new Tuio.Cursor({
                    si: sid,
                    ci: tcur.getCursorId(),
                    xp: xPos,
                    yp: yPos
                });
                updateCursor.update({
                    xp: xPos,
                    yp: yPos,
                    xs: xSpeed,
                    ys: ySpeed,
                    ma: mAccel
                });
                this.frameCursors.push(updateCursor);
            }
        }
    },

    cursorAlive: function(args) {
        var removeCursor = null;
        this.newCursorList = args;
        this.aliveCursorList = _.difference(this.aliveCursorList, this.newCursorList);

        for (var i = 0, max = this.aliveCursorList.length; i < max; i++) {
            removeCursor = this.cursorList[this.aliveCursorList[i]];
            if (removeCursor) {
                removeCursor.remove(this.currentTime);
                this.frameCursors.push(removeCursor);
            }
        }
    },

    cursorFseq: function(args) {
        var fseq = args[0],
            lateFrame = false,
            tcur = null;

        if (fseq > 0) {
            if (fseq > this.currentFrame) {
                this.currentTime = Tuio.Time.getSessionTime();
            }
            if ((fseq >= this.currentFrame) || ((this.currentFrame - fseq) > 100)) {
                this.currentFrame = fseq;
            } else {
                lateFrame = true;
            }
        } else if (Tuio.Time.getSessionTime().subtractTime(this.currentTime).getTotalMilliseconds() > 100) {
            this.currentTime = Tuio.Time.getSessionTime();
        }

        if (!lateFrame) {
            for (var i = 0, max = this.frameCursors.length; i < max; i++) {
                tcur = this.frameCursors[i];
                switch (tcur.getTuioState()) {
                    case Tuio.Cursor.TUIO_REMOVED:
                        this.cursorRemoved(tcur);
                        break;
                    case Tuio.Cursor.TUIO_ADDED:
                        this.cursorAdded(tcur);
                        break;
                    default:
                        this.cursorDefault(tcur);
                        break;
                }
            }

            this.trigger("refresh", Tuio.Time.fromTime(this.currentTime));

            var buffer = this.aliveCursorList;
            this.aliveCursorList = this.newCursorList;
            this.newCursorList = buffer;
        }

        this.frameCursors = [];
    },

    cursorRemoved: function(tcur) {
        var removeCursor = tcur;
        removeCursor.remove(this.currentTime);

        this.trigger("removeTuioCursor", removeCursor);

        delete this.cursorList[removeCursor.getSessionId()];

        if (removeCursor.getCursorId() === this.maxCursorId) {
            this.maxCursorId = -1;
            if (_.size(this.cursorList) > 0) {
                var maxCursor = _.max(this.cursorList, function(cur) {
                    return cur.getCursorId();
                });
                if (maxCursor.getCursorId() > this.maxCursorId) {
                    this.maxCursorId = maxCursor.getCursorId();
                }

                this.freeCursorList = _.without(this.freeCursorList, function(cur) {
                    return cur.getCursorId() >= this.maxCursorId;
                });
            } else {
                this.freeCursorList = [];
            }
        } else if (removeCursor.getCursorId() < this.maxCursorId) {
            this.freeCursorList.push(removeCursor);
        }
    },

    cursorAdded: function(tcur) {
        var cid = _.size(this.cursorList),
            testCursor = null;

        if ((cid <= this.maxCursorId) && (this.freeCursorList.length > 0)) {
            var closestCursor = this.freeCursorList[0];
            for (var i = 0, max = this.freeCursorList.length; i < max; i++) {
                testCursor = this.freeCursorList[i];
                if (testCursor.getDistanceToPoint(tcur) < closestCursor.getDistanceToPoint(tcur)) {
                    closestCursor = testCursor;
                }
            }
            cid = closestCursor.getCursorId();
            this.freeCursorList = _.without(this.freeCursorList, function(cur) {
                return cur.getCursorId() === cid;
            });
        } else {
            this.maxCursorId = cid;
        }

        var addCursor = new Tuio.Cursor({
            ttime: this.currentTime,
            si: tcur.getSessionId(),
            ci: cid,
            xp: tcur.getX(),
            yp: tcur.getY()
        });
        this.cursorList[addCursor.getSessionId()] = addCursor;

        this.trigger("addTuioCursor", addCursor);
    },

    cursorDefault: function(tcur) {
        var updateCursor = this.cursorList[tcur.getSessionId()];
        if (
            (tcur.getX() !== updateCursor.getX() && tcur.getXSpeed() === 0) ||
            (tcur.getY() !== updateCursor.getY() && tcur.getYSpeed() === 0)) {

            updateCursor.update({
                ttime: this.currentTime,
                xp: tcur.getX(),
                yp: tcur.getY()
            });
        } else {
            updateCursor.update({
                ttime: this.currentTime,
                xp: tcur.getX(),
                yp: tcur.getY(),
                xs: tcur.getXSpeed(),
                ys: tcur.getYSpeed(),
                ma: tcur.getMotionAccel()
            });
        }

        this.trigger("updateTuioCursor", updateCursor);
    }
});
}
// ----------------------------------------------------------------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------------------------------------------------------------
// ---------------- start tuio extension code
(function(ext) {
    // initialize tuio client ------------------------------------------------------------------------------------------
    if(typeof window.extensionWasLoaded == 'undefined') {
        // make sure intitilalization is done only once!
        window.extensionWasLoaded = true;

        // list of all tuio tuio objects that were updated, added or removed
        window.tuioObjects = [];

        // list of counters that holds for every symbol-id the update count
        // the counters are used to return false after the update-hat-block returned true two times.
        // Necessary for the continous execution of the update-hat-block's program stack.
        window.trueUpdateCount = [];

        // set specific ID's -------------------------------------------------------------------------------------------
        window.cursorID = 0;
        window.latestObjectID = 1000;

        // list of boolean values that denote whether an object with a certain symbol-id was removed
        window.remove = [];
        // list of boolean values that denote whether an object with a certain symbol-id was added
        window.add = [];

        // references the latest tuio-object. Needed for the 'latest Tuio Object' block.
        window.latestTuioObject = null;

        // the microseconds until an event expires (e.g. is not used any more)
        window.expiringMicroseconds = 50000;
        
        // init socket.io client on port 5000 --------------------------------------------------------------------------
        window.client = new Tuio.Client({
            host: "http://localhost:5000"
        }),
            // set the behavior of what should happen when a certain event occurs: -------------------------------------

            onAddTuioCursor = function(addCursor) {
                window.add[window.cursorID] = true;
                window.remove[window.cursorID] = null;
            },

            onUpdateTuioCursor = function(updateCursor) {
                window.tuioObjects[window.cursorID] = updateCursor;
            },

            onRemoveTuioCursor = function(removeCursor) {
                window.remove[window.cursorID] = removeCursor;              
            },

            onAddTuioObject = function(addObject) {
                window.add[addObject.symbolId] = true;
                window.remove[addObject.symbolId] = null;
                window.tuioObjects[addObject.symbolId] = addObject;
            },

            onUpdateTuioObject = function(updateObject) {
                window.tuioObjects[updateObject.symbolId] = updateObject;
                window.tuioObjects[-updateObject.sessionId] = updateObject;
                window.latestTuioObject = updateObject;
            },

            onRemoveTuioObject = function(removeObject) {
                window.remove[removeObject.symbolId] = removeObject;
                window.add[removeObject.symbolId] = null;
                window.tuioObjects[removeObject.symbolId] = null;
                window.tuioObjects[-removeObject.sessionId] = null;
            },

            onRefresh = function(time) {

            };

        // bind the defined behavior to the events: --------------------------------------------------------------
        window.client.on("addTuioCursor", onAddTuioCursor);
        window.client.on("updateTuioCursor", onUpdateTuioCursor);
        window.client.on("removeTuioCursor", onRemoveTuioCursor);
        window.client.on("addTuioObject", onAddTuioObject);
        window.client.on("updateTuioObject", onUpdateTuioObject);
        window.client.on("removeTuioObject", onRemoveTuioObject);
        window.client.on("refresh", onRefresh);

        // try to connect the client to the helper-application server:
        // if there is no connection possible, the event based socket.io client assures to reconnect as soon as
        // the server is available
        window.client.connect();

        // define helper functions that work on the input of the blocks ----------------------------------------
        window.checkID = function(id){
            return ((id == window.cursorID || (id > 0 && id <88)) &&(!isNaN(id) && (function(x) { return (x | 0) === x; })(parseFloat(id))));
        };

        // coordinate conversion from tuio to scratch coordinates.
        // @param: xCoordinate -> the x-coordinate value. It is a number between 0 and 1 (e.g. a procentage rate). 0 means total left, 1 means total right.
        // @result: the x value in scratch coordinates. A value between -240 (total left) and + 240 (total right)
        window.convertXToScratchCoordinate = function (xCoordinate) {
            return Math.round(-240.0 + 480.0 * xCoordinate);
        };
        // coordinate conversion from tuio to scratch coordinates.
        // @param: yCoordinate --> the y-coordinate value. It is a number between 0 and 1 (e.g. a procentage rate). 0 means top, 1 means bottom
        // @result: the y value in scratch coordinates. A value between +180 (top) and -180 (bottom)
        window.convertYToScratchCoordinate = function (yCoordinate) {
            return Math.round ( 180.0 - 360.0 * yCoordinate);
        };

    }
    // end client initialisation ---------------------------------------------------------------------------------------

    // begin definition of block behavior ------------------------------------------------------------------------------

    // this method defines the behavior of the update-event-hat-block. It is continuously executed by the scratch-flash-app, for every instantiated update-hat-block.
    // The update-event-block executes is command stack, if and only if the tuio object with the given symbolID is updated within the last 50 ms.
    // @param: id --> the symbolID of the object that should be checked for updates.
    ext.updateEventHatBlock = function (id){
        if (window.trueUpdateCount[id] > 1) {
            window.trueUpdateCount[id] = 0;
            return false;
        }
        var current = window.tuioObjects[id];
        if (typeof current == 'undefined' || current == null)
            return false;

        var sessionTime = Tuio.Time.getSessionTime();
        var currentTime = current.getTuioTime();
        var timeDifference = sessionTime.subtractTime(currentTime);
        var value = (timeDifference.getSeconds() == 0 && timeDifference.getMicroseconds() <= window.expiringMicroseconds);
        if (value) {
            if (window.trueUpdateCount[id]) {
                window.trueUpdateCount[id]++;
            }
            else {
                window.trueUpdateCount[id] = 1;
            }
        }
        return value;

    };

	// this method defines the behavior of the add-event-hat-block. It is continuously executed by the scratch-flash-app, for every instantiated add-hat-block.
    // @param: id --> the symbolID of the object that should be checked for addings.
    ext.addEventHatBlock = function(id){
        if(window.checkID(id) == true){
            if(window.add[id] ==true){
                window.add[id] =false;
                return true;
            }
            else
                return false;
        }
        else
            return false;
    };

    // this method defines the behavior of the remove-event-hat-block. It is continuously executed by the scratch-flash-app, for every instantiated remove-hat-block.
    // @param: id --> the symbolID of the object that should be checked for removals.
    ext.removeEventHatBlock = function(id){
    	  var current = window.remove[id];
          if (typeof current == 'undefined' || current == null)
        	  return false;
          var currentStatus = current.getTuioState();
        
          return currentStatus == Tuio.Container.TUIO_REMOVED;
    };

    // this method defines the behavior of the tuioObject block. It returns the id of the typed in integer value.
    // @param: id --> the typed in integer value
    ext.tuioObject = function(id){
        return id;
    };	
	
    // this method defines the behavior of the tuioObject SessionID block. It encodes the the typed in integer value by returning  
    // -id. This way, the blocks can distinguish between sessionID and SymboldID
    // @param: id --> the typed in integer value in the block
    ext.tuioObjectSessionID = function(id){
        return -id;
    };	
    
    // this method defines the behavior of the tuio-cursor block. It returns the cursor id.
    ext.tuioCursor = function() {
        return window.cursorID;
    };

    // the method defines the behavior of the tuio-attribute-block. Returns the value of the
    // given attribute with attribtueName and the tuio object with symbolID id, or the tuio-cursor, or the latest object id
    // @param: attributeName --> the name of the attribute that should be returned
    // @param: id --> the returned integer value of the block that is nested in the tuio-attribute-block. Should be a symboldID or 
    // the window.latestObjectID or the window.cursorID
    ext.getTuioAttribute = function(attributeName,id){
        var current;
        if(id == window.latestObjectID)
            current = window.latestTuioObject;
        else
            current = window.tuioObjects[id];
        if(typeof current !='undefined' && current !=null){
            switch(attributeName) {
				case menus[lang].objectAttributes [0]: // case PosX
					return window.convertXToScratchCoordinate(current.getX()) ; break;
                case menus[lang].objectAttributes [1]: // case PosY
					return window.convertYToScratchCoordinate(current.getY()); break;
                case menus[lang].objectAttributes [2]: return current.getAngleDegrees(); break;
                case menus[lang].objectAttributes [3]: return current.getMotionSpeed(); break;
                case menus[lang].objectAttributes [4]: return current.getMotionAccel(); break;
                case menus[lang].objectAttributes [5]: return current.getRotationSpeed(); break;
                case menus[lang].objectAttributes [6]: return current.getRotationAccel(); break;
                case menus[lang].objectAttributes [7]: return current.getXSpeed(); break;
                case menus[lang].objectAttributes [8]: return current.getYSpeed(); break;
                case menus[lang].objectAttributes [9]: return current.sessionId; break;
            }
        }
        else
            return 'ERROR: No object with '+ id + " on camera!";
    };
	
	
	// the method defines the behavior of the tuio-state block. It returns whether the tuio-object with symboldID 'id' is in the 
	// state 'state' or the TUIO-Cursor is in the state 'state'
	// @ param: id --> the returned integer value of the block that is nested in the tuio-attribute-block. Should be a symboldID or 
    // the window.latestObjectID or the window.cursorID
	// @param state --> the state that should be checked
	ext.getStateOfTuioObject = function(id, state) {
		var current;
		if(id == window.latestObjectID)
            current = window.latestTuioObject;
        else
            current = window.tuioObjects[id];
		if(typeof current !='undefined' && current !=null){
			var currentStatus = current.getTuioState();
			switch(state) {				
				case menus[lang].objectStates [0]: // case Moving
					return  ((currentStatus === Tuio.Object.TUIO_ACCELERATING) ||(currentStatus === Tuio.Object.TUIO_DECELERATING) ||(currentStatus === Tuio.Object.TUIO_ROTATING));  ; break;
				case menus[lang].objectStates [1]: // case Accelerating
					return currentStatus == Tuio.Object.TUIO_ACCELERATING; break;
				case menus[lang].objectStates [2]: // case Decelerating
					return currentStatus == Tuio.Object.TUIO_DECELERATING; break;
				case menus[lang].objectStates [3]: // case Rotating
					return currentStatus == Tuio.Object.TUIO_ROTATING; break;				
            }
        }
        else
            return 'ERROR: No object with '+ id + " on camera!";		
	};
	

    // this method defines the behavior of the 'updateOnAny'-hat-block. The hat block executes its command stack, if and only if
    // there was an update on any tuio object within the last 50 ms
    ext.updateOnAnyObject = function() {
        var id = window.latestObjectID;
        if(window.trueUpdateCount[id]  > 1){
            window.trueUpdateCount[id] = 0;
            return false;
        }
        var current = window.latestTuioObject;
        if(typeof current =='undefined' || current ==null)
            return false;

        var sessionTime =  Tuio.Time.getSessionTime();
        var currentTime = current.getTuioTime();
        var timeDifference = sessionTime.subtractTime(currentTime);
        var value = (timeDifference.getSeconds() ==0 && timeDifference.getMicroseconds() <=window.expiringMicroseconds);
        if(value){
            if(window.trueUpdateCount[id]) {
                window.trueUpdateCount[id]++;
            }
            else {
                window.trueUpdateCount[id] = 1;
            }
        }
        return value;
    };

    // this method defines the behavior of the 'latest tuio object' block. It returns the symbolID of the latest changed object.
    ext.getLatestTuioObject = function() {
        return window.latestObjectID;
    };

    // end block behavior definitions ----------------------------------------------------------------------------------

    // defined the shutdown behavior of the extension
    ext._shutdown = function() {
        window.client.socket.emit('Disconnect');
        window.client.onDisconnect();
        console.log('Shutting down...');
    };

    // standard answer
    ext._getStatus = function() {
        return {status: 2, msg: 'Ready'};
    };

	
	
	
	// find out language --> Check for GET param 'lang'
	  var paramString = window.location.search.replace(/^\?|\/$/g, '');
	  var vars = paramString.split("&");
	  var lang = 'de';
	  for (var i=0; i<vars.length; i++) {
		var pair = vars[i].split('=');
		if (pair.length > 1 && pair[0]=='lang')
		  lang = pair[1];
	  }

	var blocks = {
		en: [
            ['h','when %n updated','updateEventHatBlock',''],
            ['h','when %n added' ,'addEventHatBlock',''],
            ['h','when %n removed','removeEventHatBlock',''],
            ['h','when any tuio object updated','updateOnAnyObject',''],
            ['r','latest TUIO Object','getLatestTuioObject',''],
            ['r','TUIO-Object with symbolID %n','tuioObject',''],
            ['r','TUIO-Object with sessionID %n','tuioObjectSessionID',''],
            ['r','TUIO-Cursor', 'tuioCursor', ''],
            ['r','attribute %m.objectAttributes of %n','getTuioAttribute',''],
            ['b', 'Is %n %m.objectStates ?', 'getStateOfTuioObject' , '']
        ],
		de: [
			['h','falls %n ein Update erhält','updateEventHatBlock',''],
            ['h','falls %n hinzugefügt wird' ,'addEventHatBlock',''],
            ['h','falls %n entfernt wird','removeEventHatBlock',''],
            ['h','falls irgendein TUIO-Objekt geupdatet wird','updateOnAnyObject',''],
            ['r','zuletzt verändertes TUIO-Objekt ','getLatestTuioObject',''],
            ['r','TUIO-Objekt mit der Symbolummer %n','tuioObject',''],
            ['r','TUIO-Objekt mit der Sizungsnummer %n','tuioObjectSessionID',''],
            ['r','TUIO-Zeiger', 'tuioCursor', ''],
            ['r','Attribut %m.objectAttributes von %n','getTuioAttribute',''],
			['b', 'Ist %n %m.objectStates?', 'getStateOfTuioObject' , '']
		]		
	}
	
	var menus = {
		en: {
			objectAttributes: ['Position X', 'Position Y', 'Angle','Motion Speed', 'Motion Accel','Rotation Speed', 'Rotation Accel', 'xSpeed', 'ySpeed', 'sessionID'],
			objectStates: ['moving','accelerating','decelerating','rotating']
		},
		de: {
			objectAttributes: ['Position X', 'Position Y', 'Winkel','Bewegungsgeschwindigkeit', 'Bewegungsbeschleunigung','Drehgeschwindigkeit', 'Drehbeschleunigung', 'xGeschwindigkeit', 'yGeschwindigkeit','Sitzungsnummer'],
			objectStates: ['in Bewegung','am Beschleunigen','am Bremsen','am Drehen']
		}
	}
    // create descriptor for the Scratch flash app ---------------------------------------------------------------------
    var descriptor = {
        blocks: blocks[lang],
        menus: menus[lang]
    };

    // register the extension at the Scratch flash app -----------------------------------------------------------------
    ScratchExtensions.register('TUIO4Scratch', descriptor, ext);
})({});