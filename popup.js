function buildUI_tools(){
	var session = get_session();

    var uni =  get_uni();
    if(uni == 'UOCi'){
        gat = 'EXPIB';
    } else {
        gat = 'EXP';
    }
    var root_url = root_url_ssl+'/tren/trenacc?modul=GAT_'+gat;

	var urls =  {
        final_exped: '.INFCONSULTA/inici',
        final_notas_ec: '.NOTESAVAL/NotesEstudiant.inici',
        final_revision: '.EXASOLREVISION/consrevision.consrevision',
        final_resumen_ec: '.NOTESAVAL/rac.rac&tipus=1',
        final_papeleta: '.PAPERETES/paperetes.paperetes',
        final_estad: '.ESTADNOTES/estadis.inici',
    };

    //Titulos para cada url
    var titles =  {
    	final_exped: 'Expediente antiguo',
        final_notas_ec: 'Resumen de notas',
        final_revision: 'Revisión de exámen',
        final_resumen_ec: 'REC antiguo',
        final_papeleta: 'Notas finales',
        final_estad: 'Estadísticas',
    };

    var text = '<div class="container-fluid resources">';
    var i = -1;
    for (var key in urls) {
        url_key = root_url + urls[key] + '&s=';
        if(i == -1){
        	text += '<div class="row">';
        }
		text += '<div class="col-xs-6 resource" link="'+url_key+'"><a href="#" class="linkResource">'+titles[key]+'</a></div>';
		if(i == 1){
			text += '</div>';
		}
		i = -i;
    }
    text += '</div>';
    return text;
}


function buildUI_classroom(classroom){
	var resources_html = '';
	for(var j in classroom.resources){
		resources_html += buildUI_resource(classroom.resources[j], classroom.code);
	}

	return '<div class="classroom panel panel-warning" classroom="'+classroom.code+'">  \
				<div class="panel-heading container-fluid" '+buildUI_color(classroom)+' data-parent="#classrooms" data-toggle="collapse" data-target="#detail_'+classroom.code+'">	\
					<div class="row">	\
						<div class="col-xs-2">' + buildUI_picture(classroom) + '</div> \
						<div class="col-xs-7">' + classroom.title + '</div> \
						<div class="col-xs-3">' + buildUI_badge(classroom.messages, 'linkAula') + '</div> \
					</div> \
				</div> \
				<div class="panel-body bg-info text-info collapse" id="detail_'+classroom.code+'">  \
						' + buildUI_rac(classroom) + ' \
						<ul class="container-fluid resources"> \
							' + resources_html + ' \
						</ul> \
				</div> \
			</div>';
}

function buildUI_picture(classroom){
	if(classroom.picture){
		return '<img class="foto img-rounded" src="'+classroom.picture+'"/>';
	}
	return "";
}

function buildUI_rac(classroom){
	if(classroom.type != 'TUTORIA'){
		return '<a href="#" class="linkNotas pull-right">Notas</a>';
	}
	return "";
}

function buildUI_color(classroom){
	if(classroom.color){
		return 'style="border-color:#'+classroom.color+'; background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.20) 100%), #'+classroom.color+' no-repeat; color:white;"';
	}
	return "";
}


function buildUI_resource(resource, classroom_code){
	var badge = get_badge(resource.messages);
	if(resource.link != 'undefined'){
		var link = 'link="'+resource.link+'"';
	}
	return '<li class="row resource" '+link+' resource="'+resource.code+'"> \
				<div class="col-xs-2">'+buildUI_badge(resource.messages, 'linkResource') + '</div> \
				<div class="col-xs-10"><a href="#" class="linkResource">'+resource.title+'</a></div> \
			</li>';
}

function buildUI_badge(messages, classes){
	var badge = get_badge(messages);
	return '<a href="#" role="button" class="' + classes + ' badge btn '+badge+'">' + messages + '</a>';
}

function get_badge(messages){
	var critical = get_critical();
	if(isNaN(messages)) return "btn-info";
	if( messages >= critical ) return "btn-danger";
	if( messages > 0 ) return "btn-warning";
	return "btn-success";
}

function show_total_messages(){
	$('#total_messages').addClass(get_badge(Classes.notified_messages))
	$('#total_messages').html(""+Classes.notified_messages)
}

function handleEvents(){

	$('.linkCampus').on('click',function(){
		var url = root_url + '/cgi-bin/uocapp';
		open_tab(url);
	});

	$('.linkAula').on('click',function(){
		var classroom_code = $(this).parents('.classroom').attr('classroom');
		var classroom = Classes.search_code(classroom_code);

		var url = root_url + '/webapps/classroom/'+classroom.template+'/frameset.jsp';
		var data = {domainCode: classroom.code};
		open_tab(url, data);
	});

	$('.linkNotas').on('click',function(){
		var classroom_code = $(this).parents('.classroom').attr('classroom');
		var classroom = Classes.search_code(classroom_code);

		var url = root_url + '/webapps/rac/listEstudiant.action';
		var data = {domainId: classroom.domain};
		open_tab(url, data);
	});

	$('.linkResource').on('click',function(){
		var resource_link = $(this).parents('.resource').attr('link');
		if(resource_link && resource_link != 'undefined'){
			var url = resource_link;
			var data = {};
		} else {
			var resource_code = $(this).parents('.resource').attr('resource');
			var url = root_url + '/cgi-bin/ma_mainMailFS';
			var data = {l: resource_code};
		}
		open_tab(url, data);
	});
}

function open_tab(url, data){
	var session = get_session();
	if(session){
		if(url.indexOf('?') == -1){
			if(!data) data = {};
			data.s = session;
			url += '?'+uri_data(data);
		} else {
			url += session;
		}
		chrome.tabs.create({url : url});
	}
}

function buildUI(){
	//DEBUG
	//check_messages(false);

	var classrooms = Classes.get_notified();
	show_total_messages();

	var visibles = 0;
	var class_html = "";
	for(var i in classrooms){
		class_html += buildUI_classroom(classrooms[i]);
		visibles++;
	}
	$('#classrooms').html(class_html);

	var tools_html = buildUI_tools();
	$('#detail_campus').html(tools_html);

	setTimeout( handleEvents, 100);

	if( !visibles ){
		$('#classrooms').html("<div class='alert'><h4>Atención</h4>No hay aulas visibles. Confirma en la configuración las aulas que quieres visualizar</div>")
		return;
	}
}

$(document).ready(function(){
	session = get_session();
	if(!session){
		$("#classrooms").html("Waiting to log in...");
		return;
	}
	buildUI();
	return;
});
