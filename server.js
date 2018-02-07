var http    = require('http');
var express = require('express');
var net     = require('net');
var fs      = require('fs');
var dblite  = require('dblite');
var CronJob = require('cron').CronJob;
var Type    = require('./public/types');
var log4js  = require('log4js');
var exec    = require('child_process').exec;
var cloudApp = require('./cloud/cloudManager');
var astronomic = require('./tools/astronomic/astro_module');

var port = process.env.PORT || 7999;
var clientSockAddr     = __dirname + "/socket/write.sock";
var serverSockAddr     = __dirname + "/socket/read.sock";
var sockClient         = null;

var app = express();
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

/* Start HTTP Server */
var server = http.createServer(app).listen(port, function() {
    logger.info("HTTP Server listening to %d within %s environment",
          port, app.get('env'));
});

var io = require("socket.io")(server);

/* Init logger */
log4js.configure({
    appenders: [
        { type: 'console' },
        { type: 'file', filename: 'logs/server.log', category: 'server', 'maxLogSize': 250 * 1024 }
    ]
});
var logger = log4js.getLogger('server');
logger.setLevel('TRACE');
logger.trace("Server is starting...");

/* Init DB */
db = dblite('database/datastore.db');
db.query('CREATE TABLE IF NOT EXISTS sprinklertimerstore (id INTEGER PRIMARY KEY, value TEXT)');
db.query('CREATE TABLE IF NOT EXISTS lamptimerstore (id INTEGER PRIMARY KEY, value TEXT)');

/* Global Vars */
var WORKING_MODE = (process.argv[2] == "PC") ? Type.WorkingMode.PC : Type.WorkingMode.RASPBERRY;
var COUNTRY      = (process.argv[3]) ? process.argv[3] : "Turkey";

/* Local Status Storage */
var connectedSocketIOUSers = 0;
var local_temperature_value = [];
var local_lamp_value = [];
var local_sprinkler_value = [];
var local_timer_sprinkler_value = [];
var local_astronomic_timer_lamp_value = [];
var local_timer_sprinkler_job = [];
var local_timer_sprinkler_interval = [];
/* Store created items in here! */
var items_array = [];

/* Initials for PC */
if(WORKING_MODE == Type.WorkingMode.PC)
{
    initPCVariables();
}

/* Listen Socket.IO messages */
io.on('connection', function(socket){
    logger.trace('a user connected.');
    connectedSocketIOUSers++;
    socket.on('update', function(msg){
        logger.info("received SOCKET.IO (update)! " + msg.toString());
        sendToRaspberry(msg.toString());
    });
    socket.on('timerize', function(msg){
        logger.info("received SOCKET.IO (timerize)! " + msg.toString());
        var item = new Type.ControlItem("","","","","","");
        item.parseAndFill(msg);
        
        if(item.type == Type.Message.SPRINKLER_HEADER)
        {
            local_timer_sprinkler_value[item.id - 1] = msg.toString();
            setSprinklerTimerItemTrigger(item);
        }
        else if(item.type == Type.Message.LAMP_HEADER)
        {
            local_astronomic_timer_lamp_value[item.id - 1] = msg.toString();
        }
        
        addUniqeTimerIdentifierStrToDB(item.id - 1, msg.toString());
        io.emit('update', msg.toString());
    });

    socket.on('disconnect', function(){
        connectedSocketIOUSers--;
        logger.trace('user disconnected.');
    });
});

/* Bind to Raspberry Server side socket communication */
var sockServer = null;
sockServer = net.createServer(function(serversCli) {
    serversCli.on("data", function(data) {
        var item = new Type.ControlItem("","","","","","");
        item.parseAndFill(data);
        
        if(item.type == Type.Message.SPRINKLER_HEADER)
        {
            local_sprinkler_value[item.id - 1] = data.toString();
            logger.info(">SPRINKLER data from RASPBERRY : " + data.toString());
        }
        else if(item.type == Type.Message.LAMP_HEADER)
        {
            local_lamp_value[item.id - 1] = data.toString();
            logger.info(">LAMP data from RASPBERRY : " + data.toString());
        }
        else if(item.type == Type.Message.TEMP_HEADER)
        {
            local_temperature_value[item.id - 1] = data.toString();
        }
        io.emit('update', data.toString());
        cloudApp.postDataToCloud(item.type, item.id, item.data);
    });
    
    serversCli.on("end", function() {
    });
});
sockServer.listen(serverSockAddr);

