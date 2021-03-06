'use strict'

module.exports = function (sequelize, DataTypes) {
  const {STRING, JSONB, ARRAY, INTEGER, BOOLEAN} = DataTypes
  return sequelize.define('AdTemplate', {
    // 模版名称
    name: {
      type: STRING(128),
      allowNull: false
    },
    version: {
      type: INTEGER
    },
    recommendLink: {
      type: STRING(256)
    },
    meta: {
      type: JSONB
    },
    // app类型,与app表保持一致
    type: {
      type: STRING(128),
      allowNull: false
    },
    subType: {
      type: STRING(128)
    },
    enable: {
      type: BOOLEAN,
      defaultValue: true
    },

    // 广告信息数组
    ads: {
      type: ARRAY(JSONB),
      allowNull: false
    }
  }, {
    defaultScope: {
      where: {
        enable: true
      }
    },
    classMethods: {
      associate ({AdTemplate, User}) {
        AdTemplate.belongsTo(User)
      }
    },
    tableName: 'ad_template'
  })
}
