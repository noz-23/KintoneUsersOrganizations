/*
ユーザ名から現在の所属更新
*/

(function (PLUGIN_ID) {
  // Kintone プラグイン 設定パラメータ
  const config = kintone.plugin.app.getConfig(PLUGIN_ID);

  const readUser=config['paramFieldUsers'];              // 読み取るユーザーのフィールド 名
  const countUsers=config['paramCountUsers'];            // ユーザーのカウント数
  const writeOrgans =config['paramFieldOrganizations'];  // 書き込む所属組織のフィールド名
  const writePrimary =config['paramFieldPrimary'];       // 書き込む優先組織のフィールド名

  let EVENTS_EDIT =[
    'app.record.create.show', // 作成表示
    'app.record.edit.show',   // 編集表示
    'app.record.index.show',  // 一覧表示
    //'app.record.create.submit',     // 作成保存
    //'app.record.edit.submit',       // 編集保存
    //'app.record.index.edit.submit', // 一覧保存
  ];

  let EVENTS_CHANGE =[
    //'app.record.create.show', // 作成表示
    //'app.record.edit.show',   // 編集表示
    //'app.record.index.show',  // 一覧表示
    //'app.record.create.submit',     // 作成保存
    //'app.record.edit.submit',       // 編集保存
    //'app.record.index.edit.submit', // 一覧保存
    'app.record.create.change.'+readUser,
    'app.record.edit.change.'+readUser,
    'app.record.index.change.'+readUser,
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

    let paramUsers={codes:[]};
    for( let user of events_.record[readUser].value){
      paramUsers.codes.push(user.code);
    }
    console.log('paramUsers:%o',paramUsers);
    
    const count =Number(countUsers);
    if( count !=0)
    {
      if ( paramUsers.codes.length >count)
      {
        const arertLang =( useLang =='ja') ? (''+count+'人以上は設定しないでください'):('Please don\'t Select Over '+count+' users');
        alert(arertLang);

        events_.record[readUser].value =[];
        events_.record[writeOrgans].value =[];
        events_.record[writePrimary].value =[];
        return events_;
      }
    }
    if ( paramUsers.codes.length ==0)
    {
      events_.record[readUser].value =[];
      events_.record[writeOrgans].value =[];
      events_.record[writePrimary].value =[];
      return events_;
    }

    kintone.api(kintone.api.url('/v1/users', true), 'GET',paramUsers,async ( listUser_)=>{
      console.log('listUser_:%o',listUser_);

      var record =await kintone.app.record.get();
      console.log('record:%o',record);

      record.record[writeOrgans].value =[];
      record.record[writePrimary].value =[];
      for( let user of listUser_.users){
        console.log('user:%o',user);
  
        const listOrgan =await kintone.api(kintone.api.url('/v1/user/organizations', true), 'GET',{code:user.code});
        console.log('listOrgan:%o',listOrgan);
  
        for(let organ of listOrgan.organizationTitles)
        {
          record.record[writeOrgans].value.push({code:organ.organization.code,name:organ.organization.name});
        }
        
        var userPrimaryOrgan =user.primaryOrganization;
        var primaryOrgan =listOrgan.organizationTitles.find( find => find.organization.id == userPrimaryOrgan);
        console.log('primaryOrgan:%o',primaryOrgan);
  
        record.record[writePrimary].value.push({code:primaryOrgan.organization.code,name:primaryOrgan.organization.name});
        console.log('write record:%o',record);
        kintone.app.record.set(record);
        }
    });
    return events_;
  });
})(kintone.$PLUGIN_ID);
