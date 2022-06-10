function check_messages(after_check_fnc, after_check_fail) {
	save_check_nexttime(false);

	Queue.set_after_function(after_check_fnc);
	Queue.set_after_fail(after_check_fail);

	retrieve_mail();

	retrieve_announcements();

	// Get the new aulas
	var args = {
		perfil : 'estudiant',
		setLng : get_lang(),
		format: 'json'
	};
	Queue.request('/app/guaita/calendari', args, "GET", true, function(data) {
		save_idp(data.idp);
		for (var x in data.classrooms) {
			parse_classroom(data.classrooms[x]);
		}
		keep_checking();
	}, keep_checking);
}

function keep_checking() {
	Classes.purge_old();

	retrieve_tutoria_from_rss();

	retrieve_gradeinfo();

	retrieve_agenda();

	var classrooms = Classes.get_notified();
	for(var i in classrooms) {
		retrieve_final_grades(classrooms[i]);
		retrieve_stats(classrooms[i]);
	}

	retrieve_final_exams_event();
}

function retrieve_final_grades(classroom) {
	if (!classroom.exped || !classroom.subject_code || classroom.final_grades || !classroom.all_events_completed(true)) {
		return;
	}

	// Stop retrieving this when exams are not done
	if (classroom.exams && classroom.exams.date && !isBeforeToday(classroom.exams.date) && !isToday(classroom.exams.date)) {
		Debug.print('Exam not done, not retrieving final grades for '+classroom.acronym);
		return;
	}

	var args = {
		"F": "edu.uoc.gat.cexped.AppFactory",
		"I": [{
			"O": 'Od9l_GxbvdWUtIsyoEt2IWynnbk=',
			"P": [classroom.subject_code, parseInt(classroom.exped)]
		}]
	};
	// Always GAT_EXP, not dependant on UOCi
	Queue.request( '/tren/trenacc/webapp/GAT_EXP.CEXPEDWEB/gwtRequest', args, 'json', false, function(resp) {
		try {
			var grades = false;
			var numConvoc = 0;
			if (classroom.any) {
				for (var x in resp.O) {
					if (resp.O[x].P.anyAcademico == classroom.any) {
						grades = resp.O[x].P;
					} else {
						numConvoc = Math.max(numConvoc, resp.O[x].P.numConvocatoriaActual);
					}
				}
			}

			if (!grades) {
				grades = resp.O.shift().P;
			}
			Debug.print("Grades found!");
			Debug.print(grades);

			var prov = grades.numConvocatoriaActual <= numConvoc;
			var types = ['C', 'P', 'FC', 'PS', 'PV', 'EX', 'PF',  'FE', 'FA'];

			for(var i in types) {
				var type = types[i];
				var lettername = "codCalif"+type;
				var numbername = "numCalif"+type;
				var letter = grades[lettername];
				if (letter != undefined && letter != '' && letter != 'N') {
					var nota = letter;
					var number = grades[numbername];
					if (number != undefined && number != '') {
						nota += " " + number;
					}
					var grade = classroom.add_grade(type, nota, prov);
					if (grade) {
						grade.notify(classroom.get_acronym());
					}
				}
			}

			if (!prov) {
				classroom.final_grades = true;
			}
		} catch(err) {
			Debug.error(err);
		}
	});

}

