function buildUI_tools(){
	if ($('#detail_campus').html() == "") {
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
	    urls.push({url: '.NOTESAVAL/NotesEstudiant.inici', title: _('__GRADE_RESUME__')});
	    urls.push({url: '.EXASOLREVISION/consrevision.consrevision', title: _('__EXAM_REVISION__')});
	    urls.push({url: '.PAPERETES/paperetes.paperetes', title: _('__FINAL_GRADES__')});
	    urls.push({url: '.ESTADNOTES/estadis.inici', title: _('__STATS__')});
	    urls.push({url: '.MATPREMATRICULA/inici', title: _('__ENROLL_PROP__')});
	    urls.push({url: '.MATMATRICULA/inici', title: _('__ENROLL__')});
	    urls.push({url: '.NOTAS_SMS', title: _('__GRADES_SMS__')});

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
		text += get_general_link(link, _('__EXPEDIENT__'), par);
		par = -par;

		var domainId = "";
		var classrooms = Classes.get_notified();
		for(var i in classrooms){
			if (classrooms[i].domain) {
				domainId = "&domainId=" + classrooms[i].domain;
				break;
			}
		}
		link = root_url + '/webapps/classroom/081_common/jsp/calendari_semestral.jsp?appId=UOC&idLang=a&assignment=ESTUDIANT&domainPontCode=sem_pont'+domainId+'&s='
		text += get_general_link(link, _('__OLD_AGENDA__'), par);
		par = -par;

		link = root_url + '/app/guaita/calendari?perfil=estudiant&s='
		text += get_general_link(link, _('__NEW_AGENDA__'), par);
		par = -par;

	    text += '</div>';
	    $('#detail_campus').html(text);

	    $('.linkResource').unbind( "click" );
		$('.linkResource').click(function(){
			var link = $(this).parents('.resource').attr('link');
			if(link && link != 'undefined'){
				var url = link;
				var data = {};
			} else {
				var code = $(this).parents('.resource').attr('resource');
				var url = root_url + '/webapps/bustiaca/listMails.do';
				var data = {l: code};
			}
			open_tab(url, data);
		});
	}
}

function buildUI_pacs(force) {
	if(force != undefined || $('#detail_pacs').html() == "") {
		var text = "";

		var classrooms = Classes.get_notified();
		var events = new Array();
		for(var i in classrooms){
			var classroom = classrooms[i];
			if (classroom.events.length > 0 ) {
				for(var j in classroom.events){
					classroom.events[j].subject = classroom.get_acronym();
					events.push(classroom.events[j]);
				}
			}
		}


		if (events.length > 0) {
			var sorting = get_sorting();
			if (sorting == 'end') {
				events.sort(function(a, b){
					return compareDates(a.end, b.end);
				});
			} else {
				events.sort(function(a, b){
					return compareDates(a.start, b.start);
				});
			}

			text = '<table class="table table-condensed events" id="events_'+classroom.code+'">  \
				<thead><tr><th></th><th by="start" class="sort_pacs">'+_('__START__')+'</th><th by="end" class="sort_pacs">'+_('__END__')+'</th></tr></thead>\
				<tbody>';
			for (var i in events) {
				text += buildUI_pacs_events(events[i]);
			}
			text += '</tbody></table>';
		}
	   	$('#detail_pacs').html(text);

	   	$('.linkEvent').unbind( "click" );
		$('.linkEvent').click(function(){
			var link = $(this).parents('.event').attr('link');
			if(link && link != 'undefined'){
				var url = link;
				var data = {};
				open_tab(url, data);
			}
		});

		$('.sort_pacs').unbind( "click" );
		$('.sort_pacs').click(function(){
			var sorting = $(this).attr('by');
			save_sorting(sorting);
			buildUI_pacs(true);
		});
	}
}

