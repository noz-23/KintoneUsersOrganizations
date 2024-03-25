/*
 *ユーザーの所属組織の展開
 * Copyright (c) 2024 noz-23
 *  https://github.com/noz-23/
 *
 * Licensed under the MIT License
 * 
 *  利用：
 *   JQuery:
 *     https://jquery.com/
 *     https://js.cybozu.com/jquery/3.7.1/jquery.min.js
 *   
 *   jsrender:
 *     https://www.jsviews.com/
 *     https://js.cybozu.com/jsrender/1.0.13/jsrender.min.js
 * 
 * History
 *  2024/02/28 0.1.0 初版とりあえずバージョン
 *  2024/03/01 0.2.0 同一フィールドの選択できない様に変更、コーディングルール、コメント等の直し
 *  2024/03/05 0.2.1 細かいバグ修正、コーディングルール、コメント等の直し
 *  2024/03/05 0.2.2 ユーザー選択がない場合クリアするように変更
 *  2024/03/24 0.3.0 プラグイン設定画面に Google AdSense 追加
 *
 */

jQuery.noConflict();

(async ( PLUGIN_ID_) => {
  'use strict';

  // Kintone プラグイン 設定パラメータ
  const config = kintone.plugin.app.getConfig(PLUGIN_ID_);

  const readUsers=config['paramFieldUsers'];              // 読み取るユーザーのフィールド 名
  const countUsers=config['paramCountUsers'];            // ユーザーのカウント数
  const writeOrgans =config['paramFieldOrganizations'];  // 書き込む所属組織のフィールド名
  const writePrimary =config['paramFieldPrimary'];       // 書き込む優先組織のフィールド名

  let EVENTS_EDIT =[
    'app.record.create.show', // 作成表示
    'app.record.edit.show',   // 編集表示
    'app.record.index.show',  // 一覧表示
  ];

  let EVENTS_CHANGE =[
    'app.record.create.change.'+readUsers,
    'app.record.edit.change.'  +readUsers,
    'app.record.index.change.' +readUsers,
  ];
  kintone.events.on(EVENTS_EDIT, (events_) => {
    console.log('events_:%o',events_);
    // 入力できない様に変更
    events_.record[writeOrgans].disabled =true;
    // 入力できない様に変更
    events_.record[writePrimary].disabled =true;
    return events_;
  });

  kintone.events.on(EVENTS_CHANGE, (events_) => {
    console.log('events_:%o',events_);
    var useLang = kintone.getLoginUser().language;

    // 選択無しは終了
    if ( events_.record[readUsers].value.length ==0)
    {
      clearData();
      return;
    }
    
    // ユーザー数の取得
    const count =Number(countUsers);
    if( count !=0)
    {
      if ( events_.record[readUsers].value.length >count)
      {
        // 設定数以上は抜ける
        const arertLang =( useLang =='ja') ? (''+count+'人以上は設定しないでください'):('Please don\'t Select Over '+count+' users');
        alert(arertLang);

        clearData();
        return;
      }
    }

    // ユーザー(コード)情報の取得
    let paramUsers={codes:[]};
    for( let user of events_.record[readUsers].value){
      paramUsers.codes.push(user.code);
    }
    console.log('paramUsers:%o',paramUsers);

    // ユーザーの詳細情報を取得
    kintone.api(kintone.api.url('/v1/users', true), 'GET', paramUsers,async ( listUser_)=>{
      // change系は return で有効にならないため await しない
      console.log('listUser_:%o',listUser_);

      var record =await kintone.app.record.get();
      console.log('record:%o',record);

      record.record[writeOrgans].value =[];
      record.record[writePrimary].value =[];

      // 各ユーザーの情報を入れる
      for( let user of listUser_.users){
        console.log('user:%o',user);
  
        // 所属組織の取得
        const listOrgan =await kintone.api(kintone.api.url('/v1/user/organizations', true), 'GET',{code:user.code});
        console.log('listOrgan:%o',listOrgan);
  
        // 所属組織のデータを入れる
        for(let organ of listOrgan.organizationTitles){
          // 重複チェックは更新時にされる
          record.record[writeOrgans].value.push({code:organ.organization.code,name:organ.organization.name});
        }
        
        // 優先組織の取得
        var userPrimaryOrgan =user.primaryOrganization;
        var primaryOrgan =listOrgan.organizationTitles.find( find => find.organization.id == userPrimaryOrgan);
        console.log('primaryOrgan:%o',primaryOrgan);
  
        // 優先組織のデータを入れる
        record.record[writePrimary].value.push({code:primaryOrgan.organization.code,name:primaryOrgan.organization.name});
        console.log('write record:%o',record);

        // データの更新
        kintone.app.record.set(record);
      }
    });
    return;
  });

  /*
  表示のクリア
   引数　：なし
   戻り値：なし
  */
  const clearData=async()=>{
    console.log('clearData');
    //
    await Sleep(500);
    var record =await kintone.app.record.get();

    // ユーザー選択が編集不可で、選択されてない場合はクリア
    record.record[readUsers].value =[];

    if(record.record[writeOrgans]){
      record.record[writeOrgans].value =[];
    }
    if(record.record[writePrimary]){
      record.record[writePrimary].value =[];
    }
 
    console.log('record:%o',record);
    kintone.app.record.set(record);
  }

  /*
  スリープ関数
   引数　：ms_ ms単位のスリープ時間
   戻り値：なし
  */
  const Sleep=(ms_)=>{
    return new Promise(resolve_ => setTimeout(resolve_, ms_));
  };
  
})(kintone.$PLUGIN_ID);
