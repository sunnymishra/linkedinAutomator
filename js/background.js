
let _global = { 'test':'test'};
let config = {
    'messagingUrl':"https://www.linkedin.com/messaging/compose/?recipient=",
    'acceptInviteUrl': 'https://www.linkedin.com/mynetwork/invitation-manager/'
};
console.log('reached background.js..');

// TODO: Build mechanish to auto load latest version of this Chrome extension :)

chrome.extension.onMessage.addListener(
    function(request, sender, reply) {
        console.log('reached background.js switch case:%s',request.method);
        switch(request.method)
        {
            case 'getMessageText':
                reply(_global.messageText);
                break;
            case 'startMessagingEvent':
                startMessaging(request.data);
                // reply(_global.selectedText);
                break;
            case 'startAcceptInviteEvent':
                startAcceptInvite();
                break;
            // case 'contentScriptLoadedEvent':
            //     contentScriptLoaded();
            //     break;
            default:
                reply({data: 'failure', message:'Invalid arguments'});
        }
    }
);

const triggerNextUserMessaging = (tabId, changeInfo, tab) => {
    let keyValue={};
    console.log('Intercepted closing tab. url->|%s|, changeInfo->|%s|, tabId->|%s| , tab->|%s|',changeInfo.url, JSON.stringify(changeInfo), tabId, JSON.stringify(tab));

    if(changeInfo && (changeInfo.status=='complete' || changeInfo.status=='loading') && 
        (changeInfo.url && changeInfo.url.indexOf(config.messagingUrl)>-1) 
        // && _global.isNextMessagingEventActivated
    ){
        console.log('Intercepted closed url->|%s|',changeInfo.url);
        // var current_url = changeInfo.url;
    }
};
const acceptInviteCallback = (tabId, changeInfo, tab) => {
    let keyValue={};
    if(_global.acceptInviteProcessStarted && changeInfo && (changeInfo.status=='loading') && 
         changeInfo.url && changeInfo.url.indexOf(config.acceptInviteUrl)>-1){
        let url = changeInfo.url;
        console.log('Intercepted new url->|%s| , changeInfo.status->|%s|, tabId->|%s|',url, changeInfo.status, tabId);
        _global.tabId=tabId;
        // chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        //     console.log('tabs[0].id->|%s|',tabs[0].id);
        setTimeout(function(){ 
            chrome.tabs.sendMessage(tabId, {'method':'scrollDownEvent'}, function(response) {console.log('got response->|%s|',response);});  
        }, 5000);
        // });
         // chrome.extension.sendMessage(
         //    {
         //        'method':'scrollDownEvent', 
         //        'data':{
         //            // 'urls':userUrls,
         //            // 'message':messageStr
         //        }
         //    }, (response)=>{
         //        console.log('got response->|%s|',response);
         //    });
    }
};
chrome.tabs.onUpdated.addListener(acceptInviteCallback);

// Below listener will ensure as soon as User closes his Message tab,
// next tab is opened for next user in the array
// chrome.tabs.onRemoved.addListener(triggerNextUserMessaging);
// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//     console.log('Intercepted updating tab. url->|%s|, changeInfo->|%s|, tabId->|%s| , tab->|%s|',changeInfo.url, JSON.stringify(changeInfo), tabId, JSON.stringify(tab));

// });


const startMessaging = (data) => {
    console.log('reached background.js startMessaging()');
    let urlArray=data.urls;
    
    _global.messageText=data.message;
    if(urlArray){
        // let urlArray=urls.split(",");
        if(urlArray[0]){
            let url = config.messagingUrl + urlArray[0];
            chrome.tabs.create({ 'url' : url});
        }else{
            console.log('Warning: Can\'t open Browser tab as provided Url is "%s"', urlArray[0]);
        }
        // TODO: ENSURE BELOW CODE GOES IN BROWSER TAB CLOSE EVENT OR SEND Button click Event
        let newUrlArray=urlArray.slice(1);  // 1st Id is consumed, now store remaining Ids back into Chrome storage
        let keyValuePair={'__userIds': newUrlArray};
        chrome.storage.local.set(keyValuePair, storageLogger(performance.now(), keyValuePair));
    }
};

const startAcceptInvite = (data) => {
    console.log('reached background.js startAcceptInvite()');
    let url=config.acceptInviteUrl;
    _global.acceptInviteProcessStarted=true;
    chrome.tabs.create({ 'url' : url});

    // let keyValuePair={'__userIds': newUrlArray};
    // chrome.storage.local.set(keyValuePair, storageLogger(performance.now(), keyValuePair));

};

const storageLogger = (startTime, keyValue) => {
    let key=Object.keys(keyValue)[0];
    let value=keyValue[key];

    if(key=='__sensitiveData'){
        value="...";    // We don't want to expose accessToken secret , etc while logging
    }
    if (chrome.runtime.lastError) {
        console.log("Error while storage.local of key |%s| value |%s|: |%s|", keyValue.key, value, JSON.stringify(chrome.runtime.lastError));
    }
    var endTime = performance.now();
    console.log("key |%s| value |%s| stored in %s ms.",key, value, (endTime - startTime));
};


// below only works when popup.html is commented in manifest json browser_Action section
// chrome.browserAction.onClicked.addListener(function(tab) { alert('icon clicked')  });

//chrome.contextMenus.onClicked.addListener(sendText);
// chrome.extension.onRequest.addListener(function(request, sender, sendResponse)