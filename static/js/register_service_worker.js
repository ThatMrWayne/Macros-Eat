'use strict';

function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function updateSubscriptionOnServer(subscription, apiEndpoint) {
  // TODO: Send subscription to application server
  let jwt = localStorage.getItem("JWT"); 
  return fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      subscription_json: JSON.stringify(subscription),
      token: jwt,
    })
  });

}

function subscribeUser(swRegistration, applicationServerPublicKey, apiEndpoint) {
  const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
  swRegistration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey
  })
  .then(function(subscription) {
    console.log('User is subscribed.');

    return updateSubscriptionOnServer(subscription, apiEndpoint);

  })
  .then(function(response) {
    if (!response.ok) {
      throw new Error('Bad status code from server.');
    }
    return response.json();
  })
  .then(function(responseData) {
    console.log(responseData);
    if (responseData.status!=="success") {
      throw new Error('Bad response from server.');
    }
  })
  .catch(function(err) {
    console.log('Failed to subscribe the user: ', err);
    console.log(err.stack);
  });
}



async function askPermission(){
  try{
    let res = await Notification.requestPermission();
    return res
  }catch(message){
    console.log(`${message}`)
    throw Error('Fetching was not ok!!.')
  }; 
}





function registerServiceWorker(serviceWorkerUrl, applicationServerPublicKey, apiEndpoint){
  let swRegistration = null;
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    console.log('Service Worker and Push is supported');
    //Notification.requestPermission()
    askPermission()
    .then(function(result){
      console.log(result);
      if(result==="granted"){
        return navigator.serviceWorker.register(serviceWorkerUrl)
      }
    })
    .then(function(swReg) {
      console.log('Service Worker is registered', swReg);
      subscribeUser(swReg, applicationServerPublicKey, apiEndpoint);

      swRegistration = swReg;
    })
    .catch(function(error) {
      console.error('Service Worker Error', error);
    });
  } else {
    console.warn('Push messaging is not supported');
  } 
  return swRegistration;
}





function prompt_asking(){
	let allow_push_notification_bar = document.createElement("div");
	allow_push_notification_bar.id = "allow-push-notification-bar";
	let allow_content = document.createElement("div");
	allow_content.classList.add("allow-content");
	let ask_permission_text = document.createElement("div");
	ask_permission_text.classList.add("ask-permission-text");
	ask_permission_text.appendChild(document.createTextNode("Want to get notification from us?"));
	let buttons_more = document.createElement("div");
	buttons_more.classList.add("buttons-more");
	let yes_btn = document.createElement("button");
	yes_btn.setAttribute("type","button");
	yes_btn.setAttribute("id","allow-push-notification");
	yes_btn.appendChild(document.createTextNode("Yes"));
	yes_btn.addEventListener("click",function(){ //按yes才prompt native window
		let allow_push_notification_bar = document.getElementById("allow-push-notification-bar");
		allow_push_notification_bar.remove();
    registerServiceWorker(      //註冊service worker
			"/js/service_worker.js",
			"BLwONVBEntnNFZnZNS0p-lrub1ea0gBPOTIxWKTdMeHYzx2rFVvGSSJphyRsKTddAdJ059TfDeoJrI2JJzM6ia4",
			"/api/push-subscriptions"
		); 
	});
	let no_btn = document.createElement("button");
	no_btn.setAttribute("type","button");
	no_btn.setAttribute("id","close-push-notification");
	no_btn.appendChild(document.createTextNode("No thanks"));
	no_btn.addEventListener("click",function(){
		let allow_push_notification_bar = document.getElementById("allow-push-notification-bar");
		allow_push_notification_bar.remove();
	});
	buttons_more.appendChild(yes_btn);
	buttons_more.appendChild(no_btn);
	allow_content.appendChild(ask_permission_text);
	allow_content.appendChild(buttons_more);
	allow_push_notification_bar.appendChild(allow_content);
	document.body.appendChild(allow_push_notification_bar);
}







function handle_notification(){
    if(Notification.permission === 'default') {
        prompt_asking();
    };
};