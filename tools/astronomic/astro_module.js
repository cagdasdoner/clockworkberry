var http = require('http');
var moment = require('moment');
const EventEmitter = require('events').EventEmitter;
const util = require('util');
var AstroInfo = require('./astro_info.js');

var AstronomicTimer = function()
{
    var self = this;
    var TIMER_INTERVAL = 60 * 1000;
    var sunTracker = null;
    var astronomicNotifier = null;
    var globalStatus = "";

    function getAPIHTTPOptions()
    {
        return options = {
            host: 'api.sunrise-sunset.org',
            path: '/json?lat=' + AstroInfo.Local.Lat + '&lng=' + AstroInfo.Local.Lng + '&date=' + moment().format("YYYY-MM-DD"),
            method : 'GET'
        };
    }

    function trigTheAstronomicNotifier(sun_data)
    {
		/* Set moment objects of sun props. */
        var sunriseMoment = moment(JSON.parse(sun_data).results.sunrise, "hh:mm:ss A");
        var sunsetMoment = moment(JSON.parse(sun_data).results.sunset, "hh:mm:ss A");
        var noonMoment = moment("23:59:59 PM", "hh:mm:ss A");
        if(sunriseMoment.isValid() && sunsetMoment.isValid())
        {
            sunsetMoment.add(AstroInfo.Local.UTC_Offset, "hours");
            sunriseMoment.add(AstroInfo.Local.UTC_Offset, "hours");

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
                    self.emit('astronomicEvent', status);
                }

                if(noonMoment.diff(moment(), "minutes") < 0)
                {
                    /* Date deprecation. Recall for renewal. */
                    self.stop();
                    self.start();
                }
            }, TIMER_INTERVAL);
        }
        else
        {
            /* Gathered incorrect type of sun date. Fire again. */
            self.stop();
            self.start();
        }
    }

    function fireSunTrackerAPITimer()
    {
        if(!sunTracker)
        {
            sunTracker = setInterval(function () {
                /* Try to get Sunprop from API. */
                requestSunProps();
            },  TIMER_INTERVAL);
        }
    }

    function requestSunProps() {
        self.stop();
        var reqHTTP = http.request(getAPIHTTPOptions(), function(res){
            var whole_data = "";
            res.on('data', function (chunk){
                whole_data += chunk;
            });
            res.on('end',function(){
                if(whole_data != "")
                {
					/* Success end of response. Trig the notifier. */
                    trigTheAstronomicNotifier(whole_data);
                    clearInterval(sunTracker);
                    sunTracker = null;
                }
                else
                {
                    /* Not able to get Sun props from API. Will be retried. */
                    fireSunTrackerAPITimer();
                }
            });
            res.on('error', function(err){
				/* Not able to get Sun props from API. Will be retried. */
                fireSunTrackerAPITimer();
            });
        });

        reqHTTP.on('error', function(err){
			/* Not able to get Sun props from API. Will be retried. */
            fireSunTrackerAPITimer();
        });
        reqHTTP.end();
    }

    this.start = function()
    {
        requestSunProps();
    }

    this.stop = function()
    {
        clearInterval(sunTracker);
        sunTracker = null;
        clearInterval(astronomicNotifier);
        astronomicNotifier = null;
    }
    
    this.on('newListener', function(listener) {

    });
    
    this.getStatus = function()
    {
        return globalStatus;
    }
};
util.inherits(AstronomicTimer, EventEmitter);
module.exports = new AstronomicTimer();
