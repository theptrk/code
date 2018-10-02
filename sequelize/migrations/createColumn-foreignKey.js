"use strict";

/**
 * This adds a column on the SOURCE model for TARGET id in a 1:M relationship
 *
 * An example is a 1:M relationship between "Task" and "User" where a "Task" 
 * belongs to a single "User" 
 * 
 * SOURCE (1) -> TARGET (M)
 *           |-> TARGET (M)
 *           |-> TARGET (M)
 */

// Step 1: `$ node_modules/.bin/sequelize migration:generate --name add-userid-to-task`
// Step 2: copy this file into the newly created file
// Step 3: `$ node_modules/.bin/sequelize db:migrate`

// === SET THESE ===
// This is the name of your "source" model that is the (1) in the relationship

const SOURCE_MODEL_NAME = 'Task'; 
const TARGET_MODEL_NAME = 'User'; 

// === DO NOT SET THESE ===
// Get the real table name by initializing a sequelize instance
// By default we will use the field name (TARGET model + "Id")

const SOURCE_TABLE_NAME = require(__dirname + '/../models')[SOURCE_MODEL_NAME].getTableName()
const TARGET_FIELD_NAME = TARGET_MODEL_NAME + 'Id'

module.exports = {
  up: function(migration, DataTypes, done) {

    migration.addColumn(
      SOURCE_TABLE_NAME,
      TARGET_FIELD_NAME,
      {
        type: DataTypes.INTEGER,
        references: { 
          model: TARGET_MODEL_NAME, 
          key: "id" 
        },
        onDelete: 'cascade'
      }
    );
    done();
  },

  down: function(migration, DataTypes, done) {
    migration.removeColumn(SOURCE_TABLE_NAME, TARGET_FIELD_NAME);
    done();
  }
};

