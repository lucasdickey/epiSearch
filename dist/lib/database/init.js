"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
var pg_1 = require("pg");
var config_1 = require("../config");
var pool = new pg_1.Pool({
    connectionString: config_1.config.databaseUrl,
});
function initializeDatabase() {
    return __awaiter(this, void 0, void 0, function () {
        var client, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, pool.connect()];
                case 1:
                    client = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 11, 13, 14]);
                    // Begin transaction
                    return [4 /*yield*/, client.query("BEGIN")];
                case 3:
                    // Begin transaction
                    _a.sent();
                    // Create podcasts table
                    return [4 /*yield*/, client.query("\n      CREATE TABLE IF NOT EXISTS podcasts (\n        id SERIAL PRIMARY KEY,\n        name TEXT NOT NULL,\n        description TEXT,\n        url TEXT\n      )\n    ")];
                case 4:
                    // Create podcasts table
                    _a.sent();
                    // Create episodes table
                    return [4 /*yield*/, client.query("\n      CREATE TABLE IF NOT EXISTS episodes (\n        id SERIAL PRIMARY KEY,\n        podcast_id INTEGER REFERENCES podcasts(id) ON DELETE CASCADE,\n        title TEXT NOT NULL,\n        description TEXT,\n        summary TEXT,\n        published_date DATE,\n        url TEXT,\n        audio_file_path TEXT\n      )\n    ")];
                case 5:
                    // Create episodes table
                    _a.sent();
                    // Create speakers table
                    return [4 /*yield*/, client.query("\n      CREATE TABLE IF NOT EXISTS speakers (\n        id SERIAL PRIMARY KEY,\n        name TEXT NOT NULL,\n        bio TEXT\n      )\n    ")];
                case 6:
                    // Create speakers table
                    _a.sent();
                    // Create episode_speakers table
                    return [4 /*yield*/, client.query("\n      CREATE TABLE IF NOT EXISTS episode_speakers (\n        episode_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,\n        speaker_id INTEGER REFERENCES speakers(id) ON DELETE CASCADE,\n        PRIMARY KEY (episode_id, speaker_id)\n      )\n    ")];
                case 7:
                    // Create episode_speakers table
                    _a.sent();
                    // Create transcript_chunks table
                    return [4 /*yield*/, client.query("\n      CREATE TABLE IF NOT EXISTS transcript_chunks (\n        id TEXT PRIMARY KEY,\n        episode_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,\n        content TEXT NOT NULL,\n        speaker_id INTEGER REFERENCES speakers(id) ON DELETE SET NULL,\n        start_time FLOAT NOT NULL,\n        end_time FLOAT NOT NULL,\n        embedding_id TEXT\n      )\n    ")];
                case 8:
                    // Create transcript_chunks table
                    _a.sent();
                    // Create indexes for faster queries
                    return [4 /*yield*/, client.query("\n      CREATE INDEX IF NOT EXISTS idx_episodes_podcast_id ON episodes(podcast_id);\n      CREATE INDEX IF NOT EXISTS idx_episode_speakers_episode_id ON episode_speakers(episode_id);\n      CREATE INDEX IF NOT EXISTS idx_episode_speakers_speaker_id ON episode_speakers(speaker_id);\n      CREATE INDEX IF NOT EXISTS idx_transcript_chunks_episode_id ON transcript_chunks(episode_id);\n      CREATE INDEX IF NOT EXISTS idx_transcript_chunks_speaker_id ON transcript_chunks(speaker_id);\n      CREATE INDEX IF NOT EXISTS idx_transcript_chunks_embedding_id ON transcript_chunks(embedding_id);\n    ")];
                case 9:
                    // Create indexes for faster queries
                    _a.sent();
                    // Commit transaction
                    return [4 /*yield*/, client.query("COMMIT")];
                case 10:
                    // Commit transaction
                    _a.sent();
                    console.log("Database initialized successfully");
                    return [3 /*break*/, 14];
                case 11:
                    error_1 = _a.sent();
                    // Rollback transaction on error
                    return [4 /*yield*/, client.query("ROLLBACK")];
                case 12:
                    // Rollback transaction on error
                    _a.sent();
                    console.error("Error initializing database:", error_1);
                    throw error_1;
                case 13:
                    client.release();
                    return [7 /*endfinally*/];
                case 14: return [2 /*return*/];
            }
        });
    });
}
// Run the initialization if this file is executed directly
if (require.main === module) {
    initializeDatabase()
        .then(function () { return process.exit(0); })
        .catch(function (error) {
        console.error("Database initialization failed:", error);
        process.exit(1);
    });
}
