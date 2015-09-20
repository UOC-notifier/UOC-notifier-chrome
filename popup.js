function buildUI_tools(){
	var session = get_session();

    var uni =  get_uni();
    if(uni == 'UOCi'){
        gat = 'EXPIB';
    } else {
        gat = 'EXP';
    }
    var root_url_gate = root_url_ssl+'/tren/trenacc?modul=GAT_'+gat;

    var urls = new Array();
    //urls.push({url: '.INFCONSULTA/inici', title: _('Expediente antiguo (no funciona)')});
    //urls.push({url: '.NOTESAVAL/rac.rac&tipus=1', title: _('REC antiguo (no funciona)')});
    urls.push({url: '.NOTESAVAL/NotesEstudiant.inici', title: _('Resumen de notas')});
    urls.push({url: '.EXASOLREVISION/consrevision.consrevision', title: _('Rev. de exámen')});
    urls.push({url: '.PAPERETES/paperetes.paperetes', title: _('Notas finales')});
    urls.push({url: '.ESTADNOTES/estadis.inici', title: _('Estadísticas')});
    urls.push({url: '.MATPREMATRICULA/inici', title: _('Prop. Matric')});
    urls.push({url: '.MATMATRICULA/inici', title: _('Matrícula')});
    urls.push({url: '.NOTAS_SMS', title: _('Notas por SMS')});

    var text = '<div class="container-fluid resources">';
    var par = -1;
    var link;
    for (var x in urls) {
        link = root_url_gate + urls[x].url + '&s=';
		text += get_general_link(link, urls[x].title, par);
		par = -par;
    }
    // New expedient
	link = root_url + '/webapps/seleccioexpedient/cerca.html?s=';
	text += get_general_link(link, _('Expediente'), par);
	par = -par;

	link = root_url + '/webapps/classroom/081_common/jsp/calendari_semestral.jsp?appId=UOC&idLang=a&assignment=ESTUDIANT&domainPontCode=sem_pont&s='
	text += get_general_link(link, _('Agenda antigua'), par);
	par = -par;

	link = root_url + '/app/guaita/calendari?perfil=estudiant&s='
	text += get_general_link(link, _('Agenda nueva'), par);
	par = -par;

    text += '</div>';
    return text;
}

function get_general_link(link, title, par){
	var ret = "";
	if(par == -1){
    	ret += '<div class="row">';
    }
	ret += '<div class="col-xs-6 resource" link="'+link+'"><a href="#" class="linkResource">'+title+'</a></div>';
	if(par == 1){
		ret += '</div>';
	}
	return ret;
}


function buildUI_classroom(classroom){
	var content = '<div class="classroom panel panel-warning" classroom="'+classroom.code+'">  \
				<div class="panel-heading container-fluid" '+buildUI_color(classroom)+' data-parent="#classrooms" data-toggle="collapse" data-target="#detail_'+classroom.code+'">	\
					<div class="row">';

	var title = classroom.title;
	var classcode = classroom.get_class_code();
	if (classcode) {
		title += ' ('+classroom.get_class_code()+')';
	}
	content += '<div class="col-xs-9">' + title + '</div> \
						<div class="col-xs-3">' + buildUI_badge(classroom.messages, 'linkAula', '-', _('Ir al aula')) + '</div> \
					</div> \
				</div>'+ buildUI_classroom_resources(classroom) +' \
			</div>';
	return content;
}

function buildUI_classroom_resources(classroom) {
	var resources_html = '';
	for(var j in classroom.resources){
		resources_html += buildUI_resource(classroom.resources[j], classroom.code);
	}
	return '<div class="panel-body bg-info text-info collapse" id="detail_'+classroom.code+'">  \
				' + buildUI_rac(classroom) + ' \
				<ul class="container-fluid resources"> \
					' + resources_html + ' \
				</ul> \
				'+ buildUI_classroom_events(classroom) +' \
		</div>';
}

