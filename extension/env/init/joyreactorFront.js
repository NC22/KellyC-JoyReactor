
if (typeof K_FAV == 'undefined' || K_FAV === null) {
    
    
    var searchNode = function(nodes, tagName) {
        
        tagName = tagName.toLowerCase();
        for (var i = 0; i < nodes.length; i++) {
                    
           if (nodes[i].tagName && nodes[i].tagName.toLowerCase() == tagName) {
                return nodes[i];
           }
           
        }
        
        return false;
   }
    
    var observer = new MutationObserver(function(mutations) {
        
        if (mutations.length > 0) {
            
             for (var i = 0; i < mutations.length; i++) {
                    
                   if (mutations[i].target == document.documentElement) {
                        var body = searchNode(mutations[i].addedNodes, 'body');
                        if (body) {
                            
                            if (window.location.host.indexOf('top.joyreactor.cc') != -1 || window.location.host.indexOf('m.reactor.cc') != -1 || window.location.host.indexOf('m.joyreactor.cc') != -1 ) {
                                
                                K_FAV = new KellyFavItems({env : KellyProfileTopJoyreactor.getInstance(), location : window.location, allowMobile : true});
                                KellyProfileTopJoyreactor.getInstance().initOnLoad(K_FAV.initFormatPage);
                                
                            } else {
                                
                                K_FAV = new KellyFavItems({env : KellyProfileJoyreactor.getInstance(), location : window.location});
                                if (!K_FAV.exec()) K_FAV = null;
                            }
                            
                            observer.disconnect(); 
                        }                        
                   }
                   
                }  
            
        }                
    });
  
    
    observer.observe(document.documentElement, {childList: true, subtree: false});
       
}

// keep empty space to prevent syntax errors if some symbols will added at end