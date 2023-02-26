var KellyProfileJoyreactorUnlock = {
    
    // this.handler = env profile object
    
    postMaxHeight : 2000, cacheLimit : 400, cacheCleanUpN : 100, cacheItemMaxSizeKb : 15, ratingUnhideAfterHours : 48, ratingMaxVoteHours : 48, commentMaxDeleteMinutes : 10, // unhide rating for comments older > 24 hour
    tplItems : ['att-image', 'att-youtube', 'att-coub', 'query', 'query-post', 'query-tag', 'query-post-with-comments', 'post', 'post-maket', 'post-locked', 'comment', 'comment-old', 'post-form-comment', 'post-form-vote', 'comment-form-vote'],    
    authData : {token : false}, initEvents : [],    
    unlockPool : {
        
        pool : {}, 
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
        
        tagData : false, // last loaded tag data
        type : 'GOOD', // current pager listing type
        
        openInNewTab : true,
        openInCurrentTab : true,
        
        maxAttempts : 4,
        reattemptTime : 1.4, 
        
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
            
            if (unlockedData) setTimeout(function() { window.scrollTo(0, postList.getBoundingClientRect().top + KellyTools.getScrollTop() - 90); }, 200);  
            self.tagViewerRequestController = false;
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
    
    getPublicationAttributesHtml : function(data, htmlContext, isComment, urlPrefix) {
        
        if (!urlPrefix) urlPrefix = 'postnun-';
        
        var html = '', type = isComment ? 'comment' : 'post', self = this;
        if (!data) return html;
        
        var itemN = 0, attributeHolders = htmlContext && htmlContext.indexOf('&attribute_insert_') != -1;
                
        data.forEach(function(attributeData) {
            var itemHtml = ''; itemN++;
            if (attributeData.type != 'PICTURE') {
                if (['YOUTUBE', 'COUB'].indexOf(attributeData.type) != -1)  itemHtml = self.getTpl('att-' + attributeData.type.toLowerCase(), { VALUE : attributeData.value});
            } else {     
            
                var src = "//img10.joyreactor.cc/pics/" + type + '/' + urlPrefix + self.getNodeId(attributeData.id) + '.' + attributeData.image.type.toLowerCase();                
                if (self.handler.hostClass == 'options_page') src = 'https:' + src;
                // if (!attributeData.image) attributeData.image = attributeData.image = {width : '', height : ''};
                
                itemHtml = self.getTpl('att-image', { POSTURL_PREVIEW : src, POSTURL_FULL : src.replace(type + '/', type + '/full/'), WIDTH : '' /*attributeData.image.width*/, HEIGHT : '' /*attributeData.image.height*/});
            }
            
            if (attributeHolders) htmlContext = htmlContext.replace('&attribute_insert_' + itemN + '&', itemHtml);
            else html += itemHtml;            
        });
        
        var resultHtml = htmlContext + html;
        
        if (resultHtml.indexOf('attribute_insert_') != -1) {
            
            resultHtml += '<b>Ошибка чтения. Возможно часть контента была вырезана администрацией полностю :(</b>';
        }
            
        return resultHtml;
    },            
    
    getTpl(tplName, data) {
        return KellyTools.getTpl(this.tplData, tplName, data, true);
    },
    
    getVoteForm(form, id, publicationDate, rating, hideSymbol, meAuthor) {
        
        var readOnly = !this.authData.token || !this.authData.time || meAuthor || this.authData.time - publicationDate > this.ratingMaxVoteHours * 60 * 60 * 1000 ? true : false;
      
        if (!readOnly && this.authData.token && this.authData.time && !meAuthor && this.authData.time - publicationDate < this.ratingUnhideAfterHours * 60 * 60 * 1000) rating = hideSymbol;
        else rating = KellyTools.val(rating, 'float').toFixed(1);
        
        return this.getTpl(form, {VOTE : !readOnly, CONTENT_ID : id, RATING : rating});
    },
    
    cacheReset : function() {
        this.options.unlock.cacheData = {ids : [], data : []}; 
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
                
                unlockController.log('Unlock post request ' + ' Attempt : ' + unlockController.attempts + '/' + unlockController.cfg.maxAttempts, 'unlockRequest');
                unlockController.fetch = KellyTools.fetchRequest('https://api.joyreactor.cc/graphql?unlocker=1', {
                    method : 'POST', 
                    headers : {'Content-Type': 'application/json'},
                    body: self.getTpl('query', { QUERY : query }),
                    responseType : 'json',
                }, function(url, responseData, responseStatusCode, error, fetchRequest) {
                               
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
            
            if (poolItem.mediaBlock) {
                KellyTools.setHTMLData(poolItem.mediaBlock, self.getTpl('post', {PICS : self.getPublicationAttributesHtml(postUnlockedData.attributes, postUnlockedData.text, false, urlPrefix), COUNT : postUnlockedData.attributes.length})); 
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
                            PICS : self.getPublicationAttributesHtml(comment.attributes, comment.text, true, urlPrefix), 
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
            
            if (poolItem.ratingBlock) {
                KellyTools.setHTMLData(poolItem.ratingBlock, self.getVoteForm('post-form-vote', postId, new Date(postUnlockedData.createdAt), postUnlockedData.rating, '--'));
                poolItem.ratingBlock.style.display = '';
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
    
    formatCensoredPost : function(postBlock, forceData) {
        
        var self = KellyProfileJoyreactorUnlock, postId = postBlock.id.match(/[0-9]+/g), uClassName = self.handler.className, auto = self.options.unlock.censoredMode != 'click' && !self.unlockPool.requestController;
        if (postId.length <= 0) return false;
        
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
            ratingBlock : KellyTools.getElementByClass(postBlock, 'post_rating'), 
            commentsBlock : KellyTools.getElementByClass(postBlock, 'post_comment_list'), 
            mediaBlock : KellyTools.setHTMLData(document.createElement('DIV'), this.getTpl('post-locked', {CLASSNAME : uClassName, POST_ID : postId, AUTO : auto, CLICK : !auto})), 
            onReady : function(success, errorText) {
            
                if (errorText) KellyTools.getElementByClass(unlockData.mediaBlock, uClassName + '-censored-notice').innerText = errorText;                
                if (unlockData.initiator) self.showCNotice(success ? false : errorText);
                
                if (success) {
                    self.handler.formatPostContainer(unlockData.postBlock);
                    if (!forceData) self.renderCopyright(unlockData.postBlock);
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
        
        if (self.options.unlock.auth && unlockData.ratingBlock) unlockData.ratingBlock.style.display = 'none'; 
        
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
        
        return true;
    },
    
    isCensored : function(post) {
        if (post.innerHTML.indexOf(this.handler.className + '-censored') != -1) return false;
        if (post.innerHTML.indexOf('/images/censorship') != -1 || post.innerHTML.indexOf('/images/unsafe_ru') != -1) return true;
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
            
            var title = 'KellyC © nradiowave <' + self.copyrightBN + 'tk>Сказать спасибо</' +self.copyrightBN + 'tk>';
        
        } else {
            
            var title = 'разблокировано через расширение <b>KellyC</b> <' + self.copyrightBN + 'tk>Сказать спасибо</' +self.copyrightBN + 'tk>';
        
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
                    padding: 4px;\
                    border-radius: 2px;\
                    float : right;\
                    padding-right : 0;\
               }' + self.copyrightBN + ' {\
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
                    background: #ff87074f;\
                    padding: 4px;\
                    border-radius: 4px;\
                    cursor: pointer;\
                    font-size: 12px;\
               }\
           ' + (self.copyrightCssAdditions ? self.copyrightCssAdditions : '');
           
           KellyTools.addCss(self.handler.className + '-joyunlocker', self.copyrightCss); 
        }
        
        KellyTools.setHTMLData(holder, title);
        holder.getElementsByTagName(self.copyrightBN + 'tk')[0].onclick = function() {
            KellyTools.getBrowser().runtime.sendMessage({method: "openTab", url : 'https://nradiowave.ru/webdev'}, function(request) {}); // /''/env/html/' + self.handler.profile + 'Downloader.html?tab=donate
        }
        
    },
    
    /* called from profile env onExtensionReady, designed for old joyreactor engine (without api), addtion global unlock functions for new engine and API can be found in joyreactor.unlock.d.js */
    
    formatCensoredPosts : function() {
        
        if (!this.options.unlock.censored) return;        
        if (!this.options.unlock.cache || typeof this.options.unlock.cacheData == 'undefined') this.cacheReset();
        
        this.unlockPool.tpl = 'query-post';
        var censoredData = this.getCensored();
        if (censoredData.length > 0) this.initWorkspace(function() {
            for (var i = 0; i < censoredData.length; i++) KellyProfileJoyreactorUnlock.formatCensoredPost(censoredData[i]);
        });
        
        
    },
    
    loadTag : function(tagName, newPage, onload){
            
        var query = "", self = KellyProfileJoyreactorUnlock;
           
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
        var addPagination = function(elCl) {
            
                KellyTools.showPagination({ 
                    container : KellyTools.getElementByClass(document, elCl), 
                    curPage : self.tagViewer.page, 
                    onGoTo : function(newPage) {
                        self.loadTag(tagName, newPage, self.tagViewer.afterPageLoad);
                        self.showCNotice('Тег [<b>' + self.tagViewer.tagName + '</b>] Загружаю страницу <b>' + self.tagViewer.page + '</b>');
                        return false;
                    }, 
                    classPrefix : self.handler.className + '-pagination',
                    pageItemsNum : 10,
                    itemsNum : self.tagViewer.tagData.postPager.count,
                    perPage : self.tagViewer.perPage,
                });
        }
        
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
                if (newPage > self.tagViewer.tagData.pageCount) {
                    
                    if (tagData.postPager.count == 0) {
                    
                        // self.tagViewerRequestController.errorText = 'Публикаций в категории <b>' + self.tagViewer.typeNames[self.tagViewer.type] + '</b> нет';
                    
                    } else {
                    
                        self.tagViewerRequestController.errorText = 'Страницы не существует (' + self.tagViewer.tagData.pageCount + ' - всего страниц, элементов ' + tagData.postPager.count + ')';
                        
                        if (onload) onload(false);
                        return false;
                    }
                    
                }
             
                 var postList = document.createElement('DIV');
                     postList.id = 'post_list';
                     
                 self.handler.getMainContainers().siteContent.innerHTML = '';
                 self.handler.getMainContainers().siteContent.appendChild(postList);
                 postList.classList.add(self.handler.hostClass);
                 postList.classList.add(self.handler.className + '-tagViewerPostList');
                 
                 var tagStatsHtml = '<div class="' + self.handler.className + '-tagviewer-tagStats">\
                                    <h2>' + tagName + '</h2>\
                                    <p><span><b>Тег отображается без дополнительной фильтрации NSFW и исключений</b></p>\
                                    <p><span>Всего постов : <b>' + tagData.postPager.count + '</b> Страниц : <b>' + self.tagViewer.tagData.pageCount + '</b></p>\
                                    <p class="' + self.handler.className + '-tagviewer-pagerTypes">\
                                        <a class="' + self.handler.className + '-tagviewer-pagerType ' + (self.tagViewer.type == 'BEST' ? 'selected' : '') + '" href="#" data-type="BEST">Лучшее</a>\
                                        <a class="' + self.handler.className + '-tagviewer-pagerType ' + (self.tagViewer.type == 'GOOD' ? 'selected' : '') + '" href="#" data-type="GOOD">Хорошее</a>\
                                        <a class="' + self.handler.className + '-tagviewer-pagerType ' + (self.tagViewer.type == 'NEW' ? 'selected' : '') + '" href="#" data-type="NEW">Новое</a>\
                                        <a class="' + self.handler.className + '-tagviewer-pagerType ' + (self.tagViewer.type == 'ALL' ? 'selected' : '') + '" href="#" data-type="ALL">Бездна</a>\
                                     </p>\
                                </div>';
                           

                 if (tagData.postPager.posts.length == 0) {
                          
                     KellyTools.setHTMLData(postList, tagStatsHtml + '<p>Публикаций в категории <b>' + self.tagViewer.typeNames[self.tagViewer.type] + '</b> нет</p>');
                           
                 } else {    
                 
                    var pageHtml = ''; var defaultUrl = self.handler.hostClass == 'options_page' ? 'https://joyreactor.cc' : '';
                    for (var i = 0; i < tagData.postPager.posts.length; i++) {
                        
                        var post = tagData.postPager.posts[i];
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
                                 
                     pageHtml = '<div class="' + self.handler.className + '-pagination ' + self.handler.className + '-tagviewer-pagination-top"></div>' + pageHtml + '<div class="' + self.handler.className + '-pagination ' + self.handler.className + '-tagviewer-pagination-bottom"></div>';
                                                
                     KellyTools.setHTMLData(postList, tagStatsHtml + pageHtml);
                           
                     for (var i = 0; i < tagData.postPager.posts.length; i++) {
                        
                        var postBlock = document.getElementById('postContainer' + self.getNodeId(tagData.postPager.posts[i].id));
                        self.formatCensoredPost(postBlock, tagData.postPager.posts[i]);
                     }
                     
                     var tags = document.getElementsByClassName(self.handler.className + '-tag-goto');
                     for (var i = 0; i < tags.length; i++) {
                        tags[i].onclick = function() {
                            self.showCNotice('Открываю тег [<b>' + this.getAttribute('data-tag') + '</b>]');
                            self.loadTag(this.getAttribute('data-tag'), 1, self.tagViewer.afterPageLoad);
                            return false;
                        }
                     }
                     
                    addPagination(self.handler.className + '-tagviewer-pagination-top');
                    addPagination(self.handler.className + '-tagviewer-pagination-bottom');
               
                 }
      
                 var types = document.getElementsByClassName(self.handler.className + '-tagviewer-pagerType');
                 for (var i = 0; i < types.length; i++) {
                    types[i].onclick = function() {
                        self.tagViewer.type = this.getAttribute('data-type');
                        self.showCNotice('Открываю тег ' + self.tagViewer.tagName + ' (' + self.tagViewer.typeNames[self.tagViewer.type] + ')...');
                        self.loadTag(self.tagViewer.tagName, 1, self.tagViewer.afterPageLoad);
                        return false;
                    }
                 }
                 
                self.renderCopyright(postList);
                onload(unlockedData, postList);
                
                
            };
            self.tagViewerRequestController.request(query);
    },
    
    showTagViewerTooltip : function(tagName, target) {
        
        var self = KellyProfileJoyreactorUnlock;  
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
                
                self.loadTag(formData.tagName, formData.page, function(unlockedData, postList) {
                    
                    self.tagViewer.afterPageLoad(unlockedData, postList, notice);
                    
                });
                
                return false;
            }
            
            self.tagViewerTooltip.show(true);
    },
    
    initTagViewer : function() {
        
        var self = KellyProfileJoyreactorUnlock;  
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
        if (self.initState == 'loaded') return callback();
        
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
                    
                    KellyTools.addEventPListener(window, "message", function(e) {
                        if (e && e.data && e.data.method == 'kelly_dynaminc.getvar' && e.data.senderId == 'dynamic_dispetcher') {
                            self.authData = {time : new Date(parseInt(e.data.varList.server_time) * 1000), token : e.data.varList.token ? KellyTools.val(e.data.varList.token, 'string') : false, userId : KellyTools.val(e.data.varList.user_id, 'int')};
                            if (self.authData.userId <= 0) self.authData.token = false;
                            KellyTools.removeEventPListener(window, "message", 'get_main_window_data');
                            onReady();
                            return true;
                        }
                    }, 'get_main_window_data');
                    
                    // post comment form implementation 
                    
                    KellyTools.addEventPListener(document, "click", function(e) {
                        
                        if (self.initState == 'loaded' && e && e.target && e.target.tagName == 'INPUT' && e.target.classList.contains('post_comment_form_unlocked') && !self.authData.postRequest && !self.unlockPool.requestController && self.authData.token ) {
                            
                            var postForm = KellyTools.getParentByTag(e.target, 'form');
                            var postId = KellyTools.getElementByClass(postForm, 'post_id').value;
                            var postData = {postId : postId, postBlock : document.getElementById('postContainer' + postId), commentsBlock : KellyTools.getElementByClass(document.getElementById('postContainer' + postId), 'post_comment_list'), onReady : function() {self.showCNotice();}};

                            self.authData.postRequest = KellyTools.xmlRequest(postForm.action, {method : 'POST', responseType : 'json', formData : new FormData(postForm)}, function(url, response, errorStatus, errorText) {
                               
                                if (response === false) {
                                    
                                    self.showCNotice('Ошибка отправки [' + errorText + ']');
                                    
                                } else if (response.error !== 'ok') {
                                    
                                    self.showCNotice(response.error);
                                    
                                } else {
                                    
                                    self.showCNotice('Отправлено, обновляю комменты...');
                                    self.unlockPool.tpl = 'query-post-with-comments';
                                    self.unlockPool.pool = {};
                                    self.unlockPool.pool[postId] = postData;                                
                                    self.unlockPostListDelayed(false);
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
            
            KellyProfileJoyreactorUnlock.options = data.coptions;
        }
        
        this.handler.events.onCreateOptionsManager = function(optionsManager) {

            optionsManager.tabData['Other'].parts['unlock_common'] = 'unlock_';  
            optionsManager.cfgInput['unlock_unlockCensored'] = {name : 'censored', parent : 'unlock', loc : 'unlock_censored', type : 'bool', default : true};
            optionsManager.cfgInput['unlock_unlockCensoredMode'] = {name : 'censoredMode', parent : 'unlock', loc : 'unlock_censored_mode', default : 'auto', listLoc : ['unlock_censored_auto', 'unlock_censored_manual'], list : ['auto' , 'click'], type : 'enum'};
            optionsManager.cfgInput['unlock_unlockCensoredCache'] = {name : 'cache', parent : 'unlock', loc : 'unlock_censored_cache', type : 'bool', default : true};
            // optionsManager.cfgInput['unlock_unlockCensoredUnsafe'] = {name : 'unsafe', parent : 'unlock', loc : 'unlock_censored_unsafe', notice : 'unlock_censored_unsafe_notice', type : 'bool', default : true};
            optionsManager.cfgInput['unlock_unlockCensoredShowTV'] = {name : 'tv', parent : 'unlock', loc : 'unlock_censored_showtv', type : 'bool', default : true};            
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