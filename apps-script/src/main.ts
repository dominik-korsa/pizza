import SpreadsheetApp = GoogleAppsScript.Spreadsheet.SpreadsheetApp;
import Sheet = GoogleAppsScript.Spreadsheet.Sheet;
import HtmlService = GoogleAppsScript.HTML.HtmlService;
import type {ReceiptData, ReceiptDataCommon, ReceiptDataPerson} from "./types";
import Range = GoogleAppsScript.Spreadsheet.Range;
import {LodashGS} from "./global";
const _ = LodashGS.load();

const printRequestUrl = 'https://pizza.dominik-korsa.tk/request-print';
const isConnectedRequestUrl = 'https://pizza.dominik-korsa.tk/is-connected';

const positions = {
  qrContentTemplate: 'N3',
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

type RowsMap<T extends object> = {
  [key in keyof T]: Range;
}
function findRows<T extends Record<string, string>>(range: Range, rows: T): RowsMap<T> {
  const map = new Map<string, number>();
  range.getValues().forEach(([header], rowIndex) => {
    map.set(_.kebabCase(header), rowIndex + 1);
  });
  return _.mapValues(rows, (header => {
    const row = map.get(_.kebabCase(header));
    if (row === undefined) throw new Error(`Header ${header} not found`);
    return range.getCell(row, 2);
  }));
}

function listPeople(sheet: Sheet): ReceiptDataPerson[] {
  const columns = findColumns(sheet.getRange('A1:H1'), {
    name: 'Kto? Kto będzie jadł?',
    pieces: 'Kawałki',
    piecesPrice: 'Cena kawałków',
    totalPrice: 'Do zapłaty',
  });
  const range = sheet.getRange("A2:H");
  const people: ReceiptDataPerson[] = [];
  for (let i = 2; i <= range.getHeight(); ++i) {
    const personName = range.getCell(i, columns.name).getDisplayValue();
    if (personName !== '') {
      const totalPriceCell = range.getCell(i, columns.totalPrice);
      people.push({
        personName,
        pieces: range.getCell(i, columns.pieces).getValue(),
        piecesPrice: range.getCell(i, columns.piecesPrice).getDisplayValue(),
        totalPrice: totalPriceCell.getDisplayValue(),
        qrContent: sheet.getRange(positions.qrContentTemplate).getValue().replace('{price}', zeroPad(Math.round(totalPriceCell.getValue() * 100), 6))
      });
    }
  }
  return people;
}

function getCommonData(sheet: Sheet): ReceiptDataCommon {
  const range = sheet.getRange('K1:L');
  const rows = findRows(range, {
    pricePerPiece: 'Opłata za kawałek',
    drinksPrice: 'Opłata za napoje',
    servicePrice: 'Opłata serwisowa',
    receiver: 'Odbiorca',
    account: 'Konto bankowe',
    phone: 'Numer telefonu',
    date: 'Data',
  });
  return {
      pricePerPiece: rows.pricePerPiece.getDisplayValue(),
      drinksPrice: rows.drinksPrice.getDisplayValue(),
      servicePrice: rows.servicePrice.getDisplayValue(),
      receiver: rows.receiver.getDisplayValue(),
      account: rows.account.getDisplayValue(),
      phone: rows.phone.getDisplayValue(),
      date: rows.date.getDisplayValue(),
  };
}

function checkPrinterConnected(): boolean {
  const response = UrlFetchApp.fetch(isConnectedRequestUrl, {
    'method' : 'get',
  });
  return JSON.parse(response.getContentText());
}

function showPrintDialog() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getActiveSheet();
  const commonData = getCommonData(sheet);

  if (commonData.pricePerPiece === cannotCalculateText) {
    spreadsheet.toast('Niektóre pola nie są uzupełnione', 'Nie można drukować', 3);
    return;
  }
  if (!checkPrinterConnected()) {
    spreadsheet.toast('Drukarka nie jest połączona', 'Włącz usługę drukowania na komputerze', 3);
    return;
  }

  const template = HtmlService
    .createTemplateFromFile("PrintPrompt");
  template.sheetData = getCommonData(sheet);
  template.people = listPeople(sheet);
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
