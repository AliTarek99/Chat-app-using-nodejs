const db = require('../util/database');

class Group{
    Group({group_Pic, description, join_Link, link_Expiry, name}) {
        this.group_Pic = group_Pic;
        this.description = description;
        this.join_Link = join_Link;
        this.link_Expiry = link_Expiry;
        this.name = name;
    }

    async save() {
        try {
            await db.execute('INSERT INTO Groups (group_Pic, description, join_Link, link_Expiry, name) values(?, ?, ?, ?, ?)', 
                [
                    this.group_Pic, 
                    this.description, 
                    this.join_Link, 
                    this.link_Expiry, 
                    this.name
                ]
            );
        } catch(err) {
            return false;
        }
        return true;
    }

    static async find(groupId, groupLink) {
        let group = null;
        try {
            if(groupId) {
                [group] = await db.execute('SELECT * FROM Groups WHERE id=?', [groupId]);
            }
            else if(groupLink) {
                [group] = await db.execute('SELECT * FROM Groups WHERE join_Link=?', [groupLink]);
            }
        } catch(err) {
            return false;
        }
        if(group)
            group = new Group(group);
        return group;
    }

    static async delete(groupId) {
        try {
            db.execute('DELETE FROM Groups WHERE id=?', [groupId]);
        } catch(err) {
            return false;
        }
        return true;
    }
}