function check_messages(after_check_fnc){
	Queue.set_after_function(after_check_fnc);

	// Get the new aulas
	var args = {
		perfil : 'estudiant',
		setLng : get_lang(),
		format: 'json'
	}
	Queue.request('/app/guaita/calendari', args, "GET", true, function(data) {
		save_idp(data.idp);
		for (x in data.classrooms) {
			classroom = parse_classroom(data.classrooms[x]);
		}
		Classes.purge_old();

		retrieve_old_classrooms();

		retrieve_agenda();
	});

	retrieve_gradeinfo();

	retrieve_mail();
}

function retrieve_mail() {
	var args = {
		'app:mobile': true,
		'app:cache': false,
		'app:only' : 'bustia'
	}
	Queue.request('/rb/inici/grid.rss', args, 'GET', false, function(resp) {
		$(resp).find('item').each(function() {
    		var description = $(this).find('description').first().text();
    		var matches = description.match(/:([0-9]+):([0-9]+)$/);
			if(matches && matches[1]) {
				save_mail(matches[1]);
			}
		});

	});
}

function save_mail(mails) {
	var old_mails = get_mails_unread();
	save_mails_unread(mails);
	Debug.print("Check mails: "+mails);
	if (mails > 0 && old_mails < mails && mails >= get_critical()) {
		notify(_('__NOTIFICATION_MAIL__', [mails]));
	}
}

function set_messages() {
	var old_messages = get_icon();
	var messages = Classes.notified_messages;
	save_icon(messages);

	// Set icon
	if(messages > 0){
		var color = messages >= get_critical() ? '#AA0000' : '#EB9316';
		setBadge(messages, color);
		if(old_messages < messages && messages >= get_critical()){
			notify(_('__NOTIFICATION_UNREAD__', [messages]));
		}
	} else {
		setBadge("");
	}

	Debug.print("Check messages: Old "+old_messages+" New "+messages);
}

function show_PAC_notifications() {
	var classrooms = Classes.get_notified();
	for(var i in classrooms) {
		for(var x in classrooms[i].events) {
			var ev = classrooms[i].events[x];
			if (ev.is_assignment()) {
				if (ev.ends_today()) {
					notify(_('__PRACT_END__', [ev.name, classrooms[i].get_acronym()]));
				} else if (ev.starts_today()) {
					notify(_('__PRACT_START__', [ev.name, classrooms[i].get_acronym()]));
				}
			}
		}
	}
}

function notify(str, time) {
	if (get_notification() && str.length > 0) {
		if (time == undefined) {
			time = 3000;
		}
		Debug.print(str);
		popup_notification('UOC Notifier', "/img/logo128.png", str, time);
	}
}

function parse_classroom(classr) {
	var title = classr.shortTitle ? classr.shortTitle : classr.title;
	var classroom = Classes.search_domainassig(classr.domainFatherId);
	if (!classroom) {
		var classroom = new Classroom(title, classr.domainCode, classr.domainId, classr.domainTypeId, classr.ptTemplate);
		classroom.domainassig = classr.domainFatherId;
	} else {
		if (!classroom.title) {
			classroom.title = title;
		}
		classroom.code = classr.domainCode;
		classroom.domain = classr.domainId;
		classroom.type = classr.domainTypeId;
		classroom.template = classr.ptTemplate;
	}
	classroom.set_color(classr.color);
	classroom.any = classr.anyAcademic;
	classroom.aula = classr.numeralAula;

	var consultor = false;
	if (classr.widget.consultor != undefined && classr.widget.consultor.nomComplert != undefined) {
		consultor = classr.widget.consultor.nomComplert;
	}
	for (var x in classr.widget.referenceUsers) {
		if (!consultor || classr.widget.referenceUsers[x].fullName == consultor) {
			classroom.consultor = classr.widget.referenceUsers[x].fullName;
			classroom.consultormail = classr.widget.referenceUsers[x].email;
			classroom.consultorlastviewed = classr.widget.referenceUsers[x].lastLoginTime;
			break;
		}
	}
	Classes.add(classroom);

	if (!Classes.get_notify(classroom.code)) {
		return;
	}

	// Parse resources
	if (classr.widget.eines.length > 0) {
		for(var j in classr.widget.eines){
			var resourcel = classr.widget.eines[j];
			var resource = new Resource(resourcel.nom, resourcel.resourceId);
			classroom.add_resource(resource);
			resource.set_link(resourcel.viewItemsUrl);
			retrieve_resource(classroom, resource);
		}
	}

	// Parse events
	if (classr.activitats.length > 0) {
		for (y in classr.activitats) {
			var act = classr.activitats[y];
			var evnt = new Event(act.name, act.eventId, 'ASSIGNMENT');

			var args = {};
			if (classr.presentation == "AULACA") {
				var urlbase = '/webapps/aulaca/classroom/Classroom.action';
				args.classroomId = act.classroomId;
				args.subjectId = act.subjectId;
				args.activityId = act.eventId;
				args.javascriptDisabled = false;
			} else {
				var urlbase = '/webapps/classroom/081_common/jsp/eventFS.jsp';
				args.domainId = act.domainId;
				var aux = classr.domainCode.split('_');
				args.domainTemplate = 'uoc_'+aux[0]+'_'+classr.codi;
				args.idLang =  get_lang_code();
				args.eventsId = act.eventId;
				args.opId = 'view';
				args.userTypeId = 'ESTUDIANT';
				args.canCreateEvent = false;
			}

			evnt.link = root_url + urlbase+'?'+uri_data(args)+'&s=';
			evnt.start = act.startDateStr;
			evnt.end = act.deliveryDateStr;
			evnt.solution = act.solutionDateStr;
			evnt.grading = act.qualificationDateStr;
			classroom.add_event(evnt);
		}
	}
}

