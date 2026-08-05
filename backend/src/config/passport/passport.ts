import passport from "passport";
import {
  Strategy as JwtStrategy,
  ExtractJwt,
  StrategyOptions,
} from "passport-jwt";
import config from "../environments.js";
import User from "../../models/user/index.js";

const options: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.jwt.secret,
};

passport.use(
  new JwtStrategy(options, async (payload, done) => {
    try {
      const user = await User.findById(payload.userId).select("-password");

      if (!user) return done(null, false);
      if (!user.isActive) return done(null, false);

      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }),
);

export default passport;
