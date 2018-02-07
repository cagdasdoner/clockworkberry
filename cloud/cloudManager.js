var https   = require('https');
var Type    = require('../public/types');
var log4js  = require('log4js');

/* Init logger */
log4js.configure({
    appenders: [
        { type: 'console' },
        { type: 'file', filename: __dirname + '/../logs/cloud.log', category: 'cloud', 'maxLogSize': 50 * 1024 }
    ]
});
var logger = log4js.getLogger('cloud');
logger.setLevel('TRACE');

var CLOUD_EXTERNAL_ADDR  = "api.thingspeak.com";
var CLOUD_DATA_PATH      = "/update";
var CLOUD_TEMP_KEY       = "9NJVQVH1V37XNN34";
var CLOUD_SPRINKLER_KEY  = "TRIAL_KEY";
var CLOUD_LAMP_KEY       = "TRIAL_KEY";

var WORKING_MODE = (process.argv[2] == "PC") ? Type.WorkingMode.PC : Type.WorkingMode.RASPBERRY;

function postDataToCloud(type, id, data)
{
    if(WORKING_MODE != Type.WorkingMode.PC)
    {
        logger.trace("postDataToCloud : type : " + type + " data : " + data);
        var options = requestComposer(type, id, data);
        if(options != null)
        {
            postIt(options);
        }
    }
    else
    {
        logger.info("Working on PC. Not need to post dummy data to cloud.");
    }

}

function requestComposer(type, id, data)
{
    var options = null;
    var using_key = "";
    
    if(type == Type.Message.TEMP_HEADER)
    {
        using_key = CLOUD_TEMP_KEY;
    }
    /* Disabled until generating a new Channel for them. */
    /*
    else if(type == Type.Message.SPRINKLER_HEADER)
    {
        using_key = CLOUD_SPRINKLER_KEY;
    }
    else if(type == Type.Message.LAMP_HEADER)
    {
        using_key = CLOUD_LAMP_KEY;
    }*/
    
    if(using_key != "")
    {
        var path = CLOUD_DATA_PATH + "?key=" + using_key + "&field" + id + "=" + data;
        options = {
            hostname: CLOUD_EXTERNAL_ADDR,
            path: path,
            method: "GET"
        };
    }

    return options;
}

function postIt(request_options)
{
    var reqHTTP = https.request(request_options, function(res){
        var whole_data = "";
        logger.info("Code: " + res.statusCode);
        res.on('data', function (chunk){
            whole_data += chunk;
        });
        res.on('end',function(){
            if(whole_data != "")
            {
                logger.info("Cloud Result : " + whole_data);
            }
        });
        res.on('error', function(err){
            logger.error("Error Occurred: " + err.message);
        });
    });

    reqHTTP.on('error', function(err){
        logger.error("Error Occurred: " + err.message);
    });

    reqHTTP.end();
}

exports.postDataToCloud = postDataToCloud;