function retrieve_final_exams_event() {
	var idp = get_idp();
	if (!idp) {
		return;
	}

	// Stop retrieving this when exams are over
	var classrooms = Classes.get_notified();
	var exams = false;
	for(var x in classrooms) {
		var classroom = classrooms[x];
		if (classroom.exams && classroom.exams.date) {
			exams = compareDates(exams, classroom.exams.date) > 0 ? exams : classroom.exams.date;
		}
	}
	if (exams && isBeforeToday(exams)) {
		return;
	}

	var any = Classes.get_max_any();
	var args = {
		"F": "edu.uoc.gepaf.fullpersonalpaf.AppFactory",
		"I": [{
			"O": 'xUK0l32plsYSkUc00vYpZ2oukRM=',
			"P": ['' + any, "1", '' + idp, "ESTUDIANT"]
		}]
	};
	Queue.request('/tren/trenacc/webapp/GEPAF.FULLPERSONAL/gwtRequest', args, 'json', false, function(resp) {
		try {
			var objects = resp.O;
			for (var x in objects) {
				var object = objects[x].P;
				if (object.veureAula) {
					var code = object.codAssignatura;
					var classroom = Classes.search_subject_code(code);
					if (classroom) {
						var exam = {};
						if (object.indExam == 'S') {
							exam.date = getDate_slash(object.dataExamenFormatada);
							exam.seu =  object.descSeu;
							exam.timeEX =  getTimeFromNumber(object.horaIniciExamen) + ' - ' + getTimeFromNumber(object.horaFiExamen);
							exam.placeEX =  object.llocExam;
						}
						if (object.indProva == 'S') {
							exam.date = getDate_slash(object.dataExamenFormatada);
							exam.seu = object.descSeu;
							exam.timePS =  getTimeFromNumber(object.horaIniciProva) + ' - ' + getTimeFromNumber(object.horaFiProva);
							exam.placePS = object.llocProva;
						}
						classroom.exams = exam;
					}
				}
			}

		} catch(err) {
			Debug.error(err);
		}
	});

}

function retrieve_announcements() {
	var args = {
		'app:mobile': true,
		'app:cache': false,
		'app:only' : 'avisos'
	};
	Queue.request('/rb/inici/grid.rss', args, 'GET', false, function(resp) {
		var announcements = [];
		var items = $(resp).find('item category:contains(\'ANNOUNCEMENT\')').parents('item');
		if (items.length > 0) {
			items.each(function() {
				var json = rssitem_to_json(this);
				if (json.title != "" && json.description != "") {
					var announcement = {
						title: json.title,
			    		description: json.description,
			    		link: json.link
			    	};

			    	var date = new Date(json.pubDate);
		    		var y = date.getFullYear() - 2000;
				    var m = date.getMonth() + 1;
				    var d = date.getDate();
				    var h = date.getHours();
				    var mm = date.getMinutes();

		    		announcement.date = addZero(d)+'/'+addZero(m)+'/'+addZero(y) + ' - '+h+':'+addZero(mm);

		    		announcements.push(announcement);
		    	}
			});
		}
		save_announcements(announcements);
	});
}

function retrieve_mail() {
	if (get_check_mail()) {
		var args = {
			'app:mobile': true,
			'app:cache': false,
			'app:only' : 'bustia'
		};
		Queue.request('/rb/inici/grid.rss', args, 'GET', false, function(resp) {
			$(resp).find('item').each(function() {
	    		var description = $(this).find('description').first().text();
	    		var matches = description.match(/:([0-9]+):([0-9]+)$/);
				if (matches && matches[1]) {
					save_mail(matches[1]);
				}
			});

		});
	}
}

function save_mail(mails) {
	var old_mails = get_mails_unread();
	save_mails_unread(mails);
	Debug.print("Check mails: "+mails);
	if (mails > 0 && old_mails < mails && mails >= get_critical()) {
		notify(_('__NOTIFICATION_MAIL__', {messages: mails}));
	}
}

function set_messages() {
	var old_messages = get_icon();
	var messages = Classes.notified_messages;
	save_icon(messages);

	var color;

	// Set icon
	if (messages > 0) {
		if (messages > old_messages && messages >= get_critical()) {
			notify(_('__NOTIFICATION_UNREAD__', {messages: messages}));
		}
		color = messages >= get_critical() ? '#AA0000' : '#EB9316';
	}

	Debug.print("Check messages: Old "+old_messages+" New "+messages);

	var news = has_news();
	if (news) {
		color = '#9E5A9E';
	} else if (messages <= 0) {
		messages = "";
	}

	setBadge(messages, color);
}

