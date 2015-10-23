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
		// compare the times of the received Update with the current time
        var sessionTime = Tuio.Time.getSessionTime();
        var currentTime = current.getTuioTime();
        var timeDifference = sessionTime.subtractTime(currentTime);
        var value = (timeDifference.getSeconds() == 0 && timeDifference.getMicroseconds() <= window.expiringMicroseconds);
        if (value) {
			// this mechanism is necessary due to the fact that hat blocks only fire when an up flank is received.
			// This mechanism creates this flank
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
		// decode the id
        if(id == window.latestObjectID)
            current = window.latestTuioObject;
        else
            current = window.tuioObjects[id];
        if(typeof current !='undefined' && current !=null){
			// switch between the selecte menu entry and return accordinglys
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
		// decode the id
		if(id == window.latestObjectID)
            current = window.latestTuioObject;
        else
            current = window.tuioObjects[id];
		if(typeof current !='undefined' && current !=null){
			var currentStatus = current.getTuioState();
			switch(state) {
				// switch between the selecte menu entry and return accordinglys
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
		// compare the times of the received Update with the current time
        var sessionTime =  Tuio.Time.getSessionTime();
        var currentTime = current.getTuioTime();
        var timeDifference = sessionTime.subtractTime(currentTime);
        var value = (timeDifference.getSeconds() ==0 && timeDifference.getMicroseconds() <=window.expiringMicroseconds);
        if(value){
			// this mechanism is necessary due to the fact that hat blocks only fire when an up flank is received.
			// This mechanism creates this flank
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
	 // default langugage, in case the language check fails.
	 var lang = 'en';
	  for (var i=0; i<vars.length; i++) {
		var pair = vars[i].split('=');
		if (pair.length > 1 && pair[0]=='lang')
		  lang = pair[1];
	  }
	// the block definitions in english and german
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
            ['r','TUIO-Objekt mit der Symbolnummer %n','tuioObject',''],
            ['r','TUIO-Objekt mit der Sitzungsnummer %n','tuioObjectSessionID',''],
            ['r','TUIO-Zeiger', 'tuioCursor', ''],
            ['r','Attribut %m.objectAttributes von %n','getTuioAttribute',''],
			['b', 'Ist %n %m.objectStates?', 'getStateOfTuioObject' , '']
		]
	}
	// the menus in english and german
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
