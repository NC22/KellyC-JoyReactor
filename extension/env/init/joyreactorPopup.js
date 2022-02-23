KellyCPopup = new Object();
KellyCPopup.baseClass = 'kelly-popup';

KellyCPopup.getLoc = function(loc) {
    return KellyLoc.s('', loc);
}

KellyCPopup.showPagePopup = function() {
            
    var env = KellyProfileJoyreactor.getInstance();
    
    var handler = KellyCPopup;        
        handler.page = document.getElementById('page');
        handler.title =  'KellyC Longhorn v' + (KellyTools.getBrowser().runtime.getManifest ? KellyTools.getBrowser().runtime.getManifest().version : '');
        handler.titleHtml = '<span class="' + handler.baseClass + '-ext-name">' + handler.title + '</span><span class="kelly-copyright">created by <a class="tab-navigation"  href="' + env.extLinks.author + '" target="_blank">nradiowave</a></span>';
                
    document.title = handler.title;        
    KellyTools.setHTMLData(document.getElementById('header'), handler.titleHtml); 
    
    var html = '';
        html += '<div class="' + handler.baseClass + '-popup-go"><button class="' + handler.baseClass + '-options-btn tab-navigation" data-source="/env/html/joyreactorDownloader.html?tab=options">' + handler.getLoc('options') + '</button></div>';
        
        html += '<button class="' + handler.baseClass + '-additions-show tab-navigation" data-source="/env/html/joyreactorDownloader.html?tab=images">' + handler.getLoc('saved') + '</button>';
        html += '<button class="' + handler.baseClass + '-additions-show tab-navigation support" data-source="' + env.extLinks.support + '">' + handler.getLoc('link_support') + '</button>';
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

KellyCPopup.showPagePopup();