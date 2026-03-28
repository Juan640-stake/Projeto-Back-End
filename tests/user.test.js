const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models');

let token;
let userId;

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Usuários', () => {

  it('POST /v1/user - deve criar um usuário', async () => {
    const res = await request(app)
      .post('/v1/user')
      .send({
        firstname: 'João',
        surname: 'Silva',
        email: 'joao@email.com',
        password: '123@123',
        confirmPassword: '123@123',
      });
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Usuário criado com sucesso.');
  });

  it('POST /v1/user - deve retornar 400 se campos faltando', async () => {
    const res = await request(app)
      .post('/v1/user')
      .send({ email: 'joao@email.com' });
    expect(res.status).toBe(400);
  });

  it('POST /v1/user - deve retornar 400 se senhas não coincidem', async () => {
    const res = await request(app)
      .post('/v1/user')
      .send({
        firstname: 'João',
        surname: 'Silva',
        email: 'joao2@email.com',
        password: '123@123',
        confirmPassword: 'diferente',
      });
    expect(res.status).toBe(400);
  });

  it('POST /v1/user/token - deve gerar token JWT', async () => {
    const res = await request(app)
      .post('/v1/user/token')
      .send({ email: 'joao@email.com', password: '123@123' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });

  it('POST /v1/user/token - deve retornar 400 com credenciais inválidas', async () => {
    const res = await request(app)
      .post('/v1/user/token')
      .send({ email: 'joao@email.com', password: 'senhaerrada' });
    expect(res.status).toBe(400);
  });

  it('GET /v1/user/:id - deve retornar usuário por ID', async () => {
    const res = await request(app).get('/v1/user/1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('firstname');
    expect(res.body).toHaveProperty('email');
    expect(res.body).not.toHaveProperty('password');
    userId = res.body.id;
  });

  it('GET /v1/user/:id - deve retornar 404 se não encontrado', async () => {
    const res = await request(app).get('/v1/user/9999');
    expect(res.status).toBe(404);
  });

  it('PUT /v1/user/:id - deve atualizar usuário com token', async () => {
    const res = await request(app)
      .put(`/v1/user/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ firstname: 'João Atualizado', surname: 'Silva', email: 'joao@email.com' });
    expect(res.status).toBe(204);
  });

  it('PUT /v1/user/:id - deve retornar 401 sem token', async () => {
    const res = await request(app)
      .put(`/v1/user/${userId}`)
      .send({ firstname: 'Teste' });
    expect(res.status).toBe(401);
  });

  it('DELETE /v1/user/:id - deve retornar 401 sem token', async () => {
    const res = await request(app).delete(`/v1/user/${userId}`);
    expect(res.status).toBe(401);
  });

  it('DELETE /v1/user/:id - deve deletar usuário com token', async () => {
    const res = await request(app)
      .delete(`/v1/user/${userId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

});