KellyCPopup = new Object();
KellyCPopup.baseClass = 'kelly-popup';

KellyCPopup.getLoc = function(loc) {
    return KellyLoc.s('', loc);
}

KellyCPopup.showPagePopup = function() {
            
    var env = KellyProfileJoyreactor.getInstance();
    
    var handler = KellyCPopup;        
        handler.page = document.getElementById('page');
        handler.title =  'KellyC JoyReactor v' + (KellyTools.getBrowser().runtime.getManifest ? KellyTools.getBrowser().runtime.getManifest().version : '');
        handler.titleHtml = '<span class="' + handler.baseClass + '-ext-name">' + handler.title + '</span><span class="kelly-copyright">created by <a href="' + env.extLinks.author + '" target="_blank">nradiowave</a></span>';
                
    document.title = handler.title;        
    KellyTools.setHTMLData(document.getElementById('header'), handler.titleHtml); 
    
    var html = '';
        html += '<div class="' + handler.baseClass + '-popup-go"><button class="' + handler.baseClass + '-options-btn tab-navigation" data-source="/env/html/joyreactorDownloader.html?tab=options">' + handler.getLoc('options') + '</button></div>';
        
        html += '<button class="' + handler.baseClass + '-additions-show tab-navigation" data-source="/env/html/joyreactorDownloader.html">' + handler.getLoc('saved') + '</button>';
        html += '<button class="' + handler.baseClass + '-additions-show tab-navigation" data-source="' + env.extLinks.github + '/issues">Сообщить о проблеме</button>';
        html += '<div class="disclaimer" data-source="' + KellyCPopup.reportIssue + '">----- BOTTOM ---- TEXT ----</button>';
                   
    KellyTools.setHTMLData(handler.page, html);
    var mInputs = document.getElementsByClassName('tab-navigation');
    for (var i = 0; i < mInputs.length; i++) {
        
        mInputs[i].onclick = function() {
            
            KellyTools.getBrowser().tabs.create({url: this.getAttribute('data-source')}, function(tab){});
       }; 
    }  
}

KellyCPopup.showPagePopup();