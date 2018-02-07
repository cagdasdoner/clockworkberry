var clock_interval = null;
var alive_timeout = null;
    
var socket = io();

socket.on('update', function(received){
    console.log("update > client got the : " + received);
    parseCommandAndPutInAction(received);
});

socket.on('alive', function(received){
    fireTheClock(received);
});

function sendLampStatus(lamp_id){
    var data = !getLampStatus(lamp_id) ? 1 : 0;
    var lamp = new ControlItem(Message.LAMP_HEADER, lamp_id, data, 
        Message.NOT_AN_INIT, Message.NOT_A_TIMER, Message.NOT_A_TIMER);
    socket.emit("update", lamp.compose());
}

function sendSprinklerStatus(sprinkler_id){
    var data = !getSprinklerStatus(sprinkler_id) ? 1 : 0;
    var sprinkler = new ControlItem(Message.SPRINKLER_HEADER, sprinkler_id, 
        data, Message.NOT_AN_INIT, Message.NOT_A_TIMER, Message.NOT_A_TIMER);
    socket.emit("update", sprinkler.compose());
}

function sendSprinklerTimerStatus(sprinkler_id, timer_data, interval){
    var sprinkler = new ControlItem(Message.SPRINKLER_HEADER, sprinkler_id, 
        timer_data, Message.NOT_AN_INIT, Message.ITS_A_TIMER, interval);
    socket.emit("timerize", sprinkler.compose());
}

function sendAstronomicLampTimerStatus(lamp_id){
    var data;
    if (getAstronomicLampTimerStatus(lamp_id) == Message.DATA_STOP)
    {
        data = Message.DATA_ASTRONOMIC;
    }
    else if (getAstronomicLampTimerStatus(lamp_id) == Message.DATA_ASTRONOMIC)
    {
        data = Message.DATA_STOP;
    }
    else console.log("ERROR: Not a valid lamp timer data.");
    
    var lamp = new ControlItem(Message.LAMP_HEADER, lamp_id, 
        data, Message.NOT_AN_INIT, Message.ITS_A_TIMER, Message.NO_INTERVAL);
    socket.emit("timerize", lamp.compose());
}

function sendWindowAction(window_id, action_data)
{
    var window = new ControlItem(Message.WINDOW_HEADER, window_id, action_data, 
        Message.NOT_AN_INIT, Message.NOT_A_TIMER, Message.NOT_A_TIMER);
    socket.emit("update", window.compose());
}

function fireTheClock(dateTime)
{
    dateTime = new Date(dateTime);
    var formattedDate = moment(dateTime).format('DD.MM.YY');
    var formattedTime = moment(dateTime).format("HH:mm:ss")
    document.getElementById("dateStatDiv").innerHTML = "" + formattedDate;
    document.getElementById("timeStatDiv").innerHTML = "" + formattedTime;
    document.getElementById("connectionStatDiv").innerHTML = " Connected";
    $('#connectionStatDiv').removeClass("text-danger");
    $('#connectionStatDiv').addClass("text-success");
    $('#connectionStatDiv').removeClass("glyphicon-ban-circle");
    $('#connectionStatDiv').addClass("glyphicon-flash");
    
    if(clock_interval)
    {
        clearInterval(clock_interval);
    }
    if(alive_timeout)
    {
        clearTimeout(alive_timeout);
    }
    
    clock_interval = setInterval(function(){
        dateTime.setSeconds(dateTime.getSeconds() + 1);
        var formattedDate = moment(dateTime).format('DD.MM.YY');
        var formattedTime = moment(dateTime).format("HH:mm:ss")
        document.getElementById("dateStatDiv").innerHTML = "" + formattedDate;
        document.getElementById("timeStatDiv").innerHTML = "" + formattedTime;
    }, 1000);
    
    alive_timeout = setTimeout(function(){
        console.log("DISCONNECTED !!!!! ");
        document.getElementById("connectionStatDiv").innerHTML = " Disconnected";
        $('#connectionStatDiv').removeClass("text-success");
        $('#connectionStatDiv').addClass("text-danger");
        $('#connectionStatDiv').removeClass("glyphicon-flash");
        $('#connectionStatDiv').addClass("glyphicon-ban-circle");
    }, Consts.ALIVE_TIME_TOUT * 2);
}

/* TODO : Out of purpose of the scope. Move it. */
function parseCommandAndPutInAction(command)
{
    var item = new ControlItem("","","","","","");
    item.parseAndFill(command);
    
    if(item.type == Message.LAMP_HEADER)
    {
        console.log("lampUpdate > Client got the : " + item.compose());
        if(item.timer == Message.ITS_A_TIMER)
        {
            setAstronomicLampTimer(item.type, item.id, item.data, Message.NO_INTERVAL);
        }
        else
        {
            setLamp(item.id, item.data);
        }
    }
    else if(item.type == Message.SPRINKLER_HEADER)
    {
        console.log("sprinklerUpdate > Client got the : " + item.compose());
        if(item.timer == Message.ITS_A_TIMER)
        {
            setSprinklerTimer(item.type, item.id, item.data, item.interval);
        }
        else
        {
            setSprinkler(item.id, item.data);
        }
    }
    else if(item.type == Message.TEMP_HEADER)
    {
        console.log("tempUpdate > Client got the : " + item.compose());
        document.getElementById("tempDiv" + item.id).innerHTML = " " + item.id + ". Temperature Sensor (Generic) : " + item.data + " \xB0"+"C"; /* Degree sign */
    }
    else if(item.type == Message.WINDOW_HEADER)
    {
        console.log("windowUpdate > Client got the : " + item.compose());
        setWindow(item.id, item.data);
    }
    else 
    {
        console.log("parseCommandAndPutInAction : Not a valid data to parse !");
    }
}

function parseDateTime(date)
{
    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var minu  = date.getMinutes();
    minu = (minu < 10 ? "0" : "") + minu;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return day + "." + month + "." + year + " " + hour + ":" + minu + ":" + sec;
}
