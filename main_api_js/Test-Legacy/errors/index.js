const CustomAPIError = require('./custom-error')
const UnauthenticatedError = require('./unauthentication')
const BadRequestError = require('./bad-request')
const NotFoundError = require('./not-found')

module.exports = {
    CustomAPIError,
    UnauthenticatedError,
    NotFoundError,
    BadRequestError,
}
