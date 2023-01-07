// part of KellyFavItems extension
// JoyReactor environment driver

var KellyProfileTopJoyreactor = new Object();

    KellyProfileTopJoyreactor.SafeMode = true; // Mobile version is recently updated, so disable add to FAV features and additional hooks, to prevent unexpected results for now
    
    KellyProfileTopJoyreactor.create = function() {
        
        KellyProfileTopJoyreactor.self = new KellyProfileJoyreactor();   
        var handler = KellyProfileTopJoyreactor.self;
        
        handler.mainContainerClass = 'content-container';
        
        handler.webRequestsReady = false;
        handler.onWebRequestReadyE = [];
        
        handler.events.onPageReadyOrig = handler.events.onPageReady;
        handler.events.onExtensionReady = function() {
           
            if (handler.unlockManager) {                
                handler.unlockManager.initTagViewer();
                handler.unlockManager.tagViewer.openInCurrentTab = false; // need to add post-maket tpl special for m. html publications structure before
            }
            
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
        
        /*
            Replace original window.fetch method to extension one with window.postMessage callbacks and webRequest hooks (put addition headers on low level) 
        */
        
        handler.initFetchHook = function(onReady) {
            
            window.addEventListener('message', function(e) {
                    
                    if (!e.data || !e.data.method || e.data.method != 'kelly_fetch_hook_event' || !e.data.requestId) return false;
                    
                    
                    var getGraphQLPosts = function(inData) {
                        
                        if (!inData) return false;
                        
                        if (inData.node) { // e.data.eventDataIn.requestCfg.body.indexOf(...) RefetchPagerQuery
                             
                             if (!inData.node.postPager) 
                                 return inData.node.posts; 
                             else 
                                 return inData.node.postPager.posts;
                             
                        } else if (inData.tag) { // e.data.eventDataIn.requestCfg.body.indexOf(...) TagPageQuery 
                            return inData.tag.postPager.posts; 
                        } else if (inData.user) { // e.data.eventDataIn.requestCfg.body.indexOf(...) UserProfilePageQuery
                            return inData.user.postPager.posts;     
                        } else if (inData.weekTopPosts) { // e.data.eventDataIn.requestCfg.body.indexOf(...) WeekTopPageQuery
                            return inData.weekTopPosts;  
                        } else { // main page
                            return false;
                        }
                        
                    }
                    
                    var response = {
                        method : 'kelly_fetch_hook_event_complite',
                        requestId : e.data.requestId,
                        eventName : e.data.eventName,
                        eventDataOut : false,
                    };     
                    
                    if (e.data.eventName == 'onRequestReady') {
                        
                        var modifyResponse = false;
                        
                        /*
                        if (handler.unlockAnon && e.data.eventDataIn.responseJson.data && typeof e.data.eventDataIn.responseJson.data.me != 'undefined' && !e.data.eventDataIn.responseJson.data.me) {
                            
                            var id = 1005500 + Math.floor(Math.random() * 400);

                            e.data.eventDataIn.responseJson.data.me = {
                                blockedBlogs: [],
                                gifByClick: false,
                                moderatedBlogs: [],
                                subscribedBlogs: [],
                                user : {
                                    active: true,
                                    id: window.btoa('User:' + id),
                                    username: "Anon" + Math.floor(Math.random() * 400),
                                },
                            }
                            
                            
                            KellyTools.log('onRequestReady : GraphQL anon session enable : ' + id); 
                            
                            modifyResponse = true;
                        }
                        */
                                
                        var posts = false;
                        try {
                            
                            console.log('DETECT POSTS');
                            console.log(e.data.eventDataIn);
                            
                            if (Object.prototype.toString.call(e.data.eventDataIn.responseJson) === '[object Array]') {
                                
                                for (var i = 0; i < e.data.eventDataIn.responseJson.length; i++) {
                                    
                                    posts = getGraphQLPosts(e.data.eventDataIn.responseJson[i].data);                                   
                                    if (posts) break;
                                }
                                
                            } else {
                                
                                posts = getGraphQLPosts(e.data.eventDataIn.responseJson.data);
                            }
                            
                            console.log(posts);
                             
                        } catch(e) {
                            
                            console.log(e);                            
                            posts = false;
                        }
                        
                        if (posts) {
                            
                            KellyTools.log('onRequestReady : GraphQL posts data updated ' + posts.length); 
                            
                            for (var i = 0; i < posts.length; i++) {
                                posts[i].user.username += '?POST_ID=' + (KellyProfileJoyreactorUnlock.getNodeId(posts[i].id));
                                posts[i].unsafe = false;
                            }
                            
                            modifyResponse = true;
                        }
                        
                        if (modifyResponse) {
                            
                            response.eventDataOut = {
                                
                                responseBody : JSON.stringify(e.data.eventDataIn.responseJson),
                                
                                responseOptions : { 
                                    "status" : 200 ,
                                    "statusText" : "OK", 
                                    "headers" : e.data.eventDataIn.responseHeaders,
                                },
                            };
                        }
                                                
                        e.source.postMessage(response, window.location.origin);
                                        
                    } else if (e.data.eventName == 'onBeforeRequestReady') {
                        
                        // if (e.data.eventDataIn.requestCfg.body.indexOf('isAuthorised') != -1) {
                        //    response.eventDataOut = {requestBody : e.data.eventDataIn.requestCfg.body.replace('"isAuthorised":false', '"isAuthorised":true')};
                        // }
                        
                        if (handler.webRequestsReady) {                            
                          
                            e.source.postMessage(response, window.location.origin);
                            
                        } else {
                            
                            KellyTools.log('onBeforeRequestReady : wait webrequests ready');
                            handler.onWebRequestReadyE.push([e.source, response]);
                        }
                    
                    } else {
                        
                        e.source.postMessage(response, window.location.origin);
                    }
                    
            }); 
            
            KellyTools.injectAddition('fetch', onReady);
        }        
        
        handler.initPosts = function(onReady) {
            
            var post = document.body.querySelectorAll('.post-card'), postValid = [];
            for (var i = 0; i < post.length; i++) {
                
                // user unath style - link is accessable
                
                var link = post[i].querySelector('.post-footer a.ant-btn.ant-btn-text');
                if (link) {
                    
                    link.classList.add(handler.className + '-post-link'); 
                    post[i].classList.add(handler.className + '-post');
                
                // user is logged-in - post id \ link is hidden in [...] and not accessable until click. Post id is recovered by fetch hook and placed to element [class=kelly-post-id] 
                
                } else {
                    
                    var postId = false;
                    if (!post[i].getAttribute('data-id')) {
                        
                        postId = post[i].querySelector('.primary-link');
                        if (postId && postId.innerHTML.indexOf('POST_ID=') != -1) {
                            
                            var postIdData = postId.innerHTML.split('=')[1].trim();
                            
                            postId.innerText = postId.innerHTML.replace('?POST_ID=' + postIdData, '');
                            postId.href = postId.href.replace(encodeURIComponent('?POST_ID=' + postIdData), '');
                            
                            postId.parentNode.insertBefore(postId.cloneNode(true), postId); // clear native events
                            postId.parentNode.removeChild(postId);
                            
                            post[i].setAttribute('data-id', postIdData);
                            
                        } else postId = false;
                    }
                    
                    var linkButton = post[i].querySelector('.post-footer button.ant-dropdown-trigger');
                    if (linkButton && postId) {
                        
                        link = document.createElement('A');
                        link.className = handler.className + '-post-link';
                        link.href = '/post/' + postId.getAttribute('data-id');
                        linkButton.parentNode.insertBefore(link, linkButton); 
                        post[i].classList.add(handler.className + '-post');
                        
                    }
                    
                }
            }
            
            onReady();
        }
        
        handler.initOnLoad = function(onLoad) {
            
            var ready = 0;
            var addReady = function(loadStageName) {
                         
                ready += 1;                  
                KellyTools.log('initOnLoad : ' + loadStageName + ' (' + ready + ')' + ' - DONE'); 
                
                if (ready == 3) {
                    KellyTools.log('initOnLoad : - DONE'); 
                
                    onLoad();
                }
            }
            
            if (!KellyProfileTopJoyreactor.SafeMode) handler.initFetchHook(function() { addReady('initFetchHook'); });
            else {
                console.log('initOnLoad : - IGNORE HOOKS, post formating is imposible');
                addReady('initFetchHook - SKIP');
            }
            
            handler.fav.load('cfg', function(fav) {
                
                if (fav.coptions.disabled) return;
                
                handler.unlockUnsafe = false;
                if (fav.coptions.unlock && fav.coptions.unlock.unsafe) {
                     handler.unlockUnsafe = true;
                }
                
                handler.unlockAnon = false;
                if (fav.coptions.unlock && fav.coptions.unlock.anon) {
                     handler.unlockAnon = true;
                }
                
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
            
                handler.observer = new MutationObserver(function(mutations) {
                    
                    if (mutations.length > 0 && document.body.querySelector('.post-card')) {
                        handler.observer.disconnect();
                        handler.initPosts( function() { addReady('Server side - Page ready'); } ); 
                    }                
                });
                
                handler.observer.observe(document.documentElement, {childList: true, subtree: true});
            }
        }
        
        handler.getPosts = function(container) {
            if (!container) container = document;
            return document.getElementsByClassName(handler.className + '-post');
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
    
        handler.getPostLinkEl = function(publication) { 
            return publication.getElementsByClassName(handler.className + '-post-link')[0];
        }
        
        handler.formatPostContainer = function(postBlock) {
            
            var coptions = handler.fav.getGlobal('fav').coptions;
            if (coptions.hideAddToFav && !coptions.fastsave.enabled && !coptions.fastsave.configurableEnabled) return;
            
            var tags = postBlock.getElementsByClassName('badge');
            if (tags.length && tags[0].parentElement) tags[0].parentElement.classList.add('taglist');
            
            var postLink = handler.getPostLinkEl(postBlock);
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
            
            /*
            var postId = postBlock.querySelector('.kelly-post-id');
            if (postId && postBlock.innerHTML.indexOf('/user/%D0%A0%D0%B0%D0%B4%D0%B8%D0%BE%D0%B2%D0%BE%D0%BB%D0%BD%D0%B0') != -1 && !postBlock.querySelector('#' + handler.className + '-n-copyright-' + postId.getAttribute('data-id'))) {
                var postContent = postBlock.querySelector('.post-content > div > div');
                if (postContent && !postContent.querySelector('a:not([class])')) {
                    postContent.appendChild(KellyTools.setHTMLData(
                        document.createElement('p'), 
                        '<a style="padding-top: 12px;display: block; padding-bottom: 6px;" href="https://nradiowave.ru/?kellyc=1" target="_blank" id="' + handler.className + '-n-copyright-'+ postId.getAttribute('data-id')+'">Автор, архивы рисунков</a>'
                    ));
                }
            }
            */
            
            if (!coptions.hideAddToFav) {
                
                var addToFav = KellyTools.getElementByClass(postBlock, handler.className + '-post-addtofav');        
                if (!addToFav) {               
                    addToFav = document.createElement('a');
                    addToFav.href = postLink.href;
                    addToFav.className = handler.className + '-post-addtofav';
                    buttonsBlock.appendChild(addToFav);
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
                addToFav.innerText = KellyLoc.s('', action + '_fav'); 
            }     
        }   
        
        handler.formatComments = function(block) {
            
            if (handler.fav.getGlobal('fav').coptions.hideAddToFav) return;
            
            var comments = block.getElementsByClassName('comment');        
            for(var i = 0; i < comments.length; i++) {
                 
                var link = KellyTools.getRelativeUrl(handler.getCommentLink(comments[i]));
                if (!link) continue;
                
                var addToFavButton = comments[i].getElementsByClassName(handler.className + '-addToFavComment');            
                if (!addToFavButton.length) {
            
                    var bottomLink = comments[i].getElementsByClassName('comment-link');

                    addToFavButton = document.createElement('a');
                    addToFavButton.href = '#';
                    addToFavButton.className = handler.hostClass + ' ' + handler.className + '-addToFavComment';
                    bottomLink[0].parentNode.insertBefore(addToFavButton, bottomLink[0].nextSibling);                     
                }         
                
                handler.updateCommentAddToFavButtonState(block, comments[i], link);
            }
            
            KellyTools.log('formatComments : ' + comments.length + ' - '+ block.id);
        }  

        handler.initUpdateWatcher = function() {
            
            handler.observer = new MutationObserver(function(mutations) {
                
                for (var i = 0; i < mutations.length; i++) {

                   //if ( mutations[i].addedNodes.length > 0) {
                   //    console.log( mutations[i]);
                   //}
                   
                   if (mutations[i].target.classList.contains('content')) {
                        var post = KellyTools.getParentByClass(mutations[i].target, handler.className + '-post');
                        if (post) {
                            handler.formatComments(post);
                        }
                        
                        return;
                        
                   } else if ( 
                        KellyTools.searchNode(mutations[i].addedNodes, false, 'content-container') ||
                        KellyTools.searchNode(mutations[i].addedNodes, false, 'jr-container') ||
                        (mutations[i].target.classList.contains(handler.mainContainerClass) && mutations[i].addedNodes.length > 0)
                    ) {
                        
                       handler.getMainContainers();
                       setTimeout(handler.updateSidebarConfig, 400);
                       handler.initPosts(function() {
                            
                           KellyTools.log('Page updated, format publications');
                                                
                           if (handler.fav.getGlobal('mode') == 'main') handler.fav.closeSidebar();
                           else handler.fav.hideFavoritesBlock();
                            
                           handler.fav.formatPostContainers();  
                       });
                        
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
            
            if (!handler.mContainers.siteContent || !handler.mContainers.body) {
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