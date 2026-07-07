/**
 * ============================================================================
 * BLACKOUT LEAGUE MANAGER - BACKEND (Google Apps Script)
 * ============================================================================
 */

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
  Season: ['id', 'league_id', 'name', 'start_date', 'end_date', 'status'],
  Lineup: ['id', 'game_id', 'team_id', 'lineup_json']
};

/**
 * 1. AUTHENTICATIE & AUTORISATIE (RBAC)
 */
function getUserInfo() {
  const email = Session.getActiveUser().getEmail();
  const users = _list('User');
  const user = users.find(u => u.email === email);
  return {
    email: email,
    role: user ? user.role : 'Guest',
    isAdmin: user ? user.role === 'Admin' : false,
    isScorekeeper: user ? (user.role === 'Admin' || user.role === 'Scorekeeper') : false
  };
}

function _checkAuth(requiredRole) {
  const auth = getUserInfo();
  if (requiredRole === 'Admin' && !auth.isAdmin) throw new Error("Toegang Geweigerd: Admin rechten vereist.");
  if (requiredRole === 'Scorekeeper' && !auth.isScorekeeper) throw new Error("Toegang Geweigerd: Scorekeeper rechten vereist.");
}

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Blackout League Manager')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  // Bypass check if User sheet doesn't exist (initial setup)
  if (ss.getSheetByName('User')) {
    _checkAuth('Admin');
  }

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
 * 3. DATABASE ENGINE (Met Caching voor snelheid)
 */
function _getSheetData(sheetName) {
  const cache = CacheService.getScriptCache();
  const cachedData = cache.get("data_" + sheetName);
  if (cachedData) return JSON.parse(cachedData);

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error(`Sheet ${sheetName} not found!`);
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2) return [];
  const data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = data[0];
  const rows = data.slice(1);
  const result = rows.map(row => {
    let obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] === "" ? null : row[index];
    });
    return obj;
  });

  // Cache voor 15 minuten
  try { cache.put("data_" + sheetName, JSON.stringify(result), 900); } catch(e) {}
  return result;
}

function _clearCache(sheetName) {
  try { CacheService.getScriptCache().remove("data_" + sheetName); } catch(e) {}
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
  _clearCache(sheetName);
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
      _clearCache(sheetName);
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
      _clearCache(sheetName);
      return { success: true, message: `Record deleted` };
    }
  }
  return { success: false, message: `Record not found` };
}

/**
 * SPECIALE FUNCTIE VOOR GAME SETTINGS
 */
function GameSetting_save(data) {
  _checkAuth('Admin');
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
 * 4. EXPOSED API ENDPOINTS (RBAC Beschermd)
 */
function League_list() { return _list('League'); }
function League_get(id) { return _get('League', id); }
function League_filter(params) { return _filter('League', params); }
function League_create(data) { _checkAuth('Admin'); return _create('League', data); }
function League_update(data) { _checkAuth('Admin'); return _update('League', data); }
function League_delete(id) { _checkAuth('Admin'); return _delete('League', id); }

function Team_list() { return _list('Team'); }
function Team_get(id) { return _get('Team', id); }
function Team_filter(params) { return _filter('Team', params); }
function Team_create(data) { _checkAuth('Admin'); return _create('Team', data); }
function Team_update(data) { _checkAuth('Admin'); return _update('Team', data); }
function Team_delete(id) { _checkAuth('Admin'); return _delete('Team', id); }

function Player_list() { return _list('Player'); }
function Player_get(id) { return _get('Player', id); }
function Player_filter(params) { return _filter('Player', params); }
function Player_create(data) { _checkAuth('Admin'); return _create('Player', data); }
function Player_update(data) { _checkAuth('Admin'); return _update('Player', data); }
function Player_delete(id) { _checkAuth('Admin'); return _delete('Player', id); }

function Game_list() { return _list('Game'); }
function Game_get(id) { return _get('Game', id); }
function Game_filter(params) { return _filter('Game', params); }
function Game_create(data) { _checkAuth('Admin'); return _create('Game', data); }
function Game_update(data) { _checkAuth('Scorekeeper'); return _update('Game', data); }
function Game_delete(id) { _checkAuth('Admin'); return _delete('Game', id); }

function GameEvent_list() {
  // Paginatie/Lazy Loading: Alleen laatste 50 events voor snelheid
  const all = _list('GameEvent');
  return all.slice(-50).reverse();
}
function GameEvent_all() { return _list('GameEvent'); }
function GameEvent_filter(params) { return _filter('GameEvent', params); }
function GameEvent_create(data) {
  _checkAuth('Scorekeeper');
  const event = _create('GameEvent', data);

  // Update Game score/shots automatically
  if (data.event_type === 'Goal' || data.event_type === 'Shot') {
    const game = _get('Game', data.game_id);
    if (game) {
      if (data.event_type === 'Goal') {
        if (data.team_id === game.home_team_id) game.home_score = (Number(game.home_score) || 0) + 1;
        else if (data.team_id === game.away_team_id) game.away_score = (Number(game.away_score) || 0) + 1;
      }
      if (data.team_id === game.home_team_id) game.home_shots = (Number(game.home_shots) || 0) + 1;
      else if (data.team_id === game.away_team_id) game.away_shots = (Number(game.away_shots) || 0) + 1;

      _update('Game', game);
    }
  }
  return event;
}
function GameEvent_delete(id) { _checkAuth('Scorekeeper'); return _delete('GameEvent', id); }

function Division_list() { return _list('Division'); }
function Division_create(data) { _checkAuth('Admin'); return _create('Division', data); }

function User_list() { _checkAuth('Admin'); return _list('User'); }
function User_create(data) { _checkAuth('Admin'); return _create('User', data); }

function RSVP_list() { return _list('RSVP'); }
function RSVP_filter(params) { return _filter('RSVP', params); }
function RSVP_create(data) {
  _checkAuth('Scorekeeper');
  const existing = _filter('RSVP', { game_id: data.game_id, player_id: data.player_id });
  if (existing.length > 0) {
    data.id = existing[0].id;
    return _update('RSVP', data);
  }
  return _create('RSVP', data);
}

function Season_list() { return _list('Season'); }
function Season_create(data) { _checkAuth('Admin'); return _create('Season', data); }
function Season_update(data) { _checkAuth('Admin'); return _update('Season', data); }

function Lineup_save(data) {
  _checkAuth('Scorekeeper');
  const existing = _filter('Lineup', { game_id: data.game_id, team_id: data.team_id });
  if (existing.length > 0) {
    data.id = existing[0].id;
    return _update('Lineup', data);
  }
  return _create('Lineup', data);
}
function Lineup_get(game_id, team_id) {
  const res = _filter('Lineup', { game_id: game_id, team_id: team_id });
  return res.length > 0 ? res[0] : null;
}

/**
 * ADMIN DATABASE OVERRIDE
 */
function Admin_RecordUpdate(sheetName, data) {
  _checkAuth('Admin');
  return _update(sheetName, data);
}
function Admin_RecordDelete(sheetName, id) {
  _checkAuth('Admin');
  return _delete(sheetName, id);
}

function getDriveImageBase64(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    const blob = file.getBlob();
    return `data:${blob.getContentType()};base64,${Utilities.base64Encode(blob.getBytes())}`;
  } catch (e) { return null; }
}
