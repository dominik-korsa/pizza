import SpreadsheetApp = GoogleAppsScript.Spreadsheet.SpreadsheetApp;
import Sheet = GoogleAppsScript.Spreadsheet.Sheet;
import HtmlService = GoogleAppsScript.HTML.HtmlService;
import type {ReceiptData, ReceiptDataCommon, ReceiptDataPerson} from "./types";
import Range = GoogleAppsScript.Spreadsheet.Range;
import {LodashGS} from "./global";
const _ = LodashGS.load();

const printRequestUrl = 'https://pizza.dominik-korsa.tk/request-print';

const positions = {
  qrContentTemplate: 'M3',
  date: 'K15',
  pricePerPiece: 'K13',
  receiver: 'K16',
  account: 'K17',
  phone: 'K18'
};
const cannotCalculateText = 'Nie można obliczyć';

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Pizza')
      // .addItem('Send webhook', 'sendWebhook')
      .addItem('Print receipts', 'showPrintDialog')
      .addToUi();
}

function zeroPad(num: number, places: number) {
  const zero = places - num.toString().length + 1;
  return Array(+(zero > 0 && zero)).join("0") + num;
}

type ColumnsMap<T extends object> = {
  [key in keyof T]: number;
}

function findColumns<T extends Record<string, string>>(range: Range, columns: T): ColumnsMap<T> {
  const map = new Map<string, number>();
  range.getValues()[0].forEach((header, columnIndex) => {
    map.set(_.kebabCase(header), columnIndex + 1);
  });
  return _.mapValues(columns, (header => {
    const column = map.get(_.kebabCase(header));
    if (column === undefined) throw new Error(`Header ${header} not found`);
    return column;
  }));
}

function listPeople(sheet: Sheet): ReceiptDataPerson[] {
  const columns = findColumns(sheet.getRange('A1:E1'), {
    name: 'Kto? Kto będzie jadł?',
    pieces: 'Kawałki',
    totalPrice: 'Do zapłaty',
  });
  const range = sheet.getRange("A2:E");
  const people = [];
  for (let i = 2; i <= range.getHeight(); ++i) {
    const personName = range.getCell(i, columns.name).getDisplayValue();
    if (personName !== '') {
      const totalPriceCell = range.getCell(i, columns.totalPrice);
      people.push({
        personName,
        pieces: range.getCell(i, columns.pieces).getValue(),
        totalPrice: totalPriceCell.getDisplayValue(),
        qrContent: sheet.getRange(positions.qrContentTemplate).getValue().replace('{price}', zeroPad(Math.round(totalPriceCell.getValue() * 100), 6))
      });
    }
  }
  return people;
}

function getCommonData(sheet: Sheet): ReceiptDataCommon {
  return {
      date: sheet.getRange(positions.date).getDisplayValue(),
      pricePerPiece: sheet.getRange(positions.pricePerPiece).getDisplayValue(),
      receiver: sheet.getRange(positions.receiver).getDisplayValue(),
      account: sheet.getRange(positions.account).getDisplayValue(),
      phone: sheet.getRange(positions.phone).getDisplayValue(),
  };
}

function showPrintDialog() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getActiveSheet();

  if (sheet.getRange('K13').getDisplayValue() === cannotCalculateText) {
    spreadsheet.toast('Niektóre pola nie są uzupełnione', 'Nie można drukować', 3);
    return;
  }

  const template = HtmlService
    .createTemplateFromFile("PrintPrompt");
  template.sheetData = getCommonData(sheet);
  template.people = listPeople(sheet);
  // SpreadsheetApp.getUi().showSidebar(template.evaluate());
  SpreadsheetApp.getUi().showModalDialog(template.evaluate(), "Print receipt");
}

function onPersonPrint(data: ReceiptData) {
  SpreadsheetApp.getActive().toast("Printing person");
  UrlFetchApp.fetch(printRequestUrl, {
    'method' : 'post',
    'contentType': 'application/json',
    'payload' : JSON.stringify(data)
  })
}