/* Error handling for Raspberry Server side socket */
sockServer.on("error", function (err) {
    if (err.code == 'EADDRINUSE') 
    {
        logger.warn(err.code);
        var serverSocket = new net.Socket();
        serverSocket.on('error', function(err) {
            if (err.code == 'ECONNREFUSED') {
                logger.warn('could not connect to socket, deleting ' + serverSockAddr);
                fs.unlinkSync(serverSockAddr);
                sockServer.listen(serverSockAddr, function() {
                    logger.warn('Connection refused. Server recovered socket, listening..');
                });
            }
            else if (err.code == 'ENOENT')
            {
                logger.info('Recovering deleted SOCK..');
                sockServer.listen(serverSockAddr, function() {
                    logger.info('SockServer recovered socket, listening.');
                });
            }
            else 
            {
                logger.error('SockServer got another error :  ' + err.code);
            }
        });
        serverSocket.connect({path: serverSockAddr}, function() {
            logger.warn('Connected: it was a real socket. Giving up.');
            process.exit();
        });
    }
});

/* Send row data to Raspberry */
function sendToRaspberry(data)
{
    if(data)
    {
        sockClient = net.createConnection(clientSockAddr);
        sockClient.on("error", function (err) {
            if (err.code == 'ECONNREFUSED')
            {
                logger.error("Connection refused.");
            }
            else if (err.code == 'ENOENT')
            {
                logger.error("No entry for the sock.");
            }
            if (err.code == 'EADDRINUSE')
            {
                logger.error("Address binding has no effect.");
            }
        });
        
        logger.info("sending to RASPBERRY! data type : " + typeof(data) + ", toString : " + data.toString());
        sockClient.write(data);
        sockClient.end();
    }
}

/* Some preset values for PC configuration */
function initPCVariables()
{
    logger.trace("Working on the PC! @" + COUNTRY);
    local_lamp_value[0] = "type=LMP,id=1,data=0,initialize=0,timer=0,interval=0";
    local_lamp_value[1] = "type=LMP,id=2,data=,initialize=0,timer=0,interval=0";
    local_lamp_value[2] = "type=LMP,id=3,data=0,initialize=0,timer=0,interval=0";
    local_sprinkler_value[0] = "type=SPR,id=1,data=0,initialize=0,timer=0,interval=0";
    local_sprinkler_value[1] = "type=SPR,id=2,data=0,initialize=0,timer=0,interval=0";
    local_sprinkler_value[2] = "type=SPR,id=3,data=0,initialize=0,timer=0,interval=0";
    local_sprinkler_value[3] = "type=SPR,id=4,data=0,initialize=0,timer=0,interval=0";
    /* Let PC get data from ThingSpeak */
    //local_temperature_value[0] = "type=TMP,id=1,data=22.5,initialize=0,timer=0,interval=0";
}

/* Send initial request to Raspberry Server for not threadized elements. */
function requestInitialsFromRaspberry()
{
    for(var i = Type.Id.FIRST_SPRINKLER; i <= Type.ItemCount.SPRINKLERS; i++)
    {
        var item = new Type.ControlItem(Type.Message.SPRINKLER_HEADER, i, 
            Type.Message.ITS_AN_INIT, Type.Message.ITS_AN_INIT, 
            Type.Message.NOT_A_TIMER, Type.Message.NOT_A_TIMER);
        sendToRaspberry(item.compose());
    }
    
    for(var i = Type.Id.FIRST_LAMP; i <= Type.ItemCount.LAMPS; i++)
    {
        var item = new Type.ControlItem(Type.Message.LAMP_HEADER, i, 
            Type.Message.ITS_AN_INIT, Type.Message.ITS_AN_INIT, 
            Type.Message.NOT_A_TIMER, Type.Message.NOT_A_TIMER);
        sendToRaspberry(item.compose());
    }
    
    for(var i = Type.Id.FIRST_TEMPSENSOR; i <= Type.ItemCount.TEMPSENSORS; i++)
    {
        var item = new Type.ControlItem(Type.Message.TEMP_HEADER, i, 
            Type.Message.ITS_AN_INIT, Type.Message.ITS_AN_INIT, 
            Type.Message.NOT_A_TIMER, Type.Message.NOT_A_TIMER);
        sendToRaspberry(item.compose());
    }
}

