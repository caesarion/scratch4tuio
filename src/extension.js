var Tuio = require('./tuio.js');

module.exports = (function() { 'use strict';
    // initialize tuio client ------------------------------------------------------------------------------------------

    // list of all tuio tuio objects that were updated, added or removed
    var tuioObjects = {};

    // list of counters that holds for every symbol-id the update count
    // the counters are used to return false after the update-hat-block returned true two times.
    // Necessary for the continous execution of the update-hat-block's program stack.
    var trueUpdateCount = {};

    // set specific ID's -------------------------------------------------------------------------------------------
    var cursorID = 'cursor';
    var latestObjectID = 'latest';
    var symbolIdPrefix = 'symbol:';
    var sessionIdPrefix = 'session:';

    // list of boolean values that denote whether an object with a certain symbol-id was removed
    var remove = {};
    // list of boolean values that denote whether an object with a certain symbol-id was added
    var add = {};

    // references the latest tuio-object. Needed for the 'latest Tuio Object' block.
    var latestTuioObject = null;

    // the microseconds until an event expires (e.g. is not used any more)
    var expiringMicroseconds = 50000;

    // init socket.io client on port 5000 --------------------------------------------------------------------------
    var client = new Tuio.Client({
        host: 'http://localhost:5000'
    });

    // set the behavior of what should happen when a certain event occurs: -------------------------------------

    var onAddTuioCursor = function(/*addCursor*/) {
        add[cursorID] = true;
        remove[cursorID] = null;
    };

    var onUpdateTuioCursor = function(updateCursor) {
        tuioObjects[cursorID] = updateCursor;
    };

    var onRemoveTuioCursor = function(removeCursor) {
        remove[cursorID] = removeCursor;
    };

    var onAddTuioObject = function(addObject) {
        var symID = encodeID(addObject.symbolId, 'sym');

        add[symID] = true;
        remove[symID] = null;
        tuioObjects[symID] = addObject;
    };

    var onUpdateTuioObject = function(updateObject) {
        var symID = encodeID(updateObject.symbolId, 'sym');
        var sessID = encodeID(updateObject.symbolId, 'sess');

        tuioObjects[symID] = updateObject;
        tuioObjects[sessID] = updateObject;
        latestTuioObject = updateObject;
    };

    var onRemoveTuioObject = function(removeObject) {
        var symID = encodeID(removeObject.symbolId, 'sym');
        var sessID = encodeID(removeObject.symbolId, 'sess');

        remove[symID] = removeObject;
        add[symID] = null;
        tuioObjects[symID] = null;
        tuioObjects[sessID] = null;
    };

    var onRefresh = function(/*time*/) {
    };

    // bind the defined behavior to the events: --------------------------------------------------------------
    client.on('addTuioCursor', onAddTuioCursor);
    client.on('updateTuioCursor', onUpdateTuioCursor);
    client.on('removeTuioCursor', onRemoveTuioCursor);
    client.on('addTuioObject', onAddTuioObject);
    client.on('updateTuioObject', onUpdateTuioObject);
    client.on('removeTuioObject', onRemoveTuioObject);
    client.on('refresh', onRefresh);

    // try to connect the client to the helper-application server:
    // if there is no connection possible, the event based socket.io client assures to reconnect as soon as
    // the server is available
    client.connect();
    // end client initialisation ---------------------------------------------------------------------------------------

    // define helper functions that work on the input of the blocks ----------------------------------------
    var encodeID = function(id, type) {
        switch (type) {
            case 'sess':
            case 'session':
                return sessionIdPrefix + id;
            case 'sym':
            case 'symbol':
                return symbolIdPrefix + id;
            default:
                return -1;
        }
    };

    // var decodeID = function(id) {
    //     if (id.substr(0, sessionIdPrefix.length) === sessionIdPrefix) {
    //         return id.substr(sessionIdPrefix.length);
    //     } else if (id.substr(0, symbolIdPrefix.length) === symbolIdPrefix) {
    //         return id.substr(symbolIdPrefix.length);
    //     } else {
    //         return -1;
    //     }
    // };

    var reID = new RegExp('(' + cursorID + '|' + latestObjectID + '|' +
            sessionIdPrefix + '\\d+|' + symbolIdPrefix + '\\d+)');
    var checkID = function(id) {
        return reID.test(id);
    };

    var checkSymID = function(id) {
        return ((id == cursorID || (id > 0 && id < 88)) &&
                (!isNaN(id) && (function(x) {
            return (x | 0) === x;
        })(parseFloat(id))));
    };

    // var reScID = new RegExp('(' + cursorID + '|' + latestObjectID + '|' +
    //         sessionIdPrefix + '\\d+|' + symbolIdPrefix + '\\d+)');
    // var checkScratchID = function(id) {
    //     return reScID.test(id);
    // };

    // coordinate conversion from tuio to scratch coordinates.
    // @param: xCoordinate -> the x-coordinate value. It is a number between 0 and 1 (e.g. a procentage rate). 0 means total left, 1 means total right.
    // @result: the x value in scratch coordinates. A value between -240 (total left) and + 240 (total right)
    var convertXToScratchCoordinate = function(xCoordinate) {
        return Math.round(-240.0 + 480.0 * xCoordinate);
    };
    // coordinate conversion from tuio to scratch coordinates.
    // @param: yCoordinate --> the y-coordinate value. It is a number between 0 and 1 (e.g. a procentage rate). 0 means top, 1 means bottom
    // @result: the y value in scratch coordinates. A value between +180 (top) and -180 (bottom)
    var convertYToScratchCoordinate = function(yCoordinate) {
        return Math.round(180.0 - 360.0 * yCoordinate);
    };

    return {
        // begin definition of block behavior ------------------------------------------------------------------------------

        // this method defines the behavior of the update-event-hat-block. It is continuously executed by the scratch-flash-app, for every instantiated update-hat-block.
        // The update-event-block executes is command stack, if and only if the tuio object with the given symbolID is updated within the last 50 ms.
        // @param: id --> the symbolID of the object that should be checked for updates.
        updateEventHatBlock: function(id) {
            if (trueUpdateCount[id] > 1) {
                trueUpdateCount[id] = 0;
                return false;
            }
            var current = tuioObjects[id];
            if (typeof current == 'undefined' || current == null) {
                return false;
            }
            // compare the times of the received Update with the current time
            var sessionTime = Tuio.Time.getSessionTime();
            var currentTime = current.getTuioTime();
            var timeDiff = sessionTime.subtractTime(currentTime);
            var value = (timeDiff.getSeconds() === 0 &&
                    timeDiff.getMicroseconds() <= expiringMicroseconds);
            if (value) {
                // this mechanism is necessary due to the fact that hat blocks only fire when an up flank is received.
                // This mechanism creates this flank
                if (trueUpdateCount[id]) {
                    trueUpdateCount[id]++;
                } else {
                    trueUpdateCount[id] = 1;
                }
            }
            return value;

        },

        // this method defines the behavior of the add-event-hat-block. It is continuously executed by the scratch-flash-app, for every instantiated add-hat-block.
        // @param: id --> the symbolID of the object that should be checked for addings.
        addEventHatBlock: function(id) {
            if (checkID(id) === true) {
                if (add[id] === true) {
                    add[id] = false;
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        },

        // this method defines the behavior of the remove-event-hat-block. It is continuously executed by the scratch-flash-app, for every instantiated remove-hat-block.
        // @param: id --> the symbolID of the object that should be checked for removals.
        removeEventHatBlock: function(id) {
            var current = remove[id];
            if (typeof current == 'undefined' || current == null) {
                return false;
            }
            var currentStatus = current.getTuioState();

            return currentStatus == Tuio.Container.TUIO_REMOVED;
        },

        // this method defines the behavior of the tuioObject block. It returns the id of the typed in integer value.
        // @param: id --> the typed in integer value
        tuioObject: function(id) {
            return encodeID(id, 'sym');
        },

        // this method defines the behavior of the tuioObject SessionID block. It encodes the the typed in integer value by returning
        // -id. This way, the blocks can distinguish between sessionID and SymboldID
        // @param: id --> the typed in integer value in the block
        tuioObjectSessionID: function(id) {
            return encodeID(id, 'sess');
        },

        // this method defines the behavior of the tuio-cursor block. It returns the cursor id.
        tuioCursor: function() {
            return cursorID;
        },

        // this method defines the behavior of the 'latest tuio object' block. It returns the symbolID of the latest changed object.
        getLatestTuioObject: function() {
            return latestObjectID;
        },

        // the method defines the behavior of the tuio-attribute-block. Returns the value of the
        // given attribute with attribtueName and the tuio object with symbolID id, or the tuio-cursor, or the latest object id
        // @param: attributeName --> the name of the attribute that should be returned
        // @param: id --> the returned integer value of the block that is nested in the tuio-attribute-block. Should be a symboldID or
        // the var latestObjectID or the var cursorID
        getTuioAttribute: function(attributeName, id) {
            var current;
            // decode the id
            if (id == latestObjectID) {
                current = latestTuioObject;
            } else {
                current = tuioObjects[id];
            }

            var menus = this.descriptor.menus;
            if (typeof current != 'undefined' && current != null) {
                // switch between the selecte menu entry and return accordingly
                switch (attributeName) {
                    case menus.objectAttributes[0]: // Posiion X
                        return convertXToScratchCoordinate(current
                                .getX());
                    case menus.objectAttributes[1]: // Posiion Y
                        return convertYToScratchCoordinate(current
                                .getY());
                    case menus.objectAttributes[2]: // Angle
                        return current.getAngleDegrees();
                    case menus.objectAttributes[3]: // Motion Speed
                        return current.getMotionSpeed();
                    case menus.objectAttributes[4]: // Motion Accel
                        return current.getMotionAccel();
                    case menus.objectAttributes[5]: // Rotation Speed
                        return current.getRotationSpeed();
                    case menus.objectAttributes[6]: // Rotation Accel
                        return current.getRotationAccel();
                    case menus.objectAttributes[7]: // xSpeed
                        return current.getXSpeed();
                    case menus.objectAttributes[8]: // ySpeed
                        return current.getYSpeed();
                    case menus.objectAttributes[9]: // symbolID
                        return current.symbolId;
                    case menus.objectAttributes[10]: // sessionID
                        return current.sessionId;
                    case menus.objectAttributes[11]: // scratchID
                        if (id === latestObjectID) {
                            if (checkSymID(latestTuioObject.symbolId)) {
                                return encodeID(latestTuioObject.symbolId,
                                        'sym');
                            } else {
                                return encodeID(latestTuioObject.sessionId,
                                        'sess');
                            }
                        } else {
                            return id;
                        }
                }
            } else {
                return 'ERROR: No object with ' + id + ' on camera!';
            }
        },

        // the method defines the behavior of the tuio-state block. It returns whether the tuio-object with symboldID 'id' is in the
        // state 'state' or the TUIO-Cursor is in the state 'state'
        // @ param: id --> the returned integer value of the block that is nested in the tuio-attribute-block. Should be a symboldID or
        // the var latestObjectID or the var cursorID
        // @param state --> the state that should be checked
        getStateOfTuioObject: function(id, state) {
            var current;
            // decode the id
            if (id == latestObjectID) {
                current = latestTuioObject;
            } else {
                current = tuioObjects[id];
            }
            if (typeof current != 'undefined' && current != null) {
                var menus = this.descriptor.menus;
                var currentStatus = current.getTuioState();
                switch (state) {
                    // switch between the selecte menu entry and return accordinglys
                    case menus.objectStates[0]: // case Moving
                        return (
                            (currentStatus === Tuio.Object.TUIO_ACCELERATING) ||
                            (currentStatus === Tuio.Object.TUIO_DECELERATING) ||
                            (currentStatus === Tuio.Object.TUIO_ROTATING));
                    case menus.objectStates[1]: // case Accelerating
                        return currentStatus == Tuio.Object.TUIO_ACCELERATING;
                    case menus.objectStates[2]: // case Decelerating
                        return currentStatus == Tuio.Object.TUIO_DECELERATING;
                    case menus.objectStates[3]: // case Rotating
                        return currentStatus == Tuio.Object.TUIO_ROTATING;
                }
            } else {
                return 'ERROR: No object with ' + id + ' on camera!';
            }
        },

        // this method defines the behavior of the 'updateOnAny'-hat-block. The hat block executes its command stack, if and only if
        // there was an update on any tuio object within the last 50 ms
        updateOnAnyObject: function() {
            var id = latestObjectID;
            if (trueUpdateCount[id] > 1) {
                trueUpdateCount[id] = 0;
                return false;
            }
            var current = latestTuioObject;
            if (typeof current == 'undefined' || current == null) {
                return false;
            }
            // compare the times of the received Update with the current time
            var sessionTime = Tuio.Time.getSessionTime();
            var currentTime = current.getTuioTime();
            var timeDiff = sessionTime.subtractTime(currentTime);
            var value = (timeDiff.getSeconds() === 0 &&
                    timeDiff.getMicroseconds() <= expiringMicroseconds);
            if (value) {
                // this mechanism is necessary due to the fact that hat blocks only fire when an up flank is received.
                // This mechanism creates this flank
                if (trueUpdateCount[id]) {
                    trueUpdateCount[id]++;
                } else {
                    trueUpdateCount[id] = 1;
                }
            }
            return value;
        },

        // end block behavior definitions ----------------------------------------------------------------------------------

        // defined the shutdown behavior of the extension
        _shutdown: function() {
            client.socket.emit('Disconnect');
            client.onDisconnect();
            console.log('Shutting down...');
        },

        // standard answer
        _getStatus: function() {
            return {
                status: 2,
                msg: 'Ready'
            };
        }
    };
})();
