var http = require('http');
var log4js  = require('log4js');
var moment = require('moment');
const EventEmitter = require('events').EventEmitter;
const util = require('util');

/* Init logger */
log4js.configure({
    appenders: [
        { type: 'console' },
        { type: 'file', filename: __dirname + '/../logs/astronomic.log', category: 'astronomic', 'maxLogSize': 5 * 1024 }
    ]
});

var AstronomicTimer = function()
{
    var self = this;
    var myHomeLat = "38.683943";
    var myHomeLng = "26.971167";
    var UTC_DIFF = 2;
    var TIMER_INTERVAL = 60 * 1000;
    var sunTracker = null;
    var astronomicNotifier = null;
    var globalStatus = "";
    var logger = log4js.getLogger('astronomic');
    logger.setLevel('TRACE');

    function getAPIHTTPOptions()
    {
        return options = {
            host: 'api.sunrise-sunset.org',
            path: '/json?lat=' + myHomeLat + '&lng=' + myHomeLng + '&date=' + moment().format("YYYY-MM-DD"),
            method : 'GET'
        };
    }

    function trigTheAstronomicNotifier(sun_data)
    {
        var sunriseMoment = moment(JSON.parse(sun_data).results.sunrise, "hh:mm:ss A");
        var sunsetMoment = moment(JSON.parse(sun_data).results.sunset, "hh:mm:ss A");
        var noonMoment = moment("23:59:59 PM", "hh:mm:ss A");
        if(sunriseMoment.isValid() && sunsetMoment.isValid())
        {
            sunsetMoment.add(UTC_DIFF, "hours");
            sunriseMoment.add(UTC_DIFF, "hours");

            astronomicNotifier = setInterval(function() {
                var status;
                if(sunsetMoment.diff(moment(), "minutes") * sunriseMoment.diff(moment(), "minutes") > 0)
                {
                    status = "on";
                }
                else
                {
                    status = "off";
                }
                
                if(status != globalStatus)
                {
                    globalStatus = status;
                    logger.info("Current time : " + moment().toString() + ", Sunrise : " + sunriseMoment.toString() + ", Sunset : " + sunsetMoment.toString());
                    self.emit('astronomicEvent', status);
                }

                logger.trace("diffies : noonMoment : " + noonMoment.diff(moment(), "minutes"));
                logger.trace("diffies : sunsetMoment : " + sunsetMoment.diff(moment(), "minutes"));
                logger.trace("diffies : sunriseMoment : " + sunriseMoment.diff(moment(), "minutes"));
                if(noonMoment.diff(moment(), "minutes") < 0)
                {
                    logger.info("Date deprecation. Recall for renewal.");
                    self.stop();
                    self.start();
                }
            }, TIMER_INTERVAL);
        }
        else
        {
            logger.warn("Gathered incorrect type of sun date. Fire again ..");
            self.stop();
            self.start();
        }
    }

    function fireSunTrackerAPITimer()
    {
        if(!sunTracker)
        {
            sunTracker = setInterval(function () {
                logger.warn("Try to get Sunprop from API..");
                requestSunProps();
            },  TIMER_INTERVAL);
        }
    }

    function requestSunProps() {
        self.stop();
        var reqHTTP = http.request(getAPIHTTPOptions(), function(res){
            var whole_data = "";
            logger.trace("Req: " + getAPIHTTPOptions().host + getAPIHTTPOptions().path);
            logger.trace("Code: " + res.statusCode);
            res.on('data', function (chunk){
                whole_data += chunk;
            });
            res.on('end',function(){
                if(whole_data != "")
                {
                    logger.info("Astronomic Result : " + whole_data);
                    trigTheAstronomicNotifier(whole_data);
                    clearInterval(sunTracker);
                    sunTracker = null;
                }
                else
                {
                    logger.error("Not able to get Sun props from API. Will be retried...");
                    fireSunTrackerAPITimer();
                }
            });
            res.on('error', function(err){
                logger.error("Error Occurred: " + err.message);
                fireSunTrackerAPITimer();
            });
        });

        reqHTTP.on('error', function(err){
            logger.error("Error Occurred: " + err.message);
            fireSunTrackerAPITimer();
        });

        reqHTTP.end();
    }

    this.start = function()
    {
        requestSunProps();
        logger.info("AstronomicTimer has been started.");
    }

    this.stop = function()
    {
        clearInterval(sunTracker);
        sunTracker = null;
        clearInterval(astronomicNotifier);
        astronomicNotifier = null;
        logger.info("AstronomicTimer has been stopeed.");
    }
    
    this.on('newListener', function(listener) {
        logger.info('Event Listener: ' + listener);
    });
    
    this.getStatus = function()
    {
        return globalStatus;
    }
};
util.inherits(AstronomicTimer, EventEmitter);
module.exports = new AstronomicTimer();