function show_PAC_notifications() {
	var classrooms = Classes.get_notified();
	for(var i in classrooms) {
		for(var x in classrooms[i].events) {
			var ev = classrooms[i].events[x];
			if (ev.is_assignment()) {
				if (ev.ends_today()) {
					notify(_('__PRACT_END__', {pract: ev.name, class: classrooms[i].get_acronym()}));
				} else if (ev.starts_today()) {
					notify(_('__PRACT_START__', {pract: ev.name, class: classrooms[i].get_acronym()}));
				}
			}
		}
	}
}

function notify(str, time) {
	save_has_news(true);
	if (get_notification() && str.length > 0) {
		if (time == undefined) {
			time = 3000;
		}
		Debug.print(str);
		popup_notification("", "/img/logo128.png", str, time);
	}
}

function parse_classroom(classr) {
	var title = classr.shortTitle ? classr.shortTitle : classr.title;
	var classroom = Classes.search_domainassig(classr.domainFatherId);
	if (!classroom) {
		var aul = title.lastIndexOf(" aula " + classr.numeralAula);
		if (aul > 0) {
			title = title.substr(0, aul);
		}

		classroom = new Classroom(title, classr.domainCode, classr.domainId, classr.domainTypeId);
		classroom.domainassig = classr.domainFatherId;
	} else {
		classroom.code = classr.domainCode;
		classroom.domain = classr.domainId;
		classroom.type = classr.domainTypeId;
	}
	classroom.set_color(classr.color);
	classroom.any = classr.anyAcademic;
	classroom.aula = classr.numeralAula;
	classroom.subject_code = classr.planCode;

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
		classroom.delete_old_resources();
		for(var j in classr.widget.eines) {
			var resourcel = classr.widget.eines[j];
			if (resourcel.nom) {
				var resource = new Resource(resourcel.nom, resourcel.resourceId);
				if( resourcel.viewItemsUrl ){
					resource.set_link(resourcel.viewItemsUrl);
				}
				resource.set_pos(j);
				resource = classroom.add_resource(resource);
				retrieve_resource(classroom, resource);
			}
		}
	}

	// Parse events
	if (classr.activitats.length > 0) {
		for (var y in classr.activitats) {
			var urlbase, link, eventtype;

			var act = classr.activitats[y];

			switch(act.eventTypeId) {
				case 31:
					eventtype = 'MODULE';
					break;
				case 28: // Practica
				case 29: // PAC
					eventtype = 'ASSIGNMENT';
					break;
				case 23: // Old study guides...
					Debug.error('Study guide found! :D');
					eventtype = 'STUDY_GUIDE';
					break;
				default:
					eventtype = 'ASSIGNMENT';
					Debug.error('Unknown event type ' + act.eventTypeId);
					Debug.print(act);
					break;
			}

			var evnt = new CalEvent(act.name, act.eventId, eventtype);

			if (act.link) {
				evnt.link = get_url_withoutattr(act.link,'s')+'&s=';
			} else {
				Debug.error('Link not found');
				Debug.print(act);
				var args = {};
				if (classr.presentation == "AULACA") {
					urlbase = '/webapps/aulaca/classroom/Classroom.action';
					args.classroomId = act.classroomId;
					args.subjectId = act.subjectId;
					args.activityId = act.eventId;
					args.javascriptDisabled = false;
				} else {
					urlbase = '/webapps/classroom/081_common/jsp/eventFS.jsp';
					args.domainId = act.domainId;
					var aux = classr.domainCode.split('_');
					args.domainTemplate = 'uoc_'+aux[0]+'_'+classr.codi;
					args.idLang =  get_lang_code();
					args.eventsId = act.eventId;
					args.opId = 'view';
					args.userTypeId = 'ESTUDIANT';
					args.canCreateEvent = false;
				}
				evnt.link = urlbase+'?'+uri_data(args)+'&s=';
			}

			evnt.start = getDate_hyphen(act.startDate);
			evnt.end = getDate_hyphen(act.deliveryDate);
			evnt.solution = getDate_hyphen(act.solutionDate);
			evnt.grading = getDate_hyphen(act.qualificationDate);
			classroom.add_event(evnt);
		}
		if (!classroom.final_grades && !classroom.stats) {
			retrieve_timeline(classroom);
		}
	}
}

