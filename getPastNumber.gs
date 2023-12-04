// 静的スクレイピング
let scraping = () => {
  let dataList = new Array();
  const _link = "https://takarakuji.rakuten.co.jp/backnumber/numbers3/2023";

  for(let i = 11; i <= 11; i+=1){
    let link = _link + Utilities.formatString("%02d", i) + "/";
    console.log(link)

    let response = UrlFetchApp.fetch(link);
    let content = response.getContentText("utf-8");
    let parser = Parser.data(content)
    let data = parser.from('colspan="2">').to('</').iterate()
    for(let j = 0; j < data.length; j+=3){
      dataList.push([data[j], data[j + 1], data[j + 2]]);
      Utilities.sleep(10);
    }
  }
  console.log(dataList)
  return dataList
};

// 動的スクレイピングのためのブラウザレンダリングを行う
let phantomJSCloudScraping = (URL) => {
  //スクリプトプロパティからPhantomJsCloudのAPIキーを取得する
  const KEY = PropertiesService.getScriptProperties().getProperty('PHANTOMJSCLOUD_ID');

  //HTTPSレスポンスに設定するペイロードのオプション項目を設定する
  let options =
  {
    url: URL,
    renderType: "HTML",
    outputAsJson: true
  };

  //オプション項目をJSONにしてペイロードとして定義し、エンコードする
  let payload = encodeURIComponent(JSON.stringify(options));

  //PhantomJsCloudのAPIリクエストを行うためのURLを設定
  let apiUrl = "https://phantomjscloud.com/api/browser/v2/" + KEY + "/?request=" + payload;

  // 結果を取得
  let response = UrlFetchApp.fetch(apiUrl).getContentText("utf-8");

  // JSONデータをパースして、欲しいデータを取得
  let data = JSON.parse(response)["content"]["data"];

  return data;
};

// 動的スクレイピング
let dynamicPageScraping = () => {
  const url = "";

  //PhantomJsCloud用の独自関数で動的なWebページのHTMLデータを取得する
  let html = phantomJSCloudScraping(url);
  console.log(html);
};

// スプレッドシートにデータを書き込む
let writeData = () => {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName('過去の抽せん番号');

  let lastrow = sheet.getLastRow();
  let targetrow = lastrow + 1;

  dataList = scraping();

  for(data of dataList){
    sheet.getRange(targetrow, 1).setValue(data[0])
    sheet.getRange(targetrow, 2).setValue(data[1])
    sheet.getRange(targetrow, 3).setValue(data[2])

    targetrow++;
  }
};
