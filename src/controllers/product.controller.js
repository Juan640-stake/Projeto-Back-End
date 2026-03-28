const { Product, ProductImage, ProductOption, Category, ProductCategory } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Salva imagem base64 no servidor
const saveBase64Image = (base64, type) => {
  const ext = type.split('/')[1];
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const dir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, Buffer.from(base64, 'base64'));
  return `/uploads/${filename}`;
};

// GET /v1/product/search
const search = async (req, res) => {
  try {
    let { limit = 12, page = 1, fields, match, category_ids, 'price-range': priceRange } = req.query;

    limit = parseInt(limit);
    page = parseInt(page);

    if (isNaN(limit) || isNaN(page) || page < 1) {
      return res.status(400).json({ message: 'Parâmetros inválidos.' });
    }

    const where = {};

    // Filtro por nome ou descrição
    if (match) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${match}%` } },
        { description: { [Op.iLike]: `%${match}%` } },
      ];
    }

    // Filtro por preço
    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number);
      where.price = { [Op.between]: [min, max] };
    }

    // Campos a retornar
    let attributes = ['id', 'enabled', 'name', 'slug', 'stock', 'description', 'price', 'price_with_discount'];
    if (fields) {
      const requested = fields.split(',').map((f) => f.trim());
      const validFields = ['id', 'enabled', 'name', 'slug', 'stock', 'description', 'price', 'price_with_discount'];
      attributes = ['id', ...requested.filter((f) => validFields.includes(f) && f !== 'id')];
    }

    // Filtro por categoria
    const include = [
      { model: Category, as: 'categories', attributes: ['id'], through: { attributes: [] } },
      { model: ProductImage, as: 'images', attributes: ['id', 'path', 'enabled'] },
      { model: ProductOption, as: 'options' },
    ];

    if (category_ids) {
      const ids = category_ids.split(',').map(Number);
      include[0].where = { id: { [Op.in]: ids } };
      include[0].required = true;
    }

    const queryOptions = { where, attributes, include, distinct: true };
    if (limit !== -1) {
      queryOptions.limit = limit;
      queryOptions.offset = (page - 1) * limit;
    }

    const { count, rows } = await Product.findAndCountAll(queryOptions);

    const data = rows.map((product) => ({
      ...product.toJSON(),
      category_ids: product.categories.map((c) => c.id),
      images: product.images.map((img) => ({
        id: img.id,
        content: img.path,
      })),
      categories: undefined,
    }));

    return res.status(200).json({
      data,
      total: count,
      limit,
      page: limit === -1 ? 1 : page,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erro interno do servidor.', error });
  }
};

// GET /v1/product/:id
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, {
      include: [
        { model: Category, as: 'categories', attributes: ['id'], through: { attributes: [] } },
        { model: ProductImage, as: 'images', attributes: ['id', 'path'] },
        { model: ProductOption, as: 'options' },
      ],
    });

    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }

    const result = {
      ...product.toJSON(),
      category_ids: product.categories.map((c) => c.id),
      images: product.images.map((img) => ({ id: img.id, content: img.path })),
      categories: undefined,
    };

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Erro interno do servidor.', error });
  }
};

// POST /v1/product
const create = async (req, res) => {
  try {
    const {
      enabled, name, slug, stock, description,
      price, price_with_discount, category_ids, images, options,
    } = req.body;

    if (!name || !slug || price === undefined || price_with_discount === undefined) {
      return res.status(400).json({ message: 'Campos obrigatórios: name, slug, price, price_with_discount.' });
    }

    const product = await Product.create({
      enabled, name, slug, stock, description, price, price_with_discount,
    });

    // Categorias
    if (category_ids && category_ids.length > 0) {
      await ProductCategory.bulkCreate(
        category_ids.map((category_id) => ({ product_id: product.id, category_id }))
      );
    }

    // Imagens
    if (images && images.length > 0) {
      const imageData = images.map((img) => {
        const filePath = saveBase64Image(img.content, img.type);
        return { product_id: product.id, path: filePath, enabled: true };
      });
      await ProductImage.bulkCreate(imageData);
    }

    // Opções
    if (options && options.length > 0) {
      const optionData = options.map((opt) => ({
        product_id: product.id,
        title: opt.title,
        shape: opt.shape || 'square',
        radius: opt.radius || 0,
        type: opt.type || 'text',
        values: Array.isArray(opt.values) ? opt.values.join(',') : opt.values,
      }));
      await ProductOption.bulkCreate(optionData);
    }

    return res.status(201).json({ message: 'Produto criado com sucesso.', id: product.id });
  } catch (error) {
    return res.status(500).json({ message: 'Erro interno do servidor.', error });
  }
};

// PUT /v1/product/:id
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      enabled, name, slug, stock, description,
      price, price_with_discount, category_ids, images, options,
    } = req.body;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }

    await product.update({ enabled, name, slug, stock, description, price, price_with_discount });

    // Atualiza categorias
    if (category_ids) {
      await ProductCategory.destroy({ where: { product_id: id } });
      await ProductCategory.bulkCreate(
        category_ids.map((category_id) => ({ product_id: id, category_id }))
      );
    }

    // Atualiza imagens
    if (images && images.length > 0) {
      for (const img of images) {
        if (img.id && img.deleted) {
          await ProductImage.destroy({ where: { id: img.id } });
        } else if (img.id && img.content) {
          const filePath = img.content.startsWith('http')
            ? img.content
            : saveBase64Image(img.content, img.type || 'image/jpg');
          await ProductImage.update({ path: filePath }, { where: { id: img.id } });
        } else if (!img.id && img.content) {
          const filePath = saveBase64Image(img.content, img.type || 'image/jpg');
          await ProductImage.create({ product_id: id, path: filePath, enabled: true });
        }
      }
    }

    // Atualiza opções
    if (options && options.length > 0) {
      for (const opt of options) {
        if (opt.id && opt.deleted) {
          await ProductOption.destroy({ where: { id: opt.id } });
        } else if (opt.id) {
          await ProductOption.update({
            title: opt.title,
            shape: opt.shape,
            radius: opt.radius,
            type: opt.type,
            values: Array.isArray(opt.values) ? opt.values.join(',') : opt.values,
          }, { where: { id: opt.id } });
        } else {
          await ProductOption.create({
            product_id: id,
            title: opt.title,
            shape: opt.shape || 'square',
            radius: opt.radius || 0,
            type: opt.type || 'text',
            values: Array.isArray(opt.values) ? opt.values.join(',') : opt.values,
          });
        }
      }
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Erro interno do servidor.', error });
  }
};

// DELETE /v1/product/:id
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }

    await ProductImage.destroy({ where: { product_id: id } });
    await ProductOption.destroy({ where: { product_id: id } });
    await ProductCategory.destroy({ where: { product_id: id } });
    await product.destroy();

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Erro interno do servidor.', error });
  }
};

module.exports = { search, getById, create, update, remove };