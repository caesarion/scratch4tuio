// Scratch Extension to demonstrate some simple web browser functionality
// 2014 Shane M. Clements

(function(ext) {
/*    ScratchExtensions.loadExternalJS("scratch_extensions/browser_extension.js");
    ScratchExtensions.loadExternalJS("scratch_extensions/libs/jquery-1.7.2.js");
    ScratchExtensions.loadExternalJS("scratch_extensions/libs/lodash.js");
    ScratchExtensions.loadExternalJS("scratch_extensions/libs/socket.io.js");*/
   // ScratchExtensions.loadExternalJS("scratch_extensions/dist/Tuio.js");

    ext.tuioObjects = [];
    ext.currentObject = null;
    ext.update = false;
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
            ext.update = true;
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


    ext.alert = function(message) {
        alert(message );
    };

    ext.confirm = function(question) {
        return confirm(question);
    };

    ext.ask = function(question) {
        return prompt(question);
    };

    ext.setTitle = function(title) {
        window.document.title = title;
    };

    ext.openTab = function(location) {
        window.open(location, '_blank');
    };

    ext._shutdown = function() {

        console.log('Shutting down...');
    };

    ext._getStatus = function() {
        return {status: 2, msg: 'Ready'};
    };

    ext.hatBlockObjectID = function (id){
        //console.log("update: "+ext.update+", "+ )
        if(ext.update == true && ext.currentObject !=null)
        {
            if(ext.currentObject.symbolId ==id)
            {
                ext.currentObject = null;
                ext.update =false;
                return true;
            }
            else
                return false;
        }
        else
            return false;
    };
    var descriptor = {
        blocks: [
            ['h','update on object %n','hatBlockObjectID','-1'],
            [' ', 'alert %s', 'alert', ''],
            ['b', 'confirm %s', 'confirm', 'Are you sure?'],
            ['r', 'ask %s', 'ask', 'How are you?'],
            [' ', 'set window title to %s', 'setTitle', 'title'],
            [' ', 'open tab with %s', 'openTab', 'https://twitter.com/scratchteam']
        ]
    };

    ScratchExtensions.register('Browser Stuff', descriptor, ext);
})({});

