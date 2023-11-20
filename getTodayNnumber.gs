// 毎週月~金の23:00~24:00に定期実行
// 今日の抽選番号を取得しスプレッドシートに書き込む
let getTodayNumber = () => {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName('過去の抽せん番号')
  let lastrow = sheet.getLastRow();
  let last = sheet.getRange(lastrow, 1).getValue().replace("第", "").replace("回", "");
  let current = parseInt(last) + 1

  const url = "https://takarakuji.rakuten.co.jp/backnumber/numbers3/";
  console.log(url);
  let response = UrlFetchApp.fetch(url);
  let content = response.getContentText("utf-8");
  let parser = Parser.data(content);
  let dataList = parser.from('colspan="2">').to('</').iterate();
  
  let data = [dataList[0], dataList[1], dataList[2]];
  if(data[0] == "第" + String(current) + "回"){
    console.log("本日の情報取得成功");
    console.log(data);
    writeSheet(data);
  }else{
    console.log("ERROR : 取得ミス");
  }
};

// スプレッドシートにデータを書き込む
let writeSheet = (data) => {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName('過去の抽せん番号')

  let lastrow = sheet.getLastRow();
  let targetrow = lastrow + 1;

  sheet.getRange(targetrow, 1).setValue(data[0])
  sheet.getRange(targetrow, 2).setValue(data[1])
  sheet.getRange(targetrow, 3).setValue(data[2])
};
