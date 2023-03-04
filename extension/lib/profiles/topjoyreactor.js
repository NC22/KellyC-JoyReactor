// part of KellyFavItems extension
// JoyReactor environment driver

var KellyProfileTopJoyreactor = new Object();
    KellyProfileTopJoyreactor.create = function() {
        
        KellyProfileTopJoyreactor.self = new KellyProfileJoyreactor();   
        var handler = KellyProfileTopJoyreactor.self;
        
        handler.mainContainerClass = 'content-container';        
        handler.postClassName = 'post-card';
        
        handler.addToFavDropdown = false; handler.addToFavDropdownPost = false;
        
        handler.initOnLoad = function(onLoad) {
            
            // wait while 1. config ready + 2. page rendered by react (cookreactor not marks html by loading class + have old selectors)
            
            var ready = 0;
            var addReady = function(loadStageName, n) {
                         
                ready += n ? n : 1;                  
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
                handler.fav.load('items', function() { addReady('User fav image gallery loading'); });   
            });
            
            console.log('initOnLoad : Detect page ready...');
            handler.observer = new MutationObserver(function(mutations) {
            
                if (mutations.length > 0 && document.body.querySelector('.' + handler.postClassName)) {
                    handler.observer.disconnect();
                    addReady('Server side - Page ready'); 
                }                
            });
        
            handler.observer.observe(document.documentElement, {childList: true, subtree: true});
        }
        
        handler.initUpdateWatcher = function() {
            
            handler.observer = new MutationObserver(function(mutations) {
                
                for (var i = 0; i < mutations.length; i++) {
                    
                   if (mutations[i].target.classList.contains('content')) { // separate post updated (?)
                       
                        var post = KellyTools.getParentByClass(mutations[i].target, handler.postClassName);
                        if (post) handler.formatComments(post);
                        
                        return;
                        
                   } else if ( 
                        KellyTools.searchNode(mutations[i].addedNodes, false, handler.mainContainerClass) ||
                        KellyTools.searchNode(mutations[i].addedNodes, false, handler.postClassName) ||
                        (mutations[i].target.classList.contains(handler.mainContainerClass) && mutations[i].addedNodes.length > 0)
                    ) { // page update (added new post or main container modified)
                        
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
        
        handler.events.onExtensionReady = function() {
           
           if (handler.unlockManager) {                
               handler.unlockManager.initTagViewer();
               handler.unlockManager.tagViewer.openInCurrentTab = false; // need to add post-maket tpl special for m. html publications structure before
           }
           
           var formatPostWait = function() { // format post modal box when target post & target modal box detected
                
                if (handler.addToFavDropdownPost) {
                    
                    var postLink = handler.getPostLinkEl(handler.addToFavDropdownPost);
                    if (handler.addToFavDropdown && postLink && postLink.href.indexOf('unknown') != -1) { // init post container post id + link by dropdown info
                        postLink.href = handler.addToFavDropdown.querySelector('li a').href;
                    }
                    
                    var postId = postLink ? postLink.href.match(/[0-9]+/g) : 0;
                    if (handler.addToFavDropdown && postId > 0 && !handler.addToFavDropdown.getAttribute('data-kelly-post-id')) { // init dropdown feedback id for select on new dropdown calls by click [...]
                        handler.addToFavDropdown.setAttribute('data-kelly-post-id', postId);
                    }
                    
                    handler.addToFavDropdown = document.querySelector("[data-kelly-post-id=\"" + postId + "\"]");
               }
               
               if (handler.addToFavDropdownPost && handler.addToFavDropdown) {                   
                    handler.formatPostContainer(handler.addToFavDropdownPost);
                    handler.addToFavDropdownPost = false; handler.addToFavDropdown = false;
               }
           }
           
           document.addEventListener('click', function (e) {
                var dropdownButton = KellyTools.getParentByClass(e.target, 'ant-dropdown-trigger');
                if (dropdownButton) {
                    handler.addToFavDropdownPost = KellyTools.getParentByClass(e.target, handler.postClassName);
                    formatPostWait();
                }
            });            
            
            handler.observerModals = new MutationObserver(function(mutations) {
                for (var i = 0; i < mutations.length; i++) {
                    
                    var item = KellyTools.searchNode(mutations[i].addedNodes, 'DIV');
                    if (item !== false && item.innerHTML.indexOf('ant-dropdown') != -1) {
                        handler.addToFavDropdown = item.querySelector('.ant-dropdown');
                        formatPostWait();
                    }
                }              
            });

            handler.observerModals.observe(document.body, {childList: true});

            setTimeout(handler.updateSidebarConfig, 400);
        };
        
        handler.updateSidebarConfig = function() {
            
            handler.sidebarConfig.widthBase = 0;
            var pointer = handler.mContainers.siteContent;
            if (!pointer || pointer.style.display == 'none') {
                pointer = handler.mContainers.favContent;
            }
            
            handler.sidebarConfig.topMax = pointer.getBoundingClientRect().top + KellyTools.getScrollTop() + 24;
        }
        
        /*        
           method == 'registerDownloader' 
           Calls when all web request hooks initialized in background. We can miss several calls because extension cant load imidiatly and blocking page loading           
        */
        
        handler.events.onWebRequestReady = function(method, data) {}
        
        /*            
            After page fully loaded, and all hooks initialized and ready            
        */
        
        handler.events.onPageReadyOrig = handler.events.onPageReady;
        handler.events.onPageReady = function() {
            
            handler.events.onPageReadyOrig();
            
            handler.initUpdateWatcher(); // watch any updates on navigation on page
            
            handler.fav.getFastSave().tooltipOptions = {
                positionY : 'bottom',
                positionX : 'left',
                closeButton : false,
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
                 
            var videoSrc = content.getElementsByTagName('video');
            for (var i = 0; i < videoSrc.length; i++) {
                 
                var source = videoSrc[i].querySelector('source');
                if (!source) continue;
                
                var image = handler.getImageDownloadLink(source.src, false, 'gif');
                if (image) data.push(image);
            }
            return data;
        }
        
        handler.getCommentText = function(comment) {
            var contentContainer = comment.querySelector('.comment-content');
            if (contentContainer) return KellyTools.getElementText(contentContainer);
        }
                
        handler.getPostLinkEl = function(publication) { 
            
            var link = publication.getElementsByClassName(handler.className + '-post-link')[0];
            if (link) return link;
        
            link = publication.querySelector('.post-footer a'), linkButton = publication.querySelector('.post-footer button.ant-dropdown-trigger');
            if (!link && linkButton) { // user is logged-in - post id \ link is hidden in [...] and not accessable until click. Post link will be updated on [click] on [...]
            
                link = document.createElement('A');
                link.className = handler.className + '-post-link-by-dropdown';
                link.href = '/post/unknown/0';
                linkButton.parentNode.insertBefore(link, linkButton); 
            }
            
            if (link) link.classList.add(handler.className + '-post-link'); 
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
    
            if (postLink.classList.contains(handler.className + '-post-link-by-dropdown') && !handler.addToFavDropdown) {
                
            } else if (!coptions.hideAddToFav) {                
                
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
                
                textElement.innerText = (handler.addToFavDropdown ? '[KellyC] ' : '') + KellyLoc.s('', action + '_fav'); 
            }

            // KellyTools.log('formatPostContainer : ' + postLink.href);
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
    
    }
    
    KellyProfileTopJoyreactor.getInstance = function() {
        if (typeof KellyProfileTopJoyreactor.self == 'undefined') KellyProfileTopJoyreactor.create();    
        return KellyProfileTopJoyreactor.self;
    }