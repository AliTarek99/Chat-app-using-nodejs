const db = require('../util/database');

class GroupMember {
    GroupMember({group_Id, user_Id, admin}) {
        this.group_Id = group_Id;
        this.user_Id = user_Id;
        this.admin = admin;
    }

    async save() {
        try{
            await db.execute('INSERT INTO Group_Members (group_Id, user_Id, admin) values(?, ?, ?)', [this.group_Id, this.user_Id, this.admin]);
        } catch(err) {
            return false;
        }
        return true;
    }

    static async delete(group_Id, user_Id) {
        try{
            await db.execute('DELETE FROM Group_Memebers WHERE group_Id=? AND user_Id=?', [group_Id, user_Id]);
        } catch(err) {
            return false;
        }
        return true;
    }

    static async find(group_Id) {
        let members;
        try {
            [members] = await db.execute('SELECT * FROM Group_Memebers AS GM LEFT JOIN Users AS U ON GM.user_Id = U.id WHERE group_Id=?', [group_Id]);
        } catch(err) {
            return false;
        }
        if(members) {
            members = members.map(value => new GroupMember(value));
        }
        return members;
    }
}