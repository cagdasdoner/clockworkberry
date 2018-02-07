var SPRINKLER_TIMER_HTML_ID      = "timerId";
var SPRINKLER_TIMER_HTML_DIV     = "setTimerDiv";
var DATETIMEPICKER_HTML_ID       = "datetimepicker";
var INTERVAL_SPINNER_HTML_ID     = "intervalspinner"

var disabledTimerDiv1 = true;
var disabledTimerDiv2 = true;
var disabledTimerDiv3 = true;
var disabledTimerDiv4 = true;

function setSprinklerTimer(timer_item, item_id, timer_data, interval)
{
    if(timer_item == Message.SPRINKLER_HEADER)
    {
        performTimerSprinklerStatusChange(item_id, timer_data, interval);
    }
}

function performTimerSprinklerStatusChange(sprinkler_id, timer_data, interval)
{
    var itemHTML = SPRINKLER_TIMER_HTML_ID + sprinkler_id;
    var itemDivHTML = SPRINKLER_TIMER_HTML_DIV + sprinkler_id;
    var itemPickerHTML = DATETIMEPICKER_HTML_ID + sprinkler_id;
    var itemSpinnerHTML = INTERVAL_SPINNER_HTML_ID + sprinkler_id;
    if (document.getElementById(itemHTML) != null &&
        document.getElementById(itemDivHTML) != null &&
        document.getElementById(itemPickerHTML) != null)
    {
        if(timer_data == Message.DATA_STOP)
        {
            $("#" + itemHTML).find('span').html(" Off");
            $("#" + itemDivHTML).hide();
            $("#" + itemHTML).removeClass("btn-success");
            $("#" + itemHTML).addClass("btn-danger");

            $("#" + itemSpinnerHTML).css('color','black');
            document.getElementById("statDiv").innerHTML = "Timer was DISABLED on " + sprinkler_id + ". Sprinkler.";
            setTimerDivDisabled(sprinkler_id, true);
        }
        else if(moment(timer_data,Consts.TIMEPICKER_FORMAT, true).isValid())
        {
            $("#" + itemHTML).find('span').html(" On");
            $("#" + itemDivHTML).show();
            $("#" + itemHTML).removeClass("btn-danger");
            $("#" + itemHTML).addClass("btn-success");
            $("#" + itemPickerHTML).data("DateTimePicker").date(timer_data);

            $("#" + itemSpinnerHTML).css('color','green');
            $("#" + itemSpinnerHTML).val(interval);
            setTimerDivDisabled(sprinkler_id, false);
            document.getElementById("statDiv").innerHTML = "Timer was ENABLED on " + sprinkler_id +". Sprinkler @ " + timer_data;
        }
        else
        {
            console.log("Not a valid timer data provided!");
        }
    }
    else
    {
        console.log("Sprinkler Timer Items has not been created yet!");
    }
}

function setTimerDivDisabled(item_id, status)
{
    if(item_id == Id.FIRST_SPRINKLER)
        disabledTimerDiv1 = status;
    else if(item_id == Id.SECOND_SPRINKLER)
        disabledTimerDiv2 = status;
    else if(item_id == Id.THIRD_SPRINKLER)
        disabledTimerDiv3 = status;
    else if(item_id == Id.FOURTH_SPRINKLER)
        disabledTimerDiv4 = status;  
}

function getTimerDivDisabled(item_id)
{
    var status = false;
    if(item_id == Id.FIRST_SPRINKLER)
        status = disabledTimerDiv1;
    else if(item_id == Id.SECOND_SPRINKLER)
        status = disabledTimerDiv2;
    else if(item_id == Id.THIRD_SPRINKLER)
        status = disabledTimerDiv3;
    else if(item_id == Id.FOURTH_SPRINKLER)
        status = disabledTimerDiv4;
        
    return status;
}

function initializeTimerHTMLElements()
{
    for(item_id = Id.FIRST_SPRINKLER; item_id <= ItemCount.SPRINKLERS; ++item_id)
    {
        var itemHTML = SPRINKLER_TIMER_HTML_DIV + item_id;
        $("#" + itemHTML).hide();
    }
}

