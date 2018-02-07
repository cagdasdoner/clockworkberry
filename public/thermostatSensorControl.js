
var THERMO_SPINNER_HTML_ID  = "thermostatSpinner";
var THERMO_STATUS_HTML_ID   = "roomThermostatStatus";
var THERMO_TEMP_VAL_HTML_ID = "roomTemperature"
/* Just get unique temp read to test Thermostats */
var g_latest_global_unique_temp_read = 0;


function registerThermostatHTMLEvents()
{
    $.getJSON('http://api.thingspeak.com/channels/63158/feed/last.json?callback=?', 
        function(data){
            for(item_id = Id.FIRST_THERMOSTAT; item_id <= ItemCount.THERMOSTATS; ++item_id)
            {
                var roomTempHTML = THERMO_TEMP_VAL_HTML_ID + item_id;
                g_latest_global_unique_temp_read = data.field1;
                document.getElementById(roomTempHTML).innerHTML = g_latest_global_unique_temp_read;

                setThermostatStatusWithGivenUniqueTestTemperature(item_id, g_latest_global_unique_temp_read);
            }
            /* BAD CODE (unrelated) : Demo purpose . */
            document.getElementById("tempDiv1").innerHTML = "Temperature Sensor (Generic) : " + g_latest_global_unique_temp_read + " \xB0"+"C"; /* Degree sign */
        }
    );
    
    for(item_id = Id.FIRST_THERMOSTAT; item_id <= ItemCount.THERMOSTATS; ++item_id)
    {
        var thermoSpinnerHTML = THERMO_SPINNER_HTML_ID + item_id;
        if (document.getElementById(thermoSpinnerHTML) !== null)
        {
            /* Thermostat Activities */
            var spinnerItem = document.getElementById(thermoSpinnerHTML);
            if (typeof window.addEventListener === 'function')
            {
                (function (_spinnerItem, _item_id)
                {    
                    $(_spinnerItem).TouchSpin({
                        step:1,
                        min:15,
                        max:30
                    });
                    $(_spinnerItem).on("touchspin.on.stopspin", function(){
                        setThermostatStatusWithGivenUniqueTestTemperature(_item_id, g_latest_global_unique_temp_read);
                    });
                    
                })(spinnerItem, item_id);
                
            }
        }
    }
}

function setThermostatStatusWithGivenUniqueTestTemperature(item_id, latest_global_unique_temp_read)
{
    if($("#" + THERMO_SPINNER_HTML_ID + item_id).val() > latest_global_unique_temp_read)
    {
        $("#" + THERMO_STATUS_HTML_ID + item_id).text("Active");
    }
    else
    {
        $("#" + THERMO_STATUS_HTML_ID + item_id).text("Inactive");
    }
}
