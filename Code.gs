/**
 * ============================================================================
 * BLACKOUT LEAGUE MANAGER - BACKEND (Google Apps Script)
 * ============================================================================
 */

// De definitie van alle tabbladen en hun kolomkoppen
const DATABASE_SCHEMA = {
  League: ['id', 'name', 'level', 'is_visible'],
  Team: ['id', 'league_id', 'parent_team_id', 'name', 'short_name', 'color', 'division_id'],
  Player: ['id', 'current_team_id', 'first_name', 'last_name', 'jersey_number', 'position', 'xp', 'status', 'stick_model', 'training_total', 'training_attended', 'games_played'],
  Game: ['id', 'league_id', 'home_team_id', 'away_team_id', 'status', 'current_period', 'period_time_remaining', 'home_score', 'away_score', 'home_shots', 'away_shots', 'game_type', 'venue', 'scheduled_date'],
  GameEvent: ['id', 'game_id', 'team_id', 'player_id', 'assist1_player_id', 'assist2_player_id', 'event_type', 'period', 'game_time', 'goal_type', 'penalty_minutes', 'penalty_type', 'description'],
  GameSetting: ['id', 'league_id', 'settings_json'],
  Division: ['id', 'league_id', 'name'],
  User: ['id', 'name', 'email', 'role'],
  RSVP: ['id', 'game_id', 'player_id', 'status'],
  Season: ['id', 'league_id', 'name', 'start_date', 'end_date']
};

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Blackout League Manager')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * 2. DATABASE INSTALLATIE
 */
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  for (const [sheetName, headers] of Object.entries(DATABASE_SCHEMA)) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    } else {
      const existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).getValues()[0];
      if (existingHeaders.join(',') !== headers.join(',')) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      }
    }
  }
}

/**
 * 3. DATABASE ENGINE
 */
function _getSheetData(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error(`Sheet ${sheetName} not found!`);
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2) return [];
  const data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = data[0];
  const rows = data.slice(1);
  return rows.map(row => {
    let obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] === "" ? null : row[index];
    });
    return obj;
  });
}

function _list(sheetName) { return _getSheetData(sheetName); }
function _get(sheetName, id) { return _getSheetData(sheetName).find(item => item.id === id) || null; }
function _filter(sheetName, params) {
  let data = _getSheetData(sheetName);
  for (const [key, value] of Object.entries(params)) {
    data = data.filter(item => item[key] == value);
  }
  return data;
}

function _create(sheetName, dataObj) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const headers = DATABASE_SCHEMA[sheetName];
  if (!dataObj.id) dataObj.id = Utilities.getUuid();
  const rowArray = headers.map(header => dataObj[header] !== undefined ? dataObj[header] : null);
  sheet.appendRow(rowArray);
  return dataObj;
}

function _update(sheetName, dataObj) {
  if (!dataObj.id) throw new Error("ID is required for update");
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const headers = DATABASE_SCHEMA[sheetName];
  const data = sheet.getDataRange().getValues();
  const idIndex = headers.indexOf('id');

  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === dataObj.id) {
      const rowIndex = i + 1;
      const newRow = headers.map((header, colIndex) => {
        return dataObj[header] !== undefined ? dataObj[header] : data[i][colIndex];
      });
      sheet.getRange(rowIndex, 1, 1, headers.length).setValues([newRow]);
      return _get(sheetName, dataObj.id);
    }
  }
  throw new Error(`Record met id ${dataObj.id} niet gevonden in ${sheetName}`);
}

function _delete(sheetName, id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const idIndex = DATABASE_SCHEMA[sheetName].indexOf('id');
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === id) {
      sheet.deleteRow(i + 1);
      return { success: true, message: `Record deleted` };
    }
  }
  return { success: false, message: `Record not found` };
}

/**
 * SPECIALE FUNCTIE VOOR GAME SETTINGS
 */
function GameSetting_save(data) {
  const existing = _filter('GameSetting', { league_id: data.league_id });
  if (existing.length > 0) {
    data.id = existing[0].id;
    return _update('GameSetting', data);
  } else {
    return _create('GameSetting', data);
  }
}

function GameSetting_get(league_id) {
  const existing = _filter('GameSetting', { league_id: league_id });
  return existing.length > 0 ? existing[0] : null;
}

/**
 * 4. EXPOSED API ENDPOINTS
 */
function League_list() { return _list('League'); }
function League_get(id) { return _get('League', id); }
function League_filter(params) { return _filter('League', params); }
function League_create(data) { return _create('League', data); }
function League_update(data) { return _update('League', data); }
function League_delete(id) { return _delete('League', id); }

function Team_list() { return _list('Team'); }
function Team_get(id) { return _get('Team', id); }
function Team_filter(params) { return _filter('Team', params); }
function Team_create(data) { return _create('Team', data); }
function Team_update(data) { return _update('Team', data); }
function Team_delete(id) { return _delete('Team', id); }

function Player_list() { return _list('Player'); }
function Player_get(id) { return _get('Player', id); }
function Player_filter(params) { return _filter('Player', params); }
function Player_create(data) { return _create('Player', data); }
function Player_update(data) { return _update('Player', data); }
function Player_delete(id) { return _delete('Player', id); }

function Game_list() { return _list('Game'); }
function Game_get(id) { return _get('Game', id); }
function Game_filter(params) { return _filter('Game', params); }
function Game_create(data) { return _create('Game', data); }
function Game_update(data) { return _update('Game', data); }
function Game_delete(id) { return _delete('Game', id); }

function GameEvent_list() { return _list('GameEvent'); }
function GameEvent_get(id) { return _get('GameEvent', id); }
function GameEvent_filter(params) { return _filter('GameEvent', params); }
function GameEvent_create(data) { return _create('GameEvent', data); }
function GameEvent_update(data) { return _update('GameEvent', data); }
function GameEvent_delete(id) { return _delete('GameEvent', id); }

function Division_list() { return _list('Division'); }
function Division_get(id) { return _get('Division', id); }
function Division_filter(params) { return _filter('Division', params); }
function Division_create(data) { return _create('Division', data); }
function Division_update(data) { return _update('Division', data); }
function Division_delete(id) { return _delete('Division', id); }

function User_list() { return _list('User'); }
function User_get(id) { return _get('User', id); }
function User_filter(params) { return _filter('User', params); }
function User_create(data) { return _create('User', data); }
function User_update(data) { return _update('User', data); }
function User_delete(id) { return _delete('User', id); }

function RSVP_list() { return _list('RSVP'); }
function RSVP_get(id) { return _get('RSVP', id); }
function RSVP_filter(params) { return _filter('RSVP', params); }
function RSVP_create(data) { return _create('RSVP', data); }
function RSVP_update(data) { return _update('RSVP', data); }
function RSVP_delete(id) { return _delete('RSVP', id); }

function Season_list() { return _list('Season'); }
function Season_get(id) { return _get('Season', id); }
function Season_filter(params) { return _filter('Season', params); }
function Season_create(data) { return _create('Season', data); }
function Season_update(data) { return _update('Season', data); }
function Season_delete(id) { return _delete('Season', id); }

function getDriveImageBase64(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    const blob = file.getBlob();
    return `data:${blob.getContentType()};base64,${Utilities.base64Encode(blob.getBytes())}`;
  } catch (e) { return null; }
}
