import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import User from '../models/User.model.js';

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_ACCESS_SECRET || 'jwt_access_secret_placeholder',
};

export const configurePassport = (passport) => {
  // JWT Strategy
  passport.use(
    new JwtStrategy(jwtOptions, async (payload, done) => {
      try {
        const user = await User.findById(payload.sub);
        if (!user) {
          return done(null, false);
        }
        if (!user.isActive) {
          return done(null, false, { message: 'Account is deactivated' });
        }
        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    })
  );
};
