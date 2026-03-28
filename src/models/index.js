const sequelize = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const ProductImage = require('./ProductImage');
const ProductOption = require('./ProductOption');
const ProductCategory = require('./ProductCategory');

// Product <-> Category (many-to-many)
Product.belongsToMany(Category, {
  through: ProductCategory,
  foreignKey: 'product_id',
  otherKey: 'category_id',
});
Category.belongsToMany(Product, {
  through: ProductCategory,
  foreignKey: 'category_id',
  otherKey: 'product_id',
});

// Product -> Images e Options (one-to-many)
Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'images' });
ProductImage.belongsTo(Product, { foreignKey: 'product_id' });

Product.hasMany(ProductOption, { foreignKey: 'product_id', as: 'options' });
ProductOption.belongsTo(Product, { foreignKey: 'product_id' });

module.exports = {
  sequelize,
  User,
  Category,
  Product,
  ProductImage,
  ProductOption,
  ProductCategory,
};