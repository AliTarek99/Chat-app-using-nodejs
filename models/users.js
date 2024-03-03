const db = require("../util/database");

exports.addUser = async (number, email, password, profile_Pic, username, status) => {
    try {
        await db.execute('INSERT INTO USERS phone_Num=?, email=?, password=?, profile_Pic=?, username=?, status=?', [number, email, password, profile_Pic, username, status]);
    }catch(err) {
        return false;
    }
    return true;
}

exports.findUser = async (number, email, id) => {
    let user;
    try {
        user = await db.execute('SELECT * FROM USERS WHERE phone_Num=? or email=? or id=?', [number, email, id]);
    }catch(err) {
        return false;
    }
    return user;
}

exports.deleteUser = async (userId) => {
    try {
        user = await db.execute('DELETE FROM USERS WHERE id=?', [userId]);
    }catch(err) {
        return false;
    }
    return true;
}

exports.updateUser = async (userId, number, email, password, profile_Pic, username, status) => {
    let tmp = [], query = '';
    if(number) {
        query += 'number=?,';
        tmp.push(number);
    }
    if(email) {
        query += 'email=?,';
        tmp.push(email);
    }
    if(password) {
        query += 'password=?,';
        tmp.push(password);
    }
    if(profile_Pic) {
        query += 'profile_Pic=?,';
        tmp.push(profile_Pic);
    }
    if(username) {
        query += 'username=?,';
        tmp.push(username);
    }
    if(status) {
        query += 'status=?,';
        tmp.push(status);
    }
    query = query.slice(0, query.length - 2);
    tmp.push(userId);
    try {
        await db.execute(`UPDATE SET ${query} WHERE id=?`, tmp);
    }catch(err) {
        return false;
    }
    return true;
}