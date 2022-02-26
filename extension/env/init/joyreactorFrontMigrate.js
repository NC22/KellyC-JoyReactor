if ((typeof K_FAV == 'undefined' || K_FAV === null) && window.location === window.parent.location && KellyProfileJoyreactor.getInstance().setLocation(window.location)) {
    
    // wait body element rendered 
    
    var onDOMRendered = function() {
        
        var env = KellyProfileJoyreactor.getInstance();
        K_FAV = new KellyFavItems({env : env, location : window.location});  
        K_FAV.load('cfg', function(fav) {
                
            if (fav.coptions.disabled) return;
            
            var css = '\
                .kelly-jr-ui-tooltipster-container a {color: #412929; text-decoration: underline;}\
                .kelly-jr-ui-tooltipster-container button {border-radius: 4px; display: block; width: 100%; cursor: pointer; background: #fdb201; border: 0; padding: 10px;font-weight: bold; margin-bottom: 6px; min-width: 360px;}\
                button.kelly-jr-ui-aclose {background-color: #ff5f5f; margin-bottom : 0;}\
                .kelly-jr-ui-tooltipster-container p {text-align: center;}\
                .kelly-jr-ui-tooltipster-close {background: rgb(255, 255, 255); }\
                .kelly-jr-ui-tooltipster-container {background : rgba(255, 255, 255, 0.95); max-width: 496px; border-radius: 3px; border: 1px solid #bebebe; color: #0c0a0a;}\
                .kelly-jr-ui-tooltipster-container p.kelly-jr-ui-text { font-size: 14px; text-align: left;}\
                .kelly-jr-ui-tooltipster-close svg g line { stroke: #151111; fill: #151111;}\
                .kelly-jr-ui-migrate-diskete-shadow {\
                    position: fixed;\
                    z-index: 160001;\
                    content: " ";\
                    background: #1f1f1f61;\
                    width: 30px;\
                    height: 29px;\
                    left: 51px;\
                    bottom: 46px;\
                    -moz-box-shadow: 5px 22px 73px 0px rgba(34, 60, 80, 0.8);\
                    box-shadow: 0 0 10px 10px #1f1f1f82;\
                }\
                .kelly-jr-ui-migrate-diskete {\
                        z-index : 160002;\
                        position: fixed;\
                        bottom: 31px;\
                        left: 34px;\
                        width: 72px;\
                        height: 72px;\
                        background: url(https://catface.ru/userfiles/media/udata_1645451107_nefuamyi.png);\
                        background-position: center;\
                        background-size: 53px;\
                        background-position: center;\
                        background-repeat: no-repeat;\
                        right: -33px;\
                        animation: kelly-shake-diskete 2.82s cubic-bezier(.30,.07,.19,.97) both;\
                        transform: translate3d(0, 0, 0);\
                        animation-iteration-count: infinite;\
                        cursor: pointer;\
                }\
                @keyframes kelly-shake-diskete {\
                  5%, 45% {\
                    transform: translate3d(0, -1px, 0);\
                  }\
                  10%, 40% {\
                    transform: translate3d(0, 2px, 0);\
                  }\
                  15%, 25%, 35% {\
                    transform: translate3d(0, -3px, 0);\
                  }\
                  20%, 30% {\
                    transform: translate3d(0, 3px, 0);\
                  }\
                }\
            ';
                        
            KellyTooltip.autoloadCss = env.className + '-tooltipster';
            var tooltip = env.fav.getTooltip();
            KellyTools.addCss(env.className + '-tt', css);
            
            
            var dbox = KellyTools.setHTMLData(document.createElement('div'), '<div class="kelly-jr-ui-migrate-diskete-shadow"></div><div class="kelly-jr-ui-migrate-diskete"></div>');
                document.body.appendChild(dbox);
                
            var diskete = dbox.getElementsByClassName('kelly-jr-ui-migrate-diskete')[0];
                diskete.onclick = function() {
                        
                    var html = '   <p class="kelly-jr-ui-text">Привет</p>\
                                        <p class="kelly-jr-ui-text">По тех. причинам все фишки из <b>KellyC Image Downloader</b> сделанные для джойреактора перенесены в отдельное расширение</p>\
                                        <p class="kelly-jr-ui-text"><b>KellyC Image Downloader</b> можно удалить, если <a href="https://kellydownloader.com/ru/links/recorder/" target="_blank">функционал "записи"</a> не требуется</p>\
                                        <p class="kelly-jr-ui-text"><a href="#" class="kelly-jr-ui-site">Подробности</a>&nbsp;&nbsp;<a href="#" class="kelly-jr-ui-migrate" >Как перенести накопленные закладки?</a></p>\
                                        <button class="kelly-jr-ui-install">Установить новое расширение</button>\
                                        <button class="kelly-jr-ui-save">Сохранить свои закладки и картинки</button>\
                                        <button class="kelly-jr-ui-aclose">Больше не показывать</button>';
                                        
                        tooltip.resetToDefaultOptions();                        
                        tooltip.updateCfg({closeButton : true, offset : {left : 40, top : 0}});
                        tooltip.setMessage(html); 
                        
                        tooltip.getContentContainer().getElementsByClassName('kelly-jr-ui-install')[0].onclick = function() {
                            
                            KellyTools.getBrowser().runtime.sendMessage({method: "openTab", url : 'https://kellydownloader.com/ru/joyreactor-ex/?ext=mbhkdmjolnhcppnkldbdfaomeabjiofm'}, function(request) {});
                            return false;
                        }
                        
                        tooltip.getContentContainer().getElementsByClassName('kelly-jr-ui-save')[0].onclick = function() {
                            
                            KellyTools.getBrowser().runtime.sendMessage({method: "openTab", url : '/env/html/joyreactorDownloader.html?tab=profiles'}, function(request) {});
                            return false;
                        }
                        
                        tooltip.getContentContainer().getElementsByClassName('kelly-jr-ui-aclose')[0].onclick = function() {
                             tooltip.show(false);
                             fav.coptions.disabled = true;
                             K_FAV.save('cfg');
                             return false;
                        }
                        
                        tooltip.getContentContainer().getElementsByClassName('kelly-jr-ui-migrate')[0].onclick = function() {
                            
                            KellyTools.getBrowser().runtime.sendMessage({method: "openTab", url : 'https://kellydownloader.com/ru/joyreactor-migrate/'}, function(request) {});
                            return false;
                        }
                        
                        tooltip.getContentContainer().getElementsByClassName('kelly-jr-ui-site')[0].onclick = function() {
                            
                            KellyTools.getBrowser().runtime.sendMessage({method: "openTab", url : 'https://kellydownloader.com/ru/joyreactor-ex/?ext=mbhkdmjolnhcppnkldbdfaomeabjiofm'}, function(request) {});
                            return false;
                        }
                        
                        tooltip.show(true); 
                        env.fav.tooltipBeasy = true; 
                        dbox.style.display = 'none';
                        
                        tooltip.getContentContainer().getElementsByClassName('kelly-jr-ui-tooltipster-close')[0].onclick = function() {
                            dbox.style.display = '';
                            tooltip.show(false);
                        }
                        
                }
        });
        
        
        if (typeof bodyObserver != 'undefined') bodyObserver.disconnect(); 
    }
    
    if (document.body) { // "run_at": "document_idle"
        
        onDOMRendered();
        
    } else { // "run_at": "document_start"
  
        if (window.location.host.indexOf('top.joyreactor.cc') != -1 || window.location.host.indexOf('m.reactor.cc') != -1 || window.location.host.indexOf('m.joyreactor.cc') != -1 ) {
            
            var bodyObserver = new MutationObserver(function(mutations) {    
                 for (var i = 0; i < mutations.length; i++) {
                    if (KellyTools.searchNode(mutations[i].addedNodes, 'body')) return onDOMRendered();
                }                
            });   
        
            bodyObserver.observe(document.documentElement, {childList: true, subtree: true});  
        } else {
            document.addEventListener("DOMContentLoaded", onDOMRendered);
        }
    }
}

// keep empty space to prevent syntax errors if some symbols will added at end