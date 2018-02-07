var LAMP_ASTRONOMIC_TIMER_HTML_ITEM   = "astronomicTimerId";
var FIRST_ASTRONOOMIC_LAMP_STATUS     =  Message.DATA_STOP;
var SECOND_ASTRONOOMIC_LAMP_STATUS    =  Message.DATA_STOP;
var THIRD_ASTRONOOMIC_LAMP_STATUS     =  Message.DATA_STOP;

function setAstronomicLampTimer(timer_item, item_id, timer_data, timer_interval)
{
    var itemHTML = LAMP_ASTRONOMIC_TIMER_HTML_ITEM + item_id;
    if (document.getElementById(itemHTML) != null)
    {
        setAstronomicLampTimerStatus(item_id, timer_data);
        if(timer_data == Message.DATA_STOP)
        {
            console.log("Astronomic timer STOP.");
            $("#" + itemHTML).find('span').html(" Off");
            $("#" + itemHTML).removeClass("btn-success");
            $("#" + itemHTML).addClass("btn-danger");
        }
        else if (timer_data == Message.DATA_ASTRONOMIC)
        {
            console.log("Astronomic timer set. ");
            $("#" + itemHTML).find('span').html(" On");
            $("#" + itemHTML).removeClass("btn-danger");
            $("#" + itemHTML).addClass("btn-success");
        }
        else
        {
            console.log("invalid astronomic timer value.");
        }
    }
    else
    {
        console.log("Astronomic timer HTML element is null.");
    }
}

function getAstronomicLampTimerStatus(lamp_id)
{
    var stat = Message.DATA_STOP;
    if(lamp_id == Id.FIRST_LAMP)
        stat = FIRST_ASTRONOOMIC_LAMP_STATUS;
    else if(lamp_id == Id.SECOND_LAMP)
        stat = SECOND_ASTRONOOMIC_LAMP_STATUS;
    else if(lamp_id == Id.THIRD_LAMP)
        stat = THIRD_ASTRONOOMIC_LAMP_STATUS;
    return stat;
}

function setAstronomicLampTimerStatus(lamp_id, status)
{
    if(lamp_id == Id.FIRST_LAMP)
        FIRST_ASTRONOOMIC_LAMP_STATUS = status;
    else if(lamp_id == Id.SECOND_LAMP)
        SECOND_ASTRONOOMIC_LAMP_STATUS = status;
    else if(lamp_id == Id.THIRD_LAMP)
        THIRD_ASTRONOOMIC_LAMP_STATUS = status;
    else
        console.log("Incorrect Lamp id!");
}
