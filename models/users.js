const db = require("../util/database");

class User {
    User({phone_Num, email, password, profile_Pic, username, status, id}) {
        this.phone_Num = phone_Num;
        this.email = email;
        this.password = password;
        this.profile_Pic = profile_Pic;
        this.username = username;
        this.status = status;
        this.id = id;
    }

    async save() {
        try {
            await db.execute('INSERT INTO Users phone_Num=?, email=?, password=?, profile_Pic=?, username=?, status=?', 
                [
                    this.phone_Num, 
                    this.email, 
                    this.password, 
                    this.profile_Pic, 
                    this.username, 
                    this.status
                ]
            );
            return await find(undefined, this.email);
        }catch(err) {
            return false;
        }
    }
    
    static async find(phone_Num, email, id) {
        let user;
        try {
            [user] = await db.execute('SELECT * FROM Users WHERE phone_Num=? OR email=? OR id=?', [phone_Num, email, id]);
        }catch(err) {
            return false;
        }
        user = new User(user[0]);
        return user;
    }
    
    static async delete(userId) {
        try {
            await db.execute('DELETE FROM Users WHERE id=?', [userId]);
        }catch(err) {
            return false;
        }
        return true;
    }
}

module.exports = User;