function retrieve_tutoria_from_rss() {
	var args = {
		'app:mobile': true,
		'app:cache': false,
		'app:only' : 'aules'
	};
	Queue.request('/rb/inici/grid.rss', args, 'GET', false, function(resp) {
		$(resp).find('item').each(function() {
			var item = $(this);
			var category = item.find('category').first().text();
			if (category.indexOf('AULA_TUTOR_DEFINITION') >= 0) {
				var code = category.split('-')[0],
					domainId = category.split('-')[1];
					classroom = Classes.search_domainassig(domainId),
					title = get_html_realtext(item.find('title').text()),
					codiTercers = code.split('_')[0].toUpperCase() || false;

				if (codiTercers) {
					var aux = title.split(codiTercers)[0].trim();
					title = aux ? aux : title;
				}

				if (!classroom) {
					classroom = new Classroom(title, code, domainId, 'TUTORIA');
				} else {
					classroom.title = title;
					classroom.code = code;
					classroom.domain = domainId;
					classroom.domainassig = domainId;
					classroom.type = 'TUTORIA';
				}
				classroom.aula = codiTercers;

				var tagColor = item.find('category:contains("MODUL_COLOR")').first().text();
				if (tagColor) {
					classroom.color = tagColor.split('#')[1].split('-')[0];
				}

				if (classroom.notify) {
					retrieve_consultor(classroom);
					try {
						$(resp).find("item > category:contains('" + code + "-AULA'):contains('_RESOURCES')").each(function() {
							var item = rssitem_to_json($(this).parent()),
								title = get_html_realtext(item.title);

							if (title) {
								var resource = new Resource(title, "");
								resource.set_link(item.url);
								resource.code = get_url_attr(resource.link, 'l');
								if (title != 'Microblog') {
									resource.type = "old";
									var messages = parseInt(item.description.split(':')[0]);
										allmessages = parseInt(item.description.split(':')[1]);
									resource.set_messages(messages, allmessages);
								} else {
									resource.type = "oldblog";
								}
								classroom.add_resource(resource);
							}
						});
					} catch (err) {
						Debug.error(err);
					}
				}

				Classes.add(classroom);
			}
		});
	});
}

function retrieve_timeline(classroom) {
	var args = {
		classroomId: classroom.domain,
		subjectId: classroom.domainassig,
		javascriptDisabled: false
	};
	Queue.request('/webapps/aulaca/classroom/timeline/timeline', args, 'POST', false, function(data) {
		for (var i in data.events) {
			var event = data.events[i];
			var class_event = classroom.get_event(event.id);
			if (class_event) {
				class_event.completed = event.completed;
			}
		}
	});
}


