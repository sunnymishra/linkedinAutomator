let __global={};

let messageUrlInputTextArea = document.getElementById('messageUrlInputTextArea');
let messageBodyTextArea = document.getElementById('messageBodyTextArea');
let messageBtn = document.getElementById('messageBtn');
let acceptInviteBtn = document.getElementById('acceptInviteBtn');

window.onload = () => {
	chrome.storage.local.get({'__userIds': []}, (data) => {
		if(!isStorageKeyEmpty(data)){
			let userUrls=data['__userIds'];
			
			console.log('userUrls->%s  ', userUrls);
			if(userUrls && userUrls.length>0){
				let urserUrlsStr=userUrls.reduce((finalStr,userUrlElem)=>{
					console.log('finalStr:%s , userUrlElem:%s', finalStr,userUrlElem);
					return finalStr + "\n" + userUrlElem;
				});
				messageUrlInputTextArea.value=urserUrlsStr;
			}
		}
	});
	
	chrome.storage.local.get({'__messageStr': []}, (data) => {
		if(!isStorageKeyEmpty(data)){
			let messageStr=data['__messageStr'];
			// console.log('messageStr->%s  ', messageStr);
			if(messageStr && messageStr.length>0){
				messageBodyTextArea.value=messageStr;
			}
		}
	});
};



messageBtn.addEventListener("click", () => {
	let userUrls = messageUrlInputTextArea.value;
	let messageStr = messageBodyTextArea.value;

	if(!userUrls){
		alert("Enter User Ids or Url Newline separated");
		return;
	}
	userUrls = transformAndStoreUserUrls(userUrls);
	// console.log('______msgbody->%s',messageBodyTextArea.value);
	if(!messageStr){
		alert("Enter Message text");
		return;
	}
	handleMessageString(messageStr);

	chrome.extension.sendMessage(
		{
			'method':'startMessagingEvent', 
			'data':{
				'urls':userUrls,
				'message':messageStr
			}
		}, (response)=>{
		console.log('got response->|%s|',response);
	});
});

acceptInviteBtn.addEventListener("click", () => {
	chrome.extension.sendMessage(
		{
			'method':'startAcceptInviteEvent', 
			'data':{
				// 'urls':userUrls,
				// 'message':messageStr
			}
		}, (response)=>{
		console.log('got response->|%s|',response);
	});
});

const isStorageKeyEmpty = (obj) => {
	if(obj && typeof obj === 'object'){
		for(let key in obj) {
			if(obj.hasOwnProperty(key))
				return false;
		}
	}
	return true;
};

/** Function accepts list of Ids/Urls from User as comma separated or newline separated. /
    Then converts into an Array of Ids/Urls  **/
const transformAndStoreUserUrls = (userUrls) => {
	let userUrlArray;
	if(userUrls.includes(",")){
		userUrlArray= userUrls.split(",");
	}else{
		userUrlArray= userUrls.split("\n");
	}

	console.log('saving userUrlArray->%s ', userUrlArray);
	let keyValuePair={'__userIds': userUrlArray};
	chrome.storage.local.set(keyValuePair, storageLogger(performance.now(), keyValuePair));
	return userUrlArray;
};
const handleMessageString = (messageStr) => {
	let keyValuePair={'__messageStr': messageStr};
	chrome.storage.local.set(keyValuePair, storageLogger(performance.now(), keyValuePair));
};
/**Function replaces newline char with <br> tag inside a String **/
const nl2br = (str, is_xhtml) => {
	var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';
	return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
};

const storageLogger = (startTime, keyValue) => {
	let key=Object.keys(keyValue)[0];
	let value=keyValue[key];

	if(key=='__sensitiveData'){
		value="...";	// We don't want to expose accessToken secret , etc while logging
	}
	if (chrome.runtime.lastError) {
		console.log("Error while storage.local of key |%s| value |%s|: |%s|", keyValue.key, value, JSON.stringify(chrome.runtime.lastError));
	}
	var endTime = performance.now();
	console.log("key |%s| value |%s| stored in %s ms.",key, value, (endTime - startTime));
};