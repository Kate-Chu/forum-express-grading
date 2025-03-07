const { Restaurant, Category, Comment, User } = require('../../models')
const restaurantServices = require('../../services/restaurant-services')
// const { Sequelize } = require('sequelize')
// const sequelize = new Sequelize('sqlite::memory:')

const restaurantController = {
  getRestaurants: (req, res, next) => {
    restaurantServices.getRestaurants(req, (err, data) => err ? next(err) : res.render('restaurants', data))
  },
  getRestaurant: (req, res, next) => {
    return Restaurant.findByPk(req.params.id, {
      include: [
        Category,
        { model: Comment, include: User },
        { model: User, as: 'FavoritedUsers' },
        { model: User, as: 'LikedUsers' }
      ]
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        restaurant.increment('view_count')
        const isFavorited = restaurant.FavoritedUsers.some(f => f.id === req.user.id)
        const isLiked = restaurant.LikedUsers.some(l => l.id === req.user.id)
        res.render('restaurant', {
          restaurant: restaurant.toJSON(),
          isFavorited,
          isLiked
        })
      })
      .catch(err => next(err))
  },
  getDashboard: (req, res, next) => {
    return Restaurant.findByPk(req.params.id, {
      include: Category,
      raw: true,
      nest: true
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        res.render('dashboard', {
          restaurant
        })
      })
      .catch(err => next(err))
  },
  getFeeds: (req, res, next) => {
    return Promise.all([
      Restaurant.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [Category],
        raw: true,
        nest: true
      }),
      Comment.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [User, Restaurant],
        raw: true,
        nest: true
      })
    ])
      .then(([restaurants, comments]) => {
        res.render('feeds', {
          restaurants,
          comments
        })
      })
      .catch(err => next(err))
  },
  getTopRestaurants: (req, res, next) => {
    return Restaurant.findAll({ include: [{ model: User, as: 'FavoritedUsers' }] })
      .then(restaurants => {
        restaurants = restaurants.map(restaurant => ({
          ...restaurant.toJSON(),
          favoritedCount: restaurant.FavoritedUsers.length,
          isFavorited: req.user?.FavoritedRestaurants?.some(f => f.id === restaurant.id) || []
        }))
        restaurants = restaurants.sort((a, b) => b.favoritedCount - a.favoritedCount).slice(0, 10)
        return res.render('top-restaurants', { restaurants: restaurants })
      })
      .catch(err => next(err))
  }
  // getTopRestaurants: (req, res, next) => {
  //   return Restaurant.findAll({
  //     include: {
  //       model: User,
  //       as: 'FavoritedUsers',
  //       attributes: [
  //         'id'
  //       ],
  //       duplicating: false
  //     },
  //     attributes: [
  //       'id', 'name', 'image', 'description',
  //       [sequelize.fn('COUNT', sequelize.col('FavoritedUsers.id')), 'favoritedCount']
  //     ],
  //     group: 'id',
  //     order: [[sequelize.col('favoritedCount'), 'DESC']],
  //     limit: 10
  //   })
  //     .then(restaurants => {
  //       restaurants = restaurants.map(restaurant => ({
  //         ...restaurant.toJSON(),
  //         favoritedCount: restaurant.FavoritedUsers.length,
  //         isFavorited: req.user?.FavoritedRestaurants?.some(f => f.id === restaurant.id) || []
  //       }))
  //       return res.render('top-restaurants', { restaurants: restaurants })
  //     })
  //     .catch(err => next(err))
  // }
}

module.exports = restaurantController
