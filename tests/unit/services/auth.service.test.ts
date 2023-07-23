import bcrypt from 'bcrypt';
import config from '../../../src/config';
import { authService } from '../../../src/services';
import prismaMock from '../../prisma-mock';
import { UpdatedJwtPayload } from '../../../src/types/jwt.type';

describe('Auth', () => {
  // Signup test
  describe('Signup', () => {
    it('should create new user', async () => {
      const user = {
        id: 1,
        name: 'test',
        email: 'example@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        password: 'test',
      };
      prismaMock.user.create.mockResolvedValueOnce(user);

      await expect(authService.createUser(user)).resolves.toEqual(user);

      expect(prismaMock.user.create).toBeCalledTimes(1);
    });

    it('should throw error if email already exists', async () => {
      const email = 'example@example.com';
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 1,
        name: 'test',
        email,
        password: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(authService.checkEmailUniqueness(email)).rejects.toThrowError(
        'Email already exists',
      );
    });
  });

  // Login test
  describe('Login', () => {
    const cred = {
      email: 'example@example.com',
      password: 'test',
    };
    const saltRounds = config.variables.passwordSaltRounds!;
    const salt = bcrypt.genSaltSync(+saltRounds);
    const hashedPassword = bcrypt.hashSync(cred.password, salt);

    it('should login user', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 1,
        name: 'test',
        email: cred.email,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      //   make sure that the result has at least the name, email, and id fields
      await expect(authService.login(cred)).resolves.toMatchObject({
        name: expect.any(String),
        email: expect.any(String),
        id: expect.any(Number),
      });
    });

    it("should throw error if user doesn't exist", async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      await expect(authService.login(cred)).rejects.toThrowError('User does not exist');
    });

    it('should throw error if password is incorrect', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 1,
        name: 'test',
        email: cred.email,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(authService.login({ ...cred, password: 'wrong' })).rejects.toThrowError(
        'Invalid credentials',
      );
    });
  });

  describe('Fetch User Data', () => {
    const testEmail = 'example@example.com';

    it('should fetch user data by email', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 1,
        name: 'test',
        email: testEmail,
        password: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(authService.getUserInfo(testEmail)).resolves.toMatchObject({
        name: expect.any(String),
        email: testEmail,
        id: expect.any(Number),
      });
    });
  });

  it('throw invalidate tokens', () => {
    const invalidToken = 'invalid';

    config.variables.jwtAccessSecret = 'test';
    config.variables.jwtRefreshSecret = 'test';

    expect(() => authService.verifyRefreshToken(invalidToken)).toThrow();
    expect(() => authService.verifyAccessToken(invalidToken)).toThrow();
  });

  it('generate tokens', () => {
    const jwtData: UpdatedJwtPayload = {
      userId: 1,
      email: 'test',
    };
    config.variables.jwtAccessSecret = 'test';
    config.variables.jwtRefreshSecret = 'test';

    expect(authService.signAccessToken(jwtData, 60)).toMatch(/.+/);
    expect(authService.signRefreshToken(jwtData, 60)).toMatch(/.+/);
  });
});
