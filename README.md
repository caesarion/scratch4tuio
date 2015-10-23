# Scratch4TuioExtension

This is a scratch extension for tuio. The extension enables Scratch to receive
TUIO messages and react to TUIO events . This way, the Scratch-programmer is
able to not only create its own Tangible User Interface, but also to create
interfaces using Kinect or Mobile Phones and interfaces that can track objects.
Users of Scratch4TUIO can use the new blocks to react to TUIO-events such as a
moving cursor or a moving object. Furthermore, they can access information about
the objects such as the symbolID, sessionID, movement speed, movement
acceleration, position, angle, turning speed, and turning acceleration. So
technically Scratch4TUIO transforms Scratch into a TUIO-Client. You can start
Scratch4TUIO by just following this link:
<http://scratchx.org/?url=http://caesarion.github.io/Scratch4TuioExtension/scratch4TUIOExtension.js#scratch>.
It basically opens Scratch with the Scratch4TUIO extension already loaded. On
the 'More Blocks' category you can now find the additional Scratch4TUIO
blocks.

Scratch4TUIO uses an OSC-Dispatcher program that relays the incoming TUIO
messages, which are sent via the UDP protocol, to Scratch4TUIO via Socket.io.
You can download the jar here:
<https://github.com/caesarion/Scratch4TuioExtension/releases/tag/1.0>

Start the OSC-Dispatcher from console via

```bash
java -jar OSC-Dispatcher.jar -p 3333
```

The -p option denotes the port on which the TUIO-Server runs, 3333 is the
standard port for TUIO. The OSC-Dispatcher and Scratch4TUIO use port
5000.

Now you still need a TUIO-Server, e.g. a provider of TUIO-data. You can use one
of the listed TUIO-Server below. For the start I recommend to use the
TUIO-Simulator: <http://sourceforge.net/projects/reactivision/files/TUIO%201.0/TUIO-Clients%201.4/TUIO_Simulator-1.4.zip/download?use_mirror=heanet&download=>

For more information about the TUIO protocol see <http://www.tuio.org/>

Some projects using TUIO and TUIO-Server: <www.reactable.com>, <https://code.google.com/p/tuiokinect/>, <http://www.tuio.org/?software>, <www.reactivision.com>

## Building the extension

To build the extension you need to install [npm](https://www.npmjs.com/) (via
[Node.js](https://nodejs.org/en/download/)) and [Grunt](http://gruntjs.com/installing-grunt).

First install the dependencies by running

```bash
npm install
```

then start the build with

```bash
grunt
```
