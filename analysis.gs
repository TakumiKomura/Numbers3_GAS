const ss = SpreadsheetApp.getActiveSpreadsheet();
const toSheet = ss.getSheetByName('直近データと予想');
const fromSheet = ss.getSheetByName('過去の抽せん番号');

/**
 * 直近30件のデータを「過去の抽せん番号」シートから取得し「直近データと予想」シートに反映する
 */
function setLast30Data() {
  let lastRow = fromSheet.getLastRow();
  let data = fromSheet.getRange(lastRow - 29, 1, 30, 3).getValues();
  toSheet.getRange(2, 1, 30, 3).setValues(data);
}

/**
 * 30件の抽選番号の1の位と10の位のみの数字を取得する
 * @return {Array.<number>} numbers 2桁の数字の配列
 */
function get2DigitsNumbers() {
  let numbers = new Array();
  for(let i = 0; i < 30; i++){
    let number = toSheet.getRange(2 + i, 3).getValue();
    number = parseInt(number) % 100;
    numbers.push(number);
  }
  return numbers;
}

/**
 * 直近30件の数字の1の位と10の位の出現回数をカウントする
 * @return - {Array.<number>} onesPlaceList 1の位の数字の出現回数
 *         - {Array.<number>} tensPlaceList 10の位の数字の出現回数
 */
function countNumbers() {
  let numbers = toSheet.getRange(22, 3, 10, 1).getValues();

  let onesPlaceList = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let tensPlaceList = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for(let number of numbers){
    number = parseInt(number);
    let onesPlace = number % 10;
    let tensPlace = Math.floor(number % 100 / 10);
    onesPlaceList[onesPlace]++;
    tensPlaceList[tensPlace]++;
  }

  return {onesPlaceList, tensPlaceList};
}

/**
 * 直近30件の数字の1の位と10の位の出現回数をsheetにsetする
 * @param {Array.<number>} onesPlaceList 1の位の数字の出現回数
 * @param {Array.<number>} tensPlaceList 10の位の数字の出現回数
 */
function setCountNumbers(onesPlaceList, tensPlaceList) {
  for(let i = 0; i < 10; i++){
    toSheet.getRange(34 + i, 2).setValue(tensPlaceList[i]);
    if(tensPlaceList[i] >= 3){
      toSheet.getRange(34 + i, 3).setValue("×");
    }else if(tensPlaceList[i] == 2){
      toSheet.getRange(34 + i, 3).setValue("△");
    }else{
      toSheet.getRange(34 + i, 3).setValue("○");
    }
    toSheet.getRange(34 + i, 4).setValue(onesPlaceList[i]);
    if(onesPlaceList[i] >= 3){
      toSheet.getRange(34 + i, 5).setValue("×");
    }else if(onesPlaceList[i] == 2){
      toSheet.getRange(34 + i, 5).setValue("△");
    }else{
      toSheet.getRange(34 + i, 5).setValue("○");
    }
  }
}

/**
 * 10の位と1の位の和や差に一致する数字をNGケースとする
 * 正答率
 * @param {number} number 抽選番号
 * @return {Array.<number>} notCandidate NGケース
 */
function sumsubCase(number){
  let onesPlace = number % 10;
  let tensPlace = Math.floor(number % 100 / 10);
  let sum = onesPlace + tensPlace;
  let sub = Math.abs(onesPlace - tensPlace);

  let notCandidate = new Array();
  for(let i = 0; i < 10; i++){
    for(let j = 0; j < 10; j++){
      if(i + j == sum || Math.abs(i - j) == sub){
        notCandidate.push(i * 10 + j);
      }
    }
  }
  return notCandidate;
}

/**
 * sumsubCaseの妥当性を計算
 * search  6354 
 * failure 1049
 * success rate = 83.49%
 */
function sumsubCaseCaseCorrectRate() {
  let search = 0;
  let failure = 0;
  let lastRow = fromSheet.getLastRow();
  for(let i = 2; i < lastRow; i++){
    let previous = parseInt(toSheet.getRange(i, 3).getValue());
    let next = parseInt(toSheet.getRange(i+1, 3).getValue()) % 100;
    let ngCase = sumsubCase(previous);
    for(ng of ngCase){
      if(ng == next){
        failure++;
        break;
      }
    }
    search++;
  }
  console.log("search "+search);
  console.log("failure "+failure);
}

/**
 * 候補数字をシートに書き込む
 * @param {Array.<number>} candidate 候補の数字
 */
function setCandidate(candidate) {
  let lastRow = toSheet.getLastRow();
  let targetRow = 46;
  for(number of candidate){
    toSheet.getRange(targetRow, 1).setValue(number);
    targetRow++;
  }
}

/**
 * 前回の候補数字を「前回の予想」シートに書き込む
 * 前回の予想が当たっていれば背景色を赤にする
 */
function setPreviousCandidate() {
  let lastRow = toSheet.getLastRow();
  let targetRow = 46;
  let todaysNumber = fromSheet.getRange(fromSheet.getLastRow(), 3).getValue();
  todaysNumber = parseInt(todaysNumber) % 100;

  const sheet = ss.getSheetByName("前回の予想");
  for(let i = 0; i < lastRow - targetRow + 1; i++){
    let candidate = toSheet.getRange(targetRow + i, 1).getValue();
    sheet.getRange(2 + i, 1).setValue(candidate);
    sheet.getRange(2 + i, 1).setBackground("white");
    if(parseInt(candidate) == todaysNumber){
      sheet.getRange(2 + i, 1).setBackground("red");
    }
  }
}

/**
 * 「直近データと予想」シートの作成
 */
function setAnalysisSheet() {
  setPreviousCandidate();

  setLast30Data();

  let {onesPlaceList, tensPlaceList} = countNumbers();
  setCountNumbers(onesPlaceList, tensPlaceList);

  let last30numbers = get2DigitsNumbers();
  let previousNumber = parseInt(toSheet.getRange(31, 3).getValue());
  let ngList = sumsubCase(previousNumber);
  let candidate = [];
  for(let i = 0; i < 10; i++){
    if(i == 0) continue; // 誕生日数字を避ける (誕生日数字を選ぶ人が多く、配当金が少ない)
    if(i == 1) continue; // 誕生日数字を避ける (誕生日数字を選ぶ人が多く、配当金が少ない)
    if(i == 2) continue; // 誕生日数字を避ける (誕生日数字を選ぶ人が多く、配当金が少ない)
    if(tensPlaceList[i] >= 3) continue; // 頻出数字を避ける
    for(let j = 0; j < 10; j++){
      if(onesPlaceList[j] >= 3) continue; // 頻出数字を避ける
      if(ngList.includes(i * 10 + j)) continue; // NGリストを避ける
      if(last30numbers.includes(i * 10 + j)) continue; // 過去30回で既出の数字を避ける
      candidate.push(i * 10 + j);
    }
  }
  setCandidate(candidate);
}
