
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
        return url;
    } else {
        return url;
    }
}


function uri_data(map){
    var str = "";
    for(var v in map){
        str += v+"="+map[v]+"&";
    }
    return str.slice(0,-1);
}

function get_real_url(url){
    if(url.indexOf('/') == 0){
        return root_url + url;
    } else if(url.indexOf('http://') == -1 && url.indexOf('https://') == -1){
        return root_url + '/' + url;
    }
    return url;
}

function ajax_uoc(url, data, type, handler_succ, handler_err){
    data.s = get_session();
    if(!data) data = {};
    if (!data.s) {
        handler_err(false);
        return;
    }
    url = root_url + url;
    if (type == 'GET') {
        url += '?'+uri_data(data);
        data = false;
    } else {
        data = uri_data(data);
    }

    $.ajax({
        type: type,
        url: url,
        data: data,
        processData: false,
        success: function(resp) {
            if (handler_succ) {
                handler_succ(resp);
            }
        },
        error: function(resp) {
            console.log('ERROR: Cannot fetch '+url);
            if (handler_err) {
                handler_err(resp);
            }
        }
    });
}

function ajax_uoc_login(url, data, type, handler_succ){
    url = root_url + url;
    $.ajax({
        type: type,
        beforeSend: function (request){
            request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        },
        xhrFields: {
            withCredentials: true
        },
        url: url,
        data: uri_data(data),
        processData: false,
        success: function(resp) {
            if (handler_succ) {
                handler_succ(resp);
            }
        }
    });
}