/* Server Side Timer Configuration */
function setSprinklerTimerItemTrigger(item)
{
    var intervalSetter;
    if(item.type == Type.Message.SPRINKLER_HEADER)
    {
        if(local_timer_sprinkler_job[item.id - 1] != null)
        {
            logger.trace("timer has been cleared!");
            local_timer_sprinkler_job[item.id - 1].stop();
            local_timer_sprinkler_job[item.id - 1] = null;
        }
        if(local_timer_sprinkler_interval[item.id - 1] != null)
        {
            clearTimeout(local_timer_sprinkler_interval[item.id - 1]);
            local_timer_sprinkler_interval[item.id - 1] = null;
        }
        
        if(item.data != Type.Message.DATA_STOP)
        {
            logger.info("timer gonna be set @ " + item.data + " for : " + item.interval);
            var hourMinute = item.data.split(":");
            var cronPattern = "00 " + hourMinute[1] + " " + hourMinute[0] + " * * 0-6";
            local_timer_sprinkler_job[item.id - 1] = new CronJob({
                cronTime: cronPattern,
                onTick: function() {
                    logger.info("timer fired!!! > " + local_timer_sprinkler_value[item.id - 1]);
                    /* TODO: Do not be afraid! Will have a nicer shape after completing TASK-14 */
                    sendToRaspberry(local_timer_sprinkler_value[item.id - 1]);
                    local_timer_sprinkler_interval[item.id - 1] = setTimeout(function () {
                        logger.info("Stopping timer due to timeout!");
                        item.data = Type.Message.DATA_STOP;
                        sendToRaspberry(item.compose());
                    }, item.interval * 60 * 1000);
                },
                onComplete: function() {
                    logger.info("onComplete : timer gonna be unscheduled!");
                },
                start: false
            });
            local_timer_sprinkler_job[item.id - 1].start();
        }
    }
}

/* Insert Timer values to timerstore tables as row data */
function addUniqeTimerIdentifierStrToDB(index, data)
{
    var item = new Type.ControlItem("","","","","","");
    item.parseAndFill(data);
    if(item.type == Type.Message.SPRINKLER_HEADER)
    {
        db.query('DELETE FROM sprinklertimerstore WHERE id = ?', [index], 
        function (err, rows){
            if(err)
            {
                logger.error("On DB deletion err_code : " + err);
            }
        });
       
        db.query('INSERT INTO sprinklertimerstore VALUES(?, ?)', [index, data], 
        function (err, rows){
            if(err)
            {
                logger.error("on DB insertion, err_code : " + err);
            }
        });
    }
    else if(item.type == Type.Message.LAMP_HEADER)
    {
        db.query('DELETE FROM lamptimerstore WHERE id = ?', [index], 
        function (err, rows){
            if(err)
            {
                logger.error("On DB deletion err_code : " + err);
            }
        });
       
        db.query('INSERT INTO lamptimerstore VALUES(?, ?)', [index, data], 
        function (err, rows){
            if(err)
            {
                logger.error("on DB insertion, err_code : " + err);
            }
        });
    }
}