function buildUI_pacs_events(ev) {
	if(ev.link != 'undefined'){
		var link = 'link="'+ev.link+'"';
	}

	var eventstate = "";
	if (ev.has_started()) {
		if (ev.has_ended()) {
			return "";
		} else {
			eventstate = ' warning';
		}
	}
	var dstart = buildUI_eventdate(ev.start, "");

	if (ev.committed && !ev.has_ended()) {
		var dend = buildUI_eventdate(ev.end, "end", '<span class="glyphicon glyphicon-ok" aria-hidden="true" title="'+_('__COMMITTED__')+'"></span>');
	} else if (!ev.committed && ev.has_ended()) {
		var dend = buildUI_eventtext('<span class="glyphicon glyphicon-remove" aria-hidden="true" title="'+_('__COMMITTED__')+'"></span>', "text-danger");
	} else {
		var dend = buildUI_eventdate(ev.end, "end");
	}
	return '<tr class="event'+eventstate+'" '+link+'"> \
				<td class="name"><a href="#" class="linkEvent">'+ev.subject+' - '+ev.name+'</a></td>'+dstart+dend+'</tr>';
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
	if (classroom.aula) {
		title += ' ('+classroom.aula+')';
	}
	content += '<div class="col-xs-9">' + title + '</div> \
						<div class="col-xs-3">' + buildUI_badge(classroom.messages, 'linkAula', '-', _('__GOTO_CLASS__')) + '</div> \
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
		events_html += buildUI_event(classroom.events[j]);
	}
	return '<table class="table table-condensed events" id="events_'+classroom.code+'">  \
			<thead><tr><th></th><th>'+_('__START__')+'</th><th>'+_('__END__')+'</th><th>'+_('__SOLUTION__')+'</th><th>'+_('__GRADE__')+'</th></tr></thead>\
			<tbody>' + events_html + ' </tbody>\
		</table>';
}

function buildUI_event(ev){
	if(ev.link != 'undefined'){
		var link = 'link="'+ev.link+'"';
	}

	var eventstate = "";
	if (ev.has_started()) {
		if (ev.has_ended()) {
			eventstate = ' success';
		} else {
			eventstate = ' warning';
		}
	}
	var dstart = buildUI_eventdate(ev.start, "");

	if (ev.committed && !ev.has_ended()) {
		var dend = buildUI_eventdate(ev.end, "end", '<span class="glyphicon glyphicon-ok" aria-hidden="true" title="'+_('__COMMITTED__')+'"></span>');
	} else if (!ev.committed && ev.has_ended()) {
		var dend = buildUI_eventtext('<span class="glyphicon glyphicon-remove" aria-hidden="true" title="'+_('__COMMITTED__')+'"></span>', "text-danger");
	} else {
		var dend = buildUI_eventdate(ev.end, "end");
	}
	var dgrade = ev.graded ? buildUI_eventtext(ev.graded, "graded"): buildUI_eventdate(ev.grading, "");
	var dsol = buildUI_eventdate(ev.solution, "");
	return '<tr class="event'+eventstate+'" '+link+'"> \
				<td class="name"><a href="#" class="linkEvent">'+ev.name+'</a></td>'+dstart+dend+dsol+dgrade+'</tr>';
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
		/*
		if(!Session.get()) {
			return false;
		}

		var libs = '/rb/inici/javascripts/prototype.js,/rb/inici/javascripts/effects.js,/rb/inici/javascripts/application.js,/rb/inici/javascripts/prefs.js,%2Frb%2Finici%2Fuser_modul%2Flibrary%2F944751.js';
		var src = 'http://cv.uoc.edu/webapps/widgetsUOC/widgetsGetURLNovetatsExternesWithProviderServlet??up_isNoticiesInstitucionals=false&up_title=Novetats%2520i%2520noticies&up_maximized=true&up_maxDestacades=2&up_showImages=true&up_slide=false&up_sortable=true&up_ck=nee&up_rssUrlServiceProviderHTML=%252Festudiant%252F_resources%252Fjs%252Fopencms_estudiant_widget_nou.js&up_maxAltres=5&up_rssUrlServiceProvider=%252Festudiant%252F_resources%252Fjs%252Fopencms_estudiant.js&up_fxml=html&up_target=noticies.jsp&libs='+libs+'&fromCampus=true&lang=ca&country=ES&color=&userType=UOC-ESTUDIANT-gr06-a&hp_theme=false&s='+session;
		$('#detail_news').html('<iframe src="'+src+'"></iframe>');*/
		retrieve_news();
	}
}

