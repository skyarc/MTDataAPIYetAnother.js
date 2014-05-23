$(function(){
    
    var api = new MT.MTDataAPIYetAnother({
        //baseUrl:"http://192.168.56.101:5000/mt-data-api.cgi",
        //baseUrl:"http://127.0.0.1:5000",
        baseUrl:"/cgi-bin/mt/mt-data-api.cgi",
        internalLimit: 1000
    });
    
    var routes = {
        entry:      constructEntryPage,
        month:      constructMunthlyArchivePage,
        category:   constructCategoryPage,
        tag:        constructTagPage
    };
    
    var dispachAjaxPage = function() {
        var params = parseHashQuery();
        var type = params.shift();
        (routes[type] || constructIndexPage).apply(this, params);
        return false;
    };
    
    dispachAjaxPage();
    $(window).on("hashchange", dispachAjaxPage);
    
    /**
     * ブログタイトルを表示
     */
    api.getBlog(1, {fields: "name,url"}, function(res) {
        $("h1 a").html(res.name).attr("href", res.url);
    });
    
    /**
     * タグクラウドを作成
     */
    api.listTags(1, {maxRank:6, monthLimit:12}, function(res) {
        if (res.error || res.items.length === 0) {
            return;
        }
        var appender = generateAppender($(".tagCloudContainer"));
        for (idx in res.items) {
            var item = res.items[idx];
            var text = sprintf("%", item.name);
            var li = appender(text, sprintf("#!/tag/%", encodeURI(item.name)));
            li.attr("class", "rank-" + item.rank);
        }
    });
    
    /**
     * 最近の記事一覧を作成
     */
    api.listEntries(1, {limit: 5, fields: 'id,title'}, function(res){
        if (res.error || res.items.length === 0) {
            return;
        }
        var appender = generateAppender($(".recentEntriesContainer"));
        for (idx in res.items) {
            var item = res.items[idx];
            var text = item.title;
            appender(text, window.location.pathname + '#!/entry/' + item.id);
        }
    });
    
    /**
     * 月別アーカイブを作成
     */
    api.listMonthlyEntryCounts(1, {monthLimit:6}, function(res){
        if (res.error || res.items.length === 0) {
            return;
        }
        var appender = generateAppender($(".monthlyArchiveContainer"));
        for (idx in res.items) {
            var item = res.items[idx];
            var text = sprintf("%年%月(%)", item.year, item.month, item.totalResults);
            appender(text, sprintf("#!/month/%/%", item.year, item.month));
        }
    });
    
    /**
     * カテゴリー一覧を作成
     */
    api.listCategoryStats(1, function(res) {
        if (res.error || res.items.length === 0) {
            return;
        }
        var appender = generateAppender($(".categoryContainer"));
        for (idx in res.items) {
            var item = res.items[idx];
            var text = sprintf("%(%)", item.label, item.totalResults);
            appender(text, sprintf("#!/category/%", item.label));
        }
    });
    
    return;
    
    /**
     * prop2にデータを追加
     * @param {Object} cont
     * @param {Array} array
     * @param {String} type
     */
    function prop2append(cont, array, type) {
        if (array.length) {
            cont.show().find(".data").html(array.map(function(v){
                return sprintf('<a href="#!/%/%">%</a>', type, v, v);
            }).join(', '));
        }
    };
    
    /**
     * エントリーページを生成
     * @param {Number} id
     */
    function constructEntryPage(id) {
        
        var cont = $(".layouts > .entryContainer").clone();
        
        api.getEntry(1, id, function(res) {
            if (res.error) {
                return;
            }
            assignEntryData(cont, res);
            swapMain(cont);
        });
        
        return false;
    }
    
    /**
     * インデックスページを生成
     */
    function constructIndexPage() {
        
        var pageContainer = $(".layouts > .pageContainer.type1").clone();
        var listContainer = pageContainer.find(".entryListContainer");
        var entryContainer = $(".layouts > .entryContainer").clone();
        
        api.listEntries(1, {limit:10}, function(res){
            if (res.error || res.items.length === 0) {
                return;
            }
            for (idx in res.items) {
                var item = res.items[idx];
                var cont = entryContainer.clone();
                var date = new Date(item.date);
                assignEntryData(cont, item);
                cont.appendTo(listContainer);
            }
        });
        
        var description = "このブログは、MovableTypeのDataAPI経由のデータをもとにページの全てを生成することを目指す実験用ブログです。";
        pageContainer.find(".pageDescription").html(description);
        swapMain(pageContainer);
    }
    
    /**
     * 月別一覧ページ
     * @param {Number} year
     * @param {Number} month
     */
    function constructMunthlyArchivePage(year, month) {
        
        var pageContainer = $(".layouts > .pageContainer.type2").clone();
        var listContainer = pageContainer.find(".entryListContainer");
        var entryContainer = $(".layouts > .entryContainer").clone();
        
        api.listEntriesByMonth(1, year, month, {limit:20}, function(res){
            if (res.error || res.items.length === 0) {
                return;
            }
            for (idx in res.items) {
                var item = res.items[idx];
                var cont = entryContainer.clone();
                var date = new Date(item.date);
                assignEntryData(cont, item);
                cont.appendTo(listContainer);
            }
        });
        
        pageContainer.find("h2").html(sprintf("%年%月の記事一覧", year, month));
        swapMain(pageContainer);
    }
    
    /**
     * カテゴリー別一覧ページ
     * @param {String} basename
     */
    function constructCategoryPage(label) {
        
        var pageContainer = $(".layouts > .pageContainer.type2").clone();
        var listContainer = pageContainer.find(".entryListContainer");
        var entryContainer = $(".layouts > .entryContainer").clone();
        
        api.listEntries(1, {category:label, limit:10}, function(res){
            if (res.error || res.items.length === 0) {
                return;
            }
            for (idx in res.items) {
                var item = res.items[idx];
                var cont = entryContainer.clone();
                assignEntryData(cont, item);
                cont.appendTo(listContainer);
            }
        });
        
        pageContainer.find("h2").html(sprintf("「%」カテゴリーの記事一覧", label));
        swapMain(pageContainer);
    }
    
    /**
     * タグ別一覧ページ
     * @param {String} tag
     */
    function constructTagPage(tag) {
        
        var pageContainer = $(".layouts > .pageContainer.type2").clone();
        var listContainer = pageContainer.find(".entryListContainer");
        var entryContainer = $(".layouts > .entryContainer").clone();
        
        api.listEntries(1, {tag:tag, limit:10}, function(res){
            if (res.error || res.items.length === 0) {
                return;
            }
            for (idx in res.items) {
                var item = res.items[idx];
                var cont = entryContainer.clone();
                assignEntryData(cont, item);
                cont.appendTo(listContainer);
            }
        });
        
        pageContainer.find("h2").html(sprintf("「%」タグの記事一覧", tag));
        swapMain(pageContainer);
    }
    
    /**
     * mainコンテナーの内容を差し替え
     * @param {Object} newContent
     */
    function swapMain(newContent) {
        var main = $(".main");
        var current = main.children("*");
        var fadeIn = function(){
            newContent.hide();
            main.html(newContent.fadeIn("fast"));
        };
        current.length ? current.fadeOut("fast", fadeIn) : fadeIn();
    }
    
    /**
     * エントリーのデータを各クラスに配備
     * @param {Object} cont Entry container
     * @param {Object} item An item
     */
    function assignEntryData(cont, item) {
        var date = new Date(item.date);
        cont.find(".title").html(item.title);
        cont.find(".body").html(item.excerpt);
        cont.find(".authInfo .data").html(sprintf(
            "%(%年%月%日 %:%)",
            item.author.displayName,
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            pading(date.getHours()),
            pading(date.getMinutes())
        ));
        cont.find(".trackbacks .data").html(item.trackbacks.length);
        cont.find(".comments .data").html(item.comments.length);
        prop2append(cont.find(".categories"), item.categories, 'category');
        prop2append(cont.find(".tags"), item.tags, 'tag');
    }
    
    /**
     * 汎用のリスト要素追加クロージャー
     * @param {Object} cont
     */
    function generateAppender(cont) {
        var ul = $(".layouts .linkListContainer").clone().appendTo(cont);
        cont.show();
        var tmpl = ul.find("li").remove();
        return function (text, href) {
            var li = tmpl.clone();
            li.find("a").html(text).attr('href', href);
            li.appendTo(ul);
            return li;
        };
    }
    
    /**
     * 簡易版sprintf
     * @param {String} format
     * @param {String} var_args
     */
    function sprintf(format, var_args) {
        var values = Array.prototype.slice.call(arguments, 1);
        for (idx in values) {
            format = format.replace("%", values[idx]);
        }
        return format;
    }
    
    /**
     * 2桁専用ゼロパディング
     * @param {Number} num
     */
    function pading(num) {
        return ('0' + num).slice(-2);
    }
    
    /**
     * クエリー文字列をパース
     * @param {String} string
     */
    function parseQuery(string) {
        var vars = {};
        if (!string) {
            return undefined;
        }
        string.split('&').map(function(v, i) {
            var hash = v.split('=');
            vars[hash[0]] = hash[1];
        });
        return vars;
    }
    
    /**
     * ハッシュ内クエリー文字列をパース
     */
    function parseHashQuery() {
        var hash = window.location.href.split('#!')[1];
        return !hash ? [] : decodeURI(hash).replace(/^\//, '').split('/');
    }
});
