const db = require("../util/database");

class User {
    User({phone_Num, email, password, profile_Pic, username, status, id, token_Expiry, password_Reset_Token}) {
        this.phone_Num = phone_Num;
        this.email = email;
        this.password = password;
        this.profile_Pic = profile_Pic;
        this.username = username;
        this.status = status;
        this.password_Reset_Token = password_Reset_Token;
        this.token_Expiry = token_Expiry;
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
    
    static async find({phone_Num, email, id, token}) {
        let user, query;
        if(phone_Num)
            query = 'phone_Num=?';
        else if(email)
            query = 'email=?';
        else if(id) 
            query = 'id=?';
        else
            query = 'token=?';

        try {
            [user] = await db.execute('SELECT * FROM Users WHERE ' + query, [phone_Num || email || id || token]);
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