
function removeNoticies(){
	var arr = document.getElementsByTagName('app-news-student');
	for(var i=0; i<arr.length; i++){
		var item = arr[i]
		item.style.display='none';
	}
}
function containerFluid(){
        var arr = document.getElementsByClassName('container');
        for(var i=0; i<arr.length; i++){
                var item = arr[i]
		item.classList.remove('container');
                item.classList.add('container-fluid');
        }
	arr = document.getElementsByClassName('main-column');
        for(var i=0; i<arr.length; i++){
                var item = arr[i]
                item.classList.remove('col-lg-8');
                item.classList.add('col-lg-12');
        }
        arr = document.getElementsByClassName('flexbox-layout');
        for(var i=0; i<arr.length; i++){
                var item = arr[i]
                item.classList.remove('flexbox-layout');
		item.classList.remove('row');
                item.classList.add('row-fluid');
        }
        arr = document.getElementsByClassName('col-md-6');
        for(var i=0; i<arr.length; i++){
                var item = arr[i]
                item.classList.remove('col-md-6');
                item.classList.add('col-md-12');
        }
}

function betterModulWidgets() {
        var moduls = document.getElementsByClassName('modul');
        for(var i = 0; i < moduls.length; i++) {
                // Ensure show content to enable toggle click
                var toggleMenuDisabled = moduls[i].querySelector('.toggleMenu .icon--arrow-down');
                if (toggleMenuDisabled) {
                        toggleMenuDisabled.parentElement.click();
                }

                var modulHeader = moduls[i].getElementsByClassName('modul__header')[0];
                var modulContent = moduls[i].getElementsByClassName('modul__content')[0];
                var modulMarcadors = moduls[i].getElementsByClassName('widget__marcadors')[0];
                var modulNotification = modulContent.querySelector('.widget__marcadors .marcadors');

                // Move notifications
                if (modulNotification) {
                        modulHeader.getElementsByClassName('modul__actions')[0].prepend(modulNotification);
                        modulMarcadors.remove();
                }

                // Hide/show container
                if (modulHeader.classList.contains('toggle_content_added')) continue;
                modulHeader.classList.add('toggle_content_added');
                modulHeader.addEventListener('click', function(e) {
                        this.parentElement.classList.toggle('show_content');
                });
        }
}

chrome.runtime.sendMessage({uoctheme: "hello"}, function(response) {
  if( response.active ) {
    var interval = setInterval(myTimer, 1000);
    var countInterval=0;

    function myTimer() {
        if(++countInterval > 5) {
                stopTimer()
        }
        // removeNoticies();
        // containerFluid();
        betterModulWidgets();
    }

    function stopTimer() {
      clearInterval(interval);
    }
  }
});

