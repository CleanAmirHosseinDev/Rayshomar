// const UserModel = require('../Test-Legacy/model/user')
const { UnauthenticatedError } = require('../errors/index')
const jwt = require('jsonwebtoken')

const auth = async (req, res, next) => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthenticatedError('Invalid authentication')
    }

    const token = authHeader.split(' ')[1]
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET)
        req.user = { userId: payload.userId, email: payload.email }
        next()
    } catch (error) {
        throw new UnauthenticatedError('Invalid authentication')
    }

}

module.exports = auth