/* Load timerstore values to Nodejs Web Server array to fetch on time */
function requestTimersFromDB()
{
    db.query('SELECT * FROM sprinklertimerstore', {
        id: Number,
        value: String 
    },function (err, rows) {
        for (var i = 0; i < rows.length; i++)
        {
            var record = rows[i];
            var item = new Type.ControlItem("","","","","","");
            item.parseAndFill(record.value);
            logger.info("currently read timer from sprinklertimerstore : " + item.compose());
            local_timer_sprinkler_value[item.id - 1] = record.value;
            setSprinklerTimerItemTrigger(item);
        }
    });
    
    db.query('SELECT * FROM lamptimerstore', {
        id: Number,
        value: String 
    },function (err, rows) {
        for (var i = 0; i < rows.length; i++)
        {
            var record = rows[i];
            var item = new Type.ControlItem("","","","","","");
            item.parseAndFill(record.value);
            logger.info("currently read timer from lamptimerstore : " + item.compose());
            local_astronomic_timer_lamp_value[item.id - 1] = record.value;
        }
    });
}

/* Sync on time with clients in ALIVE_TIME_TOUT */
function clientSyncAliveMessage()
{
    var alive_interval = setInterval(function(){
        if(connectedSocketIOUSers > 0)
        {
            io.emit('alive', new Date());
        }
    }, Type.Consts.ALIVE_TIME_TOUT);
}

/* Start Timers after getting valid time from NTP. For wifi cases, we collect time some late bit. */
function pollNTPForTimers()
{
    var ntpq_poll_request = 'ntpq -c \"rv 0 stratum,offset,sys_jitter\"';
    var ntp_interval = setInterval(function(){
        exec(ntpq_poll_request, function (error, stdout, stderr) {
            if(stderr != "" && typeof stderr !== "undefined")
            {
                logger.warn("stderr: " + stderr);
            }
            if(WORKING_MODE == Type.WorkingMode.PC)
            {
                var ntpq_fake_result = "stratum=2, offset=1.594, sys_jitter=1.998";
                stdout = ntpq_fake_result;
            }
            if(stdout != "" && typeof stdout !== "undefined")
            {
                logger.trace("stdout: " + stdout);
                var ntp_items = stdout.split(",");
                var stratum = parseInt(ntp_items[0].replace( /[^\d.]/g, ''));
                logger.info("Reading stratum : " + stratum);
                /* Network and so on time was gathered. */
                if(stratum < 16)
                {
                    clearInterval(ntp_interval);
                    requestTimersFromDB();
                    astronomic.start();
                }
            }
            if (error !== null)
            {
                logger.error("EXEC Failed! : " + error);
                clearInterval(ntp_interval);
            }
        });
    }, Type.Consts.NTP_POLL_TOUT);
}

astronomic.on('astronomicEvent', function(data) {
    logger.trace("astronomicEvent gathered : " + data + ",stored len : " + local_astronomic_timer_lamp_value.length);
    for (var i = 0; i < Type.Id.MAX_LAMP; i++)
    {
        if(typeof local_astronomic_timer_lamp_value[i] !== "undefined" && local_astronomic_timer_lamp_value[i] !== null)
        {
            var item = new Type.ControlItem("","","","","","");
            item.parseAndFill(local_astronomic_timer_lamp_value[i]);
            var actionData = (data == "on" ? Type.Message.DATA_ASTRONOMIC : Type.Message.DATA_STOP);
            logger.info("based on astro timer, set action for " + item.id + ". lamp: " + actionData);
            var item = new Type.ControlItem(Type.Message.LAMP_HEADER, item.id, 
                actionData, Type.Message.NOT_AN_INIT, 
                Type.Message.ITS_A_TIMER, Type.Message.ITS_A_TIMER);
            sendToRaspberry(item.compose());
        }
    }
});

/* Request Initials */
requestInitialsFromRaspberry();
pollNTPForTimers();
clientSyncAliveMessage();

/* Handle upcoming HTTP GET request and fill initials */
app.get('/', function(request, response){
    response.render("pages/index", {
        initialTemp: local_temperature_value,
        initialLamp: local_lamp_value,
        initialSprinkler : local_sprinkler_value,
        initialTimerSprinkler : local_timer_sprinkler_value,
        initialAstronomicTimerLamp: local_astronomic_timer_lamp_value,
        initialDateTime : new Date(),
        workingMode : WORKING_MODE
    });
});
 
