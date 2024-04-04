const Chat = require('../models/chats').Chat;
const ChatTypes = require('../models/chats').ChatTypes;
const db = require('../util/database');

class GroupChats extends Chat {
    constructor({id, group_Pic, description, join_Link, link_Expiry, name}) {
        super({id: id, type: ChatTypes.group});
        this.group_Pic = group_Pic;
        this.description = description;
        this.join_Link = join_Link || null;
        this.link_Expiry = link_Expiry || null;
        this.name = name;
    }

    async save() {
        if(!this.name) return false;
        try {
            this.id = await super.save();
            await db.execute('INSERT INTO Group_Chats (id, group_Pic, description, join_Link, link_Expiry, name) values(?, ?, ?, ?, ?, ?)', [this.id, this.group_Pic, this.description, this.join_Link, this.link_Expiry, this.name]);
        } catch(err) {
            return false;
        }
        return await GroupChats.findAllChats({id: this.id});
    }

    static async findAllChats({user_Id, id, join_Link}) {
        let query, join = '', params = [];
        let chats;
        if(user_Id) {
            join = 'LEFT JOIN Group_Members AS gm ON (gm.group_Id=gc.id)';
            query = 'gm.user_Id=?';
            params.push(user_Id);
        }
        else if(id) {
            query = 'gc.id=?';
            params.push(id);
        }
        else if(join_Link) {
            query = 'gc.join_Link=?';
            params.push(join_Link);
        }
        try{
            [chats] = await db.execute(`
                SELECT gc.id, gc.group_Pic, gc.description, gc.join_Link, gc.link_Expiry, gc.name 
                FROM Group_Chats AS gc 
                ${join}
                WHERE ${query}`, 
                params
            );
        } catch(err) {
            return false;
        }
        return chats.map(value => new GroupChats({id: value.id, join_Link: value.join_Link, link_Expiry: value.link_Expiry, group_Pic: value.group_Pic, description: value.description, name: value.name}));
    }

    static async update({id, group_Pic, description, join_Link, link_Expiry, name}) {
        let query = '', params = [];
        if(!id) {
            return false;
        }
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
        if(!params.length) {
            return false;
        }
        params.push(id);
        query = query.slice(0, -1);
        try{
            await db.execute(`UPDATE Group_Chats SET ${query} WHERE id=?`, params);
        } catch(err) {
            return false;
        }
        return true;
    }
}

module.exports = GroupChats;