function retrieve_old_classrooms(){
	var args = {
		newStartingPage:0,
		language: get_lang_code()
	}
	Queue.request('/UOC2000/b/cgi-bin/hola', args, 'GET', false, function(resp) {
		var index = resp.indexOf("aulas = ");
		if (index != -1) {
			var lastPage = resp.substring(index + 8);
			var last = lastPage.indexOf(";");
			lastPage = lastPage.substring(0,last);
			var classrooms = eval(lastPage);
			for(var i in classrooms){
				parse_classroom_old(classrooms[i]);
			}
		}
	});
}

function parse_classroom_old(classr){
	if(classr.title) {
		var title = classr.shortname ? classr.shortname : classr.title;
		switch (classr.domaintypeid) {
			case 'TUTORIA':
				var classroom = Classes.search_domainassig(classr.domainid);
				var sp = title.split(classr.codi_tercers);
				title = sp[0].trim();
				if (!classroom) {
					classroom = new Classroom(title, classr.code, classr.domainid, classr.domaintypeid, classr.pt_template);
				} else {
					classroom.title = title;
					classroom.code = classr.code;
					classroom.domain = classr.domainid;
					classroom.domainassig = classr.domainid;
					classroom.type = classr.domaintypeid;
					classroom.template = classr.pt_template
				}

				classroom.aula = classr.codi_tercers;
				break;
			case 'ASSIGNATURA':
				// Override title
				var classroom = Classes.search_domainassig(classr.domainid);
				if (classroom) {
					classroom.title = title;
				}
				return;
			case 'AULA':
				return;

		}
		if (classroom) {
			if(Classes.get_notify(classroom.code)) {
				retrieve_users(classroom);

				for(var j in classr.resources){
					var resourcel = classr.resources[j];
					if(resourcel.title){
						var resource = new Resource(resourcel.title, resourcel.code);
						resource.set_messages(resourcel.numMesPend, resourcel.numMesTot);
						classroom.add_resource(resource);
					}
				}
			}
			Classes.add(classroom);
		}
	}
}

