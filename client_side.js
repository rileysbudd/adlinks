  
adlinker = function(){

	var libs = {
		uuidv4:{
			source:'https://cdn.jsdelivr.net/npm/uuid@latest/dist/umd/uuidv4.min.js',
			loaded:false
		},
		fullpage:{
			source:'https://cdn.jsdelivr.net/npm/fullpage.js@3.1.2/dist/fullpage.min.js',
			loaded:false
		}
	}

	let initialized = false;
	let url;
	let time;

	let account_id;
    
	let browser = {
		key:'al_br_id',
		id:null,
		is_new:true
	}
    
	let page = {
		id:null,
		requested_url:null,
		referrer_url:null,
		key:'al_pg_id',
		ref_key:'al_ref_id'
	}

	let events = {
		count:1,
		schema:'v0.1',
	};
    
    //Used in require to load script resources if they haven't been loaded already
	function load_script(url) { //src url as parameter
		return new Promise(function(resolve, reject) {
			var script = document.createElement("script");
			script.onload = resolve;
			script.onerror = reject;
			script.src = url;
			document.head.appendChild(script);
		});
    }
    
//     Usage: use(libs.library_name).then(successfunc,failfunc);
//     For Example:
//     use(libs.uuidv4).then(
//       () => {
//         //success
//       },
//       () => {
//         //failure
//       }
//     );
	function use(lib) { //lib should be a library object from libs dict declared at top of adlinker() function above
		if (lib.loaded) {
			// already loaded and ready to go
			return Promise.resolve(); //resolve if already loaded
		} else {
			return load_script(lib.source); //load if not already loaded and return promise that resolves at script.onload
		}
	}
      
	function get_vars(){
		//initialized changed to true after initialized is called
		url = new URL(window.location.href);
		//time = new Date();
		//account_id gotten from initialize();
		let stored_browser = localStorage.getItem(browser.key);
		if(stored_browser){
			browser.id = stored_browser;
			browser.is_new = false;
		}else{
			browser.id = uuidv4();
			localStorage.setItem(browser.key, browser.id);
		}
		page.id = uuidv4();
		page.requested_url = url.href;
		page.referrer_url = document.referrer;
    }
    
	function decorate_a_tags(key, value){
		let a_tags = document.getElementsByTagName("a");
		function add_params(){
			if(a_tags.length){
				for (let tag of a_tags){
					try{
						url.href = tag.href;
						url.searchParams.set(key,value);
						tag.href = url.href;
					}
					catch(_){
					}
				}
			}
		}
		let a_tag_observer = new MutationObserver(function(mutations){
			mutations.forEach(function(mutation){
				mutation.addedNodes.forEach(function(added_node){
					if(added_node.tagName == 'A'){
						add_params();
					}
				});
			});
		});
		window.onload = function(){
			document.body.onload = add_params();
			a_tag_observer.observe(document.body, {
				subtree: true,
				childList: true
			});
		}
    }
    
    function set_url_params(){
		function set_params(){
			url.searchParams.set(page.key, page.id);
			url.searchParams.delete(page.ref_key);
			window.history.replaceState(null,null,url.href);
		}
		set_params();
		document.onchange = function(){
			url.href = window.location.href;
			if(!url.searchParams.has(page.key)){
				set_params();
			}
		}
    }
    
    function initialize(account){
		use(libs.uuidv4).then(
			() => {
				account_id = account;
				get_vars();
				decorate_a_tags(page.ref_key, page.id);
				set_url_params();
				initialized = true;  
			},
			() => {
				console.log('failed to initialize adlinks');
			}
		);
	}
    
  //Needs to be updated
//     function log_vars(){
//       let inter = setInterval(function(){
//         if(initialized){
//           clearInterval(inter);
//           console.log('account_id is: ' + account_id + '\npage_id is: ' + page.id + '\nbrowser_id is: ' + browser.id + '\nrequested_url is: ' + page.requested_url + '\nreferrer_url is: ' + page.referrer_url + '\nnow is: ' + time.getTime().toString());
//         }
//       },100); 
//     }
  
    /*
    event_data = {
      id:'optional_string',
      bucket:'required string that maps to configured event',
      timestamp:'optional string',
      data:'optional dict with params'
    }
    user = {
      email:'optional email hash',
      phone:'optional phone hash',
      country:'optional country code',
      zip:'optional zip'
    }
    */
  
	function send_event(endpoint,event,user = {}){
      
		function send() {
        
			if (!event.id) {event.id = page.id + '-' + events.count.toString();}
			if (!event.timestamp) {time = new Date(); event.timestamp = time.getTime().toString();}
			if (!event.data) {event.data = null;}

			if (!user.email) {user.email = null;}
			if (!user.phone) {user.phone = null;}
			if (!user.country) {user.country = null;}
			if (!user.zip) {user.zip = null;}

			var xhr = new XMLHttpRequest();
			xhr.open("POST", endpoint, true);
			xhr.send(JSON.stringify({
				'account_id':account_id,
				'browser':{
					'id':browser.id,
					'is_new':browser.is_new
				},
				'page':{
					'id':page.id,
					'requested_url':page.requested_url,
					'referrer_url':page.referrer_url
				},
				'user':{
					'email':user.email,
					'phone':user.phone,
					'country':user.country,
					'zip':user.zip
				},
				'event':{
					'bucket':event.bucket,
					'schema':events.schema,
					'id':event.id,
					'count':events.count,
					'timestamp':event.timestamp,
					'data':event.data
				}
			}));
			events.count++;
		}
      
		if(!initialized){
			let inter = setInterval(function(){
				if(initialized){
					clearInterval(inter);
					send();
				}
			},100);
		}else{
			send();
		}
	}
    
	return{
		init:initialize,
		event:send_event
	}
}
