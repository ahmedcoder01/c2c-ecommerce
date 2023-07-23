export default {
  variables: {
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET!,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
    passwordSaltRounds: process.env.PASSWORD_SALT_ROUNDS!,
  },
};
