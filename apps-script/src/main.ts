// noinspection JSUnusedLocalSymbols

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
  qrContentTemplate: 'P3',
  data: 'A1:K',
  summary: 'M1:N',
};
const cannotCalculateText = 'Nie można obliczyć';

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Pizza')
      // .addItem('Send webhook', 'sendWebhook')
      .addItem('Print receipts', 'showPrintDialog')
      .addItem('Add person', 'testAddPerson')
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

function findOrderColumns(sheet: Sheet) {
  const range = sheet.getRange(positions.data);
  const columns = findColumns(range, {
    name: 'Imię i nazwisko',
    pieces: 'Kawałki',
    piecesPrice: 'Cena kawałków',
    totalPrice: 'Do zapłaty',
    drink: 'Napój',
  });
  return {range, columns};
}

function listOrders(sheet: Sheet): ReceiptDataPerson[] {
  const {range, columns} = findOrderColumns(sheet);
  const people: ReceiptDataPerson[] = [];
  for (let i = 2; i <= range.getHeight(); ++i) {
    const personName = range.getCell(i, columns.name).getDisplayValue();
    if (personName !== '') {
      const totalPriceCell = range.getCell(i, columns.totalPrice);
      let drink: 'own-cup' | 'single-use-cup' | null;
      switch (range.getCell(i, columns.drink).getValue()) {
        case 'Własny kubek':
          drink = 'own-cup';
          break;
        case 'Jednorazowy kubek':
          drink = 'single-use-cup';
          break;
        default:
          drink = null;
          break;
      }
      people.push({
        personName,
        pieces: range.getCell(i, columns.pieces).getValue(),
        piecesPrice: range.getCell(i, columns.piecesPrice).getDisplayValue(),
        totalPrice: totalPriceCell.getDisplayValue(),
        drink,
        qrContent: sheet.getRange(positions.qrContentTemplate).getValue().replace('{price}', zeroPad(Math.round(totalPriceCell.getValue() * 100), 6))
      });
    }
  }
  return people;
}

function getCommonData(sheet: Sheet): ReceiptDataCommon {
  const range = sheet.getRange(positions.summary);
  const rows = findRows(range, {
    pricePerPiece: 'Opłata za kawałek',
    drinkFee: 'Opłata za napoje',
    cupFee: 'Opłata za kubek',
    additionalFee: 'Opłata dodatkowa',
    receiver: 'Odbiorca',
    account: 'Konto bankowe',
    phone: 'Numer telefonu',
    date: 'Data',
  });
  return {
      pricePerPiece: rows.pricePerPiece.getDisplayValue(),
      drinkFee: rows.drinkFee.getDisplayValue(),
      cupFee: rows.cupFee.getDisplayValue(),
      additionalFee: rows.additionalFee.getDisplayValue(),
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
    spreadsheet.toast('Nie można obliczyć ceny za kawałek', 'Nie można drukować', 3);
    return;
  }
  if (commonData.drinkFee === cannotCalculateText) {
    spreadsheet.toast('Nie można obliczyć opłaty za napoje', 'Nie można drukować', 3);
    return;
  }
  if (!checkPrinterConnected()) {
    spreadsheet.toast('Drukarka nie jest połączona', 'Włącz usługę drukowania na komputerze', 3);
    return;
  }

  const template = HtmlService
    .createTemplateFromFile("PrintPrompt");
  template.sheetData = getCommonData(sheet);
  template.people = listOrders(sheet);
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

interface Person {
  name: string,
  discordId: string,
  className: string,
}

function getPeople(): {values: Person[], range: Range} {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName("Osoby");
  if (sheet === null) throw new Error('Sheet not found');
  const range = sheet.getRange("A2:C");
  const values = range.getValues().map(
      (el: (string | number | Date)[]) => ({
        name: el[0].toString().trim(),
        discordId: el[1].toString().trim(),
        className: el[2].toString().trim(),
      }),
  );
  return {range, values};
}

function addPerson(name: string, discordId: string, className: string): 'name-exists' | 'discord-id-exists' | 'added-discord-id' | 'ok' {
  const {values, range} = getPeople();
  if (values.some((el) => el.discordId === discordId)) return 'discord-id-exists';
  let rowIndex = values.findIndex(({name: elName}) => elName === name);
  if (rowIndex === -1) {
    let row: {name: string, discordId: string, className: string};
    do {
      rowIndex += 1;
      row = values[rowIndex];
    } while (`${row.name}${row.discordId}${row.className}` !== '')
    range.getCell(rowIndex + 1, 1).setValue(name);
    range.getCell(rowIndex + 1, 2).setValue(discordId);
    range.getCell(rowIndex + 1, 3).setValue(className);
    return 'ok';
  }
  const row = values[rowIndex];
  if (row.discordId === discordId) return 'name-exists';
  range.getCell(rowIndex + 1, 2).setValue(discordId);
  range.getCell(rowIndex + 1, 3).setValue(className);
  return 'added-discord-id';
}

function getPersonByDiscordId(discordId: string): Person | null {
  const {values} = getPeople();
  return values.find((person) => person.discordId === discordId) ?? null;
}

function getSpreadsheetOfToday(): Sheet | null {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(new Date().toISOString().split("T")[0]);
}

function order(discordId: string, drink: string): 'no-spreadsheet' | 'unknown-user' | 'ok' {
  const person = getPersonByDiscordId(discordId);
  if (person === null) return 'unknown-user';
  const sheet = getSpreadsheetOfToday();
  if (sheet === null) return 'no-spreadsheet';

  const orders = listOrders(sheet);
  let index = orders.findIndex((order) => order.personName === person.name) + 1;
  const {range, columns} = findOrderColumns(sheet);
  if (index === 0) {
    index = 1;
    while (range.getCell(index + 1, columns.name).getValue() !== '') ++index;
    range.getCell(index + 1, columns.name).setValue(person.name);
  }
  range.getCell(index + 1, columns.drink).setValue(drink);
  return 'ok';
}

function complete(
    discordId: string,
    pieces: number,
): {code: 'no-spreadsheet' | 'unknown-user' | 'no-order'} | {code: 'ok', totalPrice: string} {
  const person = getPersonByDiscordId(discordId);
  if (person === null) return {code: 'unknown-user'};
  const sheet = getSpreadsheetOfToday();
  if (sheet === null) return {code: 'no-spreadsheet'};

  const orders = listOrders(sheet);
  let index = orders.findIndex((order) => order.personName === person.name) + 1;
  const {range, columns} = findOrderColumns(sheet);
  if (index === 0) return {code: 'no-order'};
  range.getCell(index + 1, columns.pieces).setValue(pieces);
  return {code: 'ok', totalPrice: range.getCell(index+1, columns.totalPrice).getDisplayValue()};
}
