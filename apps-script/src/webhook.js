const webhookUrl = 'https://discord.com/api/webhooks/902185237679837305/fgkZCjYvnTW2Usbj49Y3knNboSjXkt_R7eCg1r709irLf1zt4r7uqHAVNVH2hvIORKdj';

function getSheetUrl() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getActiveSheet();
  return `${spreadsheet.getUrl()}#gid=${sheet.getSheetId()}`;
}

// function sendWebhook() {
//   const sheet = SpreadsheetApp.getActive();
//   console.log(sheet.getSheetName());
//   const data = {
//     "embeds": [
//       {
//         "title": `Pizza ${sheet.getRange('H7').getDisplayValue()}`,
//         "fields": [
//           { "name": "Łączna kwota", "value": sheet.getRange('H3').getDisplayValue() },
//           { "name": "Kwota na osobę", "value": sheet.getRange('H5').getDisplayValue() },
//           { "name": "Liczba osób", "value": sheet.getRange('H4').getDisplayValue() },
//           { "name": "Odbiorca", "value": sheet.getRange('H8').getDisplayValue() },
//           { "name": "Konto bankowe", "value": sheet.getRange('H9').getDisplayValue() },
//           { "name": "Numer telefonu", "value": sheet.getRange('H10').getDisplayValue() }
//         ],
//         url: getSheetUrl(),
//         color: 288456,
//       }
//     ]
//   }
//   if (sheet.getRange('H5').getValue() !== 0) {
//     data.embeds[0].image = {
//       url: sheet.getRange('J6').getValue(),
//     };
//   }
//   console.log(JSON.stringify(data));
//   UrlFetchApp.fetch(webhookUrl, {
//     'method' : 'post',
//     'contentType': 'application/json',
//     'payload' : JSON.stringify(data)
//   })
// }
