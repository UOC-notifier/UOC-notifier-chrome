$(document).ready(function(){

	populate_options();
	populate_classrooms();

	$('#save_btn').on('click',function(){
		save_options();
		return false;
	});
	$('#version').html(get_version());
});

function populate_classrooms(){
	var classrooms = Classes.get_all();
	var content = "";
	for(var a in classrooms){
		content += populate_classroom(classrooms[a]);
	}
	$("#tclassrooms").html(content);
	$(".notify_classroom").on('click',function(){
		var classroom_code = $(this).attr('value');
		var notify = $(this).prop('checked');
		save_notify_classroom(classroom_code, notify);
	});
	$(".alert").hide();
}

function populate_classroom(classroom){
	var checked = classroom.notify ? "checked" : "";
	var color = classroom.color ? classroom.color : 'faf2cc';
	return '<div class="input-group not_classroom"><span class="input-group-addon" style="background-color:#'+color+';"> \
			<input class="notify_classroom" type="checkbox" id="'+classroom.code+'" value="'+classroom.code+'" '+checked+'> \
			</span><label for="'+classroom.code+'" class="form-control">'+classroom.title+" - "+classroom.get_acronym() + '</label></div>';
}

function populate_options(){
	var option;

	option = get_user();
	$('#username').val(option.username);
	$('#pwd').val(option.password);

	option = get_uni();
	$('#uni').val(option);
	$('#uni').on('change', function(){
		save_uni($(this).val());
	});

	option = get_interval();
	$('#check_interval').val(option);
	$('#check_interval').on('change', function(){
		save_interval($(this).val());
		reset_alarm();
	});

	option = get_critical();
	$('#critical').val(option);
	$('#critical').on('change', function(){
		save_critical($(this).val());
	});

	option = get_notification();
	if (option) {
		$('#notification').attr('checked','checked');
	}
	$('#notification').on('click', function(){
		var ischecked = $('#notification').is(':checked');
		save_notification(ischecked);
	});

	option = get_show_news();
	if (option) {
		$('#show_news').attr('checked','checked');
	}
	$('#show_news').on('click', function(){
		var ischecked = $('#show_news').is(':checked');
		save_show_news(ischecked);
	});

	option = get_show_agenda();
	if (option) {
		$('#show_agenda').attr('checked','checked');
	}
	$('#show_agenda').on('click', function(){
		var ischecked = $('#show_agenda').is(':checked');
		save_show_agenda(ischecked);
	});
}

function save_options(){
	save_user($("#username").val(), $("#pwd").val());
	check_messages(after_check_messages);

	$("#status").text(_("__SAVED_OPTIONS__"));
	$(".alert").show();
}

function after_check_messages() {
	$(".alert").hide();
	populate_classrooms();
}