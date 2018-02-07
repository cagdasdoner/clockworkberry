
function setWindow(window_id, action)
{
    console.log(window_id + ". Window is gonna " + action);
    document.getElementById("statDiv").innerHTML = window_id + ". Window is gonna " + action;
}
