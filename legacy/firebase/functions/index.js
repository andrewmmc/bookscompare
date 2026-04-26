const functions = require('firebase-functions');
const express = require('express');
const axios = require('axios');
const lodash = require('lodash');
const cheerio = require('cheerio');

const flatten = lodash.flatten;
const app = express();

const request = axios.create({
  timeout: 3000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36',
  },
});

// routing
app.get('/isbn/:id', async (req, res) => {
  try {
    const { params: { id } } = req;

    if (Number.isNaN(id) || (id.length !== 13 && id.length !== 10)) {
      throw new Error('Invalid ISBN Number.');
    }

    const data = flatten(
      await Promise.all([
        getDetailsFromBooksTw(id),
        getDetailsFromKingstone(id),
        getDetailsFromCite(id),
        // getDetailsFromEslite(id),
      ]),
    );

    const responses = data
      .filter(item => item.active)
      // sort by price ASC default
      .sort((a, b) => a.price - b.price);

    return res.status(200).json({ data: responses });
  } catch (e) {
    console.error(e);

    if (e.message) {
      return res.status(400).json({ err: e.message });
    }
    return res.status(500).json({ err: 'Unexpected error.' });
  }
});

app.get('*', async (req, res) => res.send(''));

// 博客來 (books.com.tw)
async function getDetailsFromBooksTw(isbnNumber) {
  const response = [];
  try {
    const baseUrl = 'https://search.books.com.tw';
    const searchUrl = '/search/query/cat/all/key/';
    const { data } = await request.get(baseUrl + searchUrl + isbnNumber);

    const $ = cheerio.load(data);
    const result = $('form#searchlist ul.searchbook li');
    if (result.length === 0) throw new Error('No result found');

    result.each((i, e) => {
      const bookUrl = $(e).find('a[rel=mid_name]').attr('href');
      const bookImage = $(e).find('a[rel=mid_image] img').attr('data-original');
      const bookName = $(e).find('h3').text().trim();
      const bookCat = $(e).find('span.cat').text().trim();
      const bookAuthors = [];
      $(e).find('a[rel=go_author]').each((j, elem) => {
        bookAuthors.push($(elem).text().trim());
      });
      const bookPublisher = $(e).find('a[rel=mid_publish]').text().trim();
      const bookPrice = $(e).find('span.price strong').last().text().trim().match(/\d+/).join('');

      response.push({
        source: '博客來',
        active: true,
        name: bookName || '',
        cat: bookCat || '',
        authors: bookAuthors.length > 0 ? bookAuthors.join() : '',
        publisher: bookPublisher || '',
        price: bookPrice ? parseInt(bookPrice, 10) : 0,
        currency: 'TWD',
        url: bookUrl ? 'https:' + bookUrl : '',
        image: bookImage || '',
      });
    });
  } catch (e) {
    console.log(e);
    response.push({
      source: '博客來',
      active: false,
    });
  }
  return response;
}

// 金石堂 (kingstone.com.tw)
async function getDetailsFromKingstone(isbnNumber) {
  const response = [];
  try {
    const baseUrl = 'https://www.kingstone.com.tw';
    const searchUrl = '/search/result.asp?c_name=';
    const { data } = await request.get(baseUrl + searchUrl + isbnNumber);

    const $ = cheerio.load(data);
    const result = $('div.box.row_list ul li');
    if (result.length === 0) throw new Error('No result found');

    result.each((i, e) => {
      const bookUrl = $(e).find('a.anchor').attr('href');
      const bookImage = $(e).find('a.anchor img').attr('src');
      const bookName = $(e).find('a.anchor span').text().trim();
      const bookCat = $(e).find('span.classification a.main_class').text().trim();
      const bookAuthors = [];
      $(e).find('span.author a').each((j, elem) => {
        bookAuthors.push($(elem).text().trim());
      });
      const bookPublisher = $(e).find('span.publisher a').text().trim();
      const bookPrice = $(e).find('span.price span').last().text().trim().match(/\d+/).join('');

      response.push({
        source: '金石堂',
        active: true,
        name: bookName || '',
        cat: bookCat || '',
        authors: bookAuthors.length > 0
          ? bookAuthors.join()
          : '',
        publisher: bookPublisher || '',
        price: bookPrice ? parseInt(bookPrice, 10) : 0,
        currency: 'TWD',
        url: bookUrl ? baseUrl + bookUrl : '',
        image: bookImage || '',
      });
    });
  } catch (e) {
    console.log(e);
    response.push({
      source: '金石堂',
      active: false,
    });
  }
  return response;
}

