// part of KellyFavItems extension
// JoyReactor environment driver

var KellyProfileTopJoyreactor = new Object();
    KellyProfileTopJoyreactor.create = function() {
        
        KellyProfileTopJoyreactor.self = new KellyProfileJoyreactor();   
        var handler = KellyProfileTopJoyreactor.self;
        
        handler.mainContainerClass = 'content-container';
        
        handler.postClassName = 'post-card';
        
        handler.webRequestsReady = false;
        handler.onWebRequestReadyE = [];
        
        handler.addToFavDropdown = false;
        
        handler.events.onPageReadyOrig = handler.events.onPageReady;
        handler.events.onExtensionReady = function() {
           
           if (handler.unlockManager) {                
               handler.unlockManager.initTagViewer();
               handler.unlockManager.tagViewer.openInCurrentTab = false; // need to add post-maket tpl special for m. html publications structure before
           }
            
           document.addEventListener('click', function (e) {
                
                var dropdownButton = KellyTools.getParentByClass(e.target, 'ant-dropdown-trigger');
                if (dropdownButton) {
                    
                    var tryFormat = function(at, post) {
                        
                        at--;
                        setTimeout(function() {
                            var dropdown = document.body.querySelectorAll('.ant-dropdown-placement-top');                        
                            for (var i = 0; i < dropdown.length; i++) {
                                
                               if (!dropdown[i].classList.contains('ant-dropdown-hidden')) {
                                   handler.addToFavDropdown = dropdown[i];
                                   handler.formatPostContainer(post);
                                   return true;
                               }
                            }
                            
                            if (at) tryFormat(at, post);
                        }, 350);
                    }    
                    
                    var post = KellyTools.getParentByClass(e.target, handler.postClassName);
                    if (post) tryFormat(2, post);
                }
                
            });
            
            setTimeout(handler.updateSidebarConfig, 400);
        };
        
        handler.updateSidebarConfig = function() {
            
            handler.sidebarConfig.widthBase = 0;
            var pointer = handler.mContainers.siteContent;
            if (!pointer || pointer.style.display == 'none') {
                pointer = handler.mContainers.favContent;
            }
            
            handler.sidebarConfig.topMax = pointer.getBoundingClientRect().top + KellyTools.getScrollTop() + 24;   
            //console.log(handler.sidebarConfig);
            //console.log(pointer);
        }
        
        /* 
           
           Calls when all web request hooks initialized in background
           We collect all window.fetch request untill then and place them in to pool - handler.onWebRequestReadyE, to procced when webRequests ready
           
        */
        
        handler.events.onWebRequestReady = function(method, data) {
            
            if (method == 'registerDownloader' && !handler.webRequestsReady) {
                
                clearTimeout(handler.failBGTimer);
                KellyTools.log('webRequests ready | Delayed events : ' + handler.onWebRequestReadyE.length);
                handler.webRequestsReady = true;
                
                for (var i = 0; i < handler.onWebRequestReadyE.length; i++) {
                   handler.onWebRequestReadyE[i][0].postMessage(handler.onWebRequestReadyE[i][1], window.location.origin);                    
                }
            }
        }
        
        /*
            
            After page fully loaded, and all hooks initialized and ready
            
        */
        
        handler.events.onPageReady = function() {
            
            handler.events.onPageReadyOrig();
            
            handler.initUpdateWatcher(); // watch any updates on navigation on page
            
            handler.fav.getFastSave().tooltipOptions = {
                positionY : 'bottom',
                positionX : 'left',
                closeButton : false,
            }
        }
        
        handler.initOnLoad = function(onLoad) {
            
            var ready = 0;
            
            // wait while 1. config ready + 2. page post list ready + 3. fetch hook ready (optional)
            
            // 2. not passed in - cookreactor have other post selectors
            
            var addReady = function(loadStageName) {
                         
                ready += 1;                  
                console.log('initOnLoad : ' + loadStageName + ' (' + ready + ')' + ' - DONE'); 
                
                if (ready == 2) {
                    console.log('initOnLoad : - DONE'); 
                
                    onLoad();
                }
            }
            
            handler.fav.load('cfg', function(fav) {
                
                if (fav.coptions.disabled) return;
                if (fav.coptions.unlock && !fav.coptions.unlock.mreact) return;
    
                handler.unlockUnsafe = false;
                if (fav.coptions.unlock && fav.coptions.unlock.unsafe) {
                     handler.unlockUnsafe = true;
                }
                
                handler.unlockAnon = false;
                if (fav.coptions.unlock && fav.coptions.unlock.anon) {
                     handler.unlockAnon = true;
                }
                
                handler.webRequestsRules.urlMap = [[
                    'https://api.joyreactor.cc/graphql', 'https://api.joyreactor.cc', {'Origin' : 'https://api.joyreactor.cc'}, {
                        "Access-Control-Allow-Origin" : window.location.origin,
                        'Access-Control-Allow-Credentials' :  "true",
                        'Access-Control-Allow-Headers' : "Origin, X-Requested-With, Content-Type, Accept",
                }]];
                
                handler.fav.initBgEvents();
                
                /* too long conection to local bg process, something wrong. manifest v3 serwice workers currently glithy as fuck */
                
                handler.failBGTimer = setTimeout(function() {
                    KellyTooltip.autoloadCss = handler.className + '-tooltipster';
                    var tooltip = handler.fav.getTooltip();
                    tooltip.resetToDefaultOptions();                        
                    tooltip.setMessage('Расширение KellyC не смогло корректно инициализировать фоновый процесс, возможны проблемы в обработке контента. Перезагрузите браузер или вкладку. Если проблема повторится, сообщите о проблеме разработчику одним из возможных способов <a href="https://kellydownloader.com/ru/links/issues/" target="_blank" style="color: #ff7600; font-weight: bold;">здесь</a>'); 
                    tooltip.show(true); 
                    
                    handler.fav.tooltipBeasy = true; 
                    handler.events.onWebRequestReady('registerDownloader', false);
                }, 2000);
                
                handler.fav.load('items', function() { addReady('User fav image gallery loading'); });   
            });   
            
            if (handler.getPosts().length > 0) {
                addReady('Server side - Page ready');
            } else {
            
                console.log('initOnLoad : - wait posts list load before init...');
                handler.observer = new MutationObserver(function(mutations) {
                    
                    if (mutations.length > 0 && document.body.querySelector('.' + handler.postClassName)) {
                        handler.observer.disconnect();
                        addReady('Server side - Page ready');
                    }                
                });
                
                handler.observer.observe(document.documentElement, {childList: true, subtree: true});
            }
        }
        
        handler.getPosts = function(container) {
            if (!container) container = document;
            return document.getElementsByClassName(handler.postClassName);
        }
        
        handler.getAllMedia = function(publication) {
            
            var data = [], content = KellyTools.getElementByClass(publication,publication.classList.contains('comment') ? 'comment-content' : 'post-content');
            if (!content || !publication) return data;
                 
            var imagesEl = content.getElementsByTagName('img');
            for (var i = 0; i < imagesEl.length; i++) {
                 
                var imageLink = imagesEl[i].getAttribute("src");
                
                if (imageLink.indexOf('data:') === 0) continue;
                
                if (imageLink.indexOf('static/') != -1) {
                    imageLink = imageLink.replace('static/', '');
                    imageLink = imageLink.substr(0, imageLink.lastIndexOf('.')) + '.gif';
                }
                
                var image = handler.getImageDownloadLink(imageLink, false);
                if (image) data.push(image);
            }
            
            return data;
        }
        
        handler.getCommentText = function(comment) {
            var contentContainer = comment.querySelector('.comment-content');
            if (contentContainer) return KellyTools.getElementText(contentContainer);
        }
        
        handler.updatePostLinkByDropdown = function(link) {
            
             if (link && handler.addToFavDropdown) {
                    
                var dropdownLink = handler.addToFavDropdown.querySelector('li a');
                if (dropdownLink) {
                    link.href = dropdownLink.href;
                }
            }
            
            return link;
        }
    
        handler.getPostLinkEl = function(publication) { 
            
            var link = publication.getElementsByClassName(handler.className + '-post-link')[0];
            if (link) return handler.updatePostLinkByDropdown(link);
        
            link = publication.querySelector('.post-footer a.ant-btn-link');
            if (link) {
                
                link.classList.add(handler.className + '-post-link'); 
            
            // user is logged-in - post id \ link is hidden in [...] and not accessable until click. Post id is recovered by fetch hook and placed to element [class=kelly-post-id] 
            
            } else {
                
                var linkButton = publication.querySelector('.post-footer button.ant-dropdown-trigger');                
                if (linkButton) {
                    
                    link = document.createElement('A');
                    link.className = handler.className + '-post-link';
                    link.href = '/post/unknown';
                    linkButton.parentNode.insertBefore(link, linkButton); 
                }
                
                handler.updatePostLinkByDropdown(link);
            }                
                
            return link;
        }
        
        handler.formatPostContainer = function(postBlock) {             
                
            var coptions = handler.fav.getGlobal('fav').coptions;
            if (coptions.hideAddToFav && !coptions.fastsave.enabled && !coptions.fastsave.configurableEnabled) return;
            
            var tags = postBlock.getElementsByClassName('badge');
            if (tags.length && tags[0].parentElement) tags[0].parentElement.classList.add('taglist');
            
            var postLink = handler.getPostLinkEl(postBlock);
            if (!postLink) return;
            
            var buttonsBlock = KellyTools.getElementByClass(postBlock, handler.className + '-extension-additions');
            
            if (!buttonsBlock) {            
                buttonsBlock = document.createElement('div');
                buttonsBlock.className = handler.className + '-extension-additions';
                postLink.parentNode.insertBefore(buttonsBlock, postLink);
            }
       
            var link = handler.getPostLink(postBlock);
            var className =  handler.className + '-post-addtofav';
                       
            var fastSave = handler.fav.getFastSave();                         
                fastSave.showFastSaveButton(postBlock, buttonsBlock, coptions.fastsave.enabled, false, handler.className);   
                fastSave.showFastSaveButton(postBlock, buttonsBlock, coptions.fastsave.configurableEnabled, true, handler.className);  
    
            if (!coptions.hideAddToFav && postLink.href.indexOf('unknown') == -1) {
                
                if (handler.addToFavDropdown) {
                    var addToFav = KellyTools.getElementByClass(handler.addToFavDropdown, handler.className + '-post-addtofav-dropdown');        
                    if (!addToFav) {               
                    
                        addToFav = handler.addToFavDropdown.querySelector('li').cloneNode(true);
                        addToFav.classList.add(handler.className + '-post-addtofav-dropdown');
                        addToFav.setAttribute('data-menu-id', '');    
                        handler.addToFavDropdown.querySelector('ul').appendChild(addToFav);
                    }
                    
                    var textElement = addToFav.querySelector('span:nth-child(2)');
                    
                } else {
                        
                    var addToFav = KellyTools.getElementByClass(postBlock, handler.className + '-post-addtofav');        
                    if (!addToFav) {               
                        addToFav = document.createElement('a');
                        addToFav.href = postLink.href;
                        addToFav.className = handler.className + '-post-addtofav';
                        buttonsBlock.appendChild(addToFav);
                    }
                    
                    var textElement = addToFav;
                }
                
                var postIndex = handler.fav.getStorageManager().searchItem(handler.fav.getGlobal('fav'), {link : link, commentLink : false});
                var action = postIndex !== false ? 'remove_from' : 'add_to';  
                var onAction = function(remove) {
                    if (remove) handler.fav.closeSidebar();
                    handler.formatPostContainer(postBlock); 
                }
                
                addToFav.onclick = function() { 
                    handler.fav.showAddToFavDialog(action == 'remove_from' ? postIndex : postBlock, false, onAction, function() {onAction(true)});
                    return false; 
                };
                              
                KellyTools.classList(action == 'remove_from' ? 'add' : 'remove', addToFav, handler.className + '-post-addtofav-added');
                
                textElement.innerText = KellyLoc.s('', action + '_fav') + (handler.addToFavDropdown ? ' [KellyC]' : ''); 
            }         

            KellyTools.log('formatPostContainer : ' + postLink.href);

        }   
        
        handler.formatComments = function(block) {
            
            if (handler.fav.getGlobal('fav').coptions.hideAddToFav) return;

            var comments = block.getElementsByClassName('comment');        
            for(var i = 0; i < comments.length; i++) {
                 
                var link = KellyTools.getRelativeUrl(handler.getCommentLink(comments[i]));
                if (!link) continue;
                
                var addToFavButton = comments[i].getElementsByClassName(handler.className + '-addToFavComment')[0];            
                if (!addToFavButton) {
            
                    var bottomLink = comments[i].getElementsByClassName('comment-link');

                    addToFavButton = document.createElement('a');
                    addToFavButton.href = '#';
                    addToFavButton.className = handler.hostClass + ' ' + handler.className + '-addToFavComment';
                    bottomLink[0].parentNode.insertBefore(addToFavButton, bottomLink[0].nextSibling);                     
                }
                
                handler.updateCommentAddToFavButtonState(block, comments[i], link);
                if (KellyTools.getViewport().screenWidth < 1080) addToFavButton.innerHTML = '';
            }
            
            KellyTools.log('formatComments : ' + comments.length + ' - '+ block.id);
        }  

        handler.initUpdateWatcher = function() {
            
            handler.observer = new MutationObserver(function(mutations) {
                
                for (var i = 0; i < mutations.length; i++) {

                   if (mutations[i].target.classList.contains('content')) {
                        var post = KellyTools.getParentByClass(mutations[i].target, handler.postClassName);
                        if (post) {
                            handler.formatComments(post); // todo add delay
                        }
                        
                        return;
                        
                   } else if ( 
                        KellyTools.searchNode(mutations[i].addedNodes, false, 'content-container') ||
                        KellyTools.searchNode(mutations[i].addedNodes, false, 'jr-container') ||
                        (mutations[i].target.classList.contains(handler.mainContainerClass) && mutations[i].addedNodes.length > 0)
                    ) {
                        
                       handler.getMainContainers();
                   
                       KellyTools.log('Page updated, format publications');
                                            
                       if (handler.fav.getGlobal('mode') == 'main') handler.fav.closeSidebar();
                       else handler.fav.hideFavoritesBlock();
                       
                       clearTimeout(handler.formatContainersTimeout);                       
                       handler.formatContainersTimeout = setTimeout(function() {
                            handler.updateSidebarConfig();
                            handler.fav.formatPostContainers();
                       }, 400); 
                       
                       return;
                        
                    } else if (mutations[i].target.id == 'root' && KellyTools.searchNode(mutations[i].removedNodes, false, 'container') && handler.fav.getGlobal('mode') == 'main') {
                                   
                        handler.fav.closeSidebar();
                        KellyTools.log('Page publications removed');
                        return;
                   }
                   
                }
            });
            
            handler.observer.observe(handler.getMainContainers().body, {childList: true, subtree: true});
        }
    
        handler.getMainContainers = function() {
            
            handler.hostClass = handler.className + '-' + 'top-joyreactor-cc';        
              
            if (!handler.mContainers) {
                
                handler.mContainers = { 
                    favContent : document.createElement('div'),                
                    menu : document.createElement('div'),
                };
                
                handler.mContainers.menu.id = 'submenu';
                handler.mContainers.menu.className = handler.hostClass;                
                handler.mContainers.favContent.className = handler.className + '-FavContainer ' + handler.hostClass;
            } 
            
            // todo reinit only on observer
            
            handler.mContainers.body = document.getElementById('root');
            handler.mContainers.sideBar = handler.mContainers.body;
            handler.mContainers.sideBlock = document.querySelector('.sidebar');
            handler.mContainers.siteContent = document.querySelector('.' + handler.mainContainerClass);
            handler.mContainers.menuHolder = document.querySelector('.nsfw_switcher');
            
            if (!handler.mContainers.menuHolder) {
                
                var styleSwitcher = document.querySelector('.bg-black-classic');
                
                if (styleSwitcher) {
                    handler.mContainers.menuHolder = document.createElement('DIV');
                    styleSwitcher.parentElement.insertBefore(handler.mContainers.menuHolder, styleSwitcher.nextSibling);
                }
            }
            
            if (!handler.mContainers.menuHolder || !handler.mContainers.siteContent || !handler.mContainers.body) {
                KellyTools.log('getMainContainers : cant create containers, check selectors', KellyTools.E_ERROR);
                KellyTools.log(handler.mContainers, KellyTools.E_NOTICE);
                return false;               
            }
            
            handler.mContainers.menuHolder.appendChild(handler.mContainers.menu);
            handler.mContainers.siteContent.parentElement.insertBefore(handler.mContainers.favContent, handler.mContainers.siteContent.nextSibling); 
        
            return handler.mContainers;
        }        
    }
    
    KellyProfileTopJoyreactor.getInstance = function() {
        if (typeof KellyProfileTopJoyreactor.self == 'undefined') KellyProfileTopJoyreactor.create();    
        return KellyProfileTopJoyreactor.self;
    }