function retrieve_gradeinfo() {
	Queue.request('/rb/inici/api/enrollment/rac.xml', {}, 'GET', false, function(data, args) {
		$(data).find('asignatura>asignatura').each(function() {
			var classroom = false;

			$(this).find('actividad>actividad').each(function() {
				var eventid = $(this).find('pacId').text().trim();
				if (!classroom) {
					classroom = Classes.get_class_by_event(eventid);
					if (!classroom) {
						return;
					}
				}

				var evnt = classroom.get_event(eventid);
				if (evnt && evnt.is_assignment()) {
					var changed = false;

					var committed = $(this).find('listaEntregas>entrega').length > 0;
					if (committed) {
						evnt.committed = true;
						var viewed = $(this).find('listaEntregas>entrega').last().find('fechaDescargaConsultor').html();
						evnt.viewed = viewed && viewed.length ? viewed: false;
						classroom.add_event(evnt);
						changed = true;
					}

					var grade = $(this).find('nota').text().trim();
					if (grade.length > 0 && grade != '-') {
						if (evnt.graded != grade) {
							evnt.graded = grade;
							changed = true;
							notify(_('__PRACT_GRADE__', [grade, evnt.name, classroom.get_acronym()]), 0);
						}
					}
					if (changed) {
						classroom.add_event(evnt);
					}
				} else {
					var nota = $(this).find('nota').text().trim();
					if (nota.length > 0 && nota != '-') {
						var name = $(this).find('descripcion').text().trim();
						var grade = classroom.add_grade(name, nota);
						if (grade) {
							notify(_('__FINAL_GRADE__', [grade.grade, grade.get_title(), classroom.get_acronym()]), 0);
						}
					}
				}
			});

			if (classroom) {
				var nota = $(this).find('notaFinal').text().trim();
				if (nota.length > 0 && nota != '-') {
					var grade = classroom.add_grade('FA', nota);
					if (grade) {
						notify(_('__FINAL_GRADE__', [grade.grade, grade.get_title(), classroom.get_acronym()]), 0);
					}
				}
				var nota = $(this).find('notaFinalContinuada').text().trim();
				if (nota.length > 0 && nota != '-') {
					var grade = classroom.add_grade('FC', nota);
					if (grade) {
						notify(_('__FINAL_GRADE__', [grade.grade, grade.get_title(), classroom.get_acronym()]), 0);
					}
				}
			}
		});
	});
}

function retrieve_resource(classroom, resource){
	var args = {
		sectionId : '-1',
		pageSize : 0,
		pageCount: 0,
		classroomId: classroom.domain,
		subjectId: classroom.domainassig,
		resourceId: resource.code
	};
	Queue.request('/webapps/aulaca/classroom/LoadResource.action', args, 'GET', false, function(data) {
		try {
			var num_msg_pendents = data.resource.newItems;
	        var num_msg_totals = data.resource.totalItems;
			resource.set_messages(num_msg_pendents, num_msg_totals);
			resource.set_pos(data.resource.pos);
		} catch(err) {
    		Debug.error(err);
		}
		classroom.add_resource(resource);
    });
}

function retrieve_users(classroom){
	var args = {
		classroomId : classroom.domain,
		subjectId : classroom.domainassig
	};
	Queue.request('/webapps/aulaca/classroom/UsersList.action', args, 'GET', false, function(data) {
		try {
			if (data.tutorUsers[0]) {
				var user = data.tutorUsers[0];
				classroom.consultor = user.fullName;
				classroom.consultormail = user.email;
				classroom.consultorlastviewed = user.lastLoginTime;
				return;
			}
			if (data.referenceUsers[0]) {
				var user = data.referenceUsers[0];
				classroom.consultor = user.fullName;
				classroom.consultormail = user.email;
				classroom.consultorlastviewed = user.lastLoginTime;
			}
		} catch(err) {
    		Debug.error(err);
		}
    });
}

function retrieve_agenda() {
	var args = {
		'app:mobile': false,
		'app:cache': false,
		'app:only' : 'agenda',
		'app:Delta' : 1
	}
	Queue.request('/rb/inici/grid.rss', args, 'GET', false, function(resp) {
		var items = $(resp).find('item category:contains(\'CALENDAR\')').parents('item');
		if (items.length > 0) {
			var q = new Date();
			items.each(function() {
				var json = rssitem_to_json(this);
				// Do not update old events
				if (isBeforeToday_date(json.pubDate)) {
					/*if (parseInt(json.EVENT_TYPE) == 16) {
						var title = json.title + ' ' + json.description;
						var evnt = new Event(title, json.guid, 'GNRAL');
						agenda.push(evnt);
						//console.log(ev, json);
						return;
					}*/

					var id = json.guid.split('_');
					var classroom = Classes.get_class_by_event(id[0]);
					if (!classroom) {
						var acronym = get_acronym(json.description);
						classroom = Classes.get_class_by_acronym(acronym);
					}
					if (!classroom) {
						Debug.print('Classroom not found');
						Debug.print(json);
						return;
					}

					var evnt = false;
					evnt = classroom.get_event(id[0]);
					if (evnt && evnt.is_assignment()) {
						// The Assignments are processed in other parts
						return;
					}

					var title = json.title.split('[');
					title = title[0].trim();
					if (!evnt) {
						var evnt = new Event(title, id[0], 'MODULE');
					}
					var date =  getDate_hyphen(json.pubDate);
					switch (parseInt(json.EVENT_TYPE)) {
						case 22:
						case 26:
							evnt.type = 'MODULE';
							evnt.start = date;
							break;
						case 23:
							evnt.type = 'STUDY_GUIDE';
							evnt.start = date;
							break;
						case 29:
							evnt.end = date;
							break;
						default:
							Debug.print('Unknown event type ' + json.EVENT_TYPE);
							Debug.print(json);
							return;
					}
					evnt.link = json.link+'&s=';
					classroom.add_event(evnt);
				}
			});
		}
	});
}


