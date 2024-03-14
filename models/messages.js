const db = require("../util/database");

class Message {
    constructor({chat_Id, message, voice, image, id, sender_Id}) {
        this.chat_Id = chat_Id;
        this.message = message;
        this.voice = voice;
        this.image = image;
        this.id = id;
        this.sender_Id = sender_Id;
    }

    async save() {
        try{
            let insertId = await db.execute('INSERT INTO Messages chat_id=?, message=?, image=?, voice=?, createdAt=?, sender_Id=?', [this.chat_Id, this.message, this.image, this.voice, new Date(), this.sender_Id]);
            this.id = insertId[0].insertId;
        }catch(err) {
            return false;
        }
        return true;
    }
    
    static async delete(messageID) {
        try{
            await db.execute('DELETE FROM Messages WHERE id=?', [messageID]);
        }catch(err) {
            return false;
        }
        return true;
    }
    
    static async getChat(chat_Id, limit, skip) {
        limit = limit || 100;
        skip = skip || 0;
        let messages;
        try{
            [messages] = await db.execute('SELECT Messages.*, Users.username as sender_name FROM Messages LEFT JOIN Users ON USERS.id=senderid WHERE chat_id=? LIMIT ? OFFSET ? ORDER BY createdAt DESC', [chat_Id, limit, skip]);
        }catch(err) {
            return false;
        }
        return messages
    }
}

module.exports = Message;