function buildUI_classroom_events(classroom) {
	if (classroom.events.length == 0) {
		return "";
	}
	var events_html = '';
	for(var j in classroom.events){
		events_html += buildUI_event(classroom.events[j], classroom.code);
	}
	return '<table class="table table-condensed events" id="events_'+classroom.code+'">  \
			<thead><tr><th></th><th>'+_('Inicio')+'</th><th>'+_('Fin')+'</th><th>'+_('Solución')+'</th><th>'+_('Nota')+'</th></tr></thead>\
			<tbody>' + events_html + ' </tbody>\
		</table>';
}

function buildUI_event(ev, classroom_code){
	if(ev.link != 'undefined'){
		var link = 'link="'+ev.link+'"';
	}

	var eventstate = "";
	if (isBeforeToday(ev.start) || isToday(ev.start)) {
		if (isBeforeToday(ev.end)) {
			console.log(ev.start, ev.end)
			eventstate = ' success';
		} else {
			eventstate = ' warning';
		}
	}
	var dstart = buildUI_eventdate(ev.start, "");

	if (ev.committed && (!isBeforeToday(ev.end))) {
		var dend = buildUI_eventdate(ev.end, "end", '<span class="glyphicon glyphicon-ok" aria-hidden="true" title="'+_('Entregado')+'"></span>');
	} else if (!ev.committed && isBeforeToday(ev.end)) {
		var dend = buildUI_eventtext('<span class="glyphicon glyphicon-remove" aria-hidden="true" title="'+_('Entregado')+'"></span>', "text-danger");
	} else {
		var dend = buildUI_eventdate(ev.end, "end");
	}
	var dgrade = ev.grade != false ? buildUI_eventtext(ev.grade, "graded"): buildUI_eventdate(ev.grading, "");
	var dsol = buildUI_eventdate(ev.solution, "");
	return '<tr class="event'+eventstate+'" '+link+'"> \
				<td class="name"><a href="#" class="linkEvent">'+ev.name+'</a></td> \
				'+dstart+dend+dsol+dgrade+'</tr>';
}

function buildUI_eventdate(d, clas, append) {
	if (d) {
		dsplit = d.split('/');
		fdate = dsplit[0]+'/'+dsplit[1];
		if (isBeforeToday(d)) {
			clas += " text-success";
			fdate = '<span class="glyphicon glyphicon-ok" aria-hidden="true" title="'+fdate+'"></span>';
		} else if (isToday(d)) {
			clas += " today";
		}
	} else {
		fdate = '-';
	}
	return buildUI_eventtext(fdate, clas, append);
}

function buildUI_eventtext(text, clas, append) {
	if (!append) {
		append = "";
	}
	return '<td><a href="#" class="linkEvent '+clas+'">'+text+append+'</a></td>';
}


function buildUI_news(){
	if($('#detail_news').html() == "") {
		/*session = get_session();
		if(!session) return "";

		var libs = '/rb/inici/javascripts/prototype.js,/rb/inici/javascripts/effects.js,/rb/inici/javascripts/application.js,/rb/inici/javascripts/prefs.js,%2Frb%2Finici%2Fuser_modul%2Flibrary%2F944751.js';
		var src = 'http://cv.uoc.edu/webapps/widgetsUOC/widgetsGetURLNovetatsExternesWithProviderServlet??up_isNoticiesInstitucionals=false&up_title=Novetats%2520i%2520noticies&up_maximized=true&up_maxDestacades=2&up_showImages=true&up_slide=false&up_sortable=true&up_ck=nee&up_rssUrlServiceProviderHTML=%252Festudiant%252F_resources%252Fjs%252Fopencms_estudiant_widget_nou.js&up_maxAltres=5&up_rssUrlServiceProvider=%252Festudiant%252F_resources%252Fjs%252Fopencms_estudiant.js&up_fxml=html&up_target=noticies.jsp&libs='+libs+'&fromCampus=true&lang=ca&country=ES&color=&userType=UOC-ESTUDIANT-gr06-a&hp_theme=false&s='+session;
		var text = '<iframe src="'+src+'"></iframe>';*/
		var text = retrieve_news();
	}
}

