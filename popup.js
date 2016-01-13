var UI = new function() {
	var classrooms = false;
	var session = Session.get();
	var pacs_loaded = false;

	this.init = function() {
		if (has_username_password()) {
			if(!session){
				$("#classrooms").html('<div class="container-fluid"><div class="alert alert-danger">'+_('__WAITING_TO_LOGIN__')+'</div></div>');
				check_messages(build);

				$('#options').click( function() {
					open_new_tab("options.html");
				});
				return;
			}
			build();
			return;
		} else {
			$("#classrooms").html('<div class="container-fluid"><div class="alert alert-danger">'+_('__NO_USER_PASSWORD__')+'</div></div>');
			open_new_tab("options.html");
		}
	}

	function build() {
		$('#update').removeClass('spin');

		classrooms = Classes.get_notified();

		// Total messages
		$('#total_messages_button').addClass(get_badge_class(Classes.notified_messages))
		$('#total_messages').html(""+Classes.notified_messages)

		var visibles = false;
		var class_html = "";
		for(var i in classrooms){
			var c = new ClassroomUI(classrooms[i])
			class_html += c.build();
			visibles = true;
		}

		if (!visibles) {
			class_html = '<div class="container-fluid"><div class="alert alert-warning"><h4>'+_('__ATTENTION__')+"</h4>"+_('__NO_CLASSROOMS__')+"</div></div>";
		}
		$('#classrooms').html(class_html);

		// Setup News
		if (get_show_news()) {
			$('#button_news').click(news);
		} else {
			$('#button_news').remove();
		}

		// Setup agenda
		if (get_show_agenda()) {
			$('#button_agenda').click(agenda);
		} else {
			$('#button_agenda').remove();
		}

		$('#button_campus').click(tools);

		$('#button_pacs').click(UI.pacs);

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
			$('#update').addClass('spin');
			check_messages(build);
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
			var data = {modul: get_gat()+'.ESTADNOTES/estadis.assignatures',
						assig: classroom.subject_code,
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

		$('.showUsers').unbind( "click" );
		$('.showUsers').click(function(){
			var classroom_code = $(this).parents('.classroom').attr('classroom');
			var classroom = Classes.search_code(classroom_code);
			if( $('#users_'+classroom.code).hasClass('hidden') ) {
				if($('#users_'+classroom.code).text() == '') {
					$(this).addClass('spin');
					retrieve_users(classroom, this);
				}
				$('#users_'+classroom.code).removeClass('hidden');
			} else {
				$(this).removeClass('spin');
				$('#users_'+classroom.code).addClass('hidden');
			}
		});
	}

	function ClassroomUI(classroom) {
		var c = classroom;

		this.build = function() {
			var title = c.title;
			if (c.aula) {
				title += ' ('+c.aula+')';
			}

			var resources_html = "";
			for(var j in c.resources){
				resources_html += resource(c.resources[j]);
			}

			if (resources_html != "") {
				resources_html = '<ul class="container-fluid resources">' + resources_html + '</ul>';
			}

			var exams = "";
			var nearexams = false;
			if (classroom.exams && classroom.exams.date && !isBeforeToday(classroom.exams.date)) {

				if (classroom.exams.timeEX) {
					exams += '<div><a href="#" class="linkResource" title="'+classroom.exams.placeEX+'"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span> ' + _('__EX__') + ' ' + classroom.exams.timeEX + '</a></div>';
				}
				if (classroom.exams.timePS) {
					exams += '<div><a href="#" class="linkResource" title="'+classroom.exams.placePS+'"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span> ' + _('__PS__') + ' ' + classroom.exams.timePS + '</a></div>';
				}
				if (exams != "") {
					var link = root_url+'/tren/trenacc/webapp/GEPAF.FULLPERSONAL/index.jsp?s=';

					var limit = get_today_limit();
					nearexams = isNearDate(classroom.exams.date, limit);
					var clas = nearexams ? 'success' : 'warning';
					exams = '<div class="resource alert alert-'+clas+'" link="'+link+'">'+ _('__FINAL_TESTS__', [classroom.exams.date, classroom.exams.seu]) + exams + '</div>';
				}
			}

			var text = classrooms_buttons() + users();
			if (nearexams) {
				text += exams;
			}

			text += resources_html + events();

			if (!nearexams) {
				text += exams;
			}

			return '<div class="classroom panel panel-warning" classroom="'+c.code+'">  \
						<div class="panel-heading container-fluid" '+color(c.color)+' data-parent="#classrooms" data-toggle="collapse" data-target="#detail_'+c.code+'">	\
							<div class="row">\
								<div class="col-xs-9">' + title + '</div> \
								<div class="col-xs-3">' + badge(c.messages, 'linkAula', '-', _('__GOTO_CLASS__')) + '</div> \
							</div> \
						</div>\
						<div class="panel-body bg-info text-info collapse" id="detail_'+c.code+'">'+ text + '</div> \
					</div>';
			return content;
		}

		function resource(resource) {
			if(resource.link != 'undefined'){
				var link = 'link="'+resource.link+'"';
			}
			if (resource.has_message_count()) {
				return '<li class="row resource" '+link+' resource="'+resource.code+'"> \
							<div class="col-xs-8"><a href="#" class="linkResource">'+resource.title+'</a></div> \
							<div class="col-xs-4">'+badge(resource.messages, 'linkResource', resource.all_messages, _('__GOTO_RES__')) + '</div> \
						</li>';
			} else {
				return '<li class="resource" '+link+' resource="'+resource.code+'"><a href="#" class="linkResource">'+resource.title+'</a></li>';
			}
		}

		function users() {
			return '<div id="users_'+c.code+'" class="hidden row-fluid well"></div>';
		}

		function events() {
			if (c.events.length == 0 && c.grades.length == 0) {
				return "";
			}
			var events_html = '';
			var show_module_dates = get_show_module_dates();
			if (c.all_events_completed()) {
				for(var j in c.events){
					var ev = c.events[j];
					if (show_module_dates || ev.is_assignment()) {
						if (ev.is_assignment() || !ev.has_started() || !ev.has_ended()) {
							var e = new EventUI(ev);
							events_html += e.classroom_event_grade();
						}
					}
				}
				for(var j in c.grades){
					events_html += only_grade(c.grades[j], 1);
				}
				return '<table class="table table-condensed events" id="events_'+c.code+'">  \
						<thead><tr><th></th><th>'+_('__GRADE__')+'</th></tr></thead>\
						<tbody>' + events_html + ' </tbody>\
					</table>';
			} else {
				for(var j in c.events) {
					var ev = c.events[j];
					if (show_module_dates || ev.is_assignment()) {
						if (ev.is_assignment() || !ev.has_started() || !ev.has_ended()) {
							var e = new EventUI(ev);
							events_html += e.classroom_event();
						}
					}
				}
				for(var j in c.grades){
					events_html += only_grade(c.grades[j], 4);
				}
				return '<table class="table table-condensed events" id="events_'+c.code+'">  \
						<thead><tr><th></th><th>'+_('__START__')+'</th><th>'+_('__END__')+'</th><th>'+_('__SOLUTION__')+'</th><th>'+_('__GRADE__')+'</th></tr></thead>\
						<tbody>' + events_html + ' </tbody>\
					</table>';
			}

			function only_grade(grade, colspan) {
				if (grade.prov) {
					var clas = "bg-warning";
					var icon = ' <span class="glyphicon glyphicon-warning-sign text-danger"  aria-hidden="true" title="'+_('__PROV_GRADE__')+'"></span> ';
				} else {
					var clas = "bg-primary";
					var icon = "";
				}
				return '<tr class="event '+clas+'"><td class="name" colspan="'+colspan+'">'+ grade.get_title()+'</td><td class="graded">'+icon+grade.grade+'</td></tr>';
			}

		}

		function classrooms_buttons(){
			var buttons = "";
			var text = '<div class="row-fluid clearfix">';

			if(c.has_stats()) {
				buttons += '<button type="button" class="linkEstads btn btn-warning" aria-label="'+_('__STATS__')+'" title="'+_('__STATS__')+'">\
			    	<span class="glyphicon glyphicon-stats" aria-hidden="true"></span></button>';
		    }

			if(c.type != 'TUTORIA'){
				buttons += '<button type="button" class="linkMaterials btn btn-info" aria-label="'+_('__EQUIPMENT__')+'" title="'+_('__EQUIPMENT__')+'">\
			    	<span class="glyphicon glyphicon-book" aria-hidden="true"></span>\
			  	</button>\
			  	<button type="button" class="linkDocent btn btn-primary" aria-label="'+_('__TEACHING_PLAN__')+'" title="'+_('__TEACHING_PLAN__')+'">\
			    	<span class="glyphicon glyphicon-blackboard" aria-hidden="true"></span>\
			  	</button>';
			}

			buttons += '<button type="button" class="showUsers btn btn-info has-spinner" aria-label="'+_('__USERS__')+'" title="'+_('__USERS__')+'" data-toggle="button">\
					<span class="spinner"><span class="glyphicon glyphicon-refresh"></span></span> \
			    	<span class="glyphicon glyphicon-user" aria-hidden="true"></span>\
			  	</button>';

			if (c.consultor) {
				var title = _('__TEACHER__')+': '+c.consultor;
				if (c.consultorlastviewed) {
					title += "\n"+_('__VIEWED_LAST_TIME__', [getDate(c.consultorlastviewed), getTime(c.consultorlastviewed)]);
				}
				if (c.consultormail) {
					var img = "envelope";
					var mail = 'mail="'+c.consultormail+'"';
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

		  	if(c.has_events() && c.subject_code){
				text += '<div class="pull-right"><button type="button" class="linkNotas btn-sm btn btn-primary">\
			    	<span class="glyphicon glyphicon-dashboard" aria-hidden="true"></span> ' + _('__GRADES__') +'</button></div>';
		    }

		    text += '</div>';
		  	return text;
		}

		function badge(messages, classes, allmessages, title) {
			var badge = get_badge_class(messages);
			if (!isNaN(allmessages)) {
				return '<div class="btn-group btn-group-justified btn-group-xs ' + classes + '" role="group"> \
							<div class="btn-group btn-group-xs" role="group"><button type="button" class="btn '+badge+'" title="'+title+'">' + messages + '</button></div> \
				  			<div class="btn-group btn-group-xs" role="group"><button type="button" class="btn '+badge+'" title="'+title+'">' + allmessages + '</button></div> \
						</div>';
			} else {
				return '<button type="button" class="' + classes + ' btn btn-xs '+badge+' btn-group-justified" title="'+title+'">'+messages+'</button>';
			}
		}
	}

	function news() {
		if($('#detail_news').html() == "") {
			/*
			if(!session) {
				return false;
			}

			var libs = '/rb/inici/javascripts/prototype.js,/rb/inici/javascripts/effects.js,/rb/inici/javascripts/application.js,/rb/inici/javascripts/prefs.js,%2Frb%2Finici%2Fuser_modul%2Flibrary%2F944751.js';
			var src = 'http://cv.uoc.edu/webapps/widgetsUOC/widgetsGetURLNovetatsExternesWithProviderServlet??up_isNoticiesInstitucionals=false&up_title=Novetats%2520i%2520noticies&up_maximized=true&up_maxDestacades=2&up_showImages=true&up_slide=false&up_sortable=true&up_ck=nee&up_rssUrlServiceProviderHTML=%252Festudiant%252F_resources%252Fjs%252Fopencms_estudiant_widget_nou.js&up_maxAltres=5&up_rssUrlServiceProvider=%252Festudiant%252F_resources%252Fjs%252Fopencms_estudiant.js&up_fxml=html&up_target=noticies.jsp&libs='+libs+'&fromCampus=true&lang=ca&country=ES&color=&userType=UOC-ESTUDIANT-gr06-a&hp_theme=false&s='+session;
			$('#detail_news').html('<iframe src="'+src+'"></iframe>');*/
			$(this).addClass('spin');
			retrieve_news();
		}
	}

	function agenda() {
		if($('#detail_agenda iframe').length == 0) {
			if(!session) {
				return;
			}

			var api = 'http%253A%252F%252Fcv.uoc.edu%252Fwebapps%252FAgenda%252FAgendaServlet%253Foperacion%253Dical';
			var libs = '/rb/inici/javascripts/prototype.js,/rb/inici/javascripts/effects.js,/rb/inici/javascripts/application.js,/rb/inici/javascripts/prefs.js,%2Frb%2Finici%2Fuser_modul%2Flibrary%2F944745.js%3Ffeatures%3Dlibrary%3Asetprefs%3Adynamic-height';
			var src = 'http://cv.uoc.edu/webapps/widgetsUOC/widgetsIcalServlet?up_items=7&up_icalUrlServiceAPI='+api+'&up_targetMonth=agMonthlyView.jsp&up_target=agDailyView.jsp&libs='+libs+'&s='+session;
			$('#detail_agenda').html('<iframe src="'+src+'"></iframe>');
		}
	}

	function tools() {
		if ($('#detail_campus').html() == "") {
		    var gat =  get_gat();
		    var root_url_gate = root_url_ssl+'/tren/trenacc?modul='+gat;

		    var text = '<div class="row-fluid clearfix"><strong>'+_('__GRADES__')+'</strong></div>';
		    text += '<div class="row-fluid clearfix">';
		    text += get_general_link(root_url_gate+'.NOTESAVAL/NotesEstudiant.inici&s=', _('__GRADE_RESUME__'));
		    text += get_general_link(root_url_gate+'.EXASOLREVISION/consrevision.consrevision&s=', _('__EXAM_REVISION__'));
		    text += get_general_link(root_url_gate+'.PAPERETES/paperetes.paperetes&s=', _('__FINAL_GRADES__'), -1);
		    text += get_general_link(root_url_gate+'.ESTADNOTES/estadis.inici&s=', _('__STATS__'), 1);
		    text += get_general_link(root_url + '/webapps/seleccioexpedient/cerca.html?s=', _('__EXPEDIENT__')); //Need no SSL
		    text += get_general_link(root_url_gate+'.NOTAS_SMS&s=', _('__GRADES_SMS__'), -1);
		    text += get_general_link(root_url+'/tren/trenacc/webapp/GEPAF.FULLPERSONAL/index.jsp?s=', _('__EXAM_SELECT__'), -1);
			//text += get_general_link(root_url_gate + '.INFCONSULTA/inici&s=', _('Expediente antiguo (no funciona)'));
			//text += get_general_link(root_url_gate + '.NOTESAVAL/rac.rac&tipus=1&s=', _('REC antiguo (no funciona)'));
		    text += '</div>';

			text += '<div class="row-fluid clearfix"><strong>'+_('__ENROLL__')+'</strong></div>';
			text += '<div class="row-fluid clearfix">';
			text += get_general_link(root_url_gate+'.MATPREMATRICULA/inici&s=', _('__ENROLL_PROP__'));
			text += get_general_link(root_url_gate+'.MATMATRICULA/inici&s=', _('__ENROLL__'));
			text += '</div>';

			text += '<div class="row-fluid clearfix"><strong>'+_('__PERSONAL__')+'</strong></div>';
			text += '<div class="row-fluid clearfix">';
			text += get_general_link(root_url_ssl + '/app/guaita/calendari?perfil=estudiant&s=', _('__NEW_AGENDA__'));
			var domainId = "";
			var classrooms = Classes.get_notified();
			for(var i in classrooms){
				if (classrooms[i].domain) {
					domainId = "&domainId=" + classrooms[i].domain;
					break;
				}
			}
			var link = root_url_ssl + '/webapps/classroom/081_common/jsp/calendari_semestral.jsp?appId=UOC&idLang=a&assignment=ESTUDIANT&domainPontCode=sem_pont'+domainId+'&s='
			text += get_general_link(link, _('__OLD_AGENDA__'));
			text += get_general_link(root_url_ssl + '/webapps/Agenda/NavigationServlet?s=', _('__PERSONAL_AGENDA__'));
			text += get_general_link(root_url_ssl + '/webapps/filearea/servlet/iuoc.fileserver.servlets.FAGateway?opId=getMainFS&company=/UOC&idLang=/'+get_lang_code()+'&sessionId=', _('__FILES__'));
			text += get_general_link(root_url_ssl + '/cgibin/hola?t=grups_tb/grups.tmpl&domainFather=grc&s=', _('__WORKING_GROUPS__'));

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

		function get_general_link(link, title){
			return '<div class="col-xs-6 resource" link="'+link+'"><a href="#" class="linkResource">'+title+'</a></div>';
		}
	}

	this.pacs = function(force) {
		if(force == true || !pacs_loaded) {
			pacs_loaded = true;
			var limit = get_today_limit();

			var events_pacs = new Array();
			var events_today = new Array();
			for (var i in classrooms) {
				var classroom = classrooms[i];
				if (classroom.events.length > 0 ) {
					for(var j in classroom.events){
						classroom.events[j].subject = classroom.get_acronym();
						if (classroom.events[j].is_assignment()) {
							events_pacs.push(classroom.events[j]);
						}
						if (classroom.events[j].is_near(limit)) {
							events_today.push(classroom.events[j]);
						}
					}
				}

				// Final tests
				if (classroom.exams && classroom.exams.date && isNearDate(classroom.exams.date, limit)) {
					var name = _('__FINAL_TESTS_CLASS__', [classroom.get_acronym()]);
					var title = "";
					if (classroom.exams.timeEX) {
						title += _('__FINAL_TESTS_CLASS_TITLE__', [_('__EX__'), classroom.exams.timeEX, classroom.exams.seu, classroom.exams.placeEX]);
					}
					if (classroom.exams.timePS) {
						if (title != "") {
							title += "\n";
						}
						title += _('__FINAL_TESTS_CLASS_TITLE__', [_('__PS__'), classroom.exams.timePS, classroom.exams.seu, classroom.exams.placePS]);
					}
					if (title != "") {
						name = '<span title ="'+title+'">'+ name + '</span>';
					}
					var evnt = new Event(name, '', 'UOC');
					evnt.start = classroom.exams.date;
					evnt.link = root_url+'/tren/trenacc/webapp/GEPAF.FULLPERSONAL/index.jsp?s=';
					events_today.push(evnt);
				}
			}

			var gnral_events = Classes.get_general_events();
			for(var j in gnral_events){
				if (gnral_events[j].is_near(limit)) {
					events_today.push(gnral_events[j]);
				}
			}

			var content_pacs = "";
			if (events_pacs.length > 0) {
				var sorting = get_sorting();
				if (sorting == 'end') {
					events_pacs.sort(function(a, b){
						return compareDates(a.end, b.end);
					});
				} else {
					events_pacs.sort(function(a, b) {
						if (a.has_started() && b.has_started()) {
							return compareDates(a.end, b.end);
						}
						return compareDates(a.start, b.start);
					});
				}

				for (var i in events_pacs) {
					var e = new EventUI(events_pacs[i])
					content_pacs += e.pacs_event();
				}
				if (content_pacs != "") {
					content_pacs = '<div class="pull-right"><button type="button" class="btn-sm btn btn-primary" id="show_upcomming">\
				    	<span class="glyphicon glyphicon-road" aria-hidden="true"></span> ' + _('__SHOW_UPCOMMING__') +'</button></div>\
						<table class="table table-condensed events">  \
						<thead><tr><th></th><th by="start" class="sort_pacs">'+_('__START__')+'</th><th by="end" class="sort_pacs">'+_('__END__')+'</th></tr></thead>\
						<tbody>' + content_pacs + '</tbody></table>';
				}
			}
		   	$('#content_pacs').html(content_pacs);


			var content_today = "";
		   	if (events_today.length > 0) {
				events_today.sort(function(a, b){
					var comp = compareDates(a.end, b.end);
					if (comp == 0) {
						return compareDates(a.start, b.start);
					}
					return comp;
				});

				for (var i in events_today) {
					var e = new EventUI(events_today[i])
					content_today += e.today_event(limit);
				}
				if (content_today != "") {
					content_today = '<div class="pull-right"><button type="button" class="btn-sm btn btn-primary" id="assignments">\
				    	<span class="glyphicon glyphicon-flag" aria-hidden="true"></span> ' + _('__ONLY_ASSIGNMENTS__') +'</button></div>\
				    	<table class="table table-condensed events">  \
						<thead><tr><th></th><th>'+_('__START__')+'</th><th>'+_('__END__')+'</th><th>'+_('__SOLUTION__')+'</th><th>'+_('__GRADE__')+'</th></tr></thead>\
						<tbody>' + content_today + '</tbody></table>';
					}
			}
			$('#content_today').html(content_today);

			if (content_pacs == "" || content_today == "") {
				$('#show_upcomming').hide();
				$('#assignments').hide();
			} else if(force == true) {
				$('#content_today').hide();
			} else {
				$('#content_pacs').hide();
			}

			if (content_pacs == "" && content_today == "") {
				$('#button_pacs').remove();
			}

			$('#show_upcomming').unbind( "click" );
			$('#show_upcomming').click(function(){
				$('#content_today').show();
				$('#content_pacs').hide();
			});

			$('#assignments').unbind( "click" );
			$('#assignments').click(function(){
				$('#content_today').hide();
				$('#content_pacs').show();
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

			$('.sort_pacs').unbind( "click" );
			$('.sort_pacs').click(function(){
				var sorting = $(this).attr('by');
				save_sorting(sorting);
				UI.pacs(true);
			});
		}
	}

	function EventUI(evnt) {
		var ev = evnt;

		this.pacs_event = function() {
			if(ev.link != 'undefined'){
				var link = 'link="'+ev.link+'"';
			}

			var eventstate = "";
			if (ev.has_started()) {
				if (ev.has_ended()) {
					return "";
				} if (ev.committed) {
					eventstate = ' warning running';
				} else {
					eventstate = ' danger running';
				}
			}
			var dstart = eventdate(ev.start, "");
			var dend = eventdate(ev.end, "end");

			var title = "";
			if (ev.committed) {
				if (ev.viewed) {
					title = icon(_('__COMMITTED_VIEWED__', [getDate(ev.viewed), getTime(ev.viewed)]), 'saved');
				} else {
					title = icon(_('__COMMITTED__'), 'save');
				}
			} else if(ev.has_ended()) {
				title = colored_icon(_('__NOT_COMMITTED__'), 'remove', 'a94442');
			} else {
				title = colored_icon(_('__'+ev.type+'__'), 'certificate', '');
			}
			if (ev.subject != undefined) {
				title += ev.subject + ' - ';
			}
			title += ev.name;
			return '<tr class="event'+eventstate+'" '+link+'"><td class="name"><a href="#" class="linkEvent">'+title+'</a></td>'+dstart+dend+'</tr>';
		}

		this.classroom_event = function() {
			if(ev.link != 'undefined') {
				var link = 'link="'+ev.link+'"';
			}

			var eventstate = "";
			if (ev.has_started()) {
				if (ev.has_ended()) {
					eventstate = ' success';
				} else if (ev.committed || !ev.is_assignment()) {
					eventstate = ' warning running';
				} else {
					eventstate = ' danger running';
				}
			}
			var dstart = eventdate(ev.start, "");
			var dend = eventdate(ev.end, "end");
			var dsol = eventdate(ev.solution, "");
			if (ev.graded) {
				var grad = ev.graded;
				if (ev.commenttext) {
					grad += " "+icon(_('__COMMENT__', [getDate(ev.commentdate), getTime(ev.commentdate)])+"\n"+ev.commenttext, 'comment');
				}
				var dgrade = eventtext(grad, "graded", ev.grading);
			} else {
				var dgrade = eventdate(ev.grading, "");
			}

			var title = "";
			if (ev.is_assignment()) {
				if (ev.committed) {
					if (ev.viewed) {
						title = icon(_('__COMMITTED_VIEWED__', [getDate(ev.viewed), getTime(ev.viewed)]), 'saved');
					} else {
						title = icon(_('__COMMITTED__'), 'save');
					}
				} else if(ev.has_ended()){
					title = colored_icon(_('__NOT_COMMITTED__'), 'remove', 'a94442');
				} else {
					title = colored_icon(_('__'+ev.type+'__'), 'certificate', '');
				}
			} else {
				title = colored_icon(_('__'+ev.type+'__'), 'triangle-right', '');
			}
			title += ev.name;
			return '<tr class="event'+eventstate+'" '+link+'"><td class="name"><a href="#" class="linkEvent">'+title+'</a></td>'+dstart+dend+dsol+dgrade+'</tr>';
		}

		this.today_event = function(limit) {
			if(ev.link != 'undefined') {
				var link = 'link="'+ev.link+'"';
			}

			var eventstate = "";
			if (ev.has_started()) {
				if (ev.has_ended()) {
					eventstate = ' success';
				} else if (ev.committed || !ev.is_assignment()) {
					eventstate = ' warning running';
				} else {
					eventstate = ' danger running';
				}
			}

			var dstart = eventdate(ev.start, isNearDate(ev.start, limit) ? "near" : "");
			var dend = eventdate(ev.end, isNearDate(ev.end, limit) ? "end near" : "end");
			var dsol = eventdate(ev.solution, isNearDate(ev.solution, limit) ? "near" : "");
			if (ev.graded) {
				var grad = ev.graded;
				if (ev.commenttext) {
					grad += " "+icon(_('__COMMENT__', [getDate(ev.commentdate), getTime(ev.commentdate)])+"\n"+ev.commenttext, 'comment');
				}
				var dgrade = eventtext(grad, "graded", ev.grading);
			} else {
				var dgrade = eventdate(ev.grading, isNearDate(ev.grading, limit) ? "near" : "");
			}

			var title = "";
			if (ev.is_assignment()) {
				if (ev.committed) {
					if (ev.viewed) {
						title = icon(_('__COMMITTED_VIEWED__', [getDate(ev.viewed), getTime(ev.viewed)]), 'saved');
					} else {
						title = icon(_('__COMMITTED__'), 'save');
					}
				} else if(ev.has_ended()){
					title = colored_icon(_('__NOT_COMMITTED__'), 'remove', 'a94442');
				} else {
					title = colored_icon(_('__'+ev.type+'__'), 'certificate', '');
				}
			} else if (ev.is_uoc()) {
				title = colored_icon(_('__'+ev.type+'__'), 'education', '');
			} else {
				title = colored_icon(_('__'+ev.type+'__'), 'triangle-right', '');
			}
			if (ev.subject != undefined) {
				title += ev.subject + ' - ';
			}
			title += ev.name;
			return '<tr class="event'+eventstate+'" '+link+'"><td class="name"><a href="#" class="linkEvent">'+title+'</a></td>'+dstart+dend+dsol+dgrade+'</tr>';
		}

		this.classroom_event_grade = function() {
			if(ev.link != 'undefined'){
				var link = 'link="'+ev.link+'"';
			}
			if (ev.graded) {
				var grad = ev.graded;
				if (ev.commenttext) {
					grad += " "+icon(_('__COMMENT__', [getDate(ev.commentdate), getTime(ev.commentdate)])+"\n"+ev.commenttext, 'comment');
				}
				var dgrade = eventtext(grad, "graded", ev.grading);
			} else {
				var dgrade = eventdate(ev.grading, "");
			}

			var title = "";
			if (ev.is_assignment()) {
				if (ev.committed) {
					if (ev.viewed) {
						title = icon(_('__COMMITTED_VIEWED__', [getDate(ev.viewed), getTime(ev.viewed)]), 'saved');
					} else {
						title = icon(_('__COMMITTED__'), 'save');
					}
				} else if(ev.has_ended()){
					title = colored_icon(_('__NOT_COMMITTED__'), 'remove', 'a94442');
				} else {
					title = colored_icon(_('__'+ev.type+'__'), 'certificate', '');
				}
			} else {
				title = colored_icon(_('__'+ev.type+'__'), 'triangle-right', '');
			}
			title += ev.name;
			return '<tr class="event success" '+link+'"><td class="name"><a href="#" class="linkEvent">'+title+'</a></td>'+dgrade+'</tr>';
		}

		function eventdate(d, clas) {
			var fdate;
			var title = "";
			if (d) {
				var dsplit = d.split('/');
				fdate = dsplit[0]+'/'+dsplit[1];
				if (isBeforeToday(d)) {
					clas += " text-success";
					fdate = icon(fdate, 'ok');
				} else if (isToday(d)) {
					clas += " today";
					title = fdate;
					fdate = _('__TODAY__');
				}
			} else {
				fdate = '-';
			}
			return eventtext(fdate, clas, title);
		}

		function eventtext(text, clas, title) {
			if (title == undefined) {
				title = "";
			} else {
				var dsplit = title.split('/');
				if (dsplit.length >= 2) {
					title = dsplit[0]+'/'+dsplit[1];
				}
				title = ' title="'+title+'"';

			}
			return '<td><a href="#" class="linkEvent '+clas+'"'+title+'>'+text+'</a></td>';
		}

		function icon(title, type) {
			return '<span class="glyphicon glyphicon-'+type+' text-success" aria-hidden="true" title="'+title+'"></span> ';
		}

		function colored_icon(title, type, color) {
			return '<span class="glyphicon glyphicon-'+type+'" style="color:#'+color+';"  aria-hidden="true" title="'+title+'"></span> ';
		}
	}

	function color(col){
		if(col){
			return 'style="border-color:#'+col+'; background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.20) 100%), #'+col+' no-repeat; color:white;"';
		}
		return "";
	}

	function get_badge_class(messages){
		var critical = get_critical();
		if(isNaN(messages)) return "btn-info";
		if( messages == 0) return "btn-success";
		if( messages >= critical) return "btn-danger";
		return "btn-warning";
	}

	function open_tab(url, data){
		session = Session.get();
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

	this.fill_users = function(classcode, data) {
		$('#users_'+classcode).html(data);
		var text = "";
		var connected = "";
		var idp = get_idp();
		for(x in data.studentUsers) {
			var user = data.studentUsers[x];
			if(user.userNumber == idp) {
				continue;
			}

			if (user.connected) {
				var title = _('__CONNECTED__');
				var clas = 'success';
			} else if (user.lastLoginTime) {
				var title = _('__VIEWED_LAST_TIME__', [getDate(user.lastLoginTime), getTime(user.lastLoginTime)]);
				var clas = 'warning';
			} else {
				var title = _('__DISCONNECTED__');
				var clas = 'warning';
			}

		  	var usertext = '<li><a class="linkMail text-'+clas+'" mail="'+user.email+' "aria-label="'+title+'" title="'+title+' - '+user.email+'">\
		    	<span class="glyphicon glyphicon-envelope" aria-hidden="true"></span> '+ user.fullName+ '\
		  	</a> ';
		  	if (user.connected) {
		  		connected += usertext;
		  	} else {
		  		text += usertext;
		  	}
		}
		text = connected + text;

		if (text != "") {
			$('#users_'+classcode).html('<ul>'+text+'</ul>');
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
	}
}

$(document).ready(function() {
	UI.init();
});

// Disable alerts
window.alert = function ( text ) { Debug.print( 'ALERT: ' + text ); return true; };
