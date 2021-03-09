require("dotenv").config({ path: "./.env" });
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const passportCustom = require("passport-custom");
const CustomStrategy = passportCustom.Strategy;

const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const { Logger } = require("node-core-utils");
const utils = require("./lib/utils");
const lru = require("lru-cache");
const Eth = require("ethjs");
const sigUtil = require("eth-sig-util");
const ethUtil = require("ethereumjs-util");
const {
  devMode,
  logRequest,
  isLoggedIn,
  s3Upload,
  s3Download,
} = require("./lib/middleware");
const { LoginRoutes, BountiesRoutes } = require("./lib/routes");

const defaultConfig = require("./config");
const loginTokenCache = new lru(defaultConfig.loginTokenCacheOptions);

class AccountsManagementAdmin {
  constructor(config) {
    config = { ...defaultConfig, ...config };
    this.config = config;
    this.logger = new Logger("Accounts Management App");
    this.logger.info(`Starting...`);
    this.init();
  }
  init() {
    this.logger.info("Initializing");
    this.logger.debug(this.config);
    this.environment = this.config.environment;
    this.utils = utils;
    this.loginTokenCache = loginTokenCache;
    this.passport = passport;
    this.eth = new Eth(new Eth.HttpProvider(this.config.alchemyUrl));
    this.sigUtil = sigUtil;
    this.ethUtil = ethUtil;

    this.passport.use(
      "signature-verification",
      new CustomStrategy((req, callback) => {
        const { sig, token } = req.body;
        let address;
        if (!this.loginTokenCache.get(token)) {
          return callback("token does not exist");
        }
        loginTokenCache.del(token);

        const message = this.ethUtil.bufferToHex(
          new Buffer.from(`Your login nonce is: ${token}`, "utf8")
        );

        try {
          address = this.sigUtil.recoverPersonalSignature({
            data: message,
            sig,
          });
        } catch (e) {
          return callback(e);
        }
        return callback(null, { address });
      })
    );

    this.passport.serializeUser((user, done) => {
      done(null, user);
    });

    this.passport.deserializeUser((user, done) => {
      done(null, user);
    });

    this.server = express();
    // this.server.use(
    //   session({
    //     store: new MongoStore(this.config.db),
    //     secret: "secret",
    //     resave: true,
    //     saveUninitialized: true,
    //   })
    // );
    this.server.use(passport.initialize());
    this.server.use(passport.session());
    this.server.set("trust_proxy", this.config.trustProxy);
    this.server.set("json spaces", this.config.jsonSpaces);
    this.server.use(bodyParser.urlencoded(this.config.urlencoded));
    this.server.use(bodyParser.json({ limit: this.config.uploadLimit }));
    this.server.use("fetch", fetch);
    this.server.set("AccountsManagementAdmin", this);
    this.server.set("loginTokenCache", this.loginTokenCache);
    this.server.set("eth", this.eth);
    this.server.set("ethUtil", this.ethUtil);
    this.server.set("sigUtil", this.sigUtil);
    this.server.use(logRequest);
    this.server.use("/login", LoginRoutes);

    this.server.post(
      "/login/sig",
      this.passport.authenticate("signature-verification"),
      (req, res) => {
        res.send(req.session.passport.user.address);
      }
    );

    this.logger.info(`Initialized`);
  }

  logUserActivity(activity) {
    this.logger.info(`Logging activity: ${activity}`);
  }

  start() {
    this.server.listen(this.config.port, () => {
      this.logger.info(`listening on http://localhost:${this.config.port}`);
    });
    this.logger.info(`started in ${this.environment}.`);
  }

  async exit() {
    this.logger.info(`exiting`);
  }
}

if (require.main === module) {
  const AccountsManagement = new AccountsManagementAdmin();
  AccountsManagement.start();
} else {
  module.exports = AccountsManagementAdmin;
}
