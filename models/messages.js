const db = require("../util/database");

class Message {
    Message({chat_Id, message, voice, image}) {
        this.chat_Id = chat_Id;
        this.message = message;
        this.voice = voice;
        this.image = image;
    }

    async save() {
        try{
            await db.execute('INSERT INTO Messages chat_id=?, message=?, image=?, voice=?, createdAt=?', [this.chat_Id, this.message, this.image, this.voice, new Date()]);
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
            [messages] = await db.execute('SELECT * FROM Messages WHERE chat_id=? LIMIT ? OFFSET ?', [chat_Id, limit, skip]);
        }catch(err) {
            return false;
        }
        if(messages) {
            messages = messages.map(value => new Message(value));
        }
        return records
    }
}

module.exports = Message;