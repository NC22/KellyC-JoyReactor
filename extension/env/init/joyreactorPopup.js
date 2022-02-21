KellyCPopup = new Object();
KellyCPopup.baseClass = 'kelly-popup';
KellyCPopup.reportIssue = 'https://github.com/NC22/KellyC-Image-Downloader/issues';
KellyCPopup.pp = 'https://github.com/NC22/KellyC-Image-Downloader/wiki/%5BPP%5D-Privacy-Policy';


KellyCPopup.showTitle = function() {
    
    var handler = KellyCPopup;        
        handler.page = document.getElementById('page');
        handler.title = handler.getLoc('ext_name') + ' v' + (KellyTools.getBrowser().runtime.getManifest ? KellyTools.getBrowser().runtime.getManifest().version : '');
        handler.titleHtml = '<span class="' + handler.baseClass + '-ext-name">' + handler.title + '</span><span class="kelly-copyright">created by <a href="https://kelly.catface.ru/" target="_blank">nradiowave</a></span>';
        
        handler.titleHtml += '<div class="' + handler.baseClass + '-report">\
                                <a href="' + KellyCPopup.reportIssue + '" target="_blank">Сообщить о проблеме</a>\
                                <a href="' + KellyCPopup.pp + '" target="_blank">' + handler.getLoc('options_page_pp') + '</a>\
                             </div>';
                
    document.title = handler.title;        
    KellyTools.setHTMLData(document.getElementById('header'), handler.titleHtml); 

}

KellyCPopup.showPagePopup = function() {
            
    KellyCOptions.showTitle();
    if (KellyCOptions.showBgState(true)) return;
    
    var html = '';
        html += '<div class="' + this.baseClass + '-popup-go"><button class="' + this.baseClass + '-options-btn tab-navigation" data-source="/env/html/joyreactorDownloader.html?tab=options">' + this.getLoc('options') + '</button></div>';
        
        html += '<button class="' + this.baseClass + '-additions-show tab-navigation" data-source="/env/html/joyreactorDownloader.html?tab=profiles">' + this.getLoc('saved') + '</button>';
        html += '<button class="' + this.baseClass + '-additions-show tab-navigation" data-source="' + KellyCOptions.reportIssue + '">Сообщить о проблеме</button>';
        html += '<div class="disclaimer" data-source="' + KellyCOptions.reportIssue + '">----- BOTTOM ---- TEXT ----</button>';
                   
    KellyTools.setHTMLData(this.page, html);
    var mInputs = document.getElementsByClassName('tab-navigation');
    for (var i = 0; i < mInputs.length; i++) mInputs[i].onclick = function() {KellyTools.getBrowser().tabs.create({url: this.getAttribute('data-source')}, function(tab){});}; 
}

KellyCOptions.showPagePopup();