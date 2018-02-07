var Message = {
    TEMP_HEADER     : "TMP",
    LAMP_HEADER     : "LMP",
    SPRINKLER_HEADER: "SPR",
    WINDOW_HEADER   : "WND",
    SEPARATOR       : ","  ,
    PARAM_SEPARATOR : "="  ,
    DATA_STOP       : "ST:OP",
    DATA_ASTRONOMIC : "AS:TR",
    NOT_A_TIMER     : "0",
    ITS_A_TIMER     : "1",
    NOT_AN_INIT     : "0",
    ITS_AN_INIT     : "1",
    NO_INTERVAL     : "0"
};

var Id = {
    FIRST_LAMP          : 1,
    SECOND_LAMP         : 2,
    THIRD_LAMP          : 3,
    MAX_LAMP            : 3,
    FIRST_SPRINKLER     : 1,
    SECOND_SPRINKLER    : 2,
    THIRD_SPRINKLER     : 3,
    FOURTH_SPRINKLER    : 4,
    MAX_SPRINKLER       : 4,
    FIRST_TEMPSENSOR    : 1,
    MAX_TEMP_SENSOR     : 1,
    FIRST_WINDOW        : 1,
    SECOND_WINDOW       : 2,
    THIRD_WINDOW        : 3,
    FOURTH_WINDOW       : 4,
    FIFTH_WINDOW        : 5,
    MAX_WINDOW          : 5,
    FIRST_THERMOSTAT    : 1,
    SECOND_THERMOSTAT   : 2,
    THIRD_THERMOSTAT    : 3,
    FOURTH_THERMOSTAT   : 4,
    MAX_THERMOSTAT      : 4
};

var ItemCount = {
    LAMPS          : Id.MAX_LAMP,
    SPRINKLERS     : Id.MAX_SPRINKLER,
    WINDOWS        : Id.MAX_WINDOW,
    TEMPSENSORS    : Id.MAX_TEMP_SENSOR,
    THERMOSTATS    : Id.MAX_THERMOSTAT
};

var Consts = {
    SPRINKLER_TOUT      : 60 * 60 * 1000,   /* Timer running interval. */
    SPRINKLER_UI_TOUT   : 2 * 1000,         /* Progress bar visibility interval */
    ALIVE_TIME_TOUT     : 5 * 1000,         /* Alive like message interval */
    NTP_POLL_TOUT       : 15 * 1000,        /* NTP will be polled until get time in that interval */
    TIMEPICKER_STEPPING : 15,               /* Timepicker gonna have this as minute for stepping */
    TIMEPICKER_FORMAT   : "HH:mm"           /* Time picking basic format */
};

var Action = {
    UP      : "UP",
    DOWN    : "DOWN",
    STOP    : "STOP"
};

var WorkingMode = {
    PC            : 0,
    RASPBERRY     : 1,
    CLOUD_SERVER  : 2
};

function ControlItem(type, id, data, initialize, timer, interval) {
    this.type = type;
    this.id = id;
    this.name = "";
    this.data = data;
    this.initialize = initialize;
    this.timer = timer;
    this.interval = interval;
    this.constructMe = function(type, id, data, initialize, timer)
    {
        this.type = type;
        this.id = id;
        this.data = data;
        this.initialize = initialize;
        this.timer = timer;
        this.interval = interval;
    }
    this.dump = function() {
        console.log(this.type + Message.SEPARATOR + this.id + Message.SEPARATOR + 
        this.data + Message.SEPARATOR + this.initialize + Message.SEPARATOR + 
        this.timer + Message.SEPARATOR + this.interval);
    }
    this.compose = function() {
        var stringified = "type=" + this.type + Message.SEPARATOR + "id=" + this.id + 
        Message.SEPARATOR + "data=" + this.data + Message.SEPARATOR + "initialize=" + 
        this.initialize + Message.SEPARATOR + "timer=" + this.timer + 
        Message.SEPARATOR + "interval=" + this.interval;
        
        return stringified;
    }
    this.parseAndFill = function(command){
        var parsedData = command.toString().split(Message.SEPARATOR);
        for (i = 0; i < parsedData.length; i++)
        {
            var paramCheck = parsedData[i].split(Message.PARAM_SEPARATOR);
            if(paramCheck[0] == "type")
            {
                this.type = paramCheck[1];
            }
            else if(paramCheck[0] == "id")
            {
                this.id = paramCheck[1];
            }
            else if(paramCheck[0] == "data")
            {
                this.data = paramCheck[1];
            }
            else if(paramCheck[0] == "initialize")
            {
                this.initialize = paramCheck[1];
            }
            else if(paramCheck[0] == "timer")
            {
                this.timer = paramCheck[1];
            }
            else if(paramCheck[0] == "interval")
            {
                this.interval = paramCheck[1];
            }
        }
    }
};

/* Export variables to nodejs. */
if(typeof exports != "undefined")
{
    exports.Message = Message;
    exports.Id = Id;
    exports.Consts = Consts;
    exports.ControlItem = ControlItem;
    exports.ItemCount = ItemCount;
    exports.Action = Action;
    exports.WorkingMode = WorkingMode;
}
