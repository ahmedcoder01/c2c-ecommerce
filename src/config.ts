console.info(process.env.JWT_SECRET);

export default {
  variables: {
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET!,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
  },
};
