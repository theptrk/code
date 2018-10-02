'use strict';

const TABLE_NAME = "Projects"

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn(
      TABLE_NAME, 
      "active", 
      {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn(
      TABLE_NAME, 
      "active", 
      {
        // this should be the current state before migration
        type: Sequelize.BOOLEAN,
      })
  }
};

