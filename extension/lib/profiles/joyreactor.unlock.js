var KellyProfileJoyreactorUnlock = {
    
    // updatePostsDisplay - only nsfw \ only sfw \ nsfw+sfw \ mark banned tags
    // this.handler = env profile object
    
    postMaxHeight : 2000, cacheLimit : 400, cacheDataVersion : 2, cacheCleanUpN : 100, cacheItemMaxSizeKb : 15, ratingUnhideAfterHours : 92, ratingMaxVoteHours : 92, commentMaxDeleteMinutes : 10, // unhide rating for comments older > 24 hour
    tplItems : [
        'tag', 
        'att-video', 'att-image', 'att-youtube', 'att-coub', 'att-soundcloud',
        'query', 'query-me', 'query-post', 'query-tag', 'query-post-with-comments', 'query-post-vote',
        'post', 'post-maket', 'post-locked', 
        'comment', 'comment-old', 
        'post-form-comment', 'post-form-vote', 'comment-form-vote'
    ],    
    authData : {token : false}, // user data, hidden in page js
    initEvents : [], 
    me : { // used data, from API
        loaded : false,
        getDefaultData : function() {
            return {
                default : true,
                blockedTags : [],
                blockedUsers : [],
                blockedTagsInline : '',
                subscribedTags : [],
                user : {id : -1},
            };
        }, 
        isLoggedIn : function() { return KellyProfileJoyreactorUnlock.options.unlock.auth && document.getElementById('logout') ? true : false; },
        updateMe : function(onReady) { // currently used only in tagviewer - can be used also for formatcensoredposts - during main feed formating
            
            var self = KellyProfileJoyreactorUnlock;
            if (self.me.requestController) return false;
            
            var meQuery = self.getTpl('query-me', {});
            query = "meData1:me {" + meQuery.replace(/(?:\r\n|\r|\n)/g, '') + "}";
            
            self.me.requestController = self.getUnlockController(); 
            self.me.requestController.cfg = {credentials : true, maxAttempts : 2, reattemptTime : 1.4, }; 
            self.me.requestController.callback = function(unlockedData) {
                
                if (!unlockedData.data || typeof unlockedData.data.meData1 != 'object') {
                    
                    console.log('fail to get me data');
                    onReady(false);
                    return;
                }
                
                if (unlockedData.data.meData1 === null) {
                    unlockedData.data.meData1 = self.me.getDefaultData();                
                }
                            
                self.options.unlock.meData = unlockedData.data.meData1;
                self.options.unlock.meData.default = false;                     
                
                self.me.requestController = false;
                
                self.options.unlock.meData.blockedTagsInline = '';            
                for (var i = 0; i < self.options.unlock.meData.blockedTags.length; i++) {
                    var tagName = self.options.unlock.meData.blockedTags[i].name.trim().toLowerCase().normalize();
                    self.options.unlock.meData.blockedTagsInline += '||' + tagName;
                } 
                
                if (self.options.unlock.meData.blockedTagsInline.length > 0) self.options.unlock.meData.blockedTagsInline += '||';
                
                self.handler.fav.save('cfg');
                
                onReady(self.options.unlock.meData);
            }
            
            self.me.requestController.request(query);
                
        },        
        searchPool : function(name, pool, key) {
            
            if (!key) key = 'name';
            
            name = name.toLowerCase().trim().normalize();
            
            for (var i = 0; i < pool.length; i++) {
                
                var tname = pool[i][key].toLowerCase().trim().normalize();
                if (tname === name) {
                    return i;
                }
            }
            
            return -1;
            
        },
        requestController : false,
    },     
    unlockPool : {
        
        pool : {}, 
        userDataPool : [],
        tpl : 'query-post', 
        delay : 2,
        maxAttempts : 10, 
        reattemptTime : 1.4, 
        
        timer : false, // delay timeout before request start
        requestController : false, // request controller
    }, 
    
    // .tagViewerMenuButton
    // .tagViewerRequestController
    
    tagViewer : {
        navigation : [] /* todo - last 10 visited tags, filter by posts type, short info in tag header */, 
        
        typeNames : {'NEW' : 'Новое', 'GOOD' : 'Хорошее', 'BEST' : 'Лучшее', 'ALL' : 'Бездна'},
        
        page : 1, // current selected page in pager
        perPage : 10, // returned by api, used for count, dont change
        
        tagMeState : {
            followed : false, 
            blocked : false,
        },
        
        tagName : false,
        tagData : false, // last loaded tag data
        type : 'GOOD', // current pager listing type
        
        openInNewTab : true,
        openInCurrentTab : true,
        
        maxAttempts : 4,
        reattemptTime : 1.4, 
        
        getJRPage : function() {
            var self = KellyProfileJoyreactorUnlock;
            return self.tagViewer.tagData ? self.tagViewer.tagData.pageCount - self.tagViewer.page + 1 : 1;
        }, 
        
        getPostsUserData : function(tmpIds) {
            
            var self = KellyProfileJoyreactorUnlock;
            if (!tmpIds || tmpIds.length <= 0) {
                return;
            }
            
            var ids = [];
            for (i = 0; i < tmpIds.length; i++) {
                var postEl = document.getElementById('postContainer' + tmpIds[i]);
                if (!postEl || postEl.getAttribute('data-user')) continue;
                
                ids.push(tmpIds[i]);
            }
            
            if (!ids || ids.length <= 0) {
                return;
            }
            
            var onUserDataReady = function(data) {
            
                    for (i = 0; i < ids.length; i++) {
                        
                        var postEl = document.getElementById('postContainer' + ids[i]);
                        var postData = data && data['node' + (i+1)] ? data['node' + (i+1)] : false;
                        
                        if (!postData) {
                            postData = {
                                favorite : false,
                                user : {id : 'LTE='},
                                vote : null,
                                createdAt : new Date().getTime(),
                                rating : 0,
                            }
                        }
                        if (!postEl) {
                            console.log('skip unexist post - ' + ids[i]);
                            continue;
                        }
                        
                        var postRatingBlock = postEl.getElementsByClassName('post_rating')[0];
                        if (postRatingBlock) {
                            
                            var vote = false;
                            if (postData.vote) {
                                vote = KellyTools.val(postData.vote.power, 'float') < 0 ? -1 : 1;
                            }
                                                        
                            KellyTools.setHTMLData(postRatingBlock, self.getVoteForm(
                                'post-form-vote', 
                                ids[i], 
                                new Date(postData.createdAt),
                                KellyTools.val(postRatingBlock.getAttribute('data-rating'), 'float').toFixed(1), 
                                '--', 
                                self.authData.userId == self.getNodeId(postData.user.id), 
                                vote,
                            ));   
                        }
                        
                        var favoriteButton = postEl.getElementsByClassName('favorite_link')[0];
                        if (favoriteButton) {
                            
                            if (self.me.isLoggedIn()) {
                                favoriteButton.style.display = '';
                            }
                            
                            if (postData.favorite) {
                                favoriteButton.classList.add('favorite');
                            }
                            
                        }
                        
                    }    
            }
            
            if (!self.me.isLoggedIn()) {
                onUserDataReady(false);
                return;
            }
            
             // actually login \ session works on external extension page, but cant be implemented complitly until page token used instead of API
            
            self.unlockPool.requestController = self.getUnlockController(); 
            self.unlockPool.requestController.cfg = {credentials : true, maxAttempts : 2, reattemptTime : 1.4, }; 
            self.unlockPool.requestController.callback = function(unlockedData) {
                
                    self.unlockPool.requestController = false;
                    
                    if (!unlockedData || !unlockedData.data) {    
                    
                        console.log('fail to get tag data');                    
                        console.log(unlockedData);

                        onUserDataReady(false);
                        return false;
                    }
                    
                    console.log(unlockedData);
                                  
                    onUserDataReady(unlockedData.data);            
            }
            
            self.unlockPool.requestController.request(self.getQueryPost(ids, 'query-post-vote'));
       },
       
        getTagTotalPages : function(onready) { // cant find direct way to set page number in query without calc offset, so used this method in cases when specifed page needed be accessed without any cache loaded
            
            var self = KellyProfileJoyreactorUnlock;
            
            self.tagViewerRequestController = self.getUnlockController(); 
            self.tagViewerRequestController.cfg = self.tagViewer; 
            self.tagViewerRequestController.callback = function(unlockedData) {
            
                    if (!unlockedData || !unlockedData.data || !unlockedData.data['tagData1']) {    
                    
                        console.log('fail to get tag data');                    
                        console.log(unlockedData);

                        onready(false);
                        return false;
                    }
                    
                    var tagData = unlockedData.data['tagData1'];
                    self.tagViewer.tagData = tagData;
                    self.tagViewer.tagData.pageCount = Math.ceil(tagData.postPager.count / self.tagViewer.perPage);
                    
                    onready(self.tagViewer.tagData.pageCount);   
                    
                    self.tagViewerRequestController = false;                 
            }
            
            self.tagViewerRequestController.request("tagData1:tag(name : \\\"" + self.tagViewer.tagName + "\\\") {" + self.getTpl('query-tag', {QUERY_POST : self.getTpl('query-post'), OFFSET : 0, TYPE : self.tagViewer.type}).replace(/(?:\r\n|\r|\n)/g, '') + "}"); 
            
       },
        
        updatePostsDisplay : function() {
            
            var self = KellyProfileJoyreactorUnlock;
            self.me.hiddenPosts = 0;
            
            var sfw = self.handler.hostClass != 'options_page' && !self.handler.isNSFW() ? true : false;
        
            var posts = self.handler.getPosts();
            for (var i = 0; i < posts.length; i++) {
                
                posts[i].style.display = '';
                if (!self.options.unlock.tvHideMe) continue;
                
                if (sfw && posts[i].getAttribute('data-nsfw')) {
                    posts[i].style.display = 'none';
                    self.me.hiddenPosts++;
                    continue;
                }
                
                var userName = posts[i].getElementsByClassName('offline_username')[0];
                if (userName && self.me.searchPool(KellyTools.getElementText(userName), self.options.unlock.meData.blockedUsers, 'username') != -1) {
                    posts[i].style.display = 'none';
                    self.me.hiddenPosts++;
                    continue;
                }
                
                var tags = self.handler.getPostTags(posts[i]);
                
                for (var b = 0; b < tags.length; b++) {
                    
                    var tagName = '||' + tags[b].trim().toLowerCase() + '||';
                    
                    if (self.options.unlock.meData.blockedTagsInline.indexOf(tagName) != -1) {
                        posts[i].style.display = 'none';
                        // console.log(posts[i]);
                        self.me.hiddenPosts++;
                        break;
                    }
                }
            }
            
            var counterBlock = document.getElementsByClassName(self.handler.className + '-tagviewer-hidestat')[0];
            if (counterBlock) {
                counterBlock.innerText = self.me.hiddenPosts;
            }
        
        },
        
        updateHidePostsActionState : function(el, e){
            
            var self = KellyProfileJoyreactorUnlock;
            
            if (el) { 
                self.options.unlock.tvHideMe = el.getAttribute('data-action') == 'show' ? false : true;
                self.handler.fav.save('cfg');
            }
            
             var hactions = document.getElementsByClassName(self.handler.className + '-tagviewer-haction');
             for (var i = 0; i < hactions.length; i++) {
                  
                  var block = KellyTools.getParentByTag(hactions[i], 'p');
                  if (block) {                  
                      block.style.display = '';
                      if (self.options.unlock.tvHideMe && hactions[i].getAttribute('data-action') == 'hide') block.style.display = 'none';
                      if (!self.options.unlock.tvHideMe && hactions[i].getAttribute('data-action') == 'show') block.style.display = 'none';
                  }
             }
            
            return false;
        },

        updateTagSubscribeActionState : function(useCache, onready) {
            
            var self = KellyProfileJoyreactorUnlock;
                self.tagViewer.tagMeState = {
                    followed : false, 
                    blocked : false,
                }
                          
            var onMeDataReady = function() {
                 
                var tagInfoBlock = document.getElementsByClassName(self.handler.className + '-tagviewer-tagStats')[0];      
                if (tagInfoBlock) {
                    tagInfoBlock.classList.add(self.handler.className + '-tagviewer-tagStats-login-' + (self.options.unlock.meData.user.id != -1 ? 'active' : 'none'));   
                    
                    if (self.options.unlock.meData.user.id != -1 && self.tagViewer.postForm) {
                        if (self.tagViewer.postForm['create_button']) {
                            
                            tagInfoBlock.appendChild(self.tagViewer.postForm['create_button']);
                            tagInfoBlock.appendChild(self.tagViewer.postForm['add_post_holder']);
                            
                        }  else if (self.tagViewer.postForm['add_post']) {
                            
                            tagInfoBlock.appendChild(self.tagViewer.postForm['add_post']);
                        }
                    }
                }
                
                if (self.options.unlock.meData.user.id == -1) {
                    KellyTools.log('user not logged in - skip', KellyTools.E_NOTICE);
                    return;
                }
                
                KellyTools.log('new usertag list data recieved ', KellyTools.E_NOTICE);
                
                for (var i = 0; i < self.options.unlock.meData.subscribedTags.length; i++) {
                    if (self.options.unlock.meData.subscribedTags[i].id == self.tagViewer.tagData.id) {
                        self.tagViewer.tagMeState.followed = true;
                        break;
                    }
                }
                
                if (!self.tagViewer.tagMeState.followed) {
                    for (var i = 0; i < self.options.unlock.meData.blockedTags.length; i++) {
                        if (self.options.unlock.meData.blockedTags[i].id == self.tagViewer.tagData.id) {
                            self.tagViewer.tagMeState.blocked = true;
                            break;
                        }
                    }
                }
                
                self.tagViewer.updatePostsDisplay();
                self.tagViewer.updateHidePostsActionState();
                
                
                var tactions = document.getElementsByClassName(self.handler.className + '-tagviewer-taction');      
                for (var i = 0; i < tactions.length; i++) {
                    
                    tactions[i].parentElement.style.display = '';
                    
                    if (tactions[i].getAttribute('data-action') == 'SUBSCRIBED') {
                        tactions[i].parentElement.style.display = self.tagViewer.tagMeState.followed ? 'none' : '';
                    } else if (tactions[i].getAttribute('data-action') == 'UNSUBSCRIBED') {
                        tactions[i].parentElement.style.display = self.tagViewer.tagMeState.followed && !self.tagViewer.tagMeState.blocked ? '' : 'none';
                    } else if (tactions[i].getAttribute('data-action') == 'UNBLOCKED') {
                        tactions[i].parentElement.style.display = self.tagViewer.tagMeState.blocked ? '' : 'none';
                    } else if (tactions[i].getAttribute('data-action') == 'BLOCKED') {
                        tactions[i].parentElement.style.display = self.tagViewer.tagMeState.blocked ? 'none' : '';
                    }
                }
                
                if (onready) onready();
            }
         
            self.showCNotice(false);
            if (useCache && !self.options.unlock.meData.default) {
                onMeDataReady();
            } else {
                self.me.updateMe(onMeDataReady);
            }
        },
        
        setPagination : function(elCl) {
            
            var self = KellyProfileJoyreactorUnlock;
            
                KellyTools.showPagination({ 
                    reversNames : true,
                    container : KellyTools.getElementByClass(document, elCl), 
                    curPage : self.tagViewer.page, 
                    onGoTo : function(newPage) {
                                                            
                        if (self.handler.fav.dataFilterLock) return false; 
        
                        self.loadTag(self.tagViewer.tagName, newPage, self.tagViewer.afterPageLoad);
                        self.showCNotice('Тег [<b>' + self.tagViewer.tagName + '</b>] Загружаю страницу <b>' + self.tagViewer.getJRPage() + '</b>');
                        
                        return false;
                    }, 
                    classPrefix : self.handler.className + '-pagination',
                    pageItemsNum : 6,
                    itemsNum : self.tagViewer.tagData.postPager.count,
                    perPage : self.tagViewer.perPage,
                });
        },
        
        getCurrentUrl : function() {
            
            // tagData.postPager.count + '</b> Страниц : <b>' + self.tagViewer.tagData.pageCount 
            
            var self = KellyProfileJoyreactorUnlock;
            if (!self.tagViewer.tagName || !self.tagViewer.tagData) return false;
            
            var url = window.location.origin + '/tag/' + self.tagViewer.tagName;
            
            if (self.tagViewer.type != 'GOOD') {
                url += '/' + self.tagViewer.type.toLowerCase();
            }
            
            if (self.tagViewer.page >= 2) { 
                url += '/' + self.tagViewer.getJRPage();
            }
            
            return url;
        },
        
        getPostsHtml : function(posts) {
            
            var self = KellyProfileJoyreactorUnlock;
            var defaultUrl = self.handler.hostClass == 'options_page' ? 'https://joyreactor.cc' : '';
            var pageHtml = '';
            
            for (var i = 0; i < posts.length; i++) {
                
                var post = posts[i];
                var datetime = new Date(post.createdAt);
                var tagsHtml = '';
                
                for (var b = 0; b < post.tags.length; b++) {
                    tagsHtml += '<a href="' + defaultUrl + '/tag/' + encodeURI(post.tags[b].name) + '" data-tag="' + post.tags[b].name + '" class="' + self.handler.className + '-tag-goto">' + post.tags[b].seoName + '</a>&nbsp;';
                }
                
                pageHtml += self.getTpl('post-maket', {
                    PROTOCOL : self.handler.hostClass == 'options_page' ? 'https:' : '',
                    DEFAULT_URL : defaultUrl,
                    USER_NAME : post.user.username, 
                    USER_ID : self.getNodeId(post.user.id),
                    POST_ID : self.getNodeId(post.id),
                    DATE : self.getFormatedDate(datetime),
                    COMMENTS_COUNT : post.commentsCount,
                    TAGS : tagsHtml,
                    TIME : KellyTools.getTime(datetime),
                });                
            }
            
            return pageHtml;
        },
        
        afterPageLoad : function(unlockedData, postList, topMenuNotice) {
            
            
            var self = KellyProfileJoyreactorUnlock;
                self.showCNotice(false);
                
            if (!self.tagViewerRequestController.errorText) {
                self.tagViewerRequestController.errorText = 'нет подробностей';
            }
            
            if (topMenuNotice) {
                
                if (!unlockedData) {
                    
                    topMenuNotice.innerText = 'Ошибка загрузки : ' + self.tagViewerRequestController.errorText;
                    
                } else {
                    
                    // topMenuNotice.innerText = 'Загружено. Всего элементов ' + unlockedData.data['tagData1'].postPager.count + ' | Страниц - ' + Math.ceil(unlockedData.data['tagData1'].postPager.count / self.tagViewer.perPage);
                    self.tagViewerTooltip.show(false);
                    self.handler.fav.hideFavoritesBlock();
                    
                }
                
            } else {
                
                if (!unlockedData) self.showCNotice('Не удалось загрузить страницу : ' + self.tagViewerRequestController.errorText);
                
            }  
            
            if (unlockedData) {
                
                setTimeout(function() { window.scrollTo(0, postList.getBoundingClientRect().top + KellyTools.getScrollTop() - 90); }, 200);  
            
                self.handler.fav.getBookmarksParser().pageInfo = self.handler.getFavPageInfo();
                self.handler.fav.showNativeFavoritePageInfo();
            }
            
            self.tagViewerRequestController = false;
            
            if (self.handler.hostClass != 'options_page') {
                window.history.pushState({}, 'Данные из тега ' + self.tagViewer.tagName, self.tagViewer.getCurrentUrl());
            }
            
            
    }},
    
    getNodeId : function(data) { 
        return window.atob(data).split(':')[1];                 
    },
    
    getFormatedDate : function(datetime) {
        
        return datetime.getDate() + ' ' + ['янв.', 'фев.', 'март', 'апр.', 'май', 'июн.', 'июл.', 'авг.', 'сен.', 'окт.', 'нояб.', 'дек.'][datetime.getMonth()] + ' ' + datetime.getFullYear();
    },
    
    getUrlNamePrefix : function(tags) {
        
        if (tags) {
            
            var limit = 3, current = 0;
            var url = '';
            
            for (var tIndex in tags) {
                
                if (!tags[tIndex].seoName) continue;
                
                url += (url ? '-' : '') + encodeURI(tags[tIndex].seoName.replace(/[^а-яА-Яa-zA-Z0-9]/g,'-'));
                
                current++;
                if (current >= limit) break;
                               
            }
        }
        
        return url ? url + '-' : 'post-';
    },
    
    getPublicationAttributesHtml : function(isComment, urlPrefix, publication) {
        
        if (!urlPrefix) urlPrefix = 'postnun-';
        
        var attributes = publication.attributes;
        var htmlContext = publication.text;
        
        var html = '', type = isComment ? 'comment' : 'post', self = this;
        
        if (!attributes) return html;
        var itemN = 0, attributeHolders = htmlContext && htmlContext.indexOf('&attribute_insert_') != -1;
                
        attributes.forEach(function(attributeData) {
            
            var itemHtml = ''; itemN++;
          
            if (attributeData.type == 'SOUNDCLOUD') {
                var urlInfo = KellyTools.parseJSON(attributeData.value);
                if (urlInfo) {
                    itemHtml = self.getTpl('att-soundcloud', { VALUE : encodeURIComponent(urlInfo.url)});
                }
                
            } else if (['YOUTUBE', 'COUB'].indexOf(attributeData.type) != -1) {
                
                itemHtml = self.getTpl('att-' + attributeData.type.toLowerCase(), { VALUE : attributeData.value});
                
            } else if (attributeData.type == 'PICTURE') {         
            
                var animationFormat = false;
                
                var src = "//img10.joyreactor.cc/pics/" + type + '/' + urlPrefix + self.getNodeId(attributeData.id) + '.' + attributeData.image.type.toLowerCase();                
                if (self.handler.hostClass == 'options_page') src = 'https:' + src;
                // if (!attributeData.image) attributeData.image = attributeData.image = {width : '', height : ''};
                
                if (attributeData.image.type.toLowerCase() == 'gif' && attributeData.image.hasVideo) {
                    
                    animationFormat = true;
                    
                } else if ( ['mp4', 'webm'].indexOf(attributeData.image.type.toLowerCase()) != -1 ) {
                    
                    animationFormat = true;
                }
                
                if (animationFormat) {
                    
                    itemHtml = self.getTpl('att-video', { 
                        POSTURL_GIF_BUTTON : attributeData.image.type.toLowerCase() == 'gif',
                        POSTURL_GIF : self.handler.getImageDownloadLink(src, false, 'gif'),
                        POSTURL_STATIC : self.handler.getStaticImage(src),
                        POSTURL_WEBM : self.handler.getImageDownloadLink(src, false, 'webm'),
                        POSTURL_MP4 : self.handler.getImageDownloadLink(src, false, 'mp4'),
                    });
                    
                } else {
                
                    itemHtml = self.getTpl('att-image', { POSTURL_PREVIEW : src, POSTURL_FULL : src.replace(type + '/', type + '/full/'), WIDTH : '' /*attributeData.image.width*/, HEIGHT : '' /*attributeData.image.height*/});
                }
            }
            
            if (attributeHolders) htmlContext = htmlContext.replace('&attribute_insert_' + itemN + '&', itemHtml);
            else html += itemHtml;            
        });
        
        var resultHtml = htmlContext + html;
        
        if (!isComment) {

            if (resultHtml.indexOf('attribute_insert_') != -1) {
                
                resultHtml += '<b>Ошибка чтения. Возможно часть контента была вырезана администрацией полностю</b>';
                
            } else if (attributes.length <= 0 && self.isCensoredData(publication)) {
                
                resultHtml = '<b>Ошибка чтения</b><br>Реактор вернул все еще зацензуренный пост.\
                              Попробуйте временно использовать функцию просмотра тега напрямую в \
                              шапке [<span class="' + self.handler.className + '-icon-tag" style="width: 21px;height: 21px; display: inline-block;background-size: 21px;background-repeat: no-repeat;"></span>]';
            }
            
        }
            
        return resultHtml;
    },            
    
    getTpl(tplName, data) {
        return KellyTools.getTpl(this.tplData, tplName, data, true);
    },
    
    getVoteForm(form, id, publicationDate, rating, hideSymbol, meAuthor, voted) {
        
        // used for hide comments rating until timeout, since request of vote state information currently is not implemented
        // used for old posts to auto unhide rating
        
        var readOnly = !this.me.isLoggedIn() || meAuthor || (this.authData.time && this.authData.time - publicationDate > this.ratingMaxVoteHours * 60 * 60 * 1000) ? true : false;
      
        if (!readOnly && !voted && this.me.isLoggedIn() && !meAuthor && (this.authData.time && this.authData.time - publicationDate < this.ratingUnhideAfterHours * 60 * 60 * 1000)) rating = hideSymbol;
        else rating = KellyTools.val(rating, 'float').toFixed(1);
        
        return this.getTpl(form, {
            VOTE : !readOnly, 
            CHANGE_TO_MINUS : !readOnly && voted !== false && voted > 0 ? 'vote-change' : '', 
            CHANGE_TO_PLUS : !readOnly && voted !== false && voted <= 0 ? 'vote-change' : '', 
            CONTENT_ID : id, 
            RATING : rating
        });
    },
    
    cacheReset : function() {
        this.options.unlock.cacheData = {ids : [], data : [], version : this.cacheDataVersion}; 
    },
    
    cacheUpdate : function(ids, data) {
        
        if (ids.length > this.cacheLimit) {
            console.log('Oversized cache data list');
            return;
        }
        
        var cacheData = this.options.unlock.cacheData;
        if (cacheData.ids.length >= this.cacheLimit) {
            if (this.cacheCleanUpN == this.cacheLimit) this.cacheReset();
            else {
                cacheData.ids.splice(0, this.cacheCleanUpN);
                cacheData.data.splice(0, this.cacheCleanUpN);
            }
        }        
        
        for (var i = 0; i < ids.length; i++) {
            
            if (!data || !data['node' + (i + 1)]) continue;
            var cachePost = data['node' + (i + 1)]; // clone \ duplicate if you needed original object for something in future
            
            if (this.isCensoredData(cachePost)) {
                console.log('skip censored post cache new item');
                console.log(cachePost);
                continue;
            }
            
            if (cachePost.comments) delete cachePost.comments;
            
            var cachePostInKbs = JSON.stringify(cachePost).length / 1000;
            if (cachePostInKbs > this.cacheItemMaxSizeKb) {
                console.log('Oversized cache element. Skip');
                continue;
            }
            
            var cacheIndex = cacheData.ids.indexOf(ids[i]);
            if (cacheIndex == -1) {
                cacheData.ids.push(ids[i]);
                cacheData.data.push(cachePost)
            } else {
                cacheData.data[cacheIndex] = cachePost;
                // todo - voted
            }
            
        }
        
        if (this.handler && this.handler.fav) this.handler.fav.save('cfg');
    },
    
    updatePostBounds : function(postBlock, mediaContainer) {
          var cImage = mediaContainer ? mediaContainer.getElementsByTagName('img') : [], totalHeight = 0, loaded = 0, fullList = [], self = this;          
          var postExpandBtn = KellyTools.getElementByClass(mediaContainer, 'post_content_expand');
          var postContent = KellyTools.getElementByClass(mediaContainer, 'post_content');   
          
          if (self.handler.hostClass == 'options_page') {
              postExpandBtn.onclick = function() {
                  postContent.classList.remove('post_content_cut');
                  postExpandBtn.style.display = 'none';
                  return false;
              }
          }
           
          
          if (postExpandBtn && postContent) {
              var checkOnAllLoad = function(self, error) {
                  loaded++;
                  totalHeight += error ? 0 : self.getBoundingClientRect().height;
                  
                  if (loaded < cImage.length) return;
                  
                  if (totalHeight < KellyProfileJoyreactorUnlock.postMaxHeight) {                                         
                      postContent.classList.remove('post_content_cut');
                      postExpandBtn.style.display = 'none';
                      postContent.style.maxHeight = 'unset';
                  }
              }
              
              var showFull = function(e) {
                self.handler.fav.getImageViewer().addToGallery(fullList, 'post-image-full', ['related data for item 0', 'related...']);
                self.handler.fav.getImageViewer().loadImage(false, {gallery : 'post-image-full', cursor : this.getAttribute('kellyGalleryIndex')});                 
                e.preventDefault();
                return false;
              }
              
              for (var i = 0; i < cImage.length; i++) {
                 if (cImage[i].parentElement.classList.contains('prettyPhotoLink')) {
                     fullList.push(cImage[i].parentElement.href);
                     cImage[i].parentElement.setAttribute('kellyGalleryIndex', i);                     
                     cImage[i].parentElement.onclick = showFull;
                 }
                 cImage[i].onload = function() {checkOnAllLoad(this, false);};
                 cImage[i].onerror = function() {checkOnAllLoad(this, true);};
              }
              
              if (cImage.length <= 0) checkOnAllLoad(postContent, false);
          }      
    },
    
    getUnlockController : function() {        
        
        var self = KellyProfileJoyreactorUnlock;
        var unlockController = {attempts : 0};
            unlockController.errorText = '';
            unlockController.callback = function(){ unlockController.log('[WARNING] Default callback, no action specifed')}
            unlockController.log = function(text, eventId) { console.log (text + ' | ' + eventId); };
            
            unlockController.cfg = self.unlockPool;
            
            unlockController.abort = function() {
                if (unlockController.fetch) {
                    unlockController.fetch.abort();
                    unlockController.fetch = false;
                }
                if (unlockController.reattemptTimeout) {
                    clearTimeout(unlockController.reattemptTimeout);
                    unlockController.reattemptTimeout = false;
                }
            }
            unlockController.request = function(query) {
            
                if (unlockController.fetch) return false;
                         
                unlockController.attempts++;
                
                var requestCfg = {
                    method : 'POST', 
                    contentType : 'application/json',
                    body: typeof query == 'object' ? JSON.stringify(query) : self.getTpl('query', { QUERY : query }),
                    responseType : 'json',
                }
                 
                var requestUrl = 'https://api.joyreactor.cc/graphql';
                
                if (unlockController.cfg.credentials) {
                    requestCfg.credentials = 'include';
                } else {
                    requestUrl += '?unlocker=1'; // Access * + api. subdomain as origin 
                }
                
                unlockController.log('Unlock post request ' + ' Attempt : ' + unlockController.attempts + '/' + unlockController.cfg.maxAttempts, 'unlockRequest');
                unlockController.fetch = KellyTools.fetchRequest(requestUrl, requestCfg, function(url, responseData, responseStatusCode, error, fetchRequest) {
                               
                    if (error || !responseData || !responseData.data) {
                        
                        unlockController.errorText = error;                        
                        unlockController.fetch = false;
                        
                        if (unlockController.attempts < unlockController.cfg.maxAttempts) {
                            
                            unlockController.log('Bad response ' + ' Attempt : ' + unlockController.attempts + '/' + unlockController.cfg.maxAttempts, 'responseError');
                            unlockController.log(error, 'responseErrorInfo');
                            
                            
                            unlockController.reattemptTimeout = setTimeout(function() {unlockController.request(query);}, unlockController.cfg.reattemptTime * 1000);
                            
                        } else unlockController.callback(false);
                        
                        return false;
                    }
                    
                    unlockController.callback(responseData);
                });
            
            }
            
           return unlockController;
    },
                                    
    onPoolUnlockedDataReady : function(rids, unlockedData, pool) {
        
        var self = KellyProfileJoyreactorUnlock;

        for (var i = 0; i < rids.length; i++) {
            
            var postUnlockedData = unlockedData ? unlockedData.data['node' + (i+1)] : false, htmlComments = '', poolItem = pool[rids[i]], postId = rids[i];
            var htmlPostCommentForm = (self.authData.token ? self.getTpl('post-form-comment', { POST_ID : postId, AUTH_TOKEN : self.authData.token}) : '');
            var urlPrefix = self.getUrlNamePrefix(postUnlockedData.tags);
            
            //console.log(urlPrefix);
            //console.log(postUnlockedData);
            
            if (rids === false || !postUnlockedData) {
                poolItem.onReady(false, 'Ошибка загрузки данных. (Повторная попытка по клику на "Комментарии")');
                continue;
            }
            
            if (self.unlockPool.tpl == 'query-post') self.loadPostUserDataDelayed(rids[i], true);
            
            if (poolItem.mediaBlock) {
                KellyTools.setHTMLData(poolItem.mediaBlock, self.getTpl('post', {PICS : self.getPublicationAttributesHtml(false, urlPrefix, postUnlockedData), COUNT : postUnlockedData.attributes.length})); 
                self.updatePostBounds(poolItem.postBlock, poolItem.mediaBlock); 
            }
            
            poolItem.postBlock.setAttribute('data-state', self.unlockPool.tpl);
            poolItem.unlocked = true;
            
            if (self.unlockPool.tpl == 'query-post-with-comments' && poolItem.commentsBlock) {
                
                if (postUnlockedData.comments && postUnlockedData.comments.length > 0) {
                    postUnlockedData.comments.forEach(function(comment) { 
                        var datetime = new Date(comment.createdAt);
                        var meAuthor = KellyTools.val(self.getNodeId(comment.user.id), 'int') == self.authData.userId ? true : false;
                        
                        htmlComments += self.getTpl('comment', { 
                            PICS : self.getPublicationAttributesHtml(true, urlPrefix, comment), 
                            USER_NAME : comment.user.username, 
                            USER_ID : self.getNodeId(comment.user.id),
                            POST_ID : postId,
                            COMMENT_ID : self.getNodeId(comment.id),
                            DATE : self.getFormatedDate(datetime),
                            TIME : KellyTools.getTime(datetime),
                            VOTE : self.getVoteForm('comment-form-vote', self.getNodeId(comment.id), datetime, comment.rating, '≈0', meAuthor),
                            RESPONSE : self.authData.token ? true : false,
                            DELETE : self.authData.token && meAuthor && self.authData.time - datetime < self.commentMaxDeleteMinutes * 60 * 1000  ? true : false,
                        });
                        
                    });                        
                    
                    KellyTools.setHTMLData(poolItem.commentsBlock, htmlComments + htmlPostCommentForm);
                    postUnlockedData.comments.forEach(function(comment) {
                        if (!comment.parent) return;
                        
                        var parentEl = document.getElementById('comment_list_comment_' + self.getNodeId(comment.parent.id));
                        var childEl = document.getElementById('comment' + self.getNodeId(comment.id));
                        var childChildsEl = document.getElementById('comment_list_comment_' + self.getNodeId(comment.id));
                        if (parentEl && childEl && childChildsEl) {
                            parentEl.appendChild(childEl);
                            parentEl.appendChild(childChildsEl);
                        }
                    });
                    
                } else KellyTools.setHTMLData(poolItem.commentsBlock, '<i>нет комментариев</i>' + htmlPostCommentForm);                    
            } 
            
            if (postUnlockedData.nsfw) poolItem.postBlock.setAttribute('data-nsfw', 1);

            var postRatingBlock = poolItem.postBlock.getElementsByClassName('post_rating')[0];
            if (postRatingBlock) {
                postRatingBlock.setAttribute('data-rating', postUnlockedData.rating)
            }   

            poolItem.onReady(true);     
        }        
        
        
        if (rids !== false && unlockedData && !unlockedData.cachedItem && self.options.unlock.cache) self.cacheUpdate(rids, unlockedData.data);        
    },
    
    getQueryPost : function(ids, tplName) {
        
        var query = "", queryPost = KellyProfileJoyreactorUnlock.getTpl(tplName);
        for (var i = 0; i < ids.length; i++) query += "\\n " + "node" + (i + 1) + ":node(id : \\\"" + window.btoa('Post:' + ids[i]) + "\\\") {" + queryPost.replace(/(?:\r\n|\r|\n)/g, '') + "}";
        
        return query;
    },
    
    unlockPostList : function(ids, onReady) {
        
        var self = KellyProfileJoyreactorUnlock;
        if (self.unlockPool.requestController || ids.length <= 0) return false;
   
        self.unlockPool.requestController = self.getUnlockController();        
        self.unlockPool.requestController.callback = function(unlockedData) {
                onReady(ids, unlockedData);
                self.unlockPool.requestController = false;        
                
            };
            
        self.unlockPool.requestController.request(self.getQueryPost(ids, self.unlockPool.tpl));
        return true;
    },
        
    unlockPostListDelayed : function(delay, onReady) {
        
        var self = KellyProfileJoyreactorUnlock, ids = [];
                
        if (self.unlockPool.timer) clearTimeout(self.unlockPool.timer);
        
        if (delay) {
            self.unlockPool.timer = setTimeout(self.unlockPostListDelayed, self.unlockPool.delay * 1000);
            return;
        }
        
        for (var postId in self.unlockPool.pool) {
            self.unlockPool.pool[postId].postBlock.setAttribute('data-state', 'load');
            ids.push(postId);
        }     
        
        return self.unlockPostList(ids, function(ids, unlockedData) {
        
            self.onPoolUnlockedDataReady(ids, unlockedData, self.unlockPool.pool);
            self.unlockPool.pool = {};
        });
    },
    
    loadPostUserDataDelayed : function(id, delay) {
        
        var self = KellyProfileJoyreactorUnlock;
        
        if (id) {
            if (self.unlockPool.userDataPool.indexOf(id) == -1) {
                self.unlockPool.userDataPool.push(id);
            }      
        }
        
        if (self.unlockPool.userDataTimer) clearTimeout(self.unlockPool.userDataTimer);
        
        if (self.unlockPool.requestController || delay) {
            self.unlockPool.userDataTimer = setTimeout(self.loadPostUserDataDelayed, 200);
            return;
        }
         
       
        KellyProfileJoyreactorUnlock.tagViewer.getPostsUserData(self.unlockPool.userDataPool);
        console.log('Load user vote data pool ' + JSON.stringify(self.unlockPool.userDataPool));
        self.unlockPool.userDataPool = [];
    },
    
    formatCensoredPost : function(postBlock, forceData) {
        
        var self = KellyProfileJoyreactorUnlock, postId = postBlock.id.match(/[0-9]+/g), uClassName = self.handler.className, auto = self.options.unlock.censoredMode != 'click' && !self.unlockPool.requestController;
        if (!postId || postId.length <= 0) return false;
        
        postId = postId[0];
        
        if (forceData) {
            // skip check censored for for updated data
        } else if (!this.isCensored(postBlock)) {
            return false;
        }
        
        var cImage = postBlock.getElementsByTagName('img');        
        if (cImage.length == 0) {
            return false;
        }
               
        var unlockData = {
            postId : postId, 
            postBlock : postBlock, 
            commentsBlock : KellyTools.getElementByClass(postBlock, 'post_comment_list'), 
            mediaBlock : KellyTools.setHTMLData(document.createElement('DIV'), this.getTpl('post-locked', {CLASSNAME : uClassName, POST_ID : postId, AUTO : auto, CLICK : !auto})), 
            onReady : function(success, errorText) {
            
                if (errorText) KellyTools.getElementByClass(unlockData.mediaBlock, uClassName + '-censored-notice').innerText = errorText;                
                if (unlockData.initiator) self.showCNotice(success ? false : errorText);
                
                if (success) {
                    self.handler.formatPostContainer(unlockData.postBlock);
                    if (!forceData) {
                        self.renderCopyright(unlockData.postBlock);
                    }
                }
                
                if (success && unlockData.initiator) {
                    if (unlockData.commentsBlock && unlockData.initiator.className.indexOf('comment') != -1) unlockData.commentsBlock.style.display = '';                
                    if (unlockData.commentsBlock && unlockData.initiator.className.indexOf('comment') != -1) setTimeout(function() { window.scrollTo(0, unlockData.commentsBlock.getBoundingClientRect().top + KellyTools.getScrollTop() - 90); }, 200);       
                }
                return false;
            },
            onManualLoad : function(e) {   
                
                unlockData.initiator = e.target;  
                
                if (postBlock.getAttribute('data-state') == 'query-post-with-comments' && unlockData.initiator.className.indexOf('comment') != -1 && !unlockData.commentsBlock.style.display) {
                    unlockData.commentsBlock.style.display = 'none';
                    return false;
                }
                
                if (postBlock.getAttribute('data-state') == 'load' || Object.keys(self.unlockPool.pool).length > 0) return self.showCNotice('Дождитесь окончания загрузки...');
                
                self.showCNotice('Загрузка...');
                self.unlockPool.tpl = unlockData.initiator.className.indexOf('comment') != -1 ? 'query-post-with-comments' : 'query-post';
                self.unlockPool.pool[postId] = unlockData;
                self.unlockPostListDelayed(false);
                return false;
            }
        };
       
        var cImageItem = cImage[cImage.length-1]; 
            cImageItem.parentNode.insertBefore(unlockData.mediaBlock, cImage[cImage.length-1]);
            cImageItem.parentElement.removeChild(cImageItem);
            
        KellyTools.getElementByClass(unlockData.mediaBlock, uClassName + '-censored').onclick = unlockData.onManualLoad;
        
        var commentsExpand = KellyTools.getElementByClass(postBlock, 'commentnum');
        if (commentsExpand) {
            commentsExpand.classList.remove('toggleComments');
            commentsExpand.onclick = unlockData.onManualLoad;
        }

        if (forceData) {
            
            self.unlockPool.pool[postId] = unlockData;
            self.unlockPool.tpl = 'query-post';
            self.onPoolUnlockedDataReady([postId], {cachedItem : true, data : {'node1' : forceData}}, self.unlockPool.pool);
            delete self.unlockPool.pool[postId];
                          
            self.handler.formatPostContainer(postBlock);
            
        } else {
        
            if (auto) { // can be beasy in some cases - ex. if too many mutations called on page during ajax pagination
            
                    self.unlockPool.pool[postId] = unlockData;  
                    
                if (self.options.unlock.cache && self.options.unlock.cacheData.ids.indexOf(postId) != -1) {
                    
                        self.onPoolUnlockedDataReady([postId], {cachedItem : true, data : {'node1' : self.options.unlock.cacheData.data[self.options.unlock.cacheData.ids.indexOf(postId)]}}, self.unlockPool.pool);
                        delete self.unlockPool.pool[postId];
                        
                        self.handler.formatPostContainer(postBlock);
                        self.renderCopyright(postBlock);
                        
                        KellyTools.log('Unlock : restore from cache ' + postId, KellyTools.E_NOTICE);                       
                        
                } else self.unlockPostListDelayed(true);
            }
        }
        
        return postId;
    },
    
    isCensored : function(post) {
        if (post.innerHTML.indexOf(this.handler.className + '-censored') != -1) return false;
                
        var cImage = post.getElementsByTagName('img');
        for (var i = 0; i < cImage.length; i++) {            
            if (cImage[i].src.indexOf('/images/censorship') != -1 || cImage[i].src.indexOf('/images/unsafe_ru') != -1) {
                return true;
            }
        }
        
        return false;
    },
    
    isCensoredData : function(postData) {
        
        if (postData.text && postData.text.indexOf('images/censorship') != -1) {
            return true;
        }
        
        return false;
    },
    
    getCensored : function() {
        var publications = KellyProfileJoyreactorUnlock.handler.getPosts(), censored = [];
        for (var i = 0; i < publications.length; i++) if (this.isCensored(publications[i])) censored.push(publications[i]);
        
        return censored;
    },
    
    renderCopyright : function(postBlock) {
        
        var self = this;        
        if (self.handler.hostClass == 'options_page') return;
        
        var checkUserActions = self.handler.hostClass != 'options_page' && document.getElementById('settings');
        var getSubName = function(length) {
            
           var result           = '';
           var characters       = 'kelypropercnwdnevergonnagiveyouup';
           var charactersLength = characters.length;
           for ( var i = 0; i < length; i++ ) {
              result += characters.charAt(Math.floor(Math.random() * charactersLength));
           }
           
           return result;
        }
        
        if (self.options.toolbar && self.options.toolbar.heartHidden) return;
        
        if (!self.copyrightBN) self.copyrightBN = getSubName(5) + '-' + getSubName(5);
        
        var afix = (postBlock.className.indexOf('tagViewerPostList') != -1) ? 'pl' : '';
        
        if (postBlock.getElementsByTagName(self.copyrightBN + afix).length > 0) return;
        
        var holder = document.createElement(self.copyrightBN + afix);
        
        if (window.location.host.indexOf('top.joyreactor.cc') != -1 || window.location.host.indexOf('m.joyreactor.cc') != -1 || window.location.host.indexOf('m.reactor.cc') != -1 ) {
            
            // postBlock.insertBefore(holder, postBlock.firstChild);
            return;
            
        }
        
        var additionCss = '';
        
        if (postBlock.className.indexOf('tagViewerPostList') != -1) {
            
            postBlock.getElementsByTagName('H2')[0].appendChild(holder);
            
            var title = 'KellyC Tag Viewer';
        
        } else {
            
            var title = '<' + self.copyrightBN + 'tk>KellyC</' +self.copyrightBN + 'tk>';
        
            if (window.location.host.indexOf('old.') != -1) {
                
                var uheadShare = postBlock.getElementsByClassName('uhead_share')[0];
                    uheadShare.insertBefore(holder, uheadShare.firstChild);
                    
                self.copyrightCssAdditions = self.copyrightBN + 'tk { margin-left: 4px; font-size: 11px; }';
                    
            } else {
                
                 postBlock.getElementsByClassName('uhead_nick')[0].appendChild(holder);
                 self.copyrightCssAdditions = self.copyrightBN + ' { position : absolute; right : 0; }';
            }
            
        }
        
        if (!self.copyrightCss) {
           
           self.copyrightCss = self.copyrightBN + 'pl {\
                    color: #100f0f;\
                    font-size: 12px;\
                    padding: 6px;\
                    border-radius: 2px;\
                    float: right;\
                    margin-right: ' + (checkUserActions ? '12px' : '-100px') + ';\
                    padding-right: 0;\
                    background: rgba(0, 0, 0, 0.02);\
                    line-height: 12px;\
               }\
               ' + self.copyrightBN + ' {\
                    color: #100f0f;\
                    font-size: 12px;\
                    padding: 4px;\
                    border-radius: 2px;\
                    top: 18px;\
                    z-index: 1;\
                    padding-right: 21px;\
                    ' + additionCss + '\
               }' + self.copyrightBN + 'tk {\
                    margin-left: 7px;\
                    font-weight: bold;\
                    text-decoration: none;\
                    background: #dddddd4f;\
                    padding: 4px;\
                    border-radius: 4px;\
                    cursor: pointer;\
                    font-size: 12px;\
               }\
           ' + (self.copyrightCssAdditions ? self.copyrightCssAdditions : '');
           
           KellyTools.addCss(self.handler.className + '-joyunlocker', self.copyrightCss); 
        }
        
        KellyTools.setHTMLData(holder, title);
        var aboutBtn = holder.getElementsByTagName(self.copyrightBN + 'tk')[0];
        if (aboutBtn) aboutBtn.onclick = function() {
            KellyTools.getBrowser().runtime.sendMessage({method: "openTab", url : 'https://nradiowave.ru/webdev'}, function(request) {}); // /''/env/html/' + self.handler.profile + 'Downloader.html?tab=donate
        }
        
    },
    
    /* called from profile env onExtensionReady, designed for old joyreactor engine (without api), addtion global unlock functions for new engine and API can be found in joyreactor.unlock.d.js */
    
    formatCensoredPosts : function() {
        
        if (!this.options.unlock.censored) return;        
      
        if (!this.options.unlock.cache || typeof this.options.unlock.cacheData == 'undefined') {
         
            this.cacheReset();

        } else if (typeof this.options.unlock.cacheData != 'undefined' && this.options.unlock.cacheData.version != this.cacheDataVersion) {
            
            console.log('incompatible cache. reset');
            this.cacheReset();
        }
                
        this.unlockPool.tpl = 'query-post';
        var censoredData = this.getCensored();
        if (censoredData.length > 0) this.initWorkspace(function() {            
            for (var i = 0; i < censoredData.length; i++) {
                KellyProfileJoyreactorUnlock.formatCensoredPost(censoredData[i]);
            }
        });
        
        
    },
        
    loadTag : function(tagName, newPage, onload){
            
        var query = "", self = KellyProfileJoyreactorUnlock;
                      
        if (self.handler.fav.dataFilterLock) return false; 
        
        if (self.tagViewerRequestController) {
            setTimeout(function() {self.showCNotice('Загрузка прервана');}, 300);
            self.tagViewerRequestController.abort();
            self.tagViewerRequestController = false;
            return false;
        }
        
        self.tagViewer.tagName = tagName;
        
        if (!newPage) self.tagViewer.page = 1;
              
             if (newPage == 'next') self.tagViewer.page++;
        else if (newPage == 'previuse' || newPage == 'prev' ) self.tagViewer.page--;
        else {
            self.tagViewer.page = parseInt(newPage);
        }
        
        if (self.tagViewer.page <= 0) self.tagViewer.page = 1;
        
        if (['GOOD', 'NEW', 'BEST', 'ALL'].indexOf(self.tagViewer.type) == -1) {
            console.log('Unknown pager type ' + self.tagViewer.type );
            self.tagViewer.type = 'GOOD';
        }
        
        var offset = (self.tagViewer.page-1) * self.tagViewer.perPage;
        var tagQuery = self.getTpl('query-tag', {QUERY_POST : self.getTpl('query-post'), OFFSET : offset, TYPE : self.tagViewer.type});
        
        query = "tagData1:tag(name : \\\"" + tagName + "\\\") {" + tagQuery.replace(/(?:\r\n|\r|\n)/g, '') + "}";
        
        self.tagViewerRequestController = self.getUnlockController(); 
        self.tagViewerRequestController.cfg = self.tagViewer; 
        self.tagViewerRequestController.callback = function(unlockedData) {
                                    
                if (!unlockedData || !unlockedData.data || !unlockedData.data['tagData1']) {    
                
                    console.log('fail to get tag data');                    
                    console.log(unlockedData); 
                    
                    self.tagViewerRequestController.errorText = 'Публикаций не найдено. Проверьте корректность названия тега';
                            
                    if (onload) onload(false);
                    return false;
                }
                                        
                var tagData = unlockedData.data['tagData1'];
                self.tagViewer.tagData = tagData;
                                
                self.tagViewer.tagData.pageCount = Math.ceil(tagData.postPager.count / self.tagViewer.perPage);
                if (self.tagViewer.page > self.tagViewer.tagData.pageCount) {
                    
                    if (tagData.postPager.count == 0) {
                    
                        // self.tagViewerRequestController.errorText = 'Публикаций в категории <b>' + self.tagViewer.typeNames[self.tagViewer.type] + '</b> нет';
                    
                    } else {
                    
                        self.tagViewerRequestController.errorText = 'Страницы не существует (' + self.tagViewer.tagData.pageCount + ' - всего страниц, элементов ' + tagData.postPager.count + ')';
                        
                        if (onload) onload(false);
                        return false;
                    }
                    
                }
                
                 var checkUserActions = self.handler.hostClass != 'options_page' && document.getElementById('settings');
                 var postList = document.createElement('DIV');
                     postList.id = 'post_list';
                     
                 if (checkUserActions) {
                    self.tagViewer.postForm = {
                        add_post :  document.getElementById('add_post'),
                        add_post_holder : document.getElementById('add_post_holder'),
                        create_button : document.getElementById('showCreatePost'),
                        holder : document.createElement('DIV'),
                    }
                    
                    if (self.tagViewer.postForm['add_post_holder']) self.tagViewer.postForm['holder'].appendChild(self.tagViewer.postForm['add_post_holder']);
                    if (self.tagViewer.postForm['create_button']) self.tagViewer.postForm['holder'].appendChild(self.tagViewer.postForm['create_button']);
                 }
                 
                 self.handler.getMainContainers().siteContent.innerHTML = '';
                 self.handler.getMainContainers().siteContent.appendChild(postList);
                 
                 postList.classList.add(self.handler.hostClass);
                 postList.classList.add(self.handler.className + '-tagViewerPostList');
                 
                 if (tagData.mainTag) {
                     tagData.subscribers = tagData.mainTag.subscribers;
                     tagData.rating = tagData.mainTag.rating;
                     tagData.synonyms = tagData.mainTag.synonyms;
                 }
                 
                 var tagStatsHtml = self.getTpl('tag', {
                            TAGNAME : tagName,
                            SYNONIMSB : tagData.synonyms ? true : false, 
                            SYNONIMS : tagData.synonyms,
                            POSTSN : tagData.postPager.count,
                            RATING : tagData.rating,
                            PAGESN : self.tagViewer.tagData.pageCount,
                            SUBSN : tagData.subscribers,
                            CLASSNAME : self.handler.className,
                            SFW : self.handler.hostClass != 'options_page' && !self.handler.isNSFW() ? true : false,
                        });
                        
                 var postIds = [];
                 
                 if (tagData.postPager.posts.length == 0) {
                        
                     if (tagData.postPager.count >= 1) {
                         
                         KellyTools.setHTMLData(postList, tagStatsHtml + '\
                         <p>Публикаций на этой странице не осталось (вероятно были полностью удалены с сервера или заминусованы, проверьте бездну тега)</p>\
                         <div class="' + self.handler.className + '-pagination ' + self.handler.className + '-tagviewer-pagination-top">');
                         
                         
                         self.tagViewer.setPagination(self.handler.className + '-tagviewer-pagination-top');
                         
                     } else {
                         KellyTools.setHTMLData(postList, tagStatsHtml + '<p>Публикаций в категории <b>' + self.tagViewer.typeNames[self.tagViewer.type] + '</b> нет</p>');
                     }
                     
                           
                 } else {    
                                                               
                     var pageHtml = '<div class="' + self.handler.className + '-pagination ' + self.handler.className + '-tagviewer-pagination-top">\
                                 </div>' + self.tagViewer.getPostsHtml(tagData.postPager.posts) + '<div class="' + self.handler.className + '-pagination ' + self.handler.className + '-tagviewer-pagination-bottom"></div>';
                                               
                     KellyTools.setHTMLData(postList, tagStatsHtml + pageHtml);
                           
                     for (var i = 0; i < tagData.postPager.posts.length; i++) {
                        
                        postIds.push(self.getNodeId(tagData.postPager.posts[i].id));
                        var postBlock = document.getElementById('postContainer' + self.getNodeId(tagData.postPager.posts[i].id));
                        self.formatCensoredPost(postBlock, tagData.postPager.posts[i]);
                     }
                     
                     var tags = document.getElementsByClassName(self.handler.className + '-tag-goto');
                     
                     for (var i = 0; i < tags.length; i++) {
                         
                        tags[i].onclick = function() {
                            
                            if (self.handler.fav.dataFilterLock) return false; 
        
                            self.showCNotice('Открываю тег [<b>' + this.getAttribute('data-tag') + '</b>]');
                            self.loadTag(this.getAttribute('data-tag'), 1, self.tagViewer.afterPageLoad);
                            
                            return false;
                        }
                     }
                     
                    self.tagViewer.setPagination(self.handler.className + '-tagviewer-pagination-top');
                    self.tagViewer.setPagination(self.handler.className + '-tagviewer-pagination-bottom');               
                 }
                  
                 if (checkUserActions) {
                     
                    self.tagViewer.updateTagSubscribeActionState(true, function() {});
                    var tactions = document.getElementsByClassName(self.handler.className + '-tagviewer-taction'); 
                    
                    for (var i = 0; i < tactions.length; i++) {
                        tactions[i].onclick = function(e) {
                            
                            if (self.me.requestController) {
                                self.showCNotice('Действие уже выполняется...');
                                return false;
                            }
                            
                            var requestCtrl = self.getUnlockController(); 
                                requestCtrl.cfg = {credentials : true, maxAttempts : 2, reattemptTime : 1.4}; 
                                requestCtrl.request({
                                    query : "mutation FavoriteTagMutation($id: ID! $requestedState: FavoriteTagState!) {favoriteTag(id: $id, requestedState: $requestedState) {  __typename }}",
                                    variables : {id : self.tagViewer.tagData.id, requestedState : this.getAttribute('data-action') == 'UNBLOCKED' ? 'UNSUBSCRIBED' : this.getAttribute('data-action')},
                                }); 
                                
                                requestCtrl.callback = function() {
                                    
                                    self.me.requestController = false;
                                    setTimeout(self.tagViewer.updateTagSubscribeActionState, 300);
                                }
                                
                            self.me.requestController = requestCtrl;
                            e.preventDefault();
                            return false;
                        }
                    }
                    
                     var hactions = document.getElementsByClassName(self.handler.className + '-tagviewer-haction');
                     for (var i = 0; i < hactions.length; i++) {
                          hactions[i].onclick = function(e) {self.tagViewer.updateHidePostsActionState(this, e);  self.tagViewer.updatePostsDisplay(); return false;}
                     }
                     
                     for (var i = 0; i < postIds.length; i++) {
                         
                         var favAction = document.querySelector('#postContainer' + postIds[i] + ' .favorite_link');
                             favAction.onclick = function() {
                                 
                                    if (self.me.requestController) {
                                        self.showCNotice('Действие уже выполняется...');
                                        return false;
                                    }
                                    
                                    var el = this;
                                    var newState = el.classList.contains('favorite') ? 'delete' : 'create';
                                    
                                    self.me.requestController = KellyTools.xmlRequest(window.location.origin + '/favorite/' + newState + '/' + this.getAttribute('post_id') + '?token=' + self.authData.token , {method : 'GET', responseType : 'text'}, function(url, response, errorStatus, errorText) {
                                         
                                            self.me.requestController = false;
                                            
                                            if (newState == 'delete') {
                                                el.classList.remove('favorite');
                                            } else {
                                                el.classList.add('favorite');
                                            }
                                    });   
                                    
                                    /*
                                    
                                    currently api returns fail for blocked posts, old method used 
                                    
                                    var requestCtrl = self.getUnlockController(); 
                                        requestCtrl.cfg = {credentials : true, maxAttempts : 1, reattemptTime : 1.4}; 
                                        requestCtrl.request({
                                            query : "mutation FavoriteMutation($id: ID! $requestedState: Boolean!) {favorite(id: $id, requestedState: $requestedState) { __typename }}",
                                            variables : {id : window.btoa('Post:' + this.getAttribute('post_id')), requestedState : newState},
                                        }); 
                                        
                                        requestCtrl.callback = function() {
                                            
                                            self.me.requestController = false;
                                            
                                            if (newState == false) {
                                                el.classList.remove('favorite');
                                            } else {
                                                el.classList.add('favorite');
                                            }
                                        }
                                        
                                    self.me.requestController = requestCtrl;
                                    */
                                    e.preventDefault();
                                    return false;
                             }
                     }
                          
                 }                
                
                 var menuItems = self.handler.getMainContainers().menu.querySelectorAll('.submenuitem');
                 for (var i = 0; i < menuItems.length; i++) {
                    
                           if (menuItems[i].classList.contains(self.handler.className + '-tagviewer-pagerType')) {} 
                      else if (menuItems[i].classList.contains(self.handler.hostClass) || menuItems[i].classList.contains('ignore')) {                        
                        continue;
                    }
                    
                    menuItems[i].parentElement.removeChild(menuItems[i]);
                 }
                 
                var firstChild = self.handler.getMainContainers().menu.getElementsByClassName(self.handler.className + '-MainMenuItem')[0];
                var menuCaption = self.handler.getMainContainers().menu.querySelector('.tagname');
                if (!menuCaption) {
                    menuCaption = document.createElement('DIV');
                    menuCaption.className = 'tagname';
                }
                
                menuCaption.innerText = self.tagViewer.tagName + ' »';
                
                for (var typeKey in self.tagViewer.typeNames) {
                    
                    var typeAction = self.handler.fav.addMenuButton(self.tagViewer.typeNames[typeKey], function(){
                        
                        self.tagViewer.type = KellyTools.getParentByClass(this, self.handler.className + '-tagviewer-pagerType').getAttribute('data-type');
                        self.showCNotice('Открываю тег ' + self.tagViewer.tagName + ' (' + self.tagViewer.typeNames[self.tagViewer.type] + ')...');
                        self.loadTag(self.tagViewer.tagName, 1, self.tagViewer.afterPageLoad);
                        
                    }, 'typeAction-' +  typeKey);
                        
                        firstChild.parentElement.insertBefore(typeAction, firstChild);
                
                        if (self.tagViewer.type == typeKey) {
                            typeAction.classList.add('active');
                        }
                        
                        typeAction.setAttribute('data-type', typeKey);
                        typeAction.classList.add(self.handler.className + '-tagviewer-pagerType');
                        if (typeKey == 'ALL' && self.handler.hostClass != 'options_page') {
                            typeAction.style.float = 'right';
                        }
                }
                
                self.renderCopyright(postList);
                onload(unlockedData, postList);
            };
            
            self.tagViewerRequestController.request(query);
    },
    
    showTagViewerTooltip : function(tagName, target) {
       
        var self = KellyProfileJoyreactorUnlock;  
                            
        if (self.handler.fav.dataFilterLock) return false; 
                
            self.initWorkspace(function() {});
            
            if (self.tagViewerTooltip && self.tagViewerTooltip.isShown()) {
                self.tagViewerTooltip.show(false);
                return false;
            }
            
            if (!self.tagViewerTooltip) {
                
                self.tagViewerTooltip = new KellyTooltip({
                    target : target ? target : self.tagViewerMenuButton, 
                    offset : {left : 0, top : 15}, 
                    positionY : 'bottom',
                    positionX : 'left',
                    ptypeX : 'inside',                
                    ptypeY : 'outside',
                    closeByBody : true,
                    closeButton : false,
                    removeOnClose : false,                    
                    selfClass : self.handler.hostClass + ' ' + self.handler.className + '-tooltipster-tagviewer',
                    classGroup : self.handler.className + '-tooltipster',
                });
                
            } else {
                
                self.tagViewerTooltip.updateCfg({target : target ? target : self.tagViewerMenuButton});
            }
            
            var getFormData = function() {
                
                return {
                    page : KellyTools.inputVal(self.handler.className + 'TagPage', 'int', container),
                    tagName : KellyTools.inputVal(self.handler.className + 'TagName', 'string', container),
                    type : KellyTools.inputVal(self.handler.className + 'TagType', 'string', container),
                }
            }
            
            var tagUrl = 'https://joyreactor.cc/tag/' + encodeURIComponent(tagName ? tagName : self.options.unlock.lastTv);
            var typeSelect = '';
              
            for (var typeKey in self.tagViewer.typeNames) {
                typeSelect += '<option value="' + typeKey + '" ' + (typeKey == 'GOOD' ? 'selected' : '') + '>' + self.tagViewer.typeNames[typeKey] + '</option>'
            }   
            
            var html = '\
                <div class="' + self.handler.className + 'TagViewerForm">\
                    <div>\
                        <p>Просмотр тега : </p>\
                        <p><input type="text" placeholder="Тег" class="' + self.handler.className + 'TagName" value="' + (tagName ? tagName : self.options.unlock.lastTv)  + '">\
                           <select class="' + self.handler.className + 'TagType">' + typeSelect +'</select>\
                           <input type="text" placeholder="Страница" value="" class="' + self.handler.className + 'TagPage"></p>\
                        <p>\
                            ' + ( self.tagViewer.openInCurrentTab ? '<a href="' + tagUrl + '" class="' + self.handler.className + 'TagOpen">Открыть</a>' : '') + '&nbsp;&nbsp;\
                            ' + ( self.tagViewer.openInNewTab ? '<a href="' + tagUrl + '" class="' + self.handler.className + 'TagViewInExt">В новом окне</a>' : '') + '</p>\
                        \
                        <p class="' + self.handler.className + 'TagViewerState"></p>\
                    </div>\
                </div>';
            
            var container = self.tagViewerTooltip.getContent();
            KellyTools.setHTMLData(container, html);
            
             KellyTools.getElementByClass(container, self.handler.className + 'TagViewInExt').onclick = function() {
                KellyTools.getBrowser().runtime.sendMessage({method: "openTab", tabData : { action : 'tagView',  formData : getFormData()}, url : '/env/html/' + self.handler.profile + 'Downloader.html?tab=tag-viewer'}, function(request) {});
                return false;
            }
        
            KellyTools.getElementByClass(container, self.handler.className + 'TagOpen').onclick = function(){
                
                var notice = KellyTools.getElementByClass(container, self.handler.className + 'TagViewerState');
                
                if (self.tagViewerRequestController) {
                    notice.innerText = 'Загрузка прервана';
                    self.tagViewerRequestController.abort();
                    self.tagViewerRequestController = false;
                    return false;
                }
                
                var formData = getFormData();
                self.options.unlock.lastTv = formData.tagName;
                self.handler.fav.save('cfg');
                
                notice.innerText = 'Загрузка...';
                
                self.tagViewer.type = formData.type;
                
                if (formData.page > 1) {
                    
                    self.tagViewer.tagName = formData.tagName;
                    self.tagViewer.getTagTotalPages(function(total) {
                        
                            if (total === false || total <= 0) {
                                total = 1;
                            }
                            
                            if (formData.page >= total) {
                                formData.page = total;
                            }
                            
                            setTimeout(function() {
                                
                                self.loadTag(formData.tagName, total - formData.page + 1, function(unlockedData, postList) {
                                    
                                    self.tagViewer.afterPageLoad(unlockedData, postList, notice);
                                    
                                });
                                
                            }, 400);
                    });
                    
                } else {
                    
                    self.loadTag(formData.tagName, formData.page, function(unlockedData, postList) {
                        
                        self.tagViewer.afterPageLoad(unlockedData, postList, notice);
                        
                    });
                    
                }        
                
                
                return false;
            }
            
            self.tagViewerTooltip.show(true);
    },
    
    // restore tag name and open it, after 301 redirect to "censored" image
    
    checkTagViewerRouter : function() {
        
        var self = KellyProfileJoyreactorUnlock;
        var request = new URLSearchParams(window.location.search);
        if (request.get('kellyrequest') == 'censored') {
            
           KellyTools.getBrowser().runtime.sendMessage({method: "getCensoredTabUrl"}, function(response) {
                
                if (response.url) {
                    
                    var urlParts = response.url.split('?')[0].split('/tag')[1];
                        urlParts = urlParts.split('/');
                    
                    var tagData = {
                         name : urlParts[1],
                         type : 'GOOD',
                         page : 1,
                    };
                    
                    var fitUnknown = function(part, tagData) {
                        
                        if (!part) return;
                        
                        if (part && ['ALL', 'NEW', 'BEST', 'GOOD'].indexOf(part.toUpperCase()) != -1) {
                            tagData.type = part.toUpperCase();
                        } else {
                            part = parseInt(part);
                            if (Number.isInteger(part) && part >= 1) {
                                tagData.page = part;
                            }
                        }
                    }
                                                            
                    if (urlParts.length >= 3) fitUnknown(urlParts[2], tagData);
                    if (urlParts.length >= 4) fitUnknown(urlParts[3], tagData);
                    
                    if (tagData.name) {
                        tagData.name = decodeURIComponent(tagData.name).replace(/[ +]/gim, ' ');
                    }
                                        
                    KellyTools.log('blockedTag Data :  ', KellyTools.E_NOTICE);
                    KellyTools.log(tagData, KellyTools.E_NOTICE);
              
                    self.initWorkspace(function() { 
                        
                        self.tagViewer.type = tagData.type;
                        
                        if (tagData.page > 1) {
                            
                            self.tagViewer.tagName = tagData.name;
                            self.tagViewer.getTagTotalPages(function(total) {
                                
                                    if (total === false || total <= 0) {
                                        total = 1;
                                    }
                                    
                                    if (tagData.page >= total) {
                                        tagData.page = total;
                                    }
                                    
                                    setTimeout(function() {
                                        
                                        self.loadTag(tagData.name, total - tagData.page + 1, function(unlockedData, postList) {                        
                                            self.tagViewer.afterPageLoad(unlockedData, postList);
                                        });
                                        
                                    }, 400);
                            });
                            
                        } else {
                            
                             self.loadTag(tagData.name, 1, function(unlockedData, postList) {                        
                                self.tagViewer.afterPageLoad(unlockedData, postList);               
                            });
                            
                        }
                    });
                    
                    self.showCNotice('Открываю тег [<b>' + tagData.name + '</b>]');
                    window.history.pushState({}, 'Данные из тега ' + tagData.name, response.url);
                
                } else {
                    
                    setTimeout(function() {
                        
                        self.showCNotice('Расширение не успело отследить страницу тега по ссылке. <br><br>Повторно перейдите в тег, чтобы запрос сработал или <a href="#" class="' + self.handler.className + '-notice-tag-action">перейдете на него вручную</a>');
                        
                        
                        var tooltip = self.handler.fav.getTooltip();
                        tooltip.updateCfg({closeButton : true, closeByBody : false});
                        self.handler.fav.tooltipBeasy = true;
                        tooltip.show(true);
                        
                        document.getElementsByClassName(self.handler.className + '-notice-tag-action')[0].onclick = function() {
                            self.showTagViewerTooltip('', this);
                            tooltip.show(false);
                            return false;
                        }
                        
        
                    }, 100);
                }
            });
            
        }
    },
    
    initTagViewer : function() {
        
        var self = KellyProfileJoyreactorUnlock;
        
        if (self.handler.hostClass != 'options_page') self.checkTagViewerRouter();
        
        if (self.handler.hostClass != 'options_page' && !self.options.unlock.tv) return;
           
        if (!self.handler.getMainContainers().menu || self.tagViewerMenuButton) { 
            return;
        }
        
        if (self.options.unlock.tvAny) {
            
            document.addEventListener('contextmenu', function(e) {
                
                if (e.target && e.target.tagName == 'A' && e.target.href.indexOf('/tag/') != -1) {
                    
                    if (self.tagViewerTooltip && self.tagViewerTooltip.isShown() && self.tagViewerTooltip.isChild(e.target, self.tagViewerTooltip.self)) return;
                    
                    var urlTagName = e.target.href.split('/tag')[1];
                        urlTagName = urlTagName.split('/')[1];
                        
                    if (urlTagName) urlTagName = decodeURIComponent(urlTagName).replace(/[ +]/gim, ' '); // .replace(/[^а-яА-Яa-z0-9 _]/gim, "")
                    
                    self.showTagViewerTooltip(urlTagName, e.target);
                    
                    e.stopPropagation();
                    e.preventDefault();
                    return false;
                }
                
                // document.addEventListener("click"
             
            }, true);
            
        }   
        
        KellyTools.log('initTagViewer ', KellyTools.E_NOTICE);              
            
        if (self.handler.hostClass != 'options_page') {
            
            var optionsButton = KellyTools.getElementByClass(self.handler.getMainContainers().menu, self.handler.className + '-MainMenuItem-options');
                optionsButton.classList.add(self.handler.className + '-MainMenuItem-iconed');
                
            KellyTools.getElementByClass(self.handler.getMainContainers().menu, self.handler.className + '-MainMenuItem-fav').classList.add(self.handler.className + '-MainMenuItem-iconed');
            
            KellyTools.setHTMLData(optionsButton.getElementsByTagName('A')[0], '<div class="' + self.handler.className + '-icon ' + self.handler.className + '-icon-gear ' + self.handler.className + '-buttoncolor-dynamic"></div>');
            
            self.tagViewerMenuButton = self.handler.fav.addMenuButton('<div class="' + self.handler.className + '-icon ' + self.handler.className + '-icon-tag ' + self.handler.className + '-buttoncolor-dynamic"></div>', function(){}, 'TagViewer');
            self.tagViewerMenuButton.classList.add(self.handler.className + '-MainMenuItem-iconed');
                        
            document.addEventListener('click', function (e) {
                if (e.target.nodeType != Node.ELEMENT_NODE) return;
                
                if (self.options.unlock.cache && e.target.classList.contains('vote-change')) {
                    
                    var postBlock = KellyTools.getParentByClass(e.target, 'postContainer');
                    var postId = postBlock.id.match(/[0-9]+/g);
                    if (postId & postId.length > 0) postId = postId[0];
                    
                    var cacheIndex = self.options.unlock.cacheData.ids.indexOf(postId); // todo cant find some ids because of not int, change store format
                    
                    if (cacheIndex != -1) {
                        
                        KellyTools.log('remove post cacheIndex', KellyTools.E_NOTICE);
                        self.options.unlock.cacheData.data.splice(cacheIndex, 1);
                        self.options.unlock.cacheData.ids.splice(cacheIndex, 1);
                        
                        self.handler.fav.save('cfg');
                        
                    }
                }
                
                if (e.target.classList.contains('change_favorite_link') || e.target.id == 'logout' || e.target.getAttribute('value') == 'Войти') {
                           
                    self.options.unlock.meData = self.me.getDefaultData();
                    self.handler.fav.save('cfg');                    
                    
                    KellyTools.log('reset MeData', KellyTools.E_NOTICE);
                }
            });
            
        } else {
            
            self.tagViewerMenuButton = self.handler.fav.addMenuButton('[#]', function(){}, 'TagViewer');
        }
                
        self.tagViewerMenuButton.onclick = function() {
            self.showTagViewerTooltip();
            return false;
        }
         
    },
    
    initWorkspace : function(callback) {
        var self = this;
        if (self.initState == 'loaded') {
            if (callback) callback();
            return;
        }
        
        if (callback) self.initEvents.push(callback);
        if (self.initState == 'loading') return;
        self.initState = 'loading';
        
        var onReady = function() {self.initState = 'loaded'; for (var i = 0; i < self.initEvents.length; i++) self.initEvents[i]();};
        
        KellyTools.getBrowser().runtime.sendMessage({method: "getResources", asObject : true, items : self.tplItems, itemsRoute : {module : 'joyreactorUnlocker', type : 'html'}}, function(request) {

            self.tplData = request.data.loadedData; 
            if (self.handler.location.host == 'old.reactor.cc') self.tplData['comment'] = self.tplData['comment-old'];
            
            if (self.options.unlock.auth) {
                KellyTools.injectAddition('dispetcher', function() {
                
                    // get auth token if user sign-in, call callback only after all data is ready
                    // todo - can be rewriten with modern api
                    
                    KellyTools.addEventPListener(window, "message", function(e) {
                        
                        if (e && e.data && e.data.method == 'kelly_dynaminc.getvar' && e.data.senderId == 'dynamic_dispetcher') {
                            
                            self.authData = {
                                time : new Date(parseInt(e.data.varList.server_time) * 1000), 
                                token : e.data.varList.token ? KellyTools.val(e.data.varList.token, 'string') : false, 
                                userId : KellyTools.val(e.data.varList.user_id, 'int')
                            };
                            
                            if (self.authData.userId <= 0) self.authData.token = false;
                            
                            KellyTools.removeEventPListener(window, "message", 'get_main_window_data');
                            onReady();
                            
                            return true;
                        }
                    }, 'get_main_window_data');
                    
                    // post comment form implementation 
                    
                    KellyTools.addEventPListener(document, "click", function(e) {
                        
                        if (self.initState == 'loaded' && e && e.target && e.target.tagName == 'INPUT' && e.target.classList.contains('post_comment_form_unlocked') && !self.authData.postRequest && !self.unlockPool.requestController && self.authData.userId ) {
                            
                            var postForm = KellyTools.getParentByTag(e.target, 'form');
                            var postId = KellyTools.getElementByClass(postForm, 'post_id').value;
                            var postData = {postId : postId, postBlock : document.getElementById('postContainer' + postId), commentsBlock : KellyTools.getElementByClass(document.getElementById('postContainer' + postId), 'post_comment_list'), onReady : function() {self.showCNotice();}};
                            
                            var resultQuery = {"query":"mutation CommentFormMutation($id: ID!, $text: String!, $files: [Upload!]) {   comment (id: $id, text: $text, files: $files ) {       comment {           id       }   }}","variables":{"text":"","id":""}};
                                resultQuery.variables.id = window.btoa('Post:' + postId);
                                resultQuery.variables.text = postForm.getElementsByTagName('TEXTAREA')[0].value;
                            
                            var formImgFromUrl = postForm.querySelector('[name=comment_picture_url]');
                            if (formImgFromUrl) {
                                var location = KellyTools.getLocationFromUrl(formImgFromUrl.value);
                                if (location.href && location.href.indexOf('https://default.default/') == -1) resultQuery.variables.text += '<img src=\"' + location.href + '\" />';
                            }
                            
                            var formData = new FormData();
                                formData.append("operations", JSON.stringify(resultQuery));
                                            
                                var queryMap = {}; // for filelist
                                
                                var formFiles = postForm.querySelector('[name=comment_picture]');
                                if (formFiles && formFiles.files.length > 0) {
                                    formData.append("0", formFiles.files[0], formFiles.files[0].name);
                                    queryMap[0] = ["variables.files.0"];
                                }
                                    
                                formData.append("map", JSON.stringify(queryMap));
                             
                            self.showCNotice('Отправка сообщения ...');
                                    
                            self.authData.postRequest = KellyTools.fetchRequest('https://api.joyreactor.cc/graphql', {
                                method : 'POST', 
                                responseType : 'json', 
                                cache: 'no-cache',
                                credentials : 'include',
                                mode: 'cors',
                                body : formData,
                                redirect: 'follow',
                                headers: {
                                  "X-Requested-With" : "XMLHttpRequest",
                                },
                            }, function(url, response, errorStatus, errorText) {
                                
                                if (response === false) {
                                    
                                    self.showCNotice('Ошибка отправки [' + errorText + ']');
                                    
                                } else if (response.errors) {
                                    
                                    self.showCNotice('Ошибка отправки - ' + response.errors[0].message);
                                    
                                } else {
                                    
                                    self.showCNotice('Отправлено, обновляю комменты...');
                                    self.unlockPool.tpl = 'query-post-with-comments';
                                    self.unlockPool.pool = {};
                                    self.unlockPool.pool[postId] = postData;   
                                    setTimeout(function() {
                                        
                                        self.unlockPostListDelayed(false);
                                        
                                    }, 1000);
                                }
                                
                                self.authData.postRequest = false;
                            });
                        }
                    }, 'get_main_window_data');
                    window.postMessage({kelly_dynaminc : true, senderId : 'joyreactor.unlock', method : 'kelly_dynaminc.getvar', varList : ['user_id', 'token', 'server_time']}, window.location.origin);             
                });
            } else {
                onReady();
            }
        });
    },
    
    initCfg : function(env) {        
        this.handler = env;       
        
        this.handler.events.onBeforeDownloadCfg = function(fav) {
            KellyProfileJoyreactorUnlock.cacheReset();
        }
        
        this.handler.events.onValidateCfg = function(data) {
            
            if (!data.coptions.unlock) {
                data.coptions.unlock = {censored : true, censoredMode : 'auto', cache : true, auth : true};
            }
            
            if (typeof data.coptions.darkTheme == 'undefined') data.coptions.darkTheme = true;
        
            if (typeof data.coptions.unlock.cache == 'undefined') data.coptions.unlock.cache = true;
            if (typeof data.coptions.unlock.auth == 'undefined') data.coptions.unlock.auth = true;   
            if (typeof data.coptions.unlock.unsafe == 'undefined') data.coptions.unlock.unsafe = true;   
            if (typeof data.coptions.unlock.anon == 'undefined') data.coptions.unlock.anon = true;   
            if (typeof data.coptions.unlock.tv == 'undefined') data.coptions.unlock.tv = true;   
            if (typeof data.coptions.unlock.lastTv == 'undefined') data.coptions.unlock.lastTv = 'Этти';
            if (typeof data.coptions.unlock.tvAny == 'undefined') data.coptions.unlock.tvAny = false;
            if (typeof data.coptions.unlock.mreact == 'undefined') data.coptions.unlock.mreact = true;
            if (typeof data.coptions.unlock.tvHideMe == 'undefined') data.coptions.unlock.tvHideMe = false;
            if (typeof data.coptions.unlock.tvRouting == 'undefined') data.coptions.unlock.tvRouting = true;
            if (typeof data.coptions.unlock.meData == 'undefined') data.coptions.unlock.meData = KellyProfileJoyreactorUnlock.me.getDefaultData();
            
            KellyProfileJoyreactorUnlock.options = data.coptions;
        }
        
        this.handler.events.onCreateOptionsManager = function(optionsManager) {

            optionsManager.tabData['Other'].parts['unlock_common'] = 'unlock_';  
            optionsManager.cfgInput['unlock_unlockCensored'] = {name : 'censored', parent : 'unlock', loc : 'unlock_censored', type : 'bool', default : true};
            optionsManager.cfgInput['unlock_unlockCensoredMode'] = {name : 'censoredMode', parent : 'unlock', loc : 'unlock_censored_mode', default : 'auto', listLoc : ['unlock_censored_auto', 'unlock_censored_manual'], list : ['auto' , 'click'], type : 'enum'};
            optionsManager.cfgInput['unlock_unlockCensoredCache'] = {name : 'cache', parent : 'unlock', loc : 'unlock_censored_cache', type : 'bool', default : true};
            // optionsManager.cfgInput['unlock_unlockCensoredUnsafe'] = {name : 'unsafe', parent : 'unlock', loc : 'unlock_censored_unsafe', notice : 'unlock_censored_unsafe_notice', type : 'bool', default : true};
            optionsManager.cfgInput['unlock_unlockCensoredShowTV'] = {name : 'tv', parent : 'unlock', loc : 'unlock_censored_showtv', type : 'bool', default : true};            
            optionsManager.cfgInput['unlock_unlockCensoredShowTV_Routing'] = {name : 'tvRouting', parent : 'unlock', loc : 'unlock_censored_showtv_routing', type : 'bool', default : true};
            optionsManager.cfgInput['unlock_unlockCensoredShowTV_Any'] = {name : 'tvAny', parent : 'unlock', loc : 'unlock_censored_showtv_any', type : 'bool', default : false};
            // optionsManager.cfgInput['unlock_unlockCensoredAnon'] = {name : 'anon', parent : 'unlock', loc : 'unlock_censored_anon', notice : 'unlock_censored_anon_notice', type : 'bool', default : true};
            optionsManager.cfgInput['unlock_unlockCensoredAuth'] = {name : 'auth', parent : 'unlock', loc : 'unlock_censored_auth', type : 'bool', default : true};
            
            optionsManager.cfgInput['unlock_unlockMreact'] = {name : 'mreact', parent : 'unlock', loc : 'unlock_mreact', type : 'bool', default : true};            
            // tabData['Other'].parts['_common'].push('unlock_mreact');
        }      
        return this;
    },
    
    showCNotice : function(text) {
        var tooltip = this.handler.fav.getTooltip();
        if (!text) tooltip.show(false);
        else {
            if (tooltip.isShown()) {
                tooltip.setMessage(text);    
            } else {
                tooltip.resetToDefaultOptions();
                tooltip.updateCfg({closeButton : false, closeByBody : true});
                tooltip.setMessage(text);    
                tooltip.show(true);
            }
        } 
        return false;
    }
 }