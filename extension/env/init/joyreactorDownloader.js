KellyJoyreactorDPage = new Object();
KellyJoyreactorDPage.env = false;
KellyJoyreactorDPage.init = function() {
    
    window.K_FAV = false;
    document.title = KellyTools.getProgName();
    K_FAV = new KellyFavItems({env : KellyProfileJoyreactor.getInstance(), location : { href : 'http:' + '//' + 'joyreactor.cc' + '/', protocol : 'http:', host : 'joyreactor.cc'}, allowMobile : true});
    
    KellyJoyreactorDPage.env = K_FAV.getGlobal('env');
    KellyJoyreactorDPage.env.hostClass = 'options_page';  
    KellyJoyreactorDPage.env.webRequestsRules.types = false;              
    KellyJoyreactorDPage.env.events.onExtensionReady = function() {
        
        // K_FAV.getGlobal('image_events').saveImageProportions = function() { return; }            
        // K_FAV.aspectRatioAccurCheck = false; // копирайт портит проверку соотношения сторон, отключаем
        
        
        document.getElementById('sandbox-env').classList.remove('loading');
        var unlockManager = KellyProfileJoyreactor.getInstance().unlockManager;
        if (unlockManager) {
            unlockManager.initTagViewer();
            unlockManager.tagViewer.openInNewTab = false;
            
            K_WATCHDOG = new KellyPageWatchdog();
            K_WATCHDOG.observerLocation = false;
            K_WATCHDOG.exec();
            K_WATCHDOG.setLocation({url : 'https://joyreactor.cc/', host : 'https://joyreactor.cc'});
        }
        
        if (window.location.href.indexOf('tag-viewer') != -1 && unlockManager) {
            
            K_FAV.hideFavoritesBlock();
            
            
            KellyTools.getBrowser().runtime.sendMessage({method: "getOpenTabData"}, function(request) {
                if (request.tabData && request.tabData.action == 'tagView') {
                    
                    unlockManager.initWorkspace(function() {
                        
                        unlockManager.showCNotice('Открываю тег [<b>' + request.tabData.formData.tagName + '</b>]');
                        unlockManager.loadTag(request.tabData.formData.tagName, request.tabData.formData.page, unlockManager.tagViewer.afterPageLoad);
                    });
                }
            });
            
        } else if (!K_FAV.defaultNavigation()) K_FAV.showOptionsDialog(); 
    }
    
    KellyJoyreactorDPage.env.events.onWebRequestReady = function(method) {
        if (method == 'registerDownloader' && !KellyJoyreactorDPage.rendered) {
            KellyJoyreactorDPage.rendered = true;
            
            var resources = ['core', 'single', 'joyreactorDownloader'];
            
            if (K_FAV.getGlobal('options').darkTheme) {
                document.body.classList.add(KellyJoyreactorDPage.env.className + '-dark');
                resources.push('dark');
            }
        
            K_FAV.initFormatPage(resources); 
        }
    }
        
    K_FAV.load('cfg', function(fav) {
        
        K_FAV.load('items', function() { 
            K_FAV.initBgEvents();
        });   
    });   
    
    KellyTools.setHTMLData(document.getElementById('submenu'), '<div class="' + KellyJoyreactorDPage.env.className + '-copyright-info"><div id="copyright-name">' + KellyTools.getProgName() + '</div><div id="copyright-software"></div></div>');     
    KellyTools.setCopyright('copyright-software');
}

KellyTools.loadFrontJs(KellyJoyreactorDPage.init);
