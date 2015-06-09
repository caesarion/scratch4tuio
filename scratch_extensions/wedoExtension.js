// Scratch Extension to demonstrate some simple web browser functionality
// 2014 Shane M. Clements

(function(ext) {
/*    ScratchExtensions.loadExternalJS("scratch_extensions/browser_extension.js");
    ScratchExtensions.loadExternalJS("scratch_extensions/libs/jquery-1.7.2.js");
    ScratchExtensions.loadExternalJS("scratch_extensions/libs/lodash.js");
    ScratchExtensions.loadExternalJS("scratch_extensions/libs/socket.io.js");*/
   // ScratchExtensions.loadExternalJS("scratch_extensions/dist/Tuio.js");
    var client = new Tuio.Client({
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
            console.log("added "+addObject.symbolId);
        },

        onUpdateTuioObject = function(updateObject) {

            console.log("update on object: "+ updateObject.symbolId);
            console.log("with positions: "+ updateObject.xPos + ","+ updateObject.yPos);

        },

        onRemoveTuioObject = function(removeObject) {
            console.log(removeObject);
        },

        onRefresh = function(time) {
            console.log(time);
        };

    client.on("addTuioCursor", onAddTuioCursor);
    client.on("updateTuioCursor", onUpdateTuioCursor);
    client.on("removeTuioCursor", onRemoveTuioCursor);
    client.on("addTuioObject", onAddTuioObject);
    client.on("updateTuioObject", onUpdateTuioObject);
    client.on("removeTuioObject", onRemoveTuioObject);
    client.on("refresh", onRefresh);
    client.connect();


    ext.alert = function(message) {
        alert(message + c_browserExtension);
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

    var descriptor = {
        blocks: [
            [' ', 'alert %s', 'alert', ''],
            ['b', 'confirm %s', 'confirm', 'Are you sure?'],
            ['r', 'ask %s', 'ask', 'How are you?'],
            [' ', 'set window title to %s', 'setTitle', 'title'],
            [' ', 'open tab with %s', 'openTab', 'https://twitter.com/scratchteam']
        ]
    };

    ScratchExtensions.register('Browser Stuff', descriptor, ext);
})({});

