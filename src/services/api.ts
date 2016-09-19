// import request_declaration from 'request' // tslint:disable-line
// most of api from @darknessomi/musicbox
// https://github.com/darknessomi/musicbox/blob/master/NEMbox/api.py

import {
  encryptedMD5,
  encryptedRequest
} from './crypto'
import qs from 'querystring'
import rq from 'request-promise'

export const API_BASE_URL = 'http://music.163.com'

const cookieJar = rq.jar()

const request = rq.defaults({
  baseUrl: API_BASE_URL,
  gzip: true,
  headers: {
    'Accept': '*/*',
    'Accept-Encoding': 'gzip,deflate,sdch',
    'Accept-Language': 'zh-CN,en-US;q=0.7,en;q=0.3',
    'Connection': 'keep-alive',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Host': 'music.163.com',
    'Referer': 'http://music.163.com/',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:39.0) Gecko/20100101 Firefox/39.0'
  },
  jar: cookieJar,
  proxy: 'http://localhost:8888',
  useQuerystring: true,
  transform(body: string) {
    return body.startsWith('<!DOCTYPE html>')
      ? body
      : JSON.parse(body)
  }
})

export function getCookies () {
  return cookieJar.getCookieString(API_BASE_URL)
}

export function setCookies (cookie: string): void {
  cookieJar.setCookie(request.cookie(cookie), API_BASE_URL)
}

export function getCsrfFromCookies (): string | null {
  const cookies = getCookies()
  return cookies ? /csrf=(\w*);/.exec(cookies)[1] : null
}

function getUserId (): string | null {
  const cookies = getCookies()
  const uids = /\d+/.exec(cookies.split(';')[3])
  return uids ? uids[0] : null
}

interface ILoginBody {
  password: string,
  rememberLogin: string,
  phone?: string,
  username?: string
}

export async function login (username: string, password: string) {
  const patten = /^0\d{2,3}\d{7,8}$|^1[34578]\d{9}$/
  let url = '/weapi/login/'
  let body: ILoginBody = {
    password: encryptedMD5(password),
    rememberLogin: 'true'
  }
  if (patten.test(username)) {
    body.phone = username
    url = '/weapi/login/cellphone/'
  } else {
    body.username = username
  }
  const encBody = encryptedRequest(body)
  return await request.post(url, {
    body: qs.stringify(encBody)
  })
}

export interface IPaginationParams {
  offset: number,
  limit: number,
  total?: boolean
}

export interface IPlayListParams extends IPaginationParams {
  uid: string
}

export async function userPlayList (qs: IPlayListParams) {
  return await request.get('/api/user/playlist/', { qs })
}

export async function playListDetail (id: string) {
  return await request.get('/api/playlist/detail', {
    qs: { id }
  })
}

export const enum SearchType {
  song = 1,
  singer = 100,
  album = 10,
  songList = 1000,
  user = 1002
}

export interface ISearchBody extends IPaginationParams {
  s: string,
  type: SearchType | string
}

export async function search (body: ISearchBody) {
  return await request.post('/api/search/get/web', { body: qs.stringify(body) })
}

export async function recommnedPlayList (body: IPaginationParams) {
  const csrf = getCsrfFromCookies()
  if (!csrf) {
    return null
  }
  return await request
    .post('/weapi/v1/discovery/recommend/songs?csrf_token=' + csrf, {
        body: qs.stringify(encryptedRequest(
          Object.assign({}, body, { 'csrf_token': csrf })
        ))
      }
    )
}

export async function personalFM () {
  return await request.get('/api/radio/get')
}

export async function fmLike (
  songId: string,
  like = true,
  time = '25',
  alg = 'itembased'
) {
  return await request
    .get(`/api/radio/like?alg=${alg}&trackId=${songId}&like=${like}&time=${time}`)
}

export async function fmTrash (
  songId: string,
  time = '25',
  alg = 'RT'
) {
  return await request
    .get(`/api/radio/trash/add?alg=${alg}&songId=${songId}&time=${time}`)
}

export async function newAlbums (
  offset = '0',
  limit = '10'
) {
  return await request
    .get(`/api/album/new?area=ALL&offset=${offset}&total=true&limit=${limit}`)
}

export async function topPlayList (
  category = '全部',
  order = 'hot',
  offset = '0',
  total = true,
  limit = '10'
) {
  return await request
    .get(`/api/playlist/list?cat=${category}&order=${order}&offset=${offset}&total=${offset}&limit=${limit}`)
}

export async function topArtists (
  offset = '0',
  limit = '10'
) {
  return await request
    .get(`/api/artist/top?offset=${offset}&total=false&limit=${limit}`)
}

export async function artistInfo (
  artistId: string
) {
  return await request
    .get(`/api/artist/${artistId}`)
}

export async function albumInfo (
  albumId: string
) {
  return await request
    .get(`/api/album/${albumId}`)
}

export const enum ChannelsType {
  today = 0, // 今日最热
  week = 10,
  history = 20,
  recent = 30
}

export async function djChannels (
  stype: ChannelsType | string,
  offset = '0',
  limit = '10'
) {
  const body: string = await request
    .get(`/discover/djradio?type=${stype}&offset=${offset}&limit=${limit}`)
  const matchChannels = [...body.match(/program\?id=\d+/g)]
  return [...new Set(matchChannels)].map(c => c.slice(11))
}

export async function channelDetails (channelId: string) {
  return await request.get(`/api/dj/program/detail?id=${channelId}`)
}

export async function singleSongDetails (songId: string) {
  return await request
    .get(`/api/song/detail/?id=${songId}&ids=[${songId}]`)
}

export async function batchSongDetails (songIds: string[]) {
  return await request
    .get(`/api/song/detail?ids=[${songIds.join()}]`)
}

export async function batchSongDetailsNew (
  songIds: string[],
  bitrate = '320000'
) {
  const csrf = getCsrfFromCookies()
  if (!csrf) {
    return null
  }
  return await request
    .post(`/weapi/song/enhance/player/url?csrf_token=${csrf}`, {
      body: qs.stringify(
        encryptedRequest({
          br: bitrate,
          ids: songIds,
          'csrf_token': csrf
        })
      )
    })
}

export async function opMuiscToPlaylist (
  tracks: string,
  pid: string,
  op: 'add' | 'del'
) {
  return await request
    .post(`/api/playlist/manipulate/tracks`, {
      body: qs.stringify({
        tracks,
        trackIds: `[${tracks}]`,
        pid,
        op
      })
    })
}

export async function setMusicFavorite (
  trackId: string,
  like: boolean | string,
  time = '0'
) {
  return await request
    .post(`/api/song/like`, {
      body: qs.stringify({
        trackId,
        like,
        time
      })
    })
}

export async function createPlaylist (
  name: string
) {
  const uid = getUserId()
  if (!uid) {
    return null
  }
  return await request
    .post(`/api/playlist/create`, {
      body: qs.stringify({
        name,
        uid
      })
    })
}