function retrieve_news(){
	var args = {
		up_isNoticiesInstitucionals : false,
		//up_title : 'Novetats%2520i%2520noticies',
		//up_maximized: true,
		up_maxDestacades : 2,
		up_showImages : 0,
		up_sortable : true,
		//up_ck : 'nee',
		up_maxAltres: 5,
		up_rssUrlServiceProvider : '%252Festudiant%252F_resources%252Fjs%252Fopencms_estudiant.js',
		up_target : 'noticies.jsp',
		//libs : '/rb/inici/javascripts/prototype.js,/rb/inici/javascripts/effects.js,/rb/inici/javascripts/application.js,/rb/inici/javascripts/prefs.js,%2Frb%2Finici%2Fuser_modul%2Flibrary%2F944751.js%3Ffeatures%3Dlibrary%3Asetprefs%3Adynamic-height',
		fromCampus : true,
		//lang: get_lang(),
		//country: 'ES',
		//color: '',
		//userType: 'UOC-ESTUDIANT-gr06-a',
		//hp_theme: 'false'
	}

	Queue.request('/webapps/widgetsUOC/widgetsNovetatsExternesWithProviderServlet', args, 'GET', false, function(resp) {
		resp = resp.replace(/<img/gi, '<noload');
		var news = $('<div />').append(resp).find('#divMaximizedPart>ul').html();
		if (news != undefined) {
			$('#detail_news').html(news);
		}
	});
}

var Session = new function(){
	var retrieving = false;
	var session = false;

	this.get = function() {
		if (!session) {
			session = get_session();
		}
		return session;
	}

	this.reset_retrieve = function() {
		session = false;
		this.retrieve();
	}

	this.retrieve = function() {
		var user_save = get_user();
		if(user_save.username && user_save.password) {
			if (!retrieving) {
				Debug.print('Retrieving session...');
				retrieving = true;

				var url = '/webapps/cas/login';
				var s = this.get();
				if (!s || s.length <= 0) {
					url += '?renew=true';
				}

				$.ajax({
					type: 'GET',
					url: root_url_ssl + url,
				})
				.done(function(resp) {
					if(resp.match(/name="lt" value="([^"]+)"/)) {
						var lt = resp.match(/name="lt" value="([^"]+)"/)[1];
						var execution = resp.match(/name="execution" value="([^"]+)"/)[1];
						Debug.print('No session, logging in');

						var data = {
							username: user_save.username,
							password: user_save.password,
							lt: lt,
							execution: execution,
							_eventId: 'submit'
						};
					    url = root_url_ssl + "/webapps/cas/login";
					    $.ajax({
					        type: 'POST',
					        beforeSend: function (request){
					            request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
					        },
					        xhrFields: {
					            withCredentials: true
					        },
					        url: url,
					        data: uri_data(data),
					        processData: false
					    })
					    .done(function(resp) {
					    	Debug.log(resp);
					    	var matchs = resp.match(/campusSessionId = ([^\n]*)/);
							if (matchs) {
								var session = matchs[1];
								save_session(session);
								Debug.print('Session! '+session);
								Queue.run();
								if (typeof login_success == 'function') {
									login_success();
								}
							} else {
								Debug.error('ERROR: Cannot fetch session');
								if (typeof login_failed == 'function') {
									login_failed();
								}
							}
					    })
					    .fail(function() {
					        Debug.error('ERROR: Cannot login');
					    })
					    .always(function() {
					        retrieving = false;
					    });
					} else {
						var matchs = resp.match(/campusSessionId = ([^\n]*)/);
						if (matchs) {
							var session = matchs[1];
							save_session(session);
							Debug.print('Session! '+session);
							Queue.run();
							if (typeof login_success == 'function') {
								login_success();
							}
						} else {
							Debug.error('ERROR: Cannot fetch session');
							if (typeof login_failed == 'function') {
								login_failed();
							}
						}
					}
				})
				.fail(function() {
			        Debug.error('ERROR: Cannot renew session');
			    })
			    .always(function() {
			        retrieving = false;
			    });
			}
		}
	}
}
