require('dotenv').config();

const config = {
  repoDir: process.env.REPO_DIR || 'D:/GitServer',
  port: process.env.PORT || 6969
};

module.exports = config;