function buildUI_agenda(){
	if($('#detail_agenda iframe').length == 0) {
		session = get_session();
		if(!session) return "";

		var api = 'http%253A%252F%252Fcv.uoc.edu%252Fwebapps%252FAgenda%252FAgendaServlet%253Foperacion%253Dical';
		var libs = '/rb/inici/javascripts/prototype.js,/rb/inici/javascripts/effects.js,/rb/inici/javascripts/application.js,/rb/inici/javascripts/prefs.js,%2Frb%2Finici%2Fuser_modul%2Flibrary%2F944745.js%3Ffeatures%3Dlibrary%3Asetprefs%3Adynamic-height';
		var src = 'http://cv.uoc.edu/webapps/widgetsUOC/widgetsIcalServlet?up_items=7&up_icalUrlServiceAPI='+api+'&up_targetMonth=agMonthlyView.jsp&up_target=agDailyView.jsp&libs='+libs+'&s='+session;
		var text = '<iframe src="'+src+'"></iframe>';
		$('#detail_agenda').html(text);
	}
}

function buildUI_rac(classroom){
	if(classroom.type != 'TUTORIA'){
		return '<div class="btn-group btn-group-sm pull-left" role="group">\
			<button type="button" class="linkEstads btn btn-warning" aria-label="'+_('Estadísticas')+'" title="'+_('Entregado')+'">\
		    	<span class="glyphicon glyphicon-stats" aria-hidden="true"></span>\
		  	</button>\
		  	<button type="button" class="linkMaterials btn btn-info" aria-label="'+_('Materiales')+'" title="'+_('Materiales')+'">\
		    	<span class="glyphicon glyphicon-book" aria-hidden="true"></span>\
		  	</button>\
		  	<button type="button" class="linkDocent btn btn-primary" aria-label="'+_('Plan Docente')+'" title="'+_('Plan Docente')+'">\
		    	<span class="glyphicon glyphicon-blackboard" aria-hidden="true"></span>\
		  	</button>\
		</div>\
		<div class="pull-right"><button type="button" class="linkNotas btn-sm btn btn-primary">\
	    	<span class="glyphicon glyphicon-dashboard" aria-hidden="true"></span> ' + _('Notas') +'\
	  	</button></div>';
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
				<div class="col-xs-8"><a href="#" class="linkResource">'+resource.title+'</a></div> \
				<div class="col-xs-4">'+buildUI_badge(resource.messages, 'linkResource', resource.all_messages, _('Ir al recurso')) + '</div> \
			</li>';
}

function buildUI_badge(messages, classes, allmessages, title){
	var badge = get_badge(messages);
	if (!isNaN(allmessages)) {
		return '<div class="btn-group btn-group-justified btn-group-xs ' + classes + '" role="group"> \
					<div class="btn-group btn-group-xs" role="group"><button type="button" class="btn '+badge+' button_details" title="'+title+'">' + messages + '</button></div> \
		  			<div class="btn-group btn-group-xs" role="group"><button type="button" class="btn '+badge+' button_details" title="'+title+'">' + allmessages + '</button></div> \
				</div>';
	} else {
		return '<button type="button" class="' + classes + ' btn btn-xs '+badge+' button_details btn-group-justified" title="'+title+'">'+messages+'</button>';
	}
}

function get_badge(messages){
	var critical = get_critical();
	if(isNaN(messages)) return "btn-info";
	if( messages == 0) return "btn-success";
	if( messages >= critical) return "btn-danger";
	return "btn-warning";

}

function show_total_messages(){
	$('#total_messages_button').addClass(get_badge(Classes.notified_messages))
	$('#total_messages').html(""+Classes.notified_messages)
}

function handleEvents(){
	$('.linkCampus').unbind( "click" );
	$('.linkCampus').click(function(){
		var url = root_url + '/cgi-bin/uocapp';
		open_tab(url);
	});

	$('.linkAula').unbind( "click" );
	$('.linkAula').click(function(){
		var classroom_code = $(this).parents('.classroom').attr('classroom');
		var classroom = Classes.search_code(classroom_code);

		var url = root_url + '/webapps/classroom/'+classroom.template+'/frameset.jsp';
		var data = {domainCode: classroom.code};
		open_tab(url, data);
	});

	$('.linkNotas').unbind( "click" );
	$('.linkNotas').click(function(){
		var classroom_code = $(this).parents('.classroom').attr('classroom');
		var classroom = Classes.search_code(classroom_code);

		var url = root_url + '/webapps/rac/listEstudiant.action';
		var data = {domainId: classroom.domain};
		open_tab(url, data);
	});

	$('.linkEstads').unbind( "click" );
	$('.linkEstads').click(function(){
		var classroom_code = $(this).parents('.classroom').attr('classroom');
		var classroom = Classes.search_code(classroom_code);
		var url = root_url + '/tren/trenacc';
		var data = {modul: 'GAT_EXP.ESTADNOTES/estadis.assignatures',
					assig: classroom.get_subject_code(),
					pAnyAcademic: anyAcad};
		open_tab(url, data);
	});

	$('.linkDocent').unbind( "click" );
	$('.linkDocent').click(function(){
		var classroom_code = $(this).parents('.classroom').attr('classroom');
		var classroom = Classes.search_code(classroom_code);
		var url = root_url + '/webapps/classroom/download.do';
		var data = {nav: 'pladocent',
					domainId: classroom.domain,
					format: 'html',
					app: 'aulaca',
					precarrega: false
				};
		open_tab(url, data);
	});

	$('.linkMaterials').unbind( "click" );
	$('.linkMaterials').click(function(){
		var classroom_code = $(this).parents('.classroom').attr('classroom');
		var classroom = Classes.search_code(classroom_code);
		var url = root_url + '/webapps/classroom/student.do';
		var data = {nav: 'recursos-estudiant',
					domainId: classroom.domain,
					domainCode: classroom.code};
		open_tab(url, data);
	});

	$('.linkResource').unbind( "click" );
	$('.linkResource').click(function(){
		var link = $(this).parents('.resource').attr('link');
		if(link && link != 'undefined'){
			var url = link;
			var data = {};
		} else {
			var code = $(this).parents('.resource').attr('resource');
			var url = root_url + '/cgi-bin/ma_mainMailFS';
			var data = {l: code};
		}
		open_tab(url, data);
	});

	$('.linkEvent').unbind( "click" );
	$('.linkEvent').click(function(){
		var link = $(this).parents('.event').attr('link');
		if(link && link != 'undefined'){
			var url = link;
			var data = {};
			open_tab(url, data);
		}
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
	//check_messages();

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

	$('#button_news').click(buildUI_news);
	$('#button_agenda').click(buildUI_agenda);

	setTimeout( handleEvents, 100);

	$('.update').click( function() {
		check_messages(buildUI);
	});


	if( !visibles ){
		$('#classrooms').html("<div class='alert'><h4>"+_('Atención')+"</h4>"+_('No hay aulas visibles. Confirma en la configuración las aulas que quieres visualizar')+"</div>")
		return;
	}

	$('.details').collapse({toggle: false});
	$('.button_details').click( function () {
		var val = this.value;
		$('.button_details:not(#button_'+val+')').removeClass('active');
		if ( $(this).hasClass('active') ){
			// Does not have active class yet
			$('.details').collapse('hide');
	   	} else {
			$('.details:not(#detail_'+val+')').collapse('hide');
	   		$('#detail_'+val).collapse('show');
	   	}
	});
}

$(document).ready(function(){
	var user_save = get_user();
	if(user_save.username && user_save.password){
		session = get_session();
		if(!session){
			$("#classrooms").html('<div class="container-fluid"><div class="alert alert-danger">'+_('Esperando a entrar... Si el mensaje no desaparece puede que el usuari y password sean incorrectos.')+'</div></div>');
			check_messages(buildUI);
			return;
		}
		buildUI();
		return;
	} else {
		$("#classrooms").html('<div class="container-fluid"><div class="alert alert-danger">'+_('No hay usuario y password...')+'</div></div>');
		chrome.tabs.create({ url: "options.html" });
	}
});


// Disable alerts
window.alert = function ( text ) { console.log( 'ALERT: ' + text ); return true; };