function registerTimerHTMLEvents()
{
    for(item_id = Id.FIRST_SPRINKLER; item_id <= ItemCount.SPRINKLERS; ++item_id)
    {
        var itemHTML = SPRINKLER_TIMER_HTML_ID + item_id;
        if (document.getElementById(itemHTML) != null)
        {
           /* Timer Button Activities */
           var buttonItem = document.getElementById(itemHTML);
           if (typeof window.addEventListener === 'function')
           {
               (function (_buttonItem, _item_id)
               {
                    _buttonItem.addEventListener('click', function(){
                        var itemDivHTML = SPRINKLER_TIMER_HTML_DIV + _item_id;
                        var itemPickerHTML = DATETIMEPICKER_HTML_ID + _item_id;
                        if(getTimerDivDisabled(_item_id) === true)
                        {
                            $("#" + itemDivHTML).show();
                            $("#" + itemPickerHTML).data("DateTimePicker").show();
                            setTimerDivDisabled(_item_id, false);
                        }
                        else
                        {
                            setTimerDivDisabled(_item_id, true);
                            $("#" + itemDivHTML).hide();
                            $("#" + itemPickerHTML).data("DateTimePicker").clear();
                        }
                    });
                })(buttonItem, item_id);
            }
        }
        
        var itemPickerHTML = DATETIMEPICKER_HTML_ID + item_id;
        if (document.getElementById(itemPickerHTML) != null)
        {
            /* DateTimePicker JS activities */
            var datepickerItem = document.getElementById(itemPickerHTML);
            if (typeof window.addEventListener === 'function')
            {
                (function (_datepickerItem, _item_id)
                {
                    var dp = $(_datepickerItem).datetimepicker({
                        viewDate : false,
                        format : Consts.TIMEPICKER_FORMAT,
                        showClose : true,
                        showClear : true,
                        focusOnShow : false,
                        stepping : Consts.TIMEPICKER_STEPPING,
                        icons: {
                            close: "glyphicon glyphicon-ok"
                        },
                        widgetPositioning : {
                            horizontal : "left"
                        }
                    })
                    .on('dp.change', dateChanged)
                    .on('dp.hide', inputHide)
                    .on('dp.show', inputShow);
                    
                    var selectedValidDate = "";
                    function dateChanged(p)
                    {
                        if(p.date)
                        {
                            selectedValidDate = moment(p.date).format(Consts.TIMEPICKER_FORMAT);
                        }
                        else
                        {
                            console.log("change > Invalid date item!");
                            selectedValidDate = "";
                            $(_datepickerItem).data("DateTimePicker").hide();
                            sendSprinklerTimerStatus(_item_id, Message.DATA_STOP, 
                                $("#" + INTERVAL_SPINNER_HTML_ID + _item_id).val());
                            $('#myModal').modal('toggle');
                        }
                    }
                    function inputHide(p)
                    {    
                        if(selectedValidDate != "")
                        {
                            console.log("inputHide > set timer to : " + selectedValidDate.toString());
                            
                            sendSprinklerTimerStatus(_item_id, selectedValidDate.toString(), 
                                $("#" + INTERVAL_SPINNER_HTML_ID + _item_id).val());
                            $("#" + INTERVAL_SPINNER_HTML_ID + _item_id).parent().show();
                            $("#" + INTERVAL_SPINNER_HTML_ID + _item_id).css('color','green');
                            $('#myModal').modal('toggle');
                        }
                        else
                        {
                            console.log("selectedValidDate is Invalid. Stop timer if it is running!");
                        }
                    }
                    function inputShow(p)
                    {    
                        $("#" + INTERVAL_SPINNER_HTML_ID + _item_id).css('color','black');
                        $("#" + INTERVAL_SPINNER_HTML_ID + _item_id).parent().hide();
                    }
                })(datepickerItem, item_id);
            }
        }
        
        var spinnerHTML = INTERVAL_SPINNER_HTML_ID + item_id;
        if (document.getElementById(spinnerHTML) != null)
        {
           /* Timer Button Activities */
           var spinnerItem = document.getElementById(spinnerHTML);
           if (typeof window.addEventListener === 'function')
           {
               (function (_spinnerItem, _item_id)
               {    
                    $(_spinnerItem).TouchSpin({
                        step:15,
                        min:15,
                        max:720,
                        postfix: "min.",
                        postfix_extraclass:"small"
                    });
                    $(_spinnerItem).on("touchspin.on.stopspin", function(){
                        var itemPickerHTML = DATETIMEPICKER_HTML_ID + _item_id;
                        var selectedTime = moment($("#" + itemPickerHTML).data("DateTimePicker").date()).
                            format(Consts.TIMEPICKER_FORMAT).toString();
                        console.log(selectedTime);
                        sendSprinklerTimerStatus(_item_id, selectedTime, 
                            $("#" + INTERVAL_SPINNER_HTML_ID + _item_id).val());
                        $('#myModal').modal('toggle');
                    });
                })(spinnerItem, item_id);
            }
        }
    }
}