// 城邦讀書花園 (cite.com.tw)
async function getDetailsFromCite(isbnNumber) {
  const response = [];
  try {
    const baseUrl = 'https://www.cite.com.tw';
    const searchUrl = '/search_result?isbn=';
    const { data } = await request.get(baseUrl + searchUrl + isbnNumber);

    const $ = cheerio.load(data);
    const result = $('div.book-container ul li.book-area-1');
    if (result.length === 0) throw new Error('No result found');

    result.each((i, e) => {
      const bookUrl = $(e).find('div.book-info-1 h2 a').attr('href');
      const bookImage = $(e).find('div.book-img a img').attr('src');
      const bookName = $(e).find('div.book-info-1 h2 a').text().trim()
        .replace('�m', '').replace('�n', '');
      const bookCat = '';
      const bookAuthors = [];
      $(e).find('a#writer').each((j, elem) => {
        bookAuthors.push($(elem).text().trim());
      });
      const bookPublisher = $(e).find('div.book-info-1 div span.underline').first().text().trim();
      const bookPrice = $(e).find('div.book-info-2 ul li span.font-color01').last().text().trim();

      response.push({
        source: '城邦讀書花園',
        active: true,
        name: bookName || '',
        cat: bookCat || '',
        authors: bookAuthors.length > 0 ? bookAuthors.join() : '',
        publisher: bookPublisher || '',
        price: bookPrice ? parseInt(bookPrice, 10) : 0,
        currency: 'TWD',
        url: bookUrl ? bookUrl.replace('http://', 'https://') : '',
        image: bookImage || '',
      });
    });
  } catch (e) {
    console.log(e);
    response.push({
      source: '城邦讀書花園',
      active: false,
    });
  }
  return response;
}

// 誠品網路書店 (eslite.com)
async function getDetailsFromEslite(isbnNumber) {
  const response = [];
  try {
    const baseUrl = 'http://www.eslite.com';
    const searchUrl = '/Search_BW.aspx?query=';
    const { data } = await request.get(baseUrl + searchUrl + isbnNumber);

    const $ = cheerio.load(data);
    const result = $('div.box_list table');
    if (result.length === 0) throw new Error('No result found');

    result.each((i, e) => {
      const bookUrl = $(e).find('td.cover a').attr('href');
      const bookImage = $(e).find('img.cover_img').attr('src');
      const bookName = $(e).find('h3 span').text().trim();
      const bookCat = $(e).find(`span#ctl00_ContentPlaceHolder1_rptProducts_ctl0${i}_LblCate a`)
        .first().text().trim();
      const bookAuthors = [];
      $(e).find(`span#ctl00_ContentPlaceHolder1_rptProducts_ctl0${i}_LblCharacterName a`)
        .each((j, elem) => {
          bookAuthors.push($(elem).text().trim());
        });
      const bookPublisher = $(e)
        .find(`span#ctl00_ContentPlaceHolder1_rptProducts_ctl0${i}_LblManufacturerName a`)
        .text().trim();
      const bookPrice = $(e).find('span.price_sale font').last().text().trim();

      response.push({
        source: '誠品網路書店',
        active: true,
        name: bookName || '',
        cat: bookCat || '',
        authors: bookAuthors.length > 0 ? bookAuthors.join() : '',
        publisher: bookPublisher || '',
        price: bookPrice ? parseInt(bookPrice, 10) : 0,
        currency: 'TWD',
        url: bookUrl || '',
        image: bookImage || '',
      });
    });
  } catch (e) {
    console.log(e);
    response.push({
      source: '誠品網路書店',
      active: false,
    });
  }
  return response;
}

exports.book = functions.https.onRequest(app);
