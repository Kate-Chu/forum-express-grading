// const { Restaurant, Category } = require('../../models')
// const { getOffset, getPagination } = require('../../helpers/pagination-helper')
const restaurantServices = require('../../services/restaurant-services')

const restaurantController = {
  getRestaurants: (req, res, next) => {
    restaurantServices.getRestaurants(req, (err, data) => err ? next(err) : res.json(data))
  }
}

module.exports = restaurantController
