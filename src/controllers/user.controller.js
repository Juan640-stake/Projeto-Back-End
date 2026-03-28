const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// GET /v1/user/:id
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: ['id', 'firstname', 'surname', 'email'],
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Erro interno do servidor.', error });
  }
};

// POST /v1/user
const create = async (req, res) => {
  try {
    const { firstname, surname, email, password, confirmPassword } = req.body;

    if (!firstname || !surname || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'As senhas não coincidem.' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'E-mail já cadastrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({ firstname, surname, email, password: hashedPassword });

    return res.status(201).json({ message: 'Usuário criado com sucesso.' });
  } catch (error) {
    return res.status(500).json({ message: 'Erro interno do servidor.', error });
  }
};

// PUT /v1/user/:id
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstname, surname, email } = req.body;

    if (!firstname && !surname && !email) {
      return res.status(400).json({ message: 'Informe ao menos um campo para atualizar.' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    await user.update({ firstname, surname, email });

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Erro interno do servidor.', error });
  }
};

// DELETE /v1/user/:id
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    await user.destroy();

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Erro interno do servidor.', error });
  }
};

// POST /v1/user/token
const generateToken = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Credenciais inválidas.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: 'Credenciais inválidas.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.status(200).json({ token });
  } catch (error) {
    return res.status(500).json({ message: 'Erro interno do servidor.', error });
  }
};

module.exports = { getById, create, update, remove, generateToken };