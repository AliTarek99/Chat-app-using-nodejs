const db = require("../util/database");

exports.insertMessage = async (chatID, message, voice, images) => {
    try{
        await db.execute('INSERT INTO Messages chat_id=?, message=?, image=?, voice=?, createdAt=?', [chatID, message, images, voice, new Date()]);
    }catch(err) {
        return false;
    }
    return true;
}

exports.deleteImage = async (messageID) => {
    try{
        await db.execute('DELETE FROM Messages WHERE id=?', [messageID]);
    }catch(err) {
        return false;
    }
    return true;
}

exports.getMessages = async (chatID, limit, skip) => {
    limit = limit || 100;
    skip = skip || 0;
    try{
        records = await db.execute('SELECT * FROM Messages WHERE chat_id=? LIMIT ? OFFSET ?', [chatID, limit, skip]);
    }catch(err) {
        return false;
    }
    return records
}