function buildUI_agenda(){
	if($('#detail_agenda iframe').length == 0) {
		session = Session.get();
		if(!session) {
			return;
		}

		var api = 'http%253A%252F%252Fcv.uoc.edu%252Fwebapps%252FAgenda%252FAgendaServlet%253Foperacion%253Dical';
		var libs = '/rb/inici/javascripts/prototype.js,/rb/inici/javascripts/effects.js,/rb/inici/javascripts/application.js,/rb/inici/javascripts/prefs.js,%2Frb%2Finici%2Fuser_modul%2Flibrary%2F944745.js%3Ffeatures%3Dlibrary%3Asetprefs%3Adynamic-height';
		var src = 'http://cv.uoc.edu/webapps/widgetsUOC/widgetsIcalServlet?up_items=7&up_icalUrlServiceAPI='+api+'&up_targetMonth=agMonthlyView.jsp&up_target=agDailyView.jsp&libs='+libs+'&s='+session;
		$('#detail_agenda').html('<iframe src="'+src+'"></iframe>');
	}
}

function buildUI_rac(classroom){
	var buttons = "";
	var text = "";
	if(classroom.type != 'TUTORIA'){
		buttons += '<button type="button" class="linkEstads btn btn-warning" aria-label="'+_('__STATS__')+'" title="'+_('__STATS__')+'">\
	    	<span class="glyphicon glyphicon-stats" aria-hidden="true"></span>\
	  	</button>\
	  	<button type="button" class="linkMaterials btn btn-info" aria-label="'+_('__EQUIPMENT__')+'" title="'+_('__EQUIPMENT__')+'">\
	    	<span class="glyphicon glyphicon-book" aria-hidden="true"></span>\
	  	</button>\
	  	<button type="button" class="linkDocent btn btn-primary" aria-label="'+_('__TEACHING_PLAN__')+'" title="'+_('__TEACHING_PLAN__')+'">\
	    	<span class="glyphicon glyphicon-blackboard" aria-hidden="true"></span>\
	  	</button>';
	}

	if (classroom.consultor) {
		var title = _('__TEACHER__')+': '+classroom.consultor;
		if (classroom.consultorlastviewed) {
			title += "\n"+_('__VIEWED_LAST_TIME__', [getDate(classroom.consultorlastviewed), getTime(classroom.consultorlastviewed)]);
		}
		if (classroom.consultormail) {
			var img = "envelope";
			var mail = 'mail="'+classroom.consultormail+'"';
		} else {
			var img = "user";
			var mail = "";
		}
	  	buttons +=  '<button type="button" class="linkMail btn btn-success" '+mail+' aria-label="'+title+'" title="'+title+'">\
	    	<span class="glyphicon glyphicon-'+img+'" aria-hidden="true"></span>\
	  	</button>';
	}

  	if (buttons.length > 0) {
  		text += '<div class="btn-group btn-group-sm pull-left" role="group">'+buttons+'</div>';
  	}

  	if(classroom.type != 'TUTORIA'){
		text += '<div class="pull-right"><button type="button" class="linkNotas btn-sm btn btn-primary">\
	    	<span class="glyphicon glyphicon-dashboard" aria-hidden="true"></span> ' + _('__GRADES__') +'</button></div>';
    }
  	return text;
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
	if (resource.has_message_count()) {
		return '<li class="row resource" '+link+' resource="'+resource.code+'"> \
					<div class="col-xs-8"><a href="#" class="linkResource">'+resource.title+'</a></div> \
					<div class="col-xs-4">'+buildUI_badge(resource.messages, 'linkResource', resource.all_messages, _('__GOTO_RES__')) + '</div> \
				</li>';
	} else {
		return '<li class="resource" '+link+' resource="'+resource.code+'"><a href="#" class="linkResource">'+resource.title+'</a></li>';
	}
}

