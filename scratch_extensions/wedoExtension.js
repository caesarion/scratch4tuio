// Scratch Extension to demonstrate some simple web browser functionality
// 2014 Shane M. Clements




(function(ext) {
    /* window.ScratchExtensions.loadExternalJS('scratch_extensions/libs/lodash.js');
     window.ScratchExtensions.loadExternalJS('scratch_extensions/libs/socket.io.js');
     window.ScratchExtensions.loadExternalJS('scratch_extensions/dist/Tuio.js');*/

    // initialize tuio client
    ext.tuioObjects = [];

    ext.currentObject = null;
    ext.update = [];

    ext.client = new Tuio.Client({
        host: "http://localhost:5000"
    }),

        onAddTuioCursor = function(addCursor) {
            console.log(addCursor);
        },

        onUpdateTuioCursor = function(updateCursor) {
            console.log(updateCursor);

        },

        onRemoveTuioCursor = function(removeCursor) {
            console.log(removeCursor);
        },

        onAddTuioObject = function(addObject) {
            ext.tuioObjects[addObject.sessionId] = addObject;
            console.log("added "+addObject.symbolId);
        },

        onUpdateTuioObject = function(updateObject) {
            ext.tuioObjects[updateObject.sessionId] = updateObject;
            console.log("update on object: "+ updateObject.symbolId);
            ext.update[updateObject.symbolId] = true;
            ext.currentObject = updateObject;
            console.log("with positions: "+ updateObject.xPos + ","+ updateObject.yPos);

        },

        onRemoveTuioObject = function(removeObject) {
            ext.tuioObjects[removeObject.sessionId] = null;
            console.log(removeObject);
        },

        onRefresh = function(time) {
            console.log(time);
        };

    ext.client.on("addTuioCursor", onAddTuioCursor);
    ext.client.on("updateTuioCursor", onUpdateTuioCursor);
    ext.client.on("removeTuioCursor", onRemoveTuioCursor);
    ext.client.on("addTuioObject", onAddTuioObject);
    ext.client.on("updateTuioObject", onUpdateTuioObject);
    ext.client.on("removeTuioObject", onRemoveTuioObject);
    ext.client.on("refresh", onRefresh);
    ext.client.connect();

    // define block behavior


    ext.setTitle = function(title) {
        window.document.title = title;
    };

    ext.updateHatBlock = function (id){
        //console.log("update: "+ext.update+", "+ )


        // check if id is correct
        if(!((id == -1 || (id > 0 && id <88)) &&(!isNaN(id) && (function(x) { return (x | 0) === x; })(parseFloat(id)))) )
        {
            alert(id +" is not an valid id!" );
            return false;
        }
        if(ext.update[id] == true )
        {
            if(ext.currentObject !=null){
                if(id == -1 ) {
                    console.error("update on object but no object set!!");
                    return false;
                }
                if(ext.currentObject.symbolId ==id)
                {
                    ext.currentObject = null;
                    ext.update[id] =false;
                    return true;
                }
                else
                    return false;
            }
            else{
                if(id != -1 ) {
                    console.error("cursor update must have id = -1!");
                    return false;
                }
                ext.update[id] =false;
                return true;
            }
        }
        else
            return false;
    };
    ext._shutdown = function() {

        console.log('Shutting down...');
    };

    ext._getStatus = function() {
        return {status: 2, msg: 'Ready'};
    };
    ext.tuioObject = function(id){
        return id;
    }
    ext.tuioCursor = function() {
        return -1;
    }
    var descriptor = {
        blocks: [
            ['h','update on %n','updateHatBlock',''],
            ['r','TuioObject with ID %n','tuioObject','1'],
            // ['b', 'Stringblock','rotz',''],
            ['r','TuioCursor', 'tuioCursor', '']
        ]
    };

    ScratchExtensions.register('TuioExtension', descriptor, ext);
})({});

