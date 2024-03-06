const Chat = require('../models/chats').Chat;
const ChatTypes = require('../models/chats').ChatTypes;
const db = require('../util/database');

class PrivateChat extends Chat {
    PrivateChat({user1_Id, user2_Id, id}) {
        super({id: id, type: ChatTypes.private});
        this.user1_Id = user1_Id;
        this.user2_Id = user2_Id;
    }

    async save() {
        if(!this.user1_Id || !this.user2_Id) return false;
        try {
            this.id = await super.save();
            await db.execute('INSERT INTO Private_Chats (id, user1_Id, user2_Id) values(?, ?, ?)', [this.id, this.user1_Id, this.user2_Id]);
        } catch(err) {
            return false;
        }
        return await PrivateChat.findById({user1_Id: this.user1_Id, user2_Id: this.user2_Id});
    }

    static async findAllChats(sender, id) {
        let query, params = [];
        params.push(sender);
        if(id) {
            query = 'priv.id=?';
            params.push(id);
        }
        else if(sender) {
            query = 'priv.user1_Id=? OR priv.user2_Id=?';
            params.push(sender);
            params.push(sender);
        }
        else return false;
        let chats;
        try{
            [chats] = await db.execute('SELECT * FROM Private_Chats AS priv LEFT JOIN Users ON (priv.user1_Id=User.id OR priv.user2_Id=User.id AND User.id<>?) WHERE ' + query, params);
        } catch(err) {
            return false;
        }
        return chats.map(value => new PrivateChat({user1_Id: value.user1_Id, user2_Id: value.user2_Id, id: value.id}));
    }
}

module.exports = PrivateChat;