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
 *  2024/06/27 0.3.1 設定画面の説明変更(変数の変更等整理)
 */

jQuery.noConflict();

(async (jQuery_, PLUGIN_ID_) => {
  'use strict';

  // 設定パラメータ
  const ParameterFieldUsers = 'paramFieldUsers';                  // ユーザー選択フィールド
  const ParameterCountUsers = 'paramCountUsers';                  // ユーザー選択数
  const ParameterFieldOrganizations = 'paramFieldOrganizations';  // 所属組織フィールド
  const ParameterFieldPrimary = 'paramFieldPrimary';              // 優先組織フィールド

  // 環境設定
  const Parameter = {
    // 表示文字
    Lang: {
      en: {
        plugin_titile: 'Deployment of User\'s Organizations Plugin',
        plugin_description: 'Set all affiliations and preferred organizations to which the user belongs',

        label_plugin: 'Please Setting Users select and Users limit count',
        label_users: 'Users Select Field                   ',
        label_count: 'Count Limit(0:No Limited)      ',
        label_organizations: 'Deployment Organizations Select Field',
        label_primary: 'Primary Organization Select Field    ',
        label_from: 'Deployment Source',
        label_to: 'Deployment Groups',

        plugin_cancel: 'Cancel',
        plugin_ok: ' Save ',
        message_alert: 'Please don\'t same fields Organizations and Primary'
      },
      ja: {
        plugin_titile: 'ユーザーの所属組織の展開 プラグイン',
        plugin_description: 'ユーザーが所属する全ての所属組織と優先組織を設定します',

        label_plugin: 'ユーザー選択とユーザー制限数は設定して下さい',
        label_users: 'ユーザー選択 フィールド　',
        label_count: '制限数(0:無制限) ',
        label_organizations: '所属組織 フィールド　　　',
        label_primary: '優先組織 フィールド　　　',
        label_from: '展開元',
        label_to: '展開先',

        plugin_cancel: 'キャンセル',
        plugin_ok: '   保存  ',
        message_alert: '所属組織と優先組織は同じにしないで下さい'
      },
      DefaultSetting: 'ja',
      UseLang: {}
    },
    Html: {
      Form: '#plugin_setting_form',
      Title: '#plugin_titile',
      Description: '#plugin_description',

      Cancel: '#plugin_cancel',
      Ok: '#plugin_ok',
    },
    Elements: {
      FieldUsers: '#field_users',
      FieldCount: '#field_count',
      FieldOrganizations: '#field_organizations',
      FieldPrimary: '#field_primary',
    },
  };


  /*
  HTMLタグの削除
   引数　：htmlstr タグ(<>)を含んだ文字列
   戻り値：タグを含まない文字列
  */
  const escapeHtml = (htmlstr) => {
    return htmlstr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&quot;').replace(/'/g, '&#39;');
  };

  /*
  ユーザーの言語設定の読み込み
   引数　：なし
   戻り値：なし
  */
  const settingLang = () => {
    // 言語設定の取得
    Parameter.Lang.UseLang = kintone.getLoginUser().language;
    switch (Parameter.Lang.UseLang) {
      case 'en':
      case 'ja':
        break;
      default:
        Parameter.Lang.UseLang = Parameter.Lang.DefaultSetting;
        break;
    }
    // 言語表示の変更
    var html = jQuery(Parameter.Html.Form).html();
    var tmpl = jQuery.templates(html);

    var useLanguage = Parameter.Lang[Parameter.Lang.UseLang];
    // 置き換え
    jQuery(Parameter.Html.Form).html(tmpl.render({ lang: useLanguage })).show();
  };

  /*
  フィールド設定
   引数　：なし
   戻り値：なし
  */
  const settingHtml = async () => {
    var listField = await kintone.api(kintone.api.url('/k/v1/app/form/fields', true), 'GET', { 'app': kintone.app.getId() });
    console.log("listField:%o", listField);

    for (const key in listField.properties) {
      //console.log("properties key:%o",key);
      try {
        const prop = listField.properties[key];
        //console.log("prop:%o",prop);

        // ユーザー選択フィールドのみ入れる
        if (prop.type === 'USER_SELECT') {
          const option = jQuery('<option/>');
          option.attr('value', escapeHtml(prop.code)).text(escapeHtml(prop.label));
          //console.log("Add USER_SELECT option:%o",option);
          jQuery(Parameter.Elements.FieldUsers).append(option);
        }
        // 組織選択フィールドのみ入れる
        if (prop.type === 'ORGANIZATION_SELECT') {
          const option = jQuery('<option/>');
          option.attr('value', escapeHtml(prop.code)).text(escapeHtml(prop.label));

          //console.log("Add ORGANIZATION_SELECT option:%o",option);
          jQuery(Parameter.Elements.FieldOrganizations).append(option);
        }
        // 分けないと上手くいかない
        if (prop.type === 'ORGANIZATION_SELECT') {
          const option = jQuery('<option/>');
          option.attr('value', escapeHtml(prop.code)).text(escapeHtml(prop.label));
          //console.log("Add ORGANIZATION_SELECT option:%o",option);          
          jQuery(Parameter.Elements.FieldPrimary).append(option);
        }

      }
      catch (error) {
        console.log("error:%o", error);
      }
    }

    // 現在データの呼び出し
    var nowConfig = kintone.plugin.app.getConfig(PLUGIN_ID_);
    console.log("nowConfig:%o", nowConfig);

    // 現在データの表示
    if (nowConfig[ParameterFieldUsers]) {
      jQuery(Parameter.Elements.FieldUsers).val(nowConfig[ParameterFieldUsers]);
    }
    if (nowConfig[ParameterCountUsers]) {
      jQuery(Parameter.Elements.FieldCount).val(nowConfig[ParameterCountUsers]);
    }
    if (nowConfig[ParameterFieldOrganizations]) {
      jQuery(Parameter.Elements.FieldOrganizations).val(nowConfig[ParameterFieldOrganizations]);
    }
    if (nowConfig[ParameterFieldPrimary]) {
      jQuery(Parameter.Elements.FieldPrimary).val(nowConfig[ParameterFieldPrimary]);
    }
  };

  /*
  データの保存
   引数　：なし
   戻り値：なし
  */
  const saveSetting = () => {
    // 各パラメータの保存
    var config = {};
    config[ParameterFieldUsers] = jQuery(Parameter.Elements.FieldUsers).val();
    config[ParameterCountUsers] = jQuery(Parameter.Elements.FieldCount).val();

    // 同一フィールドチェック
    var organizations = jQuery(Parameter.Elements.Organizations).val();
    config[ParameterFieldOrganizations] = organizations;
    var primary = jQuery(Parameter.Elements.PrimaryField).val();
    config[ParameterFieldPrimary] = primary;

    if (organizations == primary) {
      // 同じフィールドを設定している場合アラート
      alert(Parameter.Lang[Parameter.Lang.UseLang].message_alert);
      return
    }
    console.log('config:%o', config);

    // 設定の保存
    kintone.plugin.app.setConfig(config);
  };

  // 言語設定
  settingLang();
  await settingHtml();

  // 保存
  jQuery(Parameter.Html.Ok).click(() => { saveSetting(); });
  // キャンセル
  jQuery(Parameter.Html.Cancel).click(() => { history.back(); });
})(jQuery, kintone.$PLUGIN_ID);
