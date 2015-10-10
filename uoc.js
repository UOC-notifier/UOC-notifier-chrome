function check_messages(after_check_fnc){
	Queue.set_after_function(after_check_fnc);

	// Get the new aulas
	var args = {
		perfil : 'estudiant',
		setLng : get_lang(),
		format: 'json'
	}
	Queue.request('/app/guaita/calendari', args, "GET", function(data) {
		save_idp(data.idp);
		for (x in data.classrooms) {
			classroom = parse_classroom(data.classrooms[x]);
		}
		Classes.purge_old();

		var args = {
			newStartingPage:0,
			language:"b"
		}
		Queue.request('/UOC2000/b/cgi-bin/hola', args, 'GET', function(resp) {
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

		retrieve_gradeinfo();
	},
	function(data) {
		Queue.clear();
		reset_session();
	});

	if (get_check_mail()) {
		args = {id: 1, method: "MailInterfaceBroker.getTreeFolderExpanded", params: ["-1", "pers"]};
		Queue.request('/WebMail/JSONRPCServlet?mark=false', args, 'json', function(resp) {
			var mails = 0;
			try {
				for(var x in resp.result.folders.list) {
        			mails += resp.result.folders.list[x].totalNewMsgs;
        		}
    		} catch(err) {
        		Debug.error(err);
    		}

			var old_mails = get_mails_unread();
			save_mails_unread(mails);
			Debug.print("Check mails: "+mails);
			if (mails > 0 && old_mails < mails && mails >= get_critical()) {
				notify(_('__NOTIFICATION_MAIL__', [mails]));
			}
		});
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
			if (ev.ends_today()) {
				notify(_('__PRACT_END__', [ev.name, classrooms[i].get_acronym()]));
			} else if (ev.starts_today()) {
				notify(_('__PRACT_START__', [ev.name, classrooms[i].get_acronym()]));
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
		classroom.title = title;
		classroom.code = classr.domainCode;
		classroom.domain = classr.domainId;
		classroom.type = classr.domaintypeid;
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
			var evnt = new Event(act.name, act.eventId);

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
				args.idLang = 'a';
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

function parse_classroom_old(classr){
	if(classr.title) {
		var title = classr.shortname ? classr.shortname : classr.title;
		switch (classr.domaintypeid) {
			case 'TUTORIA':
				var sp = title.split(classr.codi_tercers);
				title = sp[0].trim();
				var classroom = new Classroom(title, classr.code, classr.domainid, classr.domaintypeid, classr.pt_template);
				classroom.aula = classr.codi_tercers;
				if (sp.length > 1) {
					classroom.consultor = sp[1].trim();
				}
				sp = classr.code.split('_');
				if (sp.length > 1) {
					classroom.consultormail = sp[1].trim()+'@uoc.edu';
				}
				break;
			case 'ASSIGNATURA':
				// Override title
				var classroom = Classes.search_domainassig(classr.domainid);
				classroom.title = title;
				return;
			case 'AULA':
				return;

		}

		if(Classes.get_notify(classroom.code)) {
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

function retrieve_gradeinfo() {
	Queue.request('/rb/inici/api/enrollment/rac.xml', {}, 'GET', function(data, args) {
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
				if (evnt) {
					var committed = $(this).find('listaEntregas>entrega').length > 0;
					var changed = false;
					if (committed) {
						evnt.committed = true;
						classroom.add_event(evnt);
						changed = true;
					}

					var grade = $(this).find('nota').text().trim();
					if (grade.length > 0 && grade != '-') {
						if (evnt.graded != grade) {
							evnt.graded = grade;
							changed = true;
							notify(_('__PRACT_GRADE__', [grade, evnt.name, classroom.get_acronym()]));
						}
					}
					if (changed) {
						classroom.add_event(evnt);
					}
				} else {
					var grade = $(this).find('nota').text().trim();
					if (grade.length > 0 && grade != '-') {
						var name = $(this).find('descripcion').text().trim();
						switch (name) {
							case 'Nota final activitats pràctiques':
								name = 'P';
								break;
							case 'Qualificació d\'avaluació continuada':
								name = 'C';
								break;
							case 'Qualificació final d\'avaluació contínua':
								name = 'FC';
								break;
						}
						// TODO Save final grades
						/*if (evnt.graded != grade) {
							evnt.graded = grade;
							changed = true;
							notify(_('__PRACT_GRADE__', [grade, evnt.name, classroom.get_acronym()]));
						}*/
						//console.log(name, grade);
					}
				}
			});

			if (classroom) {
				// TODO: save final grades
				var finalgrade = $(this).find('notaFinal').text().trim();
				if (finalgrade.length > 0 && finalgrade != '-') {
					//Save final grade
					//console.log(finalgrade);
				}
				var finalac = $(this).find('notaFinalContinuada').text().trim();
				if (finalac.length > 0 && finalac != '-') {
					//Save final grade
					//console.log(finalac);
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
		subjectId: classroom.domain,
		resourceId: resource.code
	};
	Queue.request('/webapps/aulaca/classroom/LoadResource.action', args, 'GET', function(data) {
		try {
			var num_msg_pendents = data.resource.newItems;
	        var num_msg_totals = data.resource.totalItems;
			resource.set_messages(num_msg_pendents, num_msg_totals);
			resource.set_pos(data.resource.pos);
		} catch(err) {
    		Debug.error(err);
		}
		classroom.add_resource(resource);
    },
    function(data) {
     	//On Error
    	/*resource.set_messages(0, 0);
    	resource.set_pos(false);
    	classroom.add_resource(resource);*/
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

	Queue.request('/webapps/widgetsUOC/widgetsNovetatsExternesWithProviderServlet', args, 'GET', function(resp) {
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

	this.retrieve = function() {
		var user_save = get_user();
		if(user_save.username && user_save.password) {
			if (!retrieving) {
				Debug.print('Retrieving session...');
				retrieving = true;

				var data = {
					l: user_save.username,
					p: user_save.password,
					appid: "WUOC",
					nil: "XXXXXX",
					lb: "a",
					url: root_url,
					x: "13",
					y: "2"
				};

			    url = root_url + "/cgi-bin/uoc";
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
			    	var iSs = resp.indexOf("?s=");
					if( iSs != -1 ){
						var	iSf = resp.indexOf("\";", iSs);
						var	iSf2 = resp.indexOf("&", iSs);
						if (iSf2 < iSf && iSf2 > 0) {
							iSf = iSf2;
						}
						session = resp.substring(iSs + 3, iSf);
						save_session(session);
						Debug.print('Session! '+session);
						Queue.run();
					} else {
						Debug.error('ERROR: Cannot fetch session');
						$("#status").text(_("__INCORRECT_USER__"));
						$(".alert").show();
					}
			    })
			    .fail(function() {
			        Debug.error('ERROR: Cannot fetch '+url);
			    })
			    .always(function() {
			        retrieving = false;
			    });
			}
		}
	}
}
