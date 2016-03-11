(function () {
    'use strict';
    angular
        .module('themoviedb', [])
        .config(['MovieDbServiceProvider', function(MovieDbServiceProvider) {
          MovieDbServiceProvider.setBaseUrl('http://api.themoviedb.org/3/movie/');
          MovieDbServiceProvider.setApikey('5b066dbe85cb3d085b97a3317db319ac');
        }])
        .provider('MovieDbService', function(){
            this.baseurl= '';
            this.apikey= '';
            this.setBaseUrl = function(url){
                this.baseurl = url;
            };
            this.setApikey = function(key){
                this.apikey = key;
            };
            this.$get = function($http, $cacheFactory, $q) {
                var self = this;
                return {
                    getList : function(id, offset){
                        var promise;
                        var url = self.baseurl+id+'?api_key='+self.apikey+'&page='+offset;
                        var cache = $cacheFactory.get('$http');
                        var listCache = cache.get(url);
                        if(!listCache) {
                            promise = $http.get(url, { cache: true });
                            promise.then(function(payload){
                                listCache = payload;
                                cache.put(url, payload);
                            });
                        } else {
                            promise = $q.when(listCache);
                        }
                        return promise;
                    }
                };
            }
        })
        .directive('ngKeynavHeader', function ($timeout) {
            return {
                restrict: 'A',
                link: function (scope, ele, attr) {
                    var domItems;
                    scope.selectItemNav = function(domItems, dir){
                        if(dir === 'right'){
                            scope.domNavItems.currentItem = scope.domNavItems.currentItem.nextElementSibling;
                        } else if(dir === 'left'){
                            scope.domNavItems.currentItem = scope.domNavItems.currentItem.previousElementSibling;
                        } else if(dir === 'first'){
                            scope.domNavItems.currentItem = scope.domNavItems.firstItem;
                        } else if(dir === 'last'){
                           scope.domNavItems.currentItem = scope.domNavItems.lastItem;
                        }
                        scope.domNavItems.currentItem_id = angular.element(scope.domNavItems.currentItem).attr('id');
                        scope.domNavItems.item = angular.element(scope.domNavItems.currentItem.querySelector('a'));
                        scope.domNavItems.item.focus();
                    };
                    scope.keyboardNav = function () {
                        var switchTab = (function () {
                                return function (dir) {
                                    if ((scope.domNavItems.currentItem === scope.domNavItems.lastItem) && (dir === 'right')) {
                                        scope.selectItemNav(scope.domNavItems,'first');
                                    } else if ((scope.domNavItems.currentItem === scope.domNavItems.firstItem) && (dir === 'left')) {
                                        scope.selectItemNav(scope.domNavItems,'last');
                                    } else if (dir === 'right') {
                                        scope.selectItemNav(scope.domNavItems,'right');
                                    } else if (dir === 'left') {
                                        scope.selectItemNav(scope.domNavItems,'left');
                                    }
                                    /* remove this comment to load the content dynamically using arrow keys without hitting enter to load 
                                    scope.$apply(function () {
                                        scope.selectTab(currentItem_id);
                                    });
                                    */
                                };
                        }());
                        scope.keydownEventHandler = function (event) {
                            var keyCode = event.keyCode || event.which || event.originalEvent.keyCode;
                            if (keyCode === 39 || keyCode === 40) { // down arrow or right arrow
                                switchTab('right');
                                return false;
                            }
                            if (keyCode === 37 || keyCode === 38) { // top arrow or left arrow
                                switchTab('left');
                                return false;
                            }
                            if (keyCode === 13) {

                            }
                            return true;
                        };
                        scope.domNavItems.tabItems.on('keydown', scope.keydownEventHandler);
                    };
                    if (scope.$last === true) {
                        scope.initializeNavDom();
                        $timeout(scope.keyboardNav);
                    }
                }
            };
        })
        .directive('ngKeynavContent', function ($timeout, MovieDbService) {
            return {
                restrict: 'A',
                link: function (scope, ele, attr) {
                    scope.selectItemContent = function(domItems, dir){
                        domItems.item.removeClass('focus');
                        angular.element(domItems.currentItem).removeClass('focus');
                        if(dir === 'next'){
                            domItems.currentItem = domItems.currentItem.nextElementSibling;
                        } else if(dir === 'prev'){
                            domItems.currentItem = domItems.currentItem.previousElementSibling;
                        }
                        domItems.item = angular.element(domItems.currentItem.querySelector('.themoviedb_info a'));
                        domItems.item.addClass('focus');
                        domItems.item.focus();
                    };
                    scope.keynavContent = function () {
                        var idTerm = '',
                            switchTab = (function () {
                                return function (dir) {
                                    if (angular.element(scope.domContentItems.currentItem).hasClass('even') && (dir === 'right')) {
                                        idTerm = angular.element(scope.domContentItems.currentItem).parent().attr('id').slice(11);
                                        scope.domContentItems.tabItems.off('keydown');
                                        scope.theMovieDb.fetchNext(idTerm, scope.movieList[idTerm].offset).then(function(payload){
                                            scope.theMovieDb.storeList(idTerm, payload.data.results);
                                            //domItems.tabItems.off('keydown');
                                            if (scope.$last === true) {
                                                $timeout(function(){
                                                    scope.domContentItems.currentItem = scope.domContentItems.firstItem;
                                                });
                                            }
                                        });
                                    } else if (angular.element(scope.domContentItems.currentItem).hasClass('odd') && (dir === 'left')) {
                                        idTerm = angular.element(scope.domContentItems.currentItem).parent().attr('id').slice(11);
                                        scope.domContentItems.tabItems.off('keydown');
                                        scope.theMovieDb.fetchPrev(idTerm, scope.movieList[idTerm].offset).then(function(payload){
                                            if(payload){
                                                scope.theMovieDb.storeList(idTerm, payload.data['results']);
                                            }
                                            if (scope.$last === true) {
                                                $timeout(function(){
                                                    scope.domContentItems.currentItem = scope.domContentItems.firstItem;
                                                });
                                            }
                                        });
                                    } else if ((dir === 'right' || dir === 'down') && angular.element(scope.domContentItems.currentItem).hasClass('odd') ) {
                                        scope.selectItemContent(scope.domContentItems, 'next');
                                    } else if ((dir === 'left' || dir === 'up') && angular.element(scope.domContentItems.currentItem).hasClass('even')) {
                                        scope.selectItemContent(scope.domContentItems, 'prev');
                                    } else if((angular.element(scope.domContentItems.currentItem).hasClass('odd')) && (dir === 'up') && (scope.domContentItems.currentItem !== scope.domContentItems.firstItem)){
                                        scope.selectItemContent(scope.domContentItems, 'prev');
                                    } else if((angular.element(scope.domContentItems.currentItem).hasClass('even')) && (dir === 'down') && (scope.domContentItems.currentItem !== scope.domContentItems.lastItem)){
                                        scope.selectItemContent(scope.domContentItems, 'next');
                                    }
                                };
                            }());
                        scope.keynavContentkeydownEventHandler = function (event) {
                            var keyCode = event.keyCode || event.which || event.originalEvent.keyCode;
                            if (keyCode === 39) {
                                switchTab('right');
                                return false;
                            }
                            if (keyCode === 40) {
                                switchTab('down');
                            }
                            if (keyCode === 37) {
                                switchTab('left');
                                return false;
                            }
                            if (keyCode === 38) {
                                switchTab('up');
                            }
                            return true;
                        };
                        scope.domContentItems.tabItems.on('keydown', scope.keynavContentkeydownEventHandler);
                        scope.domContentItems.item.addClass('focus');
                        scope.domContentItems.item[0].focus();
                    };
                    if (scope.$last === true) {
                        scope.intializeContentDom();
                        scope.domContentItems.tabItems.off('keydown');
                        $timeout(scope.keynavContent);
                    }
                }
            };
        })
        .directive('theMovieDb', function ($q) {
            return {
                restrict: 'E',
                scope: {
                    menuList: "= menu"
                },
                transclude: true,
                templateUrl: 'templates/themoviedb_list.html',
                controllerAs: 'theMovieDb',
                controller: ['$scope','MovieDbService', function ($scope, MovieDbService) {
                    $scope.movieList = [] ;
                    var that = this;
                    this.storeList = function(id, data) {
                        $scope.movieList[id].data = data;
                        for(var movie in data) {
                            $scope.movieList[id].data[movie].overview = that.trimText(data[movie].overview,200);
                        }
                    };
                    this.fetchList = function(id, offset){
                        return MovieDbService.getList(id, offset).then(function(payload){
                            that.storeList(id, payload.data.results);
                            return payload;
                        });
                    };
                    this.trimText = function(text, length){
                            text = text.slice(0, length);
                            text = text.concat('...');
                            return text;
                    };
                    this.fetchNext = function(id, offset){
                        offset = parseInt(offset);
                        $scope.movieList[id].offset = parseInt(offset) + 1;
                        return this.fetchList(id, $scope.movieList[id].offset);
                    };
                    this.fetchPrev = function(id, offset){
                        var deferred = $q.defer();
                        offset = parseInt(offset);
                        if(offset > 1){
                            $scope.movieList[id].offset = offset - 1;
                            return this.fetchList(id, $scope.movieList[id].offset);
                        } else {
                            deferred.resolve();
                        }
                        return deferred.promise;
                    };
                }],
                link: function(scope, elem, attrs) {
                    scope.currentTab = {};
                    for(var menu in scope.menuList){
                        scope.movieList[scope.menuList[menu].id] = {};
                        scope.movieList[scope.menuList[menu].id].offset = 1; 
                        if(scope.menuList[menu].active) {
                            scope.currentTab.id = scope.menuList[menu].id;
                            scope.theMovieDb.fetchList(scope.currentTab.id, 1);
                        }
                    }
                    scope.selectTab = function(tabId) {
                        scope.currentTab.id = tabId;
                        scope.theMovieDb.fetchList(tabId, 1);
                        scope.domContentItems.currentItem = scope.domContentItems.firstItem;
                    };
                    scope.initializeNavDom = function(){
                        scope.domNavItems = {
                            'tabItems':elem.find('#themoviedb_wrapper ul')
                        };
                        scope.domNavItems.firstItem = scope.domNavItems.tabItems[0].firstElementChild;
                        scope.domNavItems.lastItem = scope.domNavItems.tabItems[0].lastElementChild;
                        scope.domNavItems.currentItem = scope.domNavItems.tabItems[0].querySelector('li.active');
                        scope.domNavItems.currentItem_id = angular.element(scope.domNavItems.currentItem).attr('id');
                        scope.domNavItems.item = {};
                    };
                    scope.intializeContentDom = function(){
                        scope.domContentItems = {
                            'tabItems' : elem.find('#themoviedb_results')
                        };
                        scope.domContentItems.items = scope.domContentItems.tabItems[0].querySelectorAll('.active .themoviedb_item');
                        scope.domContentItems.firstItem = scope.domContentItems.items[0];
                        scope.domContentItems.currentItem = scope.domContentItems.firstItem;
                        scope.domContentItems.lastItem = scope.domContentItems.items[scope.domContentItems.items.length-1];
                        scope.domContentItems.item = angular.element(scope.domContentItems.currentItem.querySelector('.themoviedb_info a'));
                        scope.domContentItems.item.addClass('focus');
                        scope.domContentItems.item[0].focus();
                    };
                },
            };
        });
}());