function retrieve_gradeinfo() {
	if (Classes.is_all_graded()) {
		return;
	}

	Queue.request('/rb/inici/api/enrollment/rac.xml', {}, 'GET', false, function(data) {
		$(data).find('files>file').each(function() {
			var exped = $(this).children('id').first().text().trim();

			$(this).find('listaAsignaturas asignatura').each(function() {
				// If has a children of same type
				if ($(this).has('asignatura').length > 0) {
					return;
				}

				var subject_code = $(this).find('codigo').first().text().trim();
				var classroom = Classes.search_subject_code(subject_code);
				if (classroom && !classroom.notify) {
					return;
				}

				$(this).find('listaActividades actividad').each(function() {
					// If has a children of same type
					if ($(this).has('actividad').length > 0) {
						return;
					}

					var eventid = $(this).find('pacId').text().trim();
					if (eventid) {
						if (!classroom) {
							classroom = Classes.get_class_by_event(eventid);
							if (!classroom) {
								return;
							}

							// Save the real subject code
							classroom.subject_code = subject_code;
						}

						if (!classroom.notify) {
							return;
						}
						classroom.exped = exped;

						var evnt = classroom.get_event(eventid);
						if (evnt && evnt.is_assignment()) {
							var changed = false;

							var committed = $(this).find('listaEntregas>entrega').length > 0;
							if (committed) {
								evnt.committed = true;
								var viewed = $(this).find('listaEntregas>entrega').last().find('fechaDescargaConsultor').html();
								evnt.viewed = viewed && viewed.length ? viewed: false;
								changed = true;
							}

							var comments = $(this).find('listaComentarios>comentario').length > 0;
							if (comments) {
								var lastcomment = $(this).find('listaComentarios>comentario').last();
								evnt.commenttext = lastcomment.find('texto').html();
								evnt.commentdate= lastcomment.find('fechaComentario').html();
								changed = true;
							}

							var grade = $(this).find('nota').text().trim();
							if (grade.length > 0 && grade != '-') {
								if (evnt.graded != grade) {
									evnt.graded = grade;
									changed = true;
									evnt.notify(classroom.get_acronym());
								}
							}
							if (changed) {
								classroom.add_event(evnt);
							}
						}
					} else if(classroom) {
						if (!classroom.notify) {
							return;
						}
						classroom.exped = exped;

						var nota = $(this).find('nota').text().trim();
						if (nota.length > 0 && nota != '-') {
							var name = $(this).find('descripcion').text().trim();
							var grade = classroom.add_grade(name, nota, false);
							if (grade) {
								grade.notify(classroom.get_acronym());
							}
						}
					}
				});

				if (classroom) {
					classroom.has_grades = true;
					var nota = $(this).find('notaFinal').text().trim();
					if (nota.length > 0 && nota != '-') {
						var grade = classroom.add_grade('FA', nota, true);
						if (grade) {
							grade.notify(classroom.get_acronym());
						}
					}

					nota = $(this).find('notaFinalContinuada').text().trim();
					if (nota.length > 0 && nota != '-') {
						var grade = classroom.add_grade('FC', nota, false);
						if (grade) {
							grade.notify(classroom.get_acronym());
						}
					}
				}
			});
		});
	});
}

function retrieve_stats(classroom) {
	if (!classroom.has_grades || !classroom.subject_code || classroom.stats || !classroom.all_events_completed(true)) {
		return;
	}

	// Stop retrieving this when exams are not done
	if (classroom.exams && classroom.exams.date && !isBeforeToday(classroom.exams.date) && !isToday(classroom.exams.date)) {
		Debug.print('Exam not done, not retrieving stats for '+classroom.acronym);
		return;
	}

	var args = {modul: 'GAT_EXP.ESTADNOTES/estadis.assignatures',
				assig: classroom.subject_code,
				pAnyAcademic: classroom.any
			};
	Queue.request('/tren/trenacc', args, 'GET', false, function(data) {
		var index = data.indexOf("addRow");
		if (index != -1) {
			notify(_('__NOT_STATS__', {class: classroom.get_acronym()}));
			classroom.stats = true;
		}
	});
}

function retrieve_resource(classroom, resource) {
	if (resource.type == "externallink") {
		return;
	}

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
			resource.type = data.resource.widgetType;

	        if (resource.type == "messagelist" || resource.type == "grupsdetreball") {
	        	resource.set_messages(data.resource.newItems, data.resource.totalItems);
	        } else if (resource.type == "blog" || resource.type == "microblog") {
				resource.news = !!data.resource.missatgesNousBlog;
	        }
		} catch(err) {
    		Debug.error(err);
		}
		classroom.add_resource(resource);
    });
}

