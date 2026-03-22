// Google Apps Script — Deploy as Web App
// Sheet: "Rides" columns: id | name | phone | direction | date | time | seats | vehicle | createdAt
// Sheet: "Requests" columns: id | rideId | passengerName | passengerPhone | status | requestedAt
//
// SETUP:
// 1. Go to https://sheets.google.com → Create a new spreadsheet
// 2. Rename "Sheet1" to "Rides", create a second sheet named "Requests"
// 3. Add headers in row 1 for each sheet (see columns above)
// 4. Go to Extensions → Apps Script
// 5. Paste this entire file, save, then Deploy → New Deployment → Web App
//    - Execute as: Me
//    - Who has access: Anyone
// 6. Copy the deployment URL and paste it into the app's Settings dialog

function doGet(e) {
  var action = e.parameter.action;
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (action === "getRides") {
    return jsonResponse(sheetToArray(ss.getSheetByName("Rides")));
  }

  if (action === "getRequests") {
    var rideId = e.parameter.rideId;
    var all = sheetToArray(ss.getSheetByName("Requests"));
    if (rideId) all = all.filter(function(r) { return r.rideId === rideId; });
    return jsonResponse(all);
  }

  return jsonResponse({ error: "Unknown action" });
}

function doPost(e) {
  var body = JSON.parse(e.postData.contents);
  var action = body.action;
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (action === "addRide") {
    var sheet = ss.getSheetByName("Rides");
    var id = Utilities.getUuid();
    var now = new Date().toISOString();
    sheet.appendRow([id, body.name, body.phone, body.direction, body.date, body.time, body.seats, body.vehicle || "Car", now]);
    return jsonResponse({ id: id, createdAt: now });
  }

  if (action === "deleteRide") {
    var sheet = ss.getSheetByName("Rides");
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === body.id && rows[i][2] === body.phone) {
        sheet.deleteRow(i + 1);
        // Also delete related requests
        deleteRequestsByRideId(ss, body.id);
        return jsonResponse({ success: true });
      }
    }
    return jsonResponse({ error: "Not found or phone mismatch" });
  }

  if (action === "addRequest") {
    var sheet = ss.getSheetByName("Requests");
    var id = Utilities.getUuid();
    var now = new Date().toISOString();
    sheet.appendRow([id, body.rideId, body.passengerName, body.passengerPhone, "pending", now]);
    return jsonResponse({ id: id, requestedAt: now });
  }

  if (action === "updateRequest") {
    var sheet = ss.getSheetByName("Requests");
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === body.id) {
        sheet.getRange(i + 1, 5).setValue(body.status);
        return jsonResponse({ success: true });
      }
    }
    return jsonResponse({ error: "Request not found" });
  }

  return jsonResponse({ error: "Unknown action" });
}

function deleteRequestsByRideId(ss, rideId) {
  var sheet = ss.getSheetByName("Requests");
  var rows = sheet.getDataRange().getValues();
  for (var i = rows.length - 1; i >= 1; i--) {
    if (rows[i][1] === rideId) sheet.deleteRow(i + 1);
  }
}

function sheetToArray(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  return data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
