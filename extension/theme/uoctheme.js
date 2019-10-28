
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

chrome.runtime.sendMessage({uoctheme: "hello"}, function(response) {
  if( response.active ){
    var interval = setInterval(myTimer, 1000);
    var countInterval=0;

    function myTimer() {
        if( ++countInterval > 5 ){
	        stopTimer()
        }
        removeNoticies();
        containerFluid();
    }

    function stopTimer() {
      clearInterval(interval);
    }
  }
});

