const db = require("../util/database");

class User {
    User({phone_Num, email, password, profile_Pic, username, status}) {
        this.phone_Num = phone_Num;
        this.email = email;
        this.password = password;
        this.profile_Pic = profile_Pic
        this.username = username;
        this.status = status;
    }

    async save () {
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
        }catch(err) {
            return false;
        }
        return true;
    }
    
    static async find (phone_Num, email, id) {
        let user;
        try {
            [user] = await db.execute('SELECT * FROM Users WHERE phone_Num=? or email=? or id=?', [phone_Num, email, id]);
        }catch(err) {
            return false;
        }
        user = new User(user);
        return user;
    }
    
    static async delete (userId) {
        try {
            await db.execute('DELETE FROM Users WHERE id=?', [userId]);
        }catch(err) {
            return false;
        }
        return true;
    }
}