function retrieve_consultor(classroom) {
	var args = {
		classroomId : classroom.domain,
		subjectId : classroom.domainassig
	};
	Queue.request('/webapps/aulaca/classroom/UsersList.action', args, 'GET', false, function(data) {
		var user;
		try {
			if (data.tutorUsers[0]) {
				user = data.tutorUsers[0];
				classroom.consultor = user.fullName;
				classroom.consultormail = user.email;
				classroom.consultorlastviewed = user.lastLoginTime;
				return;
			}
			if (data.referenceUsers[0]) {
				user = data.referenceUsers[0];
				classroom.consultor = user.fullName;
				classroom.consultormail = user.email;
				classroom.consultorlastviewed = user.lastLoginTime;
			}
		} catch(err) {
    		Debug.error(err);
		}
    });
}

function retrieve_users(classroom, button) {
	var args = {
		classroomId : classroom.domain,
		subjectId : classroom.domainassig
	};
	Queue.set_after_function('nosave');
	Queue.request('/webapps/aulaca/classroom/UsersList.action', args, 'GET', false, function(data) {
		UI.fill_users(classroom, data);
		$(button).removeClass('spin');
    }, function(data) {
    	$(button).removeClass('spin');
    });
}

function retrieve_materials(classroom, button) {
	var args = {
		codAssig : classroom.subject_code
	};
	Queue.set_after_function('nosave');
	Queue.request('/webapps/mymat/listMaterialsAjax.action', args, 'GET', false, function(data) {
		UI.fill_materials(classroom, data);
		$(button).removeClass('spin');
    }, function(data) {
    	$(button).removeClass('spin');
    });
}

function retrieve_pac_stats(classroom, button) {
	var args = {
		codiTercers : classroom.subject_code,
		anyAcademic : classroom.any,
		numAula: classroom.aula,
		type: 't' // If not present only shows the current classroom
	};

	Queue.set_after_function('nosave');
	Queue.request('/webapps/rac/getEstadisticasAsignaturaAjax.action', args, 'GET', false, function(data) {
		Debug.print(data);
		//UI.fill_pac_stats(classroom, data);
		$(button).removeClass('spin');
    });
}

function retrieve_agenda() {
	var args = {
		'app:mobile': true,
		'app:cache': false,
		'app:only' : 'agenda',
		'app:Delta' : 365
	};
	Queue.request('/rb/inici/grid.rss', args, 'GET', false, function(resp) {
		var items = $(resp).find('item category:contains(\'CALENDAR\')').parents('item');
		if (items.length > 0) {
			items.each(function() {
				var json = rssitem_to_json(this);

				// General events
				if (parseInt(json.EVENT_TYPE) == 16) {
					var title = json.title + ' ' + json.description;
					var evnt = new CalEvent(title, json.guid, 'UOC');
					evnt.start =  getDate_hyphen(json.pubDate);
					Classes.add_event(evnt);
				}
				// Classroom events now are parsed in other places.
				//parse_agenda_event(json);
			});
		}
	});
}


