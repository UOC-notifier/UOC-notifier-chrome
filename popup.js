var UI = new function() {
	var classrooms = false;
	var session = Session.get();
	var pacs_loaded = false;

	this.init = function() {
		if (has_username_password()) {
			if(!session){
				$("#classrooms").html('<div class="container-fluid"><div class="alert alert-danger">'+_('__WAITING_TO_LOGIN__')+'</div></div>');
				check_messages(build);

				$('#options').unbind( "click" ).click( function() {
					open_new_tab("options.html");
				});
				return;
			}
			build();
		} else {
			$("#classrooms").html('<div class="container-fluid"><div class="alert alert-danger">'+_('__NO_USER_PASSWORD__')+'</div></div>');
			open_new_tab("options.html");
		}
	};

	function build() {
        var messages = get_icon();
        if (messages > 0) {
            var color = messages >= get_critical() ? '#AA0000' : '#EB9316';
            setBadge(messages, color);
        } else {
            setBadge("");
        }
        save_has_news(false);

		$('#update').removeClass('spin');

		classrooms = Classes.get_notified();

		// Total messages
		$('#total_messages_button').addClass(get_badge_class(Classes.notified_messages));
		$('#total_messages').html(""+Classes.notified_messages);

		var visibles;
		var class_html = "";
		for(var i in classrooms){
			var c = new ClassroomUI(classrooms[i]);
			class_html += c.build();
			visibles = true;
		}

		if (!visibles) {
			class_html = '<div class="container-fluid"><div class="alert alert-warning"><h4>'+_('__ATTENTION__')+"</h4>"+_('__NO_CLASSROOMS__')+"</div></div>";
		}
		$('#classrooms').html(class_html);

        // Announcements
        var announcements = get_announcements();
        if (announcements) {
            var announcements_html = "";
            for (var x in announcements) {
                var announcement = announcements[x];
                var title = announcement.link != "" ? '<a target="_blank" href="'+announcement.link+'">'+announcement.title+'</a>' : announcement.title;
                announcements_html += '<div class="panel panel-warning collapsible">\
                <div class="panel-heading collapsed" data-target="#detail_announcements_'+x+'" data-toggle="collapse"> \
                <button type="button" class="close" aria-label="Close"><span aria-hidden="true" class="close_announcements">&times;</span></button>\
                <span class="title"><span class="glyphicon glyphicon-bullhorn" aria-hidden="true"></span>&nbsp;'+title+'</span></div>\
                <div class="panel-body bg-warning text-warning collapse" id="detail_announcements_'+x+'">'+announcement.description+'<div class="pull-right">'+announcement.date+'</div>\
                </div></div>';
            }
            $('#announcements').html(announcements_html);
            $('.close_announcements').unbind( "click" ).click(function() {
                $(this).parent().parent().parent().hide();
            });
        }

		$('#button_agenda').unbind( "click" ).click(agenda);

		$('#button_campus').unbind( "click" ).click(tools);

		$('#button_pacs').unbind( "click" ).click(UI.pacs);

		var mails = get_mails_unread();
		if (mails > 0) {
			$('#button_mail').removeClass('btn-success')
                .addClass('btn-danger')
			    .attr('title', _('__UNREAD_MAIL__', [mails]));
		} else {
			$('#button_mail').removeClass('btn-danger')
			        .addClass('btn-success')
			        .attr('title', _('__MAIL__'));
		}
		$('#button_mail').unbind( "click" ).click(function() {
			open_tab('/WebMail/attach.do', null, true);
		});

		$('#update').unbind( "click" ).click( function() {
			$('#update').addClass('spin');
			check_messages(build);
		});

		$('#options').unbind( "click" ).click( function() {
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

	function handleEvents() {
		$('.linkCampus').unbind( "click" )
                .click(function(){
                    // Need to be HTTP
                    open_tab('/cgibin/uocapp', false, true);
                });

		$('.linkAula').unbind( "click" )
                .click(function(){
                    var classroom_code = $(this).parents('.classroom').attr('classroom');
                    var classroom = Classes.search_code(classroom_code);

                    var data = {classroomId: classroom.domain,
                                subjectId: classroom.domainassig};
                    open_tab('/webapps/aulaca/classroom/Classroom.action', data);
                });

		$('.linkNotas').unbind( "click" )
                .click(function(){
                    var classroom_code = $(this).parents('.classroom').attr('classroom');
                    var classroom = Classes.search_code(classroom_code);

                    var data = {domainId: classroom.domain};
                    open_tab('/webapps/rac/listEstudiant.action', data, true);
                });

		$('.linkEstads').unbind( "click" )
                .click(function(){
                    var classroom_code = $(this).parents('.classroom').attr('classroom');
                    var classroom = Classes.search_code(classroom_code);
                    var data = {modul: 'GAT_EXP.ESTADNOTES/estadis.assignatures',
                                assig: classroom.subject_code,
                                pAnyAcademic: classroom.any};
                    open_tab('/tren/trenacc', data);
                });

		$('.linkDocent').unbind( "click" )
                .click(function(){
                    var classroom_code = $(this).parents('.classroom').attr('classroom');
                    var classroom = Classes.search_code(classroom_code);
                    var data = {nav: 'pladocent',
                                domainId: classroom.domain,
                                format: 'html',
                                app: 'aulaca',
                                precarrega: false
                            };
                    open_tab('/webapps/classroom/download.do', data);
                });

		$('.linkResource').unbind( "click" )
            .click(function(){
                var link = $(this).parents('.resource').attr('link');
                var url, data;
                if(link && link != undefined){
                    url = link;
                    data = {};
                } else {
                    var code = $(this).parents('.resource').attr('resource');
                    url = '/webapps/bustiaca/listMails.do';
                    data = {l: code};
                }
                // Need to be HTTP
                open_tab(url, data, true);
            });

		$('.linkEvent').unbind( "click" )
            .click(function() {
                var link = $(this).parents('.event').attr('link');
                if(link && link != undefined){
                    open_tab(link);
                }
            });

		$('.linkMail').unbind( "click" )
            .click(function(){
                var mail = $(this).attr('mail');
                var data = {to: mail};
                open_tab('/WebMail/writeMail.do', data);
            });

		$('.showUsers').unbind( "click" )
            .click(function(){
                var classroom_code = $(this).parents('.classroom').attr('classroom');
                var classroom = Classes.search_code(classroom_code);
                if (!classroom.users) {
                    $(this).addClass('spin');
                    retrieve_users(classroom, this);
                } else {
                    UI.show_users(classroom);
                }
            });

        $('.showMaterials').unbind( "click" )
            .click(function(){
                var classroom_code = $(this).parents('.classroom').attr('classroom');
                var classroom = Classes.search_code(classroom_code);
                if (classroom.subject_code) {
                    if (!classroom.materials) {
                        $(this).addClass('spin');
                        retrieve_materials(classroom, this);
                    } else {
                        UI.show_materials(classroom);
                    }
                } else {
                    /* OLD FORMAT CLASS
                    var data = {nav: 'recursos-estudiant',
                                domainId: classroom.domain,
                                domainCode: classroom.code};
                    open_tab('/webapps/classroom/student.do', data);*/

                    var data = {classroomId: classroom.domain,
                                subjectId: classroom.domainassig};
                    open_tab('/webapps/aulaca/classroom/Materials.action', data);
                }
            });

        $('.showComments').unbind( "click" )
             .click(function(){
                var eventid = $(this).parents('.event').attr('eventid');
                if(eventid && eventid != undefined){
                    var classroom = Classes.get_class_by_event(eventid);
                    if (classroom) {
                        var ev = classroom.get_event(eventid);
                        if (ev) {
                            var title = classroom.get_acronym() +': '+ ev.name;
                            var text = '<strong>'+_('__COMMENT__', [getDate(ev.commentdate), getTime(ev.commentdate)])+'</strong><br>' +ev.commenttext;
                            UI.show_modal(title, text);
                        }
                    }
                }
                return false;
            });
	}

    function getFinalTestsTitle(exams, type) {
        if (!exams['time'+type]) {
            return "";
        }
        var typeName = type == 'EX' ? _('__EX__') : _('__PS__');

        if (exams['place' + type]) {
            return _('__FINAL_TESTS_CLASS_TITLE__', [typeName, exams['time'+type], exams['place' + type]]);
        }
        return _('__FINAL_TESTS_CLASS_TITLE_NOPLACE__', [typeName, exams['time'+type]]);
    }

	function ClassroomUI(classroom) {
		var c = classroom;

		this.build = function() {
			var title = c.title;
			if (c.aula) {
				title += ' <span title="'+_('__CLASSROOM__')+' '+c.aula+'">('+c.aula+')</span>';
			}

			var resources_html = "";
			for(var j in c.resources){
				resources_html += resource(c.resources[j]);
			}

			if (resources_html != "") {
				resources_html = '<ul class="container-fluid resources">' + resources_html + '</ul>';
			}

			var tit, exams = "";
			var nearexams = false;
			if (classroom.exams && classroom.exams.date && !isBeforeToday(classroom.exams.date)) {

                tit = getFinalTestsTitle(classroom.exams, 'EX');
				if (tit) {
					exams += '<div><a href="#" class="linkEvent" title="'+tit+'"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span> ' + tit + '</a></div>';

				}
                tit = getFinalTestsTitle(classroom.exams, 'PS');
				if (tit) {
					exams += '<div><a href="#" class="linkEvent" title="'+tit+'"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span> ' + tit + '</a></div>';
				}
				if (exams != "") {
					var link = '/tren/trenacc/webapp/GEPAF.FULLPERSONAL/index.jsp?s=';

					var limit = get_today_limit();
					nearexams = isNearDate(classroom.exams.date, limit);
					var clas = nearexams ? 'success' : 'warning';
					exams = '<div class="event alert alert-'+clas+'" link="'+link+'">'+ _('__FINAL_TESTS__', [classroom.exams.date, classroom.exams.seu]) + exams + '</div>';
                    $('.linkEvent').unbind( "click" )
                        .click(function(){
                            var link = $(this).parents('.event').attr('link');
                            if(link && link != undefined){
                                open_tab(link);
                            }
                        });
				}
			}

            var text = classrooms_buttons();
            if (nearexams) {
                text += exams;
            }

            if (classroom.final_grades && classroom.stats) {
                text += '<div class="event alert alert-warning ">'+ _('__END_OF_CLASSROOMS__') + '</div>';
            }

			text += resources_html + events();

			if (!nearexams) {
				text += exams;
			}

			return '<div class="classroom panel collapsible" classroom="'+c.code+'">  \
						<div class="panel-heading container-fluid collapsed" '+color(c.color)+' data-parent="#classrooms" data-toggle="collapse" data-target="#detail_'+c.code+'">	\
							<div class="row">\
								<div class="col-xs-9 title">' + title + '</div> \
								<div class="col-xs-3">' + badge(c.messages, 'linkAula', '-', _('__GOTO_CLASS__')) + '</div> \
							</div> \
						</div>\
						<div class="panel-body bg-info text-info collapse" id="detail_'+c.code+'">'+ text + '</div> \
					</div>';
		};

		function resource(resource) {
            var link;
			if(resource.link != undefined){
				link = 'link="'+resource.link+'"';
			}
			if (resource.has_message_count()) {
				return '<li class="row resource" '+link+' resource="'+resource.code+'"> \
							<div class="col-xs-8"><a href="#" class="linkResource">'+resource.title+'</a></div> \
							<div class="col-xs-4">'+badge(resource.messages, 'linkResource', resource.all_messages, _('__GOTO_RES__')) + '</div> \
						</li>';
			} else if (resource.has_news()) {
                return '<li class="row resource" '+link+' resource="'+resource.code+'"> \
                            <div class="col-xs-8"><a href="#" class="linkResource">'+resource.title+'</a></div> \
                            <div class="col-xs-4 text-center"><span class="glyphicon glyphicon-flag" style="color:#a94442;"  aria-hidden="true" title="'+_('__NEWS__')+'"></span></div> \
                        </li>';
            } else {
				return '<li class="resource" '+link+' resource="'+resource.code+'"><a href="#" class="linkResource">'+resource.title+'</a></li>';
			}
		}

		function events() {
			if (c.events.length == 0 && c.grades.length == 0) {
				return "";
			}
			var events_html = '';
			var show_module_dates = get_show_module_dates();
			if (c.all_events_completed(false)) {
				for(var i in c.events){
					var ev = c.events[i];
					if (show_module_dates || ev.is_assignment()) {
						if (ev.is_assignment() || !ev.has_started() || !ev.has_ended() || !ev.is_committed()) {
							var eui = new EventUI(ev);
							events_html += eui.classroom_event_grade();
						}
					}
				}
				for(var j in c.grades){
					events_html += only_grade(c.grades[j], 1);
				}
                if (events_html == "") {
                    return "";
                }
				return '<table class="table table-condensed events" id="events_'+c.code+'">  \
						<thead><tr><th></th><th>'+_('__GRADE__')+'</th></tr></thead>\
						<tbody>' + events_html + ' </tbody>\
					</table>';
			} else {
				for(var k in c.events) {
					var cev = c.events[k];
					if (show_module_dates || cev.is_assignment()) {
						if (cev.is_assignment() || !cev.has_started() || !cev.has_ended() || !cev.is_committed()) {
							var e = new EventUI(cev);
							events_html += e.classroom_event();
						}
					}
				}
				for(var l in c.grades){
					events_html += only_grade(c.grades[l], 4);
				}
				return '<table class="table table-condensed events" id="events_'+c.code+'">  \
						<thead><tr><th></th><th>'+_('__START__')+'</th><th>'+_('__END__')+'</th><th>'+_('__SOLUTION__')+'</th><th>'+_('__GRADE__')+'</th></tr></thead>\
						<tbody>' + events_html + ' </tbody>\
					</table>';
			}

			function only_grade(grade, colspan) {
                var clas, icon;
				if (grade.prov) {
					clas = "bg-warning";
					icon = ' <span class="glyphicon glyphicon-warning-sign text-danger"  aria-hidden="true" title="'+_('__PROV_GRADE__')+'"></span> ';
				} else {
					clas = "bg-primary";
					icon = "";
				}
				return '<tr class="event '+clas+'"><td class="name" colspan="'+colspan+'">'+ grade.get_title()+'</td><td class="graded">'+icon+grade.grade+'</td></tr>';
			}

		}

		function classrooms_buttons(){
			var buttons = "";
			var text = '<div class="row-fluid clearfix">';

			if(c.stats) {
				buttons += '<button type="button" class="linkEstads btn btn-warning" aria-label="'+_('__STATS__')+'" title="'+_('__STATS__')+'">\
			    	<span class="glyphicon glyphicon-stats" aria-hidden="true"></span></button>';
		    }

            buttons += '<button type="button" class="showMaterials btn btn-info has-spinner" aria-label="'+_('__EQUIPMENT__')+'" title="'+_('__EQUIPMENT__')+'">\
                    <span class="spinner"><span class="glyphicon glyphicon-refresh"></span></span> \
                    <span class="glyphicon glyphicon-book" aria-hidden="true"></span>\
            </button>';

			if (c.type != "TUTORIA") {
			  	buttons += '<button type="button" class="linkDocent btn btn-primary" aria-label="'+_('__TEACHING_PLAN__')+'" title="'+_('__TEACHING_PLAN__')+'">\
			    	<span class="glyphicon glyphicon-blackboard" aria-hidden="true"></span>\
			  	</button>';
			}

            if (c.type == "TUTORIA" || c.any) {
    			buttons += '<button type="button" class="showUsers btn btn-info has-spinner" aria-label="'+_('__USERS__')+'" title="'+_('__USERS__')+'">\
    					<span class="spinner"><span class="glyphicon glyphicon-refresh"></span></span> \
    			    	<span class="glyphicon glyphicon-user" aria-hidden="true"></span>\
    			  	</button>';
            }

			if (c.consultor) {
				var title = _('__TEACHER__')+': '+c.consultor;
				if (c.consultorlastviewed) {
                    var time = getTime(c.consultorlastviewed);
                    if (time == '00:00') {
                        title += "\n"+_('__VIEWED_LAST_DATE__', [getDate(c.consultorlastviewed)]);
                    } else {
                        title += "\n"+_('__VIEWED_LAST_TIME__', [getDate(c.consultorlastviewed), time]);
                    }
				}
                var img, mail;
				if (c.consultormail) {
					img = "envelope";
					mail = 'mail="'+c.consultormail+'"';
				} else {
					img = "user";
					mail = "";
				}
			  	buttons +=  '<button type="button" class="linkMail btn btn-success" '+mail+' aria-label="'+title+'" title="'+title+'">\
			    	<span class="glyphicon glyphicon-'+img+'" aria-hidden="true"></span>\
			  	</button>';
			}

		  	if (buttons.length > 0) {
		  		text += '<div class="btn-group btn-group-sm pull-left" role="group">'+buttons+'</div>';
		  	}

		  	if(c.has_assignments() && c.subject_code){
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
		    var url_gate = '/tren/trenacc?modul=GAT_EXP';

		    var text = '<div class="row-fluid clearfix"><strong>'+_('__GRADES__')+'</strong></div>';
		    text += '<div class="row-fluid clearfix">';
		    //text += get_general_link(url_gate+'.NOTESAVAL/NotesEstudiant.inici&s=', _('__GRADE_RESUME__'));
		    text += get_general_link(url_gate+'.EXASOLREVISION/consrevision.consrevision&s=', _('__EXAM_REVISION__'));
		    //text += get_general_link(url_gate+'.PAPERETES/paperetes.paperetes&s=', _('__FINAL_GRADES__'));
		    text += get_general_link(url_gate+'.ESTADNOTES/estadis.inici&s=', _('__STATS__'));
		    text += get_general_link(root_url+'/webapps/seleccioexpedient/cerca.html?s=', _('__EXPEDIENT__')); //Need no SSL
		    text += get_general_link(url_gate+'.NOTAS_SMS&s=', _('__GRADES_SMS__'));
		    text += get_general_link('/tren/trenacc/webapp/GEPAF.FULLPERSONAL/index.jsp?s=', _('__EXAM_SELECT__'));
			text += get_general_link(url_gate + '.INFCONSULTA/inici&s=', _('__OLD_EXPEDIENT__'));
			//text += get_general_link(url_gate + '.NOTESAVAL/rac.rac&tipus=1&s=', _('REC antiguo (no funciona)'));
		    text += '</div>';

			text += '<div class="row-fluid clearfix"><strong>'+_('__ENROLL__')+'</strong></div>';
			text += '<div class="row-fluid clearfix">';
			text += get_general_link(url_gate+'.MATPREMATRICULA/inici&s=', _('__ENROLL_PROP__'));
			text += get_general_link(url_gate+'.MATMATRICULA/inici&s=', _('__ENROLL__'));
			text += '</div>';

			text += '<div class="row-fluid clearfix"><strong>'+_('__PERSONAL__')+'</strong></div>';
			text += '<div class="row-fluid clearfix">';
			text += get_general_link('/app/guaita/calendari?perfil=estudiant&s=', _('__NEW_AGENDA__'));
			var domainId = "";
			var classrooms = Classes.get_notified();
			for(var i in classrooms){
				if (classrooms[i].domain) {
					domainId = "&domainId=" + classrooms[i].domain;
					break;
				}
			}
			var link = '/webapps/classroom/081_common/jsp/calendari_semestral.jsp?appId=UOC&idLang='+get_lang_code()+'&assignment=ESTUDIANT&domainPontCode=sem_pont'+domainId+'&s=';
			text += get_general_link(link, _('__OLD_AGENDA__'));
			text += get_general_link('/webapps/Agenda/NavigationServlet?s=', _('__PERSONAL_AGENDA__'));
			text += get_general_link('http://cv.uoc.edu/webapps/filearea/servlet/iuoc.fileserver.servlets.FAGateway?opId=getMainFS&company=/UOC&idLang=/'+get_lang_code()+'&sessionId=', _('__FILES__'));
            text += get_general_link('/webapps/classroom/081_common/jsp/aules_estudiant.jsp?domainPontCode=ant&s=', _('__OLD_CLASSROOMS__'));

			text += '</div>';

		    $('#detail_campus').html(text);

            $('.linkTool').unbind( "click" )
                .click(function(){
                    var link = $(this).parents('.resource').attr('link');
                    open_tab(link, {});
                });
		}

		function get_general_link(link, title){
			return '<div class="col-xs-6 resource" link="'+link+'"><a href="#" class="linkTool">'+title+'</a></div>';
		}
	}

	this.pacs = function(force) {
		if(force == true || !pacs_loaded) {
			pacs_loaded = true;
			var limit = get_today_limit();

			var events_pacs = [];
			var events_today = [];
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
                    var title = getFinalTestsTitle(classroom.exams, 'EX');
                    title += title ? "\n" : "";
                    title += getFinalTestsTitle(classroom.exams, 'PS');
					if (title != "") {
						name = '<span title ="' + title + '">' + name + '</span>';
					}
					var evnt = new CalEvent(name, '', 'UOC');
					evnt.start = classroom.exams.date;
					evnt.link = '/tren/trenacc/webapp/GEPAF.FULLPERSONAL/index.jsp?s=';
					events_today.push(evnt);
				}
			}

			var gnral_events = Classes.get_general_events();
			for(var k in gnral_events){
				if (gnral_events[k].is_near(limit)) {
					events_today.push(gnral_events[k]);
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

				for (var l in events_pacs) {
					var eui = new EventUI(events_pacs[l]);
					content_pacs += eui.pacs_event();
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
                    if (isBeforeToday(a.start) && isBeforeToday(b.start)) {
    					var comp = compareDates(a.end, b.end);
    					if (comp == 0) {
    						return compareDates(a.start, b.start);
    					}
    					return comp;
                    }

                    var comp = compareDates(a.start, b.start);
                    if (comp == 0) {
                        return compareDates(a.end, b.end);
                    }
                    return comp;
				});

				for (var m in events_today) {
					var e = new EventUI(events_today[m]);
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
				$('#detail_pacs').html(_('__NOTHING_AHEAD_'));
			}

			$('#show_upcomming').unbind( "click" )
                .click(function(){
    				$('#content_today').show();
    				$('#content_pacs').hide();
    			});

			$('#assignments').unbind( "click" )
                .click(function(){
    				$('#content_today').hide();
    				$('#content_pacs').show();
    			});

		   	$('.linkEvent').unbind( "click" )
                .click(function(){
    				var link = $(this).parents('.event').attr('link');
    				if(link && link != undefined){
    					open_tab(link);
    				}
    			});

			$('.sort_pacs').unbind( "click" )
                .click(function(){
    				var sorting = $(this).attr('by');
    				save_sorting(sorting);
    				UI.pacs(true);
    			});
		}
	};

	function EventUI(evnt) {
		var ev = evnt;

		this.pacs_event = function() {
			if (ev.has_started() && ev.has_ended()) {
				return "";
			}
			var dstart = eventdate(ev.start, "");
			var dend = eventdate(ev.end, "end");
			return common_event(dstart+dend, true);
		};

		this.classroom_event = function() {
			var dstart = eventdate(ev.start, "");
			var dend = eventdate(ev.end, "end");
			var dsol = eventdate(ev.solution, "");
            var dgrade = get_grade_td();

            return common_event(dstart+dend+dsol+dgrade);
		};

		this.today_event = function(limit) {
			var dstart = eventdate(ev.start, isNearDate(ev.start, limit) ? "near" : "");
			var dend = eventdate(ev.end, isNearDate(ev.end, limit) ? "end near" : "end");
			var dsol = eventdate(ev.solution, isNearDate(ev.solution, limit) ? "near" : "");
            var dgrade = get_grade_td(limit);

			return common_event(dstart+dend+dsol+dgrade, true);
		};

		this.classroom_event_grade = function() {
            var dgrade = get_grade_td();
            return common_event(dgrade);
		};

        function get_grade_td(limit) {
            if (ev.graded) {
                var grad = ev.graded;
                if (ev.commenttext) {
                    grad += " "+icon(_('__SHOW_COMMENT__'), 'comment showComments');
                }
                return eventtext(grad, "graded", ev.grading);
            }
            if (limit) {
                return eventdate(ev.grading, isNearDate(ev.grading, limit) ? "near" : "");
            }
            return eventdate(ev.grading, "");
        }

        function common_event(tds, show_subject) {
            var link = ev.link != undefined ? 'link="'+ev.link+'"' : "";

            var eventstate = "";
            if (ev.has_started()) {
                eventstate = ev.has_ended() ? '' : 'running';

                if (ev.is_committed()) {
                    eventstate += ev.has_ended() ? ' success' : ' warning';
                } else {
                    eventstate += ' danger';
                }
            }

            var title = "";
            if (ev.is_assignment()) {
                if (ev.committed) {
                    if (ev.viewed) {
                        title = icon(_('__COMMITTED_VIEWED__', {date: getDate(ev.viewed), time: getTime(ev.viewed)}), 'saved');
                    } else {
                        title = icon(_('__COMMITTED__'), 'save');
                    }
                } else if (ev.completed) {
                    title = colored_icon(_('__'+ev.type+'__') + ': ' + _('__COMPLETED__'), 'check', '');
                } else if(ev.has_ended()){
                    title = colored_icon(_('__NOT_COMMITTED__'), 'remove', 'a94442');
                } else {
                    title = colored_icon(_('__'+ev.type+'__'), 'certificate', '');
                }
            } else if (ev.is_uoc()) {
                title = colored_icon(_('__'+ev.type+'__'), 'education', '');
            } else {
                if (ev.is_committed()) {
                    title = colored_icon(_('__'+ev.type+'__') + ': ' + _('__COMPLETED__'), 'check', '');
                } else {
                    title = colored_icon(_('__'+ev.type+'__'), 'menu-right', '');
                }
            }
            if (show_subject && ev.subject != undefined) {
                title += ev.subject + ' - ';
            }
            title += ev.name;
            var eventId = 'eventid="'+ev.eventId+'"';
            return '<tr class="event '+eventstate+'" '+link+' '+eventId+'><td class="name"><a href="#" class="linkEvent">'+title+'</a></td>'+tds+'</tr>';
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
			if (typeof title != "string") {
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
			return 'style="border-color:#'+col+'; background-color: #'+col+';"';
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

	function open_tab(url, data, nossl){
		session = Session.get();
		if(session){
			if (url.indexOf('?') == -1) {
				if(!data) data = {};
				data.s = session;
				url += '?'+uri_data(data);
			} else if (url[url.length-1] == '=') {
				url += session;
			}
            if (url[0] == '/') {
                if (nossl) {
                    url = root_url + url;
                } else {
                    url = root_url_ssl + url;
                }
            }
			open_new_tab(url);
		}
	}

    this.fill_materials = function(classroom, data) {
        var text = "";
        var lasttitle = false;
        for (var x in data.dades) {
            var material = data.dades[x];
			if (material.defecte) {
                if (lasttitle && lasttitle == material.titol) {
                    for (var y in material.formats) {
                        var format = material.formats[y];
                        text += ' '+get_icon_link(format);
                    }
                } else {
    				text += '<li code="'+material.codMaterial+'">' + material.titol + ' -';
    				for (var y in material.formats) {
    					var format = material.formats[y];
    					text += ' '+get_icon_link(format);
    				}
                    lasttitle = material.titol;
                }
			}
        }

        if (text != "") {
            text = '<ul>'+text+'</ul>';
        }

        var url = '/webapps/aulaca/classroom/Materials.action?classroomId='+classroom.domain+'&subjectId='+classroom.domainassig+'&s=';
        text = '<a href="#" class="linkMaterials" link="'+url+'">'+_('__LINK_TO_EQUIPMENT__')+'</a>'+ text;
        classroom.materials = text;
        this.show_materials(classroom);

		function get_icon_link(format) {
			var icon = false;
			switch(format.tipus._name) {
				case 'PDF':
					icon = 'file';
					break;
                case 'PDF_GRAN':
                    icon = 'text-height';
                    break;
				case 'AUDIOLLIBRE':
					icon = 'headphones';
					break;
				case 'VIDEOLLIBRE':
					icon = 'facetime-video';
					break;
				case 'WEB':
					icon = 'link';
					break;
				case 'EPUB':
					icon = 'book';
					break;
				case 'MOBIPOCKET':
					icon = 'phone';
					break;
				case 'HTML5':
					icon = 'cloud';
					break;
				case 'PROGRAMARI_EN_LINIA':
					icon = 'wrench';
					break;
			}

			var description = format.tipus.nom;
			if (format.tipus.desc && description != format.tipus.desc) {
				description += ': '+format.tipus.desc;
			}
			if (icon) {
				icon = '<span class="glyphicon glyphicon-'+icon+'" aria-hidden="true" title="'+ description+'"></span>';
			} else {
				icon = '[' + description + ']';
			}
			return '<a href="#" class="linkMaterials" link="'+format.url+'">'+icon+'</a></span> ';
		}
    };

	this.fill_users = function(classroom, data) {
		var text = "";
		var connected = "";
		var idp = get_idp();
		for(var x in data.studentUsers) {
			var user = data.studentUsers[x];
			if(user.userNumber == idp) {
				continue;
			}
            var title, clas;
			if (user.connected) {
				title = _('__CONNECTED__');
				clas = 'success';
			} else if (user.lastLoginTime) {
				title = _('__VIEWED_LAST_TIME__', [getDate(user.lastLoginTime), getTime(user.lastLoginTime)]);
				clas = 'warning';
			} else {
				title = _('__DISCONNECTED__');
				clas = 'warning';
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

        classroom.users = text;
        this.show_users(classroom);
	};

    this.show_materials = function(classroom) {
        if (classroom.materials != "") {
            this.show_modal(classroom.get_acronym()+': '+_('__EQUIPMENT__'), classroom.materials);

            $('.linkMaterials').unbind( "click" )
                .click(function(){
                    var link = $(this).attr('link');
                    if (link && link != undefined) {
                        open_tab(link);
                    }
                });
        }
    };

    this.show_users = function(classroom) {
        if (classroom.users != "") {
            this.show_modal(classroom.get_acronym()+': '+_('__USERS__'), classroom.users);

            $('.linkMail').unbind( "click" )
                .click(function(){
                    var mail = $(this).attr('mail');
                    var data = {to: mail};
                    open_tab('/WebMail/writeMail.do', data);
                });
        }
    };

    this.show_modal = function(title, text) {
        $('#uocModalTitle').html(title);
        $('#uocModalBody').html(get_html_realtext(text));
        $('#uocModal').modal('show');
    };
};

$(document).ready(function() {
	UI.init();
});

// Disable alerts
window.alert = function ( text ) { Debug.print( 'ALERT: ' + text ); return true; };
