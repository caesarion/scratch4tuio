// Scratch Extension to demonstrate some simple web browser functionality
// 2014 Shane M. Clements




(function(ext) {
    /* window.ScratchExtensions.loadExternalJS('scratch_extensions/libs/lodash.js');
     window.ScratchExtensions.loadExternalJS('scratch_extensions/libs/socket.io.js');
     window.ScratchExtensions.loadExternalJS('scratch_extensions/dist/Tuio.js');*/




    if(typeof window.extensionWasLoaded == 'undefined') {
        window.extensionWasLoaded = true;
        console.log("FIRST LOAD");
        // initialize tuio client
        window.tuioObjects = [];
        window.cursorID = -1;
        window.update = [];
        window.remove = [];
        window.add = [];
        window.updateNumber = 0;
        window.updateConsumedNumber=0;
        window.client = new Tuio.Client({
            host: "http://localhost:5000"
        }),

            onAddTuioCursor = function(addCursor) {
                window.add[window.cursorID] = true;
            },

            onUpdateTuioCursor = function(updateCursor) {
                window.update[window.cursorID] = true;
            },

            onRemoveTuioCursor = function(removeCursor) {
                window.remove[window.cursorID] = true;
            },

            onAddTuioObject = function(addObject) {
                window.add[addObject.symbolId] = true;
                window.tuioObjects[addObject.symbolId] = addObject;

            },

            onUpdateTuioObject = function(updateObject) {
                window.tuioObjects[updateObject.symbolId] = updateObject;
                window.update[updateObject.symbolId] = true;
                window.updateNumber++;
                console.log("updateNumber: "+ window.updateNumber);

            },

            onRemoveTuioObject = function(removeObject) {
                window.remove[removeObject.symbolId] = true;
                window.tuioObjects[removeObject.symbolId] = null;
            },

            onRefresh = function(time) {

            };

        window.client.on("addTuioCursor", onAddTuioCursor);
        window.client.on("updateTuioCursor", onUpdateTuioCursor);
        window.client.on("removeTuioCursor", onRemoveTuioCursor);
        window.client.on("addTuioObject", onAddTuioObject);
        window.client.on("updateTuioObject", onUpdateTuioObject);
        window.client.on("removeTuioObject", onRemoveTuioObject);
        window.client.on("refresh", onRefresh);
        window.client.connect();
        window.checkID = function(id){
            return ((id == window.cursorID || (id > 0 && id <88)) &&(!isNaN(id) && (function(x) { return (x | 0) === x; })(parseFloat(id))));
        };

        window.convertXToScratchCoordinate = function (coordinate) {
            return Math.round(-240.0 + 480.0 * coordinate);
        };

        window.convertYToScratchCoordinate = function (coordinate) {
            return Math.round ( 180.0 - 360.0 * coordinate);
        };

        // test/debug functions:
        window.numberOfExecutions = 0;
        window.numberOfExecutionsHatBlock = 0;

    }
    else
        console.log("RELOAD");

    // define block behavior

    window.trueUpdateCount = [];
    window.flip = [];
    ext.updateEventHatBlock = function (id){
        // check if id is correct
        var correctID = window.checkID(id);
        if(!correctID){
            var errmsg = "ID is not valid" + id;
            console.error(errmsg);
            return false;
        }
        if(window.flip[id] == true) {
            window.flip[id] = false;
            return true;
        }
        if(window.trueUpdateCount[id]  > 1){
            window.trueUpdateCount[id] = 0;
            window.flip[id] = true;
            return false;
        }
        var current = window.tuioObjects[id];
        if(typeof current !='undefined' && current !=null){
            var sessionTime =  Tuio.Time.getSessionTime();
            var currentTime = current.getTuioTime();
            var timeDifference = Tuio.Time.getSessionTime().subtractTime(current.getTuioTime());
            var value = (timeDifference.getSeconds() ==0 && timeDifference.getMicroseconds() <=100000);
            if(value) {
                window.numberOfExecutionsHatBlock++;
                console.log("Number of HatBlock Executions: " +  window.numberOfExecutionsHatBlock);
            }
            if(value){
                if(window.trueUpdateCount[id]) {
                    window.trueUpdateCount[id]++;
                }
                else {
                    window.trueUpdateCount[id] = 1;
                }
            }
            return value;
        }
        else
        {
            return false;
        }
        /*  if(window.update[id] == true )
         {
         window.updateConsumedNumber++;
         console.log("updateConsumeNumber: "+ window.updateConsumedNumber);
         window.update[id] =false;
         return true;
         }
         else
         return false;*/
    };

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

    ext.removeEventHatBlock = function(id){
        if(window.checkID(id) == true){
            if(window.remove[id] ==true){
                window.remove[id] =false;
                return true;
            }
            else
                return false;
        }
        else
            return false;
    };

    ext._shutdown = function() {
        window.client.socket.emit('Disconnect');
        window.client.onDisconnect();
        //ext = null;
        console.log('Shutting down...');
    };

    ext._getStatus = function() {
        return {status: 2, msg: 'Ready'};
    };
    ext.tuioObject = function(id){
        return id;
    };
    ext.tuioCursor = function() {
        return window.cursorID;
    };

    ext.getTuioAttribute = function(attributeName,id){
        window.numberOfExecutions++;
        console.log("ExecutionCountOfAttributeBlock: "+ window.numberOfExecutions);
        var current = window.tuioObjects[id];
        if(typeof current !='undefined' && current !=null){
            switch(attributeName) {
                case 'Position X':

                    return window.convertXToScratchCoordinate(current.getX()) ; break;
                case 'Position Y':

                    return window.convertYToScratchCoordinate(current.getY()); break;
                case 'Speed': return current.getMotionSpeed(); break;
            }
        }
        else
            return 'ERROR: No object with '+ id + " on camera!";
    };


    var descriptor = {
        blocks: [
            ['h','update on %n','updateEventHatBlock',''],
            ['h','%n added' ,'addEventHatBlock',''],
            ['h','%n removed','removeEventHatBlock',''],
            ['r','Tuio-Object with ID %n','tuioObject','1'],
            ['r','Tuio-Cursor', 'tuioCursor', ''],
            ['r','attribute %m.objectAttributes of %n','getTuioAttribute','']
        ],
        menus: {
            objectAttributes: ['Position X', 'Position Y', 'Speed']
        }
    };

    ScratchExtensions.register('TuioExtension', descriptor, ext);
})({});

