// Scratch Extension to demonstrate some simple web browser functionality
// 2014 Shane M. Clements




(function(ext) {
    /* window.ScratchExtensions.loadExternalJS('scratch_extensions/libs/lodash.js');
     window.ScratchExtensions.loadExternalJS('scratch_extensions/libs/socket.io.js');
     window.ScratchExtensions.loadExternalJS('scratch_extensions/dist/Tuio.js');*/
    ext.checkID = function(id){
        return ((id == ext.cursorID || (id > 0 && id <88)) &&(!isNaN(id) && (function(x) { return (x | 0) === x; })(parseFloat(id))));
    };
    // initialize tuio client
    ext.tuioObjects = [];
    ext.cursorID = -1;
    ext.currentObject = null;
    ext.update = [];
    ext.remove = [];
    ext.add = [];
    ext.client = new Tuio.Client({
        host: "http://localhost:5000"
    }),

        onAddTuioCursor = function(addCursor) {
            ext.add[ext.cursorID] = true;
        },

        onUpdateTuioCursor = function(updateCursor) {
            ext.update[ext.cursorID] = true;
        },

        onRemoveTuioCursor = function(removeCursor) {
            ext.remove[ext.cursorID] = true;
        },

        onAddTuioObject = function(addObject) {
            ext.add[addObject.symbolId] = true;
            ext.tuioObjects[addObject.symbolId] = addObject;
        },

        onUpdateTuioObject = function(updateObject) {
            ext.tuioObjects[updateObject.symbolId] = updateObject;
            ext.update[updateObject.symbolId] = true;
            ext.currentObject = updateObject;
        },

        onRemoveTuioObject = function(removeObject) {
            ext.remove[removeObject.symbolId] = true;
            ext.tuioObjects[removeObject.symbolId] = null;
        },

        onRefresh = function(time) {
            //console.log(time);
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

    ext.updateEventHatBlock = function (id){
        // check if id is correct
        var correctID = ext.checkID(id);
        if(!correctID){
            var errmsg = "ID is not valid";
           // alert(errmsg);
            console.error(errmsg);
            return false;
        }
        if(ext.update[id] == true )
        {
            if(ext.currentObject !=null){
                if(id == ext.cursorID ) {
                    var errmsg = "update on object but no object set!!";
                    alert(errmsg);
                    console.error(errmsg);
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
                if(id != ext.cursorID ) {
                    var errmsg = "cursor update must have id = "+ ext.cursorID+ "!";
                    alert(errmsg);
                    console.error(errmsg);
                    return false;
                }
                ext.update[id] =false;
                return true;
            }
        }
        else
            return false;
    };

    ext.addEventHatBlock = function(id){
        if(ext.checkID(id) == true){
            if(ext.add[id] ==true){
                ext.add[id] =false;
                return true;
            }
            else
                return false;
        }
        else
            return false;
    };

    ext.removeEventHatBlock = function(id){
      if(ext.checkID(id) == true){
          if(ext.remove[id] ==true){
            ext.remove[id] =false;
              return true;
          }
          else
              return false;
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
    };
    ext.tuioCursor = function() {
        return ext.cursorID;
    };

    ext.getTuioAttribute = function(attributeName,id){

        var current = ext.tuioObjects[id];
        if(typeof current !='undefined' && current !=null){
            switch(attributeName) {
                case 'Position X': return current.getX() ; break;
                case 'Position Y': return current.getY(); break;
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

