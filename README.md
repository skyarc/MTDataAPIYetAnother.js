MTDataAPIYetAnother.js
======================

__このソフトウェアはアルファクオリティのため、定常的な使用は推奨されません。__

MTDataAPIYetAnother.jsは、[Movable Type 6]の[Data API]をウェブブラウザから使用
するためのJavascriptライブラリです。

このライブラリは、MTで一般公開するブログサイトのコンテンツの一切を[Data API]経由で提供し、
再構築を伴わないブログ管理の実現可能性を模索する実験の一環で開発されています。
よって、認証関連の機能はなく、代わりに、カテゴリーアーカイブやタグクラウド、月別アーカイブなど、
公式[SDK]に網羅されていないが、標準的なブログに必要な部品を構築することに特化した機能を提供します。

また、通信機能をjQueryに委譲することでJSONPでのデータ受信を可能なっていたり、
すべてのメソッドがjQuery XHRオブジェクトを返すので、jQuery.Deferredを使える利点があります。

このライブラリで提供する機能の一部は、巨大なデータをサーバーから取得してクライアントサイドで集計
するなどの強引な処理を含んでいます。これらは今後、サードパーティプラグインを含めた
サーバーサイドの実装が提供されることで不要になることを期待しています。


## サーバー要件

このライブラリを使用するには、サーバーサイドに下記の環境が必要です。

* [Movable Type 6]
* [mt-plugin-DataAPIExtendSearch] プラグイン
* [dataapijsonpifier] プラグイン(JSONPを使用する場合)

[Data API]:http://www.movabletype.jp/documentation/mt6/developer/movable-type-api.html
[Movable Type 6]:http://www.movabletype.jp/
[SDK]:https://github.com/movabletype/mt-data-api-sdk-js
[mt-plugin-DataAPIExtendSearch]:https://github.com/bit-part/mt-plugin-DataAPIExtendSearch
[dataapijsonpifier]:https://github.com/jamadam/mt-plugin-dataapijsonpifier

## クライアント要件

* jQuery 1.9.1以上

## 使用例

### コンストラクタ

    var api = new MT.MTDataAPIYetAnother({
        baseUrl: "http://example.com/mt-data-api.cgi",
        enableJsonp: false,
        internalLimit: 1000
    });

### 月別アーカイブ

    api.listMonthlyEntryCounts(1, {monthLimit:6}, function(response){
        if (response.error || response.item.length == 0) {
            return;
        }
        
        for (var idx in response.items) {
            var item = response.items[idx];
            var year = item.year;
            var month = item.month;
            var amount = item.totalResults;
            // メニューパーツの構築など
        }
    });

### カテゴリー一覧

    api.listCategoryStats(1, function(response) {
        if (response.error || response.item.length == 0) {
            return;
        }
        
        for (var idx in response.items) {
            var item = response.items[idx];
            var basename = item.basename;
            var amount = item.totalResults;
            // メニューパーツの構築など
        }
    });

### タグクラウド

    api.listTags(1, {maxRank:6, monthLimit:12}, function(response) {
        if (response.error || response.item.length == 0) {
            return;
        }
        
        for (var idx in response.items) {
            var item = response.items[idx];
            var name = item.name;
            var amount = item.totalResults;
            var rank = item.rank;
            // タグクラウド構築など
        }
    });

### 月指定記事一覧

    api.listEntriesByMonth(1, 2014, 5, {fields:name, limit:10}, function(response) {
        if (response.error || response.item.length == 0) {
            return;
        }
        
        for (var idx in response.items) {
            var item = response.items[idx];
            var name = item.name;
        }
    });

### 公式SDKと互換性のあるかもしれないメソッド

* api.getBlog()
* api.getEntry()
* api.listEntries()
* api.listCategories()

### エラーハンドリング

    api.someMethod(1, function(response) {
        if (response.error) { // 何らかのエラー
            if (response.code) { // Data APIがエラーを返している
                alert(response.message); // Data APIのエラーメッセージ
            } else {
                alert(response.message) // 通信経路のエラーメッセージ
                console.log(response.xhr) // デバッグ
                console.log(response.errorThrown) // デバッグ
            }
        }
        
        if (response.item.length == 0) {
            alert("データがありません");
        }
        
        // 正常時の処理
    });

## REPOSITORY

[https://github.com/jamadam/MTDataAPIYetAnother.js]
[https://github.com/jamadam/MTDataAPIYetAnother.js]:https://github.com/jamadam/MTDataAPIYetAnother.js

## COPYRIGHT AND LICENSE

Copyright (c) [jamadam]
[jamadam]: http://blog2.jamadam.com/

Dual licensed under the MIT and GPL licenses:

- [http://www.opensource.org/licenses/mit-license.php]
- [http://www.gnu.org/licenses/gpl.html]

[http://www.opensource.org/licenses/mit-license.php]: http://www.opensource.org/licenses/mit-license.php
[http://www.gnu.org/licenses/gpl.html]:http://www.gnu.org/licenses/gpl.html
