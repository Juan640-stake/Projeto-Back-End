const { Category } = require('../models');
const { Op } = require('sequelize');

// GET /v1/category/search
const search = async (req, res) => {
  try {
    let { limit = 12, page = 1, fields, use_in_menu } = req.query;

    limit = parseInt(limit);
    page = parseInt(page);

    if (isNaN(limit) || isNaN(page) || page < 1) {
      return res.status(400).json({ message: 'Parâmetros inválidos.' });
    }

    // Campos a retornar
    let attributes = ['id', 'name', 'slug', 'use_in_menu'];
    if (fields) {
      const requested = fields.split(',').map((f) => f.trim());
      // Garante que id sempre venha
      attributes = ['id', ...requested.filter((f) => f !== 'id')];
    }

    // Filtro use_in_menu
    const where = {};
    if (use_in_menu !== undefined) {
      where.use_in_menu = use_in_menu === 'true';
    }

    // Paginação
    const queryOptions = { where, attributes };
    if (limit !== -1) {
      queryOptions.limit = limit;
      queryOptions.offset = (page - 1) * limit;
    }

    const { count, rows } = await Category.findAndCountAll(queryOptions);

    return res.status(200).json({
      data: rows,
      total: count,
      limit,
      page: limit === -1 ? 1 : page,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erro interno do servidor.', error });
  }
};

// GET /v1/category/:id
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id, {
      attributes: ['id', 'name', 'slug', 'use_in_menu'],
    });

    if (!category) {
      return res.status(404).json({ message: 'Categoria não encontrada.' });
    }

    return res.status(200).json(category);
  } catch (error) {
    return res.status(500).json({ message: 'Erro interno do servidor.', error });
  }
};

// POST /v1/category
const create = async (req, res) => {
  try {
    const { name, slug, use_in_menu } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ message: 'Nome e slug são obrigatórios.' });
    }

    const category = await Category.create({ name, slug, use_in_menu });

    return res.status(201).json(category);
  } catch (error) {
    return res.status(500).json({ message: 'Erro interno do servidor.', error });
  }
};

// PUT /v1/category/:id
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, use_in_menu } = req.body;

    if (!name && !slug && use_in_menu === undefined) {
      return res.status(400).json({ message: 'Informe ao menos um campo para atualizar.' });
    }

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ message: 'Categoria não encontrada.' });
    }

    await category.update({ name, slug, use_in_menu });

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Erro interno do servidor.', error });
  }
};

// DELETE /v1/category/:id
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ message: 'Categoria não encontrada.' });
    }

    await category.destroy();

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Erro interno do servidor.', error });
  }
};

module.exports = { search, getById, create, update, remove };