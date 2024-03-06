const Chat = require('../models/chats').Chat;
const ChatTypes = require('../models/chats').ChatTypes;
const db = require('../util/database');

class GroupChats extends Chat {
    PrivateChat({id, group_Pic, description, join_Link, link_Expiry, name}) {
        super({id: id, type: ChatTypes.group});
        this.group_Id = group_Id;
        this.group_Pic = group_Pic;
        this.description = description;
        this.join_Link = join_Link;
        this.link_Expiry = link_Expiry;
        this.name = name;
    }

    async save() {
        if(!this.user1_Id || !this.user2_Id) return false;
        try {
            this.id = await super.save();
            await db.execute('INSERT INTO Group_Chats (id, group_Pic, description, join_Link, link_Expiry, name) values(?, ?, ?, ?, ?, ?)', [this.id, this.user1_Id, this.user2_Id, this.group_Pic, this.description, this.join_Link, this.link_Expiry, this.name]);
        } catch(err) {
            return false;
        }
        return await PrivateChat.find({user1_Id: this.user1_Id, user2_Id: this.user2_Id});
    }

    static async findAllChats({user_Id, id}) {
        let query, params = [];
        let chats;
        if(user_Id) {
            query = 'gm.user_Id=?';
            params.push(user_Id);
        }
        else if(id) {
            query = 'gc.id=?';
            params.push(id);
        }
        try{
            [chats] = await db.execute(`
                SELECT gc.id, gc.group_Id, gc.group_Pic, gc.description, gc.join_Link, gc.name 
                FROM Group_Chats AS gc 
                LEFT JOIN Group_Members AS gm 
                ON (gm.user_Id=gc.id) 
                WHERE ` + query, 
                params
            );
        } catch(err) {
            return false;
        }
        return chats.map(value => new PrivateChat({user1_Id: value.user1_Id, user2_Id: value.user2_Id, id: value.id}));
    }

    static async update({id, group_Pic, description, join_Link, link_Expiry, name}) {
        let query = '', params = [];
        if(group_Pic) {
            query += 'group_Pic=?,'
            params.push(group_Pic);
        }
        if(description) {
            query += 'description=?,'
            params.push(description);
        }
        if(join_Link) {
            query += 'join_Link=?,'
            params.push(join_Link);
        }
        if(link_Expiry) {
            query += 'link_Expiry=?,'
            params.push(link_Expiry);
        }
        if(name) {
            query += 'name=?,'
            params.push(name);
        }
        else {
            return false;
        }
        params.push(id);
        query = query.slice(0, -1);
        try{
            await db.execute(`UPDATE Group_Chats ${query} WHERE id=?`, params);
        } catch(err) {
            return false;
        }
        return true;
    }
}

module.exports = GroupChats;