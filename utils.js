var root_url = 'http://cv.uoc.edu';
var root_url_ssl = 'https://cv.uoc.edu';

function utf8_to_b64(str) {
    return window.btoa(decodeURIComponent(encodeURIComponent(str)));
}

function b64_to_utf8(str) {
    try {
        return decodeURIComponent(encodeURIComponent(window.atob(str)));
    } catch(err) {
        return str;
    }
}

function getDate_hyphen(date) {
    var sp = date.split('T');
    if (sp.length == 2) {
        date = sp[0];
    }
    var sp = date.split('-');
    if (sp.length <= 2) {
        return "";
    }
    return sp[2]+"/"+sp[1]+"/"+(sp[0] - 2000);
}

function getDate_slash(date) {
    var sp = date.split('/');
    if (sp.length <= 2) {
        return "";
    }
    return sp[0]+"/"+sp[1]+"/"+(sp[2] - 2000);
}

function getDate(date) {
    var sp = date.split('T');
    sp = sp[0].split('-');
    if (sp.length <= 2) {
        return "";
    }
    return sp[2]+"/"+sp[1];
}

function getTime(date) {
    var sp = date.split('T');
    if (sp.length <= 1) {
        return "";
    }
    sp = sp[1].split(':');
    if (sp.length <= 1) {
        return "";
    }
    return sp[0]+":"+sp[1];
}

function getTimeFromNumber(number) {
    var mins = number % 100;
    if (mins < 10) {
        mins = mins + '0';
    }
    return Math.floor(number / 100) +':'+ mins;
}

function isToday(date) {
    if (!date) {
        return false;
    }
    var q = new Date();
    var y = q.getFullYear() - 2000;
    var m = q.getMonth() + 1;
    var d = q.getDate();
    var dsplit = date.split("/");
    return dsplit[0] == d && dsplit[1] == m && dsplit[2] == y;
}

function isNearDate(date, limit) {
    if (!date || !limit || isBeforeToday(date)) {
        return false;
    }
    var q = new Date(limit);
    var y = q.getFullYear() - 2000;
    var m = q.getMonth() + 1;
    var d = q.getDate();
    var dsplit = date.split("/");
    if (dsplit[2] == y) {
        if (dsplit[1] == m) {
            return dsplit[0] <= d;
        }
        return dsplit[1] <= m;
    }
    return dsplit[2] <= y;
}

function isBeforeToday(date) {
    if (!date) {
        return true;
    }

    var q = new Date();
    var y = q.getFullYear() - 2000;
    var m = q.getMonth() + 1;
    var d = q.getDate();
    var dsplit = date.split("/");
    if (dsplit[2] == y) {
        if (dsplit[1] == m) {
            return dsplit[0] < d;
        }
        return dsplit[1] < m;
    }
    return dsplit[2] < y;
}

function compareDates(dateA, dateB) {
    if (!dateB || !dateA) {
        return 0;
    }
    var asplit = dateA.split("/");
    var bsplit = dateB.split("/");
    if (bsplit[2] != asplit[2]) {
        return asplit[2] - bsplit[2];
    }
    if (bsplit[1] != asplit[1]) {
        return asplit[1] - bsplit[1];
    }
    return asplit[0] - bsplit[0];
}

function get_url_attr(url, attr){
    if(url.indexOf(attr) == -1){
        return false;
    }

    var regexp = attr+"=([^&]+)";
    regexp = new RegExp(regexp);
    var match = url.match(regexp);
    if(match){
        return match[1];
    }
    return false;
}

function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

function get_url_withoutattr(url, parameter) {
    //prefer to use l.search if you have a location/link object
    url = get_real_url(url);
    var urlparts= url.split('?');
    if (urlparts.length >= 2) {
        var prefix =  encodeURIComponent(parameter)+'=';
        if(url.indexOf(prefix) == -1){
            return url;
        }

        var pars = urlparts[1].split(/[&;]/g);

        //reverse iteration as may be destructive
        for (var i= pars.length; i-- > 0;) {
            //idiom for string.startsWith
            if (pars[i].lastIndexOf(prefix, 0) !== -1) {
                pars.splice(i, 1);
            }
        }

        url= urlparts[0]+'?'+pars.join('&');
    }
    return url;
}

function uri_data(map){
    var str = "";
    for(var v in map){
        str += v+"="+map[v]+"&";
    }
    return str.slice(0,-1);
}

function get_real_url(url) {
    if(url.indexOf('/') == 0){
        return url;
    } else if(url.indexOf('http://') == -1 && url.indexOf('https://') == -1){
        return '/' + url;
    }
    return url;
}

// NOT USED
function get_url_base(url) {
    //prefer to use l.search if you have a location/link object
    url = get_real_url(url);
    var urlparts= url.split('?');
    if (urlparts.length >= 2) {
        return urlparts[0];
    } else {
        return url;
    }
}

// NOT USED
function get_url_with_data(url, data) {
    return get_real_url(url) + '?' + uri_data(data);
}

function get_html_realtext(text) {
    return $('<textarea />').html(text).text();
}

