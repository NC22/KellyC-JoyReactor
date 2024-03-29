if ((typeof K_FAV == 'undefined' || K_FAV === null) && window.location === window.parent.location && KellyProfileJoyreactor.getInstance().setLocation(window.location)) {
    
    // wait body element rendered 
    
    var onDOMRendered = function() {
        
        if (['m.reactor.cc', 'm.joyreactor.cc', 'top.joyreactor.cc', 'safereactor.cc', 'cookreactor.com'].indexOf(window.location.hostname) != -1) { // new new design, based on GraphQL API
            
            K_FAV = new KellyFavItems({env : KellyProfileTopJoyreactor.getInstance(), location : window.location, allowMobile : true});
            KellyProfileTopJoyreactor.getInstance().initOnLoad(K_FAV.initFormatPage); // init hooks before joyreactor page, wait until joyreator page will load post list
        
        } else {
            
            var env = KellyProfileJoyreactor.getInstance(); // old., "new" design
            //if (window.location.host.indexOf('m.reactor.cc') != -1) { // old mobile version
            //    env = KellyProfileMJoyreactor.getInstance();
            //}
            
            K_FAV = new KellyFavItems({env : env, location : window.location});          
            K_FAV.load('cfg', function(fav) {
                
                if (fav.coptions.disabled) return;
                
                K_FAV.initBgEvents();
                K_FAV.load('items', function() {
                    K_FAV.initFormatPage();
                    KellyTools.addEventPListener(window, "load", function() {
                        if (K_FAV.getGlobal('env').getMainContainers()) K_FAV.formatPostContainers(); 
                    }, 'init_');                            
                }); 
            });
        }
        
        if (typeof bodyObserver != 'undefined') bodyObserver.disconnect(); 
    }
    
    if (document.body) { // "run_at": "document_idle"
        
        onDOMRendered();
        
    } else { // "run_at": "document_start"
        
        document.addEventListener("DOMContentLoaded", onDOMRendered);
    }
}

// keep empty space to prevent syntax errors if some symbols will added at end