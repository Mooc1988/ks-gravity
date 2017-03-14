/**
 * Created by frank on 2017/3/9.
 */

module.exports = {
  ready: true,
  prefix: '/api/yss',
  routes: [
    {
      method: 'GET',
      path: '/:appId/albums',
      handler: 'Yss.findAlbumsByApp'
    },
    {
      method: 'GET',
      path: '/categories',
      handler: 'Yss.findCategories'
    },
    {
      method: 'GET',
      path: '/categories/:categoryId/albums',
      handler: 'Yss.findAlbumsByCategory'
    },
    {
      method: 'GET',
      path: '/albums/:albumId/sounds',
      handler: 'Yss.findSoundsByAlbum'
    },
    {
      method: 'GET',
      path: '/albums/search',
      handler: 'Yss.searchByName'
    },
    {
      method: 'POST',
      path: '/apps/:appId/albums',
      handler: 'Yss.addToApp'
    },
    {
      method: 'DELETE',
      path: '/apps/:appId/albums/:albumId',
      handler: 'Yss.removeFromApp'
    }
  ]
}
