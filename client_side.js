adlinker = function(){

  //this is an addition
  //this is another addition
  
  let url;
  let time;
  let now;

  let account_id;
  let page_id;
  let browser_id;
  let requested_url;
  let referrer_url;

  let page_id_key = 'al_pg_id';
  let browser_id_key = 'al_br_id';
  let referrer_id_key = 'al_ref_id';

  let initialized = false;

  function get_vars(){
    url = new URL(window.location.href);
    time = new Date();
    now = time.getTime();
    //account_id gotten from initialize();
    page_id = uuidv4();
    let stored_browser = localStorage.getItem(browser_id_key);
    if(stored_browser){
      browser_id = stored_browser;
    }else{
      browser_id = uuidv4();
      localStorage.setItem(browser_id_key, browser_id);
    }
    requested_url = url.href;
    referrer_url = document.referrer;
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
          //console.log(added_node.tagName);
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
      url.searchParams.set(page_id_key, page_id);
      url.searchParams.delete(referrer_id_key);
      window.history.replaceState(null,null,url.href);
    }
    set_params();
    document.onchange = function(){
      url.href = window.location.href;
      if(!url.searchParams.has(page_id_key)){
        set_params();
      }
    }
  }

  function initialize(account){
    account_id = account;
    let uuid_script = document.createElement('script');
    uuid_script.src = 'https://cdn.jsdelivr.net/npm/uuid@latest/dist/umd/uuidv4.min.js';
    uuid_script.onload = function(){
      get_vars();
      decorate_a_tags(referrer_id_key, page_id);
      set_url_params();
      initialized = true;
    }
    document.head.appendChild(uuid_script);
  }

  function log_vars(){
    let inter = setInterval(function(){
      if(initialized){
        clearInterval(inter);
        console.log('account_id is: ' + account_id + '\npage_id is: ' + page_id + '\nbrowser_id is: ' + browser_id + '\nrequested_url is: ' + requested_url + '\nreferrer_url is: ' + referrer_url + '\nnow is: ' + now);
      }
    },100); 
  }

  function send_pageview(endpoint){
    function send(){
      var xhr = new XMLHttpRequest();
      xhr.open("POST", endpoint, true);
      xhr.send(JSON.stringify({
        'account_id':account_id,
        'page_id':page_id,
        'browser_id':browser_id,
        'requested_url':requested_url,
        'referrer_url':referrer_url,
        'timestamp':now.toString()
      }));
    }

    if(!initialized){
      let inter = setInterval(function(){
        if(initialized){
          clearInterval(inter);
          send();
          //xhr.send(JSON.stringify({'dr_sources':all_sources,'last_touch':last_touch,'data':data}));
        }
      },100);
    }else{
      send();
    }
  }

  function send_conversion(endpoint, type, id){
    function send(){
      var xhr = new XMLHttpRequest();
      xhr.open("POST", endpoint, true);
      xhr.send(JSON.stringify({
        'account_id':account_id,
        'page_id':page_id,
        'timestamp':time.getTime().toString(),
        'type':type,
        'id':id
      }));
    }

    if(!initialized){
      let inter = setInterval(function(){
        if(initialized){
          clearInterval(inter);
          send();
          //xhr.send(JSON.stringify({'dr_sources':all_sources,'last_touch':last_touch,'data':data}));
        }
      },100);
    }else{
      send();
    }
  }

  return{
    init:initialize,
    log_vars:log_vars,
    pageview:send_pageview,
    conversion:send_conversion
  }
}
