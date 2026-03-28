const request = require('supertest');
const app = require('../src/app');
const { sequelize, User } = require('../src/models');
const bcrypt = require('bcrypt');

let token;
let categoryId;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  const hash = await bcrypt.hash('123@123', 10);
  await User.create({
    firstname: 'Admin',
    surname: 'Test',
    email: 'admin@test.com',
    password: hash,
  });

  const res = await request(app)
    .post('/v1/user/token')
    .send({ email: 'admin@test.com', password: '123@123' });

  token = res.body.token;
});

afterAll(async () => {
  await sequelize.close();
});

describe('Categorias', () => {

  it('POST /v1/category - deve criar categoria com token', async () => {
    const res = await request(app)
      .post('/v1/category')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Tênis', slug: 'tenis', use_in_menu: true });
    expect(res.status).toBe(201);
    categoryId = res.body.id;
  });

  it('POST /v1/category - deve retornar 401 sem token', async () => {
    const res = await request(app)
      .post('/v1/category')
      .send({ name: 'Tênis', slug: 'tenis' });
    expect(res.status).toBe(401);
  });

  it('POST /v1/category - deve retornar 400 sem campos obrigatórios', async () => {
    const res = await request(app)
      .post('/v1/category')
      .set('Authorization', `Bearer ${token}`)
      .send({ use_in_menu: true });
    expect(res.status).toBe(400);
  });

  it('GET /v1/category/:id - deve retornar categoria por ID', async () => {
    const res = await request(app).get(`/v1/category/${categoryId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('name');
  });

  it('GET /v1/category/:id - deve retornar 404 se não encontrado', async () => {
    const res = await request(app).get('/v1/category/9999');
    expect(res.status).toBe(404);
  });

  it('GET /v1/category/search - deve listar categorias', async () => {
    const res = await request(app).get('/v1/category/search');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('limit');
    expect(res.body).toHaveProperty('page');
  });

  it('PUT /v1/category/:id - deve atualizar categoria com token', async () => {
    const res = await request(app)
      .put(`/v1/category/${categoryId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Tênis Atualizado', slug: 'tenis-atualizado' });
    expect(res.status).toBe(204);
  });

  it('PUT /v1/category/:id - deve retornar 401 sem token', async () => {
    const res = await request(app)
      .put(`/v1/category/${categoryId}`)
      .send({ name: 'Teste' });
    expect(res.status).toBe(401);
  });

  it('DELETE /v1/category/:id - deve deletar categoria com token', async () => {
    const res = await request(app)
      .delete(`/v1/category/${categoryId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  it('DELETE /v1/category/:id - deve retornar 401 sem token', async () => {
    const res = await request(app)
      .delete(`/v1/category/${categoryId}`);
    expect(res.status).toBe(401);
  });

});