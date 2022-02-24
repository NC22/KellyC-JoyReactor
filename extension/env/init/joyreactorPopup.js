KellyCPopup = new Object();
KellyCPopup.baseClass = 'kelly-popup';
KellyCPopup.getLoc = function(loc) { return KellyLoc.s('', loc); }

KellyCPopup.init = function(options) {
            
    var env = KellyProfileJoyreactor.getInstance();
    
    var handler = KellyCPopup;        
        handler.page = document.getElementById('page');
        handler.title =  'KellyC JoyReactor v' + (KellyTools.getBrowser().runtime.getManifest ? KellyTools.getBrowser().runtime.getManifest().version : '');
        handler.titleHtml = '<span class="' + handler.baseClass + '-ext-name">' + handler.title + '</span><span class="kelly-copyright">created by <a class="tab-navigation"  href="' + env.extLinks.author + '" target="_blank">nradiowave</a></span>';
                
    document.title = handler.title;        
    KellyTools.setHTMLData(document.getElementById('header'), handler.titleHtml); 
    
    var html = '';
        html += '<div class="' + handler.baseClass + '-popup-go"><button class="' + handler.baseClass + '-options-btn tab-navigation" data-source="/env/html/joyreactorDownloader.html?tab=options">' + handler.getLoc('options') + '</button></div>';
        
        html += '<button class="' + handler.baseClass + '-additions-show tab-navigation" data-source="/env/html/joyreactorDownloader.html?tab=images">' + handler.getLoc('saved') + '</button>';
    
        if (options.toolbar && options.toolbar.heartHidden) {
            
        } else {
            html += '<button class="' + handler.baseClass + '-additions-show tab-navigation support" data-source="' + env.extLinks.support + '">\
                <span class="' + handler.baseClass + '-icon-cup"></span>\
                <span class="' + handler.baseClass + '-text">' + handler.getLoc('link_support') + '</span>\
            </button>';
        }
    
        html += '<div class="disclaimer"><a class="tab-navigation" href="' + env.extLinks.github + '/issues" target="_blank">' + handler.getLoc('link_report_issue') + '</a></div>';
                   
    KellyTools.setHTMLData(handler.page, html);
    var mInputs = document.getElementsByClassName('tab-navigation');
    for (var i = 0; i < mInputs.length; i++) {
        
        mInputs[i].onclick = function() {
            
            KellyTools.getBrowser().tabs.create({url: this.tagName == 'A' ? this.href : this.getAttribute('data-source')}, function(tab){});
            return false;
       }; 
    }  
}

KellyTools.loadFrontJs(function() {
    
    K_FAV = new KellyFavItems({env : KellyProfileJoyreactor.getInstance()});    
    K_FAV.load('cfg', function(fav) {
        KellyCPopup.init(fav.coptions); 
    }); 
    
});