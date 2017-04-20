/**
 * Created by frank on 2017/4/5.
 */
const _ = require('lodash')
const assert = require('http-assert')
const request = require('request')
const cheerio = require('cheerio')
const iconv = require('iconv-lite')
const minify = require('html-minifier').minify
const LIMIT = 30

module.exports = {
  * findHeroTags () {
    this.body = ['全部', '坦克', '战士', '刺客', '法师', '射手', '辅助']
  },

  * findEquipmentTags () {
    this.body = ['全部', '攻击', '法术', '防御', '移动', '打野']
  },

  * findPostCategories () {
    this.body = [{id: 1, title: '最新资讯'}, {id: 2, title: '攻略秘籍'}, {id: 3, 'title': '英雄图鉴'}]
  },

  * findPostsByCategory () {
    let {categoryId} = this.params
    let {WzryPost} = this.models
    let {offset, limit} = getPage(this.query)
    let cond = {
      where: {category: categoryId},
      attributes: ['id', 'title', 'image', 'createdAt'],
      offset,
      limit,
      order: [['createdAt', 'DESC']]
    }
    this.body = yield WzryPost.findAndCountAll(cond)
  },

  * getPostPage () {
    let {postId} = this.params
    let {WzryPost} = this.models
    let cacheKey = `wzry:post:${postId}`
    let data = yield this.redis.get(cacheKey)
    if (!data) {
      let post = yield WzryPost.findById(postId)
      let {link, source} = post
      assert(post, 400, 'post不存在')
      if (source === 'ptbus') {
        data = yield fetchPtbusPage(link)
      } else if (source === '72g') {
        data = yield fetch72gPage(link)
      }
      yield this.redis.set(cacheKey, data)
    }
    this.body = data
  },

  * findHeroes () {
    let {WzryHero} = this.models
    this.body = yield WzryHero.findAll({})
  },

  * findEquipments () {
    let {WzryEquipment} = this.models
    this.body = yield WzryEquipment.findAll({})
  },

  * getHeroPage () {
    let {heroId} = this.params
    let cacheKey = `wzry:hero:${heroId}`
    let data = yield this.redis.get(cacheKey)
    let {WzryHero} = this.models
    if (!data) {
      let hero = yield WzryHero.findById(heroId)
      assert(hero, 400, 'hero不存在')
      let {link} = hero
      data = yield fetchHeroOrEquipPage(link)
      yield this.redis.set(cacheKey, data)
    }
    this.body = data
  },

  * getEquipPage () {
    let {equipId} = this.params
    let cacheKey = `wzry:equip:${equipId}`
    let data = yield this.redis.get(cacheKey)
    let {WzryEquipment} = this.models
    if (!data) {
      let equip = yield WzryEquipment.findById(equipId)
      assert(equip, 400, 'equip不存在')
      let {link} = equip
      data = yield fetchHeroOrEquipPage(link)
      yield this.redis.set(cacheKey, data)
    }
    this.body = data
  }
}

function fetchHeroOrEquipPage (uri) {
  const converterStream = iconv.decodeStream('GBK')
  request.get({uri, encoding: null}).pipe(converterStream)
  return new Promise(function (resolve, reject) {
    converterStream.collect(function (err, body) {
      if (err) {
        return reject(err)
      }
      let $ = cheerio.load(body)
      _.forEach(['script', 'center', '.mt8', '.wzny-logo'], e => $(e).remove())
      _.forEach($('#strategyDetailPage').children('div'), (d) => {
        if (!$(d).hasClass('content')) {
          $(d).remove()
        }
      })
      let result = minify($.html(), {
        removeComments: true,
        removeCommentsFromCDATA: true,
        collapseWhitespace: true,
        collapseBooleanAttributes: true,
        removeAttributeQuotes: true,
        removeEmptyAttributes: true
      })
      resolve(result)
    })
  })
}

function fetchPtbusPage (uri) {
  return new Promise(function (resolve, reject) {
    request.get(uri, function (err, res, body) {
      if (err) {
        return reject(err)
      }
      let $ = cheerio.load(body)
      $('script').remove()
      _.forEach($('body').children(), (e) => {
        if (e.name !== 'article') {
          $(e).remove()
        }
      })
      let result = minify($.html(), {
        removeComments: true,
        removeCommentsFromCDATA: true,
        collapseWhitespace: true,
        collapseBooleanAttributes: true,
        removeAttributeQuotes: true,
        removeEmptyAttributes: true
      })
      resolve(result)
    })
  })
}

function fetch72gPage (uri) {
  const converterStream = iconv.decodeStream('GBK')
  request.get({uri, encoding: null}).pipe(converterStream)
  return new Promise(function (resolve, reject) {
    converterStream.collect(function (err, body) {
      if (err) {
        return reject(err)
      }
      let $ = cheerio.load(body)
      $('script').remove()
      _.forEach($('head').children('link'), (e) => {
        let link = $(e)
        let href = link.attr('href')
        if (href.startsWith('/')) {
          link.attr('href', `http://m.72g.com${href}`)
        }
      })
      _.forEach($('.wrapper').children(), (e) => {
        let section = $(e)
        if (section.attr('role') !== 'mode-game-infomation') {
          section.remove()
        } else {
          _.forEach(section.children(), (e) => {
            let inner = $(e)
            if (!inner.hasClass('game-article')) {
              inner.remove()
            } else {
              inner.find('table').remove()
            }
          })
        }
      })
      // css.attr('href', 'http://http://www.72g.com/' + css.attr('href'))
      let result = minify($.html(), {
        removeComments: true,
        removeCommentsFromCDATA: true,
        collapseWhitespace: true,
        collapseBooleanAttributes: true,
        removeAttributeQuotes: true,
        removeEmptyAttributes: true
      })
      resolve(result)
    })
  })
}
function getPage (query) {
  const page = _.get(query, 'page', 1)
  const offset = (page - 1) * LIMIT
  return {offset, limit: LIMIT}
}