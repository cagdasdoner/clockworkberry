/* Background blocker modal and progress bar control */
function attachModalAndProgress()
{
	$('#myModal').on('show.bs.modal', function(){
		var myModal = $(this);
		clearTimeout(myModal.data('hideInterval'));
		myModal.data('hideInterval', setTimeout(function(){
			myModal.modal('hide');
		}, Consts.SPRINKLER_UI_TOUT));
		
		var cycle  = 40;
		var pace = (Consts.SPRINKLER_UI_TOUT - 1000)/ cycle;
		var index = 0;
		$('#myProgressbar').css("width", "0%");
		var progress = setInterval(function(){
			var $bar = $('#myProgressbar');
			if (index == cycle)
			{
				clearInterval(progress);
				$('.progress').removeClass('active');
				$bar.text("Done!");
			}
			else
			{
				index++;
				var ratio = index * 100 / cycle + "%";
				$bar.css("width", ratio);
				$bar.text("");
			}
		}, pace);
	});
}
