const db = require("../util/database");

const ChatTypes = {
    group: 0,
    private: 1
};

class Chat {
    constructor({id, type}) {
        this.id = id;
        this.type = type
    }

    async save() {
        try {
           let insertId = await db.execute('INSERT INTO Chats (type) values(?)', [this.type]);
           this.id = insertId[0].insertId;
        } catch(err) {
            return false;
        }
        return this.id;
    }

    static async delete(chatId) {
        try {
            await db.execute('DELETE FROM Chats WHERE id=?', [chatId]);
        } catch(err) {
            return false;
        }
        return true;
    }
}

module.exports = {Chat: Chat, ChatTypes: ChatTypes};