function buildUI_badge(messages, classes, allmessages, title){
	var badge = get_badge(messages);
	if (!isNaN(allmessages)) {
		return '<div class="btn-group btn-group-justified btn-group-xs ' + classes + '" role="group"> \
					<div class="btn-group btn-group-xs" role="group"><button type="button" class="btn '+badge+'" title="'+title+'">' + messages + '</button></div> \
		  			<div class="btn-group btn-group-xs" role="group"><button type="button" class="btn '+badge+'" title="'+title+'">' + allmessages + '</button></div> \
				</div>';
	} else {
		return '<button type="button" class="' + classes + ' btn btn-xs '+badge+' btn-group-justified" title="'+title+'">'+messages+'</button>';
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
					pAnyAcademic: classroom.any};
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
			var url = root_url + '/webapps/bustiaca/listMails.do';
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

	$('.linkMail').unbind( "click" );
	$('.linkMail').click(function(){
		var mail = $(this).attr('mail');
		var url = root_url+"/WebMail/writeMail.do";
		var data = {
			to: mail
		};
		open_tab(url, data);
	});
}

function open_tab(url, data){
	var session = Session.get();
	if(session){
		if(url.indexOf('?') == -1){
			if(!data) data = {};
			data.s = session;
			url += '?'+uri_data(data);
		} else {
			url += session;
		}
		open_new_tab(url);
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
	if (!visibles) {
		$('#classrooms').html("<div class='alert'><h4>"+_('__ATTENTION__')+"</h4>"+_('__NO_CLASSROOMS__')+"</div>")
	} else {
		$('#classrooms').html(class_html);
	}

	if (get_show_news()) {
		$('#button_news').click(buildUI_news);
	} else {
		$('#button_news').remove();
	}

	if (get_show_agenda()) {
		$('#button_agenda').click(buildUI_agenda);
	} else {
		$('#button_agenda').remove();
	}
	$('#button_campus').click(buildUI_tools);
	$('#button_pacs').click(buildUI_pacs);


	var mails = get_mails_unread();
	if (mails > 0) {
		$('#button_mail').removeClass('btn-success');
		$('#button_mail').addClass('btn-danger');
		$('#button_mail').attr('title', _('__UNREAD_MAIL__', [mails]));
	} else {
		$('#button_mail').removeClass('btn-danger');
		$('#button_mail').addClass('btn-success');
		$('#button_mail').attr('title', _('__MAIL__'));
	}
	$('#button_mail').click(function() {
		var url = root_url + '/WebMail/listMails.do';
		open_tab(url);
	});

	$('#update').click( function() {
		check_messages(buildUI);
	});

	$('#options').click( function() {
		open_new_tab("options.html");
	});

	setTimeout( handleEvents, 100);

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

$(document).ready(function() {
	if (has_username_password()) {
		session = Session.get();
		if(!session){
			$("#classrooms").html('<div class="container-fluid"><div class="alert alert-danger">'+_('__WAITING_TO_LOGIN__')+'</div></div>');
			check_messages(buildUI);

			$('#options').click( function() {
				open_new_tab("options.html");
			});
			return;
		}
		buildUI();
		return;
	} else {
		$("#classrooms").html('<div class="container-fluid"><div class="alert alert-danger">'+_('__NO_USER_PASSWORD__')+'</div></div>');
		open_new_tab("options.html");
	}
});


// Disable alerts
window.alert = function ( text ) { Debug.print( 'ALERT: ' + text ); return true; };
