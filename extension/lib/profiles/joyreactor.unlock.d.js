var KellyEDispetcherJRBG = new Object;
    KellyEDispetcherJRBG.hostList = [
        "joyreactor.cc", 
        "reactor.cc", 
        "jr-proxy.com",
        "jrproxy.com",
        "pornreactor.cc",
        "thatpervert.com",
        "fapreactor.com",
    ];
    
    // todo - check enabled - turnoff option
    // KellyTools.DEBUG = true;
    
    KellyEDispetcherJRBG.cfgName = 'kelly_cache_jr_unlocker';
    
    
    KellyEDispetcherJRBG.censoredCacheDefault = {urls : [], tabIds : []};
           
    KellyEDispetcherJRBG.censoredCacheSize = 50;
    KellyEDispetcherJRBG.censoredCache = KellyEDispetcherJRBG.censoredCacheDefault;
    
    KellyEDispetcherJRBG.censoredUrlsGet = function(callback) {
        
        KellyEDispetcher.api.storage.local.get(KellyEDispetcherJRBG.cfgName, function(result) {    
           
           if (KellyEDispetcher.api.runtime.lastError) {
               
                KellyTools.log(KellyEDispetcher.api.runtime.lastError.message, KellyTools.E_ERROR);
                callback(KellyEDispetcherJRBG.censoredCacheDefault);
                return;
            }
            
            if (result && result[KellyEDispetcherJRBG.cfgName]) {
                KellyEDispetcherJRBG.censoredCache = result[KellyEDispetcherJRBG.cfgName];
                callback(KellyEDispetcherJRBG.censoredCache);
            } else {
                callback(KellyEDispetcherJRBG.censoredCacheDefault);
            }            
            
        });
    }
    
    KellyEDispetcherJRBG.censoredUrlsUpdate = function(callback, tabId, url, clear) {
        
        var cacheData = KellyEDispetcherJRBG.censoredCache;       
        if (clear === true) {
            cacheData = KellyEDispetcherJRBG.censoredCacheDefault;
        }
        
        if (cacheData.tabIds.length >= KellyEDispetcherJRBG.censoredCacheSize) {
            
             cacheData.tabIds.splice(0, 1);
             cacheData.urls.splice(0, 1);
        }         
            
        if (tabId != -1) {
            
            var index = cacheData.tabIds.indexOf(tabId);
            if (index != -1) {
                cacheData.urls[index] = url;
            } else {
                cacheData.urls.push(url);
                cacheData.tabIds.push(tabId);
            }
        } 
        
        var result = {};
            result[KellyEDispetcherJRBG.cfgName] = cacheData;
            
        KellyEDispetcher.api.storage.local.set(result, function() {
            
            if (KellyEDispetcher.api.runtime.lastError) {
                    
                KellyTools.log(KellyEDispetcher.api.runtime.lastError.message, KellyTools.E_ERROR);
                if (typeof callback == 'function') callback(false);
                
            } else {
                
                if (typeof callback == 'function') callback(true);
            }
            
        });
    }
    
    KellyEDispetcherJRBG.onMessage = function(dispetcher, data) {
        
        var response = data.response; // default response array {senderId : 'dispetcher', error : '', method : request.method,}
        var request = data.request;
        
        if (request.method == 'getCensoredTabUrl') {
            
            var url = false;
            
            if (data.sender && data.sender.tab.id) {
                
                var cacheData = KellyEDispetcherJRBG.censoredCache;
                var index = cacheData.tabIds.indexOf(data.sender.tab.id);
                
                url = index != -1 ? cacheData.urls[index] : false;
                if (url === false) {
                    console.log('cant detect tab url tabid ' + data.sender.tab.id);
                    console.log(cacheData);
                }
                
            } else {                
                console.log('sender is empty');
            }
            
            response.url = url;
            
            if (data.callback) data.callback(response);            
        }
    }
    
    KellyEDispetcherJRBG.initRules = function() {
           
           var mode = ['responseHeaders', 'blocking'], blocking = true;
           
           if (KellyTools.getManifestVersion() > 2) {
               mode = ['responseHeaders'];
               blocking = false;               
           }
             
             
           KellyEDispetcher.events.push({onMessage : KellyEDispetcherJRBG.onMessage});
           
           KellyEDispetcherJRBG.censoredUrlsGet(function(cfg) {});
    
           var onHeadersReceived = function(e) {  
           
                   if (e.statusCode >= 300 && e.statusCode <= 310) { 
                   
                        KellyTools.log('[Reactor] redirect for ' + e.url);

                        var eventLocation = KellyTools.getLocationFromUrl(e.url);
                        var domain = '';
                        
                        var hostParts = eventLocation.host.split('.');        
                        if (hostParts.length >= 2) {

                            domain  = hostParts[hostParts.length-2];
                            domain += '.' + hostParts[hostParts.length-1];           
                        } else {

                            domain = eventLocation.host;
                        }
                        
                        if (KellyEDispetcherJRBG.hostList.indexOf(domain) == -1 || eventLocation.host.indexOf('m.') != -1) return;                       

                        var responseRedirect = KellyTools.wRequestGetHeader(e.responseHeaders, 'location');                       
                            if (responseRedirect.indexOf('images/censorship') == -1) {
                            return;
                        }                       
                                          
                        if (blocking) {
                            KellyTools.wRequestSetHeader(e.responseHeaders, "location",  eventLocation.origin + '/?kellyrequest=censored');                           
                        }

                        KellyEDispetcherJRBG.censoredUrlsUpdate(function(fg) {

                        }, e.tabId, e.url);
                   } 
                     
                   return {responseHeaders: e.responseHeaders};
            }
            
            KellyTools.wRequestAddListener('onHeadersReceived', onHeadersReceived, {urls :  KellyTools.getHostlistMatches(KellyEDispetcherJRBG.hostList)}, mode, true);  
                   
            if (!blocking) {
                
                KellyTools.getBrowser().declarativeNetRequest.getDynamicRules(function(rulesSetted) {
                
                    if (KellyTools.getBrowser().runtime.lastError) {                
                        KellyTools.log('Error : ' + KellyTools.getBrowser().runtime.lastError.message, 'KellyEDispetcher | declarativeNetRequest'); 
                        return;
                    }
                    
                    var idCounter = 10; // start id counter - used for revision check
                                        
                    KellyTools.log('[Reactor] SESSIONS ');
                    
                    // if (rulesSetted.length > 0 && rulesSetted[0].id == idCounter) {
                    //   KellyTools.log('[Reactor] SESSIONS RULES Already setted ');                    
                    //   return;
                    // }
                    
                    var oldRulesIds = [];
                    
                    for (var i = 0; i < rulesSetted.length; i++) {
                        oldRulesIds.push(rulesSetted[i].id);
                    }
                    
                    var rules = [], ids = [];                    
                    var addCRule = function(match) {
                        
                        rules.push({
                            "id" : idCounter,
                            "action": {
                                "type": "redirect",
                                "redirect": {
                                    "transform": {
                                        "path": "",
                                        "fragment": "",
                                        "queryTransform" : {
                                            "addOrReplaceParams" : [
                                                {"key" : "kellyrequest", "value" : "censored"},
                                            ],
                                        }
                                    }
                                }
                            },
                            "condition": {
                                "urlFilter" : match,
                                "resourceTypes" : ['main_frame', 'other']
                            },
                            "priority": 1,
                        });
                        
                        ids.push(idCounter);
                        idCounter++;
                        
                    }
                        
                    for (var i = 0; i < KellyEDispetcherJRBG.hostList.length; i++) {
                        addCRule('*://' + KellyEDispetcherJRBG.hostList[i] + '*images/censorship/*');
                        addCRule('*://*.' + KellyEDispetcherJRBG.hostList[i] + '*images/censorship/*');
                    }
                    
                    KellyTools.getBrowser().declarativeNetRequest.updateDynamicRules({addRules : rules, removeRuleIds : oldRulesIds}, function() {

                        if (KellyTools.getBrowser().runtime.lastError) {                
                            KellyTools.log('Error : ' + KellyTools.getBrowser().runtime.lastError.message, 'KellyEDispetcher | declarativeNetRequest');         
                        } else {
                               
                            KellyTools.log('[Reactor][ADD] session Rules', 'KellyEDispetcher | declarativeNetRequest');
                        }                        
                    });                  

                });
            }
    }
    
    KellyEDispetcherJRBG.initRules();