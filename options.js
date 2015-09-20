$(document).ready(function(){

	populate_options();
	populate_classrooms();

	$('#save_btn').on('click',function(){
		save_options();
		return false;
	});

	$('#purge_btn').on('click',function(){
		purge_classrooms();
		return false;
	});
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
	return '<div class="input-group not_classroom"><span class="input-group-addon" style="background-color:#'+classroom.color+';"> \
			<input class="notify_classroom" type="checkbox" id="'+classroom.code+'" value="'+classroom.code+'" '+checked+'> \
			</span><label for="'+classroom.code+'" class="form-control">'+classroom.title+'</label></div>';
}

function populate_options(){
	var user_save = get_user();
	var uni = get_uni();
	var interval = get_interval();
	var critical = get_critical();
	var notitication = get_notification();
	$('#username').val(user_save.username);
	$('#pwd').val(user_save.password);
	$('#uni').val(uni);
	$('#check_interval').val(interval);
	$('#critical').val(critical);
	if(notification){
		$('#notification').attr('checked','checked');
	}
}

function save_options(){
	save_user($("#username").val(), $("#pwd").val());
	save_uni($("#uni").val());
	save_interval($("#check_interval").val());
	save_critical($("#critical").val());
	var notitication = $("#notification").is(':checked');
	save_notification(notitication);

	//populate_classrooms();
	reset_session(after_save_options);

	$("#status").text(_("Opciones guardadas. Espera a que se actualizen las aulas..."));
	$(".alert").show();
}

function after_save_options() {
	check_messages(after_check_messages);
}

function after_check_messages() {
	$(".alert").hide();
	populate_classrooms();
}

function purge_classrooms(){
	$(".notify_classroom").each(function(){
		var classroom_code = $(this).attr('value');
		var notify = $(this).prop('checked');
		if(!notify) {
			purge_classroom(classroom_code);
		}
	});
	populate_classrooms();
}
