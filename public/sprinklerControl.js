var SPRINKLER_HTML_ITEM     = "sprinklerButton";

var FIRST_SPRINKLER_STATUS  = false;
var SECOND_SPRINKLER_STATUS = false;
var THIRD_SPRINKLER_STATUS  = false;
var FOURTH_SPRINKLER_STATUS = false;

function setSprinkler(sprinkler_id, status)
{
    performSprinklerStatusChange(sprinkler_id, status);
}

function performSprinklerStatusChange(sprinkler_id, status)
{
    var itemHTML = SPRINKLER_HTML_ITEM + sprinkler_id;
    setSprinklerStatus(sprinkler_id, status);
    
    if (document.getElementById(itemHTML) != null)
    {
        if(status == true)
        {
            $("#" + itemHTML).removeClass("btn-danger");
            $("#" + itemHTML).addClass("btn-primary");
            $("#" + itemHTML).find('span').removeClass("glyphicon-off");
            $("#" + itemHTML).find('span').addClass("glyphicon-tint");
            document.getElementById("statDiv").innerHTML = sprinkler_id + ". Sprinkler has ENABLED.";
        }
        else
        {
            $("#" + itemHTML).removeClass("btn-primary");
            $("#" + itemHTML).addClass("btn-danger");
            $("#" + itemHTML).find('span').removeClass("glyphicon-tint");
            $("#" + itemHTML).find('span').addClass("glyphicon-off");
            document.getElementById("statDiv").innerHTML = sprinkler_id + ". Sprinkler has DISABLED.";
        }
    }
    else
    {
        console.log("Sprinkler item has not been created yet!");
    }
}

function getSprinklerStatus(sprinkler_id)
{
    var stat = false;
    if(sprinkler_id == Id.FIRST_SPRINKLER)
        stat = FIRST_SPRINKLER_STATUS;
    else if(sprinkler_id == Id.SECOND_SPRINKLER)
        stat = SECOND_SPRINKLER_STATUS;
    else if(sprinkler_id == Id.THIRD_SPRINKLER)
        stat = THIRD_SPRINKLER_STATUS;
    else if(sprinkler_id == Id.FOURTH_SPRINKLER)
        stat = FOURTH_SPRINKLER_STATUS;  
    return (stat == true) ? 1 : 0;
}

function setSprinklerStatus(sprinkler_id, status)
{
    if(sprinkler_id == Id.FIRST_SPRINKLER)
        FIRST_SPRINKLER_STATUS = status;
    else if(sprinkler_id == Id.SECOND_SPRINKLER)
        SECOND_SPRINKLER_STATUS = status;
    else if(sprinkler_id == Id.THIRD_SPRINKLER)
        THIRD_SPRINKLER_STATUS = status;
    else if(sprinkler_id == Id.FOURTH_SPRINKLER)
        FOURTH_SPRINKLER_STATUS = status;
    else
        console.log("Incorrect Sprinkler id!");
}