var Session = new function() {
	var retrieving = false;
	var session = false;

	this.get = function() {
		if (!session) {
			session = get_session();
		}
		return session;
	};

	this.reset_retrieve = function() {
		session = false;
		this.retrieve();
	};

	this.retrieve = function() {
		var user_save = get_user();
		if (user_save.username && user_save.password) {
			if (!retrieving) {
				Debug.print('Retrieving session...');
				retrieving = true;

				//var url = '/webapps/cas/login';
				// var s = this.get();
				// if (!s || s.length <= 0) {
				// 	url += '?renew=true';
				// }
				
				var plin_domain = 'https://campusplin.uoc.edu'
				
				var url = plin_domain +'/saml/login'
				Debug.print('Calling url: ' + url);
				
				$.ajax({
					type: 'GET',
					url
				})
				.done(function(resp) {
					
					var root = document.createElement("div");
					root.innerHTML = resp;
					
					var form = $.parseHTML(root.querySelectorAll("form")[0].outerHTML)[0];
					var action = form.attributes.action.value;
					var idp = form.elements.idp.value;
					
					var url = plin_domain + action +'&idp='+encodeURIComponent(idp)
					Debug.print('Calling url ' + url);
					$.ajax({
						type: 'GET',
						url: url
					})
					.done(function(resp) {
						
						root.innerHTML = resp;
						
						var form = $.parseHTML(root.querySelectorAll("form")[0].outerHTML)[0];
						var action = form.attributes.action.value;
						var SAMLRequest = form.elements.SAMLRequest.value;
						
						var parser = document.createElement('a');
						parser.href = action;
						
						var baseUrl = parser.origin;
						
						var url = (action.startsWith('/') ? baseUrl : '') + action;
						Debug.print('Calling url ' + url);
						
						$.ajax({
					        type: 'POST',
					        url,
					        data: {SAMLRequest}
					    })
					    .done(function(resp) {
							
							root.innerHTML = resp;
							
							var form = $.parseHTML(root.querySelectorAll("form")[0].outerHTML)[0];
							var action = form.attributes.action.value;
							
							var data = {
								j_username: user_save.username,
								j_password: user_save.password,
								_eventId_proceed: ''
							};
							var url = (action.startsWith('/') ? baseUrl : '') + action;
							Debug.print('Calling url: ' + url);
							
							//var aux = url
							
							$.ajax({
								type: 'POST',
								beforeSend: function (request) {
									request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
								},
								xhrFields: {
									withCredentials: true
								},
								crossDomain: true,
								url,
								data: uri_data({
									j_username: user_save.username,
									j_password: user_save.password,
									_eventId_proceed: ''
								}),
								processData: false
							})
							.done(function(resp) {
								
								root.innerHTML = resp;
											
								var form = $.parseHTML(root.querySelectorAll("form")[0].outerHTML)[0];
								var action = form.attributes.action.value;
								var SAMLResponse = form.elements.SAMLResponse.value;
											
								var url = (action.startsWith('/') ? baseUrl : '') + action;
								Debug.print('Calling url: ' + url);
								
								$.ajax({
									type: 'POST',
									url,
									data: {SAMLResponse}
								})
								.done(function(resp) {
									
									chrome.cookies.getAll({
										domain: '.uoc.edu',
										name: 'campusSessionId'
									}, function (theCookies) {
										parse_session(theCookies[0].value)
									});
									
								})
								.fail(function() {
									Debug.error('ERROR: Cannot login');
								})
							})
							.fail(function() {
								Debug.error('ERROR: Cannot login');
							})
						})
						.fail(function(e) {
							Debug.error('ERROR: Cannot login. ' + e);
						})
					})
					.fail(function() {
						Debug.error('ERROR: Cannot renew session');
						not_working();
					})
				})
				.fail(function() {
			        Debug.error('ERROR: Cannot renew session');
			        not_working();
			    })
			    .always(function() {
			        retrieving = false;
			    });
			}
		}
	};

	function parse_session(resp) {
		Debug.log(resp);
		//var matchs = resp.match(/campusSessionId = ([^\n]*)/);
		if (resp) {
			var session = resp.trim();
			if (!get_working()) {
				notify(_('__UOC_WORKING__'));
			}
			save_session(session);
			Debug.print('Session! '+session);
			Queue.run();
			if (typeof login_success == 'function') {
				login_success();
			}
		} else {
			Debug.error('ERROR: Cannot fetch session');
			if (typeof login_failure == 'function') {
				login_failure();
			}
			not_working();
		}
	}
};
// TODO http://cv.uoc.edu/webapps/classroom/servlet/GroupServlet?dtId=MULTI&dtIdList=&s=
// //http://cv.uoc.edu/webapps/classroom/servlet/GroupServlet?dtId=MULTI&dtIdList=%27TUTORIA%27&s=