function get_acronym(text) {
    if (text == undefined) {
        return "";
    }
    var words = text.split(/[\s, '´:\(\)\-]+/);
    var acronym = "";
    var nowords = ['de', 'a', 'per', 'para', 'en', 'la', 'el', 'y', 'i', 'les', 'las', 'l', 'd'];
    for (var x in words) {
        if (nowords.indexOf(words[x].toLowerCase()) < 0) {
            if (words[x] == words[x].toUpperCase()) {
                switch(words[x]) {
                    case 'I':
                        acronym += '1';
                        break;
                    case 'II':
                        acronym += '2';
                        break;
                    case 'III':
                        acronym += '3';
                        break;
                    case 'IV':
                        acronym += '4';
                        break;
                    case 'V':
                        acronym += '5';
                        break;
                    default:
                        acronym += words[x];
                }
            } else {
                acronym += words[x].charAt(0);
            }
        } else {
            if (words[x] == 'I') {
                acronym += 1;
            }
        }
    }
    return acronym.toUpperCase();
}

function rssitem_to_json(item) {
  try {
    var obj = {};
    $(item).children().each(function() {
        var tagname = $(this).prop("tagName");
        var element = $(this).text();
        if (tagname == 'category') {
            tagname = $(this).attr('domain');
        } else {
            /*
            var element = {};
            element['inner'] = $(this).html();
            $(this).each(function() {
              $.each(this.attributes, function() {
                // this.attributes is not a plain object, but an array
                // of attribute nodes, which contain both the name and value
                if(this.specified) {
                  element[this.name] = this.value;
                }
              });
            });*/
        }
        obj[tagname] = element;
    });

    return obj;
  } catch (e) {
      Debug.error(e.message);
  }
}

var Debug = new function(){
    var show = get_debug();

    this.log = function(message) {
        if (show) {
            console.log(message);
        }
    };

    this.function = function(func) {
        if (show) {
            func();
        }
    };

    this.print = function(message) {
        console.log(message);
    };

    this.error = function(message) {
        console.error(message);
    };
};


var Queue = new function(){
    var queue = [];
    var after_function = false;
    var executing = false;

    var run = this.run = function() {
        var session = Session.get();
        if (session) {
            if (!executing) {
                if (queue.length > 0) {
                    executing = true;
                    var pet = queue.shift();
                    Debug.print('Run ' + pet.url);
                    ajax_do(session, pet.url, pet.data, pet.type, pet.reset, pet.success, pet.fail);
                } else {
                    Debug.print('End of queue');
                    if (after_function != 'nosave') {
                        Classes.save();
                        if (after_function) {
                            after_function();
                        }
                    }
                    after_function = false;
                }
            }
        } else {
            Session.retrieve();
        }
    };

    this.clear = function() {
        queue = [];
    };

    this.request = function(url, data, type, reset_on_fail, handler, fail_handler) {
        if (url) {
            var pet = {
                url: url,
                data: data,
                type: type,
                reset: reset_on_fail,
                success: handler,
                fail: fail_handler
            };
            queue.push(pet);
            Debug.print('Queued ' + url);
            run();
        }
    };

    this.set_after_function = function(fnc){
        after_function = fnc;
    };

    function ajax_do(session, url, data, type, reset_on_fail, handler, fail_handler){
        if (!data) {
            data = {};
        }
        url = root_url_ssl + url;

        var ajax_request = {
            type: type
        };

        if (type == 'GET') {
            data.s = session;
            url += '?'+uri_data(data);
            ajax_request.data = false;
        } else if (type == 'json') {
            var d = {s: session};
            url += '?'+uri_data(d);
            ajax_request.type = 'POST';
            ajax_request.dataType = 'json';
            ajax_request.contentType = 'application/json; charset=UTF-8';
            ajax_request.processData = false;
            ajax_request.data = JSON.stringify(data);
        } else {
            ajax_request.data = data;
        }
        ajax_request.url = url;

        $.ajax(ajax_request)
            .done(function(resp) {
                Debug.log(resp);
                if (handler) {
                    handler(resp, data);
                }
            })
            .fail(function(resp) {
                Debug.error('ERROR: Cannot fetch ' + url);
                Debug.log(resp);
                if (reset_on_fail) {
                    reset_session();
                }

                if (fail_handler) {
                    fail_handler();
                }
            })
            .always(function() {
                executing = false;
                run();
            });
    }
};

function _(str, params) {
    var st = translate(str, params);
    if (st) {
        return st;
    }
    // Not found
    Debug.error('String not translated: '+str);
    return str;
}

$( document ).ready(function() {
    $('.translate').each(function() {
        var text = $(this).text();
        $(this).text(_(text));
    });
    $('.translateph').each(function() {
        var text = $(this).attr('placeholder');
        $(this).attr('placeholder', _(text));
    });
    $('.translatetit').each(function() {
        var text = $(this).attr('title');
        $(this).attr('title', _(text));
    });
    $('.translateal').each(function() {
        var text = $(this).attr('aria-label');
        $(this).attr('aria-label', _(text));
    });
});