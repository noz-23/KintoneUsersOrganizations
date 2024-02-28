jQuery.noConflict();

(async ($,PLUGIN_ID)=>{
  'use strict';

  // 設定パラメータ
  const ParameterFieldUsers='paramFieldUsers';  // ユーザー選択フィールド
  const ParameterCountUsers='paramCountUsers';  // ユーザー選択数
  const ParameterFieldOrganizations='paramFieldOrganizations';  // 所属組織フィールド
  const ParameterFieldPrimary='paramFieldPrimary'; // 優先組織フィールド

  // 環境設定
  const Parameter = {
  // 表示文字
    Lang:{
      en:{
        plugin_titile      : 'Deployment of User\'s Organizations Plugin',
        plugin_description : 'Set all affiliations and preferred organizations to which the user belongs',
        plugin_label       : 'Please Setting Users select and Users limit count',
        users_label        : 'Users Select Field                   ',
        count_label        : 'Count Limit Users(0:No Limited)      ',
        organizations_label: 'Deployment Organizations Select Field',
        primary_label      : 'Primary Organization Select Field    ',
        plugin_cancel      : 'Cancel',
        plugin_ok          : ' Save ',
      },
      ja:{
        plugin_titile      : 'ユーザーの所属組織の展開 プラグイン',
        plugin_description : 'ユーザーが所属する全ての所属組織と優先組織を設定します',
        plugin_label       : 'ユーザー選択とユーザー制限数は設定して下さい',
        users_label        : 'ユーザー選択 フィールド　',
        count_label        : 'ユーザー制限数(0:無制限) ',
        organizations_label: '所属組織 フィールド　　　',
        primary_label      : '優先組織 フィールド　　　',
        plugin_cancel      : 'キャンセル',
        plugin_ok          : '   保存  ',
      },
      Setting:'ja',
    },
    Html:{
      Form               : '#plugin_setting_form',
      Title              : '#plugin_titile',
      Description        : '#plugin_description',
      Label              : '#plugin_label',
      UsersLabel         : '#users_label',
      CountLabel         : '#count_label',
      OrganizationsLabel : '#organizations_label',
      PrimaryLabel       : '#primary_label',
      Cancel             : '#plugin_cancel',
      Ok                 : '#plugin_ok',
    },
    Elements:{
      UsersField         :'#users_field',
      CountField         :'#count_field',
      OrganizationsField :'#organizations_field',
      PrimaryField       :'#primary_field',
    },


  };

  /*
  ユーザーの言語設定の読み込み
   引数　：なし
   戻り値：なし
  */
  const settingLang=()=>{
    // 言語設定の取得
    var useLang = kintone.getLoginUser().language;
    switch( useLang)
    {
      case 'en':
      case 'ja':
        break;
      default:
        useLang =Parameter.Lang.Setting;
        break;
    }
    // 言語表示の変更
    var html = jQuery(Parameter.Html.Form).html();
    var tmpl = jQuery.templates(html);
    
    var useLanguage =Parameter.Lang[useLang];
    // 置き換え
    jQuery(Parameter.Html.Form).html(tmpl.render({lang:useLanguage})).show();
  };

  /*
  フィールド設定
   引数　：なし
   戻り値：なし
  */
  const settingHtml= async ()=>{
    var listFeild =await kintone.api(kintone.api.url('/k/v1/app/form/fields', true), 'GET', {'app': kintone.app.getId()});
    console.log("listFeild:%o",listFeild);

    for (const key in listFeild.properties)
    {
      //console.log("properties key:%o",key);
      try {
        const prop = listFeild.properties[key];
        //console.log("prop:%o",prop);
    
        // ユーザー選択フィールドのみ入れる
        if (prop.type === 'USER_SELECT')
        {
          const option = jQuery('<option/>');
          option.attr('value', escapeHtml(prop.code)).text(escapeHtml(prop.label));
          console.log("Add USER_SELECT option:%o",option);
          jQuery(Parameter.Elements.UsersField).append(option);
        }
        // 組織選択フィールドのみ入れる
        if (prop.type === 'ORGANIZATION_SELECT')
        {
          const option = jQuery('<option/>');
          option.attr('value', escapeHtml(prop.code)).text(escapeHtml(prop.label));

          console.log("Add ORGANIZATION_SELECT option:%o",option);
          jQuery(Parameter.Elements.OrganizationsField).append(option);
        }
        // 分けないと上手くいかない
        if (prop.type === 'ORGANIZATION_SELECT')
        {
          const option = jQuery('<option/>');
          option.attr('value', escapeHtml(prop.code)).text(escapeHtml(prop.label));

          console.log("Add ORGANIZATION_SELECT option:%o",option);          
          jQuery(Parameter.Elements.PrimaryField).append(option);
        }
                 
      } catch (error) {
        console.log("error:%o",error);
      }
      var nowConfig =kintone.plugin.app.getConfig(PLUGIN_ID);
      console.log("nowConfig:%o",nowConfig);
      if(nowConfig[ParameterFieldUsers])
      {
        jQuery(Parameter.Elements.UsersField).val(nowConfig[ParameterFieldUsers]); 
      }
      if(nowConfig[ParameterCountUsers])
      {
        jQuery(Parameter.Elements.CountField).val(nowConfig[ParameterCountUsers]); 
      }
      if(nowConfig[ParameterFieldOrganizations])
      {
        jQuery(Parameter.Elements.OrganizationsField).val(nowConfig[ParameterFieldOrganizations]); 
      }
      if(nowConfig[ParameterFieldPrimary])
      {
        jQuery(Parameter.Elements.PrimaryField).val(nowConfig[ParameterFieldPrimary]); 
      }
  }
  };
  /*
  データの保存
   引数　：なし
   戻り値：なし
  */
   const saveSetting=()=>{
    // 各パラメータの保存
    var config ={};
    config[ParameterFieldUsers]=jQuery(Parameter.Elements.UsersField).val();
    config[ParameterCountUsers]=jQuery(Parameter.Elements.CountField).val();
    config[ParameterFieldOrganizations]=jQuery(Parameter.Elements.OrganizationsField).val();
    config[ParameterFieldPrimary]=jQuery(Parameter.Elements.PrimaryField).val();
  
    console.log('config:%o',config);

    kintone.plugin.app.setConfig(config);
  };
  
  // HTMLタグの削除
  const escapeHtml =(htmlstr)=>{
    return htmlstr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&quot;').replace(/'/g, '&#39;');
  };  

  // 言語設定
  settingLang();
  await settingHtml();
  // 保存
  jQuery(Parameter.Html.Ok).click(() =>{saveSetting();});
  // キャンセル
  jQuery(Parameter.Html.Cancel).click(()=>{history.back();});
})(jQuery, kintone.$PLUGIN_ID);
