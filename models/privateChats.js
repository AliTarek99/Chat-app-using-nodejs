const Chat = require('../models/chats').Chat;
const ChatTypes = require('../models/chats').ChatTypes;
const db = require('../util/database');

class PrivateChat extends Chat {
    constructor({user1_Id, user2_Id, id}) {
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
        return await PrivateChat.findAllChats({sender: this.user1_Id, id: this.id});
    }

    static async findAllChats({sender, id, recipient}) {
        let query = '', params = [];
        params.push(sender);
        if(id) {
            query = 'priv.id=?';
            params.push(id);
        }
        if(sender) {
            if(query.length) {
                query += ' AND ';
                query += '(priv.user1_Id=? OR priv.user2_Id=?)';
                params.push(sender);
                params.push(sender);
            }
            else {
                if(recipient) {
                    query = '((priv.user1_Id=? AND priv.user2_Id=?) OR (priv.user1_Id=? AND priv.user2_Id=?))';
                    params.push(sender);
                    params.push(recipient);
                    params.push(recipient);
                    params.push(sender);
                }
                else {
                    query += '(priv.user1_Id=? OR priv.user2_Id=?)';
                    params.push(sender);
                    params.push(sender);
                }
            }
        }
        if(!params.length) return false;
        let chats;
        try{
            [chats] = await db.execute('SELECT * FROM Private_Chats AS priv LEFT JOIN Users ON ((priv.user1_Id=Users.id OR priv.user2_Id=Users.id) AND Users.id!=?) WHERE ' + query, params);
        } catch(err) {
            return false;
        }
        return chats.map(value => {
            if(value.user1_Id == sender)
                delete value.user1_Id;
            else 
                delete value.user2_Id;
            return {
                user_Id: value.user1_Id || value.user2_Id, 
                id: value.id, 
                phone_Num: value.phone_Num,
                username: value.username,
                profile_Pic: value.profile_Pic,
            };
        });
    }
}

module.exports = PrivateChat;