var LAMP_HTML_ITEM          = "lampButton";

var FIRST_LAMP_STATUS       = false;
var SECOND_LAMP_STATUS      = false;
var THIRD_LAMP_STATUS       = false;

function setLamp(lamp_id, status){
     performLampStatusChange(lamp_id, status);
}

function performLampStatusChange(lamp_id, status)
{
    var itemHTML = LAMP_HTML_ITEM + lamp_id;
    setLampStatus(lamp_id, status);
    
    if (document.getElementById(itemHTML) != null)
    {
        if(status == true)
        {
            $("#" + itemHTML).removeClass("btn-danger");
            $("#" + itemHTML).addClass("btn-success");
            $("#" + itemHTML).find('span').removeClass("glyphicon-off");
            $("#" + itemHTML).find('span').addClass("glyphicon-flash");
            document.getElementById("statDiv").innerHTML = lamp_id + ". Lamp has ENABLED.";
        }
        else
        {
            $("#" + itemHTML).removeClass("btn-success");
            $("#" + itemHTML).addClass("btn-danger");
            $("#" + itemHTML).find('span').removeClass("glyphicon-flash");
            $("#" + itemHTML).find('span').addClass("glyphicon-off");
            document.getElementById("statDiv").innerHTML = lamp_id + ". Lamp has DISABLED.";
        }
    }
    else
    {
        console.log("Lamp item has not been created yet!");
    }
}

function getLampStatus(lamp_id)
{
    var stat = false;
    if(lamp_id == Id.FIRST_LAMP)
        stat = FIRST_LAMP_STATUS;
    else if(lamp_id == Id.SECOND_LAMP)
        stat = SECOND_LAMP_STATUS;
    else if(lamp_id == Id.THIRD_LAMP)
        stat = THIRD_LAMP_STATUS;
    return (stat == true) ? 1 : 0;
}

function setLampStatus(lamp_id, status)
{
    if(lamp_id == Id.FIRST_LAMP)
        FIRST_LAMP_STATUS = status;
    else if(lamp_id == Id.SECOND_LAMP)
        SECOND_LAMP_STATUS = status;
    else if(lamp_id == Id.THIRD_LAMP)
        THIRD_LAMP_STATUS = status;
    else
        console.log("Incorrect Lamp id!");
}
