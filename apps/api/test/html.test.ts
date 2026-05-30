import assert from 'node:assert/strict';
import test from 'node:test';

import {
  decodeHtmlEntities,
  extractAll,
  matchFirst,
  normalizeBookTitle,
  normalizeWhitespace,
  stripTags,
  toAbsoluteUrl,
} from '../src/lib/html';

test('decodeHtmlEntities decodes named, decimal, and hex entities', () => {
  assert.equal(
    decodeHtmlEntities('a &amp; b &lt;c&gt; &quot;d&quot; &#39;e&#39;'),
    'a & b <c> "d" \'e\''
  );
  assert.equal(decodeHtmlEntities('non&nbsp;breaking'), 'non breaking');
  assert.equal(decodeHtmlEntities('&#65;&#x42;&#x43;'), 'ABC');
  assert.equal(decodeHtmlEntities('&unknown;'), '&unknown;');
});

test('stripTags removes markup, decodes entities, and collapses whitespace', () => {
  assert.equal(stripTags('<p>Hello   <b>World</b></p>'), 'Hello World');
  assert.equal(stripTags('<span>價格&nbsp;&amp;&nbsp;折扣</span>'), '價格 & 折扣');
  assert.equal(stripTags('   '), '');
});

test('normalizeWhitespace collapses runs of whitespace and trims', () => {
  assert.equal(normalizeWhitespace('  a\n\t b   c '), 'a b c');
});

test('normalizeBookTitle strips leading and trailing ebook markers', () => {
  assert.equal(normalizeBookTitle('【電子書】原子習慣'), '原子習慣');
  assert.equal(normalizeBookTitle('[電子書] 原子習慣'), '原子習慣');
  assert.equal(normalizeBookTitle('原子習慣（電子書）'), '原子習慣');
  assert.equal(normalizeBookTitle('原子習慣 (電子書)'), '原子習慣');
  assert.equal(normalizeBookTitle('  原子習慣  '), '原子習慣');
});

test('toAbsoluteUrl upgrades protocol-relative urls and leaves others untouched', () => {
  assert.equal(toAbsoluteUrl('//example.com/cover.jpg'), 'https://example.com/cover.jpg');
  assert.equal(toAbsoluteUrl('https://example.com/cover.jpg'), 'https://example.com/cover.jpg');
  assert.equal(toAbsoluteUrl('/relative/path'), '/relative/path');
});

test('matchFirst returns the first capture group or undefined', () => {
  assert.equal(matchFirst(/id-(\d+)/, 'item id-42 here'), '42');
  assert.equal(matchFirst(/id-(\d+)/, 'no match'), undefined);
});

test('extractAll returns stripped, non-empty capture groups for every match', () => {
  const html = '<li><a>原子習慣</a></li><li><a>  </a></li><li><a>深度工作力</a></li>';
  assert.deepEqual(extractAll(/<li>([\s\S]*?)<\/li>/g, html), ['原子習慣', '深度工作力']);
});
